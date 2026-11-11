import React, { useState, useEffect, Suspense, useMemo } from "react";
import type { HydratedContentRecord, SourceRecord } from "../../../db/schema";
import { BotAvatar } from "../common/BotAvatar";
import { NavigationSidebar } from "./NavigationSidebar";
import { AGENT_BOTS } from "../../utils/agents";
import type { AlgorithmPreferences } from "../../utils/algorithm";
import {
  SettingsTab,
  SettingsBreadcrumb,
  getSettingsBreadcrumb,
} from "../../utils/settingsNavigation";

export type { SettingsTab, SettingsBreadcrumb };
export { getSettingsBreadcrumb };
export const getBreadcrumb = getSettingsBreadcrumb;

const GathererSection = React.lazy(() =>
  import("../GathererSection").then((m) => ({ default: m.GathererSection }))
);
const DatabaseSection = React.lazy(() =>
  import("../DatabaseSection").then((m) => ({ default: m.DatabaseSection }))
);
const AiSection = React.lazy(() =>
  import("../AiSection").then((m) => ({ default: m.AiSection }))
);
const AlgorithmSection = React.lazy(() =>
  import("../AlgorithmSection").then((m) => ({ default: m.AlgorithmSection }))
);

function SectionLoadingFallback() {
  return (
    <div className="section-loading-fallback">
      <span className="disc-spinner" />
      <span>Loading section…</span>
    </div>
  );
}

export interface SettingsProps {
  sources: SourceRecord[];
  items: HydratedContentRecord[];
  telemetry: any;
  preferences: AlgorithmPreferences;
  onUpdatePreferences: (newPrefs: AlgorithmPreferences) => void;
  onRefreshSources: () => Promise<void>;
  onRefreshItems: () => Promise<void>;
  onRefreshTelemetry: () => Promise<void>;
  onTriggerGatherer: () => Promise<void>;
  onNavigateToFeedWithTag?: (
    tagName: string,
    type: "source" | "category" | "entity" | "tokenset",
    filterMode?: "all" | "unread",
    tokens?: string[]
  ) => void;
  onSelectItem?: (item: HydratedContentRecord) => void;
  activeTab?: SettingsTab;
  onSelectTab?: (tab: SettingsTab) => void;
  initialTab?: SettingsTab;
  initialTagFilter?: string | null;
}

// Backwards compatibility alias
export type CommandCenterTab = SettingsTab;
export type CommandCenterProps = SettingsProps;

