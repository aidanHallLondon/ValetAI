import { Router, Request, Response } from "express";
import { db, parseContentRecord } from "../../db";

export const libraryRouter = Router();

/**
 * POST /api/library/triage-restore
 * Restores a triage-discarded article back to pending for re-evaluation.
 */
libraryRouter.post("/triage-restore", (req: Request, res: Response) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ error: "Missing article id" });
      return;
    }
    db.prepare(`
      UPDATE content
      SET status = 'pending',
          scout_status = 'passed',
          scout_reason = 'Manually restored by user',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(id);
    res.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/library/reprocess-reader
 * Resets outdated or failed articles to 'pending' to trigger re-analysis with current prompt.
 */
libraryRouter.post("/reprocess-reader", (req: Request, res: Response) => {
  try {
    const { onlyOutdated = true, forceAll = false } = req.body || {};
    const { getActivePromptVersions } = require("../../agent/prompt_versioning");
    const activeVersion = getActivePromptVersions().reader.version;

    let result;
    if (forceAll) {
      result = db.prepare(`
        UPDATE content
        SET status = 'pending',
            reader_status = 'pending',
            updated_at = datetime('now')
      `).run();
    } else if (onlyOutdated) {
      result = db.prepare(`
        UPDATE content
        SET status = 'pending',
            reader_status = 'pending',
            updated_at = datetime('now')
        WHERE reader_version != ? OR reader_version IS NULL OR status = 'failed'
      `).run(activeVersion);
    } else {
      result = db.prepare(`
        UPDATE content
        SET status = 'pending',
            reader_status = 'pending',
            updated_at = datetime('now')
      `).run();
    }

    // Trigger agent polling loop in background
    setTimeout(async () => {
      try {
        const { pollPendingContentOnce } = require("../../agent");
        await pollPendingContentOnce();
      } catch {}
    }, 100);

    res.json({ success: true, updatedCount: result.changes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/library/reprocess-organiser
 * Re-clusters stories with the current Story Organiser version.
 */
libraryRouter.post("/reprocess-organiser", (req: Request, res: Response) => {
  try {
    const { forceAll = false } = req.body || {};
    if (forceAll) {
      db.prepare(`UPDATE content SET story_id = NULL, organiser_version = NULL, organiser_status = 'pending'`).run();
      db.prepare(`DELETE FROM stories`).run();
    }
    const { clusterAllContent } = require("../../agent/story_clusterer");
    const stats = clusterAllContent();
    res.json({ success: true, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/library/reprocess-curator
 * Re-curates taxonomy shelves with the current Taxonomy Curator version.
 */
libraryRouter.post("/reprocess-curator", (_req: Request, res: Response) => {
  try {
    const { curateTaxonomy } = require("../../agent/taxonomy_curator");
    const result = curateTaxonomy();
    res.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/library/rerun-stage
 * Re-runs a specific agent stage ('reader' | 'organiser' | 'curator') on a single content item.
 */
libraryRouter.post("/rerun-stage", async (req: Request, res: Response) => {
  try {
    const { contentId, stage } = req.body || {};
    const id = Number(contentId);
    if (!id || !stage) {
      res.status(400).json({ error: "Missing contentId or stage" });
      return;
    }

    const { getActivePromptVersions } = require("../../agent/prompt_versioning");
    const activeVersions = getActivePromptVersions();

    if (stage === "reader") {
      db.prepare(`
        UPDATE content
        SET status = 'processing',
            reader_status = 'processing',
            updated_at = datetime('now')
        WHERE id = ?
      `).run(id);

      const itemRow = db.prepare("SELECT * FROM content WHERE id = ?").get(id);
      if (!itemRow) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      const { processSingleContentItem } = require("../../agent");
      const itemRecord = parseContentRecord(itemRow);

      try {
        await processSingleContentItem(itemRecord);
        res.json({ success: true, stage: "reader", id });
        return;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        db.prepare(`
          UPDATE content
          SET status = 'failed',
              reader_status = 'failed',
              error_message = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(errorMsg, id);
        res.status(500).json({ error: errorMsg });
        return;
      }
    }

    if (stage === "organiser") {
      db.prepare(`
        UPDATE content
        SET story_id = NULL,
            organiser_status = 'processing',
            updated_at = datetime('now')
        WHERE id = ?
      `).run(id);

      const tOrganiserStart = Date.now();
      const { clusterArticleIntoStory } = require("../../agent/story_clusterer");
      const storyId = clusterArticleIntoStory(id);
      const organiserTimeMs = Date.now() - tOrganiserStart;

      const existingTimings = (() => {
        try {
          const row = db.prepare("SELECT stage_timings FROM content WHERE id = ?").get(id) as any;
          return row?.stage_timings ? JSON.parse(row.stage_timings) : {};
        } catch { return {}; }
      })();
      existingTimings.organiser = organiserTimeMs;

      db.prepare(`
        UPDATE content
        SET organiser_status = 'completed',
            organiser_version = ?,
            stage_timings = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(activeVersions.organiser.version, JSON.stringify(existingTimings), id);

      console.log(`[API] Organiser completed content #${id} in ${(organiserTimeMs / 1000).toFixed(2)}s`);
      res.json({ success: true, stage: "organiser", id, storyId, timeMs: organiserTimeMs });
      return;
    }

    if (stage === "curator") {
      db.prepare(`
        UPDATE content
        SET curator_status = 'processing',
            updated_at = datetime('now')
        WHERE id = ?
      `).run(id);

      const tCuratorStart = Date.now();
      const { curateTaxonomy } = require("../../agent/taxonomy_curator");
      curateTaxonomy();
      const curatorTimeMs = Date.now() - tCuratorStart;

      const existingTimings = (() => {
        try {
          const row = db.prepare("SELECT stage_timings FROM content WHERE id = ?").get(id) as any;
          return row?.stage_timings ? JSON.parse(row.stage_timings) : {};
        } catch { return {}; }
      })();
      existingTimings.curator = curatorTimeMs;

      db.prepare(`
        UPDATE content
        SET curator_status = 'completed',
            curator_version = ?,
            stage_timings = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(activeVersions.curator.version, JSON.stringify(existingTimings), id);

      console.log(`[API] Curator completed pass for content #${id} in ${(curatorTimeMs / 1000).toFixed(2)}s`);
      res.json({ success: true, stage: "curator", id, timeMs: curatorTimeMs });
      return;
    }

    res.status(400).json({ error: "Invalid stage specified" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Failed to rerun stage: ${message}`);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/library/stop-item
 * Gracefully stops processing or cancels a queued content item.
 */
libraryRouter.post("/stop-item", (req: Request, res: Response) => {
  try {
    const { contentId } = req.body || {};
    const id = Number(contentId);
    if (!id || id <= 0) {
      res.status(400).json({ error: "Invalid content ID" });
      return;
    }

    const existing = db.prepare("SELECT * FROM content WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: "Content item not found" });
      return;
    }

    const hasAnalysis = Boolean(existing.analysis_json);
    const targetStatus = hasAnalysis ? "completed" : "failed";
    const targetReaderStatus = hasAnalysis ? "completed" : "failed";

    db.prepare(`
      UPDATE content
      SET status = @targetStatus,
          reader_status = CASE WHEN reader_status IN ('pending', 'processing') THEN @targetReaderStatus ELSE reader_status END,
          organiser_status = CASE WHEN organiser_status IN ('pending', 'processing') THEN @targetStatus ELSE organiser_status END,
          curator_status = CASE WHEN curator_status IN ('pending', 'processing') THEN @targetStatus ELSE curator_status END,
          error_message = @errMsg,
          updated_at = datetime('now')
      WHERE id = @id
    `).run({
      id,
      targetStatus,
      targetReaderStatus,
      errMsg: hasAnalysis ? null : "Processing stopped by user",
    });

    console.log(`[API] Gracefully stopped content #${id} (reverted to ${targetStatus})`);
    res.json({ success: true, id, status: targetStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/library/stop-all
 * Gracefully clears all queued and pending processing items.
 */
libraryRouter.post("/stop-all", (_req: Request, res: Response) => {
  try {
    const result = db.prepare(`
      UPDATE content
      SET status = CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'failed' END,
          reader_status = CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'failed' END,
          organiser_status = CASE WHEN organiser_status IN ('pending', 'processing') THEN (CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'failed' END) ELSE organiser_status END,
          curator_status = CASE WHEN curator_status IN ('pending', 'processing') THEN (CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'failed' END) ELSE curator_status END,
          error_message = CASE WHEN analysis_json IS NOT NULL THEN NULL ELSE 'Processing stopped by user' END,
          updated_at = datetime('now')
      WHERE status IN ('pending', 'processing') OR reader_status IN ('pending', 'processing')
    `).run();

    console.log(`[API] Gracefully stopped all queued items (${result.changes} items affected)`);
    res.json({ success: true, stoppedCount: result.changes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/library/process-all
 * Master command to process everything and bring the entire library up to date.
 */
libraryRouter.post("/process-all", async (req: Request, res: Response) => {
  try {
    const { forceAll = false } = req.body || {};
    const { getActivePromptVersions } = require("../../agent/prompt_versioning");
    const versions = getActivePromptVersions();

    let readerReset;
    if (forceAll) {
      readerReset = db.prepare(`
        UPDATE content
        SET status = 'pending',
            reader_status = 'pending',
            updated_at = datetime('now')
      `).run();
      db.prepare(`UPDATE content SET story_id = NULL, organiser_version = NULL, organiser_status = 'pending'`).run();
      db.prepare(`DELETE FROM stories`).run();
    } else {
      readerReset = db.prepare(`
        UPDATE content
        SET status = 'pending',
            reader_status = 'pending',
            updated_at = datetime('now')
        WHERE reader_version != ? OR reader_version IS NULL OR status = 'failed'
      `).run(versions.reader.version);
    }

    const { clusterAllContent } = require("../../agent/story_clusterer");
    const clusterStats = clusterAllContent();

    const { curateTaxonomy } = require("../../agent/taxonomy_curator");
    const curatorStats = curateTaxonomy();

    setTimeout(async () => {
      try {
        const { pollPendingContentOnce } = require("../../agent");
        await pollPendingContentOnce();
      } catch {}
    }, 100);

    res.json({
      success: true,
      readerOutdatedQueued: readerReset.changes,
      clusterStats,
      curatorStats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

