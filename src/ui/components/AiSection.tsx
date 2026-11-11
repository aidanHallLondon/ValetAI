import React, { useState, useEffect, useRef, useCallback } from "react";
import type { ModelSettings, LoadedModelMetadata } from "../../db/schema";
import type { PricingSettings } from "../../db";
import { CONFIG } from "../../config";
import { PromptAuditorWidget } from "./agents/common/PromptAuditorWidget";
import { BotAvatar } from "./common/BotAvatar";
import { AGENT_BOTS } from "../utils/agents";
import { TokenCostView } from "./common/TokenCostModal";
import { AboutMeTab } from "./agents/AboutMeTab";
import { ScoutAgentTab } from "./agents/ScoutAgentTab";
import { ReaderAgentTab } from "./agents/ReaderAgentTab";
import { OrganiserAgentTab } from "./agents/OrganiserAgentTab";
import { CuratorAgentTab } from "./agents/CuratorAgentTab";
import { AssistantAgentTab } from "./agents/AssistantAgentTab";
import { SupervisorAgentTab } from "./agents/SupervisorAgentTab";
import { AgentPageHeader } from "./agents/common/AgentPageHeader";
import { BotTimingRow } from "./agents/common/BotTimingRow";
import { ServerModelsTable } from "./ai/ServerModelsTable";

export type AiSectionSubTab =
  | "about-me"
  | "server"
  | "models"
  | "usage"
  | "connection"
  | "status"
  | "prompts"
  | "rag"
  | "agent-scout"
  | "agent-analyst"
  | "agent-clusterer"
  | "agent-curator"
  | "agent-assistant"
  | "agent-auditor";

interface AiSectionProps {
  telemetry: any;
  onRefreshTelemetry: () => Promise<void>;
  subTab?: AiSectionSubTab;
  onChangeSubTab?: (tab: AiSectionSubTab) => void;
  onNavigateToLibrary?: (action?: "recluster" | "recurate" | "reread") => void;
}

/**
 * Robust matching between a configured model identifier and a discovered server model.
 * Handles Hugging Face / LM Studio prefixes e.g. "chaoliangUNSW/jev-style-qwen3.5-2b-decision" vs "jev-style-qwen3.5-2b-decision".
 */
export function matchesModelId(targetModel?: string, candidateId?: string, candidateDisplayName?: string): boolean {
  if (!targetModel || !candidateId) return false;
  if (targetModel === candidateId) return true;
  if (candidateDisplayName && targetModel === candidateDisplayName) return true;

  const targetBase = targetModel.split("/").pop()?.trim().toLowerCase();
  const candBase = candidateId.split("/").pop()?.trim().toLowerCase();
  if (targetBase && candBase) {
    if (targetBase === candBase) return true;
    if (targetBase.includes(candBase) || candBase.includes(targetBase)) return true;
  }
  return false;
}

/**
 * Extracts numeric parameter count and assigns visual styling tier.
 * Larger models receive more prominent styling.
 */
export function getModelParamDetails(m: LoadedModelMetadata): { count: number; label: string; tier: "xl" | "lg" | "md" | "sm" } {
  const str = `${m.paramsString || ""} ${m.displayName || ""} ${m.id || ""}`;
  const match = str.match(/(\d+(\.\d+)?)\s*([bm])/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[3].toLowerCase();
    const count = unit === "b" ? val * 1000 : val;
    let tier: "xl" | "lg" | "md" | "sm" = "sm";
    if (count >= 14000) tier = "xl";
    else if (count >= 7000) tier = "lg";
    else if (count >= 1000) tier = "md";
    else tier = "sm";

    const label = `${match[1]}${match[3].toUpperCase()}`;
    return { count, label, tier };
  }
  return { count: 0, label: m.architecture || "—", tier: "sm" };
}

export interface BotAssignment {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
}

/**
 * Returns all agent bots and subsystems assigned to run on the specified model.
 */
export function getBotsUsingModel(
  candidateId: string,
  candidateDisplayName: string | undefined,
  form: ModelSettings
): BotAssignment[] {
  const isThinking = matchesModelId(form.llmModel, candidateId, candidateDisplayName);
  const isFast = matchesModelId(form.scoutModel, candidateId, candidateDisplayName);
  const isEmbed = matchesModelId(form.embeddingModel, candidateId, candidateDisplayName);

  const list: BotAssignment[] = [];

  // Scout triage model
  if (isFast) {
    list.push({
      id: "scout",
      name: "Scout",
      emoji: "🎯",
      color: "#0284c7",
      role: "Fast Feed Gatekeeper & Triage",
    });
  }

  // Thinking generative model
  if (isThinking) {
    // If no separate fast model is assigned or if it matches Thinking LLM, Scout falls back here
    if (!form.scoutModel && !isFast) {
      list.push({
        id: "scout",
        name: "Scout (Fallback)",
        emoji: "🎯",
        color: "#0284c7",
        role: "Triage Gatekeeper (Fallback to Thinking LLM)",
      });
    }
    list.push({
      id: "reader",
      name: "Reader",
      emoji: "📖",
      color: "#3b82f6",
      role: "Analytical Intelligence & Executive Summaries",
    });
    list.push({
      id: "organiser",
      name: "Organiser",
      emoji: "🧵",
      color: "#10b981",
      role: "Story Synthesis & Cluster Narratives",
    });
    list.push({
      id: "curator",
      name: "Curator",
      emoji: "🗂️",
      color: "#8b5cf6",
      role: "Knowledge Ontologist & Archivist",
    });
    list.push({
      id: "assistant",
      name: "Assistant",
      emoji: "🤵",
      color: "#6366f1",
      role: "Personal Preferences & Executive Guidance",
    });
    list.push({
      id: "supervisor",
      name: "Supervisor",
      emoji: "🛡️",
      color: "#f59e0b",
      role: "Prompt Quality Sentinel & Validator",
    });
  }

  // Embedding model
  if (isEmbed) {
    list.push({
      id: "tools",
      name: "Tools / Vector RAG",
      emoji: "📐",
      color: "#059669",
      role: "Vector Search, Deduplication & Semantic Indexing",
    });
  }

  return list;
}

