import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { VoteControl } from "../VoteControl";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof VoteControl> = {
  title: "Combined Components/VoteControl",
  component: VoteControl,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Reusable dual-state voting control featuring circular mint/green upvote and rose/red downvote action buttons.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VoteControl>;

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Combined Component"
      componentName="VoteControl"
      description="Interactive circular upvote and downvote pair providing tactile feedback for algorithmic affinity training."
      tokens={["--color-status-success", "--color-status-danger", "--color-foreground-inverse"]}
    >
      <VoteControl onVote={() => {}} vote="hot" />
    </ComponentAnatomy>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [vote, setVote] = useState<"hot" | "not" | null>(null);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <VoteControl
          vote={vote}
          onVote={(dir) => setVote((prev) => (prev === dir ? null : dir))}
        />
        <span style={{ fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>
          Current status: <strong>{vote || "neutral"}</strong>
        </span>
      </div>
    );
  },
};

export const Upvoted: Story = {
  args: {
    vote: "hot",
    onVote: () => {},
  },
};

export const Downvoted: Story = {
  args: {
    vote: "not",
    onVote: () => {},
  },
};

