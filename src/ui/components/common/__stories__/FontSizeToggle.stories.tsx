import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { FontSizeToggle } from "../FontSizeToggle";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof FontSizeToggle> = {
  title: "Combined Components/FontSizeToggle",
  component: FontSizeToggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Combined rotating tool button that cycles between Normal (A), Medium (A+), and Large (A++) font scales. Syncs to localStorage and sets data-font-size on the root element.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FontSizeToggle>;

export const Anatomy: Story = {
  render: () => (
    <div style={{ maxWidth: 640, padding: "1rem" }}>
      <ComponentAnatomy
        level="Combined Component"
        componentName="FontSizeToggle"
        description="Dynamic font scale controller cycling root rem scales with instant UI preview."
        primitives={["Button", "Badge"]}
        tokens={["--font-scale-standard", "--font-scale-medium", "--font-scale-large", "--surface-subtle"]}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <FontSizeToggle />
        </div>
      </ComponentAnatomy>
    </div>
  ),
};

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
      <p style={{ margin: 0, fontSize: "var(--font-size-body-sm)", color: "var(--color-foreground-secondary)" }}>
        Click the rotating tool button to cycle font scales:
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <FontSizeToggle />
      </div>
    </div>
  ),
};
