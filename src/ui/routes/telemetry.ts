import { Router, Request, Response } from "express";
import { CONFIG } from "../../config";
import {
  db,
  getSetting,
  setSetting,
  getTokenUsageSummary,
  resetTokenUsage,
  DEFAULT_PRICING,
  type PricingSettings,
  type ModelSettings,
} from "../../db";
import { fetchServerModelMetadata } from "./ai";

export const telemetryRouter = Router();

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  llmBaseUrl: CONFIG.LM_STUDIO.DEFAULT_BASE_URL,
  llmModel: CONFIG.LM_STUDIO.MODELS.LLM,
  llmApiKey: CONFIG.LM_STUDIO.DEFAULT_API_KEY,
  useCommonServerForThinking: true,
  thinkingBaseUrl: "",
  thinkingApiKey: "",
  useCommonServerForFast: true,
  scoutBaseUrl: "",
  scoutApiKey: "",
  useCommonServerForEmbedding: true,
  embeddingsBaseUrl: "",
  embeddingsApiKey: "",
  useCustomEmbeddingsEndpoint: false,
  embeddingModel: CONFIG.LM_STUDIO.MODELS.EMBEDDING,
  contextWindow: CONFIG.LM_STUDIO.DEFAULT_CONTEXT_WINDOW,
  liveTraceEnabled: CONFIG.LM_STUDIO.DEFAULT_LIVE_TRACE,
  traceMaxChars: CONFIG.LM_STUDIO.DEFAULT_TRACE_MAX_CHARS,
  systemPrompt: CONFIG.LM_STUDIO.DEFAULT_SYSTEM_PROMPT,
  relevanceRubric: CONFIG.LM_STUDIO.DEFAULT_RELEVANCE_RUBRIC,
  promptTemplate: CONFIG.LM_STUDIO.DEFAULT_PROMPT_TEMPLATE,
  categories: [...CONFIG.LM_STUDIO.DEFAULT_CATEGORIES],
  sentiments: [...CONFIG.LM_STUDIO.DEFAULT_SENTIMENTS],
  clustererSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_CLUSTERER_SYSTEM_PROMPT,
  clustererPromptTemplate: CONFIG.LM_STUDIO.DEFAULT_CLUSTERER_PROMPT_TEMPLATE,
  promptAuditorSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_PROMPT_AUDITOR_SYSTEM_PROMPT,
  curatorSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_CURATOR_SYSTEM_PROMPT,
  scoutEnabled: CONFIG.LM_STUDIO.DEFAULT_SCOUT_ENABLED,
  scoutModel: CONFIG.LM_STUDIO.DEFAULT_SCOUT_MODEL,
  scoutMinScore: CONFIG.LM_STUDIO.DEFAULT_SCOUT_MIN_SCORE,
  scoutSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_SCOUT_SYSTEM_PROMPT,
  scoutPromptTemplate: CONFIG.LM_STUDIO.DEFAULT_SCOUT_PROMPT_TEMPLATE,
  userPreferencesNotes: CONFIG.LM_STUDIO.DEFAULT_USER_PREFERENCES_NOTES,
  assistantSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_SYSTEM_PROMPT,
  assistantPromptTemplate: CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_PROMPT_TEMPLATE,
  assistantMasterDirective: CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_MASTER_DIRECTIVE,
  assistantSupervisorPrompt: CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_SUPERVISOR_PROMPT,
  readerRewriteEnabled: false,
};

/**
 * Computes execution timing metrics for each bot from stage timings.
 */
export function getBotTimingStats(): Record<string, {
  count: number;
  avgMs: number | null;
  lastMs: number | null;
  minMs: number | null;
  maxMs: number | null;
  resetAt: string | null;
}> {
  const resetAt = getSetting<Record<string, string>>("botTimingResetAt", {});
  const rows = db
    .prepare("SELECT updated_at, stage_timings FROM content WHERE stage_timings IS NOT NULL ORDER BY updated_at DESC")
    .all() as Array<{ updated_at: string; stage_timings: string }>;

  const bots = ["scout", "reader", "organiser", "curator"];
  const stats: Record<string, any> = {};

  for (const bot of bots) {
    const cutoff = resetAt[bot] ? new Date(resetAt[bot]).getTime() : 0;
    let sum = 0;
    let count = 0;
    let last: number | null = null;
    let min = Infinity;
    let max = -Infinity;

    for (const row of rows) {
      const rowTime = new Date(row.updated_at.replace(" ", "T") + "Z").getTime();
      if (rowTime < cutoff) continue;
      try {
        const parsed = JSON.parse(row.stage_timings);
        const val = parsed[bot];
        if (typeof val === "number" && val > 0) {
          if (last === null) last = val;
          sum += val;
          count++;
          if (val < min) min = val;
          if (val > max) max = val;
        }
      } catch {}
    }

    stats[bot] = {
      count,
      avgMs: count > 0 ? Math.round(sum / count) : null,
      lastMs: last,
      minMs: count > 0 ? min : null,
      maxMs: count > 0 ? max : null,
      resetAt: resetAt[bot] || null,
    };
  }

  return stats;
}

