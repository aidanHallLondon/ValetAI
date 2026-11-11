import crypto from "node:crypto";
import { db } from "../db";
import { CONFIG } from "../config";
import type { ModelSettings } from "../db/schema";

/**
 * Defines pipeline stage names for prompt version tracking.
 */
export type AgentStageName = "reader" | "organiser" | "curator";

/**
 * Creates a deterministic SHA-256 hash for a prompt string.
 */
export function hashPromptText(promptText: string): string {
  return crypto.createHash("sha256").update((promptText || "").trim()).digest("hex").slice(0, 16);
}

/**
 * Returns the version tag for a prompt or creates a new version.
 */
export function getOrCreatePromptVersion(agentName: AgentStageName, promptText: string): string {
  const normalized = (promptText || "").trim();
  const promptHash = hashPromptText(normalized);

  // 1. Check if hash already exists in prompt_versions
  const existing = db
    .prepare("SELECT version_tag FROM prompt_versions WHERE agent_name = ? AND prompt_hash = ?")
    .get(agentName, promptHash) as { version_tag: string } | undefined;

  if (existing) {
    return existing.version_tag;
  }

  // 2. Count existing versions for this agent
  const countRow = db
    .prepare("SELECT COUNT(*) as count FROM prompt_versions WHERE agent_name = ?")
    .get(agentName) as { count: number };

  const nextVersionNum = (countRow?.count || 0) + 1;
  const versionTag = `v${nextVersionNum}`;

  // 3. Insert new prompt version
  try {
    db.prepare(`
      INSERT INTO prompt_versions (agent_name, prompt_hash, version_tag, prompt_text, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(agentName, promptHash, versionTag, normalized);
  } catch (err) {
    // In case of race condition
    const retry = db
      .prepare("SELECT version_tag FROM prompt_versions WHERE agent_name = ? AND prompt_hash = ?")
      .get(agentName, promptHash) as { version_tag: string } | undefined;
    if (retry) return retry.version_tag;
  }

  return versionTag;
}

/**
 * Loads current prompt versions and text for all pipeline stages.
 */
export function getActivePromptVersions(): {
  reader: { version: string; prompt: string };
  organiser: { version: string; prompt: string };
  curator: { version: string; prompt: string };
} {
  let settings: Partial<ModelSettings> = {};
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'modelSettings'").get() as { value: string } | undefined;
    if (row && row.value) {
      settings = JSON.parse(row.value);
    }
  } catch {}

  const readerPrompt = settings.systemPrompt || CONFIG.LM_STUDIO.DEFAULT_SYSTEM_PROMPT;
  const organiserPrompt = settings.clustererSystemPrompt || CONFIG.LM_STUDIO.DEFAULT_CLUSTERER_SYSTEM_PROMPT;
  const curatorPrompt = settings.curatorSystemPrompt || CONFIG.LM_STUDIO.DEFAULT_CURATOR_SYSTEM_PROMPT;

  return {
    reader: {
      version: getOrCreatePromptVersion("reader", readerPrompt),
      prompt: readerPrompt,
    },
    organiser: {
      version: getOrCreatePromptVersion("organiser", organiserPrompt),
      prompt: organiserPrompt,
    },
    curator: {
      version: getOrCreatePromptVersion("curator", curatorPrompt),
      prompt: curatorPrompt,
    },
  };
}

