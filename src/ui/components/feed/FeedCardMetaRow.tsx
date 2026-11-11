import React from "react";
import type { HydratedContentRecord } from "../../../db/schema";
import { formatHumanAge } from "../../utils/time";
import { SourceBadge } from "../common/SourceBadge";
import { VoteControl } from "../common/VoteControl";
import {
  TagPreferencesState,
  DEFAULT_PREFERENCES,
  calculateArticleEffectiveScore,
  getArticleVote,
  DEBUG,
  ArticleScoreResult,
} from "../../utils/algorithm";

export interface FeedCardMetaRowProps {
  item: HydratedContentRecord;
  preferences?: TagPreferencesState;
  scoreData?: ArticleScoreResult;
  onFilterBySource?: (sourceName: string) => void;
  onToggleFollowStory?: (storyId: number) => void;
  onRate?: (item: HydratedContentRecord, rating: "hot" | "not") => void;
  className?: string;
}

export function FeedCardMetaRow({
  item,
  preferences,
  scoreData,
  onFilterBySource,
  onToggleFollowStory,
  onRate,
  className = "",
}: FeedCardMetaRowProps) {
  const analysis = item.analysis;
  const title =
    analysis?.title || item.source_name || `Intelligence Brief #${item.id}`;
  const sourceName = item.source_name || "Direct Ingestion";

  const isFollowed = Boolean(item.is_followed);
  const sourcesList =
    item.sources && item.sources.length > 0 ? item.sources : [sourceName];
  const isMultiSource = sourcesList.length > 1;
  const displaySourceText = isMultiSource
    ? `${sourcesList.slice(0, 2).join(" + ")}${
        sourcesList.length > 2 ? ` +${sourcesList.length - 2}` : ""
      }`
    : sourceName;

  const prefs = preferences || DEFAULT_PREFERENCES;
  const score = scoreData || calculateArticleEffectiveScore(item, prefs);

  const activeVote = getArticleVote(prefs, item.id);
  const isUpvoted = activeVote === "up";
  const isDownvoted = activeVote === "down";

  const ageDisplay = formatHumanAge(item.published_at || item.created_at);

  const handleDebugClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = [
      `=== VALET ARTICLE RANKING DEBUG DATA ===`,
      `Title: ${title}`,
      `ID: ${item.id} | Source: ${sourceName} (Weight: ${
        score.sourceWeight >= 0 ? "+" : ""
      }${score.sourceWeight})`,
      `URL: ${item.source_url || "N/A"}`,
      `Published: ${item.published_at || item.created_at}`,
      `----------------------------------------`,
      score.debugTooltip,
      `========================================`,
    ].join("\n");
    console.log(payload);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).catch(() => {});
    }
  };

  let domain = "";
  const directLink = item.canonical_url || item.source_url;
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
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        domain
      )}&sz=64`
    : null;

  return (
    <div className={`feed-card-meta-row feed-card-footer feed-footer-list ${className}`.trim()}>
      <div className="footer-list-left-group">
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

        {typeof item.processing_time_ms === "number" && item.processing_time_ms > 0 && (
          <>
            <span className="meta-dot" aria-hidden="true">
              ·
            </span>
            <span
              className="meta-processing-time"
              title={
                item.stage_timings
                  ? (() => {
                      try {
                        const t = JSON.parse(item.stage_timings);
                        const parts = [];
                        if (t.reader) parts.push(`Reader: ${(t.reader / 1000).toFixed(1)}s`);
                        if (t.organiser) parts.push(`Organiser: ${(t.organiser / 1000).toFixed(1)}s`);
                        if (t.curator) parts.push(`Curator: ${(t.curator / 1000).toFixed(1)}s`);
                        if (t.embed) parts.push(`Embed: ${(t.embed / 1000).toFixed(1)}s`);
                        return `Processing Time: ${(item.processing_time_ms! / 1000).toFixed(2)}s (${parts.join(" · ")})`;
                      } catch {
                        return `Processing Time: ${(item.processing_time_ms! / 1000).toFixed(2)}s`;
                      }
                    })()
                  : `Processing Time: ${(item.processing_time_ms / 1000).toFixed(2)}s`
              }
            >
              ⏱ {(item.processing_time_ms / 1000).toFixed(1)}s
            </span>
          </>
        )}

        {DEBUG && (
          <>
            <span className="meta-dot" aria-hidden="true">
              ·
            </span>
            <span
              className="debug-score-pill"
              title={`${score.debugTooltip}\n\n(Click to copy & print to console)`}
              onClick={handleDebugClick}
            >
              ⚡ {score.rankScore.toFixed(1)}
            </span>
          </>
        )}
      </div>

      {/* Circular vote buttons & Follow button */}
      <div
        className="vote-buttons-group"
        role="group"
        aria-label="Article controls"
      >
        <VoteControl
          vote={activeVote}
          onVote={(dir) => onRate?.(item, dir)}
        />

        {item.story_id && (
          <button
            type="button"
            className={`story-follow-btn ${isFollowed ? "is-following" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollowStory?.(item.story_id!);
            }}
            title={
              isFollowed
                ? "Following this story (click to unfollow)"
                : "Follow this story thread"
            }
            aria-label={isFollowed ? "Unfollow story" : "Follow story"}
          >
            {isFollowed ? "★" : "☆"}
          </button>
        )}
      </div>
    </div>
  );
}
