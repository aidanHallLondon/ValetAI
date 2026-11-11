import React, { useState, useRef, useEffect } from "react";
import type { HydratedContentRecord } from "../../../db/schema";
import { formatHumanAge } from "../../utils/time";
import { SourceBadge } from "../common/SourceBadge";
import { extractArticleNarrative } from "../../utils/articleNarrative";
import {
  TagPreferencesState,
  calculateArticleEffectiveScore,
  getArticleVote,
  ArticleScoreResult,
} from "../../utils/algorithm";

interface FeedCardProps {
  item: HydratedContentRecord;
  preferences: TagPreferencesState;
  scoreData?: ArticleScoreResult;
  onSelect: (item: HydratedContentRecord) => void;
  onFilterBySource?: (sourceName: string) => void;
  onFilterByEntity?: (entity: string) => void;
  onToggleFollowStory?: (storyId: number) => void;
  layoutMode?: "list" | "grid" | "compact";
  rating?: "hot" | "not" | null;
  onRate?: (item: HydratedContentRecord, rating: "hot" | "not") => void;
  onAdjustTagTemperature?: (tagName: string, delta: number) => void;
  onSwipeDismiss?: (item: HydratedContentRecord, direction: "left" | "right") => void;
  isDismissed?: boolean;
  tumblingDirection?: "left" | "right" | null;
  isCollapsing?: boolean;
}

