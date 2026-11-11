import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../Badge";

const meta: Meta<typeof Badge> = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Compact status badges and metadata tags supporting semantic status themes (success, warning, danger, info) and sizing variants.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "success", "warning", "danger", "info", "neutral"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    dot: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "General",
  },
};

export const SuccessWithDot: Story = {
  args: {
    variant: "success",
    dot: true,
    children: "LM Studio Online",
  },
};

export const WarningWithDot: Story = {
  args: {
    variant: "warning",
    dot: true,
    children: "Model Not Loaded",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Failed (3 retries)",
  },
};

export const PrimaryInfo: Story = {
  args: {
    variant: "primary",
    children: "Deep Reader v2",
  },
};

