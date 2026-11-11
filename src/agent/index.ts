import { createOpenAI } from "@ai-sdk/openai";
import { embed, generateText } from "ai";
import { CONFIG } from "../config";
import { stripHtmlAndEntities } from "../gatherer";
import { stripHeadlineRepetition } from "../ui/utils/articleNarrative";
import {
  db,
  getSetting,
  parseContentRecord,
  ProcessedAnalysisSchema,
  toFloat32VectorBuffer,
  recordTokenUsage,
  type ContentRecord,
  type ProcessedAnalysis,
  type ModelSettings,
} from "../db";
import { getActivePromptVersions } from "./prompt_versioning";

/**
 * Loads active model settings from SQLite with fallback defaults.
 */
export function getActiveModelSettings(): ModelSettings {
  return getSetting<ModelSettings>("modelSettings", {
    llmBaseUrl: process.env.LM_STUDIO_BASE_URL || CONFIG.LM_STUDIO.DEFAULT_BASE_URL,
    llmModel: CONFIG.LM_STUDIO.MODELS.LLM,
    llmApiKey: process.env.LM_STUDIO_API_KEY || CONFIG.LM_STUDIO.DEFAULT_API_KEY,
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
  });
}

/**
 * Creates an OpenAI client for LM Studio endpoints.
 */
export function getModelClient(customBaseUrl?: string) {
  const settings = getActiveModelSettings();
  const baseURL = customBaseUrl || settings.llmBaseUrl;
  return createOpenAI({
    baseURL,
    apiKey: settings.llmApiKey || "lm-studio",
    compatibility: "compatible",
  });
}

/**
 * Claims a batch of pending content rows and sets status to processing.
 */
export function claimPendingContentBatch(
  limit: number = CONFIG.AGENT.BATCH_SIZE
): ContentRecord[] {
  const claimTx = db.transaction((): ContentRecord[] => {
    const rows = db
      .prepare(
        `SELECT * FROM content WHERE status = 'pending' ORDER BY id ASC LIMIT ?`
      )
      .all(limit);

    if (!rows || rows.length === 0) {
      return [];
    }

    const ids = rows.map((r: any) => r.id);
    const placeholders = ids.map(() => "?").join(",");

    const updatedRows = db
      .prepare(
        `UPDATE content
         SET status = 'processing',
             updated_at = datetime('now'),
             error_message = NULL
         WHERE id IN (${placeholders}) AND status = 'pending'
         RETURNING *`
      )
      .all(...ids);

    return updatedRows.map(parseContentRecord);
  });

  return claimTx();
}

/**
 * Claims the next pending content row and sets status to processing.
 */
export function claimNextPendingContent(): ContentRecord | null {
  const batch = claimPendingContentBatch(1);
  return batch.length > 0 ? batch[0] : null;
}

/**
 * Resets stalled processing rows back to pending status.
 */
export function cleanupStaleProcessingItems(maxAgeMinutes: number = 3): number {
  try {
    const result = db.prepare(`
      UPDATE content
      SET status = CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'pending' END,
          reader_status = CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'pending' END,
          organiser_status = CASE WHEN organiser_status = 'processing' THEN (CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'pending' END) ELSE organiser_status END,
          curator_status = CASE WHEN curator_status = 'processing' THEN (CASE WHEN analysis_json IS NOT NULL THEN 'completed' ELSE 'pending' END) ELSE curator_status END,
          updated_at = datetime('now')
      WHERE (status = 'processing' OR reader_status = 'processing' OR organiser_status = 'processing' OR curator_status = 'processing')
        AND updated_at < datetime('now', '-' || ? || ' minutes')
    `).run(maxAgeMinutes);

    if (result.changes > 0) {
      console.log(`[Agent] Cleaned up ${result.changes} stale processing items older than ${maxAgeMinutes}m.`);
    }
    return result.changes;
  } catch (err) {
    console.error("[Agent] Failed to clean up stale processing items:", err);
    return 0;
  }
}

