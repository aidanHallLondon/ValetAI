import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Badge } from "../../common/Badge";
import { Button } from "../../common/Button";
import { BotAvatar } from "../../common/BotAvatar";
import { FeedCard } from "../FeedCard";
import { MOCK_ARTICLE_1 } from "../../common/__stories__/mockData";
import { DEFAULT_PREFERENCES } from "../../../utils/algorithm";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof FeedCard> = {
  title: "Complex Components/FeedCard",
  component: FeedCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Autonomous feed card organism combining article metadata, AI agent triage stamps, interactive voting controls, similarity scoring, and article modal triggers.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeedCard>;

export const ProductionFeedCard: Story = {
  render: () => {
    return (
      <div style={{ maxWidth: 680, padding: "1.5rem", background: "var(--surface-canvas)" }}>
        <FeedCard
          item={MOCK_ARTICLE_1}
          preferences={DEFAULT_PREFERENCES}
          onSelect={(item) => alert(`Selected: ${item.analysis?.title || item.raw_text}`)}
          onRate={(_item, rating) => alert(`Rated: ${rating}`)}
          onToggleFollowStory={(id) => alert(`Toggled follow: #${id}`)}
        />
      </div>
    );
  },
};

export const Anatomy: Story = {
  render: () => {
    return (
      <div style={{ maxWidth: 740, padding: "1rem" }}>
        <ComponentAnatomy
          level="Complex Component"
          componentName="FeedCard"
          description="Autonomous article card organism orchestrating agent triage badges, interactive vector steering, and reading actions."
          complex={["FeedCardMetaRow"]}
          combined={[]}
          primitives={["Card", "Badge", "Button", "BotAvatar"]}
          tokens={["--surface-card", "--color-agent-scout", "--color-status-success", "--shadow-card"]}
        >
          <FeedCard
            item={MOCK_ARTICLE_1}
            preferences={DEFAULT_PREFERENCES}
            onSelect={(item) => alert(`Selected: ${item.analysis?.title}`)}
          />
        </ComponentAnatomy>
      </div>
    );
  },
};
