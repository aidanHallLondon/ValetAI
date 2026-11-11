import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { AgentIssueCard } from "../AgentIssueCard";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof AgentIssueCard> = {
  title: "Complex Components/AgentIssueCard",
  component: AgentIssueCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Diagnostic alert card displayed when an AI agent encounters an execution failure.
Features an error trace viewer, sent prompt inspection, and a 1-click retry button.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AgentIssueCard>;

export const ConnectionTimeoutIssue: Story = {
  render: () => {
    const [isRetrying, setIsRetrying] = useState(false);

    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-canvas)", maxWidth: "800px" }}>
        <AgentIssueCard
          errorMessage="LLM API connection timed out after 30000ms while processing stage 'curator'."
          isRetrying={isRetrying}
          onRetry={() => {
            setIsRetrying(true);
            setTimeout(() => setIsRetrying(false), 2000);
          }}
          lastPrompt={`User Prompt: Grade this article based on user interests.
Title: Breaking News in AI
Summary: Short summary...`}
          lastResponse={`Error: Request failed with status code 504 Gateway Timeout
at /Users/aidanhall/Documents/code/ValetAI/src/agent/llm.ts:142:15`}
        />
      </div>
    );
  },
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="AgentIssueCard"
      description="Combines warning badge, error description, retry button, prompt inspection drawer, and raw stack trace block."
      primitives={["Badge", "Button"]}
      combined={[]}
      tokens={["--surface-card", "--border-danger", "--color-danger", "--color-warning"]}
    />
  ),
};

