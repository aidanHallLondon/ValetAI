import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useRef } from "react";
import { ScoutAgentTab } from "../ScoutAgentTab";
import { ReaderAgentTab } from "../ReaderAgentTab";
import { OrganiserAgentTab } from "../OrganiserAgentTab";
import { CuratorAgentTab } from "../CuratorAgentTab";
import { AssistantAgentTab } from "../AssistantAgentTab";
import { SupervisorAgentTab } from "../SupervisorAgentTab";
import { AboutMeTab } from "../AboutMeTab";
import type { ModelSettings } from "../../../../db/schema";
import { CONFIG } from "../../../../config";
import { AGENT_BOTS, type AgentId } from "../../../utils/agents";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta = {
  title: "Layouts/AgentTabs",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Autonomous agent configuration page layouts and prompt tuning workspaces for Valet AI's six specialized AI bots: Scout, Reader, Organiser, Curator, Assistant, and Supervisor, plus the About Me directives view.",
      },
    },
  },
};

export default meta;

const initialSettings: ModelSettings = {
  llmBaseUrl: CONFIG.LM_STUDIO.DEFAULT_BASE_URL,
  llmModel: CONFIG.LM_STUDIO.MODELS.LLM,
  llmApiKey: "",
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
  liveTraceEnabled: true,
  traceMaxChars: 2500,
  systemPrompt: CONFIG.LM_STUDIO.DEFAULT_SYSTEM_PROMPT,
  relevanceRubric: CONFIG.LM_STUDIO.DEFAULT_RELEVANCE_RUBRIC,
  promptTemplate: CONFIG.LM_STUDIO.DEFAULT_PROMPT_TEMPLATE,
  categories: [...CONFIG.LM_STUDIO.DEFAULT_CATEGORIES],
  sentiments: [...CONFIG.LM_STUDIO.DEFAULT_SENTIMENTS],
  clustererSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_CLUSTERER_SYSTEM_PROMPT,
  clustererPromptTemplate: CONFIG.LM_STUDIO.DEFAULT_CLUSTERER_PROMPT_TEMPLATE,
  promptAuditorSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_PROMPT_AUDITOR_SYSTEM_PROMPT,
  curatorSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_CURATOR_SYSTEM_PROMPT,
  scoutEnabled: true,
  scoutModel: CONFIG.LM_STUDIO.DEFAULT_SCOUT_MODEL,
  scoutMinScore: 60,
  scoutSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_SCOUT_SYSTEM_PROMPT,
  scoutPromptTemplate: CONFIG.LM_STUDIO.DEFAULT_SCOUT_PROMPT_TEMPLATE,
  readerRewriteEnabled: false,
  userPreferencesNotes: "Interested in AI advancements, compiler optimizations, and robotics.",
  assistantSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_SYSTEM_PROMPT,
  assistantPromptTemplate: CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_PROMPT_TEMPLATE,
  assistantMasterDirective: CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_MASTER_DIRECTIVE,
  assistantSupervisorPrompt: CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_SUPERVISOR_PROMPT,
};

function renderTimingRow(botId: AgentId, name: string) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", fontSize: "0.8rem", color: "var(--color-foreground-secondary)" }}>
      <span>⏱️ Avg Execution: <strong style={{ color: "var(--color-foreground-primary)" }}>1.42s</strong></span>
      <span>•</span>
      <span>Last Run: <strong style={{ color: "var(--color-foreground-primary)" }}>3m ago</strong></span>
      <span>•</span>
      <span>Status: <strong style={{ color: "var(--color-status-success)" }}>Healthy</strong></span>
    </div>
  );
}

export const Anatomy: StoryObj = {
  render: () => {
    return (
      <div style={{ maxWidth: 960, padding: "1rem" }}>
        <ComponentAnatomy
          level="Layout"
          componentName="AgentViews"
          description="Full-page agent workspace templates combining character identity headers, execution statistics, and interactive prompt editors."
          complex={["AttachedEditorFrame", "PromptAuditorWidget"]}
          primitives={["BotAvatar", "Button", "Input", "Toggle", "Card"]}
          tokens={["--color-agent-scout", "--color-agent-reader", "--color-agent-curator", "--color-status-success"]}
        />
      </div>
    );
  },
};

export const ScoutTab: StoryObj = {
  render: () => {
    const [form, setForm] = useState<ModelSettings>(initialSettings);
    const updateField = <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => {
      setForm((prev: ModelSettings) => ({ ...prev, [key]: value }));
    };

    return (
      <div style={{ maxWidth: 960 }}>
        <ScoutAgentTab
          form={form}
          updateField={updateField}
          renderBotTimingRow={renderTimingRow}
        />
      </div>
    );
  },
};

