import React from "react";

export type FeedLayoutMode = "list" | "grid" | "compact";

export interface LayoutSwitcherProps {
  /**
   * Currently active layout mode.
   */
  layoutMode: FeedLayoutMode;
  /**
   * Callback fired when layout mode changes.
   */
  onChangeLayoutMode: (mode: FeedLayoutMode) => void;
  /**
   * Optional custom wrapper class name.
   */
  className?: string;
}

/**
 * 3-mode segmented layout switcher for the article feed.
 *
 * Toggles between:
 * - list: Editorial stream view with inline summary
 * - grid: Card grid with hero image and summary
 * - compact: Dense grid showing title and meta only
 */
export function LayoutSwitcher({
  layoutMode,
  onChangeLayoutMode,
  className = "",
}: LayoutSwitcherProps) {
  return (
    <div
      className={`layout-switcher-group compact-switcher ${className}`.trim()}
      role="group"
      aria-label="Reading layout mode"
    >
      <button
        type="button"
        className={`layout-toggle-btn ${layoutMode === "list" ? "active" : ""}`}
        onClick={() => onChangeLayoutMode("list")}
        title="Stream View (Editorial with summary)"
        aria-label="Stream layout"
        aria-pressed={layoutMode === "list"}
      >
        <svg
          className="svg-icon-sm"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      <button
        type="button"
        className={`layout-toggle-btn ${layoutMode === "grid" ? "active" : ""}`}
        onClick={() => onChangeLayoutMode("grid")}
        title="Grid View (Cards with summary)"
        aria-label="Grid layout"
        aria-pressed={layoutMode === "grid"}
      >
        <svg
          className="svg-icon-sm"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
        </svg>
      </button>

      <button
        type="button"
        className={`layout-toggle-btn ${layoutMode === "compact" ? "active" : ""}`}
        onClick={() => onChangeLayoutMode("compact")}
        title="Compact Grid (Dense, title only)"
        aria-label="Compact grid layout"
        aria-pressed={layoutMode === "compact"}
      >
        <svg
          className="svg-icon-sm"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="4.5" height="4.5" rx="1" />
          <rect x="9.75" y="3" width="4.5" height="4.5" rx="1" />
          <rect x="16.5" y="3" width="4.5" height="4.5" rx="1" />
          <rect x="3" y="9.75" width="4.5" height="4.5" rx="1" />
          <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1" />
          <rect x="16.5" y="9.75" width="4.5" height="4.5" rx="1" />
          <rect x="3" y="16.5" width="4.5" height="4.5" rx="1" />
          <rect x="9.75" y="16.5" width="4.5" height="4.5" rx="1" />
          <rect x="16.5" y="16.5" width="4.5" height="4.5" rx="1" />
        </svg>
      </button>
    </div>
  );
}

