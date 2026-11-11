import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { AppHeader } from "../AppHeader";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof AppHeader> = {
  title: "Layouts/AppHeader",
  component: AppHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Application top navigation header housing the Valet brand mark, view modes (Feed vs Settings), quick tools (Pause/Resume, font scaler, and theme switcher) on row 1, and the drawer toggle, token badge, breadcrumb, and mobile close button on row 2 (Settings mode).",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => {
    const [view, setView] = useState<"feed" | "command">("command");
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-background)" }}>
        <ComponentAnatomy
          level="Layout"
          componentName="AppHeader"
          description="Global application header orchestrating primary mode switching, two-row settings navigation, and quick tools."
          combined={["PauseToggle", "HeaderTokenBadge", "FontSizeToggle", "ThemeToggle"]}
          primitives={["Button", "Badge"]}
          tokens={["--surface-card", "--border-subtle", "--color-accent-default", "--color-accent-text-on-btn"]}
        >
          <AppHeader
            view={view}
            onViewChange={setView}
            isSettingsDrawerOpen={drawerOpen}
            onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
            breadcrumb={{ section: "Data", title: "Sources" }}
            onOpenTokenModal={() => alert("Token modal triggered")}
          />
        </ComponentAnatomy>
      </div>
    );
  },
};

export const FeedViewHeader: StoryObj = {
  render: () => {
    const [view, setView] = useState<"feed" | "command">("feed");

    return (
      <div style={{ background: "var(--surface-background)", minHeight: "150px" }}>
        <AppHeader
          view={view}
          onViewChange={setView}
          onOpenTokenModal={() => alert("Token modal opened")}
          feedToolbar={
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
              <span style={{ fontSize: "12px", color: "var(--color-foreground-secondary)" }}>
                Row 2 Feed Toolbar (Layout Switcher + Filters)
              </span>
            </div>
          }
        />
        <div style={{ padding: "2rem", color: "var(--color-foreground-secondary)" }}>
          Active View: <strong style={{ color: "var(--color-foreground-primary)" }}>{view.toUpperCase()}</strong> (Two rows: Mode switcher on row 1, feed filters on row 2)
        </div>
      </div>
    );
  },
};

export const SettingsViewHeaderWithDrawerClosed: StoryObj = {
  render: () => {
    const [view, setView] = useState<"feed" | "command">("command");
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
      <div style={{ background: "var(--surface-background)", minHeight: "150px" }}>
        <AppHeader
          view={view}
          onViewChange={setView}
          isSettingsDrawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
          breadcrumb={{ section: "Scoring", title: "Algorithm" }}
          onOpenTokenModal={() => alert("Token modal opened")}
          onCloseMobilePage={() => alert("Close mobile page clicked")}
        />
        <div style={{ padding: "2rem", color: "var(--color-foreground-secondary)" }}>
          Drawer State: <strong style={{ color: "var(--color-foreground-primary)" }}>CLOSED (Hamburger ☰ visible in Row 2, Close ✕ on mobile)</strong>
        </div>
      </div>
    );
  },
};

export const SettingsViewHeaderWithDrawerOpen: StoryObj = {
  render: () => {
    const [view, setView] = useState<"feed" | "command">("command");
    const [drawerOpen, setDrawerOpen] = useState(true);

    return (
      <div style={{ background: "var(--surface-background)", minHeight: "150px" }}>
        <AppHeader
          view={view}
          onViewChange={setView}
          isSettingsDrawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
          breadcrumb={{ section: "Thinking › Agents", title: "Reader" }}
          onOpenTokenModal={() => alert("Token modal opened")}
        />
        <div style={{ padding: "2rem", color: "var(--color-foreground-secondary)" }}>
          Drawer State: <strong style={{ color: "var(--color-foreground-primary)" }}>OPEN (Open Chevron &lt; and SETTINGS title visible in Row 2, breadcrumb aligned)</strong>
        </div>
      </div>
    );
  },
};

export const ReaderViewHeader: StoryObj = {
  render: () => {
    const [view, setView] = useState<"feed" | "command" | "reader">("reader");
    const [vote, setVote] = useState<"hot" | "not" | null>("hot");
    const [isFollowed, setIsFollowed] = useState(true);
    const [isRead, setIsRead] = useState(false);
    const [isIframeView, setIsIframeView] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(2);

    return (
      <div style={{ background: "var(--surface-background)", minHeight: "150px" }}>
        <AppHeader
          view={view}
          onViewChange={(v) => setView(v)}
          readerToolbar={{
            hasPrev: currentIndex > 0,
            hasNext: currentIndex < 9,
            currentIndex,
            totalItems: 10,
            onPrev: () => setCurrentIndex((i) => Math.max(0, i - 1)),
            onNext: () => setCurrentIndex((i) => Math.min(9, i + 1)),
            vote,
            onVote: (dir) => setVote((prev) => (prev === dir ? null : dir)),
            isFollowed,
            onToggleFollow: () => setIsFollowed(!isFollowed),
            isRead,
            onToggleRead: () => setIsRead(!isRead),
            directUrl: "https://www.technologyreview.com/feed/",
            rssUrl: "https://www.technologyreview.com/feed/",
            clusterCount: 3,
            onScrollToClusters: () => alert("Scroll to clusters triggered"),
            onClose: () => setView("feed"),
          }}
        />
        <div style={{ padding: "2rem", color: "var(--color-foreground-secondary)" }}>
          Reader Toolbar Row 2: Voting, favourite, unread, previous/next, iframe preview toggle, cluster scroll, and close button.
        </div>
      </div>
    );
  },
};

