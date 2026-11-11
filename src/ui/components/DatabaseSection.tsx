import React, { useState, useEffect, useRef } from "react";
import type { HydratedContentRecord } from "../../db/schema";
import { BotAvatar } from "./common/BotAvatar";
import { AGENT_BOTS, type AgentId } from "../utils/agents";
import { formatHumanAge } from "../utils/time";
import { useToast } from "../context/ToastContext";
import { PipelineControlBar } from "./database/PipelineControlBar";
import { PipelineTableRow } from "./database/PipelineTableRow";
import { PipelineStageHeaderMenu } from "./database/PipelineStageHeaderMenu";

interface DatabaseSectionProps {
  items: HydratedContentRecord[];
  onRefreshItems: () => Promise<void>;
  initialAction?: "recluster" | "recurate" | "reread" | null;
  onClearAction?: () => void;
  onSelectItem?: (item: HydratedContentRecord) => void;
  viewMode?: "items" | "queue";
}

interface AgentVersions {
  reader: { version: string; prompt: string };
  organiser: { version: string; prompt: string };
  curator: { version: string; prompt: string };
}

type MainFilterMode = "all" | "issues";
type StageFilterValue = "all" | "problems" | "problems_old";

interface StageFilters {
  reader: StageFilterValue;
  organiser: StageFilterValue;
  curator: StageFilterValue;
}

