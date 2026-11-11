import { db, initDb } from "./index";
import { normalizeCanonicalUrl } from "../gatherer";

/**
 * Removes duplicate content rows and normalizes canonical URLs in SQLite.
 */
export function deduplicateExistingContent(): {
  migratedCount: number;
  deletedDuplicatesCount: number;
} {
  // Ensure tables and columns exist
  initDb();

  console.log("[Deduplicate] Normalizing canonical URLs for all existing content...");
  const rows = db.prepare("SELECT id, source_id, source_url, canonical_url, status, is_read, published_at FROM content").all() as Array<{
    id: number;
    source_id: number;
    source_url: string;
    canonical_url: string | null;
    status: string;
    is_read: number;
    published_at: string;
  }>;

  // 1. Populate canonical_url for all rows
  const updateCanonicalStmt = db.prepare(
    "UPDATE content SET canonical_url = ? WHERE id = ?"
  );

  for (const row of rows) {
    if (row.source_url) {
      const canonical = normalizeCanonicalUrl(row.source_url);
      updateCanonicalStmt.run(canonical, row.id);
    }
  }

  // 2. Find duplicates by (source_id, canonical_url) where canonical_url IS NOT NULL
  const dupGroups = db.prepare(`
    SELECT source_id, canonical_url, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM content
    WHERE canonical_url IS NOT NULL AND canonical_url != ''
    GROUP BY source_id, canonical_url
    HAVING count > 1
  `).all() as Array<{
    source_id: number;
    canonical_url: string;
    count: number;
    ids: string;
  }>;

  let deletedDuplicatesCount = 0;

  for (const group of dupGroups) {
    const ids = group.ids.split(",").map(Number);
    // Find the best row to keep: prefer status = 'completed', then latest published_at/id
    const candidates = db.prepare(`
      SELECT id, status, is_read, analysis_json, published_at, created_at
      FROM content
      WHERE id IN (${ids.join(",")})
      ORDER BY (CASE WHEN status = 'completed' THEN 1 ELSE 0 END) DESC, id DESC
    `).all() as Array<{
      id: number;
      status: string;
      is_read: number;
      analysis_json: string | null;
      published_at: string;
    }>;

    const keep = candidates[0];
    const remove = candidates.slice(1);

    // If any removed duplicate was marked read, preserve is_read = 1 on keep
    const anyRead = candidates.some((c) => c.is_read === 1);
    if (anyRead && keep.is_read !== 1) {
      db.prepare("UPDATE content SET is_read = 1 WHERE id = ?").run(keep.id);
    }

    // Delete redundant duplicate rows
    const deleteContentStmt = db.prepare("DELETE FROM content WHERE id = ?");
    const deleteEmbeddingStmt = db.prepare("DELETE FROM content_embeddings WHERE content_id = ?");

    for (const r of remove) {
      deleteContentStmt.run(r.id);
      try {
        deleteEmbeddingStmt.run(BigInt(r.id));
      } catch {}
      deletedDuplicatesCount++;
      console.log(`[Deduplicate] Removed duplicate article #${r.id} in favor of #${keep.id} (${group.canonical_url})`);
    }
  }

  // 3. Also check for identical title duplicates across the same source (for sources where URLs had differing query strings or redirects)
  const remainingRows = db.prepare(`
    SELECT id, source_id, substr(raw_text, 1, 80) as headline_snippet
    FROM content
    WHERE status = 'completed'
  `).all() as Array<{ id: number; source_id: number; headline_snippet: string }>;

  const seenSnippets = new Map<string, number>();
  for (const r of remainingRows) {
    const key = `${r.source_id}:${r.headline_snippet.trim().toLowerCase()}`;
    if (seenSnippets.has(key)) {
      const originalId = seenSnippets.get(key)!;
      db.prepare("DELETE FROM content WHERE id = ?").run(r.id);
      try {
        db.prepare("DELETE FROM content_embeddings WHERE content_id = ?").run(BigInt(r.id));
      } catch {}
      deletedDuplicatesCount++;
      console.log(`[Deduplicate] Removed identical text duplicate #${r.id} (matched #${originalId})`);
    } else {
      seenSnippets.set(key, r.id);
    }
  }

  console.log(`[Deduplicate] Completed. Deleted ${deletedDuplicatesCount} duplicate articles.`);
  return { migratedCount: rows.length, deletedDuplicatesCount };
}

// Run if called directly
if (process.argv[1]?.endsWith("deduplicate.ts")) {
  deduplicateExistingContent();
}

