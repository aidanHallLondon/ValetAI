import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { CommandCenter } from "../CommandCenter";
import { AppHeader } from "../AppHeader";
import { getSettingsBreadcrumb, type SettingsTab } from "../../../utils/settingsNavigation";
import { MOCK_ITEMS } from "../../common/__stories__/mockData";
import { DEFAULT_PREFERENCES } from "../../../utils/algorithm";
import type { SourceRecord } from "../../../../db/schema";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof CommandCenter> = {
  title: "Layouts/CommandCenter",
  component: CommandCenter,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "System administration hub containing settings panels for RSS Gatherer, SQLite Database & Vector Inspector, Algorithm scoring, and AI Agent controls.",
      },
    },
  },
};

export default meta;

const MOCK_SOURCES: SourceRecord[] = [
  {
    id: 1,
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/",
    type: "rss",
    enabled: true,
    description: "Emerging technology and computing research breakthroughs.",
    site_url: "https://www.technologyreview.com",
    last_fetch_count: 12,
    last_fetched_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 2,
    name: "ArXiv AI Preprint Feed",
    url: "http://export.arxiv.org/rss/cs.AI",
    type: "rss",
    enabled: true,
    description: "Computer science artificial intelligence preprints.",
    site_url: "https://arxiv.org",
    last_fetch_count: 35,
    last_fetched_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
];

const MOCK_TELEMETRY = {
  tokensUsedTotal: 284500,
  estimatedCostTotal: 0.14,
  activeCalls: 0,
  recentTraces: [],
};

export const Anatomy: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-background)" }}>
        <ComponentAnatomy
          level="Layout"
          componentName="CommandCenter"
          description="Administrative control hub unifying telemetry metrics, source gatherers, vector inspections, and prompt versioning."
          layouts={["NavigationSidebar", "AgentViews"]}
          complex={["MetricCard"]}
          combined={[]}
          primitives={["BotAvatar", "Card", "Badge", "Button", "Input", "Toggle"]}
          tokens={["--command-center-max-width", "--surface-card", "--border-subtle"]}
        />
      </div>
    );
  },
};

export const DefaultCommandCenter: StoryObj = {
  render: () => {
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [sources] = useState<SourceRecord[]>(MOCK_SOURCES);
    const [activeTab, setActiveTab] = useState<SettingsTab>("gatherer");
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-background)" }}>
        <AppHeader
          view="command"
          onViewChange={() => {}}
          isSettingsDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          breadcrumb={getSettingsBreadcrumb(activeTab)}
          onOpenTokenModal={() => alert("Token modal triggered")}
          onCloseMobilePage={() => setIsDrawerOpen(true)}
        />
        <CommandCenter
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          sources={sources}
          items={MOCK_ITEMS}
          telemetry={MOCK_TELEMETRY}
          preferences={preferences}
          onUpdatePreferences={setPreferences}
          onRefreshSources={async () => { }}
          onRefreshItems={async () => { }}
          onRefreshTelemetry={async () => { }}
          onTriggerGatherer={async () => { }}
          initialTab="gatherer"
        />
      </div>
    );
  },
};

export const AlgorithmTab: StoryObj = {
  render: () => {
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [sources] = useState<SourceRecord[]>(MOCK_SOURCES);
    const [activeTab, setActiveTab] = useState<SettingsTab>("algorithm");
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-background)" }}>
        <AppHeader
          view="command"
          onViewChange={() => {}}
          isSettingsDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          breadcrumb={getSettingsBreadcrumb(activeTab)}
          onCloseMobilePage={() => setIsDrawerOpen(true)}
        />
        <CommandCenter
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          sources={sources}
          items={MOCK_ITEMS}
          telemetry={MOCK_TELEMETRY}
          preferences={preferences}
          onUpdatePreferences={setPreferences}
          onRefreshSources={async () => { }}
          onRefreshItems={async () => { }}
          onRefreshTelemetry={async () => { }}
          onTriggerGatherer={async () => { }}
          initialTab="algorithm"
        />
      </div>
    );
  },
};

export const DatabaseTab: StoryObj = {
  render: () => {
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [sources] = useState<SourceRecord[]>(MOCK_SOURCES);
    const [activeTab, setActiveTab] = useState<SettingsTab>("db");
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-background)" }}>
        <AppHeader
          view="command"
          onViewChange={() => {}}
          isSettingsDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          breadcrumb={getSettingsBreadcrumb(activeTab)}
          onCloseMobilePage={() => setIsDrawerOpen(true)}
        />
        <CommandCenter
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          sources={sources}
          items={MOCK_ITEMS}
          telemetry={MOCK_TELEMETRY}
          preferences={preferences}
          onUpdatePreferences={setPreferences}
          onRefreshSources={async () => { }}
          onRefreshItems={async () => { }}
          onRefreshTelemetry={async () => { }}
          onTriggerGatherer={async () => { }}
          initialTab="db"
        />
      </div>
    );
  },
};

export const ClosedDrawer: StoryObj = {
  render: () => {
    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [sources] = useState<SourceRecord[]>(MOCK_SOURCES);
    const [activeTab, setActiveTab] = useState<SettingsTab>("gatherer");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-background)" }}>
        <AppHeader
          view="command"
          onViewChange={() => {}}
          isSettingsDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          breadcrumb={getSettingsBreadcrumb(activeTab)}
          onCloseMobilePage={() => setIsDrawerOpen(true)}
        />
        <CommandCenter
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          sources={sources}
          items={MOCK_ITEMS}
          telemetry={MOCK_TELEMETRY}
          preferences={preferences}
          onUpdatePreferences={setPreferences}
          onRefreshSources={async () => { }}
          onRefreshItems={async () => { }}
          onRefreshTelemetry={async () => { }}
          onTriggerGatherer={async () => { }}
          initialTab="gatherer"
        />
      </div>
    );
  },
};

