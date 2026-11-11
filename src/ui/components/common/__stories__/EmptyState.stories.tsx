import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { EmptyState } from "../EmptyState";
import { Button } from "../Button";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof EmptyState> = {
  title: "Complex Components/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Clear zero-data state prompt with illustration icon, contextual explanation, and call-to-action button slot.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 640, padding: "1rem" }}>
      <ComponentAnatomy
        level="Complex Component"
        componentName="EmptyState"
        description="Zero-data placeholder combining illustration container, explanatory copy, and action button."
        primitives={["Card", "Button"]}
        tokens={["--surface-card", "--color-foreground-primary", "--border-subtle"]}
      >
        <EmptyState
          icon="📭"
          title="No Unread Articles"
          description="You have read all available items across your subscribed feeds. New content will arrive on the next polling cycle."
          action={<Button variant="primary">Trigger Immediate Harvest</Button>}
          style={{ maxWidth: 500 }}
        />
      </ComponentAnatomy>
    </div>
  ),
};

export const Default = () => (
  <EmptyState
    icon="📭"
    title="No Unread Articles"
    description="You have read all available items across your subscribed feeds. New content will arrive on the next polling cycle."
    action={<Button variant="primary">Trigger Immediate Harvest</Button>}
    style={{ maxWidth: 500 }}
  />
);
