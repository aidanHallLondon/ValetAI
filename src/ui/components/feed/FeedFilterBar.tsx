import React from "react";
import type { TagPreferencesState } from "../../utils/algorithm";
import { getTokenWeight, formatTemperature, normalizeTagKey } from "../../utils/algorithm";
import { Toggle } from "../common/Toggle";

export interface DynamicFilterTag {
  id: string;
  type: "source" | "entity" | "tokenset";
  value: string;
  label: string;
  tokens?: string[];
}

export interface FeedFilterBarProps {
  isAllActive: boolean;
  isFavouritesActive: boolean;
  isUrgentActive: boolean;
  followedCount: number;
  urgentCount: number;
  rawCount: number;
  includeRawContent: boolean;
  unreadOnly: boolean;
  includeReadContent?: boolean;
  onToggleIncludeRead?: () => void;
  readCount?: number;
  dynamicTags: DynamicFilterTag[];
  mutedTagKeys: string[];
  preferences: TagPreferencesState;
  hasAnyFiltersActive: boolean;
  onClearAll: () => void;
  onToggleMode: (mode: string) => void;
  onToggleIncludeRaw: () => void;
  onRemoveDynamicTag: (tag: DynamicFilterTag) => void;
  onUnsetUnreadOnly: () => void;
  onUnmuteTag: (key: string) => void;
  onAdjustTagTemperature: (tagValue: string, delta: number, tagLabel: string) => void;
  onRecordVectorVote: (tokens: string[], direction: "up" | "down") => void;
  className?: string;
}

/**
 * Filter toolbar for the article stream. Features system mode pills (All, Favourites, Urgent),
 * Read and Raw inclusion toggles, active entity/source filter chips with in-pill steering, and unread toggles.
 */