export function CommandCenter({
  sources,
  items,
  telemetry,
  preferences,
  onUpdatePreferences,
  onRefreshSources,
  onRefreshItems,
  onRefreshTelemetry,
  onTriggerGatherer,
  onNavigateToFeedWithTag,
  onSelectItem,
  activeTab: propActiveTab,
  onSelectTab: propOnSelectTab,
  initialTab = "gatherer",
  initialTagFilter = null,
}: SettingsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<SettingsTab>(initialTab);
  const activeTab = propActiveTab ?? internalActiveTab;
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(initialTagFilter);
  const [libraryAction, setLibraryAction] = useState<"recluster" | "recurate" | "reread" | null>(null);
  const [storybookKey, setStorybookKey] = useState(0);
  // Drawer state: shown on Settings pages unless it does not fit (< 1024px) or user closes it
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Track window resizing: auto-close if too narrow to fit, auto-open if expanding to fit
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (lastWidth >= 1024 && currentWidth < 1024) {
        setIsDrawerOpen(false);
      } else if (lastWidth < 1024 && currentWidth >= 1024) {
        setIsDrawerOpen(true);
      }
      lastWidth = currentWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for global header toggle / open events
  useEffect(() => {
    const handleToggleDrawer = () => setIsDrawerOpen((prev) => !prev);
    const handleOpenDrawer = () => setIsDrawerOpen(true);
    window.addEventListener("valet-toggle-drawer", handleToggleDrawer);
    window.addEventListener("valet-open-drawer", handleOpenDrawer);
    return () => {
      window.removeEventListener("valet-toggle-drawer", handleToggleDrawer);
      window.removeEventListener("valet-open-drawer", handleOpenDrawer);
    };
  }, []);

  // Listen for Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  // Sync drawer open state to global listeners and body class
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("valet-drawer-change", { detail: { open: isDrawerOpen } })
    );
    if (isDrawerOpen) {
      document.body.classList.add("valet-drawer-is-open");
    } else {
      document.body.classList.remove("valet-drawer-is-open");
    }
    return () => {
      document.body.classList.remove("valet-drawer-is-open");
    };
  }, [isDrawerOpen]);

  // Tab selection handler: switches tab, and only closes drawer on mobile/tablet viewports
  const selectTab = (tab: SettingsTab) => {
    if (propOnSelectTab) {
      propOnSelectTab(tab);
    }
    setInternalActiveTab(tab);
    window.dispatchEvent(
      new CustomEvent("valet-settings-tab-change", { detail: { tab } })
    );
    if (window.innerWidth < 1024) {
      setIsDrawerOpen(false);
    }
  };

  const handleNavigateToAlgorithm = (sourceName: string) => {
    setSelectedTagFilter(sourceName);
    selectTab("algorithm");
  };

  const handleNavigateToLibraryWithAction = (action?: "recluster" | "recurate" | "reread") => {
    if (action) setLibraryAction(action);
    selectTab("db");
  };

  const crumb = getSettingsBreadcrumb(activeTab);

  const queuedCount = useMemo(() => {
    return items.filter(
      (it) =>
        it.status === "pending" ||
        it.status === "processing" ||
        it.reader_status === "pending" ||
        it.reader_status === "processing" ||
        (it.reader_status === "completed" && it.organiser_status === "pending") ||
        (it.organiser_status === "completed" && it.curator_status === "pending")
    ).length;
  }, [items]);

  return (
    <div className={`command-center command-center-layout ${isDrawerOpen ? "drawer-open" : "drawer-closed"}`}>
      <NavigationSidebar
        isDrawerOpen={isDrawerOpen}
        onCloseDrawer={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={selectTab}
        sourcesCount={sources.length}
        itemsCount={items.length}
        queuedCount={queuedCount}
        isAiOnline={Boolean(telemetry?.ai?.online)}
      />

      {/* Main Panel Content */}
      <main className="command-main">
        <Suspense fallback={<SectionLoadingFallback />}>
          {activeTab === "gatherer" && (
            <GathererSection
              sources={sources}
              items={items}
              preferences={preferences}
              onUpdatePreferences={onUpdatePreferences}
              onNavigateToFeedWithTag={onNavigateToFeedWithTag}
              onNavigateToTags={handleNavigateToAlgorithm}
              onRefreshSources={onRefreshSources}
              onTriggerRestart={onTriggerGatherer}
              onNavigateToDb={() => selectTab("db")}
            />
          )}
          {(activeTab === "algorithm" || activeTab === "tags") && (
            <AlgorithmSection
              items={items}
              sources={sources}
              preferences={preferences}
              onUpdatePreferences={onUpdatePreferences}
              onNavigateToFeedWithTag={onNavigateToFeedWithTag}
              initialFilterTag={selectedTagFilter}
            />
          )}
          {activeTab === "db" && (
            <DatabaseSection
              items={items}
              onRefreshItems={onRefreshItems}
              initialAction={libraryAction}
              onClearAction={() => setLibraryAction(null)}
              onSelectItem={onSelectItem}
              viewMode="items"
            />
          )}
          {activeTab === "queue" && (
            <DatabaseSection
              items={items}
              onRefreshItems={onRefreshItems}
              initialAction={libraryAction}
              onClearAction={() => setLibraryAction(null)}
              onSelectItem={onSelectItem}
              viewMode="queue"
            />
          )}
          {(activeTab === "about-me" || activeTab.startsWith("ai-")) && (
            <AiSection
              telemetry={telemetry}
              onRefreshTelemetry={onRefreshTelemetry}
              onNavigateToLibrary={handleNavigateToLibraryWithAction}
              subTab={
                activeTab === "about-me"
                  ? "about-me"
                  : activeTab === "ai-prompts"
                  ? "agent-analyst"
                  : (activeTab.replace("ai-", "") as any)
              }
              onChangeSubTab={(tab) => {
                if (tab === "about-me") {
                  selectTab("about-me");
                } else if (tab === "prompts") {
                  selectTab("ai-agent-analyst");
                } else {
                  selectTab(`ai-${tab}` as SettingsTab);
                }
              }}
            />
          )}
          {activeTab === "storybook" && (
            <div className="storybook-panel-container">
              <div className="admin-card" style={{ marginBottom: "var(--primitive-space-4)" }}>
                <div
                  className="card-title-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--primitive-space-3)",
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0 }}>Storybook Component Library</h4>
                    <p className="muted" style={{ margin: "4px 0 0" }}>
                      Isolated workbench for Valet design tokens, normalized primitives, and agent avatars.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "var(--primitive-space-2)" }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setStorybookKey((k) => k + 1)}
                      title="Reload Storybook iframe"
                    >
                      Reload Preview ↻
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => window.open("/storybook/index.html", "_blank")}
                      title="Open Storybook in a new browser window"
                    >
                      Open in New Window ↗
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="admin-card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  height: "calc(100vh - 230px)",
                  minHeight: "600px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <iframe
                  key={storybookKey}
                  src="/storybook/index.html"
                  title="Valet Storybook"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "var(--surface-background)",
                    flex: 1,
                  }}
                />
              </div>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}

// Export Settings alias
export const Settings = CommandCenter;
