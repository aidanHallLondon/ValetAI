/**
 * Agent 1: Article Reader configuration tab.
 */

import React, { useRef } from "react";
import type { ModelSettings } from "../../../db";
import { AGENT_BOTS, type AgentId } from "../../utils/agents";
import { AgentPageHeader } from "./common/AgentPageHeader";
import { CONFIG } from "../../../config";
import { AttachedEditorFrame } from "./common/AttachedEditorFrame";
import type { AiSectionSubTab } from "../AiSection";

export interface ReaderAgentTabProps {
  form: ModelSettings;
  updateForm: (patch: Partial<ModelSettings>) => void;
  renderBotTimingRow: (bot: AgentId, name: string) => React.ReactNode;
  onNavigateToLibrary?: (action?: "recluster" | "recurate" | "reread") => void;
  onChangeSubTab?: (tab: AiSectionSubTab) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  handleUndo?: () => void;
  handleRedo?: () => void;
}

export function ReaderAgentTab({
  form,
  updateForm,
  renderBotTimingRow,
  onNavigateToLibrary,
  onChangeSubTab,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
}: ReaderAgentTabProps) {
  return (
    <div className="reader-agent-tab agent-page-container">
      <AgentPageHeader
        bot="reader"
        subtitle="Reads incoming articles, writes concise executive summaries, extracts key entities & topics, and scores relevance from 0 to 100."
        timingNode={renderBotTimingRow("reader", AGENT_BOTS.reader.name)}
        actionsNode={
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onNavigateToLibrary?.("reread")}
            title="View Reader status and re-analyze outdated articles in Library"
          >
            View in Knowledge Pipeline ↗
          </button>
        }
      />

      {/* Active Personal Guidance Injected from About Me */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Active Personal Guidance</h4>
            <p className="muted">
              Injected from your{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => onChangeSubTab?.("about-me")}
              >
                About me
              </button>{" "}
              profile to personalize this bot's reading and scoring.
            </p>
          </div>
        </div>
        <div className="directive-read-only-card">
          <div className="directive-quote-bar" />
          <div className="directive-content">
            <p className="directive-text">
              {form.assistantMasterDirective ||
                "No personal guidance active yet. Configure in About me."}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: System Directives */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Reader System Directives</h4>
            <p className="muted">
              Defines the analytical role, objective tone, and reading instructions provided to{" "}
              <code>{form.llmModel}</code>.
            </p>
          </div>
        </div>

        <AttachedEditorFrame
          id="systemPrompt"
          value={form.systemPrompt}
          onChange={(val) => updateForm({ systemPrompt: val })}
          onResetDefault={() =>
            updateForm({ systemPrompt: CONFIG.LM_STUDIO.DEFAULT_SYSTEM_PROMPT })
          }
          placeholder="Enter reader system instructions here..."
          rows={6}
          promptType="analyst-system"
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {/* Section 2: Relevance Score */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Relevance Score</h4>
            <p className="muted">
              Instructs the Reader on how to score articles based on genuine importance, depth, and
              actionable insight.
            </p>
          </div>
        </div>

        <AttachedEditorFrame
          id="relevanceRubric"
          value={form.relevanceRubric || ""}
          onChange={(val) => updateForm({ relevanceRubric: val })}
          onResetDefault={() =>
            updateForm({
              relevanceRubric: CONFIG.LM_STUDIO.DEFAULT_RELEVANCE_RUBRIC,
            })
          }
          placeholder="Enter scoring criteria (0-35 trivial, 36-65 general, 66-84 high, 85-100 critical)..."
          rows={6}
          promptType="analyst-rubric"
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {/* Section 3: Output Contract */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                flexWrap: "wrap",
                marginBottom: "0.25rem",
              }}
            >
              <h4 style={{ margin: 0 }}>Output</h4>
              <span className="schema-readonly-pill">Read-only System Contract</span>
            </div>
            <p className="muted">
              Strict schema appended to every Reader prompt. Valet's database tables, feed cards,
              and downstream agents require this exact output structure.
            </p>
          </div>
        </div>

        <div className="output-fields-list">
          <div className="output-field-item">
            <div className="output-field-header">
              <code className="output-field-name">title</code>
              <span className="output-field-type">string</span>
            </div>
            <p className="output-field-desc">
              Clean, objective article headline synthesized from reporting.
            </p>
          </div>

          <div className="output-field-item">
            <div className="output-field-header">
              <code className="output-field-name">summary</code>
              <span className="output-field-type">string</span>
            </div>
            <p className="output-field-desc">
              Concise 2–3 sentence executive synthesis capturing what happened and why it matters,
              eliminating filler and clickbait.
            </p>
          </div>

          <div className="output-field-item">
            <div className="output-field-header">
              <code className="output-field-name">category</code>
              <span className="output-field-type">string</span>
            </div>
            <p className="output-field-desc">
              Concise domain classification (<code>technology</code>, <code>finance</code>,{" "}
              <code>security</code>, <code>geopolitics</code>, <code>general</code>).
            </p>
          </div>

          <div className="output-field-item">
            <div className="output-field-header">
              <code className="output-field-name">sentiment</code>
              <span className="output-field-type">
                "positive" | "neutral" | "negative" | "critical"
              </span>
            </div>
            <p className="output-field-desc">Overall analytical stance of the reported events.</p>
          </div>

          <div className="output-field-item">
            <div className="output-field-header">
              <code className="output-field-name">keyEntities</code>
              <span className="output-field-type">string[]</span>
            </div>
            <p className="output-field-desc">
              Notable people, organizations, countries, and institutions mentioned.
            </p>
          </div>

          <div className="output-field-item">
            <div className="output-field-header">
              <code className="output-field-name">actionItems</code>
              <span className="output-field-type">string[]</span>
            </div>
            <p className="output-field-desc">
              Concrete takeaways, strategic implications, or developments to monitor.
            </p>
          </div>

          <div className="output-field-item">
            <div className="output-field-header">
              <code className="output-field-name">relevanceScore</code>
              <span className="output-field-type">number (0 to 100)</span>
            </div>
            <p className="output-field-desc">
              Calculated score evaluated strictly against the Relevance Score criteria above.
            </p>
          </div>
        </div>

        <p className="schema-note-caption">
          💡 The database columns, UI reader popups, and the Organiser bot depend on these exact
          JSON fields. You can shape the analytical tone in <em>Reader System Directives</em> and score
          thresholds in <em>Relevance Score</em> above.
        </p>
      </div>
    </div>
  );
}