export function DatabaseSection({
  items,
  onRefreshItems,
  initialAction = null,
  onClearAction,
  onSelectItem,
  viewMode = "items",
}: DatabaseSectionProps) {
  const toast = useToast();
  // Library items: directly fetches full library view (including all raw articles)
  const [libraryItems, setLibraryItems] = useState<HydratedContentRecord[]>(items);

  // Filters row: JUST [All] and [Issues]
  const [mainFilter, setMainFilter] = useState<MainFilterMode>("all");

  // Per-bot header filter dropdowns (All / Problems only / Problems & old)
  const [stageFilters, setStageFilters] = useState<StageFilters>({
    reader: "all",
    organiser: "all",
    curator: "all",
  });

  // Active popup menu on bot column header (reader | organiser | curator | null)
  const [activeBotMenu, setActiveBotMenu] = useState<AgentId | null>(null);

  // Optimistic tracking for individual article stage reruns (e.g. key: "185_reader")
  const [runningItemStages, setRunningItemStages] = useState<Record<string, boolean>>({});

  // Queue transition states: map of itemId -> "finishing" | "exiting"
  const [finishingMap, setFinishingMap] = useState<Record<number, "finishing" | "exiting">>({});
  const prevItemsRef = useRef<Record<number, string>>({});

  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [processingAction, setProcessingAction] = useState<AgentId | null>(null);
  const [versions, setVersions] = useState<AgentVersions | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Fetch full library items
  const fetchLibraryItems = async () => {
    try {
      const res = await fetch("/api/content?view=library");
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        setLibraryItems(data.items);
      }
    } catch { }
  };

  useEffect(() => {
    fetchLibraryItems();
  }, []);

  // Sync if prop items updates
  useEffect(() => {
    if (items.length > 0 && libraryItems.length === 0) {
      setLibraryItems(items);
    }
  }, [items]);

  // Fetch current prompt versions
  const fetchVersions = async () => {
    try {
      const res = await fetch("/api/agent/versions");
      const data = await res.json();
      if (data && data.reader) {
        setVersions(data);
      }
    } catch { }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  // Click outside listener for bot header popups
  useEffect(() => {
    if (!activeBotMenu) return;
    const handleWindowClick = () => setActiveBotMenu(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [activeBotMenu]);

  // Handle auto-triggered action from other agent maintenance pages
  useEffect(() => {
    if (!initialAction) return;
    if (initialAction === "recluster") {
      handleReprocessOrganiser(false);
    } else if (initialAction === "recurate") {
      handleReprocessCurator(false);
    } else if (initialAction === "reread") {
      handleReprocessReader(false);
    }
    onClearAction?.();
  }, [initialAction]);

  // Real-time polling while background processing is active
  useEffect(() => {
    if (!isProcessingAll && !processingAction) return;
    const interval = setInterval(() => {
      onRefreshItems();
      fetchLibraryItems();
      fetchVersions();
    }, 1400);
    return () => clearInterval(interval);
  }, [isProcessingAll, processingAction]);

  const currentReaderVer = versions?.reader?.version || "v1";
  const currentOrganiserVer = versions?.organiser?.version || "v1";
  const currentCuratorVer = versions?.curator?.version || "v1";

  // Dependency evaluation:
  // Reader: checks reader prompt version
  const isReaderCurrent = (item: HydratedContentRecord) =>
    item.reader_status === "completed" && item.reader_version === currentReaderVer;
  const isReaderOutdated = (item: HydratedContentRecord) =>
    item.reader_status === "completed" && item.reader_version !== currentReaderVer;
  const isReaderFailed = (item: HydratedContentRecord) =>
    item.status === "failed" || item.reader_status === "failed";
  const isReaderNew = (item: HydratedContentRecord) =>
    item.status === "pending" || !item.reader_version;

  // Organiser: depends on Organiser prompt AND Reader being current!
  const isOrganiserCurrent = (item: HydratedContentRecord) =>
    Boolean(item.story_id) &&
    item.organiser_status === "completed" &&
    item.organiser_version === currentOrganiserVer &&
    isReaderCurrent(item);
  const isOrganiserDiminished = (item: HydratedContentRecord) =>
    Boolean(item.story_id) &&
    !isOrganiserCurrent(item) &&
    item.organiser_status !== "failed";
  const isOrganiserFailed = (item: HydratedContentRecord) =>
    item.organiser_status === "failed";
  const isOrganiserNew = (item: HydratedContentRecord) => !item.story_id;

  // Curator: depends on Curator prompt AND Reader AND Organiser!
  const isCuratorCurrent = (item: HydratedContentRecord) =>
    Boolean(item.curated_shelf || item.curator_status === "completed") &&
    item.curator_version === currentCuratorVer &&
    isReaderCurrent(item) &&
    isOrganiserCurrent(item);
  const isCuratorDiminished = (item: HydratedContentRecord) =>
    Boolean(item.curated_shelf || item.curator_status === "completed") &&
    !isCuratorCurrent(item) &&
    item.curator_status !== "failed";
  const isCuratorFailed = (item: HydratedContentRecord) =>
    item.curator_status === "failed";
  const isCuratorNew = (item: HydratedContentRecord) =>
    !item.curated_shelf && item.curator_status !== "completed";

  // Total Pipeline Status
  const isFullyUpToDate = (item: HydratedContentRecord) =>
    isReaderCurrent(item) && isOrganiserCurrent(item) && isCuratorCurrent(item);

  const isItemAnIssue = (item: HydratedContentRecord) =>
    !isFullyUpToDate(item) ||
    isReaderFailed(item) ||
    isOrganiserFailed(item) ||
    isCuratorFailed(item) ||
    isReaderOutdated(item) ||
    isOrganiserDiminished(item) ||
    isCuratorDiminished(item);

  // Counts for main filter tabs
  const totalCount = libraryItems.length;
  const issuesCount = libraryItems.filter(isItemAnIssue).length;

  // Counts for per-bot header dropdown filters (All, Problems only, Problems & old)
  const readerCounts = {
    all: totalCount,
    problems: libraryItems.filter((i) => isReaderFailed(i) || isReaderNew(i)).length,
    problemsOld: libraryItems.filter(
      (i) => isReaderFailed(i) || isReaderNew(i) || isReaderOutdated(i)
    ).length,
  };

  const organiserCounts = {
    all: totalCount,
    problems: libraryItems.filter((i) => isOrganiserFailed(i) || isOrganiserNew(i)).length,
    problemsOld: libraryItems.filter(
      (i) => isOrganiserFailed(i) || isOrganiserNew(i) || isOrganiserDiminished(i)
    ).length,
  };

  const curatorCounts = {
    all: totalCount,
    problems: libraryItems.filter((i) => isCuratorFailed(i) || isCuratorNew(i)).length,
    problemsOld: libraryItems.filter(
      (i) => isCuratorFailed(i) || isCuratorNew(i) || isCuratorDiminished(i)
    ).length,
  };

  // Master action: Refresh issues / Rerun all
  const handleProcessEverything = async (forceAll = false) => {
    setIsProcessingAll(true);
    setActionFeedback(
      forceAll
        ? "Rerunning all agents across entire library..."
        : "Refreshing all library issues..."
    );
    try {
      const res = await fetch("/api/library/process-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceAll }),
      });
      const data = await res.json();
      await onRefreshItems();
      await fetchLibraryItems();
      await fetchVersions();
      setActionFeedback(
        `✓ Library updated! Queued ${data.readerOutdatedQueued} items, clustered ${data.clusterStats?.storiesCount || 0} stories, curated ${data.curatorStats?.shelves?.length || 0} shelves.`
      );
    } catch {
      setActionFeedback("Failed to complete processing.");
    } finally {
      setIsProcessingAll(false);
    }
  };

  // Bot action: Reader
  const handleReprocessReader = async (forceAll = false) => {
    setProcessingAction("reader");
    setActionFeedback(
      forceAll
        ? `${AGENT_BOTS.reader.name}: Rerunning all articles...`
        : `${AGENT_BOTS.reader.name}: Refreshing issues...`
    );
    try {
      await fetch("/api/library/reprocess-reader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceAll, onlyOutdated: !forceAll }),
      });
      await onRefreshItems();
      await fetchLibraryItems();
      await fetchVersions();
      setActionFeedback(`✓ ${AGENT_BOTS.reader.name}: Processing queued articles.`);
    } catch {
      setActionFeedback(`Failed to run ${AGENT_BOTS.reader.name}.`);
    } finally {
      setProcessingAction(null);
    }
  };

  // Bot action: Organiser
  const handleReprocessOrganiser = async (forceAll = false) => {
    setProcessingAction("organiser");
    setActionFeedback(
      forceAll
        ? `${AGENT_BOTS.organiser.name}: Rerunning all stories...`
        : `${AGENT_BOTS.organiser.name}: Refreshing issues...`
    );
    try {
      const res = await fetch("/api/library/reprocess-organiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceAll }),
      });
      const data = await res.json();
      await onRefreshItems();
      await fetchLibraryItems();
      await fetchVersions();
      setActionFeedback(`✓ ${AGENT_BOTS.organiser.name}: Clustered ${data.stats?.storiesCount || 0} stories.`);
    } catch {
      setActionFeedback(`Failed to run ${AGENT_BOTS.organiser.name}.`);
    } finally {
      setProcessingAction(null);
    }
  };

  // Bot action: Curator
  const handleReprocessCurator = async (forceAll = false) => {
    setProcessingAction("curator");
    setActionFeedback(
      forceAll
        ? `${AGENT_BOTS.curator.name}: Rerunning taxonomy across all articles...`
        : `${AGENT_BOTS.curator.name}: Refreshing uncurated shelves...`
    );
    try {
      const res = await fetch("/api/library/reprocess-curator", { method: "POST" });
      const data = await res.json();
      await onRefreshItems();
      await fetchLibraryItems();
      await fetchVersions();
      setActionFeedback(`✓ ${AGENT_BOTS.curator.name}: Curated ${data.result?.shelves?.length || 0} shelves.`);
    } catch {
      setActionFeedback(`Failed to run ${AGENT_BOTS.curator.name}.`);
    } finally {
      setProcessingAction(null);
    }
  };

  // Re-run an individual agent bot stage on a single article item
  const handleRerunItemStage = async (id: number, stage: AgentId) => {
    const key = `${id}_${stage}`;
    setRunningItemStages((prev) => ({ ...prev, [key]: true }));
    setActionFeedback(`Queued ${AGENT_BOTS[stage].name} on article #${id}...`);

    try {
      const res = await fetch("/api/library/rerun-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: id, stage }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to rerun stage");
      }
      await onRefreshItems();
      await fetchLibraryItems();
      await fetchVersions();
      setActionFeedback(`✓ Ran ${AGENT_BOTS[stage].name} on article #${id}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionFeedback(`Error running ${AGENT_BOTS[stage].name} on #${id}: ${msg}`);
    } finally {
      setRunningItemStages((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Single article run
  const handleReprocessItem = async (id: number) => {
    try {
      setActionFeedback(`Queueing article #${id} for reprocessing...`);
      await fetch(`/api/content/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      });
      await onRefreshItems();
      await fetchLibraryItems();
      setActionFeedback(`✓ Queued article #${id}.`);
    } catch { }
  };

  // Gracefully stop processing an article (or cancel queued status)
  const handleStopItem = async (id: number) => {
    try {
      setActionFeedback(`Stopping processing for article #${id}...`);
      const res = await fetch("/api/library/stop-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: id }),
      });
      if (!res.ok) throw new Error("Failed to stop item");
      // Clear any local optimistic running state
      setRunningItemStages((prev) => {
        const next = { ...prev };
        delete next[`${id}_reader`];
        delete next[`${id}_organiser`];
        delete next[`${id}_curator`];
        return next;
      });
      await onRefreshItems();
      await fetchLibraryItems();
      setActionFeedback(`✓ Stopped processing article #${id}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionFeedback(`Error stopping article #${id}: ${msg}`);
    }
  };

  // Gracefully stop all active and queued items
  const handleStopAll = async () => {
    if (!confirm("Stop and cancel all queued and processing articles?")) return;
    try {
      setActionFeedback("Stopping all queued articles...");
      const res = await fetch("/api/library/stop-all", { method: "POST" });
      if (!res.ok) throw new Error("Failed to stop queue");
      const data = await res.json();
      setRunningItemStages({});
      await onRefreshItems();
      await fetchLibraryItems();
      setActionFeedback(`✓ Stopped ${data.stoppedCount} queued items.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionFeedback(`Error stopping queue: ${msg}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete record #${id} and its vector embedding?`)) return;
    try {
      const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      await onRefreshItems();
      await fetchLibraryItems();
      toast.success(`Record #${id} deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting record");
    }
  };

  // Helper: Is an item actively executing on any stage?
  const isItemRunning = (item: HydratedContentRecord): boolean => {
    return (
      item.status === "processing" ||
      item.reader_status === "processing" ||
      item.organiser_status === "processing" ||
      item.curator_status === "processing" ||
      Boolean(
        runningItemStages[`${item.id}_reader`] ||
        runningItemStages[`${item.id}_organiser`] ||
        runningItemStages[`${item.id}_curator`]
      )
    );
  };

  // Helper: Is an item waiting in queue to be picked up?
  const isItemQueued = (item: HydratedContentRecord): boolean => {
    if (isItemRunning(item)) return false;
    if (item.status === "pending" || item.reader_status === "pending") return true;
    if (item.reader_status === "completed" && item.organiser_status === "pending") return true;
    if (item.organiser_status === "completed" && item.curator_status === "pending") return true;
    return false;
  };

  // Helper: Which stage is next to run on this article?
  const getNextStageToRun = (item: HydratedContentRecord): AgentId | null => {
    if (item.reader_status === "processing" || Boolean(runningItemStages[`${item.id}_reader`])) return "reader";
    if (item.organiser_status === "processing" || Boolean(runningItemStages[`${item.id}_organiser`])) return "organiser";
    if (item.curator_status === "processing" || Boolean(runningItemStages[`${item.id}_curator`])) return "curator";

    if (
      isReaderNew(item) ||
      isReaderOutdated(item) ||
      isReaderFailed(item) ||
      item.status === "pending" ||
      item.reader_status === "pending"
    ) {
      return "reader";
    }
    if (
      isOrganiserDiminished(item) ||
      isOrganiserFailed(item) ||
      item.organiser_status === "pending"
    ) {
      return "organiser";
    }
    if (
      isCuratorDiminished(item) ||
      isCuratorFailed(item) ||
      item.curator_status === "pending"
    ) {
      return "curator";
    }
    return null;
  };

  // Queue transition effect: when an item in queue finishes, celebrate then animate away
  useEffect(() => {
    if (viewMode !== "queue") return;

    libraryItems.forEach((item) => {
      const prevStatus = prevItemsRef.current[item.id];
      const isNowCompleted =
        item.status === "completed" &&
        item.reader_status === "completed" &&
        item.organiser_status === "completed" &&
        item.curator_status === "completed";

      if (
        (prevStatus === "pending" || prevStatus === "processing") &&
        isNowCompleted &&
        !finishingMap[item.id]
      ) {
        // Step 1: Mark as finishing (visible green completed celebration)
        setFinishingMap((prev) => ({ ...prev, [item.id]: "finishing" }));

        // Step 2: After 1400ms, start exit animation
        setTimeout(() => {
          setFinishingMap((prev) => ({ ...prev, [item.id]: "exiting" }));

          // Step 3: After 450ms animation, remove from map to let subsequent items slide up
          setTimeout(() => {
            setFinishingMap((prev) => {
              const next = { ...prev };
              delete next[item.id];
              return next;
            });
          }, 450);
        }, 1400);
      }

      prevItemsRef.current[item.id] = item.status;
    });
  }, [libraryItems, viewMode, finishingMap]);

  // Compute queue counts
  const runningCount = libraryItems.filter(isItemRunning).length;
  const queuedCount = libraryItems.filter(isItemQueued).length;

  // Filter & sort items according to view mode
  const filteredItems = viewMode === "queue"
    ? libraryItems
        .filter((item) => isItemRunning(item) || isItemQueued(item) || finishingMap[item.id])
        .sort((a, b) => {
          const aRunning = isItemRunning(a);
          const bRunning = isItemRunning(b);
          if (aRunning && !bRunning) return -1;
          if (!aRunning && bRunning) return 1;

          const aFinishing = Boolean(finishingMap[a.id]);
          const bFinishing = Boolean(finishingMap[b.id]);
          if (aFinishing && !bFinishing) return -1;
          if (!aFinishing && bFinishing) return 1;

          // Both running or both queued: sort by ID ascending (execution order)
          return a.id - b.id;
        })
    : libraryItems.filter((item) => {
        if (mainFilter === "issues" && !isItemAnIssue(item)) return false;

        // Reader stage filter
        if (
          stageFilters.reader === "problems" &&
          !(isReaderFailed(item) || isReaderNew(item))
        ) {
          return false;
        }
        if (
          stageFilters.reader === "problems_old" &&
          !(isReaderFailed(item) || isReaderNew(item) || isReaderOutdated(item))
        ) {
          return false;
        }

        // Organiser stage filter
        if (
          stageFilters.organiser === "problems" &&
          !(isOrganiserFailed(item) || isOrganiserNew(item))
        ) {
          return false;
        }
        if (
          stageFilters.organiser === "problems_old" &&
          !(isOrganiserFailed(item) || isOrganiserNew(item) || isOrganiserDiminished(item))
        ) {
          return false;
        }

        // Curator stage filter
        if (
          stageFilters.curator === "problems" &&
          !(isCuratorFailed(item) || isCuratorNew(item))
        ) {
          return false;
        }
        if (
          stageFilters.curator === "problems_old" &&
          !(isCuratorFailed(item) || isCuratorNew(item) || isCuratorDiminished(item))
        ) {
          return false;
        }

        return true;
      });

  return (
    <div className="database-section admin-pane library-management-pane">
      <PipelineControlBar
        viewMode={viewMode}
        totalCount={totalCount}
        runningCount={runningCount}
        queuedCount={queuedCount}
        issuesCount={issuesCount}
        mainFilter={mainFilter}
        onSetMainFilter={setMainFilter}
        onStopAll={handleStopAll}
        onProcessEverything={handleProcessEverything}
        isProcessingAll={isProcessingAll}
        processingAction={processingAction}
      />

      {actionFeedback && (
        <div className="library-feedback-banner">
          <span>{actionFeedback}</span>
          <button
            type="button"
            className="feedback-dismiss-btn"
            onClick={() => setActionFeedback(null)}
            aria-label="Dismiss feedback"
          >
            ✕
          </button>
        </div>
      )}

      {/* Library Pipeline Table */}
      <div className="table-wrapper library-table-wrapper">
        <table className="admin-table library-pipeline-table">
          <thead>
            <tr>
              {/* Merged ID, Article & Source Column */}
              <th className="merged-article-header">
                <span className="header-label">ID, Article & Source</span>
              </th>

              {/* Bot 1: Reader */}
              <PipelineStageHeaderMenu
                botKey="reader"
                activeBotMenu={activeBotMenu}
                onToggleBotMenu={setActiveBotMenu}
                stageFilter={stageFilters.reader}
                onSelectStageFilter={(filter) =>
                  setStageFilters((prev) => ({ ...prev, reader: filter }))
                }
                counts={readerCounts}
                cleanActionLabel="Clean issues"
                forceActionLabel="Force rerun all"
                onReprocessClean={() => handleReprocessReader(false)}
                onReprocessForce={() => handleReprocessReader(true)}
                isProcessing={isProcessingAll || processingAction === "reader"}
              />

              {/* Bot 2: Organiser */}
              <PipelineStageHeaderMenu
                botKey="organiser"
                activeBotMenu={activeBotMenu}
                onToggleBotMenu={setActiveBotMenu}
                stageFilter={stageFilters.organiser}
                onSelectStageFilter={(filter) =>
                  setStageFilters((prev) => ({ ...prev, organiser: filter }))
                }
                counts={organiserCounts}
                cleanActionLabel="Clean issues"
                forceActionLabel="Force re-cluster all"
                onReprocessClean={() => handleReprocessOrganiser(false)}
                onReprocessForce={() => handleReprocessOrganiser(true)}
                isProcessing={isProcessingAll || processingAction === "organiser"}
              />

              {/* Bot 3: Curator */}
              <PipelineStageHeaderMenu
                botKey="curator"
                activeBotMenu={activeBotMenu}
                onToggleBotMenu={setActiveBotMenu}
                stageFilter={stageFilters.curator}
                onSelectStageFilter={(filter) =>
                  setStageFilters((prev) => ({ ...prev, curator: filter }))
                }
                counts={curatorCounts}
                cleanActionLabel="Clean issues"
                forceActionLabel="Force re-curate all"
                onReprocessClean={() => handleReprocessCurator(false)}
                onReprocessForce={() => handleReprocessCurator(true)}
                isProcessing={isProcessingAll || processingAction === "curator"}
              />

              {/* Single Checkmark Pipeline Status */}
              <th style={{ width: "68px", textAlign: "center" }}>
                <span className="header-label">Status</span>
              </th>

              {/* Clean Icon Actions */}
              <th style={{ width: "74px", textAlign: "center" }}>
                <span className="header-label">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted text-center" style={{ padding: "3rem" }}>
                  {viewMode === "queue" ? (
                    <div className="queue-empty-state">
                      <span className="empty-state-icon" style={{ fontSize: "1.75rem", display: "block", marginBottom: "0.5rem" }}>✓</span>
                      <strong>Execution queue is empty</strong>
                      <p style={{ marginTop: "0.25rem", color: "var(--color-foreground-muted)", fontSize: "0.85rem" }}>
                        No articles are currently running or awaiting processing.
                      </p>
                    </div>
                  ) : mainFilter === "issues" ? (
                    "✓ No issues found! All articles are fully up to date."
                  ) : (
                    "No articles found in the library."
                  )}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const readerCurrent = isReaderCurrent(item);
                const readerOutdated = isReaderOutdated(item);
                const readerFailed = isReaderFailed(item);

                const organiserCurrent = isOrganiserCurrent(item);
                const organiserDiminished = isOrganiserDiminished(item);
                const organiserFailed = isOrganiserFailed(item);

                const curatorCurrent = isCuratorCurrent(item);
                const curatorDiminished = isCuratorDiminished(item);
                const curatorFailed = isCuratorFailed(item);

                const isItemActive = isItemRunning(item);
                const isItemWaiting = isItemQueued(item);
                const isProcessingOrQueued = isItemActive || isItemWaiting;
                const nextStage = getNextStageToRun(item);
                const isFinishing = finishingMap[item.id] === "finishing";
                const isExiting = finishingMap[item.id] === "exiting";

                // Spinner state: when a bot is actively processing an article
                const isReaderRunning =
                  item.reader_status === "processing" ||
                  (item.status === "processing" && item.reader_status !== "completed") ||
                  (processingAction === "reader" && (readerFailed || readerOutdated || item.status === "pending"));

                const isOrganiserRunning =
                  item.organiser_status === "processing" ||
                  (processingAction === "organiser" && organiserDiminished);

                const isCuratorRunning =
                  item.curator_status === "processing" ||
                  (processingAction === "curator" && curatorDiminished);

                const isReaderActive =
                  isReaderRunning || Boolean(runningItemStages[`${item.id}_reader`]);
                const isOrganiserActive =
                  isOrganiserRunning || Boolean(runningItemStages[`${item.id}_organiser`]);
                const isCuratorActive =
                  isCuratorRunning || Boolean(runningItemStages[`${item.id}_curator`]);

                const isReaderWaiting = isItemWaiting && nextStage === "reader";
                const isOrganiserWaiting = isItemWaiting && nextStage === "organiser";
                const isCuratorWaiting = isItemWaiting && nextStage === "curator";

                const isAnyRunning =
                  isItemActive ||
                  isReaderActive ||
                  isOrganiserActive ||
                  isCuratorActive;

                const allCurrent = readerCurrent && organiserCurrent && curatorCurrent;
                const hasFailure = readerFailed || organiserFailed || curatorFailed;

                return (
                  <PipelineTableRow
                    key={item.id}
                    item={item}
                    isFinishing={isFinishing}
                    isExiting={isExiting}
                    isItemWaiting={isItemWaiting}
                    isItemActive={isItemActive}
                    isProcessingOrQueued={isProcessingOrQueued}
                    isReaderActive={isReaderActive}
                    isReaderWaiting={isReaderWaiting}
                    readerFailed={readerFailed}
                    readerCurrent={readerCurrent}
                    readerOutdated={readerOutdated}
                    isOrganiserActive={isOrganiserActive}
                    isOrganiserWaiting={isOrganiserWaiting}
                    organiserFailed={organiserFailed}
                    organiserCurrent={organiserCurrent}
                    organiserDiminished={organiserDiminished}
                    isCuratorActive={isCuratorActive}
                    isCuratorWaiting={isCuratorWaiting}
                    curatorFailed={curatorFailed}
                    curatorCurrent={curatorCurrent}
                    curatorDiminished={curatorDiminished}
                    onSelectItem={onSelectItem}
                    onRerunStage={handleRerunItemStage}
                    onStopItem={handleStopItem}
                    onReprocessItem={handleReprocessItem}
                    onDeleteItem={handleDelete}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
