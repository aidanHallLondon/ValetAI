/**
 * Agent 0: Scout Gatekeeper & Triage configuration tab.
 */

import React from "react";
import type { ModelSettings } from "../../../db";
import { AGENT_BOTS, type AgentId } from "../../utils/agents";
import { AgentPageHeader } from "./common/AgentPageHeader";
import { CONFIG } from "../../../config";
import { AttachedEditorFrame } from "./common/AttachedEditorFrame";
import type { AiSectionSubTab } from "../AiSection";

export interface ScoutAgentTabProps {
  form: ModelSettings;
  updateField: <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => void;
  renderBotTimingRow: (bot: AgentId, name: string) => React.ReactNode;
  onNavigateToLibrary?: () => void;
  onChangeSubTab?: (tab: AiSectionSubTab) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  handleUndo?: () => void;
  handleRedo?: () => void;
}

export function ScoutAgentTab({
  form,
  updateField,
  renderBotTimingRow,
  onNavigateToLibrary,
  onChangeSubTab,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
}: ScoutAgentTabProps) {
  return (
    <div className="scout-agent-tab agent-page-container">
      <AgentPageHeader
        bot="scout"
        subtitle="Ultra-fast gatekeeper. Evaluates incoming wire feeds and Google News against your personal directives in under 2 seconds, discarding sports recaps, celebrity gossip, and wire fluff before they burn expensive deep-reading GPU compute."
        timingNode={renderBotTimingRow("scout", AGENT_BOTS.scout.name)}
        actionsNode={
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onNavigateToLibrary?.()}
            title="View triage discarded items in Library"
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
              profile to personalize this bot's fast triage decisions.
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

      {/* Section 1: Fast Decision Engine Settings */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Fast Decision Engine Configuration</h4>
            <p className="muted">
              Configure the fast classifier model and minimum acceptance score. Optimized for
              lightweight decision models like{" "}
              <code>chaoliangUNSW/jev-style-qwen3.5-2b-decision</code>.
            </p>
          </div>
        </div>

        <div className="settings-grid" style={{ marginTop: "1rem" }}>
          <div className="form-group">
            <label
              className="toggle-label"
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={form.scoutEnabled !== false}
                onChange={(e) => updateField("scoutEnabled", e.target.checked)}
              />
              <strong>Enable Scout Gatekeeper Triage</strong>
            </label>
            <p className="field-hint" style={{ marginTop: "4px" }}>
              When enabled, uninteresting articles (sports, celebrity gossip, fluff) are discarded
              immediately without running 14B embedding or deep reading.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="scoutModel">
              Fast Triage Model
              <span className="field-hint"> (2B–3B decision model recommended)</span>
            </label>
            <input
              id="scoutModel"
              type="text"
              value={form.scoutModel || ""}
              onChange={(e) => updateField("scoutModel", e.target.value)}
              placeholder="chaoliangUNSW/jev-style-qwen3.5-2b-decision"
            />
          </div>

          <div className="form-group">
            <label htmlFor="scoutMinScore">
              Minimum Keep Threshold: <strong>{form.scoutMinScore ?? 35} / 100</strong>
            </label>
            <input
              id="scoutMinScore"
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.scoutMinScore ?? 35}
              onChange={(e) => updateField("scoutMinScore", parseInt(e.target.value, 10))}
              style={{ width: "100%", marginTop: "6px" }}
            />
            <p className="field-hint">
              Articles scoring below this are discarded into the Triage Bin. Strategic news, AI/tech,
              and topics matching your Personal Directives score high and pass through.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Scout Triage Directives */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Scout Triage Directives</h4>
            <p className="muted">
              Instructs the Scout on what categories to aggressively discard (general sports,
              entertainment gossip, state propaganda) and what topics to preserve.
            </p>
          </div>
        </div>

        <AttachedEditorFrame
          id="scoutSystemPrompt"
          value={form.scoutSystemPrompt || ""}
          onChange={(val) => updateField("scoutSystemPrompt", val)}
          onResetDefault={() =>
            updateField("scoutSystemPrompt", CONFIG.LM_STUDIO.DEFAULT_SCOUT_SYSTEM_PROMPT)
          }
          placeholder="Enter Scout triage rules..."
          promptType="scout-system"
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {/* Section 3: Triage Output Contract */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Triage Output (Fast JSON Decision)</h4>
            <p className="muted">
              Strict lightweight schema returned by the 2B decision model in ~1.5 seconds.
            </p>
          </div>
        </div>

        <div className="schema-field-list">
          <div className="schema-field-row">
            <span className="schema-field-name">pass</span>
            <span className="schema-field-type">boolean</span>
            <span className="schema-field-desc">
              Whether the article is approved to proceed to 14B Deep Reading & embedding
            </span>
          </div>
          <div className="schema-field-row">
            <span className="schema-field-name">reason</span>
            <span className="schema-field-type">string</span>
            <span className="schema-field-desc">
              Short justification for passing or discarding (e.g. "Sports match report", "Personal
              interest match: Wrexham AFC")
            </span>
          </div>
          <div className="schema-field-row">
            <span className="schema-field-name">category</span>
            <span className="schema-field-type">string</span>
            <span className="schema-field-desc">
              Quick domain classification ("sports", "gossip", "geopolitics", "tech", etc.)
            </span>
          </div>
          <div className="schema-field-row">
            <span className="schema-field-name">relevanceScore</span>
            <span className="schema-field-type">number (0 to 100)</span>
            <span className="schema-field-desc">
              Fast initial estimation used against the Minimum Keep Threshold
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

