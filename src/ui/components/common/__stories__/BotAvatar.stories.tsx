import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { BotAvatar } from "../BotAvatar";
import { AGENT_BOTS, type AgentId } from "../../../utils/agents";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof BotAvatar> = {
  title: "Primitives/BotAvatar",
  component: BotAvatar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Unique vector robot avatar atom for each of the six autonomous AI agents, with status glow halos, sizing tiers, and character-driven design.",
},
    },
  },
argTypes: {
  bot: {
    control: "select",
      options: ["scout", "reader", "organiser", "curator", "assistant", "supervisor"],
    },
  size: {
    control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
  showHalo: { control: "boolean" },
},
};

export default meta;
type Story = StoryObj<typeof BotAvatar>;

export const Anatomy: Story = {
  render: () => (
    <div style={{ maxWidth: 640, padding: "1rem" }}>
      <ComponentAnatomy
        level="Primitive"
        componentName="BotAvatar"
        description="Signature AI character avatar atom combining dynamic halo glow, bot character colors, and status dots."
        tokens={["--color-agent-scout", "--color-agent-reader", "--color-agent-organiser", "--color-agent-curator"]}
      >
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", padding: "1rem" }}>
          <BotAvatar bot="scout" size="md" showHalo />
          <BotAvatar bot="reader" size="lg" showHalo />
          <BotAvatar bot="organiser" size="md" showHalo />
          <BotAvatar bot="curator" size="md" showHalo />
          <BotAvatar bot="assistant" size="md" showHalo />
          <BotAvatar bot="supervisor" size="md" showHalo />
        </div>
      </ComponentAnatomy>
    </div>
  ),
};

export const Default: Story = {
  args: {
    bot: "reader",
    size: "lg",
    showHalo: true,
  },
};

export const AllBots: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
      {(Object.keys(AGENT_BOTS) as AgentId[]).map((bot) => (
        <div key={bot} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <BotAvatar bot={bot} size="lg" showHalo />
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-foreground-primary)" }}>
            {AGENT_BOTS[bot].name}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>
            {AGENT_BOTS[bot].roleDescription}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <BotAvatar bot="reader" size={size} showHalo />
          <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>{size}</span>
        </div>
      ))}
    </div>
  ),
};
