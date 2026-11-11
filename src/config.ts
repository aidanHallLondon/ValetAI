/**
 * System-wide configuration constants.
 * Centralizes all magic numbers, timeouts, limits, and URL endpoints.
 */

export const CONFIG = {
  // Server & Networking
  SERVER: {
    DEFAULT_PORT: 3001,
    DEFAULT_HOST: "localhost",
  },

  // LM Studio Local Inference
  LM_STUDIO: {
    DEFAULT_BASE_URL: "http://localhost:1234/v1",
    DEFAULT_API_KEY: "lm-studio",
    MODELS: {
      EMBEDDING: "text-embedding-bge-m3",
      LLM: "mlabonne_qwen3-14b-abliterated",
    },
    DEFAULT_CONTEXT_WINDOW: 40960,
    DEFAULT_LIVE_TRACE: true,
    DEFAULT_TRACE_MAX_CHARS: 8000,
    DEFAULT_SYSTEM_PROMPT:
      "You are Valet, a local personal intelligence analyst.\nAnalyze the primary plain-text document below (retrieved from the vector store) and synthesize structured intelligence.",
    DEFAULT_RELEVANCE_RUBRIC:
      "Score relevance from 0 to 100 based on genuine importance, depth, and actionable insight:\n" +
      "• 0-35: Trivial news, celebrity gossip, routine wire filler, promotional fluff, clickbait.\n" +
      "• 36-65: General interest news, standard company announcements, routine economic indicators.\n" +
      "• 66-84: High-value analysis, major technological or industry milestones, significant legal/market shifts.\n" +
      "• 85-100: Critical breakthroughs, transformative innovations, vital strategic intelligence.",
    DEFAULT_PROMPT_TEMPLATE:
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
      "}",
    DEFAULT_CATEGORIES: [
      "technology",
      "research",
      "finance",
      "personal",
      "general",
    ],
    DEFAULT_SENTIMENTS: ["positive", "neutral", "negative", "critical"],
    DEFAULT_CLUSTERER_SYSTEM_PROMPT:
      "You are Valet Story Synthesizer. Compare multiple reporting sources for a developing story and synthesize a unified, objective intelligence briefing with key distinctions noted.",
    DEFAULT_CLUSTERER_PROMPT_TEMPLATE:
      "{{systemPrompt}}\n\n" +
      "=== SOURCE COVERAGE TO COLLATE ===\n" +
      "{{articlesText}}\n\n" +
      "Respond strictly in JSON with unified title, composite summary, and noted coverage discrepancies:\n" +
      '{\n  "title": string,\n  "summary": string,\n  "discrepancies": string[]\n}',
    DEFAULT_PROMPT_AUDITOR_SYSTEM_PROMPT:
      "You are Valet Prompt Quality Auditor, an expert in local LLM prompt engineering. Review agent prompts for token syntax correctness, schema compliance, clarity, and potential hallucination risks. Provide concise, actionable suggestions.",
    DEFAULT_CURATOR_SYSTEM_PROMPT:
      "You are Valet Taxonomy Curator, an expert librarian and knowledge ontologist. Analyze articles, topics, and key entities across the library to identify coherent macro categories, eliminate redundant tags, merge synonyms, and keep the topic hierarchy structured and informative.",
    DEFAULT_SCOUT_MODEL: "chaoliangUNSW/jev-style-qwen3.5-2b-decision",
    DEFAULT_SCOUT_ENABLED: true,
    DEFAULT_SCOUT_MIN_SCORE: 35,
    DEFAULT_SCOUT_SYSTEM_PROMPT:
      "You are Valet Scout, a high-speed news triage classifier.\n" +
      "Quickly determine if the incoming news article should be KEPT for deep reading or DISCARDED as noise.\n\n" +
      "FILTERING RULES:\n" +
      "1. DISCARD: General sports match reports, league commentary, scores, transfers, unless matching user-whitelisted teams or sports.\n" +
      "2. DISCARD: Celebrity gossip, reality TV, entertainment drama, red carpet scandals.\n" +
      "3. DISCARD: Promotional PR fluff, affiliate shopping lists, horoscopes, clickbait headlines.\n" +
      "4. DISCARD: State-sponsored propaganda or generic news wire syndication filler.\n" +
      "5. KEEP: Geopolitical developments, AI & technology breakthroughs, scientific discoveries, defense, macroeconomic trends, and any topics matching User Directives.\n\n" +
      "USER PERSONAL DIRECTIVES:\n" +
      "{{userDirectives}}",
    DEFAULT_SCOUT_PROMPT_TEMPLATE:
      "{{systemPrompt}}\n\n" +
      "=== INCOMING ARTICLE TO EVALUATE ===\n" +
      "Title: {{articleTitle}}\n" +
      "Source: {{articleSource}}\n" +
      "Content Preview: {{articlePreview}}\n\n" +
      "Respond strictly in raw JSON (no conversational prose, no markdown codeblocks):\n" +
      "{\n" +
      '  "pass": boolean,\n' +
      '  "reason": string,\n' +
      '  "category": string,\n' +
      '  "relevanceScore": number\n' +
      "}",
    DEFAULT_USER_PREFERENCES_NOTES:
      "Prioritise important news:\n" +
      "- Global geopolitics, international defense, and foreign policy\n" +
      "- Cutting-edge AI, machine learning breakthroughs, and robotics\n" +
      "- Macroeconomics, monetary policy, and market analysis\n" +
      "- Strictly filter out routine football and sports coverage, except: [I am huge Wrexham fan]\n" +
      "- Strictly filter out celebrity gossip, red carpets, and tabloid entertainment",
    DEFAULT_ASSISTANT_SYSTEM_PROMPT:
      "You are Valet Assistant, the personal intelligence advisor.\n" +
      "Your role is to analyze the user's 'About Me' profile, reading logs, up/down votes, and active news sources to synthesize a concise, non-conflicting Master Guidance Directive that guides the Scout gatekeeper and Deep Reader bots.",
    DEFAULT_ASSISTANT_PROMPT_TEMPLATE:
      "Synthesize a tightly formulated Master Guidance Directive (approx 150-250 words) that explicitly covers:\n" +
      "1. Primary Focus Areas (topics, regions, teams, or technologies to prioritize)\n" +
      "2. Strict Exclusions (sports, celebrity gossip, fluff, propaganda to discard)\n" +
      "3. Special Exceptions (e.g. preserving favorite teams or towns despite general exclusions)\n" +
      "4. Tone and Depth expectations.",
    DEFAULT_ASSISTANT_MASTER_DIRECTIVE:
      "Prioritize strategic geopolitics, AI research breakthroughs, macroeconomic indicators, and news from home region. Aggressively filter out general league football, athletics, and celebrity entertainment gossip, but explicitly preserve and boost Wrexham AFC coverage.",
    DEFAULT_ASSISTANT_SUPERVISOR_PROMPT:
      "You are Valet Supervisor (Quality Guardian & Prompt Sentinel). Review the user's personal directives and the Assistant's synthesized guidance for clarity, internal contradictions, unfilled placeholders (like {insert town here}), and actionable instructions for Scout and Reader.",
  },

  // Database & SQLite
  DATABASE: {
    FILE_NAME: "valet.db",
    DATA_DIR: "data",
    BUSY_TIMEOUT_MS: 5000,
    EMBEDDING_DIMENSIONS: 1024,
  },

  // Agent Processor
  AGENT: {
    POLL_INTERVAL_MS: 5000,
    BATCH_SIZE: 5,
    RAG_TOP_K: 3,
    MAX_CONTEXT_SNIPPET_LENGTH: 1500,
  },

  // Gatherer Worker
  GATHERER: {
    FETCH_TIMEOUT_MS: 15000,
    CONCURRENCY: 4,
    MAX_TEXT_LENGTH: 5000,
    USER_AGENT: "Valet-Personal-Intelligence-Hub/1.0",
    ACCEPT_HEADER:
      "text/html,application/xhtml+xml,application/xml,application/json,text/plain,*/*",
  },

  // UI Polling & Limits
  UI: {
    POLL_INTERVAL_MS: 4000,
    RECENT_ITEMS_LIMIT: 100,
    PREVIEW_TEXT_LIMIT: 180,
    TAGS_PREVIEW_LIMIT: 5,
    VALIDATION: {
      SOURCE_NAME_MIN_LENGTH: 2,
      SOURCE_NAME_MAX_LENGTH: 60,
    },
  },
} as const;

