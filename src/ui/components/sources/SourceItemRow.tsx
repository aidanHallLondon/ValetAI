import React from "react";
import type { SourceRecord, HydratedContentRecord } from "../../../db/schema";
import { formatHumanAge } from "../../utils/time";

export interface SourceItemRowProps {
  source: SourceRecord;
  items: HydratedContentRecord[];
  weight: number;
  isDragging?: boolean;
  isPulse?: boolean;
  transformStyle?: string;
  transitionStyle?: string;
  zIndexStyle?: number;
  rowRef?: (el: HTMLDivElement | null) => void;
  onDragStart?: (e: React.PointerEvent<HTMLDivElement>, id: number) => void;
  onDragMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onVoteUp: (id: number) => void;
  onVoteDown: (id: number) => void;
  onRefresh: (id: number) => void;
  isRefreshing?: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigateToFeedWithTag?: (
    name: string,
    type: "source" | "category" | "entity",
    filterMode?: "all" | "unread"
  ) => void;
  onNavigateToDb?: () => void;
}

/**
 * Interactive draggable source row presenting feed health, unread counts,
 * algorithm weighting slider, and lifecycle actions (refresh, pause, delete).
 */
export function SourceItemRow({
  source: src,
  items,
  weight,
  isDragging = false,
  isPulse = false,
  transformStyle,
  transitionStyle,
  zIndexStyle,
  rowRef,
  onDragStart,
  onDragMove,
  onDragEnd,
  onVoteUp,
  onVoteDown,
  onRefresh,
  isRefreshing = false,
  onToggle,
  onDelete,
  onNavigateToFeedWithTag,
  onNavigateToDb,
}: SourceItemRowProps) {
  let domain = "";
  try {
    const u = new URL(src.url);
    domain = u.hostname.replace(/^feeds\./, "").replace(/^bbci\./, "bbc.");
    if (domain.includes("bbc")) domain = "bbc.co.uk";
  } catch {
    domain = src.url;
  }
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

  // Content counts and failure detection for this source
  const sourceItems = items.filter((i) => i.source_id === src.id);
  const totalArticles = sourceItems.length;
  const unreadArticles = sourceItems.filter((i) => !i.is_read).length;
  const latestItem = sourceItems[0];
  const hasFailed = latestItem?.status === "failed";
  const targetSiteLink = src.site_url || src.url;

  return (
    <div
      ref={rowRef}
      className={`source-item-row source-row ${isDragging ? "is-dragging" : ""} ${isPulse ? "new-source-pulse" : ""}`}
      style={{
        transform: transformStyle,
        transition: transitionStyle,
        zIndex: zIndexStyle,
      }}
    >
      {/* Drag Handle to reorder and reweight */}
      <div
        className="source-drag-handle"
        onPointerDown={(e) => onDragStart?.(e, src.id)}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        title="Drag to reorder source priority and reweight"
        aria-label={`Drag handle for ${src.name}`}
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

      {/* Frameless Avatar Icon linking directly to the website */}
      <a
        href={targetSiteLink}
        target="_blank"
        rel="noopener noreferrer"
        className="source-avatar-container"
        title={`Visit ${src.name}: ${targetSiteLink}`}
      >
        <img
          src={faviconUrl}
          alt=""
          className="source-avatar-img"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
            const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div className="source-avatar-fallback" style={{ display: "none" }} aria-hidden="true">
          <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
        </div>
      </a>

      {/* Main Source Info with linked title & clipped non-wrapping description */}
      <div className="source-content-col">
        <div className="source-title-row">
          <a
            href={targetSiteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="source-title-link"
            title={`Visit ${src.name}: ${targetSiteLink}`}
          >
            <strong className="source-display-name">{src.name}</strong>
          </a>

          {src.description && (
            <span className="source-description" title={src.description}>
              — {src.description}
            </span>
          )}

          {!src.enabled && (
            <span className="source-tag paused-tag">PAUSED</span>
          )}

          <span
            className={`source-weight-badge ${
              weight > 0
                ? "weight-positive"
                : weight < 0
                ? "weight-negative"
                : "weight-neutral"
            }`}
            title={`Algorithm weighting: ${weight > 0 ? `+${weight}` : weight}`}
          >
            {weight > 0 ? `+${weight}` : weight}
          </span>
        </div>

        <div className="source-sub-meta">
          {/* Relative time with new items count (or 'checked' if 0) */}
          {(() => {
            if (!src.last_fetched_at) {
              return <span className="fetch-time">Never checked</span>;
            }
            const relTime = formatHumanAge(src.last_fetched_at);
            const count = src.last_fetch_count || 0;
            if (count > 0) {
              return (
                <span className="fetch-time">
                  fetched {relTime} <span className="new-count-badge">({count} new)</span>
                </span>
              );
            }
            return <span className="fetch-time">checked {relTime}</span>;
          })()}

          <span className="meta-divider">•</span>

          {/* Format tag linked directly to the feed endpoint */}
          <a
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-tag source-feed-link-tag"
            title={`View raw feed / endpoint: ${src.url}`}
          >
            {src.type === "rss" ? "RSS" : src.type.toUpperCase()}
          </a>

          <span className="meta-divider">•</span>

          {/* Article counts with direct links to Feed with unread or all filter */}
          <span className="source-article-counts">
            <button
              type="button"
              className="source-count-btn unread-btn"
              onClick={() =>
                onNavigateToFeedWithTag?.(src.name, "source", "unread")
              }
              title={`Filter Feed to unread articles from ${src.name}`}
            >
              {unreadArticles} unread
            </button>
            <span className="meta-slash" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              className="source-count-btn total-btn"
              onClick={() =>
                onNavigateToFeedWithTag?.(src.name, "source", "all")
              }
              title={`Filter Feed to all articles from ${src.name}`}
            >
              {totalArticles} total
            </button>
          </span>

          {/* Explicit failure indicator with direct link to Library view */}
          {hasFailed && (
            <>
              <span className="meta-divider">•</span>
              <button
                type="button"
                className="failure-alert-link"
                onClick={() => onNavigateToDb?.()}
                title="Click to view failure logs and raw data in the Library page"
              >
                <span aria-hidden="true">⚠️</span>
                <span>Failed: {latestItem.error_message || "Processing error"}</span>
                <span className="view-log-tag">View in Library logs →</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Per-Source Action Buttons */}
      <div className="source-actions">
        {/* Consistent Circular Up/Down Voting Buttons */}
        <div
          className="source-vote-group"
          role="group"
          aria-label={`Adjust weighting for ${src.name}`}
        >
          <button
            type="button"
            className={`vote-circle-btn vote-btn-down ${
              weight < 0 ? "is-active" : ""
            }`}
            onClick={() => onVoteDown(src.id)}
            title={`Downvote / move down ${src.name} (Current: ${
              weight > 0 ? `+${weight}` : weight
            })`}
            aria-label={`Downvote ${src.name}`}
            aria-pressed={weight < 0}
          >
            ▼
          </button>
          <button
            type="button"
            className={`vote-circle-btn vote-btn-up ${
              weight > 0 ? "is-active" : ""
            }`}
            onClick={() => onVoteUp(src.id)}
            title={`Upvote / move up ${src.name} (Current: ${
              weight > 0 ? `+${weight}` : weight
            })`}
            aria-label={`Upvote ${src.name}`}
            aria-pressed={weight > 0}
          >
            ▲
          </button>
        </div>

        {/* Per-source Refresh button */}
        <button
          type="button"
          className="secondary-btn icon-action-btn"
          onClick={() => onRefresh(src.id)}
          disabled={isRefreshing}
          title={`Fetch latest items from ${src.name}`}
          aria-label={`Refresh ${src.name}`}
        >
          <svg
            className={`svg-icon-sm ${isRefreshing ? "spin-icon" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </button>

        {/* Enable / Disable Toggle Icon Button */}
        <button
          type="button"
          className={`secondary-btn icon-action-btn ${src.enabled ? "btn-active-toggle" : "btn-paused-toggle"}`}
          onClick={() => onToggle(src.id)}
          title={src.enabled ? `Pause ${src.name}` : `Enable ${src.name}`}
          aria-label={src.enabled ? `Disable ${src.name}` : `Enable ${src.name}`}
        >
          {src.enabled ? (
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
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
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
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Delete Icon Button */}
        <button
          type="button"
          className="secondary-btn icon-action-btn danger-icon-btn"
          onClick={() => onDelete(src.id)}
          title={`Delete ${src.name}`}
          aria-label={`Delete ${src.name}`}
        >
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
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  );
}
