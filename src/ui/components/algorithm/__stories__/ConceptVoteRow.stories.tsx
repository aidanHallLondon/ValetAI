import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { ConceptVoteRow } from "../ConceptVoteRow";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof ConceptVoteRow> = {
  title: "Complex Components/ConceptVoteRow",
  component: ConceptVoteRow,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Interactive draggable concept card allowing users to upvote, downvote,
hide from feed, inspect associated sources, and manage compound intersection rules.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConceptVoteRow>;

export const UpvotedWithCompounds: Story = {
  render: () => {
    const [weight, setWeight] = useState(2);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMuted, setIsMuted] = useState(false);

    return (
      <div style={{ padding: "1.5rem", maxWidth: "800px" }}>
        <ConceptVoteRow
          token={{
            key: "artificial intelligence",
            name: "Artificial Intelligence",
            type: "category",
            count: 38,
            topSourceName: "Ars Technica",
            isMuted,
          }}
          weight={weight}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded((e) => !e)}
          onVote={(_k, delta) => setWeight((w) => w + delta)}
          onToggleMute={() => setIsMuted((m) => !m)}
          matchedRules={[
            {
              id: "rule-1",
              type: "vector",
              tags: ["Artificial Intelligence", "Autonomous Agents"],
              weight: 1,
            },
          ]}
          onSetRuleWeight={() => {}}
          onResetRule={() => {}}
        />
      </div>
    );
  },
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="ConceptVoteRow"
      description="Combines concept avatar, category pill, article count link, vote stepper, and compound rule drawer."
      primitives={["Badge", "Button"]}
      complex={["CompoundRuleItem"]}
      combined={[]}
      tokens={["--surface-card", "--border-subtle", "--color-accent-default", "--radius-md"]}
    />
  ),
};
