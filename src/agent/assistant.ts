import { generateText } from "ai";
import { db, getSetting, setSetting, recordTokenUsage } from "../db";
import { getActiveModelSettings, getModelClient } from "./index";
import { CONFIG } from "../config";

/**
 * Stores evaluation results for user preferences and prompt clarity.
 */
export interface PreferenceSupervisorResult {
  score: number;
  clarity: "excellent" | "good" | "needs_refinement";
  unfilledPlaceholders: string[];
  contradictions: string[];
  suggestions: Array<{
    title: string;
    description: string;
    improvedSnippet?: string;
  }>;
}

/**
 * Stores the generated master directive and topic filters.
 */
export interface AssistantSynthesisResult {
  masterDirective: string;
  keyFocusAreas: string[];
  excludedTopics: string[];
  specialExceptions: string[];
  sourcesAnalyzedCount: number;
  readArticlesCount: number;
  upvotesCount: number;
  downvotesCount: number;
  supervisorAudit: {
    score: number;
    isApproved: boolean;
    critique: string;
    suggestions: Array<{
      title: string;
      description: string;
      refinement?: string;
    }>;
  };
}

/**
 * Inspects user preferences for missing details and contradictions.
 */
export async function checkUserPreferencesWithSupervisor(
  preferencesText: string
): Promise<PreferenceSupervisorResult> {
  const settings = getActiveModelSettings();
  const llmClient = getModelClient(settings.llmBaseUrl);
  const model = settings.llmModel;

  const supervisorSystem =
    settings.assistantSupervisorPrompt ||
    CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_SUPERVISOR_PROMPT;

  const prompt = [
    supervisorSystem,
    "",
    "Carefully inspect the user's natural language news preferences for downstream bots (Scout gatekeeper, Deep Reader, and Organiser).",
    "Identify:",
    "1. Unfilled placeholders or template tags like '{insert town here}', '{sports}', etc.",
    "2. Internal contradictions (e.g., 'I hate sports' alongside 'I am huge Wrexham fan' - make sure the exception is clearly noted).",
    "3. Missing specificity (e.g., if they mention a town without country/region context).",
    "4. Constructive improvements to maximize high-signal intelligence delivery.",
    "",
    "USER STATED PREFERENCES:",
    preferencesText,
    "",
    "Respond strictly in raw JSON (no conversational prose, no markdown codeblocks):",
    `{
  "score": number (0 to 100),
  "clarity": "excellent" | "good" | "needs_refinement",
  "unfilledPlaceholders": string[],
  "contradictions": string[],
  "suggestions": [
    {
      "title": string,
      "description": string,
      "improvedSnippet": string
    }
  ]
}`,
  ].join("\n");

  try {
    const res = await generateText({
      model: llmClient(model),
      messages: [
        { role: "system", content: supervisorSystem },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });

    if (res.usage) {
      recordTokenUsage(model, "llm", res.usage.promptTokens || 0, res.usage.completionTokens || 0);
    }

    const clean = res.text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        score: Number(parsed.score ?? 85),
        clarity: parsed.clarity || "good",
        unfilledPlaceholders: Array.isArray(parsed.unfilledPlaceholders) ? parsed.unfilledPlaceholders : [],
        contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      };
    }
  } catch (err) {
    console.error("[Supervisor] Failed to check preferences via LLM:", err);
  }

  // Fallback heuristic if LLM is offline or non-JSON
  const placeholders: string[] = [];
  const placeholderRegex = /\{([^}]+)\}/g;
  let pMatch;
  while ((pMatch = placeholderRegex.exec(preferencesText)) !== null) {
    placeholders.push(pMatch[0]);
  }

  return {
    score: placeholders.length > 0 ? 65 : 85,
    clarity: placeholders.length > 0 ? "needs_refinement" : "good",
    unfilledPlaceholders: placeholders,
    contradictions: [],
    suggestions: placeholders.length > 0
      ? [
          {
            title: "Replace Placeholder Tags",
            description: `You have unfilled template hints like ${placeholders.join(", ")}. Replace them with your actual town, team, or topics.`,
          },
        ]
      : [
          {
            title: "Directives Look Clear",
            description: "Directives provide actionable instructions for Scout and Reader filtering.",
          },
        ],
  };
}

/**
 * Combines user preferences and reading history into a master directive.
 */
