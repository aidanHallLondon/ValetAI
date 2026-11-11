import { Router, Request, Response } from "express";
import { CONFIG } from "../../config";
import {
  db,
  getSetting,
  hydrateContentRecord,
  type HydratedContentRecord,
} from "../../db";

export const contentRouter = Router();

/**
 * GET /api/content
 * Read-only endpoint returning processed items (and pipeline status counts) for the dashboard.
 */
contentRouter.get("/", (req: Request, res: Response) => {
  try {
    const statusFilter =
      typeof req.query.status === "string" ? req.query.status : null;
    const view = typeof req.query.view === "string" ? req.query.view : null;
    const isLibraryView = view === "library" || req.query.all === "true";

    // 1. Library View: Always return ALL raw articles across all statuses
    if (isLibraryView) {
      // Auto-recover any stale items stuck in processing > 3 minutes (e.g. from prior crashes/restarts)
      try {
        db.prepare(`
          UPDATE content
          SET status = CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'pending' END,
              reader_status = CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'pending' END,
              organiser_status = CASE WHEN organiser_status = 'processing' THEN (CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'pending' END) ELSE organiser_status END,
              curator_status = CASE WHEN curator_status = 'processing' THEN (CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'pending' END) ELSE curator_status END,
              updated_at = datetime('now')
          WHERE (status = 'processing' OR reader_status = 'processing' OR organiser_status = 'processing' OR curator_status = 'processing')
            AND updated_at < datetime('now', '-3 minutes')
        `).run();
      } catch {}

      const rawRows = db
        .prepare(
          `SELECT c.*, s.name AS source_name, s.type AS source_type
           FROM content c
           LEFT JOIN sources s ON s.id = c.source_id
           ORDER BY c.id DESC`
        )
        .all() as Record<string, unknown>[];
      const items = rawRows.map(hydrateContentRecord);
      res.json({ items, total: items.length });
      return;
    }

    let items: HydratedContentRecord[] = [];

    if (statusFilter && statusFilter !== "completed") {
      // Direct pipeline view for Command Center (pending, processing, failed)
      const rawRows = db
        .prepare(
          `SELECT c.*, s.name AS source_name, s.type AS source_type, s.url AS source_feed_url
           FROM content c
           LEFT JOIN sources s ON s.id = c.source_id
           WHERE c.status = @status
           ORDER BY c.id DESC
           LIMIT @limit`
        )
        .all({
          status: statusFilter,
          limit: CONFIG.UI.RECENT_ITEMS_LIMIT,
        }) as Record<string, unknown>[];
      items = rawRows.map(hydrateContentRecord);
    } else {
      // Story-aggregated Feed: Only parent stories appear!
      // Child source articles never appear separately; they are nested inside their parent story.
      const storyRows = db
        .prepare(
          `SELECT s.id AS story_id,
                  s.title AS story_title,
                  s.summary AS story_summary,
                  s.category AS story_category,
                  s.image_url AS story_image_url,
                  s.is_ai_synthesized,
                  s.is_followed,
                  s.article_count,
                  s.last_updated_at AS story_last_updated_at,
                  c.*,
                  src.name AS source_name,
                  src.type AS source_type,
                  src.url AS source_feed_url
           FROM stories s
           JOIN content c ON c.id = s.representative_content_id
           LEFT JOIN sources src ON src.id = c.source_id
           ORDER BY s.is_followed DESC, s.last_updated_at DESC
           LIMIT @limit`
        )
        .all({
          limit: CONFIG.UI.RECENT_ITEMS_LIMIT,
        }) as Record<string, unknown>[];

      const childArticlesStmt = db.prepare(`
        SELECT c.id, c.source_id, src.name AS source_name, c.source_url, src.url AS source_feed_url,
               c.raw_text, c.analysis_json, c.published_at, c.image_url
        FROM content c
        LEFT JOIN sources src ON src.id = c.source_id
        WHERE c.story_id = ? AND c.id != ?
        ORDER BY c.published_at DESC, c.id DESC
      `);

      items = storyRows.map((row) => {
        const base = hydrateContentRecord(row);
        const storyId = row.story_id as number;
        const repId = base.id;

        let childArticles: Array<{
          id: number;
          source_id?: number | null;
          source_name?: string | null;
          source_url?: string | null;
          title: string;
          summary?: string;
          published_at?: string | null;
          image_url?: string | null;
        }> = [];
        const sourceNamesSet = new Set<string>();
        if (base.source_name) sourceNamesSet.add(base.source_name);

        if ((row.article_count as number) > 1) {
          const childrenRaw = childArticlesStmt.all(storyId, repId) as Array<{
            id: number;
            source_id: number | null;
            source_name: string | null;
            source_url: string | null;
            raw_text: string;
            analysis_json: string | null;
            published_at: string | null;
            image_url: string | null;
          }>;

          childArticles = childrenRaw.map((ch) => {
            if (ch.source_name) sourceNamesSet.add(ch.source_name);
            let childTitle = "";
            let childSummary = "";
            if (ch.analysis_json) {
              try {
                const parsed = JSON.parse(ch.analysis_json);
                childTitle = parsed.title || "";
                childSummary = parsed.summary || "";
              } catch {}
            }
            if (!childTitle) {
              childTitle = ch.raw_text.slice(0, 80).split("\n")[0] || "Update";
            }
            return {
              id: ch.id,
              source_id: ch.source_id,
              source_name: ch.source_name,
              source_url: ch.source_url,
              title: childTitle,
              summary: childSummary || ch.raw_text.slice(0, 150),
              published_at: ch.published_at,
              image_url: ch.image_url,
            };
          });
        }

        return {
          ...base,
          story_id: storyId,
          is_followed: Boolean(row.is_followed),
          is_ai_synthesized: Boolean(row.is_ai_synthesized),
          article_count: (row.article_count as number) || 1,
          sources: Array.from(sourceNamesSet),
          child_articles: childArticles,
          published_at: (row.story_last_updated_at as string) || base.published_at,
        };
      });

      // Also include standalone articles not clustered into a multi-article story
      const standaloneRows = db
        .prepare(
          `SELECT c.*,
                  s.name AS source_name,
                  s.type AS source_type
           FROM content c
           LEFT JOIN sources s ON s.id = c.source_id
           WHERE c.story_id IS NULL AND (c.status = 'completed' OR c.analysis_json IS NOT NULL)
           ORDER BY c.published_at DESC, c.id DESC
           LIMIT @limit`
        )
        .all({ limit: CONFIG.UI.RECENT_ITEMS_LIMIT }) as Record<string, unknown>[];
      const standaloneItems = standaloneRows.map(hydrateContentRecord);
      items = [...items, ...standaloneItems];

      // Also include unprocessed / raw articles (pending or processing) so the UI can make them available
      const rawPendingRows = db
        .prepare(
          `SELECT c.*,
                  s.name AS source_name,
                  s.type AS source_type
           FROM content c
           LEFT JOIN sources s ON s.id = c.source_id
           WHERE c.status IN ('pending', 'processing')
           ORDER BY c.published_at DESC, c.id DESC
           LIMIT 200`
        )
        .all() as Record<string, unknown>[];
      const pendingItems = rawPendingRows.map(hydrateContentRecord);
      items = [...items, ...pendingItems];
    }

    const countsRaw = db
      .prepare(
        `SELECT status, COUNT(*) as count
         FROM content
         GROUP BY status`
      )
      .all() as Array<{ status: string; count: number }>;

    const counts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const row of countsRaw) {
      if (row.status in counts) {
        counts[row.status as keyof typeof counts] = Number(row.count);
      }
    }

    res.json({ items, counts });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * PUT /api/content/:id
 * Updates raw text or analysis of a specific content item.
 */
contentRouter.put("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid content ID" });
    return;
  }

  const { raw_text, status, analysis_json } = req.body;

  try {
    const existing = db.prepare("SELECT * FROM content WHERE id = ?").get(id);
    if (!existing) {
      res.status(404).json({ error: "Content item not found" });
      return;
    }

    const updated = db
      .prepare(
        `UPDATE content
         SET raw_text = COALESCE(@raw_text, raw_text),
             status = COALESCE(@status, status),
             analysis_json = COALESCE(@analysis_json, analysis_json),
             updated_at = datetime('now')
         WHERE id = @id
         RETURNING *`
      )
      .get({
        id,
        raw_text: typeof raw_text === "string" ? raw_text : null,
        status: typeof status === "string" ? status : null,
        analysis_json: typeof analysis_json === "string" ? analysis_json : null,
      });

    res.json({ item: hydrateContentRecord(updated as Record<string, unknown>) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * PATCH /api/content/:id/read
 * Marks a content item as read or unread.
 */
contentRouter.patch("/:id/read", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid content ID" });
    return;
  }

  const isReadVal = req.body?.is_read === undefined ? 1 : req.body.is_read ? 1 : 0;
  try {
    const updated = db
      .prepare(
        `UPDATE content
         SET is_read = @isRead,
             updated_at = datetime('now')
         WHERE id = @id
         RETURNING *`
      )
      .get({ id, isRead: isReadVal });

    if (!updated) {
      res.status(404).json({ error: "Content item not found" });
      return;
    }

    res.json({ item: hydrateContentRecord(updated as Record<string, unknown>) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/content/:id
 * Returns a single hydrated content record with full live bot running state and debug info.
 */
contentRouter.get("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid content ID" });
    return;
  }

  try {
    const row = db
      .prepare(
        `SELECT c.*, s.name AS source_name, s.type AS source_type, s.url AS source_feed_url
         FROM content c
         LEFT JOIN sources s ON s.id = c.source_id
         WHERE c.id = ?`
      )
      .get(id) as Record<string, unknown> | undefined;

    if (!row) {
      res.status(404).json({ error: "Content item not found" });
      return;
    }

    const item = hydrateContentRecord(row);

    // Check if a bot is actively processing this item
    const isReaderRunning = item.status === "processing" || item.reader_status === "processing";
    const isOrganiserRunning = item.organiser_status === "processing";
    const isCuratorRunning = item.curator_status === "processing";

    let activeBotRequest: {
      bot: "reader" | "organiser" | "curator";
      botName: string;
      startedAt: string;
      model?: string;
      promptPreview?: string;
      stage: string;
    } | null = null;

    if (isReaderRunning) {
      const modelSettings = getSetting<any>("modelSettings", {
        llmModel: CONFIG.LM_STUDIO.MODELS.LLM,
        systemPrompt: CONFIG.LM_STUDIO.DEFAULT_SYSTEM_PROMPT,
      });
      activeBotRequest = {
        bot: "reader",
        botName: "Reader",
        startedAt: item.updated_at || new Date().toISOString(),
        model: modelSettings.llmModel,
        promptPreview: (row.last_prompt as string) || (modelSettings.systemPrompt || "Analyzing content..."),
        stage: "Reading, analyzing & synthesizing intelligence",
      };
    } else if (isOrganiserRunning) {
      activeBotRequest = {
        bot: "organiser",
        botName: "Organiser",
        startedAt: item.updated_at || new Date().toISOString(),
        stage: "Story clustering & thread synthesis",
      };
    } else if (isCuratorRunning) {
      activeBotRequest = {
        bot: "curator",
        botName: "Curator",
        startedAt: item.updated_at || new Date().toISOString(),
        stage: "Taxonomy shelf organization & entity consolidation",
      };
    }

    res.json({
      item,
      activeBotRequest,
      last_prompt: row.last_prompt || null,
      last_response: row.last_response || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /api/content/:id
 * Command Center route: Deletes a content item and its corresponding embedding.
 */
contentRouter.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid content ID" });
    return;
  }

  try {
    const deleteTx = db.transaction(() => {
      try {
        db.prepare("DELETE FROM content_embeddings WHERE content_id = ?").run(BigInt(id));
      } catch {}
      return db.prepare("DELETE FROM content WHERE id = ?").run(id);
    });

    const info = deleteTx();
    if (info.changes === 0) {
      res.status(404).json({ error: "Content item not found" });
      return;
    }

    res.json({ deleted: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

