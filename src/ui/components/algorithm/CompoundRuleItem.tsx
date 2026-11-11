import React from "react";
import { normalizeTagKey } from "../../utils/algorithm";

export interface CompoundRuleData {
  id: string;
  type: "vector" | "tokenset";
  tags: string[];
  weight: number;
  label?: string;
}

export interface CompoundRuleItemProps {
  rule: CompoundRuleData;
  currentTokenKey: string;
  onNavigateToFeedWithTag?: (
    tagName: string,
    type: "tokenset",
    filterMode?: any,
    tokens?: string[]
  ) => void;
  onSetWeight: (id: string, type: "vector" | "tokenset", delta: number) => void;
  onReset: (id: string, type: "vector" | "tokenset") => void;
  className?: string;
}

/**
 * Interactive row displaying a multi-concept rule with directional arrow,
 * concept tags, voting controls, and a delete button.
 */
export function CompoundRuleItem({
  rule,
  currentTokenKey,
  onNavigateToFeedWithTag,
  onSetWeight,
  onReset,
  className = "",
}: CompoundRuleItemProps) {
  const isBoost = rule.weight > 0;

  return (
    <div
      className={`compound-rule-item compound-rule-row ${isBoost ? "rule-boosted" : "rule-demoted"} ${className}`.trim()}
    >
      <button
        type="button"
        className="compound-tags-lockup compound-tags-btn"
        onClick={() =>
          onNavigateToFeedWithTag?.(
            rule.label || rule.tags.join(" + "),
            "tokenset",
            undefined,
            rule.tags
          )
        }
        title={`Filter feed by token set: ${rule.tags.join(" + ")}`}
        aria-label={`Filter feed by ${rule.tags.join(" + ")}`}
      >
        {rule.tags.map((tag, idx) => {
          const isCurrent = normalizeTagKey(tag) === currentTokenKey;
          return (
            <React.Fragment key={tag}>
              {idx > 0 && <span className="compound-plus">+</span>}
              <span className={`concept-pill ${isCurrent ? "current" : "partner"}`}>
                {tag}
              </span>
            </React.Fragment>
          );
        })}
        <span className="token-set-arrow" aria-hidden="true">
          →
        </span>
      </button>

      <div className="compound-actions-lockup">
        <div className="source-vote-group" role="group" aria-label="Vote on rule">
          <button
            type="button"
            className={`vote-circle-btn vote-btn-down ${rule.weight < 0 ? "is-active" : ""}`}
            onClick={() => onSetWeight(rule.id, rule.type, -1)}
            title="Downvote this rule"
            aria-label="Downvote rule"
          >
            ▼
          </button>

          <button
            type="button"
            className={`vote-circle-btn vote-btn-up ${rule.weight > 0 ? "is-active" : ""}`}
            onClick={() => onSetWeight(rule.id, rule.type, 1)}
            title="Upvote this rule"
            aria-label="Upvote rule"
          >
            ▲
          </button>
        </div>

        <button
          type="button"
          className="rule-pill-clear-btn"
          onClick={() => onReset(rule.id, rule.type)}
          title="Remove this rule"
          aria-label="Remove rule"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