/**
 * GET /api/telemetry
 * Returns consolidated status for the Command Center (DB, AI models, Gatherer).
 */
telemetryRouter.get("/", async (_req: Request, res: Response) => {
  const { getDatabaseTelemetry } = await import("../../db");

  const modelSettings: ModelSettings = getSetting("modelSettings", DEFAULT_MODEL_SETTINGS);

  const metadataResult = await fetchServerModelMetadata(modelSettings.llmBaseUrl);
  const loadedModelIds = metadataResult.models.map((m) => m.id);

  const dbTelemetry = getDatabaseTelemetry();

  res.json({
    db: dbTelemetry,
    ai: {
      online: metadataResult.online,
      url: modelSettings.llmBaseUrl,
      settings: modelSettings,
      models: metadataResult.models,
      expectedEmbeddingModel: modelSettings.embeddingModel,
      expectedLlmModel: modelSettings.llmModel,
      hasEmbeddingLoaded: loadedModelIds.includes(modelSettings.embeddingModel),
      hasLlmLoaded: loadedModelIds.includes(modelSettings.llmModel),
      error: metadataResult.error,
    },
    gatherer: {
      cron: "*/15 * * * *",
      timeoutMs: CONFIG.GATHERER.FETCH_TIMEOUT_MS,
      maxTextLength: CONFIG.GATHERER.MAX_TEXT_LENGTH,
    },
    system: {
      isPaused: getSetting<boolean>("backgroundProcessingPaused", false),
    },
  });
});

/**
 * GET /api/telemetry/tokens
 * Returns token consumption summary and estimated costs based on pricing settings.
 */
telemetryRouter.get("/tokens", (_req: Request, res: Response) => {
  const summary = getTokenUsageSummary();
  const pricing = getSetting<PricingSettings>("pricingSettings", DEFAULT_PRICING);
  const perModelRates = pricing.perModelRates || {};

  let totalEstimatedCost = 0;
  const modelCosts: Record<
    string,
    { promptCost: number; completionCost: number; totalCost: number; inRate: number; outRate: number }
  > = {};

  for (const [model, stats] of Object.entries(summary.byModel)) {
    let promptCost = 0;
    let completionCost = 0;
    const modelRate = perModelRates[model];

    let inRate = 0;
    let outRate = 0;

    if (stats.type === "embedding") {
      inRate = modelRate?.inputPricePerMillion ?? pricing.embeddingPricePerMillion;
      promptCost = (stats.totalTokens / 1_000_000) * inRate;
    } else {
      inRate = modelRate?.inputPricePerMillion ?? pricing.llmInputPricePerMillion;
      outRate = modelRate?.outputPricePerMillion ?? pricing.llmOutputPricePerMillion;
      promptCost = (stats.promptTokens / 1_000_000) * inRate;
      completionCost = (stats.completionTokens / 1_000_000) * outRate;
    }
    const modelTotal = promptCost + completionCost;
    modelCosts[model] = {
      promptCost,
      completionCost,
      totalCost: modelTotal,
      inRate,
      outRate,
    };
    totalEstimatedCost += modelTotal;
  }

  res.json({
    summary,
    pricing,
    totalEstimatedCost,
    modelCosts,
    lastResetAt: getSetting<string | null>("tokenResetAt", null),
  });
});

/**
 * GET /api/telemetry/bot-timings
 * Returns rolling execution timing statistics for all bots.
 */
telemetryRouter.get("/bot-timings", (_req: Request, res: Response) => {
  res.json({ stats: getBotTimingStats() });
});

/**
 * POST /api/telemetry/reset-bot-timing
 * Resets the rolling benchmark average for a specific bot or all bots.
 */
telemetryRouter.post("/reset-bot-timing", (req: Request, res: Response) => {
  const { bot } = req.body || {};
  const resetAt = getSetting<Record<string, string>>("botTimingResetAt", {});
  const now = new Date().toISOString();

  if (bot === "all") {
    resetAt.scout = now;
    resetAt.reader = now;
    resetAt.organiser = now;
    resetAt.curator = now;
  } else if (bot && ["scout", "reader", "organiser", "curator"].includes(bot)) {
    resetAt[bot] = now;
  } else {
    return res.status(400).json({ error: "Invalid bot specified" });
  }

  setSetting("botTimingResetAt", resetAt);
  console.log(`[Telemetry] Reset timing benchmarks for bot: ${bot}`);
  res.json({ success: true, bot, resetAt: now, stats: getBotTimingStats() });
});

/**
 * POST /api/telemetry/tokens/reset
 * Clears historical token telemetry from SQLite.
 */
telemetryRouter.post("/tokens/reset", (_req: Request, res: Response) => {
  resetTokenUsage();
  res.json({ success: true });
});

