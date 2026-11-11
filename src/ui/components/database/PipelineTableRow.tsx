import React from "react";
import type { HydratedContentRecord } from "../../../db/schema";
import { AGENT_BOTS } from "../../utils/agents";
import { formatHumanAge } from "../../utils/time";

export interface PipelineTableRowProps {
  item: HydratedContentRecord;
  isFinishing?: boolean;
  isExiting?: boolean;
  isItemWaiting?: boolean;
  isItemActive?: boolean;
  isProcessingOrQueued?: boolean;
  isReaderActive?: boolean;
  isReaderWaiting?: boolean;
  readerFailed?: boolean;
  readerCurrent?: boolean;
  readerOutdated?: boolean;
  isOrganiserActive?: boolean;
  isOrganiserWaiting?: boolean;
  organiserFailed?: boolean;
  organiserCurrent?: boolean;
  organiserDiminished?: boolean;
  isCuratorActive?: boolean;
  isCuratorWaiting?: boolean;
  curatorFailed?: boolean;
  curatorCurrent?: boolean;
  curatorDiminished?: boolean;
  onSelectItem?: (item: HydratedContentRecord) => void;
  onRerunStage: (itemId: number, stage: "reader" | "organiser" | "curator") => void;
  onStopItem: (itemId: number) => void;
  onReprocessItem: (itemId: number) => void;
  onDeleteItem: (itemId: number) => void;
}

/**
 * Interactive table row for a library article, featuring multi-stage bot discs,
 * lifecycle status badges, and actions to reprocess or delete.
 */
