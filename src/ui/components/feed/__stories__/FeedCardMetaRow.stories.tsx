import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { FeedCardMetaRow } from "../FeedCardMetaRow";
import { MOCK_ARTICLE_1 } from "../../common/__stories__/mockData";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof FeedCardMetaRow> = {
  title: "Complex Components/FeedCardMetaRow",
  component: FeedCardMetaRow,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Interactive article metadata row showing source favicon, domain publication time, match relevance score, and triage model tags.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeedCardMetaRow>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 740, padding: "1.5rem", background: "var(--surface-canvas)" }}>
      <FeedCardMetaRow item={MOCK_ARTICLE_1} />
    </div>
  ),
};

export const SingleSource: Story = {
  render: () => (
    <div style={{ maxWidth: 740, padding: "1.5rem", background: "var(--surface-canvas)" }}>
      <FeedCardMetaRow
        item={{
          ...MOCK_ARTICLE_1,
          sources: ["MIT Technology Review"],
          is_followed: false,
        }}
      />
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <div style={{ maxWidth: 740, padding: "1rem" }}>
      <ComponentAnatomy
        level="Complex Component"
        componentName="FeedCardMetaRow"
        description="Metadata strip combining publisher favicon, publication age, multi-source indicators, and match score badges."
        primitives={["Badge", "BotAvatar"]}
        tokens={["--surface-card", "--color-foreground-primary", "--border-subtle"]}
      >
        <FeedCardMetaRow item={MOCK_ARTICLE_1} />
      </ComponentAnatomy>
    </div>
  ),
};
