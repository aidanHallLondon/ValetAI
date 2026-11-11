import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MetricCard } from "../MetricCard";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof MetricCard> = {
  title: "Complex Components/MetricCard",
  component: MetricCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Dashboard metric display with primary numeric readout, semantic trend badges, subtitles, and optional icon slots.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => {
    return (
      <div style={{ maxWidth: 740, padding: "1rem" }}>
        <ComponentAnatomy
          level="Complex Component"
          componentName="MetricCard"
          description="Composite card combining a Card frame, prominent numeric counter, and subtle status pill."
          primitives={["Card", "Badge"]}
          tokens={["--surface-card", "--border-subtle", "--font-size-title-lg", "--font-weight-extrabold"]}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
            <MetricCard
              label="Vector Index"
              value="1,419"
              subtext="sqlite-vec 1024-dim"
              icon="⚡"
            />
            <MetricCard
              label="Total Tokens"
              value="284.5k"
              subtext="Estimated cost: $0.14"
              icon="🪙"
            />
          </div>
        </ComponentAnatomy>
      </div>
    );
  },
};

export const Default = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", maxWidth: 700 }}>
    <MetricCard
      label="Total Articles"
      value="1,428"
      subtext="+34 in last 24h"
      icon="📰"
    />
    <MetricCard
      label="Vector Index"
      value="1,419"
      subtext="sqlite-vec 1024-dim"
      icon="⚡"
    />
    <MetricCard
      label="Total Tokens"
      value="284.5k"
      subtext="Estimated cost: $0.14"
      icon="🪙"
    />
  </div>
);
