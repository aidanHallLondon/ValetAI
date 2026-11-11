import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { SourceItemRow } from "../SourceItemRow";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";
import type { SourceRecord } from "../../../../db/schema";

const meta: Meta<typeof SourceItemRow> = {
  title: "Complex Components/SourceItemRow",
  component: SourceItemRow,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Interactive draggable source row presenting feed health, unread counts,
algorithm weighting slider, and lifecycle actions (refresh, pause, delete).`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SourceItemRow>;

const mockSource: SourceRecord = {
  id: 1,
  name: "Ars Technica",
  url: "https://feeds.arstechnica.com/arstechnica/index",
  site_url: "https://arstechnica.com",
  type: "rss",
  enabled: true,
  description: "Technology news and analysis",
  last_fetched_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  last_fetch_count: 4,
  created_at: new Date().toISOString(),
};

export const HealthySource: Story = {
  render: () => {
    const [weight, setWeight] = useState(2);
    const [enabled, setEnabled] = useState(true);

    return (
      <div style={{ padding: "1.5rem", maxWidth: "800px" }}>
        <SourceItemRow
          source={{ ...mockSource, enabled }}
          items={[]}
          weight={weight}
          onVoteUp={() => setWeight((w) => w + 1)}
          onVoteDown={() => setWeight((w) => w - 1)}
          onRefresh={() => {}}
          onToggle={() => setEnabled((e) => !e)}
          onDelete={() => {}}
        />
      </div>
    );
  },
};

export const PausedSource: Story = {
  render: () => (
    <div style={{ padding: "1.5rem", maxWidth: "800px" }}>
      <SourceItemRow
        source={{
          ...mockSource,
          id: 2,
          name: "BBC News",
          url: "https://feeds.bbci.co.uk/news/rss.xml",
          enabled: false,
        }}
        items={[]}
        weight={0}
        onVoteUp={() => {}}
        onVoteDown={() => {}}
        onRefresh={() => {}}
        onToggle={() => {}}
        onDelete={() => {}}
      />
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="SourceItemRow"
      description="Combines drag handle, favicon link, status tags, unread counter buttons, and action tray."
      primitives={["Badge", "Button"]}
      tokens={["--surface-card", "--border-subtle", "--color-accent-default", "--radius-md"]}
    />
  ),
};
