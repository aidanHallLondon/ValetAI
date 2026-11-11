import React from "react";

export interface PipelineControlBarProps {
  viewMode: "items" | "queue";
  totalCount: number;
  runningCount: number;
  queuedCount: number;
  issuesCount: number;
  mainFilter: "all" | "issues";
  onSetMainFilter: (filter: "all" | "issues") => void;
  onStopAll: () => void;
  onProcessEverything: (forceAll: boolean) => void;
  isProcessingAll?: boolean;
  processingAction?: string | null;
  className?: string;
}

/**
 * Control toolbar for the library pipeline table, displaying queue counters,
 * batch processing actions (Stop All, Refresh Issues, Rerun All), and status filters.
 */
export function PipelineControlBar({
  viewMode,
  totalCount,
  runningCount,
  queuedCount,
  issuesCount,
  mainFilter,
  onSetMainFilter,
  onStopAll,
  onProcessEverything,
  isProcessingAll = false,
  processingAction = null,
  className = "",
}: PipelineControlBarProps) {
  return (
    <div className={`pipeline-control-bar-wrapper ${className}`.trim()}>
      {/* Title Row with Action Buttons */}
      <div className="library-title-bar">
        <div className="library-title-left">
          <h2 className="library-main-title">
            {viewMode === "queue" ? "Execution Queue" : "Items"}
          </h2>
          <span className="library-total-badge">
            {viewMode === "queue"
              ? `${runningCount} Running · ${queuedCount} Queued`
              : `${totalCount} Total Items`}
          </span>
        </div>

        <div className="library-title-actions">
          {viewMode === "queue" && (runningCount > 0 || queuedCount > 0) && (
            <button
              type="button"
              className="library-action-btn danger"
              onClick={onStopAll}
              title="Stop and cancel all queued and processing articles"
              aria-label="Stop all"
            >
              <span className="btn-icon">⏹</span>
              <span>Stop all</span>
            </button>
          )}
          <button
            type="button"
            className="library-action-btn primary"
            onClick={() => onProcessEverything(false)}
            disabled={isProcessingAll || !!processingAction}
            title="Refresh issues: Brings all missing and outdated articles up to date"
            aria-label="Refresh issues"
          >
            <span className="btn-icon">↻</span>
            <span>{isProcessingAll ? "Processing..." : "Refresh issues"}</span>
          </button>
          <button
            type="button"
            className="library-action-btn secondary"
            onClick={() => onProcessEverything(true)}
            disabled={isProcessingAll || !!processingAction}
            title="Rerun all: Force re-runs all agents across the entire library"
            aria-label="Rerun all"
          >
            <span className="btn-icon">⚡</span>
            <span>Rerun all</span>
          </button>
        </div>
      </div>

      {/* Main Filter Bar: Shown in Items mode */}
      {viewMode === "items" && (
        <div className="library-control-bar">
          <div className="filter-pill-group">
            <button
              type="button"
              className={mainFilter === "all" ? "small-pill active" : "small-pill"}
              onClick={() => onSetMainFilter("all")}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              className={mainFilter === "issues" ? "small-pill active danger" : "small-pill"}
              onClick={() => onSetMainFilter("issues")}
            >
              Issues ({issuesCount})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

