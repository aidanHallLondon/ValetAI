import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { StoryClusterDrawer } from "../StoryClusterDrawer";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";
import type { HydratedContentRecord } from "../../../../db/schema";

const meta: Meta<typeof StoryClusterDrawer> = {
  title: "Complex Components/StoryClusterDrawer",
  component: StoryClusterDrawer,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Expandable nested drawer displaying multi-source news collation and related articles.
Shows domain favicons, publication recency, and links to source coverage.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StoryClusterDrawer>;

const mockParent: HydratedContentRecord = {
  id: 1,
  analysis: {
    title: "Major Breakthrough Announced in Room-Temperature Superconductivity Verification",
    summary: "Comprehensive synthesis replication attempts across global laboratories.",
  },
  source_name: "Nature News",
  source_url: "https://example.com/superconductivity",
} as unknown as HydratedContentRecord;

const mockChildren = [
  {
    id: 2,
    title: "Independent Labs Attempt Replication of New Superconductor Synthesis",
    source_name: "MIT Technology Review",
    source_url: "https://technologyreview.com",
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    summary: "Physicists around the world begin rapid synthesis attempts following open-source protocol release.",
  },
  {
    id: 3,
    title: "Market Reactions to High-Temperature Conductor Patent Filings",
    source_name: "Bloomberg",
    source_url: "https://bloomberg.com",
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    summary: "Energy and semiconductor equipment makers see unexpected surges in early trading.",
  },
];

export const ClusteredCoverage: Story = {
  render: () => (
    <div style={{ padding: "1.5rem", background: "var(--surface-canvas)", maxWidth: "700px" }}>
      <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
        <h3 style={{ margin: "0 0 0.5rem" }}>{mockParent.analysis?.title}</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          Source: {mockParent.source_name}
        </p>
        <StoryClusterDrawer
          parentItem={mockParent}
          childArticles={mockChildren}
        />
      </div>
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="StoryClusterDrawer"
      description="Collapsible multi-source coverage drawer showing nested child article links, publication dates, and source badges."
      primitives={["Badge", "Button"]}
      combined={[]}
      tokens={["--surface-card", "--surface-inset", "--border-subtle", "--color-accent-default"]}
    />
  ),
};
