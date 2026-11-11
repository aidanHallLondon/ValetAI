import React, { useEffect, useState, useRef, useCallback } from "react";
import type { HydratedContentRecord, StoryChildArticle } from "../../../db/schema";
import { formatHumanAge, formatDateTime } from "../../utils/time";
import { FeedCard } from "../feed/FeedCard";
import { SourceBadge } from "../common/SourceBadge";
import { TagPreferencesState, DEFAULT_PREFERENCES } from "../../utils/algorithm";
import { BotAvatar } from "../common/BotAvatar";
import { AGENT_BOTS } from "../../utils/agents";
import { AgentLiveRequestCard } from "./AgentLiveRequestCard";
import { AgentIssueCard } from "./AgentIssueCard";
import { isKnownRefusalDomain, checkIfUrlRefusesIframe } from "../../utils/iframeDetection";
import { extractArticleNarrative, stripHeadlineRepetition } from "../../utils/articleNarrative";

export interface ReaderPageProps {
  item: HydratedContentRecord | null;
  items?: HydratedContentRecord[];
  preferences?: TagPreferencesState;
  onClose: () => void;
  onSelectItem?: (item: HydratedContentRecord) => void;
  onMarkRead?: (id: number, isRead?: boolean) => void;
  onToggleFollowStory?: (storyId: number) => void;
  onRate?: (item: HydratedContentRecord, rating: "hot" | "not") => void;
  onFilterBySource?: (sourceName: string) => void;
  isIframeView?: boolean;
  onToggleIframeView?: (open: boolean) => void;
}

