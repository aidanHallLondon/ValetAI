import React from "react";
import { AGENT_BOTS } from "../../utils/agents";
import { AgentPageHeader } from "./common/AgentPageHeader";
import { CONFIG } from "../../../config";
import { PromptAuditorWidget } from "./common/PromptAuditorWidget";

interface SupervisorAgentTabProps {
  onNavigateToLibrary?: () => void;
  form: {
    promptAuditorSystemPrompt?: string;
    systemPrompt?: string;
    curatorSystemPrompt?: string;
    clustererPromptTemplate?: string;
    promptTemplate?: string;
  };
  updateForm: (updates: any) => void;
  auditorPromptRef: React.RefObject<HTMLTextAreaElement | null>;
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
  sandboxPreset: "analyst-system" | "curator-system" | "clusterer-template" | "analyst-template" | "custom";
  setSandboxPreset: (preset: "analyst-system" | "curator-system" | "clusterer-template" | "analyst-template" | "custom") => void;
  sandboxPrompt: string;
  updateSandboxPrompt: (prompt: string) => void;
  sandboxHistoryIndex: number;
  sandboxHistory: string[];
  handleSandboxUndo: () => void;
  handleSandboxRedo: () => void;
}

export const SupervisorAgentTab: React.FC<SupervisorAgentTabProps> = ({
  onNavigateToLibrary,
  form,
  updateForm,
  auditorPromptRef,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  sandboxPreset,
  setSandboxPreset,
  sandboxPrompt,
  updateSandboxPrompt,
  sandboxHistoryIndex,
  sandboxHistory,
  handleSandboxUndo,
  handleSandboxRedo,
}) => {
  return (
    <div className="supervisor-agent-tab agent-page-container">
      <AgentPageHeader
        bot="supervisor"
        subtitle={
          <>
            Oversees and validates prompt quality. Catches typos, checks required tokens like <code>{"{{primaryPlainText}}"}</code>, enforces JSON rules, and suggests improvements in real-time.
          </>
        }
        actionsNode={
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onNavigateToLibrary?.()}
            title="View Knowledge Pipeline in Library"
          >
            View in Knowledge Pipeline ↗
          </button>
        }
      />

      {/* Section 1: Auditor System Directives */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Supervisor Directives</h4>
            <p className="muted">
              Configures the instructions and guidelines used by the Prompt Supervisor when inspecting other prompts.
            </p>
          </div>
        </div>

        {/* Attached Editor Frame */}
        <div className="attached-editor-frame">
          <div className="attached-editor-toolbar">
            <div className="attached-toolbar-left">
              <button
                type="button"
                className="editor-tool-btn"
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo edit (Cmd+Z)"
              >
                <span className="tool-icon">↩</span>
                <span>Undo</span>
              </button>
              <button
                type="button"
                className="editor-tool-btn"
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo edit (Cmd+Shift+Z)"
              >
                <span className="tool-icon">↪</span>
                <span>Redo</span>
              </button>
            </div>
            <div className="attached-toolbar-right">
              <button
                type="button"
                className="editor-reset-btn"
                onClick={() =>
                  updateForm({
                    promptAuditorSystemPrompt:
                      CONFIG.LM_STUDIO.DEFAULT_PROMPT_AUDITOR_SYSTEM_PROMPT,
                  })
                }
                title="Restore default supervisor directives"
              >
                Reset Default
              </button>
            </div>
          </div>

          <textarea
            ref={auditorPromptRef}
            className="attached-editor-textarea"
            rows={6}
            value={form.promptAuditorSystemPrompt || ""}
            onChange={(e) => updateForm({ promptAuditorSystemPrompt: e.target.value })}
            placeholder="Enter prompt supervisor directives..."
          />

          {/* Attached Live Prompt Supervisor Footer */}
          <PromptAuditorWidget
            prompt={form.promptAuditorSystemPrompt || ""}
            promptType="auditor-system"
            agentName="Prompt Supervisor"
            onApplyFix={(fix, isFull) => {
              if (isFull) {
                updateForm({ promptAuditorSystemPrompt: fix });
              } else {
                updateForm({
                  promptAuditorSystemPrompt: (form.promptAuditorSystemPrompt || "") + "\n" + fix,
                });
              }
            }}
          />
        </div>
      </div>

      {/* Section 2: Interactive Prompt Test Bench & Live Audit Sandbox */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Interactive Prompt Inspection & Test Bench</h4>
            <p className="muted">
              Test and inspect any prompt in real time. The Supervisor evaluates syntax, checks required tokens, and provides actionable suggestions.
            </p>
          </div>
        </div>

        {/* Attached Editor Frame with Preset Selector in Toolbar */}
        <div className="attached-editor-frame">
          <div className="attached-editor-toolbar">
            <div className="attached-toolbar-left">
              <button
                type="button"
                className="editor-tool-btn"
                onClick={handleSandboxUndo}
                disabled={sandboxHistoryIndex <= 0}
                title="Undo sandbox edit (Cmd+Z)"
              >
                <span className="tool-icon">↩</span>
                <span>Undo</span>
              </button>
              <button
                type="button"
                className="editor-tool-btn"
                onClick={handleSandboxRedo}
                disabled={sandboxHistoryIndex >= sandboxHistory.length - 1}
                title="Redo sandbox edit (Cmd+Shift+Z)"
              >
                <span className="tool-icon">↪</span>
                <span>Redo</span>
              </button>
            </div>

            <div className="attached-toolbar-right">
              <div className="sandbox-preset-select">
                <label htmlFor="preset-select" className="visually-hidden">
                  Select Prompt Preset
                </label>
                <select
                  id="preset-select"
                  value={sandboxPreset}
                  onChange={(e) => {
                    const preset = e.target.value as any;
                    setSandboxPreset(preset);
                    let newPrompt = "";
                    if (preset === "analyst-system") {
                      newPrompt = form.systemPrompt || "";
                    } else if (preset === "curator-system") {
                      newPrompt = form.curatorSystemPrompt || "";
                    } else if (preset === "clusterer-template") {
                      newPrompt = form.clustererPromptTemplate || "";
                    } else if (preset === "analyst-template") {
                      newPrompt = form.promptTemplate || "";
                    }
                    updateSandboxPrompt(newPrompt);
                  }}
                >
                  <option value="analyst-system">{AGENT_BOTS.reader.name} Directives</option>
                  <option value="curator-system">{AGENT_BOTS.curator.name} Directives</option>
                  <option value="clusterer-template">{AGENT_BOTS.organiser.name} Template</option>
                  <option value="analyst-template">{AGENT_BOTS.reader.name} Legacy Template</option>
                  <option value="custom">Custom Sandbox Scratchpad</option>
                </select>
              </div>
            </div>
          </div>

          <textarea
            className="attached-editor-textarea"
            rows={10}
            value={sandboxPrompt}
            onChange={(e) => updateSandboxPrompt(e.target.value)}
            placeholder="Paste or write any prompt here to inspect live..."
          />

          {/* Attached Live Audit Report Footer */}
          <PromptAuditorWidget
            prompt={sandboxPrompt}
            promptType={
              sandboxPreset === "analyst-system"
                ? "analyst-system"
                : sandboxPreset === "curator-system"
                ? "curator-system"
                : sandboxPreset === "clusterer-template"
                ? "clusterer-template"
                : "analyst-template"
            }
            agentName="Prompt Supervisor"
            onApplyFix={(fix, isFull) => {
              if (isFull) {
                updateSandboxPrompt(fix);
                if (sandboxPreset === "analyst-template") {
                  updateForm({ promptTemplate: fix });
                } else if (sandboxPreset === "analyst-system") {
                  updateForm({ systemPrompt: fix });
                } else if (sandboxPreset === "curator-system") {
                  updateForm({ curatorSystemPrompt: fix });
                }
              } else {
                const updated = sandboxPrompt + "\n" + fix;
                updateSandboxPrompt(updated);
                if (sandboxPreset === "analyst-template") {
                  updateForm({ promptTemplate: updated });
                } else if (sandboxPreset === "analyst-system") {
                  updateForm({ systemPrompt: updated });
                } else if (sandboxPreset === "curator-system") {
                  updateForm({ curatorSystemPrompt: updated });
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
