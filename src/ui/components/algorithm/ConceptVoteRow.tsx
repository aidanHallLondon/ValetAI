import React from "react";
import { CompoundRuleItem, CompoundRuleData } from "./CompoundRuleItem";

export interface ConceptTokenData {
  key: string;
  name: string;
  type: "category" | "entity";
  count: number;
  topSourceName?: string;
  isMuted?: boolean;
}

export interface ConceptVoteRowProps {
  token: ConceptTokenData;
  weight: number;
  isDragging?: boolean;
  transformStyle?: string;
  transitionStyle?: string;
  zIndexStyle?: number;
  rowRef?: (el: HTMLDivElement | null) => void;
  onDragStart?: (e: React.PointerEvent<HTMLDivElement>, key: string) => void;
  onDragMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onNavigateToFeedWithTag?: (
    name: string,
    type: "source" | "category" | "entity" | "tokenset",
    filterMode?: "all" | "unread",
    tokens?: string[]
  ) => void;
  onVote: (key: string, delta: number) => void;
  onToggleMute: (name: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: (key: string) => void;
  matchedRules?: CompoundRuleData[];
  onNavigateToFeedWithCompoundTag?: (
    label: string,
    type: "tokenset",
    filterMode?: any,
    tags?: string[]
  ) => void;
  onSetRuleWeight: (id: string, type: "vector" | "tokenset", delta: number) => void;
  onResetRule: (id: string, type: "vector" | "tokenset") => void;
  className?: string;
}

/**
 * Interactive draggable concept card allowing users to upvote, downvote,
 * hide from feed, inspect associated sources, and manage compound intersection rules.
 */
export function ConceptVoteRow({
  token,
  weight,
  isDragging = false,
  transformStyle,
  transitionStyle,
  zIndexStyle,
  rowRef,
  onDragStart,
  onDragMove,
  onDragEnd,
  onNavigateToFeedWithTag,
  onVote,
  onToggleMute,
  isExpanded = false,
  onToggleExpand,
  matchedRules = [],
  onNavigateToFeedWithCompoundTag,
  onSetRuleWeight,
  onResetRule,
  className = "",
}: ConceptVoteRowProps) {
  return (
    <div
      ref={rowRef}
      className={`concept-vote-row source-row vote-concept-row ${isDragging ? "is-dragging" : ""} ${
        token.isMuted ? "is-muted-card" : ""
      } ${className}`.trim()}
      style={{
        transform: transformStyle,
        transition: transitionStyle,
        zIndex: zIndexStyle,
      }}
    >
      <div className="source-row-top">
        {/* Drag Handle */}
        <div
          className="source-drag-handle"
          onPointerDown={(e) => onDragStart?.(e, token.key)}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          title="Drag to reorder priority"
          aria-label={`Drag handle for ${token.name}`}
        >
          <svg
            className="drag-handle-svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <circle cx="9" cy="5" r="1.75" />
            <circle cx="15" cy="5" r="1.75" />
            <circle cx="9" cy="12" r="1.75" />
            <circle cx="15" cy="12" r="1.75" />
            <circle cx="9" cy="19" r="1.75" />
            <circle cx="15" cy="19" r="1.75" />
          </svg>
        </div>

        {/* Frameless Avatar / Concept Icon */}
        <div className="source-avatar-container vote-avatar-container" aria-hidden="true">
          <span className="vote-type-avatar">
            {token.type === "category" ? "📁" : "🏷️"}
          </span>
        </div>

        {/* Main Content Column */}
        <div className="source-content-col">
          <div className="source-title-row">
            <button
              type="button"
              className="source-title-link vote-title-btn"
              onClick={() => onNavigateToFeedWithTag?.(token.name, token.type)}
              title={`Filter feed by ${token.name}`}
            >
              <strong className="source-display-name">{token.name}</strong>
            </button>

            <span className="source-tag">
              {token.type === "category" ? "DOMAIN" : "ENTITY"}
            </span>

            {token.isMuted && <span className="source-tag paused-tag">HIDDEN</span>}
          </div>

          <div className="source-sub-meta">
            <button
              type="button"
              className="source-count-btn total-btn"
              onClick={() => onNavigateToFeedWithTag?.(token.name, token.type)}
              title={`Filter feed by ${token.name}`}
            >
              {token.count} {token.count === 1 ? "article" : "articles"}
            </button>

            {token.topSourceName && (
              <>
                <span className="meta-divider">•</span>
                <span className="token-source-attribution">via {token.topSourceName}</span>
              </>
            )}

            {matchedRules.length > 0 && (
              <>
                <span className="meta-divider">•</span>
                <button
                  type="button"
                  className="source-count-btn rules-toggle-btn"
                  onClick={() => onToggleExpand?.(token.key)}
                  title="Toggle compound rules"
                >
                  {matchedRules.length} compound{" "}
                  {matchedRules.length === 1 ? "rule" : "rules"}{" "}
                  {isExpanded ? "▲" : "▼"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Actions: Vote count chip, Down, Up, Show/Hide eye button */}
        <div className="source-actions">
          {/* Vote Count Chip */}
          <span
            className={`source-weight-badge ${
              weight > 0
                ? "weight-positive"
                : weight < 0
                ? "weight-negative"
                : "weight-neutral"
            }`}
            title={`Vote weighting: ${weight > 0 ? `+${weight}` : weight}`}
          >
            {weight > 0 ? `+${weight}` : weight}
          </span>

          {/* Circular Down / Up Voting Buttons */}
          <div
            className="source-vote-group"
            role="group"
            aria-label={`Adjust weighting for ${token.name}`}
          >
            <button
              type="button"
              className={`vote-circle-btn vote-btn-down ${weight < 0 ? "is-active" : ""}`}
              onClick={() => onVote(token.key, -1)}
              title={`Downvote ${token.name}`}
              aria-label={`Downvote ${token.name}`}
              aria-pressed={weight < 0}
            >
              ▼
            </button>
            <button
              type="button"
              className={`vote-circle-btn vote-btn-up ${weight > 0 ? "is-active" : ""}`}
              onClick={() => onVote(token.key, 1)}
              title={`Upvote ${token.name}`}
              aria-label={`Upvote ${token.name}`}
              aria-pressed={weight > 0}
            >
              ▲
            </button>
          </div>

          {/* Show / Hide Eye Icon Button */}
          <button
            type="button"
            className={`secondary-btn icon-action-btn ${
              token.isMuted ? "btn-paused-toggle is-muted" : "btn-active-toggle"
            }`}
            onClick={() => onToggleMute(token.name)}
            title={
              token.isMuted
                ? `Show ${token.name} in feed (currently hidden)`
                : `Hide ${token.name} from feed`
            }
            aria-label={token.isMuted ? `Show ${token.name}` : `Hide ${token.name}`}
            aria-pressed={token.isMuted}
          >
            {token.isMuted ? (
              <svg
                className="svg-icon-sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                className="svg-icon-sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Compound Rules Panel */}
      {isExpanded && (
        <div className="token-compounds-container">
          <div className="compounds-header">
            <h5>Rules & Vectors including "{token.name}"</h5>
          </div>

          {matchedRules.length > 0 ? (
            <div className="active-compounds-list">
              {matchedRules.map((rule) => (
                <CompoundRuleItem
                  key={rule.id}
                  rule={rule}
                  currentTokenKey={token.key}
                  onNavigateToFeedWithTag={onNavigateToFeedWithCompoundTag}
                  onSetWeight={onSetRuleWeight}
                  onReset={onResetRule}
                />
              ))}
            </div>
          ) : (
            <p className="no-compounds-notice">
              No compound rules or vectors active for {token.name}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
