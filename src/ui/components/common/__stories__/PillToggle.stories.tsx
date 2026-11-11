import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PillToggle } from "../PillToggle";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof PillToggle> = {
  title: "Combined Components/PillToggle",
  component: PillToggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Compact pill switch with an active status dot, text label, and optional numeric counter badge. Used in filter bars and toolbars.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PillToggle>;

export const Anatomy: Story = {
  render: () => (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <ComponentAnatomy
        componentName="PillToggle"
        level="Combined Component"
        description="Generic, layout-agnostic composite toggle rendered as a pill with active status dot and counter badge."
        primitives={["input[type=checkbox]", "span.pill-toggle-dot", "span.pill-toggle-counter"]}
        tokens={["--surface-card", "--surface-interactive", "--border-subtle", "--color-accent-default"]}
      />
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <PillToggle
          label="Read"
          checked={true}
          onChange={() => {}}
          count={15}
          title="Include read articles in feed"
        />
        <PillToggle
          label="Raw"
          checked={false}
          onChange={() => {}}
          count={6}
          title="Include raw / unprocessed ingested content in feed"
        />
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [isReadActive, setIsReadActive] = useState(true);
    const [isRawActive, setIsRawActive] = useState(false);

    return (
      <div style={{ display: "flex", gap: "10px", padding: "20px", alignItems: "center" }}>
        <PillToggle
          label="Read"
          checked={isReadActive}
          onChange={setIsReadActive}
          count={15}
          title="Toggle read content filter"
        />
        <PillToggle
          label="Raw"
          checked={isRawActive}
          onChange={setIsRawActive}
          count={6}
          title="Toggle raw content filter"
        />
      </div>
    );
  },
};

export const WithoutCount: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "10px", padding: "20px", alignItems: "center" }}>
      <PillToggle label="Read" checked={true} onChange={() => {}} />
      <PillToggle label="Raw" checked={false} onChange={() => {}} />
    </div>
  ),
};
