import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { BotTimingRow } from "../BotTimingRow";
import { ComponentAnatomy } from "../../../common/__stories__/AnatomyCard";

const meta: Meta<typeof BotTimingRow> = {
  title: "Complex Components/BotTimingRow",
  component: BotTimingRow,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Telemetry pill and benchmark reset action displaying real-time execution duration metrics.
Shows rolling average request duration, total request count, and latest execution latency with an interactive reset action.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BotTimingRow>;

export const Interactive: Story = {
  render: () => {
    const [timing, setTiming] = useState({ avgMs: 1420, lastMs: 1350, count: 48 });
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = () => {
      setIsResetting(true);
      setTimeout(() => {
        setTiming({ avgMs: 0, lastMs: 0, count: 0 });
        setIsResetting(false);
      }, 700);
    };

    return (
      <div style={{ padding: "2rem", maxWidth: "600px" }}>
        <BotTimingRow
          botKey="reader"
          botName="Reader"
          timing={timing}
          isResetting={isResetting}
          onReset={handleReset}
        />
      </div>
    );
  },
};

export const AllAgentTimings: Story = {
  render: () => (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "640px" }}>
      <div>
        <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>Scout (Ultra-fast gatekeeper)</strong>
        <BotTimingRow
          botKey="scout"
          botName="Scout"
          timing={{ avgMs: 420, lastMs: 380, count: 182 }}
          onReset={() => {}}
        />
      </div>
      <div>
        <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>Reader (Deep analysis)</strong>
        <BotTimingRow
          botKey="reader"
          botName="Reader"
          timing={{ avgMs: 2310, lastMs: 2150, count: 64 }}
          onReset={() => {}}
        />
      </div>
      <div>
        <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>Organiser (Story threading)</strong>
        <BotTimingRow
          botKey="organiser"
          botName="Organiser"
          timing={{ avgMs: 1150, lastMs: 980, count: 32 }}
          onReset={() => {}}
        />
      </div>
      <div>
        <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>Curator (Taxonomy discovery)</strong>
        <BotTimingRow
          botKey="curator"
          botName="Curator"
          timing={{ avgMs: 4820, lastMs: 5120, count: 12 }}
          onReset={() => {}}
        />
      </div>
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="BotTimingRow"
      description="Combines clock glyph, tabular duration label, count pill, and reset button."
      primitives={["Badge", "Button"]}
      tokens={["--surface-subtle", "--border-subtle", "--color-foreground-primary", "--radius-pill"]}
    />
  ),
};

