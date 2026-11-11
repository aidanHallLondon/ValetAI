import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { ArticlePagination } from "../ArticlePagination";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof ArticlePagination> = {
  title: "Combined Components/ArticlePagination",
  component: ArticlePagination,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Article sequence navigation control with prominent chevron buttons and sequence index counter.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ArticlePagination>;

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Combined Component"
      componentName="ArticlePagination"
      description="Interactive sequence pagination with keyboard navigation compatibility and counter indicator."
      tokens={["--surface-card", "--border-subtle", "--color-foreground-primary"]}
    >
      <ArticlePagination
        hasPrev={true}
        hasNext={true}
        currentIndex={1}
        totalItems={100}
      />
    </ComponentAnatomy>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [index, setIndex] = useState(1);
    const total = 50;
    return (
      <ArticlePagination
        hasPrev={index > 0}
        hasNext={index < total - 1}
        currentIndex={index}
        totalItems={total}
        onPrev={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => setIndex((i) => Math.min(total - 1, i + 1))}
      />
    );
  },
};

export const FirstItem: Story = {
  args: {
    hasPrev: false,
    hasNext: true,
    currentIndex: 0,
    totalItems: 42,
  },
};

export const LastItem: Story = {
  args: {
    hasPrev: true,
    hasNext: false,
    currentIndex: 41,
    totalItems: 42,
  },
};

