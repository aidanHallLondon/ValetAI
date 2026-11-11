import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { TokenCostView, TokenCostModal, type TelemetryResponse } from "../TokenCostModal";
import { Button } from "../Button";
import { ComponentAnatomy } from "./AnatomyCard";

const mockTelemetry: TelemetryResponse = {
  summary: {
    totalPromptTokens: 282700,
    totalCompletionTokens: 66400,
    totalTokens: 349100,
    callCount: 42,
    byModel: {},
  },
  pricing: {
    llmInputPricePerMillion: 0.15,
    llmOutputPricePerMillion: 0.6,
    embeddingPricePerMillion: 0.02,
    currencySymbol: "$",
    perModelRates: {},
  },
  totalEstimatedCost: 0.082,
  modelCosts: {
    "qwen2.5-7b-instruct": { promptCost: 0.027, completionCost: 0.025, totalCost: 0.052 },
    "deepseek-r1-distill-qwen-7b": { promptCost: 0.015, completionCost: 0.014, totalCost: 0.029 },
    "nomic-embed-text-v1.5": { promptCost: 0.001, completionCost: 0, totalCost: 0.001 },
  },
};

const meta: Meta<typeof TokenCostModal> = {
  title: "Complex Components/TokenCostModal",
  component: TokenCostModal,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Modal dialog providing granular visibility into AI model token consumption, prompt/completion splits, local vs cloud cost estimations, and counter resets.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenCostModal>;

export const EmbeddedView: Story = {
  render: () => (
    <div style={{ maxWidth: 740, padding: "1.5rem", background: "var(--surface-canvas)" }}>
      <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <TokenCostView isEmbedded={true} initialData={mockTelemetry} onClose={() => {}} />
      </div>
    </div>
  ),
};

export const InteractiveModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div style={{ padding: "2rem" }}>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Token Cost Modal
        </Button>
        <TokenCostModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          initialData={mockTelemetry}
        />
      </div>
    );
  },
};

export const Anatomy: Story = {
  render: () => (
    <div style={{ maxWidth: 740, padding: "1rem" }}>
      <ComponentAnatomy
        level="Complex Component"
        componentName="TokenCostModal"
        description="Token accounting dialog orchestrating telemetry metrics, per-model bars, and reset actions."
        complex={["MetricCard"]}
        combined={[]}
        primitives={["Modal", "Card", "Badge", "Button"]}
        tokens={["--surface-dialog", "--color-accent-default", "--border-strong", "--shadow-modal"]}
      >
        <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <TokenCostView isEmbedded={true} initialData={mockTelemetry} onClose={() => {}} />
        </div>
      </ComponentAnatomy>
    </div>
  ),
};