/**
 * Saves a float32 vector embedding into the sqlite-vec table.
 */
export function storeContentVector(contentId: number, vector: number[]): Buffer {
  const vectorBuffer = toFloat32VectorBuffer(vector);

  const upsertTx = db.transaction(() => {
    db.prepare(`DELETE FROM content_embeddings WHERE content_id = ?`).run(
      BigInt(contentId)
    );
    db.prepare(
      `INSERT INTO content_embeddings (content_id, embedding) VALUES (?, ?)`
    ).run(BigInt(contentId), vectorBuffer);
  });

  upsertTx();
  return vectorBuffer;
}

/**
 * Stores vector search matches joined with plain text content.
 */
export interface RetrievedVectorContext {
  content_id: number;
  distance: number;
  source_url: string | null;
  raw_text: string;
}

/**
 * Changes matching vector embeddings to plain text for the LLM.
 */
export function retrievePlainTextForVectors(
  queryVectorBuffer: Buffer,
  topK: number = CONFIG.AGENT.RAG_TOP_K
): RetrievedVectorContext[] {
  const rows = db
    .prepare(
      `SELECT
         ce.content_id,
         ce.distance,
         c.source_url,
         c.raw_text
       FROM content_embeddings ce
       INNER JOIN content c ON c.id = ce.content_id
       WHERE ce.embedding MATCH @queryVector
         AND k = @topK
       ORDER BY ce.distance ASC`
    )
    .all({
      queryVector: queryVectorBuffer,
      topK,
    }) as RetrievedVectorContext[];

  return rows;
}

/**
 * Processes one content item through embedding, retrieval, and analysis.
 */
