import React from "react";

export interface BotTimingData {
  avgMs?: number | null;
  lastMs?: number | null;
  count: number;
}

export interface BotTimingRowProps {
  /**
   * Internal bot identifier.
   */
  botKey: string;
  /**
   * Human-readable bot name, e.g. "Scout".
   */
  botName: string;
  /**
   * Timing metrics data for this bot.
   */
  timing?: BotTimingData | null;
  /**
   * Whether a benchmark reset operation is currently in flight.
   */
  isResetting?: boolean;
  /**
   * Callback fired when user clicks reset button.
   */
  onReset?: (botKey: string) => void;
  /**
   * Optional custom wrapper class name.
   */
  className?: string;
}

/**
 * Metric pill and reset action displaying rolling average request latency for an AI agent bot.
 */
export function BotTimingRow({
  botKey,
  botName,
  timing,
  isResetting = false,
  onReset,
  className = "",
}: BotTimingRowProps) {
  const avgSec = timing?.avgMs ? (timing.avgMs / 1000).toFixed(1) : null;
  const lastSec = timing?.lastMs ? (timing.lastMs / 1000).toFixed(1) : null;
  const count = timing?.count || 0;

  return (
    <div className={`bot-timing-row bot-timing-stat-row ${className}`.trim()}>
      <span className="timing-stat-badge">
        <span className="timing-stat-icon" aria-hidden="true">⏱</span>
        <span className="timing-stat-label">Avg Request Time:</span>
        <strong className="timing-stat-value">{avgSec ? `${avgSec}s` : "—"}</strong>
        <span className="timing-stat-count">
          ({count} {count === 1 ? "request" : "requests"}{lastSec ? ` · last: ${lastSec}s` : ""})
        </span>
      </span>
      {onReset && (
        <button
          type="button"
          className="timing-reset-pill-btn"
          onClick={() => onReset(botKey)}
          disabled={isResetting}
          title={`Reset rolling average benchmark for ${botName}`}
          aria-label={`Reset average benchmark for ${botName}`}
        >
          {isResetting ? "Resetting…" : "↺ Reset Avg"}
        </button>
      )}
    </div>
  );
}
