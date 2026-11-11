import { z } from "zod";
import { CONFIG } from "../config";

/**
 * Defines valid status states for a content record in SQLite.
 */
export const ContentStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "triage_discarded",
]);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

/**
 * Defines the structured JSON output schema from the LLM.
 */
export const ProcessedAnalysisSchema = z.object({
  title: z.string().describe("Concise, informative title summarizing the content"),
  summary: z.string().describe("Executive summary of the key facts and insights"),
  category: z
    .string()
    .default("general")
    .describe("Primary domain or topic classification"),
  sentiment: z
    .enum(["positive", "neutral", "negative", "critical"])
    .describe("Overall tone of the content"),
  keyEntities: z
    .array(z.string())
    .describe("Notable people, organizations, models, or concepts mentioned"),
  actionItems: z
    .array(z.string())
    .describe("Recommended follow-up actions or takeaways for the user"),
  relevanceScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Estimated personal intelligence relevance score from 0 to 100"),
});
export type ProcessedAnalysis = z.infer<typeof ProcessedAnalysisSchema>;

/**
 * Defines the database row structure for the sources table.
 */
export const SourceRecordSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  url: z.string().url(),
  type: z.enum(["rss", "web", "json"]).default("web"),
  enabled: z.union([z.boolean(), z.number().int()]).transform((val) => Boolean(val)),
  description: z.string().nullable().optional(),
  site_url: z.string().nullable().optional(),
  last_fetch_count: z.number().int().default(0).optional(),
  last_fetched_at: z.string().nullable(),
  created_at: z.string(),
});
export type SourceRecord = z.infer<typeof SourceRecordSchema>;

/**
 * Validates user input when adding a new source in the UI.
 */
export const CreateSourceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      CONFIG.UI.VALIDATION.SOURCE_NAME_MIN_LENGTH,
      `Source name must be at least ${CONFIG.UI.VALIDATION.SOURCE_NAME_MIN_LENGTH} characters`
    )
    .max(
      CONFIG.UI.VALIDATION.SOURCE_NAME_MAX_LENGTH,
      `Source name cannot exceed ${CONFIG.UI.VALIDATION.SOURCE_NAME_MAX_LENGTH} characters`
    ),
  url: z.string().trim().url("Must be a valid HTTP/HTTPS URL"),
  type: z.enum(["rss", "web", "json"]).default("web"),
  description: z.string().max(1000).optional(),
  site_url: z.string().url().optional(),
});
export type CreateSourceInput = z.infer<typeof CreateSourceInputSchema>;

/**
 * Defines system settings for models, prompts, and server endpoints.
 */