export function AiSection({
  telemetry,
  onRefreshTelemetry,
  subTab = "connection",
  onChangeSubTab,
  onNavigateToLibrary,
}: AiSectionProps) {
  // Normalize subTab ("prompts" alias redirects to "agent-analyst", "connection" redirects to "server")
  const activeSubTab: AiSectionSubTab =
    subTab === "prompts"
      ? "agent-analyst"
      : subTab === "connection"
      ? "server"
      : subTab;

  // Form State initialized from defaults
  const [form, setForm] = useState<ModelSettings>({
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
  });

  // Active sub-page tab for Models page (Thinking LLM, Fast LLM, Embedding, or View All)
  const [activeModelTab, setActiveModelTab] = useState<"all" | "thinking" | "fast" | "embedding">("all");

  // Pricing rates state for in-card model pricing
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);

  const [availableModels, setAvailableModels] = useState<LoadedModelMetadata[]>([]);
  const [isQueryingMeta, setIsQueryingMeta] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    llmOk?: boolean;
    embedOk?: boolean;
  } | null>(null);

  // Individual model connection test states
  const [isTestingFast, setIsTestingFast] = useState(false);
  const [fastTestResult, setFastTestResult] = useState<{ ok: boolean; error?: string; fallback?: boolean; model?: string } | null>(null);
  const [isTestingAnalyst, setIsTestingAnalyst] = useState(false);
  const [analystTestResult, setAnalystTestResult] = useState<{ ok: boolean; error?: string; model?: string } | null>(null);
  const [isTestingEmbed, setIsTestingEmbed] = useState(false);
  const [embedTestResult, setEmbedTestResult] = useState<{ ok: boolean; error?: string; model?: string } | null>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);

  // Autosave and Undo/Redo Engine
  const [history, setHistory] = useState<ModelSettings[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadedRef = useRef(false);

  // New category / sentiment input states
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [newSentimentInput, setNewSentimentInput] = useState("");

  // Re-clustering execution feedback state
  const [isReclustering, setIsReclustering] = useState(false);
  const [reclusterResult, setReclusterResult] = useState<{
    totalContent: number;
    storiesCount: number;
    multiArticleStories: number;
  } | null>(null);

  // Taxonomy Curator state & real library knowledge shelves
  const curatorPromptRef = useRef<HTMLTextAreaElement>(null);
  const [isCurating, setIsCurating] = useState(false);
  const [curatorMessage, setCuratorMessage] = useState<string | null>(null);
  const [curatorData, setCuratorData] = useState<{
    totalArticlesAnalyzed: number;
    totalVectorsScanned: number;
    totalEntitiesConsolidated: number;
    shelves: Array<{
      id: string;
      title: string;
      icon: string;
      description: string;
      articleCount: number;
      topEntities: string[];
      sampleArticles: Array<{ id: number; title: string }>;
    }>;
    lastCuratedAt: string;
  } | null>(null);

  // Fetch real curated knowledge shelves on mount
  useEffect(() => {
    fetch("/api/taxonomy/shelves")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.shelves) {
          setCuratorData(data);
        }
      })
      .catch((err) => console.error("Failed to load curated taxonomy:", err));
  }, []);

  // Bot execution timing benchmarks & resets
  const [botTimings, setBotTimings] = useState<
    Record<
      string,
      {
        count: number;
        avgMs: number | null;
        lastMs: number | null;
        minMs: number | null;
        maxMs: number | null;
        resetAt: string | null;
      }
    >
  >({});
  const [resettingBot, setResettingBot] = useState<string | null>(null);

  const fetchBotTimings = useCallback(async () => {
    try {
      const res = await fetch("/api/telemetry/bot-timings");
      const data = await res.json();
      if (data && data.stats) {
        setBotTimings(data.stats);
      }
    } catch (err) {
      console.error("Failed to load bot timing telemetry:", err);
    }
  }, []);

  useEffect(() => {
    fetchBotTimings();
  }, [fetchBotTimings]);

  const handleResetTiming = async (bot: "scout" | "reader" | "organiser" | "curator" | "all") => {
    setResettingBot(bot);
    try {
      const res = await fetch("/api/telemetry/reset-bot-timing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot }),
      });
      const data = await res.json();
      if (data && data.stats) {
        setBotTimings(data.stats);
      }
    } catch (err) {
      console.error(`Failed to reset bot timing benchmark for ${bot}:`, err);
    } finally {
      setResettingBot(null);
    }
  };

  const renderBotTimingRow = (botKey: "scout" | "reader" | "organiser" | "curator", botName: string) => {
    return (
      <BotTimingRow
        botKey={botKey}
        botName={botName}
        timing={botTimings[botKey]}
        isResetting={resettingBot === botKey || resettingBot === "all"}
        onReset={() => handleResetTiming(botKey)}
      />
    );
  };

  const handleCuratorRun = async () => {
    setIsCurating(true);
    setCuratorMessage(null);
    try {
      const res = await fetch("/api/taxonomy/curate", { method: "POST" });
      const data = await res.json();
      if (data && data.shelves) {
        setCuratorData(data);
        setCuratorMessage(
          `✓ Audited ${data.totalArticlesAnalyzed} articles & ${data.totalVectorsScanned} vectors. Discovered ${data.shelves.length} active shelves and consolidated ${data.totalEntitiesConsolidated} entities.`
        );
      } else {
        throw new Error(data.error || "Failed to curate taxonomy");
      }
    } catch (err) {
      setCuratorMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCurating(false);
    }
  };

  // Assistant bot interactive state
  const [isCheckingPreferences, setIsCheckingPreferences] = useState(false);
  const [preferencesAudit, setPreferencesAudit] = useState<{
    score: number;
    clarity: "excellent" | "good" | "needs_refinement";
    unfilledPlaceholders: string[];
    contradictions: string[];
    suggestions: Array<{ title: string; description: string; improvedSnippet?: string }>;
  } | null>(null);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<{
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
      suggestions: Array<{ title: string; description: string; refinement?: string }>;
    };
  } | null>(null);

  const [assistantToast, setAssistantToast] = useState<string | null>(null);
  const preferencesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Prompt Sandbox state on Auditor page
  const [sandboxPreset, setSandboxPreset] = useState<
    "analyst-system" | "curator-system" | "analyst-template" | "clusterer-template" | "custom"
  >("analyst-template");
  const [sandboxPrompt, setSandboxPrompt] = useState<string>(
    CONFIG.LM_STUDIO.DEFAULT_PROMPT_TEMPLATE
  );
  const [sandboxHistory, setSandboxHistory] = useState<string[]>([
    CONFIG.LM_STUDIO.DEFAULT_PROMPT_TEMPLATE,
  ]);
  const [sandboxHistoryIndex, setSandboxHistoryIndex] = useState(0);

  const updateSandboxPrompt = (newVal: string) => {
    setSandboxPrompt(newVal);
    setSandboxHistory((prev) => [...prev.slice(0, sandboxHistoryIndex + 1), newVal]);
    setSandboxHistoryIndex((prev) => prev + 1);
  };

  const handleSandboxUndo = () => {
    if (sandboxHistoryIndex > 0) {
      const nextIdx = sandboxHistoryIndex - 1;
      setSandboxHistoryIndex(nextIdx);
      setSandboxPrompt(sandboxHistory[nextIdx]);
    }
  };

  const handleSandboxRedo = () => {
    if (sandboxHistoryIndex < sandboxHistory.length - 1) {
      const nextIdx = sandboxHistoryIndex + 1;
      setSandboxHistoryIndex(nextIdx);
      setSandboxPrompt(sandboxHistory[nextIdx]);
    }
  };

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rubricTextareaRef = useRef<HTMLTextAreaElement>(null);
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const clusterPromptRef = useRef<HTMLTextAreaElement>(null);
  const clusterTemplateRef = useRef<HTMLTextAreaElement>(null);
  const auditorPromptRef = useRef<HTMLTextAreaElement>(null);

  // Load existing saved settings and pricing from server
  useEffect(() => {
    fetch("/api/settings/ai")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const loaded: ModelSettings = {
            ...data.settings,
            useCommonServerForThinking:
              data.settings.useCommonServerForThinking ?? true,
            thinkingBaseUrl: data.settings.thinkingBaseUrl || "",
            thinkingApiKey: data.settings.thinkingApiKey || "",
            useCommonServerForFast:
              data.settings.useCommonServerForFast ?? true,
            scoutBaseUrl: data.settings.scoutBaseUrl || "",
            scoutApiKey: data.settings.scoutApiKey || "",
            useCommonServerForEmbedding:
              data.settings.useCommonServerForEmbedding ??
              (data.settings.useCustomEmbeddingsEndpoint ? false : true),
            embeddingsBaseUrl: data.settings.embeddingsBaseUrl || "",
            embeddingsApiKey: data.settings.embeddingsApiKey || "",
            systemPrompt:
              data.settings.systemPrompt || CONFIG.LM_STUDIO.DEFAULT_SYSTEM_PROMPT,
            relevanceRubric:
              data.settings.relevanceRubric || CONFIG.LM_STUDIO.DEFAULT_RELEVANCE_RUBRIC,
            promptTemplate:
              data.settings.promptTemplate || CONFIG.LM_STUDIO.DEFAULT_PROMPT_TEMPLATE,
            categories:
              data.settings.categories || [...CONFIG.LM_STUDIO.DEFAULT_CATEGORIES],
            sentiments:
              data.settings.sentiments || [...CONFIG.LM_STUDIO.DEFAULT_SENTIMENTS],
            clustererSystemPrompt:
              data.settings.clustererSystemPrompt ||
              CONFIG.LM_STUDIO.DEFAULT_CLUSTERER_SYSTEM_PROMPT,
            clustererPromptTemplate:
              data.settings.clustererPromptTemplate ||
              CONFIG.LM_STUDIO.DEFAULT_CLUSTERER_PROMPT_TEMPLATE,
            promptAuditorSystemPrompt:
              data.settings.promptAuditorSystemPrompt ||
              CONFIG.LM_STUDIO.DEFAULT_PROMPT_AUDITOR_SYSTEM_PROMPT,
            curatorSystemPrompt:
              data.settings.curatorSystemPrompt ||
              CONFIG.LM_STUDIO.DEFAULT_CURATOR_SYSTEM_PROMPT,
            assistantPromptTemplate:
              data.settings.assistantPromptTemplate && !data.settings.assistantPromptTemplate.includes("{{systemPrompt}}")
                ? data.settings.assistantPromptTemplate
                : CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_PROMPT_TEMPLATE,
          };
          setForm(loaded);
          setHistory([loaded]);
          setHistoryIndex(0);
          isLoadedRef.current = true;
        }
      })
      .catch((err) => console.error("Failed to load AI settings:", err));

    // Load pricing settings for in-card rate editing
    fetch("/api/telemetry/tokens")
      .then((res) => res.json())
      .then((data) => {
        if (data?.pricing) {
          setPricingSettings(data.pricing);
        }
      })
      .catch(console.error);
  }, []);

  // Update in-card model pricing rates with immediate autosave
  const handleUpdateModelPricing = useCallback(
    (modelName: string, inRate: number, outRate: number) => {
      if (!modelName) return;
      setPricingSettings((prev) => {
        const current: PricingSettings = prev || {
          llmInputPricePerMillion: 0,
          llmOutputPricePerMillion: 0,
          embeddingPricePerMillion: 0,
          currencySymbol: "$",
          perModelRates: {},
        };
        const nextRates = { ...(current.perModelRates || {}) };
        nextRates[modelName] = {
          inputPricePerMillion: inRate,
          outputPricePerMillion: outRate,
        };
        const next = { ...current, perModelRates: nextRates };
        fetch("/api/settings/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(console.error);
        return next;
      });
    },
    []
  );

  // Sync available models from telemetry
  useEffect(() => {
    if (telemetry?.ai?.models) {
      setAvailableModels(telemetry.ai.models);
    }
  }, [telemetry]);

  /**
   * Triggers background autosave to SQLite settings
   */
  const triggerAutosave = useCallback((settingsToSave: ModelSettings) => {
    setSaveStatus("saving");
    fetch("/api/settings/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsToSave),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      })
      .catch(() => setSaveStatus("unsaved"));
  }, []);

  /**
   * Mutates form, appends to Undo/Redo history, and schedules debounced autosave
   */
  const updateForm = useCallback(
    (updater: Partial<ModelSettings> | ((prev: ModelSettings) => ModelSettings)) => {
      setForm((prev) => {
        const next: ModelSettings =
          typeof updater === "function" ? updater(prev) : { ...prev, ...updater };

        // Append to history stack
        setHistory((currHist) => {
          const trimmed = currHist.slice(0, historyIndex + 1);
          trimmed.push(next);
          if (trimmed.length > 50) trimmed.shift();
          return trimmed;
        });
        setHistoryIndex((idx) => Math.min(idx + 1, 49));

        setSaveStatus("unsaved");
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
          triggerAutosave(next);
        }, 700);

        return next;
      });
    },
    [historyIndex, triggerAutosave]
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const targetIdx = historyIndex - 1;
    const targetState = history[targetIdx];
    if (targetState) {
      setHistoryIndex(targetIdx);
      setForm(targetState);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        triggerAutosave(targetState);
      }, 500);
    }
  }, [canUndo, historyIndex, history, triggerAutosave]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const targetIdx = historyIndex + 1;
    const targetState = history[targetIdx];
    if (targetState) {
      setHistoryIndex(targetIdx);
      setForm(targetState);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        triggerAutosave(targetState);
      }, 500);
    }
  }, [canRedo, historyIndex, history, triggerAutosave]);

  // Global Keyboard shortcuts: Cmd+Z (Undo) and Cmd+Shift+Z / Cmd+Y (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  /**
   * Helper to insert dynamic tokens into any textarea
   */
  const handleInsertTokenInto = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    fieldKey: keyof ModelSettings,
    token: string
  ) => {
    const el = ref.current;
    const currentVal = (form[fieldKey] as string) || "";
    if (!el) {
      updateForm({ [fieldKey]: currentVal + `\n${token}` });
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const updated = currentVal.substring(0, start) + token + currentVal.substring(end);
    updateForm({ [fieldKey]: updated });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  const updateField = (key: keyof ModelSettings, value: any) => {
    updateForm({ [key]: value });
  };

  const checkPrefTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkPreferencesWithText = useCallback(async (notes: string) => {
    if (!notes.trim()) return;
    setIsCheckingPreferences(true);
    try {
      const res = await fetch("/api/assistant/check-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      setPreferencesAudit(data);
    } catch (err) {
      console.error("Failed to check preferences:", err);
    } finally {
      setIsCheckingPreferences(false);
    }
  }, []);

  // Debounced auto-check of user preferences with Supervisor
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (checkPrefTimerRef.current) clearTimeout(checkPrefTimerRef.current);
    checkPrefTimerRef.current = setTimeout(() => {
      checkPreferencesWithText(form.userPreferencesNotes || "");
    }, 1000);
    return () => {
      if (checkPrefTimerRef.current) clearTimeout(checkPrefTimerRef.current);
    };
  }, [form.userPreferencesNotes, checkPreferencesWithText]);

  const handleSynthesizeAssistant = async () => {
    setIsSynthesizing(true);
    setAssistantToast(null);
    try {
      const res = await fetch("/api/assistant/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: form.userPreferencesNotes || "" }),
      });
      const data = await res.json();
      setSynthesisResult(data);
      if (data.masterDirective) {
        updateField("assistantMasterDirective", data.masterDirective);
      }
      setAssistantToast("✓ Master Directive synthesized & verified by Supervisor!");
    } catch (err) {
      setAssistantToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleInsertHintTag = (tagText: string) => {
    const current = form.userPreferencesNotes || "";
    const updated = current ? `${current.trim()}\n- ${tagText}` : `- ${tagText}`;
    updateField("userPreferencesNotes", updated);
  };

  const handleApplySuggestion = (snippet: string) => {
    const current = form.userPreferencesNotes || "";
    const updated = `${current.trim()}\n- ${snippet}`;
    updateField("userPreferencesNotes", updated);
  };

  /**
   * Category list handlers
   */
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim().toLowerCase();
    if (trimmed && !form.categories.includes(trimmed)) {
      updateForm({ categories: [...form.categories, trimmed] });
      setNewCategoryInput("");
    }
  };

  const handleRemoveCategory = (cat: string) => {
    updateForm({ categories: form.categories.filter((c) => c !== cat) });
  };

  /**
   * Sentiment list handlers
   */
  const handleAddSentiment = () => {
    const trimmed = newSentimentInput.trim().toLowerCase();
    if (trimmed && !form.sentiments.includes(trimmed)) {
      updateForm({ sentiments: [...form.sentiments, trimmed] });
      setNewSentimentInput("");
    }
  };

  const handleRemoveSentiment = (sent: string) => {
    updateForm({ sentiments: form.sentiments.filter((s) => s !== sent) });
  };

  /**
   * Query metadata for loaded models from server
   */
  const handleRefreshMetadata = async () => {
    setIsQueryingMeta(true);
    try {
      const res = await fetch(
        `/api/settings/ai/metadata?url=${encodeURIComponent(form.llmBaseUrl)}`
      );
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        setAvailableModels(data.models);
      }
    } catch (err) {
      console.error("Failed to query model metadata:", err);
    } finally {
      setIsQueryingMeta(false);
    }
  };

  // Auto-probe models on page entry (Server or Models tab)
  useEffect(() => {
    if (activeSubTab === "server" || activeSubTab === "models") {
      handleRefreshMetadata();
    }
  }, [activeSubTab, form.llmBaseUrl]);

  /**
   * Test a single model connection specifically (fast, analyst, or embedding)
   */
  const handleTestSingleModel = async (target: "fast" | "analyst" | "embedding") => {
    if (target === "fast") {
      setIsTestingFast(true);
      setFastTestResult(null);
    } else if (target === "analyst") {
      setIsTestingAnalyst(true);
      setAnalystTestResult(null);
    } else {
      setIsTestingEmbed(true);
      setEmbedTestResult(null);
    }

    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          llmBaseUrl: form.llmBaseUrl,
          llmModel: form.llmModel,
          llmApiKey: form.llmApiKey,
          useCommonServerForThinking: form.useCommonServerForThinking,
          thinkingBaseUrl: form.thinkingBaseUrl,
          thinkingApiKey: form.thinkingApiKey,
          useCommonServerForFast: form.useCommonServerForFast,
          scoutBaseUrl: form.scoutBaseUrl,
          scoutApiKey: form.scoutApiKey,
          scoutModel: form.scoutModel,
          useCommonServerForEmbedding: form.useCommonServerForEmbedding,
          embeddingsBaseUrl: form.embeddingsBaseUrl,
          embeddingModel: form.embeddingModel,
          embeddingsApiKey: form.embeddingsApiKey,
          useCustomEmbeddingsEndpoint: form.useCustomEmbeddingsEndpoint,
        }),
      });
      const data = await res.json();
      if (target === "fast") {
        setFastTestResult(data.fast);
      } else if (target === "analyst") {
        setAnalystTestResult(data.analyst);
      } else {
        setEmbedTestResult(data.embedding);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (target === "fast") setFastTestResult({ ok: false, error: errMsg });
      else if (target === "analyst") setAnalystTestResult({ ok: false, error: errMsg });
      else setEmbedTestResult({ ok: false, error: errMsg });
    } finally {
      if (target === "fast") setIsTestingFast(false);
      else if (target === "analyst") setIsTestingAnalyst(false);
      else setIsTestingEmbed(false);
    }
  };

  /**
   * Test all connections simultaneously
   */
  const handleTestConnection = async () => {
    setIsTesting(true);
    setIsTestingAll(true);
    setFastTestResult(null);
    setAnalystTestResult(null);
    setEmbedTestResult(null);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "all",
          llmBaseUrl: form.llmBaseUrl,
          llmModel: form.llmModel,
          llmApiKey: form.llmApiKey,
          useCommonServerForThinking: form.useCommonServerForThinking,
          thinkingBaseUrl: form.thinkingBaseUrl,
          thinkingApiKey: form.thinkingApiKey,
          useCommonServerForFast: form.useCommonServerForFast,
          scoutBaseUrl: form.scoutBaseUrl,
          scoutApiKey: form.scoutApiKey,
          scoutModel: form.scoutModel,
          useCommonServerForEmbedding: form.useCommonServerForEmbedding,
          embeddingsBaseUrl: form.embeddingsBaseUrl,
          embeddingModel: form.embeddingModel,
          embeddingsApiKey: form.embeddingsApiKey,
          useCustomEmbeddingsEndpoint: form.useCustomEmbeddingsEndpoint,
        }),
      });
      const data = await res.json();
      setFastTestResult(data.fast);
      setAnalystTestResult(data.analyst);
      setEmbedTestResult(data.embedding);

      const allOk = data.analyst?.ok && data.embedding?.ok && (data.fast?.ok || data.fast?.fallback);
      if (allOk) {
        setTestResult({
          success: true,
          message: "✓ All connections verified! Fast triage, Analyst LLM, and Embeddings responded successfully.",
          llmOk: true,
          embedOk: true,
        });
      } else {
        const errors = [];
        if (!data.analyst?.ok) errors.push(`Analyst: ${data.analyst?.error || "Offline"}`);
        if (!data.fast?.ok && !data.fast?.fallback) errors.push(`Fast: ${data.fast?.error || "Offline"}`);
        if (!data.embedding?.ok) errors.push(`Embedding: ${data.embedding?.error || "Offline"}`);
        setTestResult({
          success: false,
          message: `Connection issues: ${errors.join(" | ")}`,
          llmOk: data.analyst?.ok,
          embedOk: data.embedding?.ok,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `Failed to test connection: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsTesting(false);
      setIsTestingAll(false);
    }
  };

  /**
   * Manual Re-clustering Trigger for Story Clusterer Agent
   */
  const handleReclusterAll = async () => {
    setIsReclustering(true);
    setReclusterResult(null);
    try {
      const res = await fetch("/api/stories/cluster-all", { method: "POST" });
      const data = await res.json();
      if (data.stats) {
        setReclusterResult(data.stats);
      }
    } catch (err) {
      console.error("Failed to recluster content:", err);
    } finally {
      setIsReclustering(false);
    }
  };

  const ai = telemetry?.ai;
  const dbInfo = telemetry?.database;

  return (
    <div className="ai-section-container">
      {/* ====================================================================
          PAGE: SERVER / COMMON SETTINGS
          ==================================================================== */}
      {activeSubTab === "server" && (
        <div className="agent-page-container">
          <AgentPageHeader
            avatarNode={<div style={{ fontSize: "2.2rem", lineHeight: 1 }}>🖥️</div>}
            title="Server Configuration"
            roleDescription="Local Inference Server & Endpoints"
            badgeColor="#2563eb"
            subtitle="Configure common connection settings for your local AI backend (LM Studio, vLLM, or Ollama OpenAI-compatible APIs). Models share these settings by default or define custom endpoints."
          />

          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              triggerAutosave(form);
            }}
          >
            {/* Common Server Base URL & API Key */}
            <div className="admin-card">
              <div className="settings-grid">
                <div className="field-group">
                  <label htmlFor="llm-base-url">
                    <span>Common Server Base URL (OpenAI-compatible)</span>
                    <span className="required-mark">*</span>
                  </label>
                  <input
                    id="llm-base-url"
                    type="url"
                    required
                    value={form.llmBaseUrl}
                    onChange={(e) => updateForm({ llmBaseUrl: e.target.value })}
                    placeholder="http://localhost:1234/v1"
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="llm-api-key">
                    <span>API Key</span>
                    <span className="muted"> (Default: lm-studio)</span>
                  </label>
                  <input
                    id="llm-api-key"
                    type="password"
                    value={form.llmApiKey}
                    onChange={(e) => updateForm({ llmApiKey: e.target.value })}
                    placeholder="lm-studio"
                  />
                </div>
              </div>
            </div>

            {/* Vertical Table of Available Models on Server */}
            <ServerModelsTable
              availableModels={availableModels}
              form={form}
              isQueryingMeta={isQueryingMeta}
              onRefreshMetadata={handleRefreshMetadata}
            />

            {/* Global Test Results Banner */}
            {testResult && (
              <div
                className={
                  testResult.success ? "feedback-banner success" : "feedback-banner error"
                }
                role="alert"
                style={{ marginTop: "1rem" }}
              >
                <strong>{testResult.message}</strong>
              </div>
            )}

            <div className="form-action-footer">
              <button
                type="button"
                className="test-conn-btn"
                onClick={handleTestConnection}
                disabled={isTestingAll || isTesting}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                {isTestingAll ? (
                  <>
                    <span className="spinner-icon">⟳</span>
                    <span>Testing All Connections…</span>
                  </>
                ) : (
                  <>
                    <span>🔌</span>
                    <span>Test All Connections</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          PAGE: MODELS (Thinking LLM, Fast LLM, Embedding Model)
          ==================================================================== */}
      {activeSubTab === "models" && (
        <>
          {/* Subtabs bar for filtering model sub-pages */}
          <div className="model-subtabs-bar">
            <button
              type="button"
              className={`model-subtab-btn ${activeModelTab === "all" ? "active" : ""}`}
              onClick={() => setActiveModelTab("all")}
            >
              <span>📑</span>
              <span>All Models</span>
            </button>
            <button
              type="button"
              className={`model-subtab-btn ${activeModelTab === "thinking" ? "active" : ""}`}
              onClick={() => setActiveModelTab("thinking")}
            >
              <span>🧠</span>
              <span>Thinking LLM</span>
            </button>
            <button
              type="button"
              className={`model-subtab-btn ${activeModelTab === "fast" ? "active" : ""}`}
              onClick={() => setActiveModelTab("fast")}
            >
              <span>⚡</span>
              <span>Fast LLM</span>
            </button>
            <button
              type="button"
              className={`model-subtab-btn ${activeModelTab === "embedding" ? "active" : ""}`}
              onClick={() => setActiveModelTab("embedding")}
            >
              <span>📐</span>
              <span>Embedding Model</span>
            </button>
          </div>

          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              triggerAutosave(form);
            }}
          >
            {/* Model 1: Thinking LLM */}
            {(activeModelTab === "all" || activeModelTab === "thinking") && (
              <div className="admin-card">
                <div className="card-title-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <BotAvatar bot="reader" size="sm" />
                      <h4 style={{ margin: 0 }}>Thinking LLM</h4>
                    </div>
                    <p className="muted" style={{ marginTop: "4px" }}>
                      Primary generative model for executive summarization, deep reading, entity extraction, story synthesis, and assistant distillation.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <label
                      title="Inherits shared Server Base URL and credentials from Server settings. Uncheck to specify a custom endpoint for this model."
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: "var(--color-foreground-primary, #1e293b)",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.useCommonServerForThinking !== false}
                        onChange={(e) => updateForm({ useCommonServerForThinking: e.target.checked })}
                      />
                      <span>Common Server</span>
                    </label>
                    <button
                      type="button"
                      className={`single-line-test-btn ${
                        isTestingAnalyst
                          ? "test-testing"
                          : analystTestResult
                          ? analystTestResult.ok
                            ? "test-success"
                            : "test-error"
                          : ""
                      }`}
                      onClick={() => handleTestSingleModel("analyst")}
                      disabled={isTestingAnalyst}
                      title="Send test prompt to Thinking LLM"
                    >
                      {isTestingAnalyst ? (
                        <>
                          <span className="spinner-icon">⟳</span>
                          <span>Testing…</span>
                        </>
                      ) : analystTestResult ? (
                        analystTestResult.ok ? (
                          <>
                            <span style={{ color: "#047857", fontWeight: 700 }}>✓</span>
                            <span>Passed</span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: "#b91c1c", fontWeight: 700 }}>✗</span>
                            <span>Failed</span>
                          </>
                        )
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Assigned Bots using Thinking LLM */}
                <div className="model-assigned-bots-box">
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--color-foreground-secondary, #475569)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Assigned Bots:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {getBotsUsingModel(form.llmModel, undefined, form).map((b) => (
                      <span
                        key={b.id}
                        className="bot-assigned-pill"
                        style={{ border: `1px solid ${b.color}45`, color: b.color }}
                        title={`${b.name}: ${b.role}`}
                      >
                        <span>{b.emoji}</span>
                        <span>{b.name}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Custom Base URL and API Key (revealed when unchecked) */}
                {form.useCommonServerForThinking === false && (
                  <div className="settings-grid" style={{ marginBottom: "1rem", padding: "10px", background: "rgba(59, 130, 246, 0.04)", borderRadius: "6px" }}>
                    <div className="field-group">
                      <label htmlFor="thinking-base-url">
                        <span>Thinking LLM Base URL</span>
                      </label>
                      <input
                        id="thinking-base-url"
                        type="url"
                        value={form.thinkingBaseUrl || ""}
                        onChange={(e) => updateForm({ thinkingBaseUrl: e.target.value })}
                        placeholder={form.llmBaseUrl || "http://localhost:1234/v1"}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="thinking-api-key">
                        <span>Thinking LLM API Key</span>
                      </label>
                      <input
                        id="thinking-api-key"
                        type="password"
                        value={form.thinkingApiKey || ""}
                        onChange={(e) => updateForm({ thinkingApiKey: e.target.value })}
                        placeholder={form.llmApiKey || "lm-studio"}
                      />
                    </div>
                  </div>
                )}

                {/* Model Select Field */}
                <div className="field-group" style={{ marginBottom: "0.85rem" }}>
                  <label htmlFor="llm-model">
                    <span>Model</span>
                    <span className="required-mark">*</span>
                  </label>
                  {availableModels.filter((m) => m.type !== "embedding").length > 0 ? (
                    <select
                      id="llm-model"
                      value={form.llmModel}
                      onChange={(e) => updateForm({ llmModel: e.target.value })}
                    >
                      {availableModels
                        .filter((m) => m.type !== "embedding")
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.displayName || m.id}{m.contextLength ? ` (${(m.contextLength / 1024).toFixed(0)}k context)` : ""}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      id="llm-model"
                      type="text"
                      required
                      value={form.llmModel}
                      onChange={(e) => updateForm({ llmModel: e.target.value })}
                      placeholder="mlabonne_qwen3-14b-abliterated"
                    />
                  )}
                </div>

                {/* Model Pricing Rates on Card */}
                <div className="model-pricing-box">
                  <div className="model-pricing-header">
                    <span className="model-pricing-title">
                      <span>🏷️</span>
                      <span>Pricing Rates</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginTop: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-foreground-secondary, #475569)" }}>
                        Input Price:
                      </label>
                      <div className="input-with-affix" style={{ width: "auto" }}>
                        <span className="input-prefix">{pricingSettings?.currencySymbol || "$"}</span>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          className="compact-numeric-input"
                          value={
                            pricingSettings?.perModelRates?.[form.llmModel]?.inputPricePerMillion ??
                            pricingSettings?.llmInputPricePerMillion ??
                            0
                          }
                          onChange={(e) =>
                            handleUpdateModelPricing(
                              form.llmModel,
                              parseFloat(e.target.value) || 0,
                              pricingSettings?.perModelRates?.[form.llmModel]?.outputPricePerMillion ??
                                pricingSettings?.llmOutputPricePerMillion ??
                                0
                            )
                          }
                        />
                        <span className="muted" style={{ fontSize: "0.76rem", marginLeft: "6px" }}>/M</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-foreground-secondary, #475569)" }}>
                        Output Price:
                      </label>
                      <div className="input-with-affix" style={{ width: "auto" }}>
                        <span className="input-prefix">{pricingSettings?.currencySymbol || "$"}</span>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          className="compact-numeric-input"
                          value={
                            pricingSettings?.perModelRates?.[form.llmModel]?.outputPricePerMillion ??
                            pricingSettings?.llmOutputPricePerMillion ??
                            0
                          }
                          onChange={(e) =>
                            handleUpdateModelPricing(
                              form.llmModel,
                              pricingSettings?.perModelRates?.[form.llmModel]?.inputPricePerMillion ??
                                pricingSettings?.llmInputPricePerMillion ??
                                0,
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                        <span className="muted" style={{ fontSize: "0.76rem", marginLeft: "6px" }}>/M</span>
                      </div>
                    </div>
                  </div>
                </div>

                {analystTestResult && (
                  <div className={`model-test-pill ${analystTestResult.ok ? "success" : "error"}`} style={{ marginTop: "0.75rem" }}>
                    {analystTestResult.ok
                      ? `✓ Thinking model (${analystTestResult.model}) responded successfully!`
                      : `✗ Thinking model test failed: ${analystTestResult.error}`}
                  </div>
                )}
              </div>
            )}

            {/* Model 2: Fast LLM (formerly Fast Triage Model / Scout) */}
            {(activeModelTab === "all" || activeModelTab === "fast") && (
              <div className="admin-card">
                <div className="card-title-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <BotAvatar bot="scout" size="sm" />
                      <h4 style={{ margin: 0 }}>Fast LLM (Scout Gatekeeper)</h4>
                    </div>
                    <p className="muted" style={{ marginTop: "4px" }}>
                      Ultra-fast decision model evaluating raw feeds in under 2 seconds. Discards routine sports, propaganda, and gossip before burning expensive deep reading compute.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <label
                      title="Inherits shared Server Base URL and credentials from Server settings. Uncheck to specify a custom endpoint for this model."
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: "var(--color-foreground-primary, #1e293b)",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.useCommonServerForFast !== false}
                        onChange={(e) => updateForm({ useCommonServerForFast: e.target.checked })}
                      />
                      <span>Common Server</span>
                    </label>
                    <button
                      type="button"
                      className={`single-line-test-btn ${
                        isTestingFast
                          ? "test-testing"
                          : fastTestResult
                          ? fastTestResult.ok
                            ? "test-success"
                            : "test-error"
                          : ""
                      }`}
                      onClick={() => handleTestSingleModel("fast")}
                      disabled={isTestingFast || !form.scoutModel}
                      title={
                        !form.scoutModel
                          ? "Fast model is empty (falls back to Thinking LLM). Select a Fast model to test."
                          : "Send test classification ping to Fast LLM"
                      }
                    >
                      {isTestingFast ? (
                        <>
                          <span className="spinner-icon">⟳</span>
                          <span>Testing…</span>
                        </>
                      ) : fastTestResult ? (
                        fastTestResult.ok ? (
                          <>
                            <span style={{ color: "#047857", fontWeight: 700 }}>✓</span>
                            <span>Passed</span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: "#b91c1c", fontWeight: 700 }}>✗</span>
                            <span>Failed</span>
                          </>
                        )
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Assigned Bots using Fast LLM */}
                <div className="model-assigned-bots-box">
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--color-foreground-secondary, #475569)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Assigned Bots:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <span
                      className="bot-assigned-pill"
                      style={{ border: "1px solid #0284c745", color: "#0284c7" }}
                      title="Scout: Fast Feed Gatekeeper & Triage"
                    >
                      <span>🎯</span>
                      <span>Scout</span>
                    </span>
                  </div>
                </div>

                {/* Custom Base URL and API Key (revealed when unchecked) */}
                {form.useCommonServerForFast === false && (
                  <div className="settings-grid" style={{ marginBottom: "1rem", padding: "10px", background: "rgba(59, 130, 246, 0.04)", borderRadius: "6px" }}>
                    <div className="field-group">
                      <label htmlFor="fast-base-url">
                        <span>Fast LLM Base URL</span>
                      </label>
                      <input
                        id="fast-base-url"
                        type="url"
                        value={form.scoutBaseUrl || ""}
                        onChange={(e) => updateForm({ scoutBaseUrl: e.target.value })}
                        placeholder={form.llmBaseUrl || "http://localhost:1234/v1"}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="fast-api-key">
                        <span>Fast LLM API Key</span>
                      </label>
                      <input
                        id="fast-api-key"
                        type="password"
                        value={form.scoutApiKey || ""}
                        onChange={(e) => updateForm({ scoutApiKey: e.target.value })}
                        placeholder={form.llmApiKey || "lm-studio"}
                      />
                    </div>
                  </div>
                )}

                {/* Model Select Field */}
                <div className="field-group" style={{ marginBottom: "0.85rem" }}>
                  <label htmlFor="scout-model-select">
                    <span>Model</span>
                    <span className="muted"> (Leave empty to fall back to Thinking LLM)</span>
                  </label>
                  {availableModels.filter((m) => m.type !== "embedding").length > 0 ? (
                    <select
                      id="scout-model-select"
                      value={form.scoutModel || ""}
                      onChange={(e) => updateForm({ scoutModel: e.target.value })}
                    >
                      <option value="">(Empty - Fall back to Thinking LLM)</option>
                      {availableModels
                        .filter((m) => m.type !== "embedding")
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.displayName || m.id}{m.contextLength ? ` (${(m.contextLength / 1024).toFixed(0)}k context)` : ""}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      id="scout-model-select"
                      type="text"
                      value={form.scoutModel || ""}
                      onChange={(e) => updateForm({ scoutModel: e.target.value })}
                      placeholder="(Leave empty to fall back to Thinking LLM)"
                    />
                  )}
                  {!form.scoutModel && (
                    <p className="field-hint" style={{ color: "#0284c7", marginTop: "4px" }}>
                      ℹ️ Fast model is empty: Scout will automatically fall back on Thinking LLM (<strong>{form.llmModel}</strong>).
                    </p>
                  )}
                </div>

                {/* Minimum Keep Threshold Slider */}
                <div className="field-group" style={{ marginBottom: "0.85rem" }}>
                  <label htmlFor="scout-min-score">
                    <span>Minimum Keep Threshold: <strong>{form.scoutMinScore ?? 35} / 100</strong></span>
                  </label>
                  <input
                    id="scout-min-score"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.scoutMinScore ?? 35}
                    onChange={(e) => updateForm({ scoutMinScore: parseInt(e.target.value, 10) })}
                    style={{ width: "100%", marginTop: "6px" }}
                  />
                </div>

                {/* Model Pricing Rates on Card (when configured) */}
                {form.scoutModel && (
                  <div className="model-pricing-box">
                    <div className="model-pricing-header">
                      <span className="model-pricing-title">
                        <span>🏷️</span>
                        <span>Pricing Rates</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginTop: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-foreground-secondary, #475569)" }}>
                          Input Price:
                        </label>
                        <div className="input-with-affix" style={{ width: "auto" }}>
                          <span className="input-prefix">{pricingSettings?.currencySymbol || "$"}</span>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            className="compact-numeric-input"
                            value={
                              pricingSettings?.perModelRates?.[form.scoutModel]?.inputPricePerMillion ??
                              pricingSettings?.llmInputPricePerMillion ??
                              0
                            }
                            onChange={(e) =>
                              handleUpdateModelPricing(
                                form.scoutModel || "",
                                parseFloat(e.target.value) || 0,
                                pricingSettings?.perModelRates?.[form.scoutModel]?.outputPricePerMillion ??
                                  pricingSettings?.llmOutputPricePerMillion ??
                                  0
                              )
                            }
                          />
                          <span className="muted" style={{ fontSize: "0.76rem", marginLeft: "6px" }}>/M</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-foreground-secondary, #475569)" }}>
                          Output Price:
                        </label>
                        <div className="input-with-affix" style={{ width: "auto" }}>
                          <span className="input-prefix">{pricingSettings?.currencySymbol || "$"}</span>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            className="compact-numeric-input"
                            value={
                              pricingSettings?.perModelRates?.[form.scoutModel]?.outputPricePerMillion ??
                              pricingSettings?.llmOutputPricePerMillion ??
                              0
                            }
                            onChange={(e) =>
                              handleUpdateModelPricing(
                                form.scoutModel || "",
                                pricingSettings?.perModelRates?.[form.scoutModel]?.inputPricePerMillion ??
                                  pricingSettings?.llmInputPricePerMillion ??
                                  0,
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                          <span className="muted" style={{ fontSize: "0.76rem", marginLeft: "6px" }}>/M</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {fastTestResult && (
                  <div className={`model-test-pill ${fastTestResult.ok ? "success" : "error"}`} style={{ marginTop: "0.75rem" }}>
                    {fastTestResult.ok
                      ? `✓ Fast model (${fastTestResult.model}) responded successfully!`
                      : `✗ Fast model test failed: ${fastTestResult.error}`}
                    {fastTestResult.fallback && " (Using Analyst model fallback)"}
                  </div>
                )}
              </div>
            )}

            {/* Model 3: Embedding Model (Vector Knowledge Engine) */}
            {(activeModelTab === "all" || activeModelTab === "embedding") && (
              <div className="admin-card">
                <div className="card-title-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>📐</span>
                      <h4 style={{ margin: 0 }}>Embedding Model</h4>
                    </div>
                    <p className="muted" style={{ marginTop: "4px" }}>
                      Dense vector model for semantic similarity, sqlite-vec indexing, deduplication, and RAG context retrieval.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <label
                      title="Inherits shared Server Base URL and credentials from Server settings. Uncheck to specify a custom endpoint for this model."
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: "var(--color-foreground-primary, #1e293b)",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.useCommonServerForEmbedding !== false}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          updateForm({
                            useCommonServerForEmbedding: isChecked,
                            useCustomEmbeddingsEndpoint: !isChecked,
                          });
                        }}
                      />
                      <span>Common Server</span>
                    </label>
                    <button
                      type="button"
                      className={`single-line-test-btn ${
                        isTestingEmbed
                          ? "test-testing"
                          : embedTestResult
                          ? embedTestResult.ok
                            ? "test-success"
                            : "test-error"
                          : ""
                      }`}
                      onClick={() => handleTestSingleModel("embedding")}
                      disabled={isTestingEmbed}
                      title="Send test embedding ping"
                    >
                      {isTestingEmbed ? (
                        <>
                          <span className="spinner-icon">⟳</span>
                          <span>Testing…</span>
                        </>
                      ) : embedTestResult ? (
                        embedTestResult.ok ? (
                          <>
                            <span style={{ color: "#047857", fontWeight: 700 }}>✓</span>
                            <span>Passed</span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: "#b91c1c", fontWeight: 700 }}>✗</span>
                            <span>Failed</span>
                          </>
                        )
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Assigned Subsystems using Embedding Model */}
                <div className="model-assigned-bots-box">
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--color-foreground-secondary, #475569)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Assigned Subsystems:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <span
                      className="bot-assigned-pill"
                      style={{ border: "1px solid #05966945", color: "#059669" }}
                      title="Tools & Vector RAG: Semantic Vector Search, Deduplication & RAG Retrieval"
                    >
                      <span>📐</span>
                      <span>Tools / Vector RAG</span>
                    </span>
                  </div>
                </div>

                {/* Custom Base URL and API Key (revealed when unchecked) */}
                {form.useCommonServerForEmbedding === false && (
                  <div className="settings-grid" style={{ marginBottom: "1rem", padding: "10px", background: "rgba(16, 185, 129, 0.04)", borderRadius: "6px" }}>
                    <div className="field-group">
                      <label htmlFor="embeddings-base-url">
                        <span>Embeddings Base URL</span>
                      </label>
                      <input
                        id="embeddings-base-url"
                        type="url"
                        value={form.embeddingsBaseUrl || ""}
                        onChange={(e) => updateForm({ embeddingsBaseUrl: e.target.value })}
                        placeholder={form.llmBaseUrl || "http://localhost:1234/v1"}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="embeddings-api-key">
                        <span>Embeddings API Key</span>
                      </label>
                      <input
                        id="embeddings-api-key"
                        type="password"
                        value={form.embeddingsApiKey || ""}
                        onChange={(e) => updateForm({ embeddingsApiKey: e.target.value })}
                        placeholder={form.llmApiKey || "lm-studio"}
                      />
                    </div>
                  </div>
                )}

                {/* Model Select Field */}
                <div className="field-group" style={{ marginBottom: "0.85rem" }}>
                  <label htmlFor="embedding-model">
                    <span>Model</span>
                    <span className="required-mark">*</span>
                  </label>
                  {availableModels.filter((m) => m.type === "embedding").length > 0 ? (
                    <select
                      id="embedding-model"
                      value={form.embeddingModel}
                      onChange={(e) => updateForm({ embeddingModel: e.target.value })}
                    >
                      {availableModels
                        .filter((m) => m.type === "embedding")
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.displayName || m.id}{m.contextLength ? ` (${(m.contextLength / 1024).toFixed(0)}k context)` : ""}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      id="embedding-model"
                      type="text"
                      required
                      value={form.embeddingModel}
                      onChange={(e) => updateForm({ embeddingModel: e.target.value })}
                      placeholder="text-embedding-bge-m3"
                    />
                  )}
                </div>

                {/* Model Pricing Rates on Card */}
                <div className="model-pricing-box">
                  <div className="model-pricing-header">
                    <span className="model-pricing-title">
                      <span>🏷️</span>
                      <span>Pricing Rates</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginTop: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-foreground-secondary, #475569)" }}>
                        Embedding Price:
                      </label>
                      <div className="input-with-affix" style={{ width: "auto" }}>
                        <span className="input-prefix">{pricingSettings?.currencySymbol || "$"}</span>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          className="compact-numeric-input"
                          value={
                            pricingSettings?.perModelRates?.[form.embeddingModel]?.inputPricePerMillion ??
                            pricingSettings?.embeddingPricePerMillion ??
                            0
                          }
                          onChange={(e) =>
                            handleUpdateModelPricing(
                              form.embeddingModel,
                              parseFloat(e.target.value) || 0,
                              0
                            )
                          }
                        />
                        <span className="muted" style={{ fontSize: "0.76rem", marginLeft: "6px" }}>/M</span>
                      </div>
                    </div>
                  </div>
                </div>

                {embedTestResult && (
                  <div className={`model-test-pill ${embedTestResult.ok ? "success" : "error"}`} style={{ marginTop: "0.75rem" }}>
                    {embedTestResult.ok
                      ? `✓ Embedding model (${embedTestResult.model}) responded successfully!`
                      : `✗ Embedding test failed: ${embedTestResult.error}`}
                  </div>
                )}
              </div>
            )}
          </form>
        </>
      )}

      {/* ====================================================================
          PAGE: USAGE & TOKEN CONSUMPTION
          ==================================================================== */}
      {activeSubTab === "usage" && (
        <div className="admin-card usage-standalone-card">
          <TokenCostView isEmbedded={true} />
        </div>
      )}

      {activeSubTab === "about-me" && (
        <AboutMeTab
          assistantToast={assistantToast}
          setAssistantToast={setAssistantToast}
          isCheckingPreferences={isCheckingPreferences}
          preferencesAudit={preferencesAudit}
          preferencesTextareaRef={preferencesTextareaRef}
          userPreferencesNotes={form.userPreferencesNotes || ""}
          updateField={updateField}
          handleApplySuggestion={handleApplySuggestion}
          isSynthesizing={isSynthesizing}
          handleSynthesizeAssistant={handleSynthesizeAssistant}
          assistantMasterDirective={form.assistantMasterDirective || ""}
        />
      )}

      {activeSubTab === "agent-scout" && (
        <ScoutAgentTab
          form={form}
          updateField={updateField}
          renderBotTimingRow={renderBotTimingRow as any}
          onNavigateToLibrary={onNavigateToLibrary}
          onChangeSubTab={onChangeSubTab}
          canUndo={canUndo}
          canRedo={canRedo}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
        />
      )}

      {activeSubTab === "agent-analyst" && (
        <ReaderAgentTab
          form={form}
          updateForm={updateForm}
          renderBotTimingRow={renderBotTimingRow as any}
          onNavigateToLibrary={onNavigateToLibrary}
          onChangeSubTab={onChangeSubTab}
          canUndo={canUndo}
          canRedo={canRedo}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
        />
      )}

      {activeSubTab === "agent-clusterer" && (
        <OrganiserAgentTab
          form={form}
          updateForm={updateForm}
          renderBotTimingRow={renderBotTimingRow as any}
          onNavigateToLibrary={onNavigateToLibrary}
          reclusterResult={reclusterResult}
          canUndo={canUndo}
          canRedo={canRedo}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
        />
      )}

      {activeSubTab === "agent-curator" && (
        <CuratorAgentTab
          form={form}
          updateForm={updateForm}
          renderBotTimingRow={renderBotTimingRow as any}
          onNavigateToLibrary={onNavigateToLibrary}
          curatorData={curatorData}
          handleCuratorRun={handleCuratorRun}
          isCurating={isCurating}
          curatorMessage={curatorMessage}
          canUndo={canUndo}
          canRedo={canRedo}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
        />
      )}

      {activeSubTab === "agent-assistant" && (
        <AssistantAgentTab
          form={form}
          updateField={updateField}
          handleSynthesizeAssistant={handleSynthesizeAssistant}
          isSynthesizing={isSynthesizing}
          assistantToast={assistantToast}
          setAssistantToast={setAssistantToast}
          synthesisResult={synthesisResult}
          onChangeSubTab={onChangeSubTab}
          onNavigateToLibrary={onNavigateToLibrary}
          canUndo={canUndo}
          canRedo={canRedo}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
        />
      )}

      {activeSubTab === "agent-auditor" && (
        <SupervisorAgentTab
          onNavigateToLibrary={onNavigateToLibrary}
          form={form}
          updateForm={updateForm}
          auditorPromptRef={auditorPromptRef}
          canUndo={canUndo}
          canRedo={canRedo}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          sandboxPreset={sandboxPreset}
          setSandboxPreset={setSandboxPreset}
          sandboxPrompt={sandboxPrompt}
          updateSandboxPrompt={updateSandboxPrompt}
          sandboxHistoryIndex={sandboxHistoryIndex}
          sandboxHistory={sandboxHistory}
          handleSandboxUndo={handleSandboxUndo}
          handleSandboxRedo={handleSandboxRedo}
        />
      )}

      {/* ====================================================================
          PAGE: TELEMETRY & ACTIVITY
          ==================================================================== */}
      {activeSubTab === "status" && (
        <div className="admin-grid-cards">
          <div className="admin-card">
            <h4>LM Studio Connection</h4>
            <div className="status-row">
              <span className={ai?.online ? "status-dot online" : "status-dot offline"} />
              <strong>{ai?.online ? "LM Studio Online" : "LM Studio Disconnected"}</strong>
            </div>
            <p className="muted">
              Endpoint: <code>{ai?.url || CONFIG.LM_STUDIO.DEFAULT_BASE_URL}</code>
            </p>
            <button type="button" className="small-btn" onClick={onRefreshTelemetry}>
              Refresh Status
            </button>
          </div>

          <div className="admin-card">
            <h4>Embedding Retrieval Model</h4>
            <div className="status-row">
              <span
                className={
                  ai?.hasEmbeddingLoaded ? "status-dot online" : "status-dot warning"
                }
              />
              <strong>{ai?.expectedEmbeddingModel || CONFIG.LM_STUDIO.MODELS.EMBEDDING}</strong>
            </div>
            <p className="muted">
              {ai?.hasEmbeddingLoaded ? "✓ Model loaded in LM Studio" : "⚠️ Model not loaded"}
            </p>
            <p className="muted">Dimensions: 1024-dim dense float32</p>
          </div>

          <div className="admin-card">
            <h4>Generative LLM Model</h4>
            <div className="status-row">
              <span className={ai?.hasLlmLoaded ? "status-dot online" : "status-dot warning"} />
              <strong>{ai?.expectedLlmModel || CONFIG.LM_STUDIO.MODELS.LLM}</strong>
            </div>
            <p className="muted">
              {ai?.hasLlmLoaded ? "✓ Model loaded in LM Studio" : "⚠️ Model not loaded"}
            </p>
            <p className="muted">Structured output: Zod JSON Schema</p>
          </div>

          <div className="admin-card">
            <h4>SQLite-Vec Vector Index</h4>
            <div className="metric-large">{dbInfo?.vectorsCount ?? 0}</div>
            <p className="muted">Embeddings currently indexed in SQLite-vec</p>
          </div>
        </div>
      )}

      {/* ====================================================================
          PAGE: RAG & KNOWLEDGE ARCHITECTURE
          ==================================================================== */}
      {activeSubTab === "rag" && (
        <div className="admin-card">
          <h4>Retrieval-Augmented Generation (RAG) Architecture</h4>
          <p className="muted">
            Decoupled Token Space Bridge: The embedding model and LLM operate in completely separate mathematical representations; Valet bridges them by matching vectors in <code>sqlite-vec</code> and resolving them to human-readable plain text in the prompt.
          </p>

          <table className="admin-table">
            <tbody>
              <tr>
                <th>RAG Top-K Nearest Neighbors</th>
                <td><code>{CONFIG.AGENT.RAG_TOP_K}</code> documents</td>
              </tr>
              <tr>
                <th>Historical Snippet Context Window</th>
                <td><code>{CONFIG.AGENT.MAX_CONTEXT_SNIPPET_LENGTH}</code> characters per match</td>
              </tr>
              <tr>
                <th>Vector Dimension</th>
                <td><code>{CONFIG.DATABASE.EMBEDDING_DIMENSIONS}</code> (float32)</td>
              </tr>
              <tr>
                <th>Agent Polling Cadence</th>
                <td>Every <code>{CONFIG.AGENT.POLL_INTERVAL_MS / 1000}s</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
