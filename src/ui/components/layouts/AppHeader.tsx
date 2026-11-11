import React from "react";
import { PauseToggle } from "../common/PauseToggle";
import { HeaderTokenBadge } from "../common/HeaderTokenBadge";
import { FontSizeToggle } from "../common/FontSizeToggle";
import { ThemeToggle } from "../common/ThemeToggle";
import { ArticlePagination } from "../common/ArticlePagination";
import { VoteControl } from "../common/VoteControl";
import type { SettingsBreadcrumb } from "../../utils/settingsNavigation";

export interface ReaderHeaderToolbarProps {
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalItems?: number;
  vote?: "hot" | "not" | null;
  onVote?: (direction: "hot" | "not") => void;
  isFollowed?: boolean;
  onToggleFollow?: () => void;
  isRead?: boolean;
  onToggleRead?: () => void;
  directUrl?: string | null;
  rssUrl?: string | null;
  clusterCount?: number;
  onScrollToClusters?: () => void;
  onClose: () => void;
}

export interface AppHeaderProps {
  view: "feed" | "command" | "reader";
  onViewChange: (view: "feed" | "command") => void;
  isSettingsDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
  onOpenTokenModal?: () => void;
  breadcrumb?: SettingsBreadcrumb;
  onCloseMobilePage?: () => void;
  readerToolbar?: ReaderHeaderToolbarProps;
  feedToolbar?: React.ReactNode;
}

