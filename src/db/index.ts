import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import path from "node:path";
import fs from "node:fs";
import { CONFIG } from "../config";
import { applyMigrations } from "./migrations";
import {
  ContentRecordSchema,
  SourceRecordSchema,
  StoryRecordSchema,
  ProcessedAnalysisSchema,
  type ContentRecord,
  type SourceRecord,
  type StoryRecord,
  type HydratedContentRecord,
  type HydratedStoryRecord,
} from "./schema";

const DATA_DIR = path.resolve(process.cwd(), CONFIG.DATABASE.DATA_DIR);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const DB_PATH =
  process.env.VALET_DB_PATH || path.join(DATA_DIR, CONFIG.DATABASE.FILE_NAME);

export const EMBEDDING_DIMENSIONS = CONFIG.DATABASE.EMBEDDING_DIMENSIONS;

/**
 * Opens the SQLite database in WAL mode and loads sqlite-vec.
 */
export function initDb(dbPath: string = DB_PATH): Database.Database {
  const db = new Database(dbPath);

  // Step 3: Concurrency pragmas for multi-process PM2 access
  db.pragma("journal_mode = WAL;");
  db.pragma(`busy_timeout = ${CONFIG.DATABASE.BUSY_TIMEOUT_MS};`);
  db.pragma("foreign_keys = ON;");

  // Step 3: Load the sqlite-vec extension
  sqliteVec.load(db);

  // Create `sources` table for Gatherer and UI Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'web',
      enabled INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      site_url TEXT,
      last_fetch_count INTEGER NOT NULL DEFAULT 0,
      last_fetched_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create `settings` key-value table for persistent runtime configuration (LLM, Embeddings, Context window)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create `content` table with `status` column defaulting to 'pending'
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER,
      source_url TEXT,
      raw_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      analysis_json TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
  `);

  // Create `stories` table for story clustering and thread following
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      category TEXT,
      image_url TEXT,
      representative_content_id INTEGER,
      is_ai_synthesized INTEGER NOT NULL DEFAULT 0,
      is_followed INTEGER NOT NULL DEFAULT 0,
      article_count INTEGER NOT NULL DEFAULT 1,
      first_published_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (representative_content_id) REFERENCES content(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stories_last_updated ON stories(last_updated_at);
    CREATE INDEX IF NOT EXISTS idx_stories_is_followed ON stories(is_followed);
  `);

  // Agent prompt versions tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL,
      prompt_hash TEXT NOT NULL UNIQUE,
      version_tag TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_agent ON prompt_versions(agent_name);
  `);

  // Token usage tracking table for LLM and embedding telemetry
  db.exec(`
    CREATE TABLE IF NOT EXISTS token_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'llm',
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_token_usage_model ON token_usage(model);
    CREATE INDEX IF NOT EXISTS idx_token_usage_created ON token_usage(created_at);
  `);

  // Create sqlite-vec virtual table for 1024-dim float32 embeddings (text-embedding-bge-m3)
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS content_embeddings USING vec0(
      content_id INTEGER PRIMARY KEY,
      embedding float[${EMBEDDING_DIMENSIONS}]
    );
  `);

  // Execute structured versioned schema migrations
  applyMigrations(db);

  return db;
}

export const db = initDb();

/**
 * Returns database metrics and row counts for system telemetry.
 */
export function getDatabaseTelemetry(): {
  contentCount: number;
  sourcesCount: number;
  vectorsCount: number;
  countsByStatus: Record<string, number>;
  walMode: string;
} {
  const contentTotal = (
    db.prepare(`SELECT COUNT(*) as count FROM content`).get() as { count: number }
  ).count;

  const sourcesTotal = (
    db.prepare(`SELECT COUNT(*) as count FROM sources`).get() as { count: number }
  ).count;

  let vectorsTotal = 0;
  try {
    vectorsTotal = (
      db.prepare(`SELECT COUNT(*) as count FROM content_embeddings`).get() as { count: number }
    ).count;
  } catch {
    vectorsTotal = 0;
  }

  const countsRaw = db
    .prepare(`SELECT status, COUNT(*) as count FROM content GROUP BY status`)
    .all() as Array<{ status: string; count: number }>;

  const countsByStatus: Record<string, number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  for (const row of countsRaw) {
    if (row.status in countsByStatus) {
      countsByStatus[row.status] = Number(row.count);
    }
  }

  const walMode = String(db.pragma("journal_mode", { simple: true }));

  return {
    contentCount: contentTotal,
    sourcesCount: sourcesTotal,
    vectorsCount: vectorsTotal,
    countsByStatus,
    walMode,
  };
}

/**
 * Converts a number array into a Float32Array buffer for sqlite-vec.
 */
export function toFloat32VectorBuffer(vector: number[]): Buffer {
  const floatArray = new Float32Array(EMBEDDING_DIMENSIONS);
  const length = Math.min(vector.length, EMBEDDING_DIMENSIONS);
  for (let i = 0; i < length; i++) {
    floatArray[i] = vector[i];
  }
  return Buffer.from(
    floatArray.buffer,
    floatArray.byteOffset,
    floatArray.byteLength
  );
}

/**
 * Validates a raw SQLite row against the story schema.
 */
export function parseStoryRecord(row: unknown): StoryRecord {
  return StoryRecordSchema.parse(row);
}

/**
 * Validates a raw SQLite row against the content schema.
 */
