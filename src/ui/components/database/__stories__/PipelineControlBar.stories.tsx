import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { PipelineControlBar } from "../PipelineControlBar";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof PipelineControlBar> = {
  title: "Complex Components/PipelineControlBar",
  component: PipelineControlBar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Control toolbar for the library pipeline table, displaying queue counters,
batch processing actions (Stop All, Refresh Issues, Rerun All), and status filters.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PipelineControlBar>;

export const DefaultItemsView: Story = {
  render: () => {
    const [filter, setFilter] = useState<"all" | "issues">("all");

    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-canvas)", maxWidth: "900px" }}>
        <PipelineControlBar
          viewMode="items"
          totalCount={248}
          runningCount={2}
          queuedCount={5}
          issuesCount={3}
          mainFilter={filter}
          onSetMainFilter={setFilter}
          onStopAll={() => {}}
          onProcessEverything={() => {}}
        />
      </div>
    );
  },
};

export const ActiveQueueView: Story = {
  render: () => {
    const [filter, setFilter] = useState<"all" | "issues">("all");

    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-canvas)", maxWidth: "900px" }}>
        <PipelineControlBar
          viewMode="queue"
          totalCount={248}
          runningCount={3}
          queuedCount={12}
          issuesCount={2}
          mainFilter={filter}
          onSetMainFilter={setFilter}
          onStopAll={() => {}}
          onProcessEverything={() => {}}
          isProcessingAll={true}
          processingAction="Rerunning issues"
        />
      </div>
    );
  },
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="PipelineControlBar"
      description="Combines queue counters, batch execution triggers, stop button, and status filter toggle pills."
      primitives={["Badge", "Button"]}
      combined={[]}
      tokens={["--surface-card", "--border-subtle", "--color-accent-default", "--color-danger"]}
    />
  ),
};