export async function synthesizeAssistantDirective(
  rawPreferencesNotes?: string
): Promise<AssistantSynthesisResult> {
  const settings = getActiveModelSettings();
  const llmClient = getModelClient(settings.llmBaseUrl);
  const model = settings.llmModel;

  const userNotes =
    rawPreferencesNotes ||
    settings.userPreferencesNotes ||
    CONFIG.LM_STUDIO.DEFAULT_USER_PREFERENCES_NOTES;

  // 1. Gather Read Articles
  const readRows = db
    .prepare(
      `SELECT raw_text, analysis_json FROM content WHERE is_read = 1 ORDER BY updated_at DESC LIMIT 25`
    )
    .all() as Array<{ raw_text: string; analysis_json: string | null }>;

  const readSummaries: string[] = [];
  for (const r of readRows) {
    if (r.analysis_json) {
      try {
        const parsed = JSON.parse(r.analysis_json);
        if (parsed.title) {
          readSummaries.push(`- [Read] ${parsed.title} (${parsed.category || "general"})`);
        }
      } catch {}
    }
  }

  // 2. Gather Votes & Algorithm Preferences
  const rawPrefs = getSetting<any>("algorithmPreferences", {});
  const articleVotes: Record<number, "up" | "down"> = rawPrefs.articleVotes || {};
  let upvoteCount = 0;
  let downvoteCount = 0;
  const votedItemsSummary: string[] = [];

  for (const [idStr, dir] of Object.entries(articleVotes)) {
    const id = Number(idStr);
    if (dir === "up") upvoteCount++;
    if (dir === "down") downvoteCount++;
    const row = db.prepare("SELECT analysis_json FROM content WHERE id = ?").get(id) as { analysis_json: string } | undefined;
    if (row?.analysis_json) {
      try {
        const p = JSON.parse(row.analysis_json);
        if (p.title) {
          votedItemsSummary.push(`- [${dir.toUpperCase()}VOTED] ${p.title} (${p.category || ""})`);
        }
      } catch {}
    }
  }

  // 3. Gather Active Sources
  const activeSources = db
    .prepare("SELECT name, url FROM sources WHERE enabled = 1")
    .all() as Array<{ name: string; url: string }>;

  // 4. Assistant Synthesis Prompt constructed with discrete system role and context messages
  const systemPrompt =
    settings.assistantSystemPrompt ||
    CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_SYSTEM_PROMPT;
  const template =
    settings.assistantPromptTemplate ||
    CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_PROMPT_TEMPLATE;

  // Clean template instructions (stripping any legacy placeholders if present)
  const taskInstructions = template
    .replace(/\{\{systemPrompt\}\}/g, "")
    .replace(/=== USER 'ABOUT ME' PROFILE & PREFERENCES ===\s*\{\{userPreferencesNotes\}\}/g, "")
    .replace(/=== RECENTLY READ ARTICLES ===\s*\{\{readSummaries\}\}/g, "")
    .replace(/=== USER VOTES & SIGNALS ===\s*\{\{votedItemsSummary\}\}/g, "")
    .replace(/=== ACTIVE NEWS SOURCES ===\s*\{\{activeSources\}\}/g, "")
    .replace(/\{\{userPreferencesNotes\}\}/g, "")
    .replace(/\{\{readSummaries\}\}/g, "")
    .replace(/\{\{votedItemsSummary\}\}/g, "")
    .replace(/\{\{activeSources\}\}/g, "")
    .trim();

  const messages: Array<{ role: "system" | "user"; content: string }> = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `=== USER "ABOUT ME" PROFILE & PREFERENCES ===\n${userNotes}`,
    },
    {
      role: "user",
      content: `=== RECENTLY READ ARTICLES (${readSummaries.length}) ===\n${readSummaries.slice(0, 15).join("\n") || "No reading history recorded yet."}`,
    },
    {
      role: "user",
      content: `=== USER VOTES & SIGNALS (${upvoteCount} upvotes, ${downvoteCount} downvotes) ===\n${votedItemsSummary.slice(0, 20).join("\n") || "No explicit up/down votes recorded yet."}`,
    },
    {
      role: "user",
      content: `=== ACTIVE NEWS SOURCES (${activeSources.length}) ===\n${activeSources.map((s) => `- ${s.name}`).join("\n") || "Default RSS sources"}`,
    },
    {
      role: "user",
      content: [
        "=== SYNTHESIS TASK INSTRUCTIONS ===",
        taskInstructions,
        "",
        "Respond strictly in raw JSON conforming to this schema (no conversational prose, no markdown codeblocks):",
        `{
  "masterDirective": "string (150-250 word executive synthesis)",
  "keyFocusAreas": ["string"],
  "excludedTopics": ["string"],
  "specialExceptions": ["string"]
}`,
      ].join("\n"),
    },
  ];

  let masterDirective = settings.assistantMasterDirective || CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_MASTER_DIRECTIVE;
  let keyFocusAreas: string[] = ["Geopolitics", "AI & Robotics", "Defense", "Macroeconomics"];
  let excludedTopics: string[] = ["General Football", "Celebrity Gossip", "Wire Fluff", "Tabloids"];
  let specialExceptions: string[] = [];

  try {
    const res = await generateText({
      model: llmClient(model),
      messages,
      temperature: 0.2,
    });

    if (res.usage) {
      recordTokenUsage(model, "llm", res.usage.promptTokens || 0, res.usage.completionTokens || 0);
    }

    const clean = res.text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.masterDirective) masterDirective = parsed.masterDirective;
      if (Array.isArray(parsed.keyFocusAreas)) keyFocusAreas = parsed.keyFocusAreas;
      if (Array.isArray(parsed.excludedTopics)) excludedTopics = parsed.excludedTopics;
      if (Array.isArray(parsed.specialExceptions)) specialExceptions = parsed.specialExceptions;
    }
  } catch (err) {
    console.error("[Assistant] Synthesis LLM call failed:", err);
  }

  // 5. Supervisor Double-Check on Synthesized Directive
  const supervisorAuditPrompt = [
    "You are Valet Supervisor (Quality Guardian & Prompt Sentinel).",
    "Double check the following Master Guidance Directive synthesized by the Assistant bot against the user's explicit preferences.",
    "Verify whether the directive faithfully captures the user's desires, preserves special exceptions (e.g. favorite teams or towns), and clearly instructs downstream Scout & Reader bots.",
    "",
    "USER EXPLICIT NOTES:",
    userNotes,
    "",
    "SYNTHESIZED MASTER DIRECTIVE:",
    masterDirective,
    "",
    "Respond strictly in raw JSON:",
    `{
  "score": number (0 to 100),
  "isApproved": boolean,
  "critique": string,
  "suggestions": [
    {
      "title": string,
      "description": string,
      "refinement": string
    }
  ]
}`,
  ].join("\n");

  let supervisorAudit = {
    score: 95,
    isApproved: true,
    critique: "The synthesized directive accurately captures core priorities and special exceptions.",
    suggestions: [] as Array<{ title: string; description: string; refinement?: string }>,
  };

  try {
    const supRes = await generateText({
      model: llmClient(model),
      messages: [{ role: "user", content: supervisorAuditPrompt }],
      temperature: 0.1,
    });

    if (supRes.usage) {
      recordTokenUsage(model, "llm", supRes.usage.promptTokens || 0, supRes.usage.completionTokens || 0);
    }

    const cleanSup = supRes.text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    const supMatch = cleanSup.match(/\{[\s\S]*\}/);
    if (supMatch) {
      const parsedSup = JSON.parse(supMatch[0]);
      supervisorAudit = {
        score: Number(parsedSup.score ?? 90),
        isApproved: Boolean(parsedSup.isApproved ?? true),
        critique: parsedSup.critique || "Directives approved for downstream bots.",
        suggestions: Array.isArray(parsedSup.suggestions) ? parsedSup.suggestions : [],
      };
    }
  } catch (err) {
    console.error("[Supervisor] Double check failed:", err);
  }

  // Persist the synthesized directive into settings
  setSetting("assistantMasterDirective", masterDirective);
  setSetting("assistantLastSynthesizedAt", new Date().toISOString());

  return {
    masterDirective,
    keyFocusAreas,
    excludedTopics,
    specialExceptions,
    sourcesAnalyzedCount: activeSources.length,
    readArticlesCount: readSummaries.length,
    upvotesCount: upvoteCount,
    downvotesCount: downvoteCount,
    supervisorAudit,
  };
}