export function FeedCard({
  item,
  preferences,
  scoreData,
  onSelect,
  onFilterBySource,
  onFilterByEntity,
  onToggleFollowStory,
  layoutMode = "list",
  rating = null,
  onRate,
  onSwipeDismiss,
  isDismissed = false,
  tumblingDirection = null,
  isCollapsing = false,
}: FeedCardProps) {
  const analysis = item.analysis;
  const isRaw = item.status === "pending" || item.status === "processing";
  const narrative = extractArticleNarrative(item);
  const title = narrative.headline;
  const summary = narrative.opening;
  const sourceName = item.source_name || "Direct Ingestion";

  // Story threading, multi-source aggregation & follow state
  const isFollowed = Boolean(item.is_followed);
  const childArticles = item.child_articles || [];
  const hasChildArticles = childArticles.length > 0;
  const sourcesList = item.sources && item.sources.length > 0 ? item.sources : [sourceName];
  const isMultiSource = sourcesList.length > 1;
  const displaySourceText = isMultiSource
    ? `${sourcesList.slice(0, 2).join(" + ")}${sourcesList.length > 2 ? ` +${sourcesList.length - 2}` : ""}`
    : sourceName;

  // Compute effective relevance score & adjustments from personal vector algorithm
  const score = scoreData || calculateArticleEffectiveScore(item, preferences);
  const { totalAdjustment } = score;

  // Determine current active vote state
  const activeVote =
    getArticleVote(preferences, item.id) ||
    (rating === "hot" ? "up" : rating === "not" ? "down" : null);
  const isUpvoted = activeVote === "up";
  const isDownvoted = activeVote === "down";

  // Compute human-readable relative age
  const ageDisplay = formatHumanAge(item.published_at || item.created_at);

  // Favicon URL from domain
  let domain = "";
  if (item.source_url) {
    try {
      const u = new URL(item.source_url);
      domain = u.hostname.replace(/^feeds\./, "").replace(/^bbci\./, "bbc.");
      if (domain.includes("bbc")) domain = "bbc.co.uk";
    } catch {
      domain = "";
    }
  }
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : null;

  // Extract key entity tags for the footer
  const cardTags = (analysis?.keyEntities || []).slice(0, 4);

  // Swipe / Drag gesture handling
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [localTumbling, setLocalTumbling] = useState<"left" | "right" | null>(null);

  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasHorizontalIntentRef = useRef<boolean | null>(null);
  const isPointerDownRef = useRef<boolean>(false);

  // If dismissed from parent props or locally
  const effectiveTumble = tumblingDirection || localTumbling;

  // Reset local state if parent undoes dismissal
  useEffect(() => {
    if (!tumblingDirection && !isDismissed) {
      setLocalTumbling(null);
      setDragOffset(0);
    }
  }, [tumblingDirection, isDismissed]);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (effectiveTumble) return;
    // Don't drag if clicking buttons, links, etc.
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea, [role='button']")) {
      return;
    }
    if (e.button !== 0) return; // Only primary mouse button or touch

    isPointerDownRef.current = true;
    hasHorizontalIntentRef.current = null;
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isPointerDownRef.current || effectiveTumble) return;

    const diffX = e.clientX - startPosRef.current.x;
    const diffY = e.clientY - startPosRef.current.y;

    if (hasHorizontalIntentRef.current === null) {
      if (Math.abs(diffY) > 8 && Math.abs(diffY) > Math.abs(diffX)) {
        hasHorizontalIntentRef.current = false;
        return;
      }
      if (Math.abs(diffX) > 8) {
        hasHorizontalIntentRef.current = true;
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch { }
        setIsDragging(true);
      }
    }

    if (hasHorizontalIntentRef.current) {
      const damped = diffX > 0 ? Math.min(240, diffX) : Math.max(-240, diffX);
      setDragOffset(damped);
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch { }

    if (hasHorizontalIntentRef.current) {
      if (dragOffset > 75) {
        // Deliberate Right swipe: Upvote & Read
        setLocalTumbling("right");
        onSwipeDismiss?.(item, "right");
        return;
      } else if (dragOffset < -75) {
        // Deliberate Left swipe: Downvote & Read
        setLocalTumbling("left");
        onSwipeDismiss?.(item, "left");
        return;
      }
    }

    setDragOffset(0);
    hasHorizontalIntentRef.current = null;
  };

  const isHotThreshold = dragOffset > 75;
  const isNotThreshold = dragOffset < -75;

  const isWarmArticle = totalAdjustment > 0;
  const isCoolArticle = totalAdjustment < 0;

  return (
    <div
      className={`feed-card-wrapper feed-card-wrapper-${layoutMode} ${effectiveTumble ? "is-dismissed" : ""
        } ${isCollapsing ? "is-collapsing" : ""}`}
    >
      {/* Swipe Action Revealer Backdrop */}
      <div className="swipe-action-backdrop" aria-hidden="true">
        <div
          className={`swipe-action-indicator swipe-left ${isNotThreshold ? "active" : ""
            }`}
          style={{
            opacity:
              dragOffset < 0
                ? Math.min(1, Math.max(0.15, Math.abs(dragOffset) / 75))
                : 0.15,
            transform: isNotThreshold ? "scale(1.06)" : undefined,
          }}
        >
          <span className="swipe-icon">▼</span>
          <span className="swipe-label">Downvote & Read</span>
        </div>
        <div
          className={`swipe-action-indicator swipe-right ${isHotThreshold ? "active" : ""
            }`}
          style={{
            opacity:
              dragOffset > 0
                ? Math.min(1, Math.max(0.15, dragOffset / 75))
                : 0.15,
            transform: isHotThreshold ? "scale(1.06)" : undefined,
          }}
        >
          <span className="swipe-icon">▲</span>
          <span className="swipe-label">Upvote & Read</span>
        </div>
      </div>

      <article
        className={`feed-card feed-card-${layoutMode} ${item.is_read ? "is-read" : "is-unread"
          } ${hasChildArticles ? "is-cluster" : ""} ${isCoolArticle ? "is-dampened" : ""} ${isUpvoted ? "rated-up" : ""
          } ${isDownvoted ? "rated-down" : ""} ${isDragging ? "is-dragging" : ""
          } ${effectiveTumble === "left" ? "is-tumbling-left" : ""} ${effectiveTumble === "right" ? "is-tumbling-right" : ""
          }`}
        onClick={(e) => {
          if (
            Math.abs(dragOffset) > 10 ||
            hasHorizontalIntentRef.current ||
            effectiveTumble
          ) {
            e.stopPropagation();
            return;
          }
          onSelect(item);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{
          transform:
            effectiveTumble === "right"
              ? "translate3d(140%, 60px, 0) rotate(26deg) scale(0.88)"
              : effectiveTumble === "left"
                ? "translate3d(-140%, 60px, 0) rotate(-26deg) scale(0.88)"
                : dragOffset !== 0
                  ? `translate3d(${dragOffset}px, 0, 0) rotate(${dragOffset * 0.04}deg)`
                  : undefined,
          opacity: effectiveTumble ? 0 : undefined,
          transition: effectiveTumble
            ? "transform 0.4s cubic-bezier(0.2, 0.85, 0.3, 1), opacity 0.35s ease-out"
            : isDragging
              ? "none"
              : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: effectiveTumble ? "none" : undefined,
        }}
      >
        {/* Main Content Layout: compact (top smaller image + title only), grid (top image + body), list (left thumbnail + text) */}
        {layoutMode === "compact" ? (
          <div className="feed-compact-content">
            {item.image_url && (
              <div className="feed-compact-image-wrapper">
                <img
                  src={item.image_url}
                  alt=""
                  className="feed-compact-img"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).parentElement?.remove();
                  }}
                />
              </div>
            )}
            <div className="feed-compact-body">
                <div className="feed-card-meta-top">
                  {isRaw && (
                    <span className="raw-content-pill" title="Unprocessed raw ingested content">
                      Raw
                    </span>
                  )}
                  <SourceBadge
                    sourceName={sourceName}
                    sources={sourcesList}
                    faviconUrl={faviconUrl}
                    onClick={
                      onFilterBySource
                        ? (e) => {
                          e.stopPropagation();
                          onFilterBySource(sourceName);
                        }
                        : undefined
                    }
                  />
                  {hasChildArticles && (
                    <SourceBadge
                      isCluster={true}
                      clusterCount={childArticles.length}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item);
                      }}
                    />
                  )}
                  <span className="meta-dot" aria-hidden="true">
                    ·
                  </span>
                  <time
                    className="meta-age"
                    dateTime={item.published_at || item.created_at}
                    title={new Date(item.created_at + "Z").toLocaleString()}
                  >
                    {ageDisplay}
                  </time>
                </div>
                <h2 className="feed-card-title">
                  <button
                    type="button"
                    className="title-link-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(item);
                    }}
                  >
                    {title}
                  </button>
                </h2>
            </div>
          </div>
        ) : layoutMode === "grid" ? (
          <div className="feed-grid-content">
            {item.image_url && (
              <div className="feed-grid-image-wrapper">
                <img
                  src={item.image_url}
                  alt=""
                  className="feed-grid-img"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).parentElement?.remove();
                  }}
                />
              </div>
            )}
            <div className="feed-grid-body">
              <div className="feed-card-narrative">
                  <div className="feed-card-meta-top">
                    {isRaw && (
                      <span className="raw-content-pill" title="Unprocessed raw ingested content">
                        Raw
                      </span>
                    )}
                    <SourceBadge
                      sourceName={sourceName}
                      sources={sourcesList}
                      faviconUrl={faviconUrl}
                      onClick={
                        onFilterBySource
                          ? (e) => {
                            e.stopPropagation();
                            onFilterBySource(sourceName);
                          }
                          : undefined
                      }
                    />
                    {hasChildArticles && (
                      <SourceBadge
                        isCluster={true}
                        clusterCount={childArticles.length}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item);
                        }}
                      />
                    )}
                    <span className="meta-dot" aria-hidden="true">
                      ·
                    </span>
                    <time
                      className="meta-age"
                      dateTime={item.published_at || item.created_at}
                      title={new Date(item.created_at + "Z").toLocaleString()}
                    >
                      {ageDisplay}
                    </time>
                  </div>
                  <h2 className="feed-card-title">
                    <button
                      type="button"
                      className="title-link-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item);
                      }}
                    >
                      {title}
                    </button>
                  </h2>
                  {summary && <p className="feed-card-summary">{summary}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="feed-list-content">
            {item.image_url && (
              <div className="feed-list-image-wrapper">
                <img
                  src={item.image_url}
                  alt=""
                  className="feed-list-img"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).parentElement?.remove();
                  }}
                />
              </div>
            )}
            <div className="feed-list-body">
              <div className="feed-card-narrative">
                  <div className="feed-card-meta-top">
                    {isRaw && (
                      <span className="raw-content-pill" title="Unprocessed raw ingested content">
                        Raw
                      </span>
                    )}
                    <SourceBadge
                      sourceName={sourceName}
                      sources={sourcesList}
                      faviconUrl={faviconUrl}
                      onClick={
                        onFilterBySource
                          ? (e) => {
                            e.stopPropagation();
                            onFilterBySource(sourceName);
                          }
                          : undefined
                      }
                    />
                    {hasChildArticles && (
                      <SourceBadge
                        isCluster={true}
                        clusterCount={childArticles.length}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item);
                        }}
                      />
                    )}
                    <span className="meta-dot" aria-hidden="true">
                      ·
                    </span>
                    <time
                      className="meta-age"
                      dateTime={item.published_at || item.created_at}
                      title={new Date(item.created_at + "Z").toLocaleString()}
                    >
                      {ageDisplay}
                    </time>
                  </div>
                  <h2 className="feed-card-title">
                    <button
                      type="button"
                      className="title-link-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item);
                      }}
                    >
                      {title}
                    </button>
                  </h2>
                  {summary && <p className="feed-card-summary">{summary}</p>}
              </div>
            </div>
          </div>
        )}

                    {/* Card Footer: Entity tags on left, Vote buttons on right */}
        <footer
                    className={`feed-card-footer ${layoutMode === "compact"
                        ? "feed-footer-compact"
                        : layoutMode === "grid"
                          ? "feed-footer-grid"
                          : "feed-footer-list"
                      }`}
                  >
                    <div className="feed-card-bottom-row">
                      {cardTags.length > 0 && (
                        <div className="feed-card-tags">
                          {(layoutMode === "compact" ? cardTags.slice(0, 2) : cardTags).map((entity) => (
                            <button
                              key={entity}
                              type="button"
                              className="entity-chip-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onFilterByEntity?.(entity);
                              }}
                              title={`Filter by tag: ${entity} (tap to up/downvote in filter bar)`}
                            >
                    {entity}
                  </button>
                ))}
                </div>
            )}

              {/* Simple round circular Up/Down vote buttons */}
              <div
                className="vote-buttons-group"
                role="group"
                aria-label="Vote for article tag combination"
              >
                <button
                  type="button"
                  className={`vote-circle-btn vote-btn-down ${isDownvoted ? "is-active" : ""
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRate?.(item, "not");
                  }}
                  title="Downvote this combination of tags"
                  aria-label="Downvote tag combination"
                  aria-pressed={isDownvoted}
                >
                  ▼
                </button>
                <button
                  type="button"
                  className={`vote-circle-btn vote-btn-up ${isUpvoted ? "is-active" : ""
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRate?.(item, "hot");
                  }}
                  title="Upvote this combination of tags"
                  aria-label="Upvote tag combination"
                  aria-pressed={isUpvoted}
                >
                  ▲
                </button>

                {item.story_id && (
                  <button
                    type="button"
                    className={`story-follow-btn ${isFollowed ? "is-following" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFollowStory?.(item.story_id!);
                    }}
                    title={isFollowed ? "Following this story (click to unfollow)" : "Follow this story thread"}
                    aria-label={isFollowed ? "Unfollow story" : "Follow story"}
                  >
                    {isFollowed ? "★" : "☆"}
                  </button>
                )}
              </div>
    </div>
        </footer >
      </article >
    </div >
  );
}
