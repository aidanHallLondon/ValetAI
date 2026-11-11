/**
 * Agent 2: Story Organiser configuration tab.
 */

import React, { useRef } from "react";
import type { ModelSettings } from "../../../db";
import { AGENT_BOTS, type AgentId } from "../../utils/agents";
import { AgentPageHeader } from "./common/AgentPageHeader";
import { CONFIG } from "../../../config";
import { AttachedEditorFrame } from "./common/AttachedEditorFrame";

export interface OrganiserAgentTabProps {
  form: ModelSettings;
  updateForm: (patch: Partial<ModelSettings>) => void;
  renderBotTimingRow: (bot: AgentId, name: string) => React.ReactNode;
  onNavigateToLibrary?: (action?: "recluster" | "recurate" | "reread") => void;
  reclusterResult?: {
    totalContent: number;
    storiesCount: number;
    multiArticleStories: number;
  } | null;
  canUndo?: boolean;
  canRedo?: boolean;
  handleUndo?: () => void;
  handleRedo?: () => void;
}

export function OrganiserAgentTab({
  form,
  updateForm,
  renderBotTimingRow,
  onNavigateToLibrary,
  reclusterResult,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
}: OrganiserAgentTabProps) {
  const insertToken = (token: string) => {
    const current = form.clustererPromptTemplate || "";
    updateForm({ clustererPromptTemplate: current ? `${current}\n${token}` : token });
  };

  return (
    <div className="organiser-agent-tab agent-page-container">
      <AgentPageHeader
        bot="organiser"
        subtitle="Collates developing news coverage, eliminates duplicate reports, and threads related articles under a single evolving story."
        timingNode={renderBotTimingRow("organiser", AGENT_BOTS.organiser.name)}
        actionsNode={
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onNavigateToLibrary?.("recluster")}
            title="View Story clustering status and re-cluster in Library"
          >
            View in Knowledge Pipeline ↗
          </button>
        }
      />

      {/* Section 1: System Prompt Instructions */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Story Synthesis Directives</h4>
            <p className="muted">
              Directs the LLM on how to evaluate multi-source reporting of the same event and
              synthesize an objective overview.
            </p>
          </div>
        </div>

        <AttachedEditorFrame
          id="clustererSystemPrompt"
          value={form.clustererSystemPrompt || ""}
          onChange={(val) => updateForm({ clustererSystemPrompt: val })}
          onResetDefault={() =>
            updateForm({
              clustererSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_CLUSTERER_SYSTEM_PROMPT,
            })
          }
          placeholder="Enter story synthesizer instructions..."
          rows={6}
          promptType="clusterer-system"
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {/* Section 2: Collation Prompt Template */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Multi-Source Collation Prompt Template</h4>
            <p className="muted">
              The template used when assembling multiple articles into a single composite story.
            </p>
          </div>
        </div>

        <div className="token-injection-bar">
          <span className="token-bar-label">Available Tokens:</span>
          <div className="token-pills">
            {["{{systemPrompt}}", "{{articlesText}}"].map((token) => (
              <button
                key={token}
                type="button"
                className="token-chip-btn"
                onClick={() => insertToken(token)}
              >
                + {token}
              </button>
            ))}
          </div>
        </div>

        <AttachedEditorFrame
          id="clustererPromptTemplate"
          value={form.clustererPromptTemplate || ""}
          onChange={(val) => updateForm({ clustererPromptTemplate: val })}
          onResetDefault={() =>
            updateForm({
              clustererPromptTemplate: CONFIG.LM_STUDIO.DEFAULT_CLUSTERER_PROMPT_TEMPLATE,
            })
          }
          placeholder="Enter prompt template for multi-source collation..."
          rows={8}
          promptType="clusterer-template"
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {/* Section 3: Maintenance & Operations */}
      <div className="admin-card">
        <h4>Story Clustering Operations & Maintenance</h4>
        <p className="muted">
          Valet automatically clusters new articles as they arrive. You can also trigger an
          immediate re-clustering pass across all library items.
        </p>

        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="primary-btn"
            onClick={() => onNavigateToLibrary?.("recluster")}
            title="Navigate to the Knowledge Pipeline Library to monitor live re-clustering"
          >
            ⚡ Re-cluster Entire Library in Knowledge Pipeline ↗
          </button>
        </div>

        {reclusterResult && (
          <div className="feedback-banner success" style={{ marginTop: "1rem" }}>
            <strong>Re-clustering Complete!</strong>
            <p style={{ margin: "4px 0 0" }}>
              Analyzed {reclusterResult.totalContent} articles across {reclusterResult.storiesCount}{" "}
              distinct stories ({reclusterResult.multiArticleStories} stories contain
              multi-source/updated coverage).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