export function parseContentRecord(row: unknown): ContentRecord {
  return ContentRecordSchema.parse(row);
}

/**
 * Parses JSON analysis and attaches source details to content rows.
 */
export function hydrateContentRecord(row: Record<string, unknown>): HydratedContentRecord {
  const base = ContentRecordSchema.parse(row);
  let analysis = null;
  if (base.analysis_json) {
    try {
      const parsedJson = JSON.parse(base.analysis_json);
      const result = ProcessedAnalysisSchema.safeParse(parsedJson);
      if (result.success) {
        analysis = result.data;
      }
    } catch {
      analysis = null;
    }
  }
  return {
    ...base,
    source_name: typeof row.source_name === "string" ? row.source_name : null,
    source_type: typeof row.source_type === "string" ? row.source_type : null,
    source_feed_url: typeof row.source_feed_url === "string" ? row.source_feed_url : null,
    analysis,
  };
}

/**
 * Validates a raw SQLite row against the source schema.
 */
export function parseSourceRecord(row: unknown): SourceRecord {
  return SourceRecordSchema.parse(row);
}

/**
 * Reads a configuration value from the SQLite settings table.
 */
export function getSetting<T>(key: string, defaultValue: T): T {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  if (!row) return defaultValue;
  try {
    const parsed = JSON.parse(row.value);
    if (typeof defaultValue === "object" && defaultValue !== null && !Array.isArray(defaultValue) && typeof parsed === "object" && parsed !== null) {
      return { ...defaultValue, ...parsed } as T;
    }
    return parsed as T;
  } catch {
    return (row.value as unknown) as T;
  }
}

/**
 * Writes a configuration key and value into SQLite settings.
 */
export function setSetting(key: string, value: unknown): void {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `).run(key, serialized);
}

/**
 * Stores token metrics and call counts for one model.
 */
export interface TokenUsageModelSummary {
  model: string;
  type: "llm" | "embedding";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  callCount: number;
}

/**
 * Stores total token counts and per-model consumption summaries.
 */
export interface TokenUsageSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  callCount: number;
  byModel: Record<string, TokenUsageModelSummary>;
}

/**
 * Defines pricing rates per million tokens for a model.
 */
export interface ModelRate {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

/**
 * Stores token pricing settings and currency symbols.
 */
export interface PricingSettings {
  llmInputPricePerMillion: number;
  llmOutputPricePerMillion: number;
  embeddingPricePerMillion: number;
  currencySymbol: string;
  perModelRates?: Record<string, ModelRate>;
}

export const DEFAULT_PRICING: PricingSettings = {
  llmInputPricePerMillion: 0,
  llmOutputPricePerMillion: 0,
  embeddingPricePerMillion: 0,
  currencySymbol: "$",
  perModelRates: {},
};

/**
 * Inserts token usage records into the token_usage table.
 */
export function recordTokenUsage(
  model: string,
  type: "llm" | "embedding",
  promptTokens: number,
  completionTokens: number = 0
): void {
  const total = (promptTokens || 0) + (completionTokens || 0);
  try {
    db.prepare(`
      INSERT INTO token_usage (model, type, prompt_tokens, completion_tokens, total_tokens)
      VALUES (?, ?, ?, ?, ?)
    `).run(model, type, promptTokens || 0, completionTokens || 0, total);
  } catch (err) {
    console.error("[Telemetry] Failed to record token usage:", err);
  }
}

/**
 * Aggregates all token usage rows across models and operations.
 */
export function getTokenUsageSummary(): TokenUsageSummary {
  try {
    const rows = db.prepare(`
      SELECT 
        model,
        type,
        SUM(prompt_tokens) as promptTokens,
        SUM(completion_tokens) as completionTokens,
        SUM(total_tokens) as totalTokens,
        COUNT(*) as callCount
      FROM token_usage
      GROUP BY model, type
    `).all() as Array<{
      model: string;
      type: "llm" | "embedding";
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      callCount: number;
    }>;

    let totalPrompt = 0;
    let totalCompletion = 0;
    let totalTokens = 0;
    let totalCalls = 0;
    const byModel: Record<string, TokenUsageModelSummary> = {};

    for (const r of rows) {
      const p = Number(r.promptTokens || 0);
      const c = Number(r.completionTokens || 0);
      const t = Number(r.totalTokens || 0);
      const count = Number(r.callCount || 0);

      totalPrompt += p;
      totalCompletion += c;
      totalTokens += t;
      totalCalls += count;

      byModel[r.model] = {
        model: r.model,
        type: r.type,
        promptTokens: p,
        completionTokens: c,
        totalTokens: t,
        callCount: count,
      };
    }

    return {
      totalPromptTokens: totalPrompt,
      totalCompletionTokens: totalCompletion,
      totalTokens,
      callCount: totalCalls,
      byModel,
    };
  } catch (err) {
    console.error("[Telemetry] Failed to get token usage summary:", err);
    return {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      callCount: 0,
      byModel: {},
    };
  }
}

/**
 * Deletes all recorded token usage history from SQLite.
 */
export function resetTokenUsage(): void {
  try {
    db.prepare("DELETE FROM token_usage").run();
    setSetting("tokenResetAt", new Date().toISOString());
  } catch (err) {
    console.error("[Telemetry] Failed to reset token usage:", err);
  }
}

export * from "./schema";
export * from "./migrations";

