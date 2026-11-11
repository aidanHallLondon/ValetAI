import React from "react";
import { AgentPageHeader } from "./common/AgentPageHeader";
import { BotAvatar } from "../common/BotAvatar";

export interface PreferencesAuditResult {
  score: number;
  clarity: "excellent" | "good" | "needs_refinement";
  unfilledPlaceholders: string[];
  contradictions: string[];
  suggestions: Array<{ title: string; description: string; improvedSnippet?: string }>;
}

interface AboutMeTabProps {
  assistantToast: string | null;
  setAssistantToast: (val: string | null) => void;
  isCheckingPreferences: boolean;
  preferencesAudit: PreferencesAuditResult | null;
  preferencesTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  userPreferencesNotes: string;
  updateField: (field: any, val: any) => void;
  handleApplySuggestion: (snippet: string) => void;
  isSynthesizing: boolean;
  handleSynthesizeAssistant: () => void;
  assistantMasterDirective: string;
}

export const AboutMeTab: React.FC<AboutMeTabProps> = ({
  assistantToast,
  setAssistantToast,
  isCheckingPreferences,
  preferencesAudit,
  preferencesTextareaRef,
  userPreferencesNotes,
  updateField,
  handleApplySuggestion,
  isSynthesizing,
  handleSynthesizeAssistant,
  assistantMasterDirective,
}) => {
  return (
    <div className="about-me-tab agent-page-container">
      <AgentPageHeader
        avatarNode={
          <div className="about-me-avatar-badge" style={{ fontSize: "2.4rem", lineHeight: 1 }}>
            👤
          </div>
        }
        title="About Me"
        roleDescription="Personal Directives & News Profile"
        badgeColor="#6366f1"
        subtitle="Define your personal background, hometown, favorite sports teams, industries, and news preferences. These directives guide the Scout gatekeeper, Deep Reader, and Organiser bots to deliver intelligence tailored specifically to your life."
      />

      {/* Toast Notification */}
      {assistantToast && (
        <div className="notification-banner success" style={{ marginBottom: "1rem" }}>
          <span>{assistantToast}</span>
          <button
            type="button"
            className="close-btn"
            onClick={() => setAssistantToast(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Card 1: Your personal preferences and rules */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Your personal preferences and rules</h4>
            <p className="muted">
              Define your background, hometown, sports teams, industries, and specific dislikes in natural language.
            </p>
          </div>
          <div>
            {isCheckingPreferences ? (
              <span className="supervisor-auto-status checking">
                🛡️ Supervisor checking…
              </span>
            ) : preferencesAudit ? (
              <span className="supervisor-auto-status ready" title={`Clarity: ${preferencesAudit.clarity}`}>
                🛡️ Supervisor: {preferencesAudit.clarity === "excellent" ? "Clear & Ready" : preferencesAudit.clarity === "good" ? "Valid" : "Needs Refinement"} ({preferencesAudit.score}/100)
              </span>
            ) : null}
          </div>
        </div>

        <div className="attached-editor-frame">
          <div className="attached-editor-toolbar">
            <div className="attached-toolbar-left">
              <span className="editor-mode-badge">Natural Language Personal Directives</span>
            </div>
          </div>

          <textarea
            id="aboutMePreferencesNotes"
            ref={preferencesTextareaRef}
            className="attached-editor-textarea"
            rows={9}
            value={userPreferencesNotes || ""}
            onChange={(e) => updateField("userPreferencesNotes", e.target.value)}
            placeholder="E.g. Prioritise important news from my hometown London. I am a huge Wrexham fan. I hate celebrity gossip and routine sports..."
          />
        </div>

        {/* Supervisor Audit Results for User Preferences */}
        {preferencesAudit && (
          <div className="supervisor-audit-panel" style={{ marginTop: "1rem" }}>
            <div className="audit-header-row">
              <div className="audit-score-pill">
                <span className="audit-shield">🛡️</span>
                <span>Supervisor Score: <strong>{preferencesAudit.score} / 100</strong></span>
                <span className={`clarity-badge ${preferencesAudit.clarity}`}>{preferencesAudit.clarity.replace("_", " ")}</span>
              </div>
            </div>

            {preferencesAudit.unfilledPlaceholders && preferencesAudit.unfilledPlaceholders.length > 0 && (
              <div className="audit-warning-banner">
                ⚠️ <strong>Unfilled template placeholders detected:</strong> {preferencesAudit.unfilledPlaceholders.join(", ")}. Please edit these tags with your actual town, team, or industry.
              </div>
            )}

            {preferencesAudit.contradictions && preferencesAudit.contradictions.length > 0 && (
              <div className="audit-warning-banner">
                ⚠️ <strong>Potential contradictions:</strong> {preferencesAudit.contradictions.join("; ")}
              </div>
            )}

            {preferencesAudit.suggestions && preferencesAudit.suggestions.length > 0 && (
              <div className="audit-suggestions-list">
                <h5>Supervisor Recommendations:</h5>
                {preferencesAudit.suggestions.map((sug, sIdx) => (
                  <div key={sIdx} className="audit-suggestion-card">
                    <div className="suggestion-title">{sug.title}</div>
                    <div className="suggestion-desc">{sug.description}</div>
                    {sug.improvedSnippet && (
                      <button
                        type="button"
                        className="apply-suggestion-btn"
                        onClick={() => handleApplySuggestion(sug.improvedSnippet!)}
                      >
                        + Insert Refinement: "{sug.improvedSnippet}"
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card 2: Active Master Directive Display (Read-Only) */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>The agent bots use this to personalise their work for you</h4>
            <p className="muted">
              This executive guidance is actively injected into the Scout gatekeeper bot and the Deep Reader bot.
            </p>
          </div>
          <button
            type="button"
            className="update-assistant-btn"
            onClick={handleSynthesizeAssistant}
            disabled={isSynthesizing}
            title="Update master guidance using Assistant bot"
          >
            <BotAvatar bot="assistant" size="xs" />
            <span>{isSynthesizing ? "Updating…" : "Update"}</span>
          </button>
        </div>

        <div className="directive-read-only-card">
          <div className="directive-quote-bar" />
          <div className="directive-content">
            <p className="directive-text">
              {assistantMasterDirective || "No master guidance synthesized yet. Enter your preferences above and click Update."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