export const ModelSettingsSchema = z.object({
  llmBaseUrl: z.string().trim().url(),
  llmModel: z.string().trim().min(1),
  llmApiKey: z.string().default("lm-studio"),
  useCommonServerForThinking: z.boolean().default(true),
  thinkingBaseUrl: z.string().default(""),
  thinkingApiKey: z.string().default(""),
  useCommonServerForFast: z.boolean().default(true),
  scoutBaseUrl: z.string().default(""),
  scoutApiKey: z.string().default(""),
  useCommonServerForEmbedding: z.boolean().default(true),
  embeddingsBaseUrl: z.string().trim().default(""),
  embeddingsApiKey: z.string().default(""),
  useCustomEmbeddingsEndpoint: z.boolean().default(false),
  embeddingModel: z.string().trim().min(1),
  contextWindow: z.number().int().min(1024).max(131072).default(40960),
  liveTraceEnabled: z.boolean().default(true),
  traceMaxChars: z.number().int().min(500).max(50000).default(8000),
  // Dynamic prompts & taxonomy
  systemPrompt: z
    .string()
    .default(
      "You are Valet, a local personal intelligence analyst.\nAnalyze the primary plain-text document below (retrieved from the vector store) and synthesize structured intelligence."
    ),
  relevanceRubric: z
    .string()
    .default(
      "Score relevance from 0 to 100 based on genuine importance, depth, and actionable insight:\n" +
      "• 0-35: Trivial news, celebrity gossip, routine wire filler, promotional fluff, clickbait.\n" +
      "• 36-65: General interest news, standard company announcements, routine economic indicators.\n" +
      "• 66-84: High-value analysis, major technological or industry milestones, significant legal/market shifts.\n" +
      "• 85-100: Critical breakthroughs, transformative innovations, vital strategic intelligence."
    ),
  promptTemplate: z
    .string()
    .default(
      "{{systemPrompt}}\n\n" +
      "=== PRIMARY DOCUMENT PLAIN TEXT ===\n" +
      "{{primaryPlainText}}\n\n" +
      "=== RELATED HISTORICAL MEMORY PLAIN TEXT (RETRIEVED VIA SQLITE-VEC) ===\n" +
      "{{relatedContextPlainText}}\n\n" +
      "=== RELEVANCE SCORING CRITERIA ===\n" +
      "{{relevanceRubric}}\n\n" +
      "You MUST respond ONLY with valid, raw JSON (no conversational prose, no markdown codeblocks like ```json).\n" +
      "JSON format must strictly adhere to:\n" +
      "{\n" +
      '  "title": string,\n' +
      '  "summary": string,\n' +
      '  "category": {{categoriesList}},\n' +
      '  "sentiment": {{sentimentsList}},\n' +
      '  "keyEntities": string[],\n' +
      '  "actionItems": string[],\n' +
      '  "relevanceScore": number (0 to 100)\n' +
      "}"
    ),
  categories: z
    .array(z.string())
    .default(["technology", "research", "finance", "personal", "general"]),
  sentiments: z
    .array(z.string())
    .default(["positive", "neutral", "negative", "critical"]),
  clustererSystemPrompt: z
    .string()
    .default(
      "You are Valet Story Synthesizer. Compare multiple reporting sources for a developing story and synthesize a unified, objective intelligence briefing with key distinctions noted."
    ),
  clustererPromptTemplate: z
    .string()
    .default(
      "{{systemPrompt}}\n\n" +
      "=== SOURCE COVERAGE TO COLLATE ===\n" +
      "{{articlesText}}\n\n" +
      "Respond strictly in JSON with unified title, composite summary, and noted coverage discrepancies:\n" +
      '{\n  "title": string,\n  "summary": string,\n  "discrepancies": string[]\n}'
    ),
  promptAuditorSystemPrompt: z
    .string()
    .default(
      "You are Valet Prompt Quality Auditor, an expert in local LLM prompt engineering. Review agent prompts for token syntax correctness, schema compliance, clarity, and potential hallucination risks. Provide concise, actionable suggestions."
    ),
  curatorSystemPrompt: z
    .string()
    .default(
      "You are Valet Taxonomy Curator, an expert librarian and knowledge ontologist. Analyze articles, topics, and key entities across the library to identify coherent macro categories, eliminate redundant tags, merge synonyms, and keep the topic hierarchy structured and informative."
    ),
  // Scout Gatekeeper Bot Settings
  scoutEnabled: z.boolean().default(true),
  scoutModel: z.string().default(CONFIG.LM_STUDIO.DEFAULT_SCOUT_MODEL || "chaoliangUNSW/jev-style-qwen3.5-2b-decision"),
  scoutMinScore: z.number().int().min(0).max(100).default(35),
  scoutSystemPrompt: z
    .string()
    .default(CONFIG.LM_STUDIO.DEFAULT_SCOUT_SYSTEM_PROMPT),
  scoutPromptTemplate: z
    .string()
    .default(CONFIG.LM_STUDIO.DEFAULT_SCOUT_PROMPT_TEMPLATE),
  // Reader Generative Rewriting Toggle (defaults to false for instant ingestion)
  readerRewriteEnabled: z.boolean().default(false),
  // Assistant Bot & User Persona Settings
  userPreferencesNotes: z
    .string()
    .default(CONFIG.LM_STUDIO.DEFAULT_USER_PREFERENCES_NOTES),
  assistantSystemPrompt: z
    .string()
    .default(CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_SYSTEM_PROMPT),
  assistantPromptTemplate: z
    .string()
    .default(CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_PROMPT_TEMPLATE),
  assistantMasterDirective: z
    .string()
    .default(CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_MASTER_DIRECTIVE),
  assistantSupervisorPrompt: z
    .string()
    .default(CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_SUPERVISOR_PROMPT),
});
export type ModelSettings = z.infer<typeof ModelSettingsSchema>;

