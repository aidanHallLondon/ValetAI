import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { CompoundRuleItem } from "../CompoundRuleItem";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof CompoundRuleItem> = {
  title: "Complex Components/CompoundRuleItem",
  component: CompoundRuleItem,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Interactive row displaying a multi-concept rule with directional arrow,
concept tags, voting controls, and a delete button.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CompoundRuleItem>;

export const BoostedRule: Story = {
  render: () => {
    const [weight, setWeight] = useState(1);

    return (
      <div style={{ padding: "1.5rem", maxWidth: "600px" }}>
        <CompoundRuleItem
          rule={{
            id: "rule-1",
            type: "vector",
            tags: ["Artificial Intelligence", "Autonomous Agents", "Robotics"],
            weight,
            label: "AI + Agents + Robotics",
          }}
          currentTokenKey="artificial intelligence"
          onSetWeight={(_id, _type, delta) => setWeight(delta)}
          onReset={() => setWeight(0)}
        />
      </div>
    );
  },
};

export const DemotedRule: Story = {
  render: () => (
    <div style={{ padding: "1.5rem", maxWidth: "600px" }}>
      <CompoundRuleItem
        rule={{
          id: "rule-2",
          type: "tokenset",
          tags: ["Celebrity Gossip", "Wire Fluff"],
          weight: -1,
        }}
        currentTokenKey="celebrity gossip"
        onSetWeight={() => {}}
        onReset={() => {}}
      />
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="CompoundRuleItem"
      description="Combines concept pills, plus dividers, directional arrow, and dual voting buttons."
      primitives={["Badge", "Button"]}
      tokens={["--surface-subtle", "--border-subtle", "--color-status-success", "--color-status-error"]}
    />
  ),
};
