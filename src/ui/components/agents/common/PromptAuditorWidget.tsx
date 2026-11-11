import React, { useState, useEffect } from "react";
import { AGENT_BOTS } from "../../../utils/agents";

export interface PromptAuditIssue {
  severity: "error" | "warning" | "info";
  message: string;
  fix?: string;
}

export interface PromptAuditSuggestion {
  title: string;
  description: string;
  fix?: string;
}

export interface PromptAuditResult {
  valid: boolean;
  score: number;
  issues: PromptAuditIssue[];
  suggestions: PromptAuditSuggestion[];
  tokensFound: string[];
}

interface PromptAuditorWidgetProps {
  prompt: string;
  promptType:
    | "scout-system"
    | "scout-template"
    | "analyst-system"
    | "analyst-template"
    | "analyst-rubric"
    | "clusterer-system"
    | "clusterer-template"
    | "curator-system"
    | "assistant-system"
    | "assistant-template"
    | "auditor-system";
  agentName?: string;
  onApplyFix?: (fix: string, isFullReplacement?: boolean) => void;
  className?: string;
}

export function PromptAuditorWidget({
  prompt,
  promptType,
  agentName = AGENT_BOTS.supervisor.name,
  onApplyFix,
  className = "",
}: PromptAuditorWidgetProps) {
  const [result, setResult] = useState<PromptAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsAuditing(true);

    const timer = setTimeout(() => {
      fetch("/api/ai/audit-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: promptType, agentName }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) {
            setResult(data);
            setIsAuditing(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIsAuditing(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [prompt, promptType, agentName]);

  if (!result && !isAuditing) return null;

  const score = result?.score ?? 100;
  const issues = result?.issues ?? [];
  const suggestions = result?.suggestions ?? [];
  const hasErrors = issues.some((i) => i.severity === "error");
  const hasWarnings = issues.some((i) => i.severity === "warning");

  const badgeClass = hasErrors
    ? "auditor-badge error"
    : hasWarnings
    ? "auditor-badge warning"
    : "auditor-badge valid";

  const badgeText = hasErrors
    ? `🔴 Quality Score: ${score}/100 (${issues.length} issue${issues.length > 1 ? "s" : ""})`
    : hasWarnings
    ? `🟡 Quality Score: ${score}/100 (${issues.length} suggestion${issues.length > 1 ? "s" : ""})`
    : `🟢 Valid & Ready (${score}/100)`;

  // Count actionable fixes
  const actionableFixesCount =
    issues.filter((i) => !!i.fix).length + suggestions.filter((s) => !!s.fix).length;

  const handleApplyAllFixes = () => {
    if (!onApplyFix) return;
    let updated = prompt;

    // 1. Automatically convert single braces {foo} to double braces {{foo}}
    updated = updated.replace(/(?<!\{)\{([a-zA-Z0-9_]+)\}(?!\})/g, "{{$1}}");

    // 2. Append missing required tokens if not present
    for (const issue of issues) {
      if (issue.fix && !updated.includes(issue.fix)) {
        updated += (updated.endsWith("\n") ? "" : "\n") + issue.fix;
      }
    }

    // 3. Append missing schema or format directives
    for (const sug of suggestions) {
      if (sug.fix && !updated.includes(sug.fix)) {
        updated += (updated.endsWith("\n") ? "" : "\n") + sug.fix;
      }
    }

    onApplyFix(updated, true);
  };

  return (
    <div className={`prompt-auditor-widget attached-editor-footer ${className}`.trim()} aria-label="Prompt Supervisor Evaluation">
      {/* Attached Footer Bar: Score on LEFT, Prompt Supervisor on RIGHT */}
      <div className="attached-footer-bar">
        <div className="attached-footer-left">
          <div className={badgeClass}>{badgeText}</div>
          {actionableFixesCount > 0 && onApplyFix && (
            <button
              type="button"
              className="auditor-apply-all-btn"
              onClick={handleApplyAllFixes}
              title="Automatically apply all fixes and re-evaluate"
            >
              ✨ Apply All Fixes ({actionableFixesCount})
            </button>
          )}
        </div>

        <div className="attached-footer-right">
          {isAuditing && <span className="auditor-evaluating-pill">Checking...</span>}
          <span className="supervisor-meta-pill" title={`${AGENT_BOTS.supervisor.name} Active`}>
            <span className="auditor-icon" aria-hidden="true">
              🛡️
            </span>
            <span className="auditor-agent-name">{AGENT_BOTS.supervisor.name}</span>
          </span>
        </div>
      </div>

      {/* Issues list (if any) */}
      {issues.length > 0 && (
        <div className="auditor-issues-list">
          {issues.map((issue, idx) => (
            <div key={idx} className={`auditor-issue-item ${issue.severity}`}>
              <div className="issue-content">
                <span className="issue-severity-icon">
                  {issue.severity === "error" ? "❌" : "⚠️"}
                </span>
                <span className="issue-message">{issue.message}</span>
              </div>
              {issue.fix && onApplyFix && (
                <button
                  type="button"
                  className="auditor-fix-btn"
                  onClick={() => {
                    if (
                      issue.fix?.startsWith("{{") &&
                      prompt.includes(issue.fix.replace(/^\{\{|\}\}$/g, ""))
                    ) {
                      const tokenName = issue.fix.replace(/^\{\{|\}\}$/g, "");
                      const regex = new RegExp(`(?<!\\{)\\{${tokenName}\\}(?!\\})`, "g");
                      onApplyFix(prompt.replace(regex, issue.fix), true);
                    } else if (issue.fix) {
                      onApplyFix(issue.fix);
                    }
                  }}
                  title={`Apply fix: ${issue.fix}`}
                >
                  Apply Fix
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actionable suggestions (if any) */}
      {suggestions.length > 0 && (
        <div className="auditor-suggestions-list">
          {suggestions.map((sug, idx) => (
            <div key={idx} className="auditor-suggestion-item">
              <div className="suggestion-info">
                <strong className="suggestion-title">💡 {sug.title}</strong>
                <p className="suggestion-desc">{sug.description}</p>
              </div>
              {sug.fix && onApplyFix && (
                <button
                  type="button"
                  className="auditor-apply-btn"
                  onClick={() => onApplyFix(sug.fix!)}
                  title="Apply suggestion to prompt"
                >
                  Apply Fix
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

