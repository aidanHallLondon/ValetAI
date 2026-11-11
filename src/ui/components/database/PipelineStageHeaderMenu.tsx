import React from "react";
import { BotAvatar } from "../common/BotAvatar";
import { AGENT_BOTS } from "../../utils/agents";

export type StageFilterOption = "all" | "problems" | "problems_old";

export interface PipelineStageHeaderMenuProps {
  /**
   * Target agent bot key.
   */
  botKey: "reader" | "organiser" | "curator";
  /**
   * Currently open popover key, or null if all closed.
   */
  activeBotMenu: string | null;
  /**
   * Callback to open or close the stage popover.
   */
  onToggleBotMenu: (botKey: "reader" | "organiser" | "curator" | null) => void;
  /**
   * Active filter applied to the pipeline table.
   */
  stageFilter: StageFilterOption;
  /**
   * Callback invoked when a filter option is selected.
   */
  onSelectStageFilter: (filter: StageFilterOption) => void;
  /**
   * Article counts for all, problems, and outdated items.
   */
  counts: {
    all: number;
    problems: number;
    problemsOld: number;
  };
  /**
   * Label for the partial clean execution action.
   */
  cleanActionLabel?: string;
  /**
   * Label for the complete force rerun execution action.
   */
  forceActionLabel?: string;
  /**
   * Callback invoked to run the stage on issues only.
   */
  onReprocessClean: () => void;
  /**
   * Callback invoked to run the stage on all articles.
   */
  onReprocessForce: () => void;
  /**
   * Whether an execution action is currently processing.
   */
  isProcessing?: boolean;
}

/**
 * Stage column header with interactive filter and rerun popover menu for pipeline tables.
 */
export function PipelineStageHeaderMenu({
  botKey,
  activeBotMenu,
  onToggleBotMenu,
  stageFilter,
  onSelectStageFilter,
  counts,
  cleanActionLabel = "Clean issues",
  forceActionLabel = "Force rerun all",
  onReprocessClean,
  onReprocessForce,
  isProcessing = false,
}: PipelineStageHeaderMenuProps) {
  const bot = AGENT_BOTS[botKey];
  const isOpen = activeBotMenu === botKey;
  const hasFilter = stageFilter !== "all";

  return (
    <th
      className="pipeline-stage-header-menu bot-stage-col-header-compact"
      style={{ width: "76px", textAlign: "center" }}
    >
      <div className="bot-header-popover-anchor">
        <button
          type="button"
          className={`bot-stage-header-btn ${isOpen ? "active-menu" : ""} ${
            hasFilter ? "has-filter" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBotMenu(isOpen ? null : botKey);
          }}
          title={`Click for ${bot.name} actions & filters`}
        >
          <BotAvatar bot={botKey} size="xs" />
          <span className="bot-header-name">{bot.name}</span>
          {hasFilter && <span className="header-filter-dot" title="Filter active" />}
          <span className="header-caret" aria-hidden="true">
            ▾
          </span>
        </button>

        {isOpen && (
          <div className="bot-actions-popover" onClick={(e) => e.stopPropagation()}>
            <div className="popover-header">
              <BotAvatar bot={botKey} size="xs" />
              <span className="popover-title">{bot.name}</span>
            </div>
            <div className="popover-actions">
              <button
                type="button"
                className="popover-action-btn clean"
                onClick={() => {
                  onReprocessClean();
                  onToggleBotMenu(null);
                }}
                disabled={isProcessing}
              >
                <span className="popover-icon">↻</span>
                <span>
                  {cleanActionLabel} ({counts.problems})
                </span>
              </button>
              <button
                type="button"
                className="popover-action-btn force"
                onClick={() => {
                  onReprocessForce();
                  onToggleBotMenu(null);
                }}
                disabled={isProcessing}
              >
                <span className="popover-icon">⚡</span>
                <span>
                  {forceActionLabel} ({counts.all})
                </span>
              </button>
            </div>
            <div className="popover-filter-section">
              <span className="popover-subhead">Filter table:</span>
              <button
                type="button"
                className={`popover-filter-choice ${stageFilter === "all" ? "selected" : ""}`}
                onClick={() => {
                  onSelectStageFilter("all");
                  onToggleBotMenu(null);
                }}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                className={`popover-filter-choice ${
                  stageFilter === "problems" ? "selected" : ""
                }`}
                onClick={() => {
                  onSelectStageFilter("problems");
                  onToggleBotMenu(null);
                }}
              >
                Problems only ({counts.problems})
              </button>
              <button
                type="button"
                className={`popover-filter-choice ${
                  stageFilter === "problems_old" ? "selected" : ""
                }`}
                onClick={() => {
                  onSelectStageFilter("problems_old");
                  onToggleBotMenu(null);
                }}
              >
                Problems & old ({counts.problemsOld})
              </button>
            </div>
          </div>
        )}
      </div>
    </th>
  );
}
