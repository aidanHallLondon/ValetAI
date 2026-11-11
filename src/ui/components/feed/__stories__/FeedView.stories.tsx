import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { FeedView } from "../FeedView";
import { MOCK_ITEMS } from "../../common/__stories__/mockData";
import { DEFAULT_PREFERENCES, type TagPreferencesState } from "../../../utils/algorithm";
import type { HydratedContentRecord } from "../../../../db/schema";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof FeedView> = {
  title: "Layouts/FeedView",
  component: FeedView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Primary Valet AI feed screen featuring dynamic filter pills, layout switching (list, grid, compact), search bar, read/unread tabs, and algorithmically ranked cards.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => {
    const [items, setItems] = useState<HydratedContentRecord[]>(MOCK_ITEMS);
    const [preferences, setPreferences] = useState<TagPreferencesState>(DEFAULT_PREFERENCES);
    const [activeMode, setActiveMode] = useState<string>("all");

    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-background)" }}>
        <ComponentAnatomy
          level="Layout"
          componentName="FeedView"
          description="Main editorial reading feed stream combining unified filter controls and ranked cards."
          complex={["FeedCard", "FeedFilterBar", "EmptyState", "FeedCardMetaRow"]}
          combined={["LayoutSwitcher"]}
          primitives={["BotAvatar", "Button", "Badge", "Toggle"]}
          tokens={["--surface-background", "--surface-card", "--color-accent-default", "--border-subtle"]}
        >
          <div style={{ height: "650px", overflow: "hidden", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)" }}>
            <FeedView
              items={items}
              preferences={preferences}
              onUpdatePreferences={setPreferences}
              onSelectItem={(item) => alert(`Selected: ${item.analysis?.title || item.raw_text}`)}
              activeMode={activeMode}
              onChangeMode={setActiveMode}
              onOpenSettings={() => { }}
            />
          </div>
        </ComponentAnatomy>
      </div>
    );
  },
};

export const DefaultFeed: StoryObj = {
  render: () => {
    const [items, setItems] = useState<HydratedContentRecord[]>(MOCK_ITEMS);
    const [preferences, setPreferences] = useState<TagPreferencesState>(DEFAULT_PREFERENCES);
    const [activeMode, setActiveMode] = useState<string>("all");

    const handleMarkRead = (id: number, isRead = true) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: isRead } : item))
      );
    };

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-background)" }}>
        <FeedView
          items={items}
          preferences={preferences}
          onUpdatePreferences={setPreferences}
          onSelectItem={(item) => alert(`Selected: ${item.analysis?.title || item.raw_text}`)}
          onMarkRead={handleMarkRead}
          onRefreshItems={() => console.log("Refresh requested")}
          activeMode={activeMode}
          onChangeMode={setActiveMode}
          onOpenSettings={() => alert("Settings modal opened")}
        />
      </div>
    );
  },
};