export function ReaderPage({
  item,
  items = [],
  preferences,
  onClose,
  onSelectItem,
  onMarkRead,
  onToggleFollowStory,
  onRate,
  onFilterBySource,
  isIframeView: externalIframeView,
  onToggleIframeView: externalToggleIframeView,
}: ReaderPageProps) {
  const [activeItem, setActiveItem] = useState<HydratedContentRecord | null>(item);
  const [internalIframeView, setInternalIframeView] = useState<boolean>(false);
  const isIframeView = externalIframeView !== undefined ? externalIframeView : internalIframeView;
  const setIsIframeView = (open: boolean) => {
    if (externalToggleIframeView) {
      externalToggleIframeView(open);
    } else {
      setInternalIframeView(open);
    }
  };

  const [activeBotRequest, setActiveBotRequest] = useState<{
    bot: "reader" | "organiser" | "curator";
    botName: string;
    startedAt: string;
    model?: string;
    promptPreview?: string;
    stage: string;
  } | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchDetails = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/content/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.item) {
        setActiveItem(data.item);
        setActiveBotRequest(data.activeBotRequest || null);
        setLastPrompt(data.last_prompt || data.item.last_prompt || null);
        setLastResponse(data.last_response || data.item.last_response || null);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!item) {
      setActiveItem(null);
      setActiveBotRequest(null);
      return;
    }
    setActiveItem(item);
    fetchDetails(item.id);
  }, [item?.id, fetchDetails]);

  // Polling while a bot is actively running
  useEffect(() => {
    if (!activeItem) return;
    const isRunning =
      Boolean(activeBotRequest) ||
      activeItem.status === "processing" ||
      activeItem.status === "pending" ||
      activeItem.reader_status === "processing" ||
      activeItem.organiser_status === "processing" ||
      activeItem.curator_status === "processing";

    if (!isRunning) return;

    const interval = setInterval(() => {
      fetchDetails(activeItem.id);
    }, 1200);

    return () => clearInterval(interval);
  }, [activeItem?.id, activeBotRequest, activeItem?.status, activeItem?.reader_status, fetchDetails]);

  const displayItem = activeItem
    ? {
        ...activeItem,
        child_articles: activeItem.child_articles || item?.child_articles,
        sources: activeItem.sources || item?.sources,
      }
    : item;

  const handleRetryAnalysis = async () => {
    if (!displayItem) return;
    setIsRetrying(true);
    try {
      await fetch(`/api/content/${displayItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending", reader_status: "pending" }),
      });
      await fetchDetails(displayItem.id);
    } catch {}
    setIsRetrying(false);
  };

  // Mark read when opened
  useEffect(() => {
    if (displayItem && !displayItem.is_read) {
      fetch(`/api/content/${displayItem.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      })
        .then(() => onMarkRead?.(displayItem.id, true))
        .catch(() => {});
    }
  }, [displayItem?.id]);

  // Find index for next/previous navigation
  const currentIndex = items.findIndex((i) => i.id === item?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < items.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev && onSelectItem) {
      setIsIframeView(false);
      onSelectItem(items[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, items, onSelectItem]);

  const goToNext = useCallback(() => {
    if (hasNext && onSelectItem) {
      setIsIframeView(false);
      onSelectItem(items[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, items, onSelectItem]);

  // Keyboard navigation: ArrowLeft/ArrowRight, Escape
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isIframeView) {
          setIsIframeView(false);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose, goToPrev, goToNext, isIframeView]);

  if (!displayItem) return null;

  const analysis = displayItem.analysis;
  const narrative = extractArticleNarrative(displayItem);
  const title = narrative.headline;
  const summaryText = narrative.opening;
  const sourceName = displayItem.source_name || "Direct Ingestion";
  const ageDisplay = formatHumanAge(displayItem.published_at || displayItem.created_at);
  const childArticles: StoryChildArticle[] = displayItem.child_articles || [];

  const hasIssue =
    displayItem.status === "failed" ||
    displayItem.reader_status === "failed" ||
    Boolean(displayItem.error_message);

  // Favicon & Direct Link
  let domain = "";
  const directLink = displayItem.canonical_url || displayItem.source_url;
  const rssLink =
    displayItem.source_feed_url ||
    (displayItem.source_type === "rss" ? displayItem.source_url : null);
  if (directLink) {
    try {
      const u = new URL(directLink);
      domain = u.hostname.replace(/^feeds\./, "").replace(/^bbci\./, "bbc.");
      if (domain.includes("bbc")) domain = "bbc.co.uk";
    } catch {
      domain = "";
    }
  }
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : null;

  // Clean full article text into paragraphs without headline or summary repetition
  let bodyText = displayItem.raw_text.trim();
  bodyText = stripHeadlineRepetition(bodyText, title);
  if (summaryText) {
    bodyText = stripHeadlineRepetition(bodyText, summaryText);
  }
  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Normalize string for comparison
  const normalizeForComparison = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, "");

  const normSummary = normalizeForComparison(summaryText);
  const normBody = normalizeForComparison(bodyText);

  const isBodyDuplicateOfSummary =
    normSummary.length > 0 &&
    (normBody === normSummary ||
      (normBody.length <= normSummary.length + 30 &&
        (normSummary.includes(normBody) || normBody.includes(normSummary))));

  const showFullReport = bodyText.length > 0 && !isBodyDuplicateOfSummary;

  // Interactive Content Click Handler:
  // Detects if the source refuses iframes (e.g. BBC) or if Cmd/Ctrl is held, and opens in a new tab instead
  const handleContentClick = (e: React.MouseEvent) => {
    // If text was selected, do not trigger click
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 0) return;

    // Do not intercept clicks on buttons, links, or chips
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest(".entity-chip-btn")) {
      return;
    }

    if (!directLink) return;

    if (e.metaKey || e.ctrlKey || isKnownRefusalDomain(directLink)) {
      window.open(directLink, "_blank", "noopener,noreferrer");
    } else {
      void checkIfUrlRefusesIframe(directLink).then((refuses) => {
        if (refuses) {
          window.open(directLink, "_blank", "noopener,noreferrer");
        } else {
          setIsIframeView(true);
        }
      });
    }
  };

  const isBlockedDomain = isKnownRefusalDomain(directLink);

  return (
    <div className="reader-page" role="main" aria-label={`Article Reader: ${title}`}>
      {/* If Iframe View is active and allowed, fill page with embedded iframe viewer */}
      {isIframeView && directLink && !isBlockedDomain ? (
        <div className="reader-iframe-viewport">
          <iframe
            src={directLink}
            className="reader-iframe-element"
            title={title}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      ) : (
        /* Clean Reading Content Column */
        <article className="reader-container">
          {/* Hero Image at Top (Clickable with visual cue) */}
          {displayItem.image_url && (
            <div
              className="reader-hero-wrapper"
              onClick={handleContentClick}
              title={
                isBlockedDomain
                  ? "Click to open in new tab (site blocks iframe embedding)"
                  : "Click to open source page (Cmd/Ctrl+Click for new tab)"
              }
            >
              <img
                src={displayItem.image_url}
                alt=""
                className="reader-hero-image"
                onError={(e) => {
                  (e.target as HTMLElement).parentElement?.remove();
                }}
              />
              <span className="reader-hero-badge">
                {isBlockedDomain ? "Open article in new tab ↗" : "Open source page ↗"}
              </span>
            </div>
          )}

          {/* Clean Source Metadata Row (NO excess border line) */}
          <div className="reader-meta-row-clean">
            <SourceBadge
              sourceName={sourceName}
              domain={domain}
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
            <span className="reader-meta-dot" aria-hidden="true">·</span>
            <time
              className="reader-meta-age"
              dateTime={displayItem.published_at || displayItem.created_at}
            >
              {ageDisplay}
            </time>
            {rssLink && (
              <>
                <span className="reader-meta-dot" aria-hidden="true">·</span>
                <a
                  href={rssLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reader-meta-rss-link"
                  title={`Open RSS feed for ${sourceName}`}
                  aria-label={`Open RSS feed for ${sourceName}`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 11a9 9 0 0 1 9 9" />
                    <path d="M4 4a16 16 0 0 1 16 16" />
                    <circle cx="5" cy="19" r="1.5" fill="currentColor" />
                  </svg>
                  <span>RSS</span>
                </a>
              </>
            )}
          </div>

          {/* Live Bot Request in Progress Card */}
          {activeBotRequest && (
            <AgentLiveRequestCard
              bot={activeBotRequest.bot}
              botName={activeBotRequest.botName}
              stage={activeBotRequest.stage}
              model={activeBotRequest.model}
              promptPreview={activeBotRequest.promptPreview}
            />
          )}

          {/* Issue / Failure Inspection Card */}
          {hasIssue && !activeBotRequest && (
            <AgentIssueCard
              errorMessage={displayItem.error_message}
              isRetrying={isRetrying}
              onRetry={handleRetryAnalysis}
              lastPrompt={lastPrompt || displayItem.last_prompt}
              lastResponse={lastResponse || displayItem.last_response}
            />
          )}

          {/* Headline (Clickable) */}
          <h1
            className="reader-page-title"
            onClick={handleContentClick}
            title="Click to view in iframe (Cmd/Ctrl+Click for new window)"
          >
            {title}
          </h1>

          {/* Executive Summary (Clean Lead text without card box or subtitle, with inline icon) */}
          {summaryText && (
            <div
              className="reader-exec-summary-lead"
              onClick={handleContentClick}
              title="Click to view in iframe (Cmd/Ctrl+Click for new window)"
            >
              <span className="exec-summary-inline-icon" aria-hidden="true">
                ✨
              </span>
              <p className="exec-summary-text">{summaryText}</p>
            </div>
          )}

          {/* Key Action Items / Takeaways */}
          {analysis && analysis.actionItems && analysis.actionItems.length > 0 && (
            <section className="reader-card-section takeaways-section">
              <h2 className="reader-section-heading">Key Takeaways & Impact</h2>
              <ul className="reader-takeaways-list">
                {analysis.actionItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Full Readable Text Content (hidden if identical to Executive Summary) */}
          {showFullReport && (
            <section
              className="reader-card-section full-text-section"
              onClick={handleContentClick}
              title="Click to view in iframe (Cmd/Ctrl+Click for new window)"
            >
              <h2 className="reader-section-heading">Full Report</h2>
              <div className="reader-article-prose">
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, idx) => <p key={idx}>{p}</p>)
                ) : (
                  <p>{bodyText}</p>
                )}
              </div>
            </section>
          )}

          {/* Related Coverage & Child Stories at the Bottom (with anchor ID for toolbar cluster scrolling) */}
          {childArticles.length > 0 && (
            <section
              id="reader-clusters"
              className="reader-card-section related-stories-section"
            >
              <div className="related-stories-header">
                <h2 className="reader-section-heading">
                  Related Coverage & Story Updates ({childArticles.length})
                </h2>
                <span className="related-subtitle">
                  Reports collated from multiple feeds & updates for this thread
                </span>
              </div>

              <div className="related-cards-grid">
                {childArticles.map((ch) => {
                  const found = items.find((i) => i.id === ch.id);
                  const childRecord: HydratedContentRecord = found || {
                    id: ch.id,
                    source_id: ch.source_id ?? null,
                    source_name: ch.source_name ?? null,
                    source_url: ch.source_url ?? null,
                    raw_text: ch.summary || ch.title,
                    published_at: ch.published_at ?? null,
                    image_url: ch.image_url ?? null,
                    status: "completed",
                    is_read: false,
                    analysis: {
                      title: ch.title,
                      summary: ch.summary || "",
                      category: "general" as const,
                      sentiment: "neutral" as const,
                      keyEntities: [],
                      actionItems: [],
                      relevanceScore: 70,
                    },
                    analysis_json: null,
                    error_message: null,
                    created_at: ch.published_at || new Date().toISOString(),
                    updated_at: ch.published_at || new Date().toISOString(),
                  };

                  return (
                    <FeedCard
                      key={ch.id}
                      item={childRecord}
                      preferences={preferences || DEFAULT_PREFERENCES}
                      layoutMode="list"
                      onSelect={(selected) => {
                        if (onSelectItem) {
                          setIsIframeView(false);
                          onSelectItem(selected);
                        } else if (ch.source_url) {
                          window.open(ch.source_url, "_blank", "noopener,noreferrer");
                        }
                      }}
                      onFilterBySource={onFilterBySource}
                      onToggleFollowStory={onToggleFollowStory}
                      onRate={onRate}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Reader Footer: Entities & Topics and Debug Timings moved here */}
          <footer className="reader-footer">
            {/* Entities & Topics */}
            {analysis && analysis.keyEntities && analysis.keyEntities.length > 0 && (
              <div className="reader-footer-entities">
                <h3 className="reader-footer-label">Entities & Topics</h3>
                <div className="tags-container">
                  {analysis.keyEntities.map((ent) => (
                    <span key={ent} className="entity-chip-btn">
                      {ent}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Debug Processing Timings Banner in Footer */}
            {displayItem.processing_time_ms ? (
              <div className="reader-timing-banner footer-debug">
                <div className="timing-banner-main">
                  <span className="timing-banner-icon" aria-hidden="true">⏱</span>
                  <span className="timing-banner-label">Processing Time:</span>
                  <strong className="timing-banner-value">
                    {(displayItem.processing_time_ms / 1000).toFixed(2)}s
                  </strong>
                  <span className="timing-banner-note">
                    · Sent {formatHumanAge(displayItem.created_at || displayItem.updated_at)} ({formatDateTime(displayItem.created_at || displayItem.updated_at)})
                  </span>
                </div>
                {(() => {
                  try {
                    const timings = displayItem.stage_timings
                      ? JSON.parse(displayItem.stage_timings)
                      : null;
                    if (!timings) return null;
                    return (
                      <div className="timing-stage-chips">
                        {typeof timings.reader === "number" && (
                          <span className="timing-stage-chip reader">
                            <BotAvatar bot="reader" size="xs" />
                            <span>{AGENT_BOTS.reader.name}:</span>
                            <strong>{(timings.reader / 1000).toFixed(2)}s</strong>
                          </span>
                        )}
                        {typeof timings.organiser === "number" && (
                          <span className="timing-stage-chip organiser">
                            <BotAvatar bot="organiser" size="xs" />
                            <span>{AGENT_BOTS.organiser.name}:</span>
                            <strong>{(timings.organiser / 1000).toFixed(2)}s</strong>
                          </span>
                        )}
                        {typeof timings.curator === "number" && (
                          <span className="timing-stage-chip curator">
                            <BotAvatar bot="curator" size="xs" />
                            <span>{AGENT_BOTS.curator.name}:</span>
                            <strong>{(timings.curator / 1000).toFixed(2)}s</strong>
                          </span>
                        )}
                        {typeof timings.embed === "number" && (
                          <span className="timing-stage-chip embed">
                            <span className="timing-chip-icon">⚡</span>
                            <span>Embedding:</span>
                            <strong>{(timings.embed / 1000).toFixed(2)}s</strong>
                          </span>
                        )}
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>
            ) : (
              <div className="reader-timing-banner footer-debug">
                <div className="timing-banner-main">
                  <span className="timing-banner-icon" aria-hidden="true">⏱</span>
                  <span className="timing-banner-label">Sent for processing:</span>
                  <strong className="timing-banner-value">
                    {formatDateTime(displayItem.created_at || displayItem.updated_at)}
                  </strong>
                  <span className="timing-banner-note">
                    ({formatHumanAge(displayItem.created_at || displayItem.updated_at)})
                  </span>
                </div>
              </div>
            )}
          </footer>
        </article>
      )}
    </div>
  );
}

