import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Interactive action button with multiple visual variants (primary, secondary, outline, ghost, danger, danger-solid), responsive size scales, loading spinner support, and accessible WCAG contrast.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "danger", "danger-solid"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
    },
    isLoading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Save Changes",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Cancel",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Delete Item",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Refresh Feed",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Dismiss",
  },
};

export const Loading: Story = {
  args: {
    variant: "primary",
    isLoading: true,
    loadingText: "Synthesizing...",
    children: "Synthesize",
  },
};

export const WithIcons: Story = {
  args: {
    variant: "secondary",
    leftIcon: <span>🔍</span>,
    rightIcon: <span>↗</span>,
    children: "Inspect Knowledge",
  },
};

