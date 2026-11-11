import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Input } from "../Input";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof Input> = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Single-line text input primitive supporting labels, placeholders, helper hints, and accessible validation states.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    type: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Primitive"
      componentName="Input"
      description="Fundamental single-line text input field styled with design tokens, high contrast focus rings, and validation styling."
      tokens={["--surface-card", "--border-subtle", "--color-foreground-primary", "--color-status-error"]}
    >
      <div style={{ maxWidth: 360 }}>
        <Input
          label="Feed Name"
          placeholder="e.g. Quanta Magazine"
          helperText="Enter a friendly name for this source."
        />
      </div>
    </ComponentAnatomy>
  ),
};

export const Default: Story = {
  args: {
    label: "Endpoint URL",
    placeholder: "https://example.com/feed.xml",
    defaultValue: "https://news.ycombinator.com/rss",
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Input {...args} />
    </div>
  ),
};

export const WithHelperText: Story = {
  args: {
    label: "Local Server Host",
    defaultValue: "http://localhost:1234/v1",
    helperText: "Specifies base URL for OpenAI-compatible local AI inference server.",
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Input {...args} />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    label: "Database Connection String",
    defaultValue: "sqlite://invalid/path.db",
    error: "Database path does not exist or lacks write permissions.",
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Input {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Ingestion Worker ID",
    defaultValue: "worker-process-node-0",
    disabled: true,
    helperText: "Identifier assigned automatically by PM2 runtime supervisor.",
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <Input {...args} />
    </div>
  ),
};
