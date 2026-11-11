import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { ServerModelsTable } from "../ServerModelsTable";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";
import type { LoadedModelMetadata, ModelSettings } from "../../../../db/schema";

const meta: Meta<typeof ServerModelsTable> = {
  title: "Complex Components/ServerModelsTable",
  component: ServerModelsTable,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Server models inspection table presenting active discovered endpoints,
model architecture tiers, context length capacities, and assigned agent bots.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServerModelsTable>;

const mockModels: LoadedModelMetadata[] = [
  {
    id: "qwen2.5-7b-instruct",
    displayName: "Qwen 2.5 7B Instruct",
    type: "llm",
    architecture: "qwen2",
    contextLength: 32768,
    paramsString: "7B",
    quantization: "Q4_K_M",
    status: "loaded",
  },
  {
    id: "deepseek-r1-distill-qwen-7b",
    displayName: "DeepSeek R1 Distill Qwen 7B",
    type: "llm",
    architecture: "qwen2",
    contextLength: 65536,
    paramsString: "7B",
    quantization: "Q4_K_M",
    status: "loaded",
  },
  {
    id: "nomic-embed-text-v1.5",
    displayName: "Nomic Embed Text v1.5",
    type: "embedding",
    architecture: "nomic-bert",
    contextLength: 2048,
    paramsString: "137M",
    quantization: "F16",
    status: "loaded",
  },
];

const mockForm = {
  llmBaseUrl: "http://localhost:1234/v1",
  llmModel: "qwen2.5-7b-instruct",
  scoutModel: "qwen2.5-7b-instruct",
  embeddingModel: "nomic-embed-text-v1.5",
  llmApiKey: "lm-studio",
  useCommonServerForThinking: true,
  thinkingBaseUrl: "",
  thinkingApiKey: "",
  useCommonServerForFast: true,
  scoutBaseUrl: "",
  scoutApiKey: "",
  useCommonServerForEmbedding: true,
  embeddingsBaseUrl: "",
  embeddingsApiKey: "",
  useCustomEmbeddingsEndpoint: false,
  contextWindow: 40960,
  liveTraceEnabled: true,
  traceMaxChars: 8000,
  systemPrompt: "",
  relevanceRubric: "",
  promptTemplate: "",
  categories: [],
  sentiments: [],
  clustererSystemPrompt: "",
} as unknown as ModelSettings;

export const DiscoveredModels: Story = {
  render: () => (
    <div style={{ padding: "1.5rem", background: "var(--surface-canvas)", maxWidth: "1000px" }}>
      <ServerModelsTable
        availableModels={mockModels}
        form={mockForm}
        onRefreshMetadata={() => {}}
      />
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="ServerModelsTable"
      description="Table showing discovered inference server models, architecture badges, context window lengths, and bot assignment tags."
      primitives={["Badge", "Button"]}
      combined={[]}
      tokens={["--surface-card", "--border-subtle", "--color-accent-default", "--color-success"]}
    />
  ),
};
