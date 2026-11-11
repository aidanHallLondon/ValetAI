import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { HeaderTokenBadge } from "../HeaderTokenBadge";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof HeaderTokenBadge> = {
  title: "Combined Components/HeaderTokenBadge",
  component: HeaderTokenBadge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Compact telemetry badge in the top navigation header displaying live AI token consumption and estimated cost across all six autonomous bots.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeaderTokenBadge>;

export const Anatomy: Story = {
  render: () => (
    <div style={{ maxWidth: 640, padding: "1rem" }}>
      <ComponentAnatomy
        level="Combined Component"
        componentName="HeaderTokenBadge"
        description="Telemetry badge combining token counter, currency formatting, and modal launcher."
        primitives={["Badge", "Button"]}
        tokens={["--surface-subtle", "--color-status-warning", "--motion-duration-hover"]}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <HeaderTokenBadge
            totalTokens={124800}
            totalCost={0.0384}
            currency="$"
            onClick={() => {}}
          />
        </div>
      </ComponentAnatomy>
    </div>
  ),
};

export const ModerateUsage: Story = {
  render: () => (
    <div style={{ padding: "1.5rem", background: "var(--surface-canvas)" }}>
      <HeaderTokenBadge
        totalTokens={124800}
        totalCost={0.0384}
        currency="$"
        onClick={() => {}}
      />
    </div>
  ),
};

export const HighUsage: Story = {
  render: () => (
    <div style={{ padding: "1.5rem", background: "var(--surface-canvas)" }}>
      <HeaderTokenBadge
        totalTokens={3850000}
        totalCost={1.155}
        currency="$"
        onClick={() => {}}
      />
    </div>
  ),
};