/**
 * Stores model metadata returned by LM Studio and endpoint checks.
 */
export interface LoadedModelMetadata {
  id: string;
  displayName?: string;
  type?: "llm" | "embedding" | "unknown";
  architecture?: string;
  contextLength?: number;
  maxContextLength?: number;
  paramsString?: string;
  quantization?: string;
  status?: string;
}

/**
 * Defines the database row structure for clustered story records.
 */
export const StoryRecordSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  representative_content_id: z.number().int().nullable().optional(),
  is_ai_synthesized: z.union([z.boolean(), z.number()]).transform(Boolean).default(false),
  is_followed: z.union([z.boolean(), z.number()]).transform(Boolean).default(false),
  article_count: z.number().int().default(1),
  first_published_at: z.string(),
  last_updated_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type StoryRecord = z.infer<typeof StoryRecordSchema>;

/**
 * Defines the database row structure for the content table.
 */
export const ContentRecordSchema = z.object({
  id: z.number().int().positive(),
  source_id: z.number().int().nullable(),
  source_url: z.string().nullable(),
  canonical_url: z.string().nullable().optional(),
  story_id: z.number().int().nullable().optional(),
  raw_text: z.string(),
  content_hash: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  status: ContentStatusSchema.default("pending"),
  is_read: z.union([z.boolean(), z.number()]).transform(Boolean).default(false),
  analysis_json: z.string().nullable(),
  error_message: z.string().nullable(),
  scout_version: z.string().nullable().optional(),
  scout_status: z.string().nullable().optional(),
  scout_reason: z.string().nullable().optional(),
  scout_score: z.number().int().nullable().optional(),
  reader_version: z.string().nullable().optional(),
  reader_status: z.string().nullable().optional(),
  organiser_version: z.string().nullable().optional(),
  organiser_status: z.string().nullable().optional(),
  curator_version: z.string().nullable().optional(),
  curator_status: z.string().nullable().optional(),
  curated_shelf: z.string().nullable().optional(),
  last_prompt: z.string().nullable().optional(),
  last_response: z.string().nullable().optional(),
  processing_time_ms: z.number().int().nullable().optional(),
  stage_timings: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ContentRecord = z.infer<typeof ContentRecordSchema>;

/**
 * Defines child article summary data inside a story cluster.
 */
export const StoryChildArticleSchema = z.object({
  id: z.number().int(),
  source_id: z.number().int().nullable().optional(),
  source_name: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  source_feed_url: z.string().nullable().optional(),
  title: z.string(),
  summary: z.string().optional(),
  published_at: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
});
export type StoryChildArticle = z.infer<typeof StoryChildArticleSchema>;

/**
 * Defines a content record hydrated with parsed analysis for UI components.
 */
export const HydratedContentRecordSchema = ContentRecordSchema.extend({
  source_name: z.string().nullable().optional(),
  source_type: z.string().nullable().optional(),
  source_feed_url: z.string().nullable().optional(),
  analysis: ProcessedAnalysisSchema.nullable(),
  story_id: z.number().int().nullable().optional(),
  is_followed: z.boolean().optional(),
  is_ai_synthesized: z.boolean().optional(),
  article_count: z.number().int().optional(),
  sources: z.array(z.string()).optional(),
  child_articles: z.array(StoryChildArticleSchema).optional(),
});
export type HydratedContentRecord = z.infer<typeof HydratedContentRecordSchema>;

/**
 * Defines a story record hydrated with child articles for UI components.
 */
export const HydratedStoryRecordSchema = StoryRecordSchema.extend({
  child_articles: z.array(HydratedContentRecordSchema).default([]),
  sources: z.array(z.string()).default([]),
});
export type HydratedStoryRecord = z.infer<typeof HydratedStoryRecordSchema>;

