/**
 * Agent 4: Personal Assistant Bot configuration tab.
 */

import React from "react";
import type { ModelSettings } from "../../../db";
import { BotAvatar } from "../common/BotAvatar";
import { AGENT_BOTS } from "../../utils/agents";
import { AgentPageHeader } from "./common/AgentPageHeader";
import { CONFIG } from "../../../config";
import { AttachedEditorFrame } from "./common/AttachedEditorFrame";
import type { AiSectionSubTab } from "../AiSection";

export interface AssistantAgentTabProps {
  form: ModelSettings;
  updateField: <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => void;
  handleSynthesizeAssistant: () => void;
  isSynthesizing: boolean;
  assistantToast?: string | null;
  setAssistantToast?: (msg: string | null) => void;
  synthesisResult?: any;
  onChangeSubTab?: (tab: AiSectionSubTab) => void;
  onNavigateToLibrary?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  handleUndo?: () => void;
  handleRedo?: () => void;
}

export function AssistantAgentTab({
  form,
  updateField,
  handleSynthesizeAssistant,
  isSynthesizing,
  assistantToast,
  setAssistantToast,
  synthesisResult,
  onChangeSubTab,
  onNavigateToLibrary,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
}: AssistantAgentTabProps) {
  return (
    <div className="assistant-agent-tab agent-page-container">
      <AgentPageHeader
        bot="assistant"
        subtitle='Autonomous personal intelligence advisor. Ingests user reading logs, up/down votes, active sources, and the "About Me" profile to synthesize unified executive directives for downstream bots.'
        actionsNode={
          <button
            type="button"
            className="update-assistant-btn"
            onClick={handleSynthesizeAssistant}
            disabled={isSynthesizing}
            title="Run full assistant synthesis across all data sources"
          >
            <BotAvatar bot="assistant" size="xs" />
            <span>{isSynthesizing ? "Updating…" : "Update Guidance"}</span>
          </button>
        }
      />

      {/* Toast Notification */}
      {assistantToast && (
        <div className="notification-banner success" style={{ marginBottom: "1rem" }}>
          <span>{assistantToast}</span>
          {setAssistantToast && (
            <button
              type="button"
              className="close-btn"
              onClick={() => setAssistantToast(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Section 1: Assistant System Directives (Prompt) */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Assistant System Directives</h4>
            <p className="muted">
              Defines the analytical persona, synthesis logic, objective tone, and guidance
              instructions provided to <code>{form.llmModel}</code>.
            </p>
          </div>
        </div>

        <AttachedEditorFrame
          id="assistantSystemPrompt"
          value={form.assistantSystemPrompt || ""}
          onChange={(val) => updateField("assistantSystemPrompt", val)}
          onResetDefault={() =>
            updateField("assistantSystemPrompt", CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_SYSTEM_PROMPT)
          }
          placeholder="Enter Assistant bot directives..."
          rows={6}
          promptType="assistant-system"
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {/* Section 2: Discrete Context Messages Array */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Synthesis Context & Messages</h4>
            <p className="muted">
              The Assistant dynamically collates these discrete context sources into the
              conversation array:
            </p>
          </div>
        </div>

        <div className="context-sources-grid">
          <div className="context-source-card">
            <div className="context-source-icon">👤</div>
            <div className="context-source-info">
              <strong>User Directives & Rules</strong>
              <p>Personal background, towns, sports interests, and exclusions.</p>
              <button
                type="button"
                className="link-button"
                onClick={() => onChangeSubTab?.("about-me")}
              >
                View in About me →
              </button>
            </div>
          </div>

          <div className="context-source-card">
            <div className="context-source-icon">📖</div>
            <div className="context-source-info">
              <strong>Reading History Logs</strong>
              <p>Recently read and analyzed articles from the knowledge pipeline.</p>
              <button
                type="button"
                className="link-button"
                onClick={() => onNavigateToLibrary?.()}
              >
                View in Library →
              </button>
            </div>
          </div>

          <div className="context-source-card">
            <div className="context-source-icon">👍</div>
            <div className="context-source-info">
              <strong>User Feedback Signals</strong>
              <p>Explicit article upvotes and downvotes shaping scoring weights.</p>
              <span className="context-source-hint">Telemetry from Feed Votes</span>
            </div>
          </div>

          <div className="context-source-card">
            <div className="context-source-icon">📡</div>
            <div className="context-source-info">
              <strong>Active Feed Sources</strong>
              <p>Enabled RSS publications, news wires, and domain feeds.</p>
              <span className="context-source-hint">Configured via Sources</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Synthesis Task Instructions */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Synthesis Task Instructions</h4>
            <p className="muted">
              Instructions passed to the Assistant alongside the discrete context messages to produce
              the master guidance directive.
            </p>
          </div>
        </div>

        <AttachedEditorFrame
          id="assistantPromptTemplate"
          value={form.assistantPromptTemplate || ""}
          onChange={(val) => updateField("assistantPromptTemplate", val)}
          onResetDefault={() =>
            updateField(
              "assistantPromptTemplate",
              CONFIG.LM_STUDIO.DEFAULT_ASSISTANT_PROMPT_TEMPLATE
            )
          }
          placeholder="Enter Assistant task instructions..."
          rows={6}
          promptType="assistant-template"
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {/* Section 4: Active Personal Guidance (Read-Only) */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Active Personal Guidance</h4>
            <p className="muted">
              Injected directly into Scout & Reader bots. Configurable in{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => onChangeSubTab?.("about-me")}
              >
                About me
              </button>
              .
            </p>
          </div>
        </div>

        {synthesisResult && (
          <div
            className="synthesis-meta-card"
            style={{ marginTop: "0.5rem", marginBottom: "0.75rem" }}
          >
            <div className="synthesis-stats-ribbon">
              <span>📊 Synthesized from: </span>
              <strong>{synthesisResult.sourcesAnalyzedCount} sources</strong> ·
              <strong>{synthesisResult.readArticlesCount} read articles</strong> ·
              <strong>{synthesisResult.upvotesCount} upvotes</strong> ·
              <strong>{synthesisResult.downvotesCount} downvotes</strong>
            </div>

            <div className="synthesis-tags-grid">
              <div className="synthesis-tag-col">
                <span className="col-title">Primary Focus Areas:</span>
                <div className="pill-group">
                  {synthesisResult.keyFocusAreas.map((f: string, idx: number) => (
                    <span key={idx} className="focus-pill">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="synthesis-tag-col">
                <span className="col-title">Strict Exclusions:</span>
                <div className="pill-group">
                  {synthesisResult.excludedTopics.map((e: string, idx: number) => (
                    <span key={idx} className="exclude-pill">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {synthesisResult.specialExceptions &&
                synthesisResult.specialExceptions.length > 0 && (
                  <div className="synthesis-tag-col">
                    <span className="col-title">Special Exceptions:</span>
                    <div className="pill-group">
                      {synthesisResult.specialExceptions.map((ex: string, idx: number) => (
                        <span key={idx} className="exception-pill">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Supervisor Double Check */}
            <div className="supervisor-double-check-box" style={{ marginTop: "1rem" }}>
              <div className="check-header">
                <span className="shield-icon">🛡️</span>
                <span>
                  Supervisor Double Check:{" "}
                  <strong>{synthesisResult.supervisorAudit.score} / 100</strong>
                </span>
                {synthesisResult.supervisorAudit.isApproved && (
                  <span className="approved-pill">✓ Approved for Downstream Bots</span>
                )}
              </div>
              <p className="critique-text">{synthesisResult.supervisorAudit.critique}</p>
              {synthesisResult.supervisorAudit.suggestions &&
                synthesisResult.supervisorAudit.suggestions.length > 0 && (
                  <div className="sup-sug-list">
                    {synthesisResult.supervisorAudit.suggestions.map((s: any, i: number) => (
                      <div key={i} className="sup-sug-item">
                        <strong>{s.title}</strong>: {s.description}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

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

      {/* Section 5: Output */}
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
              Strict schema generated by the Assistant and parsed into system directives for
              downstream bots.
            </p>
          </div>
        </div>

        <div className="clean-schema-code-block">
          <pre>{`{
  "masterDirective": string,      // 150–250 word executive synthesis passed directly into Scout & Deep Reader
  "keyFocusAreas": string[],      // High-priority topics, locations, industries, and technologies to boost
  "excludedTopics": string[],     // Strict negative categories to discard (routine sports, celebrity gossip, wire filler)
  "specialExceptions": string[]   // Preserved interests that override general exclusions (e.g. Wrexham AFC)
}`}</pre>
        </div>
      </div>
    </div>
  );
}