export const ReaderTab: StoryObj = {
  render: () => {
    const [form, setForm] = useState<ModelSettings>(initialSettings);
    const updateForm = (patch: Partial<ModelSettings>) => {
      setForm((prev: ModelSettings) => ({ ...prev, ...patch }));
    };

    return (
      <div style={{ maxWidth: 960 }}>
        <ReaderAgentTab
          form={form}
          updateForm={updateForm}
          renderBotTimingRow={renderTimingRow}
        />
      </div>
    );
  },
};

export const OrganiserTab: StoryObj = {
  render: () => {
    const [form, setForm] = useState<ModelSettings>(initialSettings);
    const updateForm = (patch: Partial<ModelSettings>) => {
      setForm((prev: ModelSettings) => ({ ...prev, ...patch }));
    };

    return (
      <div style={{ maxWidth: 960 }}>
        <OrganiserAgentTab
          form={form}
          updateForm={updateForm}
          renderBotTimingRow={renderTimingRow}
        />
      </div>
    );
  },
};

export const CuratorTab: StoryObj = {
  render: () => {
    const [form, setForm] = useState<ModelSettings>(initialSettings);
    const [isCurating, setIsCurating] = useState(false);
    const updateForm = (patch: Partial<ModelSettings>) => {
      setForm((prev: ModelSettings) => ({ ...prev, ...patch }));
    };

    return (
      <div style={{ maxWidth: 960 }}>
        <CuratorAgentTab
          form={form}
          updateForm={updateForm}
          renderBotTimingRow={renderTimingRow}
          handleCuratorRun={() => {
            setIsCurating(true);
            setTimeout(() => setIsCurating(false), 1500);
          }}
          isCurating={isCurating}
        />
      </div>
    );
  },
};

export const AssistantTab: StoryObj = {
  render: () => {
    const [form, setForm] = useState<ModelSettings>(initialSettings);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const updateField = <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => {
      setForm((prev: ModelSettings) => ({ ...prev, [key]: value }));
    };

    return (
      <div style={{ maxWidth: 960 }}>
        <AssistantAgentTab
          form={form}
          updateField={updateField}
          handleSynthesizeAssistant={() => {
            setIsSynthesizing(true);
            setTimeout(() => setIsSynthesizing(false), 1500);
          }}
          isSynthesizing={isSynthesizing}
        />
      </div>
    );
  },
};

export const SupervisorTab: StoryObj = {
  render: () => {
    const [form, setForm] = useState<ModelSettings>(initialSettings);
    const [sandboxPreset, setSandboxPreset] = useState<"analyst-system" | "curator-system" | "clusterer-template" | "analyst-template" | "custom">("analyst-system");
    const [sandboxPrompt, setSandboxPrompt] = useState("Analyze this article thoroughly.");
    const auditorRef = useRef<HTMLTextAreaElement | null>(null);

    return (
      <div style={{ maxWidth: 960 }}>
        <SupervisorAgentTab
          form={form}
          updateForm={(updates) => setForm((prev: ModelSettings) => ({ ...prev, ...updates }))}
          auditorPromptRef={auditorRef}
          canUndo={false}
          canRedo={false}
          handleUndo={() => { }}
          handleRedo={() => { }}
          sandboxPreset={sandboxPreset}
          setSandboxPreset={setSandboxPreset}
          sandboxPrompt={sandboxPrompt}
          updateSandboxPrompt={setSandboxPrompt}
          sandboxHistoryIndex={0}
          sandboxHistory={[sandboxPrompt]}
          handleSandboxUndo={() => { }}
          handleSandboxRedo={() => { }}
        />
      </div>
    );
  },
};

export const AboutMeDirectivesTab: StoryObj = {
  render: () => {
    const [notes, setNotes] = useState("Interested in compiler architectures, LLVM, edge AI hardware, and robotics.");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    return (
      <div style={{ maxWidth: 960 }}>
        <AboutMeTab
          assistantToast={null}
          setAssistantToast={() => { }}
          isCheckingPreferences={false}
          preferencesAudit={{
            score: 95,
            clarity: "excellent",
            unfilledPlaceholders: [],
            contradictions: [],
            suggestions: [],
          }}
          preferencesTextareaRef={textareaRef}
          userPreferencesNotes={notes}
          updateField={(_field, val) => setNotes(val)}
          handleApplySuggestion={() => { }}
          isSynthesizing={false}
          handleSynthesizeAssistant={() => { }}
          assistantMasterDirective="Focus on technical depth over general press releases."
        />
      </div>
    );
  },
};
