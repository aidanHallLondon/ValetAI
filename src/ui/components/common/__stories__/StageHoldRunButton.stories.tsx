import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { StageHoldRunButton } from "../StageHoldRunButton";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof StageHoldRunButton> = {
  title: "Primitives/StageHoldRunButton",
  component: StageHoldRunButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Compact dual-action pipeline execution button with timed long-press detection.
- **Click (<650ms):** Executes the target stage on issues, failed records, and pending items only.
- **Press & Hold (≥650ms):** Fills an animated radial progress meter and triggers a complete force rerun across all items.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StageHoldRunButton>;

export const InteractiveDemo: Story = {
  render: () => {
    const [lastAction, setLastAction] = useState<string>("None");
    const [isProcessing, setIsProcessing] = useState(false);

    const triggerAction = (type: "issues" | "all") => {
      setLastAction(type === "issues" ? "Ran issues only (Quick Click)" : "Force rerun ALL items (650ms Long Press)");
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 1200);
    };

    return (
      <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "480px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <StageHoldRunButton
            label="Reader Stage"
            isProcessing={isProcessing}
            onRunIssues={() => triggerAction("issues")}
            onRunAll={() => triggerAction("all")}
          />
          <div>
            <strong>Reader Stage Action Button</strong>
            <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.85rem" }}>
              Click to run problems only · Press and hold to rerun all
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md, 8px)",
            background: "var(--surface-subtle, #f1f5f9)",
            border: "1px solid var(--border-subtle, #cbd5e1)",
            fontSize: "0.875rem",
          }}
        >
          <strong>Last Triggered Action: </strong>
          <span style={{ color: "var(--color-primary, #2563eb)", fontWeight: 600 }}>{lastAction}</span>
        </div>
      </div>
    );
  },
};

export const ProcessingState: Story = {
  render: () => (
    <div style={{ padding: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
      <StageHoldRunButton
        label="Organiser Stage"
        isProcessing={true}
        onRunIssues={() => {}}
        onRunAll={() => {}}
      />
      <span>Processing in background (disabled)</span>
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Primitive"
      componentName="StageHoldRunButton"
      description="Dual-action button using ref-based pointer timers and touch handlers."
      tokens={["--radius-sm", "--motion-duration-feedback", "--color-accent-default"]}
    />
  ),
};

