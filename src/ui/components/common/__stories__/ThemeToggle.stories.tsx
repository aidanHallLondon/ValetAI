import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof ThemeToggle> = {
  title: "Combined Components/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Rotating theme switcher button in the application header. Cycles between System / Auto (💻), Light (☀️), and Dark (🌙) color schemes with cross-tab localStorage broadcast.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj<typeof ThemeToggle> = {
  render: () => (
    <div style={{ maxWidth: 640, padding: "1rem" }}>
      <ComponentAnatomy
        level="Combined Component"
        componentName="ThemeToggle"
        description="Theme switcher button cycling through adaptive light, dark, and auto token surfaces."
        primitives={["Button"]}
        tokens={["--surface-card", "--surface-subtle", "--color-foreground-primary", "--border-subtle"]}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <ThemeToggle currentTheme="system" onThemeChange={() => {}} />
        </div>
      </ComponentAnatomy>
    </div>
  ),
};

export const Interactive: StoryObj<typeof ThemeToggle> = {
  render: () => {
    const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: 400 }}>
        <p style={{ margin: 0, fontSize: "var(--font-size-body-sm)", color: "var(--color-foreground-secondary)" }}>
          Click to cycle between Auto, Light, and Dark modes:
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <ThemeToggle currentTheme={theme} onThemeChange={setTheme} />
        </div>
      </div>
    );
  },
};