export function FeedFilterBar({
  isAllActive,
  isFavouritesActive,
  isUrgentActive,
  followedCount,
  urgentCount,
  rawCount,
  includeRawContent,
  unreadOnly,
  includeReadContent,
  onToggleIncludeRead,
  readCount,
  dynamicTags,
  mutedTagKeys,
  preferences,
  hasAnyFiltersActive,
  onClearAll,
  onToggleMode,
  onToggleIncludeRaw,
  onRemoveDynamicTag,
  onUnsetUnreadOnly,
  onUnmuteTag,
  onAdjustTagTemperature,
  onRecordVectorVote,
  className = "",
}: FeedFilterBarProps) {
  return (
    <div
      className={`feed-filter-bar unified-pills-row ${className}`.trim()}
      role="group"
      aria-label="Filter tags"
    >
      {/* 'All' Chip */}
      <button
        type="button"
        className={`filter-pill-btn ${isAllActive ? "pill-primary" : "pill-secondary"}`}
        onClick={onClearAll}
        aria-pressed={isAllActive}
      >
        All
      </button>

      {/* 'Favourites' Chip */}
      <button
        type="button"
        className={`filter-pill-btn ${isFavouritesActive ? "pill-primary" : "pill-secondary"} ${
          followedCount > 0 ? "pill-temp-warm" : ""
        }`}
        onClick={() => onToggleMode("following")}
        aria-pressed={isFavouritesActive}
        title="Stories and threads you are following"
      >
        <span>★ Favourites</span>
        {followedCount > 0 && (
          <span className="pill-temp-indicator">{followedCount}</span>
        )}
      </button>

      {/* 'Urgent' Chip */}
      <button
        type="button"
        className={`filter-pill-btn ${isUrgentActive ? "pill-primary" : "pill-secondary"} ${
          urgentCount > 0 ? "pill-temp-warm" : ""
        }`}
        onClick={() => onToggleMode("urgent")}
        aria-pressed={isUrgentActive}
        title="Urgent breaking reports & top relevance developments"
      >
        <span>⚡ Urgent</span>
        {urgentCount > 0 && <span className="pill-temp-indicator">{urgentCount}</span>}
      </button>

      {/* Read and Raw Standard Toggles */}
      <div className="filter-bar-toggles">
        <Toggle
          id="feed-toggle-read"
          size="sm"
          checked={includeReadContent !== undefined ? includeReadContent : !unreadOnly}
          onChange={() => {
            if (onToggleIncludeRead) {
              onToggleIncludeRead();
            } else if (unreadOnly) {
              onUnsetUnreadOnly();
            }
          }}
          label={
            <span className="feed-toggle-label-text">
              Read
              {readCount !== undefined && readCount > 0 && (
                <span className="feed-toggle-counter">({readCount})</span>
              )}
            </span>
          }
          className="feed-filter-toggle"
        />
        <Toggle
          id="feed-toggle-raw"
          size="sm"
          checked={includeRawContent}
          onChange={onToggleIncludeRaw}
          label={
            <span className="feed-toggle-label-text">
              Raw
              {rawCount !== undefined && rawCount > 0 && (
                <span className="feed-toggle-counter">({rawCount})</span>
              )}
            </span>
          }
          className="feed-filter-toggle"
        />
      </div>

      {/* Dynamic Active Filter Pills */}
      {dynamicTags.map((tag) => {
        const isTokenSet = tag.type === "tokenset";
        const tagKey = normalizeTagKey(tag.value);
        const tagTemp = getTokenWeight(preferences, tagKey);

        return (
          <span
            key={tag.id}
            className={`filter-pill-btn pill-primary pill-dynamic ${
              isTokenSet ? "pill-tokenset" : ""
            } ${tagTemp > 0 ? "pill-temp-warm" : tagTemp < 0 ? "pill-temp-cool" : ""}`}
          >
            <span className="pill-tag-label">
              {tag.type === "source"
                ? "Source: "
                : tag.type === "entity"
                ? "Entity: "
                : "Token Set: "}
              <strong>{tag.label}</strong>
              {tagTemp !== 0 && (
                <span className="pill-temp-indicator">
                  {tagTemp > 0 ? "▲" : "▼"} {formatTemperature(tagTemp)}
                </span>
              )}
            </span>

            {/* Steer buttons */}
            <span className="pill-inline-steer">
              <button
                type="button"
                className="pill-steer-btn cool"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isTokenSet && tag.tokens) {
                    onRecordVectorVote(tag.tokens, "down");
                  } else {
                    onAdjustTagTemperature(tag.value, -1, tag.label);
                  }
                }}
                title={`Downvote ${tag.label}`}
                aria-label={`Downvote ${tag.label}`}
              >
                ▼
              </button>
              <button
                type="button"
                className="pill-steer-btn hot"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isTokenSet && tag.tokens) {
                    onRecordVectorVote(tag.tokens, "up");
                  } else {
                    onAdjustTagTemperature(tag.value, 1, tag.label);
                  }
                }}
                title={`Upvote ${tag.label}`}
                aria-label={`Upvote ${tag.label}`}
              >
                ▲
              </button>
            </span>

            <button
              type="button"
              className="pill-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveDynamicTag(tag);
              }}
              aria-label={`Remove filter for ${tag.label}`}
              title={`Remove filter ${tag.label}`}
            >
              ✕
            </button>
          </span>
        );
      })}

      {/* Unread Only filter pill */}
      {unreadOnly && (
        <span className="filter-pill-btn pill-primary pill-dynamic pill-unread-indicator">
          <span className="pill-tag-label">
            📬 <strong>Unread Only</strong>
          </span>
          <button
            type="button"
            className="pill-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              onUnsetUnreadOnly();
            }}
            aria-label="Remove unread only filter"
            title="Show all articles (read & unread)"
          >
            ✕
          </button>
        </span>
      )}

      {/* Muted Topic Pills */}
      {mutedTagKeys.map((mutedKey) => (
        <span
          key={`muted-${mutedKey}`}
          className="filter-pill-btn pill-muted"
          title={`Muted: articles matching '${mutedKey}' are hidden`}
        >
          <span className="pill-tag-label">
            🚫 <em>{mutedKey}</em> (Muted)
          </span>
          <button
            type="button"
            className="pill-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              onUnmuteTag(mutedKey);
            }}
            aria-label={`Unmute ${mutedKey}`}
            title={`Unmute ${mutedKey}`}
          >
            ✕
          </button>
        </span>
      ))}

      {/* Explicit "Clear all" CTA */}
      {hasAnyFiltersActive && (
        <button
          type="button"
          className="clear-all-unified-btn"
          onClick={onClearAll}
          title="Clear all active filters and return to all articles"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

