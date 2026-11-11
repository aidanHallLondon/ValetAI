import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { ReaderPage } from "../ReaderPage";
import { AppHeader } from "../../layouts/AppHeader";
import { MOCK_ARTICLE_1, MOCK_ARTICLE_2, MOCK_ITEMS } from "../../common/__stories__/mockData";
import { DEFAULT_PREFERENCES, getArticleVote } from "../../../utils/algorithm";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof ReaderPage> = {
  title: "Layouts/ReaderPage",
  component: ReaderPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full-page editorial reader experience retaining the application header with dedicated row 2 toolbar. Displays AI-synthesized lead briefings, source metadata, multi-article cluster threads, critic evaluations, and agent execution telemetry.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-background)" }}>
        <ComponentAnatomy
          level="Layout"
          componentName="ReaderPage"
          description="Immersive long-form reading experience synthesizing key insights, entity tags, and cluster threads."
          complex={["FeedCard", "SourceBadge"]}
          combined={[]}
          primitives={["BotAvatar", "Badge", "Button"]}
          tokens={["--surface-card", "--color-agent-reader", "--color-status-success", "--motion-duration-dialog"]}
        />
      </div>
    );
  },
};

export const FullReaderPageWithToolbar: StoryObj = {
  render: () => {
    const [currentItem, setCurrentItem] = useState(MOCK_ARTICLE_1);
    const [vote, setVote] = useState<"hot" | "not" | null>("hot");
    const [isFollowed, setIsFollowed] = useState(true);
    const [isRead, setIsRead] = useState(false);
    const [isIframeView, setIsIframeView] = useState(false);

    const currentIndex = MOCK_ITEMS.findIndex((i) => i.id === currentItem.id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex !== -1 && currentIndex < MOCK_ITEMS.length - 1;

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-canvas)" }}>
        <AppHeader
          view="reader"
          onViewChange={() => {}}
          readerToolbar={{
            hasPrev,
            hasNext,
            currentIndex,
            totalItems: MOCK_ITEMS.length,
            onPrev: () => hasPrev && setCurrentItem(MOCK_ITEMS[currentIndex - 1]),
            onNext: () => hasNext && setCurrentItem(MOCK_ITEMS[currentIndex + 1]),
            vote,
            onVote: (dir) => setVote((prev) => (prev === dir ? null : dir)),
            isFollowed,
            onToggleFollow: () => setIsFollowed(!isFollowed),
            isRead,
            onToggleRead: () => setIsRead(!isRead),
            directUrl: currentItem.canonical_url || currentItem.source_url,
            clusterCount: currentItem.child_articles?.length || 0,
            onScrollToClusters: () => {
              const el = document.getElementById("reader-clusters");
              el?.scrollIntoView({ behavior: "smooth" });
            },
            onClose: () => alert("Close reader triggered"),
          }}
        />
        <ReaderPage
          item={currentItem}
          items={MOCK_ITEMS}
          preferences={DEFAULT_PREFERENCES}
          onClose={() => alert("Close triggered")}
          onSelectItem={(newItem) => setCurrentItem(newItem)}
          isIframeView={isIframeView}
          onToggleIframeView={setIsIframeView}
          onRate={(item, rating) => setVote(rating)}
          onToggleFollowStory={() => setIsFollowed(!isFollowed)}
        />
      </div>
    );
  },
};

export const SingleArticleReader: StoryObj = {
  render: () => {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-canvas)" }}>
        <AppHeader
          view="reader"
          onViewChange={() => {}}
          readerToolbar={{
            hasPrev: false,
            hasNext: true,
            currentIndex: 0,
            totalItems: 5,
            onPrev: () => {},
            onNext: () => {},
            vote: null,
            isFollowed: false,
            isRead: false,
            directUrl: MOCK_ARTICLE_2.canonical_url || MOCK_ARTICLE_2.source_url,
            clusterCount: 0,
            onClose: () => alert("Close reader triggered"),
          }}
        />
        <ReaderPage
          item={MOCK_ARTICLE_2}
          items={MOCK_ITEMS}
          preferences={DEFAULT_PREFERENCES}
          onClose={() => alert("Close reader")}
        />
      </div>
    );
  },
};
