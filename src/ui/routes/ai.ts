import { Router, Request, Response } from "express";
import { exec } from "node:child_process";
import { CONFIG } from "../../config";
import {
  ModelSettingsSchema,
  getSetting,
  setSetting,
  type LoadedModelMetadata,
  type ModelSettings,
} from "../../db";
import {
  checkUserPreferencesWithSupervisor,
  synthesizeAssistantDirective,
} from "../../agent/assistant";

export const aiRouter = Router();

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
 * Retrieves loaded model metadata from LM Studio CLI and HTTP endpoints.
 */
export async function fetchServerModelMetadata(
  baseUrl: string = CONFIG.LM_STUDIO.DEFAULT_BASE_URL
): Promise<{
  online: boolean;
  models: LoadedModelMetadata[];
  error?: string;
}> {
  let lmsModels: LoadedModelMetadata[] = [];
  try {
    const lmsOutput = await new Promise<string>((resolve, reject) => {
      exec("lms ps --json", (error, stdout) => {
        if (error || !stdout.trim()) {
          reject(error || new Error("No output"));
        } else {
          resolve(stdout.trim());
        }
      });
    });

    const parsed = JSON.parse(lmsOutput) as Array<any>;
    if (Array.isArray(parsed)) {
      lmsModels = parsed.map((m) => ({
        id: m.modelKey || m.identifier || "",
        displayName: m.displayName || m.modelKey || "",
        type: m.type === "embedding" ? "embedding" : "llm",
        architecture: m.architecture,
        contextLength: m.contextLength,
        maxContextLength: m.maxContextLength,
        paramsString: m.paramsString,
        quantization: m.quantization?.name,
        status: m.status,
      }));
    }
  } catch {
    // If lms CLI is not available or non-JSON, fallback to HTTP /v1/models
  }

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return {
        online: false,
        models: lmsModels,
        error: `HTTP ${res.status} ${res.statusText}`,
      };
    }

    const data = (await res.json()) as { data?: Array<{ id: string }> };
    const httpIds = data.data?.map((m) => m.id) ?? [];

    const mergedMap = new Map<string, LoadedModelMetadata>();
    for (const lmsM of lmsModels) {
      mergedMap.set(lmsM.id, lmsM);
    }

    for (const id of httpIds) {
      if (!mergedMap.has(id)) {
        mergedMap.set(id, {
          id,
          displayName: id,
          type: id.includes("embed") ? "embedding" : "llm",
        });
      }
    }

    return {
      online: true,
      models: Array.from(mergedMap.values()),
    };
  } catch (err) {
    return {
      online: lmsModels.length > 0,
      models: lmsModels,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * GET /api/settings/ai
 * Returns the current LLM & embedding connection settings.
 */
aiRouter.get("/settings/ai", (_req: Request, res: Response) => {
  const settings = getSetting<ModelSettings>("modelSettings", DEFAULT_MODEL_SETTINGS);
  if (settings && settings.assistantPromptTemplate && settings.assistantPromptTemplate.includes("{{systemPrompt}}")) {
    settings.assistantPromptTemplate = CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_PROMPT_TEMPLATE;
    setSetting("modelSettings", settings);
  }
  res.json({ settings });
});

/**
 * POST /api/settings/ai
 * Validates and updates the LLM & embedding settings in SQLite.
 */
aiRouter.post("/settings/ai", (req: Request, res: Response) => {
  const result = ModelSettingsSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: result.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  setSetting("modelSettings", result.data);
  res.json({ success: true, settings: result.data });
});

/**
 * GET /api/preferences
 * Returns user personal algorithm preferences: token weights, token sets, muted tokens, and votes.
 */
aiRouter.get("/preferences", (_req: Request, res: Response) => {
  const defaultPrefs = {
    tokenWeights: {} as Record<string, number>,
    tokenMuted: {} as Record<string, boolean>,
    tokenSetWeights: {} as Record<string, number>,
    articleVotes: {} as Record<number, "up" | "down">,
    votedVectors: {} as Record<string, any>,
    tagTemperatures: {} as Record<string, number>,
    tagMuted: {} as Record<string, boolean>,
    comboTemperatures: {} as Record<string, number>,
    articleRatings: {} as Record<number, "hot" | "not">,
    boostedTopics: [] as string[],
    mutedTopics: [] as string[],
  };
  const raw = getSetting("feedPreferences", defaultPrefs);
  const tokenWeights = raw.tokenWeights || raw.tagTemperatures || {};
  const tokenMuted = raw.tokenMuted || raw.tagMuted || {};
  const tokenSetWeights = raw.tokenSetWeights || raw.comboTemperatures || {};
  const articleVotes = raw.articleVotes || {};
  const votedVectors = raw.votedVectors || {};

  res.json({
    preferences: {
      ...raw,
      tokenWeights,
      tokenMuted,
      tokenSetWeights,
      articleVotes,
      votedVectors,
    },
  });
});

/**
 * POST /api/preferences
 * Updates user personal algorithm preferences in SQLite.
 */
aiRouter.post("/preferences", (req: Request, res: Response) => {
  const {
    tokenWeights = {},
    tokenMuted = {},
    tokenSetWeights = {},
    articleVotes = {},
    votedVectors = {},
    tagTemperatures = {},
    tagMuted = {},
    comboTemperatures = {},
    articleRatings = {},
    boostedTopics = [],
    mutedTopics = [],
  } = req.body;

  const preferences = {
    tokenWeights: Object.keys(tokenWeights).length > 0 ? tokenWeights : tagTemperatures,
    tokenMuted: Object.keys(tokenMuted).length > 0 ? tokenMuted : tagMuted,
    tokenSetWeights: Object.keys(tokenSetWeights).length > 0 ? tokenSetWeights : comboTemperatures,
    articleVotes,
    votedVectors,
    tagTemperatures: tokenWeights,
    tagMuted: tokenMuted,
    comboTemperatures: tokenSetWeights,
    articleRatings,
    boostedTopics,
    mutedTopics,
  };
  setSetting("feedPreferences", preferences);
  res.json({ success: true, preferences });
});

/**
 * POST /api/settings/ai/test
 * Tests connectivity and queries metadata for the provided server URL and models.
 */
aiRouter.post("/settings/ai/test", async (req: Request, res: Response) => {
  const {
    target = "all",
    llmBaseUrl,
    llmModel,
    llmApiKey,
    useCommonServerForThinking = true,
    thinkingBaseUrl,
    thinkingApiKey,
    scoutModel,
    useCommonServerForFast = true,
    scoutBaseUrl,
    scoutApiKey,
    embeddingModel,
    useCommonServerForEmbedding = true,
    embeddingsBaseUrl,
    embeddingsApiKey,
    useCustomEmbeddingsEndpoint,
  } = req.body;

  const commonUrl = llmBaseUrl || CONFIG.LM_STUDIO.DEFAULT_BASE_URL;
  const commonKey = llmApiKey || "lm-studio";

  const thinkingUrl = (!useCommonServerForThinking && thinkingBaseUrl) ? thinkingBaseUrl : commonUrl;
  const thinkingKey = (!useCommonServerForThinking && thinkingApiKey) ? thinkingApiKey : commonKey;

  const fastUrl = (!useCommonServerForFast && scoutBaseUrl) ? scoutBaseUrl : commonUrl;
  const fastKey = (!useCommonServerForFast && scoutApiKey) ? scoutApiKey : commonKey;

  const isEmbedCustom = !useCommonServerForEmbedding || useCustomEmbeddingsEndpoint;
  const embedUrl = (isEmbedCustom && embeddingsBaseUrl) ? embeddingsBaseUrl : commonUrl;
  const embedKey = (isEmbedCustom && embeddingsApiKey) ? embeddingsApiKey : commonKey;

  let meta: { online: boolean; models: LoadedModelMetadata[]; error?: string } = {
    online: true,
    models: [],
  };
  if (target === "all") {
    meta = await fetchServerModelMetadata(commonUrl);
  }

  let analystOk = false;
  let analystError: string | undefined;

  let fastOk = false;
  let fastError: string | undefined;
  const isFastFallback = !scoutModel || scoutModel.trim() === "";
  const effectiveFastModel = isFastFallback ? (llmModel || CONFIG.LM_STUDIO.MODELS.LLM) : scoutModel.trim();

  let embeddingOk = false;
  let embeddingError: string | undefined;

  // Test 1: Thinking LLM chat completion
  if (target === "all" || target === "analyst") {
    try {
      const chatRes = await fetch(`${thinkingUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${thinkingKey}`,
        },
        body: JSON.stringify({
          model: llmModel || CONFIG.LM_STUDIO.MODELS.LLM,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 3,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (chatRes.ok) {
        analystOk = true;
      } else {
        analystError = `HTTP ${chatRes.status} ${chatRes.statusText}`;
      }
    } catch (err) {
      analystError = err instanceof Error ? err.message : String(err);
    }
  }

  // Test 2: Fast LLM model
  if (target === "all" || target === "fast") {
    if (isFastFallback && target === "fast") {
      fastOk = false;
      fastError = "No Fast LLM configured (using Thinking LLM fallback)";
    } else {
      try {
        const fastRes = await fetch(`${fastUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${fastKey}`,
          },
          body: JSON.stringify({
            model: effectiveFastModel,
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 3,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (fastRes.ok) {
          fastOk = true;
        } else {
          fastError = `HTTP ${fastRes.status} ${fastRes.statusText}`;
        }
      } catch (err) {
        fastError = err instanceof Error ? err.message : String(err);
      }
    }
  }

  // Test 3: Embedding generation
  if (target === "all" || target === "embedding") {
    try {
      const embedRes = await fetch(`${embedUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${embedKey}`,
        },
        body: JSON.stringify({
          model: embeddingModel || CONFIG.LM_STUDIO.MODELS.EMBEDDING,
          input: "test",
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (embedRes.ok) {
        embeddingOk = true;
      } else {
        embeddingError = `HTTP ${embedRes.status} ${embedRes.statusText}`;
      }
    } catch (err) {
      embeddingError = err instanceof Error ? err.message : String(err);
    }
  }

  res.json({
    online: meta.online,
    models: meta.models,
    target,
    fast: {
      ok: fastOk,
      error: fastError,
      fallback: isFastFallback,
      model: effectiveFastModel,
      url: fastUrl,
    },
    analyst: {
      ok: analystOk,
      error: analystError,
      model: llmModel || CONFIG.LM_STUDIO.MODELS.LLM,
      url: thinkingUrl,
    },
    embedding: {
      ok: embeddingOk,
      error: embeddingError,
      model: embeddingModel || CONFIG.LM_STUDIO.MODELS.EMBEDDING,
      url: embedUrl,
    },
    llmChat: { ok: analystOk, error: analystError },
  });
});

/**
 * GET /api/settings/ai/metadata
 * Queries the active LLM server for real-time model parameters.
 */
aiRouter.get("/settings/ai/metadata", async (req: Request, res: Response) => {
  const url =
    typeof req.query.url === "string" && req.query.url
      ? req.query.url
      : CONFIG.LM_STUDIO.DEFAULT_BASE_URL;

  const result = await fetchServerModelMetadata(url);
  res.json(result);
});

/**
 * POST /api/ai/audit-prompt
 * Inspects prompts for dynamic tokens, syntax, and provides actionable recommendations.
 */
aiRouter.post("/ai/audit-prompt", async (req: Request, res: Response) => {
  const { prompt, type } = req.body || {};
  if (typeof prompt !== "string") {
    res.status(400).json({ error: "Missing prompt parameter" });
    return;
  }

  const issues: Array<{ severity: "error" | "warning" | "info"; message: string; fix?: string }> = [];
  const suggestions: Array<{ title: string; description: string; fix?: string }> = [];
  let score = 100;

  const tokenRegex = /\{\{([^}]+)\}\}/g;
  const foundTokens = new Set<string>();
  let match;
  while ((match = tokenRegex.exec(prompt)) !== null) {
    foundTokens.add(match[0]);
  }

  const malformedSingle = /(?<!\{)\{([a-zA-Z0-9_]+)\}(?!\})/g;
  let singleMatch;
  while ((singleMatch = malformedSingle.exec(prompt)) !== null) {
    issues.push({
      severity: "warning",
      message: `Found single-curly brace "${singleMatch[0]}". Valet tokens use double curly braces like "{{${singleMatch[1]}}}".`,
      fix: `{{${singleMatch[1]}}}`,
    });
    score -= 8;
  }

  if (type === "analyst-template") {
    if (!foundTokens.has("{{primaryPlainText}}")) {
      issues.push({
        severity: "error",
        message: "Missing mandatory {{primaryPlainText}} token: The LLM will not receive the article text to analyze.",
        fix: "{{primaryPlainText}}",
      });
      score -= 30;
    }
    if (!foundTokens.has("{{relatedContextPlainText}}")) {
      issues.push({
        severity: "warning",
        message: "Missing {{relatedContextPlainText}} token: Historical vector memory from sqlite-vec will not be injected.",
        fix: "{{relatedContextPlainText}}",
      });
      score -= 10;
    }
    if (!prompt.includes('"relevanceScore"')) {
      issues.push({
        severity: "error",
        message: 'JSON output schema is missing "relevanceScore". The ranking engine requires a numeric 0-100 score.',
      });
      score -= 20;
    }
    if (!prompt.toLowerCase().includes("json") || !prompt.toLowerCase().includes("markdown")) {
      suggestions.push({
        title: "Enforce Raw JSON Only",
        description: "Instruct model: 'You MUST respond ONLY with valid raw JSON (no conversational prose, no markdown codeblocks like ```json)'. This prevents parser failures.",
        fix: "\nYou MUST respond ONLY with valid, raw JSON (no conversational prose, no markdown codeblocks like ```json).",
      });
      score -= 10;
    }
  } else if (type === "analyst-system") {
    if (prompt.length < 25) {
      issues.push({
        severity: "warning",
        message: "System prompt is very brief. Define role, tone, and analytical directives for higher quality output.",
      });
      score -= 15;
    }
    if (!prompt.toLowerCase().includes("valet") && !prompt.toLowerCase().includes("reader") && !prompt.toLowerCase().includes("analyst")) {
      suggestions.push({
        title: "Explicit Persona Role",
        description: "Establish a clear persona (e.g. 'You are Valet, an objective article reader and analyst') to keep tone professional and objective.",
      });
    }
  } else if (type === "analyst-rubric") {
    if (!prompt.includes("0") || !prompt.includes("100")) {
      issues.push({
        severity: "warning",
        message: "Scoring rubric should define the full 0 to 100 spectrum with clear milestone brackets.",
      });
      score -= 15;
    }
  } else if (type === "clusterer-template") {
    if (!foundTokens.has("{{articlesText}}")) {
      issues.push({
        severity: "error",
        message: "Missing {{articlesText}} token: The model will not receive the multi-source candidate articles to collate.",
        fix: "{{articlesText}}",
      });
      score -= 30;
    }
  }

  score = Math.max(0, Math.min(100, score));
  const valid = !issues.some((i) => i.severity === "error");

  res.json({
    valid,
    score,
    issues,
    suggestions,
    tokensFound: Array.from(foundTokens),
  });
});

/**
 * GET /api/assistant/state
 * Returns user's preferences notes and the synthesized master directive.
 */
aiRouter.get("/assistant/state", (_req: Request, res: Response) => {
  const modelSettings = getSetting<ModelSettings>("modelSettings", {} as any);
  const notes =
    modelSettings.userPreferencesNotes ||
    CONFIG.LM_STUDIO.DEFAULT_USER_PREFERENCES_NOTES;
  const masterDirective =
    modelSettings.assistantMasterDirective ||
    CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_MASTER_DIRECTIVE;
  const lastSynthesizedAt = getSetting<string | null>(
    "assistantLastSynthesizedAt",
    null
  );

  res.json({
    notes,
    masterDirective,
    lastSynthesizedAt,
  });
});

/**
 * POST /api/assistant/check-preferences
 * Audits and evaluates user preferences with Supervisor.
 */
aiRouter.post("/assistant/check-preferences", async (req: Request, res: Response) => {
  try {
    const { notes } = req.body || {};
    if (typeof notes !== "string") {
      res.status(400).json({ error: "Missing notes parameter" });
      return;
    }
    const audit = await checkUserPreferencesWithSupervisor(notes);
    res.json(audit);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/assistant/synthesize
 * Synthesizes read history, votes, and user notes into a master directive.
 */
aiRouter.post("/assistant/synthesize", async (req: Request, res: Response) => {
  try {
    const { notes } = req.body || {};
    const result = await synthesizeAssistantDirective(notes);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/assistant/save
 * Persists updated preferences notes and/or master directive.
 */
aiRouter.post("/assistant/save", (req: Request, res: Response) => {
  try {
    const { notes, masterDirective } = req.body || {};
    const currentSettings = getSetting<ModelSettings>("modelSettings", {} as any);
    const updated = {
      ...currentSettings,
      ...(typeof notes === "string" ? { userPreferencesNotes: notes } : {}),
      ...(typeof masterDirective === "string" ? { assistantMasterDirective: masterDirective } : {}),
    };
    setSetting("modelSettings", updated);
    if (typeof masterDirective === "string") {
      setSetting("assistantMasterDirective", masterDirective);
    }
    res.json({ success: true, settings: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

