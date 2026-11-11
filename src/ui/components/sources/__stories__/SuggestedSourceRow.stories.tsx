import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { SuggestedSourceRow } from "../SuggestedSourceRow";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof SuggestedSourceRow> = {
  title: "Complex Components/SuggestedSourceRow",
  component: SuggestedSourceRow,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `AI-recommended source card displaying domain favicon, suitability match score,
editorial match explanation, and a 1-click addition button.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SuggestedSourceRow>;

export const HighMatchSuggestion: Story = {
  render: () => {
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = () => {
      setIsAdding(true);
      setTimeout(() => setIsAdding(false), 1000);
    };

    return (
      <div style={{ padding: "1.5rem", maxWidth: "800px" }}>
        <SuggestedSourceRow
          suggestion={{
            id: "sug-1",
            name: "Hacker News Frontpage",
            description: "Top community-voted technology discussions and startup developments",
            suitabilityScore: 94,
            type: "rss",
            category: "Technology",
            matchReason: "Matches your reading history on open-source AI and developer tooling",
            url: "https://news.ycombinator.com/rss",
            site_url: "https://news.ycombinator.com",
          }}
          isAdding={isAdding}
          onAdd={handleAdd}
        />
      </div>
    );
  },
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="SuggestedSourceRow"
      description="Combines suggestion glyph, suitability match score, editorial rationale pill, and add CTA."
      primitives={["Badge", "Button"]}
      tokens={["--surface-card", "--border-subtle", "--color-accent-default", "--radius-md"]}
    />
  ),
};
