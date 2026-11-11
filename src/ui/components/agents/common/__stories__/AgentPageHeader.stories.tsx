import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { AgentPageHeader } from "../AgentPageHeader";
import { BotTimingRow } from "../BotTimingRow";
import { ComponentAnatomy } from "../../../common/__stories__/AnatomyCard";

const meta: Meta<typeof AgentPageHeader> = {
  title: "Layouts/AgentPageHeader",
  component: AgentPageHeader,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Standard top header layout for agent views and control panels.
Integrates BotAvatar, character persona badge, description, timing telemetry, and external shortcuts.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AgentPageHeader>;

export const ScoutHeader: Story = {
  render: () => (
    <div className="agent-page-container" style={{ padding: "1.5rem" }}>
      <AgentPageHeader
        bot="scout"
        subtitle="Ultra-fast gatekeeper. Evaluates incoming wire feeds and Google News against your personal directives in under 2 seconds, discarding sports recaps, celebrity gossip, and wire fluff before they burn expensive deep-reading GPU compute."
        timingNode={
          <BotTimingRow
            botKey="scout"
            botName="Scout"
            timing={{ avgMs: 420, lastMs: 380, count: 182 }}
            onReset={() => {}}
          />
        }
        actionsNode={
          <button type="button" className="secondary-btn" onClick={() => {}}>
            View in Knowledge Pipeline ↗
          </button>
        }
      />
    </div>
  ),
};

export const ReaderHeader: Story = {
  render: () => (
    <div className="agent-page-container" style={{ padding: "1.5rem" }}>
      <AgentPageHeader
        bot="reader"
        subtitle="Reads incoming articles, writes concise executive summaries, extracts key entities & topics, and scores relevance from 0 to 100."
        timingNode={
          <BotTimingRow
            botKey="reader"
            botName="Reader"
            timing={{ avgMs: 2310, lastMs: 2150, count: 64 }}
            onReset={() => {}}
          />
        }
        actionsNode={
          <button type="button" className="secondary-btn" onClick={() => {}}>
            View in Knowledge Pipeline ↗
          </button>
        }
      />
    </div>
  ),
};

export const CustomHeader: Story = {
  render: () => (
    <div className="agent-page-container" style={{ padding: "1.5rem" }}>
      <AgentPageHeader
        avatarNode={<div style={{ fontSize: "2.4rem", lineHeight: 1 }}>🖥️</div>}
        title="Server Configuration"
        roleDescription="Local Inference Server & Endpoints"
        badgeColor="#2563eb"
        subtitle="Configure common connection settings for your local AI backend (LM Studio, vLLM, or Ollama OpenAI-compatible APIs)."
      />
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Layout"
      componentName="AgentPageHeader"
      description="Standard header layout coordinating bot avatar, identity metadata, and action buttons."
      primitives={["BotAvatar", "Button", "Badge"]}
      complex={["BotTimingRow"]}
      combined={[]}
      tokens={["--color-foreground-primary", "--border-subtle", "--color-accent-default"]}
    />
  ),
};

