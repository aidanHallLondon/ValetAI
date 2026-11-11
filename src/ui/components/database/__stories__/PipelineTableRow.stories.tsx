import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { PipelineTableRow } from "../PipelineTableRow";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";
import type { HydratedContentRecord } from "../../../../db/schema";

const meta: Meta<typeof PipelineTableRow> = {
  title: "Complex Components/PipelineTableRow",
  component: PipelineTableRow,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Interactive table row for a library article, featuring multi-stage bot discs,
lifecycle status badges, and actions to reprocess or delete.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PipelineTableRow>;

const mockItem: HydratedContentRecord = {
  id: 101,
  source_id: 1,
  title: "Autonomous Agents Navigate Production Infrastructure With Verifiable Constraints",
  url: "https://example.com/autonomous-agents",
  author: "Sarah Chen",
  published_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  ingested_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  body_text: "Full content text here...",
  summary: "Comprehensive look at autonomous agents in production systems with sandboxed execution.",
  user_score: 88,
  read_status: "read",
  is_favourite: 0,
  processing_status: "completed",
  processing_stage: "completed",
  stage_reader_status: "completed",
  stage_organiser_status: "completed",
  stage_curator_status: "completed",
  stage_reader_model: "qwen2.5-7b-instruct",
  stage_organiser_model: "qwen2.5-7b-instruct",
  stage_curator_model: "deepseek-r1-distill-qwen-7b",
  stage_reader_updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  stage_organiser_updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  stage_curator_updated_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  source_name: "Ars Technica",
  tags: ["AI", "Architecture", "Engineering"],
} as unknown as HydratedContentRecord;

export const FullyProcessed: Story = {
  render: () => (
    <div style={{ padding: "1.5rem", background: "var(--surface-canvas)" }}>
      <table className="library-pipeline-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <PipelineTableRow
            item={mockItem}
            readerCurrent={true}
            organiserCurrent={true}
            curatorCurrent={true}
            onRerunStage={() => {}}
            onStopItem={() => {}}
            onReprocessItem={() => {}}
            onDeleteItem={() => {}}
          />
        </tbody>
      </table>
    </div>
  ),
};

export const InProcessingQueue: Story = {
  render: () => (
    <div style={{ padding: "1.5rem", background: "var(--surface-canvas)" }}>
      <table className="library-pipeline-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <PipelineTableRow
            item={{
              ...mockItem,
              processing_status: "processing",
              processing_stage: "reader",
              stage_reader_status: "processing",
              stage_organiser_status: "idle",
              stage_curator_status: "idle",
            } as HydratedContentRecord}
            isItemActive={true}
            isProcessingOrQueued={true}
            isReaderActive={true}
            onRerunStage={() => {}}
            onStopItem={() => {}}
            onReprocessItem={() => {}}
            onDeleteItem={() => {}}
          />
        </tbody>
      </table>
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="PipelineTableRow"
      description="Combines article metadata, stage discs with bot avatars and spinner halos, lifecycle badges, and action dropdown."
      primitives={["Badge", "BotAvatar", "Button"]}
      combined={[]}
      tokens={["--surface-card", "--border-subtle", "--color-accent-default", "--color-success", "--color-warning"]}
    />
  ),
};

