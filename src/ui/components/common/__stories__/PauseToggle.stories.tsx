import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { PauseToggle } from "../PauseToggle";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof PauseToggle> = {
  title: "Combined Components/PauseToggle",
  component: PauseToggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "System process toggle displaying live gathering and inference daemon states. Features glowing active/paused status dots and optimistic server dispatch.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj<typeof PauseToggle> = {
  render: () => (
    <div style={{ maxWidth: 640, padding: "1rem" }}>
      <ComponentAnatomy
        level="Combined Component"
        componentName="PauseToggle"
        description="Daemon pause controller combining stateful indicator dot and accessible pill switch."
        primitives={["Toggle", "Button", "Badge"]}
        tokens={["--color-status-success", "--color-status-warning", "--motion-duration-feedback"]}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <PauseToggle isPaused={false} onToggle={() => {}} />
        </div>
      </ComponentAnatomy>
    </div>
  ),
};

export const ActiveState: StoryObj<typeof PauseToggle> = {
  render: () => {
    const [isPaused, setIsPaused] = useState(false);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <PauseToggle isPaused={isPaused} onToggle={() => setIsPaused((p) => !p)} />
        <span style={{ fontSize: "0.8rem", color: "var(--color-foreground-muted)" }}>
          Gatherer daemon and agent triage pipelines active
        </span>
      </div>
    );
  },
};

export const PausedState: StoryObj<typeof PauseToggle> = {
  render: () => {
    const [isPaused, setIsPaused] = useState(true);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <PauseToggle isPaused={isPaused} onToggle={() => setIsPaused((p) => !p)} />
        <span style={{ fontSize: "0.8rem", color: "var(--color-foreground-muted)" }}>
          All background processing paused to save power & tokens
        </span>
      </div>
    );
  },
};
