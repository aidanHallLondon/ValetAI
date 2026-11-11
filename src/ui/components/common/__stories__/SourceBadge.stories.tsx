import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { SourceBadge } from "../SourceBadge";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof SourceBadge> = {
  title: "Combined Components/SourceBadge",
  component: SourceBadge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Unified source badge and story cluster indicator. Displays source favicon and short name when single source, a stacked multi-source icon without text label when multiple sources, and an emphasized cluster indicator when representing collated stories. Renders as an interactive button if an action is attached, or as a static semantic pill otherwise.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-background)" }}>
        <ComponentAnatomy
          level="Combined Component"
          componentName="SourceBadge"
          description="Source provenance pill and story cluster trigger with interactive filtering and compact multi-source collapsing."
          primitives={["Badge", "Button"]}
          tokens={["--surface-elevated", "--surface-interactive", "--border-subtle", "--color-accent-default"]}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <SourceBadge
              sourceName="MIT Technology Review"
              domain="technologyreview.com"
              onClick={() => alert("Filtered by MIT Technology Review")}
            />
            <SourceBadge
              sources={["MIT Technology Review", "ArXiv AI Preprint Feed", "BBC News"]}
              onClick={() => alert("Multiple sources clicked")}
            />
            <SourceBadge
              isCluster={true}
              clusterCount={3}
              onClick={() => alert("Cluster clicked: opening reader modal")}
            />
          </div>
        </ComponentAnatomy>
      </div>
    );
  },
};

export const SingleSourceInteractive: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: "2rem", display: "flex", gap: "12px", alignItems: "center" }}>
        <SourceBadge
          sourceName="MIT Technology Review"
          domain="technologyreview.com"
          onClick={() => alert("Filter applied: MIT Technology Review")}
        />
        <SourceBadge
          sourceName="ArXiv Systems"
          domain="arxiv.org"
          onClick={() => alert("Filter applied: ArXiv Systems")}
        />
      </div>
    );
  },
};

export const SingleSourceStatic: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: "2rem", display: "flex", gap: "12px", alignItems: "center" }}>
        <SourceBadge
          sourceName="Direct Ingestion"
        />
        <span style={{ fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
          (No onClick handler: renders as static semantic span)
        </span>
      </div>
    );
  },
};

export const MultipleSourcesCollapsed: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: "2rem", display: "flex", gap: "16px", alignItems: "center" }}>
        <SourceBadge
          sources={["MIT Technology Review", "ArXiv Systems", "BBC World"]}
          onClick={() => alert("Multi-source filter clicked")}
        />
        <span style={{ fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
          (Multiple sources show stacked multi-source icon and count pill without text label; hover to view tooltip)
        </span>
      </div>
    );
  },
};

export const EmphasizedClusterBadge: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: "2rem", display: "flex", gap: "16px", alignItems: "center" }}>
        <SourceBadge
          isCluster={true}
          clusterCount={4}
          onClick={() => alert("Cluster clicked: opens reader modal view")}
        />
        <span style={{ fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
          (Emphasized cluster pill indicating +4 related coverage articles)
        </span>
      </div>
    );
  },
};
