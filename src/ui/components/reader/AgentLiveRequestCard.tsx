import React from "react";
import { BotAvatar } from "../common/BotAvatar";
import type { AgentId } from "../../utils/agents";

export interface AgentLiveRequestCardProps {
  bot: AgentId;
  botName: string;
  stage: string;
  model?: string;
  promptPreview?: string;
  className?: string;
}

/**
 * Real-time diagnostic card presenting active bot execution status,
 * halo avatar, model identifier, and collapsible raw prompt preview.
 */
export function AgentLiveRequestCard({
  bot,
  botName,
  stage,
  model,
  promptPreview,
  className = "",
}: AgentLiveRequestCardProps) {
  return (
    <div className={`agent-live-request-card ${className}`.trim()} aria-live="polite">
      <div className="agent-request-header">
        <div className="agent-request-identity">
          <BotAvatar bot={bot} size="sm" showHalo />
          <div className="agent-request-titles">
            <strong className="agent-request-bot-name">
              {botName} is processing this article
            </strong>
            <span className="agent-request-stage">{stage}</span>
          </div>
        </div>
        <div className="agent-request-status-pill">
          <span className="disc-spinner" />
          <span>Active Request</span>
        </div>
      </div>

      <div className="agent-request-meta-grid">
        {model && (
          <div className="request-meta-item">
            <span className="meta-label">Model:</span>
            <code className="meta-code">{model}</code>
          </div>
        )}
        <div className="request-meta-item">
          <span className="meta-label">Active Stage:</span>
          <span className="meta-val">{stage}</span>
        </div>
      </div>

      {promptPreview && (
        <details className="agent-request-prompt-details" open>
          <summary>Prompt Request Payload</summary>
          <pre className="agent-prompt-code-block">{promptPreview}</pre>
        </details>
      )}
    </div>
  );
}

