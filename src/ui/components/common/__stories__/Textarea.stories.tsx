import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Textarea } from "../Textarea";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof Textarea> = {
  title: "Primitives/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Multi-line text input primitive for system prompts, personal directives, and extended notes with label, helper, and error state support.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    error: { control: "text" },
    rows: { control: "number" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Primitive"
      componentName="Textarea"
      description="Fundamental multi-line text input element styled with design tokens, responsive typography, and form state messaging."
      tokens={["--surface-card", "--border-subtle", "--color-foreground-primary", "--color-status-error"]}
    >
      <div style={{ maxWidth: 440 }}>
        <Textarea
          label="Personal Directives"
          rows={3}
          placeholder="State your technical reading priorities, favorite topics, and filters..."
          helperText="Directives shape ranking decisions during article triage."
        />
      </div>
    </ComponentAnatomy>
  ),
};

export const Default: Story = {
  args: {
    label: "Agent System Prompt",
    placeholder: "You are an autonomous compiler researcher evaluating LLVM optimization breakthroughs...",
    rows: 4,
  },
  render: (args) => (
    <div style={{ maxWidth: 440 }}>
      <Textarea {...args} />
    </div>
  ),
};

export const WithHelperText: Story = {
  args: {
    label: "CSS Style Overrides",
    placeholder: ":root { --color-accent-default: #0284c7; }",
    rows: 3,
    helperText: "Custom CSS rules injected directly into the application head element.",
  },
  render: (args) => (
    <div style={{ maxWidth: 440 }}>
      <Textarea {...args} />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    label: "Extraction Regex Pattern",
    defaultValue: "((([a-zA-Z0-9]+",
    rows: 2,
    error: "Invalid regular expression syntax: unterminated group at index 14.",
  },
  render: (args) => (
    <div style={{ maxWidth: 440 }}>
      <Textarea {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: "System Audit Log (Read Only)",
    defaultValue: "2026-11-10T13:20:00Z [Scout] Harvested 14 new records.\n2026-11-10T13:20:04Z [Curator] Generated cluster vector for 3 items.",
    rows: 3,
    disabled: true,
    helperText: "Live log output cannot be modified in edit mode.",
  },
  render: (args) => (
    <div style={{ maxWidth: 440 }}>
      <Textarea {...args} />
    </div>
  ),
};

export const FixedRows: Story = {
  args: {
    label: "Compact Feedback Note",
    rows: 2,
    placeholder: "Add an optional operator note...",
  },
  render: (args) => (
    <div style={{ maxWidth: 440 }}>
      <Textarea {...args} />
    </div>
  ),
};