export async function processSingleContentItem(
  item: ContentRecord
): Promise<ProcessedAnalysis> {
  const itemStartTime = Date.now();
  let scoutTimeMs = 0;
  let embedTimeMs = 0;
  let readerTimeMs = 0;
  let clusterTimeMs = 0;

  const settings = getActiveModelSettings();

  console.log(
    `[Agent] Processing content #${item.id} using LLM=${settings.llmModel}, Embed=${settings.embeddingModel}, Scout=${settings.scoutModel}`
  );

  const embedClient = getModelClient(settings.embeddingsBaseUrl || settings.llmBaseUrl);
  const llmClient = getModelClient(settings.llmBaseUrl);

  // Step 0: Clean raw text to ensure no unescaped HTML entities, markup, or base64 tokens reach models
  // Preserve paragraph newlines so headline and body remain distinctly identifiable
  const cleanItemText = stripHtmlAndEntities(item.raw_text, true);

  // Step 1: Scout Gatekeeper Triage (Ultra-Fast Decision Classification)
  if (settings.scoutEnabled !== false) {
    const tScoutStart = Date.now();
    try {
      const scoutModel = settings.scoutModel || settings.llmModel;
      const userDirectives = settings.assistantMasterDirective || settings.userPreferencesNotes || "";
      const sourceRow = item.source_id
        ? (db.prepare("SELECT name FROM sources WHERE id = ?").get(item.source_id) as { name: string } | undefined)
        : undefined;
      const sourceName = sourceRow?.name || "RSS Feed";

      const lines = cleanItemText.split("\n").filter((l) => l.trim().length > 0);
      const articleTitle = lines[0] || "Untitled Article";
      const articlePreview = cleanItemText.slice(0, 1200);

      const scoutSystemPrompt = (settings.scoutSystemPrompt || CONFIG.LM_STUDIO.DEFAULT_SCOUT_SYSTEM_PROMPT)
        .replace("{{userDirectives}}", userDirectives);

      console.log(`[Agent] 🎯 Scout triaging content #${item.id} with ${scoutModel}...`);
      const scoutRes = await generateText({
        model: llmClient(scoutModel),
        messages: [
          { role: "system", content: scoutSystemPrompt },
          {
            role: "user",
            content: `=== INCOMING ARTICLE TO EVALUATE ===\nTitle: ${articleTitle}\nSource: ${sourceName}\nContent Preview:\n${articlePreview}`,
          },
        ],
        temperature: 0.1,
      });

      scoutTimeMs = Date.now() - tScoutStart;

      if (scoutRes.usage) {
        recordTokenUsage(scoutModel, "llm", scoutRes.usage.promptTokens || 0, scoutRes.usage.completionTokens || 0);
      }

      const scoutOutput = scoutRes.text
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/```json\s*/gi, "")
        .replace(/```/g, "")
        .trim();

      const scoutMatch = scoutOutput.match(/\{[\s\S]*\}/);
      if (scoutMatch) {
        const parsedScout = JSON.parse(scoutMatch[0]);
        const shouldPass = Boolean(
          parsedScout.pass ??
            (Number(parsedScout.relevanceScore ?? 50) >= (settings.scoutMinScore || 35))
        );
        const reason = parsedScout.reason || (shouldPass ? "Passed triage filter" : "Low relevance or excluded category");
        const score = Number(parsedScout.relevanceScore ?? (shouldPass ? 60 : 15));

        if (!shouldPass) {
          // DISCARD: Bypass embedding, RAG, and Deep Reader completely!
          const totalMs = Date.now() - itemStartTime;
          const stageTimings = {
            scout: scoutTimeMs,
            total: totalMs,
          };
          db.prepare(`
            UPDATE content
            SET status = 'triage_discarded',
                scout_status = 'discarded',
                scout_version = 'v1',
                scout_reason = @reason,
                scout_score = @score,
                processing_time_ms = @processing_time_ms,
                stage_timings = @stage_timings,
                updated_at = datetime('now')
            WHERE id = @id
          `).run({
            id: item.id,
            reason,
            score,
            processing_time_ms: totalMs,
            stage_timings: JSON.stringify(stageTimings),
          });

          console.log(
            `[Agent] 🎯 Scout DISCARDED content #${item.id} in ${(scoutTimeMs / 1000).toFixed(2)}s: "${reason}" (score=${score})`
          );

          return {
            title: articleTitle,
            summary: `Filtered by Scout triage: ${reason}`,
            category: parsedScout.category || "discarded",
            sentiment: "neutral",
            keyEntities: [],
            actionItems: [],
            relevanceScore: score,
          };
        } else {
          // PASSED: Record scout approval and continue downstream
          db.prepare(`
            UPDATE content
            SET scout_status = 'passed',
                scout_version = 'v1',
                scout_reason = @reason,
                scout_score = @score
            WHERE id = @id
          `).run({
            id: item.id,
            reason,
            score,
          });
          console.log(
            `[Agent] 🎯 Scout PASSED content #${item.id} in ${(scoutTimeMs / 1000).toFixed(2)}s: "${reason}" (score=${score})`
          );
        }
      }
    } catch (scoutErr) {
      console.warn(`[Agent] Scout triage warning on content #${item.id}, passing through to reader:`, scoutErr);
      scoutTimeMs = Date.now() - tScoutStart;
    }
  }

  // Step 2: Vector Embeddings (BGE-M3)
  const tEmbedStart = Date.now();
  const embedRes = await embed({
    model: embedClient.embedding(settings.embeddingModel),
    value: cleanItemText,
  });
  embedTimeMs = Date.now() - tEmbedStart;
  const embedding = embedRes.embedding;
  if (embedRes.usage?.tokens) {
    recordTokenUsage(settings.embeddingModel, "embedding", embedRes.usage.tokens, 0);
  }

  // Step 3: Store the vector using `sqlite-vec`
  const vectorBuffer = storeContentVector(item.id, embedding);

  // Step 4: Retrieve the original human-readable text associated with those vectors
  const vectorMatches = retrievePlainTextForVectors(
    vectorBuffer,
    CONFIG.AGENT.RAG_TOP_K
  );

  const primaryMatch = vectorMatches.find((m) => m.content_id === item.id);
  // Cap primary plain text safely to fit comfortably inside LM Studio context window
  const maxPrimaryChars = 3500;
  const primaryPlainText = stripHtmlAndEntities(primaryMatch ? primaryMatch.raw_text : cleanItemText, true).slice(0, maxPrimaryChars);

  // Limit each RAG reference to 600 clean chars to avoid blowing local context limit
  const maxRAGChars = 600;
  const relatedContextPlainText = vectorMatches
    .filter((m) => m.content_id !== item.id)
    .map(
      (m, idx) =>
        `[Related Memory #${idx + 1} | content_id=${m.content_id} | distance=${m.distance.toFixed(4)}]\n${stripHtmlAndEntities(m.raw_text).slice(0, maxRAGChars)}`
    )
    .join("\n\n");

  // Step 5: Construct structured chat messages array with user directives
  const sysPrompt = settings.systemPrompt || CONFIG.LM_STUDIO.DEFAULT_SYSTEM_PROMPT;
  const rubric = settings.relevanceRubric || CONFIG.LM_STUDIO.DEFAULT_RELEVANCE_RUBRIC;

  const systemContent = [
    sysPrompt,
    "",
    "=== RELEVANCE SCORING CRITERIA (0 to 100) ===",
    rubric,
  ];

  if (settings.assistantMasterDirective && settings.assistantMasterDirective.trim().length > 0) {
    systemContent.push(
      "",
      "=== USER PERSONAL PREFERENCES & GUIDANCE ===",
      settings.assistantMasterDirective.trim()
    );
  }

  systemContent.push(
    "",
    "=== STRICT JSON OUTPUT INSTRUCTIONS ===",
    "You MUST respond ONLY with valid, raw JSON (no conversational prose, no markdown codeblocks like ```json).",
    "JSON format must strictly adhere to:",
    `{
  "title": string,
  "summary": string (concise 2-3 sentence executive synthesis capturing what happened and why it matters, eliminating filler and clickbait),
  "category": string (concise domain like "technology", "finance", "security", "geopolitics", etc.),
  "sentiment": "positive" | "neutral" | "negative" | "critical",
  "keyEntities": string[] (notable people, organizations, countries, and institutions),
  "actionItems": string[] (concrete takeaways, strategic implications, or developments to monitor),
  "relevanceScore": number (0 to 100)
}`
  );

  // Build messages array with discrete message turns for system instructions,
  // historical vector memory (if any), and the primary document.
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemContent.join("\n") },
  ];

  if (relatedContextPlainText && relatedContextPlainText.trim().length > 0) {
    messages.push({
      role: "user",
      content: `=== RELATED HISTORICAL MEMORY (RETRIEVED VIA VECTOR STORE) ===\n${relatedContextPlainText}`,
    });
    messages.push({
      role: "assistant",
      content:
        "Understood. I will incorporate this historical context when evaluating the upcoming document.",
    });
  }

  messages.push({
    role: "user",
    content: `=== PRIMARY DOCUMENT PLAIN TEXT ===\n${primaryPlainText}`,
  });

  let promptRecord = "";
  let rawOutput = "";
  let validatedAnalysis: ProcessedAnalysis;

  if (settings.readerRewriteEnabled !== true) {
    // Ultra-fast bypass: Do not call slow generative rewriting LLM.
    // Use publisher original report headline, clean text, fast entity extraction, and scout scoring.
    const lines = cleanItemText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const articleTitle = lines[0] || (item.raw_text.split("\n")[0] || "Untitled Article").slice(0, 120);
    const publisherBody = lines.slice(1).join(" ").trim();
    const nonRepeatingBody = stripHeadlineRepetition(publisherBody, articleTitle);
    const rawSummary = nonRepeatingBody
      ? nonRepeatingBody.length > 400
        ? nonRepeatingBody.slice(0, 400) + "…"
        : nonRepeatingBody
      : articleTitle;

    // Fast regex entity extraction (proper nouns & acronyms)
    const entityMatches = cleanItemText.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*\b|\b[A-Z]{2,}\b/g) || [];
    const stopWords = new Set([
      "The", "This", "That", "These", "Those", "There", "Here", "When", "Where", "What", "Which",
      "While", "After", "Before", "During", "Under", "About", "With", "From", "Into", "Over", "More",
      "Some", "Many", "Most", "Other", "Such", "Even", "Just", "Only", "Also", "According", "Report",
      "Reports", "Said", "Says", "News", "Article", "Update", "Updates", "Friday", "Monday", "Tuesday",
      "Wednesday", "Thursday", "Saturday", "Sunday", "January", "February", "March", "April", "May",
      "June", "July", "August", "September", "October", "November", "December",
    ]);
    const keyEntities = Array.from(
      new Set(entityMatches.filter((e) => !stopWords.has(e) && e.length >= 3))
    ).slice(0, 6);

    const relevanceScore = item.scout_score && item.scout_score > 0 ? item.scout_score : 70;

    validatedAnalysis = {
      title: articleTitle,
      summary: rawSummary,
      category: "general",
      sentiment: "neutral",
      keyEntities,
      actionItems: [],
      relevanceScore,
    };
    readerTimeMs = 0;
    rawOutput = JSON.stringify(validatedAnalysis);
    promptRecord = "[Bypassed LLM rewrite: using publisher original report directly]";
  } else {
    // Generative rewriting using full 14B LLM
    promptRecord = JSON.stringify(messages, null, 2);
    try {
      db.prepare(`UPDATE content SET last_prompt = ? WHERE id = ?`).run(promptRecord, item.id);
    } catch {}

    try {
      const tLlmStart = Date.now();
      const genRes = await generateText({
        model: llmClient(settings.llmModel),
        messages,
        temperature: 0.1,
      });
      readerTimeMs = Date.now() - tLlmStart;
      rawOutput = genRes.text;
      if (genRes.usage) {
        recordTokenUsage(
          settings.llmModel,
          "llm",
          genRes.usage.promptTokens || 0,
          genRes.usage.completionTokens || 0
        );
      }
    } catch (llmErr: any) {
      let llmErrMsg = llmErr instanceof Error ? llmErr.message : String(llmErr);
      if (llmErr?.responseBody) {
        try {
          const parsed = typeof llmErr.responseBody === "string" ? JSON.parse(llmErr.responseBody) : llmErr.responseBody;
          const detail = parsed?.error?.message || parsed?.error || JSON.stringify(parsed);
          llmErrMsg = `${llmErrMsg}: ${detail}`;
        } catch {
          llmErrMsg = `${llmErrMsg}: ${llmErr.responseBody}`;
        }
      }
      try {
        db.prepare(`UPDATE content SET last_response = ? WHERE id = ?`).run(llmErrMsg, item.id);
      } catch {}
      if (llmErr instanceof Error) {
        llmErr.message = llmErrMsg;
      }
      throw llmErr;
    }

    // Extract JSON payload safely from response (strip thinking tokens or backticks if any)
    const cleanedText = rawOutput
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      try {
        db.prepare(`UPDATE content SET last_response = ? WHERE id = ?`).run(rawOutput, item.id);
      } catch {}
      throw new Error(`LLM output did not contain valid JSON: ${cleanedText.slice(0, 150)}`);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      try {
        db.prepare(`UPDATE content SET last_response = ? WHERE id = ?`).run(rawOutput, item.id);
      } catch {}
      throw new Error(`JSON parsing failed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
    }

    validatedAnalysis = ProcessedAnalysisSchema.parse(parsedJson);
  }

  // Step 5: Cluster completed article into active stories / threads
  try {
    const tClusterStart = Date.now();
    const { clusterArticleIntoStory } = await import("./story_clusterer");
    clusterArticleIntoStory(item.id);
    clusterTimeMs = Date.now() - tClusterStart;
  } catch (err) {
    console.error(`[Agent] Failed to cluster content #${item.id} into story:`, err);
  }

  const totalTimeMs = Date.now() - itemStartTime;
  const stageTimings = {
    scout: scoutTimeMs,
    embed: embedTimeMs,
    reader: readerTimeMs,
    organiser: clusterTimeMs,
    total: totalTimeMs,
  };

  // Step 6: Save parsed JSON results and timing logs to the database and mark 'completed'
  const activeVersions = getActivePromptVersions();
  db.prepare(
    `UPDATE content
     SET status = 'completed',
         analysis_json = @analysis_json,
         reader_version = @reader_version,
         reader_status = 'completed',
         error_message = NULL,
         last_prompt = @last_prompt,
         last_response = @last_response,
         processing_time_ms = @processing_time_ms,
         stage_timings = @stage_timings,
         updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id: item.id,
    analysis_json: JSON.stringify(validatedAnalysis),
    reader_version: activeVersions.reader.version,
    last_prompt: promptRecord,
    last_response: rawOutput,
    processing_time_ms: totalTimeMs,
    stage_timings: JSON.stringify(stageTimings),
  });

  console.log(
    `[Agent] Completed content #${item.id} in ${(totalTimeMs / 1000).toFixed(2)}s (Reader: ${(readerTimeMs / 1000).toFixed(2)}s, Embed: ${(embedTimeMs / 1000).toFixed(2)}s, Organiser: ${(clusterTimeMs / 1000).toFixed(2)}s): "${validatedAnalysis.title}" (score=${validatedAnalysis.relevanceScore})`
  );

  return validatedAnalysis;
}

