import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { LayoutSwitcher, FeedLayoutMode } from "../LayoutSwitcher";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof LayoutSwitcher> = {
  title: "Combined Components/LayoutSwitcher",
  component: LayoutSwitcher,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Segmented button group toggling article feed layouts.
- **Stream View (list):** Editorial vertical stream with text summaries.
- **Grid View (grid):** Card grid with hero images and takeaways.
- **Compact View (compact):** High-density title and metadata grid.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LayoutSwitcher>;

export const Interactive: Story = {
  render: () => {
    const [mode, setMode] = useState<FeedLayoutMode>("list");

    return (
      <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <LayoutSwitcher layoutMode={mode} onChangeLayoutMode={setMode} />
          <span style={{ fontSize: "0.9rem", color: "var(--color-foreground-secondary)" }}>
            Current Mode: <strong>{mode.toUpperCase()}</strong>
          </span>
        </div>
      </div>
    );
  },
};

export const AllModes: Story = {
  render: () => (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <p className="muted" style={{ margin: "0 0 6px", fontSize: "0.8rem" }}>Active: Stream (list)</p>
        <LayoutSwitcher layoutMode="list" onChangeLayoutMode={() => {}} />
      </div>
      <div>
        <p className="muted" style={{ margin: "0 0 6px", fontSize: "0.8rem" }}>Active: Grid (grid)</p>
        <LayoutSwitcher layoutMode="grid" onChangeLayoutMode={() => {}} />
      </div>
      <div>
        <p className="muted" style={{ margin: "0 0 6px", fontSize: "0.8rem" }}>Active: Compact (compact)</p>
        <LayoutSwitcher layoutMode="compact" onChangeLayoutMode={() => {}} />
      </div>
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Combined Component"
      componentName="LayoutSwitcher"
      description="Combines 3 SVG icon buttons inside an accessible role=group container."
      primitives={["Button"]}
      tokens={["--surface-elevated", "--border-subtle", "--color-accent-default", "--radius-sm"]}
    />
  ),
};

