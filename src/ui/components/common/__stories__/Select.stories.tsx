import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Select } from "../Select";
import { ComponentAnatomy } from "./AnatomyCard";

const sampleOptions = [
  { value: "rss", label: "RSS / Atom XML Feed" },
  { value: "web", label: "Web Page Scraping" },
  { value: "api", label: "JSON REST API" },
  { value: "newsletter", label: "Email Newsletter" },
];

const meta: Meta<typeof Select> = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Form select dropdown primitive supporting labels, helper hints, accessible validation error states, and custom options.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Primitive"
      componentName="Select"
      description="Fundamental form dropdown element styled with design tokens and integrated label/helper messaging."
      tokens={["--surface-card", "--border-subtle", "--color-foreground-primary", "--color-status-error"]}
    >
      <div style={{ maxWidth: 360 }}>
        <Select
          label="Ingestion Protocol"
          options={sampleOptions}
          defaultValue="rss"
          helperText="Determines parser strategy and network scheduling."
        />
      </div>
    </ComponentAnatomy>
  ),
};

export const Default: Story = {
  args: {
    label: "Ingestion Source Type",
    options: sampleOptions,
    defaultValue: "rss",
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Select {...args} />
    </div>
  ),
};

export const WithHelperText: Story = {
  args: {
    label: "Telemetry Logging Level",
    options: [
      { value: "debug", label: "Debug (Verbose diagnostics)" },
      { value: "info", label: "Info (Standard operational events)" },
      { value: "warn", label: "Warning (Degraded conditions only)" },
      { value: "error", label: "Error (Failures only)" },
    ],
    defaultValue: "info",
    helperText: "Lower logging levels increase database transaction volume.",
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Select {...args} />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    label: "Default Language Model",
    options: [
      { value: "qwen2.5", label: "Qwen 2.5 7B Instruct" },
      { value: "deepseek", label: "DeepSeek R1 Distill Qwen 7B" },
    ],
    defaultValue: "deepseek",
    error: "Selected model endpoint is currently unreachable.",
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Select {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Hardware Acceleration Mode",
    options: [
      { value: "metal", label: "Apple Silicon Metal (GPU)" },
      { value: "cuda", label: "NVIDIA CUDA" },
      { value: "cpu", label: "CPU Only" },
    ],
    defaultValue: "metal",
    disabled: true,
    helperText: "Hardware acceleration is locked by system environment.",
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Select {...args} />
    </div>
  ),
};

export const OptionGroups: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <Select label="Agent Assignment" defaultValue="curator">
        <optgroup label="Triage & Ingestion">
          <option value="scout">Scout Agent</option>
          <option value="reader">Reader Agent</option>
        </optgroup>
        <optgroup label="Organization & Intelligence">
          <option value="organiser">Organiser Agent</option>
          <option value="curator">Curator Agent</option>
          <option value="supervisor">Supervisor Agent</option>
        </optgroup>
      </Select>
    </div>
  ),
};

