import React, { useState, useEffect, useCallback, Suspense } from "react";
import type { HydratedContentRecord, SourceRecord } from "../db/schema";
import { CONFIG } from "../config";
import { FeedView } from "./components/feed/FeedView";
import { ReaderPage } from "./components/reader/ReaderPage";
import { AppHeader } from "./components/layouts/AppHeader";
import { TokenCostModal } from "./components/common/TokenCostModal";
import {
  TagPreferencesState,
  DEFAULT_PREFERENCES,
  extractArticleTags,
  recordVectorVote,
  getArticleVote,
} from "./utils/algorithm";
import {
  SettingsTab,
  getSettingsBreadcrumb,
} from "./utils/settingsNavigation";

const CommandCenter = React.lazy(() =>
  import("./components/layouts/CommandCenter").then((m) => ({ default: m.CommandCenter }))
);

export function App() {
  const [view, setView] = useState<"feed" | "command">("feed");
  const [items, setItems] = useState<HydratedContentRecord[]>([]);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [selectedItem, setSelectedItem] =
    useState<HydratedContentRecord | null>(null);
  const [viewingList, setViewingList] = useState<HydratedContentRecord[]>([]);
  const [feedMode, setFeedMode] = useState<string>("all");
  const [externalFeedTag, setExternalFeedTag] = useState<{
    type: "source" | "category" | "entity" | "tokenset";
    value: string;
    tokens?: string[];
    unreadOnly?: boolean;
  } | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
  const [isReaderIframeView, setIsReaderIframeView] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("gatherer");
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleDrawerChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ open: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.open === "boolean") {
        setIsSettingsDrawerOpen(customEvent.detail.open);
      }
    };
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: SettingsTab }>;
      if (customEvent.detail && customEvent.detail.tab) {
        setSettingsTab(customEvent.detail.tab);
      }
    };
    window.addEventListener("valet-drawer-change", handleDrawerChange);
    window.addEventListener("valet-settings-tab-change", handleTabChange);
    return () => {
      window.removeEventListener("valet-drawer-change", handleDrawerChange);
      window.removeEventListener("valet-settings-tab-change", handleTabChange);
    };
  }, []);

  const handleNavigateToFeedWithTag = useCallback(
    (
      tagName: string,
      type: "source" | "category" | "entity" | "tokenset",
      filterMode?: "all" | "unread",
      tokens?: string[]
    ) => {
      if (type === "category") {
        setFeedMode(tagName.toLowerCase());
        setExternalFeedTag(null);
      } else {
        setFeedMode("all");
        setExternalFeedTag({
          type,
          value: tagName,
          tokens: tokens || (type === "tokenset" ? tagName.split("+").map((t) => t.trim()) : undefined),
          unreadOnly: filterMode === "unread",
        });
      }
      setView("feed");
    },
    []
  );

  // Global tag and source temperature preferences
  const [preferences, setPreferences] = useState<TagPreferencesState>(() => {
    try {
      const stored = localStorage.getItem("valet-feed-preferences");
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_PREFERENCES;
  });

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/preferences");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.preferences) {
        setPreferences((prev) => ({
          ...prev,
          ...data.preferences,
          tokenWeights: {
            ...(prev.tokenWeights || {}),
            ...(data.preferences.tokenWeights || data.preferences.tagTemperatures || {}),
          },
          tokenMuted: {
            ...(prev.tokenMuted || {}),
            ...(data.preferences.tokenMuted || data.preferences.tagMuted || {}),
          },
          tokenSetWeights: {
            ...(prev.tokenSetWeights || {}),
            ...(data.preferences.tokenSetWeights || data.preferences.comboTemperatures || {}),
          },
          articleVotes: {
            ...(prev.articleVotes || {}),
            ...(data.preferences.articleVotes || {}),
          },
          votedVectors: {
            ...(prev.votedVectors || {}),
            ...(data.preferences.votedVectors || {}),
          },
          tagTemperatures: {
            ...(prev.tagTemperatures || {}),
            ...(data.preferences.tagTemperatures || data.preferences.tokenWeights || {}),
          },
          tagMuted: {
            ...(prev.tagMuted || {}),
            ...(data.preferences.tagMuted || data.preferences.tokenMuted || {}),
          },
          comboTemperatures: {
            ...(prev.comboTemperatures || {}),
            ...(data.preferences.comboTemperatures || data.preferences.tokenSetWeights || {}),
          },
        }));
      }
    } catch {}
  }, []);

  const handleUpdatePreferences = useCallback((newPrefs: TagPreferencesState) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem("valet-feed-preferences", JSON.stringify(newPrefs));
    } catch {}
    fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPrefs),
    }).catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/content");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      console.error("Error fetching content:", err);
    }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/sources");
      if (!res.ok) return;
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch (err) {
      console.error("Error fetching sources:", err);
    }
  }, []);

  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch("/api/telemetry");
      if (!res.ok) return;
      const data = await res.json();
      setTelemetry(data);
    } catch (err) {
      console.error("Error fetching telemetry:", err);
    }
  }, []);

  const triggerGatherer = async () => {
    try {
      await fetch("/api/gatherer/trigger", { method: "POST" });
      await fetchTelemetry();
    } catch (err) {
      console.error("Failed to trigger gatherer:", err);
    }
  };

  useEffect(() => {
    void fetchItems();
    void fetchSources();
    void fetchTelemetry();
    void fetchPreferences();

    const interval = setInterval(() => {
      void fetchItems();
      if (view === "command") {
        void fetchSources();
        void fetchTelemetry();
      }
    }, CONFIG.UI.POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchItems, fetchSources, fetchTelemetry, fetchPreferences, view]);

  const handleMarkRead = (id: number, isRead = true) => {
    fetch(`/api/content/${id}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: isRead }),
    })
      .then(() => {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, is_read: isRead } : it))
        );
      })
      .catch(() => {});
  };

  const handleToggleFollowStory = async (storyId: number) => {
    try {
      const res = await fetch(`/api/stories/${storyId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((it) =>
            it.story_id === storyId ? { ...it, is_followed: data.is_followed } : it
          )
        );
        setSelectedItem((prev) =>
          prev && prev.story_id === storyId
            ? { ...prev, is_followed: data.is_followed }
            : prev
        );
      }
    } catch (err) {
      console.error("Failed to toggle follow story:", err);
    }
  };

  const handleRateCard = useCallback(
    (item: HydratedContentRecord, rating: "hot" | "not") => {
      const direction = rating === "hot" ? "up" : "down";
      const tags = extractArticleTags(item);
      const { nextPrefs } = recordVectorVote(
        preferences,
        tags,
        direction,
        item.id
      );
      handleUpdatePreferences(nextPrefs);
    },
    [preferences, handleUpdatePreferences]
  );

  const handleSelectItem = useCallback(
    (item: HydratedContentRecord, orderedItems?: HydratedContentRecord[]) => {
      setIsReaderIframeView(false);
      setSelectedItem(item);
      if (orderedItems && orderedItems.length > 0) {
        setViewingList(orderedItems);
      }
    },
    []
  );

  // Active Reader Toolbar calculation using the exact ordered card viewing list
  const readerItems = viewingList.length > 0 ? viewingList : items;
  const readerIndex = selectedItem ? readerItems.findIndex((i) => i.id === selectedItem.id) : -1;
  const hasPrevReader = readerIndex > 0;
  const hasNextReader = readerIndex !== -1 && readerIndex < readerItems.length - 1;
  const activeVote = selectedItem ? getArticleVote(preferences, selectedItem.id) : null;
  const voteDirection: "hot" | "not" | null =
    activeVote === "up" ? "hot" : activeVote === "down" ? "not" : null;

  const readerToolbar = selectedItem
    ? {
        hasPrev: hasPrevReader,
        hasNext: hasNextReader,
        currentIndex: readerIndex,
        totalItems: readerItems.length,
        onPrev: () => {
          if (hasPrevReader) {
            setIsReaderIframeView(false);
            setSelectedItem(readerItems[readerIndex - 1]);
          }
        },
        onNext: () => {
          if (hasNextReader) {
            setIsReaderIframeView(false);
            setSelectedItem(readerItems[readerIndex + 1]);
          }
        },
        vote: voteDirection,
        onVote: (direction: "hot" | "not") => {
          handleRateCard(selectedItem, direction);
        },
        isFollowed: Boolean(selectedItem.is_followed),
        onToggleFollow: () => {
          handleToggleFollowStory(selectedItem.story_id || selectedItem.id);
        },
        isRead: Boolean(selectedItem.is_read),
        onToggleRead: () => {
          const nextRead = !selectedItem.is_read;
          handleMarkRead(selectedItem.id, nextRead);
          setSelectedItem((prev) => (prev ? { ...prev, is_read: nextRead } : prev));
          setViewingList((prevList) =>
            prevList.map((i) => (i.id === selectedItem.id ? { ...i, is_read: nextRead } : i))
          );
        },
        directUrl: selectedItem.canonical_url || selectedItem.source_url,
        rssUrl: selectedItem.source_feed_url || (selectedItem.source_type === "rss" ? selectedItem.source_url : null),
        clusterCount: selectedItem.child_articles?.length || 0,
        onScrollToClusters: () => {
          setIsReaderIframeView(false);
          const el = document.getElementById("reader-clusters");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        onClose: () => {
          setIsReaderIframeView(false);
          setSelectedItem(null);
        },
      }
    : undefined;

  return (
    <div className="valet-root">
      {/* Top Application Header */}
      <AppHeader
        view={selectedItem ? "reader" : view}
        onViewChange={(newView) => {
          setIsReaderIframeView(false);
          setSelectedItem(null);
          setView(newView);
        }}
        isSettingsDrawerOpen={isSettingsDrawerOpen}
        onToggleDrawer={() => window.dispatchEvent(new CustomEvent("valet-toggle-drawer"))}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        breadcrumb={getSettingsBreadcrumb(settingsTab)}
        onCloseMobilePage={() => window.dispatchEvent(new CustomEvent("valet-open-drawer"))}
        readerToolbar={readerToolbar}
      />

      {/* Main Experience View */}
      <div className="experience-container">
        {selectedItem ? (
          <ReaderPage
            item={selectedItem}
            items={readerItems}
            preferences={preferences}
            onClose={() => {
              setIsReaderIframeView(false);
              setSelectedItem(null);
            }}
            onSelectItem={(it) => {
              setIsReaderIframeView(false);
              setSelectedItem(it);
            }}
            onMarkRead={(id, isRead) => handleMarkRead(id, isRead)}
            onToggleFollowStory={handleToggleFollowStory}
            onRate={handleRateCard}
            onFilterBySource={(sourceName) => {
              setIsReaderIframeView(false);
              setSelectedItem(null);
              handleNavigateToFeedWithTag(sourceName, "source");
            }}
            isIframeView={isReaderIframeView}
            onToggleIframeView={setIsReaderIframeView}
          />
        ) : view === "feed" ? (
          <FeedView
            items={items}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onSelectItem={handleSelectItem}
            onMarkRead={handleMarkRead}
            activeMode={feedMode}
            onChangeMode={setFeedMode}
            onOpenSettings={() => setView("command")}
            initialTagFilter={externalFeedTag}
            onRefreshItems={fetchItems}
          />
        ) : (
          <Suspense
            fallback={
              <div className="view-loading-fallback">
                <span className="disc-spinner" />
                <span>Loading Command Center…</span>
              </div>
            }
          >
            <CommandCenter
              activeTab={settingsTab}
              onSelectTab={setSettingsTab}
              sources={sources}
              items={items}
              telemetry={telemetry}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              onRefreshSources={fetchSources}
              onRefreshItems={fetchItems}
              onRefreshTelemetry={fetchTelemetry}
              onTriggerGatherer={triggerGatherer}
              onNavigateToFeedWithTag={handleNavigateToFeedWithTag}
              onSelectItem={(it) => handleSelectItem(it)}
            />
          </Suspense>
        )}
      </div>

      {/* Token Consumption & Cost Estimator Modal */}
      <TokenCostModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />
    </div>
  );
}
