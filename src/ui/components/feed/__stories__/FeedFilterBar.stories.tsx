import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { FeedFilterBar, DynamicFilterTag } from "../FeedFilterBar";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";
import { DEFAULT_ALGORITHM_PREFERENCES } from "../../../utils/algorithm";
import type { TagPreferencesState } from "../../../utils/algorithm";

const meta: Meta<typeof FeedFilterBar> = {
  title: "Complex Components/FeedFilterBar",
  component: FeedFilterBar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Filter toolbar for the article stream. Features system mode pills (All, Favourites, Urgent),
raw content inclusion toggle, active entity/source filter chips with in-pill steering, and unread toggles.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeedFilterBar>;

export const DefaultToolbar: Story = {
  render: () => {
    const [mode, setMode] = useState<string>("all");
    const [includeRaw, setIncludeRaw] = useState(false);
    const [includeRead, setIncludeRead] = useState(true);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [tags, setTags] = useState<DynamicFilterTag[]>([
      { id: "1", type: "entity", value: "Anthropic", label: "Anthropic" },
      { id: "2", type: "source", value: "Ars Technica", label: "Ars Technica" },
    ]);

    const preferences: TagPreferencesState = {
      ...DEFAULT_ALGORITHM_PREFERENCES,
      tokenWeights: { Anthropic: 3 },
    };

    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-canvas)" }}>
        <FeedFilterBar
          isAllActive={mode === "all"}
          isFavouritesActive={mode === "favourites"}
          isUrgentActive={mode === "urgent"}
          followedCount={12}
          urgentCount={3}
          rawCount={42}
          readCount={15}
          includeRawContent={includeRaw}
          includeReadContent={includeRead}
          unreadOnly={unreadOnly}
          dynamicTags={tags}
          mutedTagKeys={[]}
          preferences={preferences}
          hasAnyFiltersActive={tags.length > 0 || unreadOnly || includeRaw || !includeRead}
          onClearAll={() => {
            setTags([]);
            setUnreadOnly(false);
            setIncludeRaw(false);
            setIncludeRead(true);
          }}
          onToggleMode={(m) => setMode(m)}
          onToggleIncludeRaw={() => setIncludeRaw((r) => !r)}
          onToggleIncludeRead={() => setIncludeRead((r) => !r)}
          onRemoveDynamicTag={(t) => setTags((prev) => prev.filter((x) => x.id !== t.id))}
          onUnsetUnreadOnly={() => {
            setUnreadOnly(false);
            setIncludeRead(true);
          }}
          onUnmuteTag={() => { }}
          onAdjustTagTemperature={() => { }}
          onRecordVectorVote={() => { }}
        />
      </div>
    );
  },
};

export const Anatomy: Story = {
  render: () => (
    <ComponentAnatomy
      level="Complex Component"
      componentName="FeedFilterBar"
      description="Combines stream mode pills, Read and Raw toggle switches, dynamic entity chips with vote steppers, and clear filters action."
      primitives={["Badge", "Button", "Toggle"]}
      combined={[]}
      tokens={["--surface-card", "--border-subtle", "--color-accent-default", "--color-warning"]}
    />
  ),
};
