import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { AgentLiveRequestCard } from "../AgentLiveRequestCard";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof AgentLiveRequestCard> = {
  title: "Complex Components/AgentLiveRequestCard",
  component: AgentLiveRequestCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Real-time diagnostic card presenting active bot execution status,
halo avatar, model identifier, and collapsible raw prompt preview.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AgentLiveRequestCard>;

export const ActiveReaderExecution: Story = {
  render: () => (
    <div style={{ padding: "1.5rem", background: "var(--surface-canvas)", maxWidth: "800px" }}>
      <AgentLiveRequestCard
        bot="reader"
        botName="Reader Bot"
        stage="Analyzing and cleaning article content"
        model="qwen2.5-7b-instruct"
        promptPreview={`You are Reader Bot. Clean and normalize the following article content:
Title: "Autonomous Agents Navigate Production Infrastructure"
Body text length: 4,820 chars...`}
      />
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="AgentLiveRequestCard"
      description="Combines BotAvatar with active spinning halo, status badge pill, model metadata grid, and collapsible prompt code pre block."
      primitives={["BotAvatar", "Badge"]}
      combined={[]}
      tokens={["--surface-card", "--border-subtle", "--color-accent-default", "--color-stage-reader"]}
    />
  ),
};

