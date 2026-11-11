/**
 * Versioned database migration runner.
 * Manages incremental schema changes and prevents duplicate executions.
 */

import type Database from "better-sqlite3";

export interface Migration {
  id: string;
  name: string;
  up: (db: Database.Database) => void;
}

/**
 * Checks if a specific column exists in a database table.
 */
export function hasColumn(
  db: Database.Database,
  tableName: string,
  columnName: string
): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;
  return columns.some((col) => col.name === columnName);
}

/**
 * All defined schema migrations in chronological execution order.
 */
export const MIGRATIONS: Migration[] = [
  {
    id: "001_sources_metadata",
    name: "Add metadata fields to sources table",
    up: (db) => {
      if (!hasColumn(db, "sources", "description")) {
        db.exec("ALTER TABLE sources ADD COLUMN description TEXT;");
      }
      if (!hasColumn(db, "sources", "site_url")) {
        db.exec("ALTER TABLE sources ADD COLUMN site_url TEXT;");
      }
      if (!hasColumn(db, "sources", "last_fetch_count")) {
        db.exec("ALTER TABLE sources ADD COLUMN last_fetch_count INTEGER NOT NULL DEFAULT 0;");
      }
    },
  },
  {
    id: "002_content_deduplication_and_stories",
    name: "Add deduplication, canonical URLs, and story associations to content table",
    up: (db) => {
      if (!hasColumn(db, "content", "content_hash")) {
        db.exec("ALTER TABLE content ADD COLUMN content_hash TEXT;");
        db.exec("CREATE INDEX IF NOT EXISTS idx_content_hash ON content(content_hash);");
      }
      if (!hasColumn(db, "content", "image_url")) {
        db.exec("ALTER TABLE content ADD COLUMN image_url TEXT;");
      }
      if (!hasColumn(db, "content", "published_at")) {
        db.exec("ALTER TABLE content ADD COLUMN published_at TEXT;");
      }
      if (!hasColumn(db, "content", "is_read")) {
        db.exec("ALTER TABLE content ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0;");
      }
      if (!hasColumn(db, "content", "canonical_url")) {
        db.exec("ALTER TABLE content ADD COLUMN canonical_url TEXT;");
        db.exec("CREATE INDEX IF NOT EXISTS idx_content_canonical_url ON content(canonical_url);");
      }
      if (!hasColumn(db, "content", "story_id")) {
        db.exec("ALTER TABLE content ADD COLUMN story_id INTEGER REFERENCES stories(id) ON DELETE SET NULL;");
        db.exec("CREATE INDEX IF NOT EXISTS idx_content_story_id ON content(story_id);");
      }
    },
  },
  {
    id: "003_agent_stage_pipeline",
    name: "Add agent stage versions, statuses, and performance timings to content table",
    up: (db) => {
      const columnsToAdd: Array<{ name: string; definition: string }> = [
        { name: "scout_version", definition: "TEXT" },
        { name: "scout_status", definition: "TEXT DEFAULT 'pending'" },
        { name: "scout_reason", definition: "TEXT" },
        { name: "scout_score", definition: "INTEGER" },
        { name: "reader_version", definition: "TEXT" },
        { name: "reader_status", definition: "TEXT DEFAULT 'pending'" },
        { name: "organiser_version", definition: "TEXT" },
        { name: "organiser_status", definition: "TEXT DEFAULT 'pending'" },
        { name: "curator_version", definition: "TEXT" },
        { name: "curator_status", definition: "TEXT DEFAULT 'pending'" },
        { name: "curated_shelf", definition: "TEXT" },
        { name: "last_prompt", definition: "TEXT" },
        { name: "last_response", definition: "TEXT" },
        { name: "processing_time_ms", definition: "INTEGER" },
        { name: "stage_timings", definition: "TEXT" },
      ];

      for (const col of columnsToAdd) {
        if (!hasColumn(db, "content", col.name)) {
          db.exec(`ALTER TABLE content ADD COLUMN ${col.name} ${col.definition};`);
        }
      }
    },
  },
  {
    id: "004_backfill_agent_versions",
    name: "Backfill completed legacy rows to version v1",
    up: (db) => {
      db.exec(`
        UPDATE content
        SET reader_version = 'v1',
            reader_status = CASE WHEN status = 'completed' THEN 'completed' WHEN status = 'failed' THEN 'failed' ELSE 'pending' END
        WHERE reader_version IS NULL AND status IN ('completed', 'failed');

        UPDATE content
        SET organiser_version = 'v1',
            organiser_status = 'completed'
        WHERE story_id IS NOT NULL AND organiser_version IS NULL;

        UPDATE content
        SET curator_version = 'v1',
            curator_status = 'completed'
        WHERE status = 'completed' AND curator_version IS NULL;
      `);
    },
  },
];

/**
 * Initializes the migrations ledger and applies any outstanding migrations.
 */
export function applyMigrations(db: Database.Database): number {
  // Ensure the migrations ledger table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const appliedRows = db
    .prepare("SELECT id FROM _schema_migrations")
    .all() as Array<{ id: string }>;
  const appliedIds = new Set(appliedRows.map((r) => r.id));

  let newlyAppliedCount = 0;

  for (const migration of MIGRATIONS) {
    if (!appliedIds.has(migration.id)) {
      console.log(`[Migrations] Applying migration ${migration.id}: ${migration.name}`);
      const runTx = db.transaction(() => {
        migration.up(db);
        db.prepare(
          "INSERT INTO _schema_migrations (id, name) VALUES (?, ?)"
        ).run(migration.id, migration.name);
      });
      runTx();
      newlyAppliedCount++;
    }
  }

  return newlyAppliedCount;
}