export function PipelineTableRow({
  item,
  isFinishing = false,
  isExiting = false,
  isItemWaiting = false,
  isItemActive = false,
  isProcessingOrQueued = false,
  isReaderActive = false,
  isReaderWaiting = false,
  readerFailed = false,
  readerCurrent = false,
  readerOutdated = false,
  isOrganiserActive = false,
  isOrganiserWaiting = false,
  organiserFailed = false,
  organiserCurrent = false,
  organiserDiminished = false,
  isCuratorActive = false,
  isCuratorWaiting = false,
  curatorFailed = false,
  curatorCurrent = false,
  curatorDiminished = false,
  onSelectItem,
  onRerunStage,
  onStopItem,
  onReprocessItem,
  onDeleteItem,
}: PipelineTableRowProps) {
  const isAnyRunning =
    isItemActive || isReaderActive || isOrganiserActive || isCuratorActive;
  const allCurrent = readerCurrent && organiserCurrent && curatorCurrent;
  const hasFailure = readerFailed || organiserFailed || curatorFailed;

  const headline =
    item.analysis?.title || item.raw_text.slice(0, 100).split("\n")[0] || "Untitled";
  const relativeAge = formatHumanAge(item.published_at || item.created_at);

  let domain = "";
  try {
    const urlToParse = item.canonical_url || item.source_url || "";
    if (urlToParse) {
      domain = new URL(urlToParse).hostname.replace(/^www\./, "");
    }
  } catch {}
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
    : null;

  const formatTimings = (ms?: number | null, timingsJson?: string | null) => {
    if (typeof ms === "number" && ms > 0) {
      const totalSec = (ms / 1000).toFixed(1) + "s";
      if (timingsJson) {
        try {
          const t = JSON.parse(timingsJson);
          const parts: string[] = [];
          if (t.reader) parts.push(`Reader: ${(t.reader / 1000).toFixed(1)}s`);
          if (t.organiser) parts.push(`Organiser: ${(t.organiser / 1000).toFixed(1)}s`);
          if (t.curator) parts.push(`Curator: ${(t.curator / 1000).toFixed(1)}s`);
          if (t.embed) parts.push(`Embed: ${(t.embed / 1000).toFixed(1)}s`);
          if (parts.length > 0) {
            return `⏱ Processing Time: ${totalSec} (${parts.join(" · ")})`;
          }
        } catch {}
      }
      return `⏱ Processing Time: ${totalSec}`;
    }
    return "⏱ Processing Time: Not recorded yet (tap bot dot to run/benchmark)";
  };

  const richTooltip = [
    `#${item.id} · ${item.source_name || domain || "Source"} (${relativeAge})`,
    headline,
    formatTimings(item.processing_time_ms, item.stage_timings),
    item.analysis?.category ? `Category: ${item.analysis.category}` : null,
    typeof item.analysis?.relevanceScore === "number"
      ? `Relevance Score: ${item.analysis.relevanceScore}/100`
      : null,
    item.analysis?.sentiment ? `Sentiment: ${item.analysis.sentiment}` : null,
    item.curated_shelf ? `Shelf: ${item.curated_shelf}` : null,
    item.analysis?.summary ? `\nSummary:\n${item.analysis.summary}` : null,
    `\n(Click row to open article reader popup)`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <tr
      className={`pipeline-table-row compact-table-row ${isFinishing ? "queue-row-finishing" : ""} ${
        isExiting ? "queue-row-exiting" : ""
      } ${allCurrent ? "row-fully-current" : ""}`}
      onClick={() => onSelectItem?.(item)}
      style={{ cursor: "pointer" }}
      title={richTooltip}
    >
      {/* Single-line Article Title Cell */}
      <td className="article-title-cell compact">
        <div className="single-line-article-row" title={richTooltip}>
          <span className="article-id-tag">#{item.id}</span>
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt={domain}
              className="compact-source-icon"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="compact-source-icon-fallback" aria-hidden="true">
              📰
            </span>
          )}
          <span className="compact-article-title">{headline}</span>
        </div>
      </td>

      {/* Bot 1: Reader Coloured Disc Button */}
      <td className="stage-disc-cell" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="bot-status-disc-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRerunStage(item.id, "reader");
          }}
          disabled={isReaderActive}
          title={
            isReaderActive
              ? `${AGENT_BOTS.reader.name}: Processing article #${item.id}...`
              : isReaderWaiting
              ? `${AGENT_BOTS.reader.name}: Waiting in queue to run next`
              : `Tap to rerun ${AGENT_BOTS.reader.name} on article #${item.id}`
          }
          aria-label={`Rerun ${AGENT_BOTS.reader.name} on article #${item.id}`}
        >
          {isReaderActive ? (
            <span className="bot-status-disc spinning">
              <span className="disc-spinner" />
            </span>
          ) : isReaderWaiting ? (
            <span
              className="bot-status-disc waiting-queued"
              style={{ borderColor: AGENT_BOTS.reader.color, color: AGENT_BOTS.reader.color }}
              title={`${AGENT_BOTS.reader.name}: Waiting in queue to run next`}
            >
              <span className="queued-pulse-dot" style={{ backgroundColor: AGENT_BOTS.reader.color }} />
            </span>
          ) : readerFailed ? (
            <span
              className="bot-status-disc failed"
              title={`${AGENT_BOTS.reader.name}: Failed (${item.error_message || "Error"})`}
            >
              ✕
            </span>
          ) : readerCurrent ? (
            <span
              className="bot-status-disc current"
              style={{ backgroundColor: AGENT_BOTS.reader.color }}
              title={`${AGENT_BOTS.reader.name}: Current`}
            >
              ✓
            </span>
          ) : readerOutdated ? (
            <span
              className="bot-status-disc diminished"
              style={{ backgroundColor: AGENT_BOTS.reader.color }}
              title={`${AGENT_BOTS.reader.name}: Outdated`}
            >
              ✓
            </span>
          ) : (
            <span
              className="bot-status-disc blank"
              title={`${AGENT_BOTS.reader.name}: Tap to run`}
            >
              ○
            </span>
          )}
        </button>
      </td>

      {/* Bot 2: Organiser Coloured Disc Button */}
      <td className="stage-disc-cell" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="bot-status-disc-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRerunStage(item.id, "organiser");
          }}
          disabled={isOrganiserActive}
          title={
            isOrganiserActive
              ? `${AGENT_BOTS.organiser.name}: Clustering article #${item.id}...`
              : isOrganiserWaiting
              ? `${AGENT_BOTS.organiser.name}: Waiting in queue to run next`
              : `Tap to rerun ${AGENT_BOTS.organiser.name} on article #${item.id}`
          }
          aria-label={`Rerun ${AGENT_BOTS.organiser.name} on article #${item.id}`}
        >
          {isOrganiserActive ? (
            <span className="bot-status-disc spinning">
              <span className="disc-spinner" />
            </span>
          ) : isOrganiserWaiting ? (
            <span
              className="bot-status-disc waiting-queued"
              style={{ borderColor: AGENT_BOTS.organiser.color, color: AGENT_BOTS.organiser.color }}
              title={`${AGENT_BOTS.organiser.name}: Waiting in queue to run next`}
            >
              <span className="queued-pulse-dot" style={{ backgroundColor: AGENT_BOTS.organiser.color }} />
            </span>
          ) : organiserFailed ? (
            <span
              className="bot-status-disc failed"
              title={`${AGENT_BOTS.organiser.name}: Failed`}
            >
              ✕
            </span>
          ) : organiserCurrent ? (
            <span
              className="bot-status-disc current"
              style={{ backgroundColor: AGENT_BOTS.organiser.color }}
              title={`${AGENT_BOTS.organiser.name}: Current`}
            >
              ✓
            </span>
          ) : organiserDiminished ? (
            <span
              className="bot-status-disc diminished"
              style={{ backgroundColor: AGENT_BOTS.organiser.color }}
              title={`${AGENT_BOTS.organiser.name}: Diminished`}
            >
              ✓
            </span>
          ) : (
            <span
              className="bot-status-disc blank"
              title={`${AGENT_BOTS.organiser.name}: Tap to cluster`}
            >
              ○
            </span>
          )}
        </button>
      </td>

      {/* Bot 3: Curator Coloured Disc Button */}
      <td className="stage-disc-cell" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="bot-status-disc-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRerunStage(item.id, "curator");
          }}
          disabled={isCuratorActive}
          title={
            isCuratorActive
              ? `${AGENT_BOTS.curator.name}: Curating article #${item.id}...`
              : isCuratorWaiting
              ? `${AGENT_BOTS.curator.name}: Waiting in queue to run next`
              : `Tap to rerun ${AGENT_BOTS.curator.name} on article #${item.id}`
          }
          aria-label={`Rerun ${AGENT_BOTS.curator.name} on article #${item.id}`}
        >
          {isCuratorActive ? (
            <span className="bot-status-disc spinning">
              <span className="disc-spinner" />
            </span>
          ) : isCuratorWaiting ? (
            <span
              className="bot-status-disc waiting-queued"
              style={{ borderColor: AGENT_BOTS.curator.color, color: AGENT_BOTS.curator.color }}
              title={`${AGENT_BOTS.curator.name}: Waiting in queue to run next`}
            >
              <span className="queued-pulse-dot" style={{ backgroundColor: AGENT_BOTS.curator.color }} />
            </span>
          ) : curatorFailed ? (
            <span
              className="bot-status-disc failed"
              title={`${AGENT_BOTS.curator.name}: Failed`}
            >
              ✕
            </span>
          ) : curatorCurrent ? (
            <span
              className="bot-status-disc current"
              style={{ backgroundColor: AGENT_BOTS.curator.color }}
              title={`${AGENT_BOTS.curator.name}: Current`}
            >
              ✓
            </span>
          ) : curatorDiminished ? (
            <span
              className="bot-status-disc diminished"
              style={{ backgroundColor: AGENT_BOTS.curator.color }}
              title={`${AGENT_BOTS.curator.name}: Diminished`}
            >
              ✓
            </span>
          ) : (
            <span
              className="bot-status-disc blank"
              title={`${AGENT_BOTS.curator.name}: Tap to curate`}
            >
              ○
            </span>
          )}
        </button>
      </td>

      {/* Single Checkmark / Spinner Status Column */}
      <td className="pipeline-single-check-cell">
        {item.status === "triage_discarded" ? (
          <span
            className="single-pipeline-check triage-discarded"
            style={{ color: "#94a3b8", fontSize: "0.85rem" }}
            title={`⛔ Discarded by Scout Triage: ${item.scout_reason || "Low relevance / excluded topic"}`}
          >
            ⛔
          </span>
        ) : isFinishing ? (
          <span className="single-pipeline-check success" title="Finished processing!">
            ✓
          </span>
        ) : isAnyRunning ? (
          <span
            className="single-pipeline-check spinning"
            title="Processing pipeline stages..."
          >
            <span className="disc-spinner" />
          </span>
        ) : isItemWaiting ? (
          <span
            className="single-pipeline-check waiting"
            title="Queued in execution order..."
          >
            <span className="queue-wait-glyph">⏳</span>
          </span>
        ) : allCurrent ? (
          <span
            className="single-pipeline-check success"
            title={
              item.processing_time_ms
                ? `All agents up to date · Processed in ${(item.processing_time_ms / 1000).toFixed(1)}s`
                : "All agents up to date"
            }
          >
            ✓
          </span>
        ) : hasFailure ? (
          <span className="single-pipeline-check failure" title="Pipeline issues detected">
            ✕
          </span>
        ) : (
          <span
            className="single-pipeline-check diminished"
            title="Incomplete or diminished pipeline stages"
          >
            ✓
          </span>
        )}
      </td>

      {/* Clean Icon Actions */}
      <td className="table-actions-cell" onClick={(e) => e.stopPropagation()}>
        <div className="icon-actions-group">
          {/* Stop or Reprocess Button */}
          {isProcessingOrQueued ? (
            <button
              type="button"
              className="icon-action-btn stop-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onStopItem(item.id);
              }}
              title={`Stop processing article #${item.id}`}
              aria-label={`Stop article #${item.id}`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="5" width="14" height="14" rx="2" ry="2" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="icon-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onReprocessItem(item.id);
              }}
              title="Reprocess article"
              aria-label="Reprocess"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          )}

          {/* Delete Button */}
          <button
            type="button"
            className="icon-action-btn danger-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteItem(item.id);
            }}
            title="Delete article record"
            aria-label="Delete"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