let isTickRunning = false;

/**
 * Runs one check for pending content rows in SQLite.
 * Processes items in batches according to CONFIG.AGENT.BATCH_SIZE.
 */
export async function pollPendingContentOnce(): Promise<boolean> {
  if (isTickRunning) {
    return false;
  }

  // Check if background processing is paused by the user
  const isPaused = getSetting<boolean>("backgroundProcessingPaused", false);
  if (isPaused) {
    return false;
  }

  isTickRunning = true;

  try {
    // Periodically recover any tasks stalled longer than 5 minutes
    cleanupStaleProcessingItems(5);

    const batch = claimPendingContentBatch(CONFIG.AGENT.BATCH_SIZE);
    if (batch.length === 0) {
      return false;
    }

    console.log(
      `[Agent] Claimed batch of ${batch.length} pending content item(s) for pipeline execution.`
    );

    for (const item of batch) {
      try {
        await processSingleContentItem(item);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[Agent] Failed processing content #${item.id}: ${errorMessage}`
        );

        db.prepare(
          `UPDATE content
           SET status = 'failed',
               error_message = @error_message,
               updated_at = datetime('now')
           WHERE id = @id`
        ).run({
          id: item.id,
          error_message: errorMessage,
        });
      }
    }

    return true;
  } finally {
    isTickRunning = false;
  }
}

/**
 * Starts the continuous timer that polls SQLite for pending rows.
 */
export function startAgentPollingLoop(
  intervalMs: number = CONFIG.AGENT.POLL_INTERVAL_MS
): NodeJS.Timeout {
  const settings = getActiveModelSettings();
  console.log(
    `[Agent] Starting continuous polling loop (interval=${intervalMs}ms, LLM Base URL=${settings.llmBaseUrl})`
  );
  console.log(
    `[Agent] Embedding Model: ${settings.embeddingModel} | LLM: ${settings.llmModel}`
  );

  // Clean up any orphaned processing states left from previous process crashes/restarts
  cleanupStaleProcessingItems(0);

  // Trigger an initial check immediately, then continue on setInterval
  void pollPendingContentOnce();

  return setInterval(() => {
    void pollPendingContentOnce();
  }, intervalMs);
}

const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("src/agent/index.ts") ||
    process.argv[1].endsWith("src/agent"));

if (isMainModule) {
  const timer = startAgentPollingLoop();

  const shutdown = () => {
    console.log("[Agent] Shutting down polling loop...");
    clearInterval(timer);
    db.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