export function AppHeader({
  view,
  onViewChange,
  isSettingsDrawerOpen = false,
  onToggleDrawer,
  onOpenTokenModal,
  breadcrumb = { section: "Data", title: "Sources" },
  onCloseMobilePage,
  readerToolbar,
  feedToolbar,
}: AppHeaderProps) {
  const isTwoRows = true;

  const handleToggleDrawer = () => {
    if (onToggleDrawer) {
      onToggleDrawer();
    } else {
      window.dispatchEvent(new CustomEvent("valet-toggle-drawer"));
    }
  };

  const handleCloseMobilePage = () => {
    if (onCloseMobilePage) {
      onCloseMobilePage();
    } else {
      if (onToggleDrawer) {
        onToggleDrawer();
      } else {
        window.dispatchEvent(new CustomEvent("valet-open-drawer"));
      }
    }
  };

  return (
    <header className={`app-header global-header ${isTwoRows ? "two-rows" : "single-row"}`}>
      {/* Row 1: Brand Mark, Primary Mode Selector, Quick Tools */}
      <div className="app-header-row app-header-row-1">
        <div className="header-left">
          <div className="brand-mark" aria-hidden="true">
            <svg
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.52631 8.42044C2.52631 4.69978 5.54249 1.68359 9.26315 1.68359H27.7895C31.5101 1.68359 34.5263 4.69978 34.5263 8.42044V26.9468C34.5263 30.6674 31.5101 33.6836 27.7895 33.6836H9.26315C5.54249 33.6836 2.52631 30.6674 2.52631 26.9468V8.42044Z"
                fill="#046090"
              />
              <path
                d="M11.5101 12.5762L18.6295 22.7913L25.5425 12.5762"
                strokeWidth="3.78947"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#ffffff"
              />
            </svg>
          </div>
          <div className="brand-titles">
            <h1 className="app-title">Valet</h1>
            <span className="app-tagline">Your Personal Algorithm</span>
          </div>
        </div>

        {/* Primary Experience Toggle with proper SVG icons and spacing */}
        <div className="experience-switcher" role="group" aria-label="Main view switcher">
          <button
            type="button"
            className={view === "feed" ? "switcher-btn active" : "switcher-btn"}
            onClick={() => onViewChange("feed")}
            aria-pressed={view === "feed"}
            title="Feed"
          >
            <svg
              className="switcher-svg-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8" />
              <path d="M15 18h-5" />
              <path d="M10 6h8v4h-8V6Z" />
            </svg>
            <span className="switcher-label">Feed</span>
          </button>
          <button
            type="button"
            className={view === "command" ? "switcher-btn active" : "switcher-btn"}
            onClick={() => onViewChange("command")}
            aria-pressed={view === "command"}
            title="Settings"
          >
            <svg
              className="switcher-svg-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="switcher-label">Settings</span>
          </button>
        </div>

        {/* Accessible Quick Tools: Pause/Resume, Font, Theme */}
        <div className="header-right">
          <PauseToggle />
          <FontSizeToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Row 2: Animated Second Row (Reader Toolbar OR Settings Navigation) */}
      <div
        className={`app-header-row-2-wrapper ${isTwoRows ? "revealed" : "collapsed"}`}
        aria-hidden={!isTwoRows}
      >
        <div className="app-header-row-2-inner">
          {view === "reader" && readerToolbar ? (
            /* Reader Mode Row 2 Toolbar */
            <div className="app-header-row app-header-row-2-layout reader-toolbar-layout">
              {/* Left Group: Pagination Chevrons + Reused Circular Voting Component */}
              <div className="header-reader-left-group">
                <ArticlePagination
                  hasPrev={readerToolbar.hasPrev}
                  hasNext={readerToolbar.hasNext}
                  currentIndex={readerToolbar.currentIndex}
                  totalItems={readerToolbar.totalItems}
                  onPrev={readerToolbar.onPrev}
                  onNext={readerToolbar.onNext}
                />

                <VoteControl
                  vote={readerToolbar.vote}
                  onVote={readerToolbar.onVote || (() => {})}
                />
              </div>

              {/* Right Group: Pushed away from votes: Favourite, Read, Clusters, Open New Tab, Close */}
              <div className="header-reader-right-group">
                {/* Favourite / Follow Thread */}
                <button
                  type="button"
                  className={`header-tool-btn fav-btn ${
                    readerToolbar.isFollowed ? "active" : ""
                  }`}
                  onClick={readerToolbar.onToggleFollow}
                  title={
                    readerToolbar.isFollowed
                      ? "Following this story thread (Click to unfollow)"
                      : "Follow this story thread"
                  }
                  aria-pressed={readerToolbar.isFollowed}
                  aria-label="Follow story thread"
                >
                  <span aria-hidden="true">
                    {readerToolbar.isFollowed ? "★" : "☆"}
                  </span>
                </button>

                {/* Read / Unread Action */}
                <button
                  type="button"
                  className={`header-tool-btn read-btn ${
                    readerToolbar.isRead ? "read" : "unread"
                  }`}
                  onClick={readerToolbar.onToggleRead}
                  title={readerToolbar.isRead ? "Mark as unread" : "Mark as read"}
                  aria-label={readerToolbar.isRead ? "Mark as unread" : "Mark as read"}
                >
                  <span className="read-btn-dot" aria-hidden="true">
                    {readerToolbar.isRead ? "✓" : "●"}
                  </span>
                  <span className="read-btn-label">
                    {readerToolbar.isRead ? "Read" : "Unread"}
                  </span>
                </button>

                {/* Cluster scroll icon button (if story has clusters) */}
                {Boolean(
                  readerToolbar.clusterCount && readerToolbar.clusterCount > 0
                ) && (
                  <button
                    type="button"
                    className="header-tool-btn cluster-btn"
                    onClick={readerToolbar.onScrollToClusters}
                    title={`View ${readerToolbar.clusterCount} related story updates`}
                    aria-label="Scroll to clustered coverage"
                  >
                    <span className="cluster-icon" aria-hidden="true">❖</span>
                    <span className="cluster-badge-count">
                      +{readerToolbar.clusterCount}
                    </span>
                  </button>
                )}

                {/* Open in new window (Recognized external link SVG icon) */}
                {readerToolbar.directUrl && (
                  <a
                    href={readerToolbar.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="header-tool-btn external-btn"
                    title="Open original article in new window"
                    aria-label="Open original article in new window"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}

                {/* RSS feed link */}
                {readerToolbar.rssUrl && (
                  <a
                    href={readerToolbar.rssUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="header-tool-btn rss-btn"
                    title="Open RSS Feed"
                    aria-label="Open RSS Feed"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 11a9 9 0 0 1 9 9" />
                      <path d="M4 4a16 16 0 0 1 16 16" />
                      <circle cx="5" cy="19" r="1.5" fill="currentColor" />
                    </svg>
                  </a>
                )}

                {/* Bold Close Button */}
                <button
                  type="button"
                  className="header-tool-btn close-btn bold-close"
                  onClick={readerToolbar.onClose}
                  title="Close reader (Esc)"
                  aria-label="Close reader"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ) : view === "command" ? (
            /* Settings Mode Row 2 Navigation */
            <div
              className={`app-header-row app-header-row-2-layout ${
                isSettingsDrawerOpen ? "drawer-open" : "drawer-closed"
              }`}
            >
              {/* Left Invisible Split: Menu Drawer Column */}
              <div className="header-row-2-drawer-col">
                <button
                  type="button"
                  className="header-drawer-toggle-btn"
                  onClick={handleToggleDrawer}
                  title={
                    isSettingsDrawerOpen
                      ? "Close navigation menu"
                      : "Open navigation menu"
                  }
                  aria-label={
                    isSettingsDrawerOpen
                      ? "Close navigation menu"
                      : "Open navigation menu"
                  }
                >
                  {isSettingsDrawerOpen ? (
                    <svg
                      className="drawer-toggle-chevron"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  ) : (
                    <span className="drawer-toggle-icon" aria-hidden="true">
                      ☰
                    </span>
                  )}
                </button>
                {isSettingsDrawerOpen && (
                  <span className="header-drawer-title">SETTINGS</span>
                )}
              </div>

              {/* Right Invisible Split: Page Content Column (Aligned with Page Title) */}
              <div className="header-row-2-page-col">
                <div className="command-top-breadcrumb">
                  <span className="crumb-section">{breadcrumb.section}</span>
                  <span className="crumb-separator">›</span>
                  <span className="crumb-active">{breadcrumb.title}</span>
                </div>

                <div className="header-row-2-actions">
                  <div className="header-token-badge-wrapper">
                    <HeaderTokenBadge
                      onClick={onOpenTokenModal || (() => {})}
                    />
                  </div>

                  {!isSettingsDrawerOpen && (
                    <button
                      type="button"
                      className="header-mobile-close-btn"
                      onClick={handleCloseMobilePage}
                      title="Close page and open menu"
                      aria-label="Close page"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Feed Mode Row 2 Toolbar (Filters and View Switcher) */
            <div
              className="app-header-row app-header-row-2-layout feed-toolbar-layout"
              id="header-feed-toolbar-portal"
            >
              {feedToolbar}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
