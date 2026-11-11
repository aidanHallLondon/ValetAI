import React from "react";

export interface AgentIssueCardProps {
  errorMessage?: string | null;
  isRetrying?: boolean;
  onRetry: () => void;
  lastPrompt?: string | null;
  lastResponse?: string | null;
  className?: string;
}

/**
 * Diagnostic alert card displayed when an AI agent encounters an execution failure.
 * Features an error trace viewer, sent prompt inspection, and a 1-click retry button.
 */
export function AgentIssueCard({
  errorMessage = "The agent encountered an error while processing this content.",
  isRetrying = false,
  onRetry,
  lastPrompt,
  lastResponse,
  className = "",
}: AgentIssueCardProps) {
  return (
    <div className={`agent-issue-card ${className}`.trim()} role="alert">
      <div className="agent-issue-header">
        <div className="agent-issue-title-group">
          <span className="issue-warning-icon" aria-hidden="true">
            ⚠️
          </span>
          <div>
            <strong className="agent-issue-title">
              Agent Processing Issue Encountered
            </strong>
            <p className="agent-issue-msg">{errorMessage}</p>
          </div>
        </div>
        <button
          type="button"
          className="agent-retry-btn"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? "Retrying..." : "↻ Retry Analysis"}
        </button>
      </div>

      {/* Prompt sent */}
      {lastPrompt && (
        <details className="agent-issue-details-fold" open>
          <summary>Prompt Sent to Model</summary>
          <pre className="agent-debug-pre">{lastPrompt}</pre>
        </details>
      )}

      {/* Response received */}
      {lastResponse && (
        <details className="agent-issue-details-fold" open>
          <summary>Model Response / Error Trace</summary>
          <pre className="agent-debug-pre error-pre">{lastResponse}</pre>
        </details>
      )}
    </div>
  );
}
