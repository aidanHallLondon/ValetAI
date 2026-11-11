import React, { useState, useEffect, useRef, useCallback } from "react";
import type { SourceRecord, HydratedContentRecord } from "../../db/schema";
import { CONFIG } from "../../config";
import { formatHumanAge } from "../utils/time";
import {
  TagPreferencesState,
  DEFAULT_PREFERENCES,
  getTokenWeight,
  normalizeTagKey,
  VotedVector,
} from "../utils/algorithm";
import { SourceItemRow } from "./sources/SourceItemRow";
import { SuggestedSourceRow } from "./sources/SuggestedSourceRow";
import { useToast } from "../context/ToastContext";

interface GathererSectionProps {
  sources: SourceRecord[];
  items?: HydratedContentRecord[];
  onRefreshSources: () => Promise<void>;
  onTriggerRestart: () => Promise<void>;
  onNavigateToDb?: () => void;
  preferences?: TagPreferencesState;
  onUpdatePreferences?: (newPrefs: TagPreferencesState) => void;
  onNavigateToFeedWithTag?: (
    sourceName: string,
    type: "source" | "category" | "entity",
    filterMode?: "all" | "unread"
  ) => void;
  onNavigateToTags?: (sourceName: string) => void;
}

export interface SuggestedSource {
  id: string;
  name: string;
  url: string;
  site_url?: string;
  type: string;
  description: string;
  category: string;
  matchReason: string;
  suitabilityScore: number;
}

interface ActiveDragState {
  draggedId: number;
  startIndex: number;
  currentIndex: number;
  startY: number;
  offsetY: number;
  initialRowHeight: number;
}

/**
 * Ensures weights are strictly descending for the given order:
 * w(order[0]) > w(order[1]) > ... > w(order[N-1])
 * Guarantees no two sources ever have the same weight.
 */
function ensureStrictlyDescendingWeights(
  order: number[],
  weights: Record<number, number>
): Record<number, number> {
  const result = { ...weights };
  const N = order.length;
  if (N <= 1) return result;

  for (let i = 1; i < N; i++) {
    const prevId = order[i - 1];
    const currId = order[i];
    const prevW = result[prevId] ?? (N - (i - 1));
    const currW = result[currId] ?? (N - i);
    if (currW >= prevW) {
      result[currId] = prevW - 1;
    }
  }

  return result;
}

/**
 * Initializes order and unique descending weights from sources and existing preferences.
 * By default: top source #1 has weight N, counting down to 1 for the lowest.
 */
function computeInitialOrderAndWeights(
  sourcesList: SourceRecord[],
  preferences?: TagPreferencesState
): { order: number[]; weights: Record<number, number> } {
  const N = sourcesList.length;
  if (N === 0) return { order: [], weights: {} };

  const existingWList = sourcesList.map((s) => {
    const sKey = normalizeTagKey(s.name);
    const w = preferences?.tokenWeights?.[sKey] ?? preferences?.tagTemperatures?.[sKey];
    return { id: s.id, weight: typeof w === "number" ? w : null };
  });

  const hasAnyPreference = existingWList.some((item) => item.weight !== null && item.weight !== 0);

  let sortedSources: SourceRecord[];
  if (hasAnyPreference) {
    sortedSources = [...sourcesList].sort((a, b) => {
      const sKeyA = normalizeTagKey(a.name);
      const sKeyB = normalizeTagKey(b.name);
      const wA = preferences?.tokenWeights?.[sKeyA] ?? preferences?.tagTemperatures?.[sKeyA] ?? 0;
      const wB = preferences?.tokenWeights?.[sKeyB] ?? preferences?.tagTemperatures?.[sKeyB] ?? 0;
      if (wB !== wA) return wB - wA;
      return a.id - b.id;
    });
  } else {
    sortedSources = [...sourcesList];
  }

  const order = sortedSources.map((s) => s.id);
  const weights: Record<number, number> = {};

  if (hasAnyPreference) {
    order.forEach((id, idx) => {
      const s = sourcesList.find((src) => src.id === id);
      const sKey = s ? normalizeTagKey(s.name) : "";
      const w = preferences?.tokenWeights?.[sKey] ?? preferences?.tagTemperatures?.[sKey];
      weights[id] = typeof w === "number" ? w : N - idx;
    });
    const sanitized = ensureStrictlyDescendingWeights(order, weights);
    return { order, weights: sanitized };
  } else {
    order.forEach((id, idx) => {
      weights[id] = N - idx;
    });
    return { order, weights };
  }
}

/**
 * Syncs the unique weights to algorithm preferences for article scoring.
 */
function syncWeightsToPreferences(
  weights: Record<number, number>,
  sourcesList: SourceRecord[],
  prevPrefs?: TagPreferencesState,
  onUpdate?: (newPrefs: TagPreferencesState) => void
) {
  if (!onUpdate) return;
  const nextTokenWeights = { ...(prevPrefs?.tokenWeights || prevPrefs?.tagTemperatures || {}) };
  const nextVectors = { ...(prevPrefs?.votedVectors || {}) };

  Object.entries(weights).forEach(([idStr, w]) => {
    const sId = Number(idStr);
    const src = sourcesList.find((s) => s.id === sId);
    if (!src) return;
    const sKey = normalizeTagKey(src.name);
    nextTokenWeights[sKey] = w;
    nextVectors[sKey] = {
      id: sKey,
      tags: [sKey],
      weight: w,
      label: src.name,
      updatedAt: Date.now(),
    };
  });

  const nextPrefs: TagPreferencesState = {
    ...(prevPrefs || DEFAULT_PREFERENCES),
    tokenWeights: nextTokenWeights,
    tagTemperatures: nextTokenWeights,
    votedVectors: nextVectors,
  };
  onUpdate(nextPrefs);
}

function cleanSiteHostname(urlStr?: string | null): string {
  if (!urlStr) return "";
  try {
    const u = new URL(urlStr);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return urlStr.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

export function GathererSection({
  sources,
  items = [],
  onRefreshSources,
  onTriggerRestart,
  onNavigateToDb,
  preferences,
  onUpdatePreferences,
  onNavigateToFeedWithTag,
  onNavigateToTags,
}: GathererSectionProps) {
  const toast = useToast();
  // Modal toggle state for adding a source
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"web" | "rss" | "json">("web");
  const [description, setDescription] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Suggested Sources state
  const [suggestedSources, setSuggestedSources] = useState<SuggestedSource[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [addingSugId, setAddingSugId] = useState<string | null>(null);
  const [animatingSugId, setAnimatingSugId] = useState<string | null>(null);

  // Per-source refreshing state
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [globalHarvesting, setGlobalHarvesting] = useState(false);

  // Initial order & unique descending weights computation
  const initialDataRef = useRef<{ order: number[]; weights: Record<number, number> } | null>(null);
  if (!initialDataRef.current) {
    initialDataRef.current = computeInitialOrderAndWeights(sources, preferences);
  }

  // Active state
  const [orderedSourceIds, setOrderedSourceIds] = useState<number[]>(initialDataRef.current.order);
  const [sourceWeights, setSourceWeights] = useState<Record<number, number>>(initialDataRef.current.weights);

  // Active pointer drag state for real-time card motion
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const activeDragRef = useRef<ActiveDragState | null>(null);

  // Hysteresis refs: tracks target order & weights during rapid in-place clicks
  const targetOrderRef = useRef<number[]>(orderedSourceIds);
  const targetWeightsRef = useRef<Record<number, number>>(sourceWeights);
  const hysteresisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceRowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);

  // Ensure initial weights are synced to preferences
  useEffect(() => {
    if (sources.length > 0 && initialDataRef.current) {
      syncWeightsToPreferences(initialDataRef.current.weights, sources, preferences, onUpdatePreferences);
    }
  }, []);

  // Synchronize when sources are added/removed from parent
  useEffect(() => {
    const currentIdSet = new Set(orderedSourceIds);
    const incomingIds = sources.map((s) => s.id);
    const hasNew = incomingIds.some((id) => !currentIdSet.has(id));
    const hasRemoved = orderedSourceIds.some((id) => !incomingIds.includes(id));

    if (hasNew || hasRemoved) {
      const preserved = orderedSourceIds.filter((id) => incomingIds.includes(id));
      const newlyAdded = incomingIds.filter((id) => !currentIdSet.has(id));
      const nextOrder = [...preserved, ...newlyAdded];

      // New feeds go low down in the list
      const minCurrentWeight =
        preserved.length > 0
          ? Math.min(...preserved.map((id) => sourceWeights[id] ?? 1))
          : 1;

      const nextWeights = { ...sourceWeights };
      newlyAdded.forEach((id, idx) => {
        nextWeights[id] = minCurrentWeight - (idx + 1);
      });

      const sanitized = ensureStrictlyDescendingWeights(nextOrder, nextWeights);
      setOrderedSourceIds(nextOrder);
      setSourceWeights(sanitized);
      targetOrderRef.current = nextOrder;
      targetWeightsRef.current = sanitized;
      syncWeightsToPreferences(sanitized, sources, preferences, onUpdatePreferences);
    }
  }, [sources]);

  // Clean up hysteresis timer on unmount
  useEffect(() => {
    return () => {
      if (hysteresisTimerRef.current) {
        clearTimeout(hysteresisTimerRef.current);
      }
    };
  }, []);

  // Scroll into view & pulse animation for newly added feeds
  useEffect(() => {
    if (pendingScrollId) {
      const el = sourceRowRefs.current.get(pendingScrollId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("new-source-pulse");
        const timer = setTimeout(() => {
          el.classList.remove("new-source-pulse");
          setPendingScrollId(null);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [pendingScrollId, orderedSourceIds]);

  /**
   * Commits hysteresis reorder after the debounce window (650ms).
   * Runs FLIP animation so cards smoothly glide to their new positions.
   */
  const commitHysteresisReorder = useCallback(() => {
    if (hysteresisTimerRef.current) {
      clearTimeout(hysteresisTimerRef.current);
      hysteresisTimerRef.current = null;
    }

    const newOrder = [...targetOrderRef.current];
    const newWeights = { ...targetWeightsRef.current };

    // Persist new weights to algorithm preferences
    syncWeightsToPreferences(newWeights, sources, preferences, onUpdatePreferences);

    const orderChanged =
      newOrder.length !== orderedSourceIds.length ||
      newOrder.some((id, idx) => id !== orderedSourceIds[idx]);

    if (!orderChanged) return;

    // 1. FIRST: Record bounding box top positions
    const firstTops = new Map<number, number>();
    orderedSourceIds.forEach((id) => {
      const el = sourceRowRefs.current.get(id);
      if (el) firstTops.set(id, el.getBoundingClientRect().top);
    });

    // 2. State update
    setOrderedSourceIds(newOrder);

    // 3. LAST, INVERT, PLAY on next animation frame
    requestAnimationFrame(() => {
      newOrder.forEach((id) => {
        const el = sourceRowRefs.current.get(id);
        const firstTop = firstTops.get(id);
        if (el && firstTop !== undefined) {
          const lastTop = el.getBoundingClientRect().top;
          const deltaY = firstTop - lastTop;
          if (deltaY !== 0) {
            el.style.transform = `translateY(${deltaY}px)`;
            el.style.transition = "none";
            void el.offsetHeight; // Force layout reflow
            el.style.transition = "transform 0.45s cubic-bezier(0.2, 0.8, 0.25, 1)";
            el.style.transform = "translateY(0)";

            setTimeout(() => {
              if (el) {
                el.style.transform = "";
                el.style.transition = "";
              }
            }, 470);
          }
        }
      });
    });
  }, [orderedSourceIds, sources, preferences, onUpdatePreferences]);

  /**
   * Upvote: Moves source UP by ONE place only (or increments if at top).
   * Holds position during rapid clicking via 650ms hysteresis debounce.
   */
  const handleVoteUp = (sourceId: number) => {
    const currentOrder = [...targetOrderRef.current];
    const currentWeights = { ...targetWeightsRef.current };
    const n = currentOrder.indexOf(sourceId);
    if (n === -1) return;

    if (n === 0) {
      // Top element: increment weight
      currentWeights[sourceId] = (currentWeights[sourceId] ?? 1) + 1;
    } else {
      // Inbetween/bottom element: move up by ONE place only!
      // s(n).weight = s(n-1).weight
      // s(n-1).weight = s(n-1).weight - 1
      const prevId = currentOrder[n - 1];
      const prevWeight = currentWeights[prevId] ?? 1;
      currentWeights[sourceId] = prevWeight;
      currentWeights[prevId] = prevWeight - 1;

      // Swap in target order
      currentOrder[n - 1] = sourceId;
      currentOrder[n] = prevId;
    }

    const sanitizedWeights = ensureStrictlyDescendingWeights(currentOrder, currentWeights);
    targetOrderRef.current = currentOrder;
    targetWeightsRef.current = sanitizedWeights;

    // Instant visual feedback: weight badge and vote count update immediately!
    setSourceWeights(sanitizedWeights);

    // Debounce reordering with hysteresis (650ms)
    if (hysteresisTimerRef.current) {
      clearTimeout(hysteresisTimerRef.current);
    }
    hysteresisTimerRef.current = setTimeout(() => {
      commitHysteresisReorder();
    }, 650);
  };

  /**
   * Downvote: Moves source DOWN by ONE place only (or decrements if at bottom).
   * Holds position during rapid clicking via 650ms hysteresis debounce.
   */
  const handleVoteDown = (sourceId: number) => {
    const currentOrder = [...targetOrderRef.current];
    const currentWeights = { ...targetWeightsRef.current };
    const n = currentOrder.indexOf(sourceId);
    if (n === -1) return;

    const maxIndex = currentOrder.length - 1;
    if (n === maxIndex) {
      // Bottom element: decrement weight
      currentWeights[sourceId] = (currentWeights[sourceId] ?? 1) - 1;
    } else {
      // Inbetween/top element: move down by ONE place only!
      // s(n).weight = s(n+1).weight
      // s(n+1).weight = s(n+1).weight + 1
      const nextId = currentOrder[n + 1];
      const nextWeight = currentWeights[nextId] ?? 1;
      currentWeights[sourceId] = nextWeight;
      currentWeights[nextId] = nextWeight + 1;

      // Swap in target order
      currentOrder[n + 1] = sourceId;
      currentOrder[n] = nextId;
    }

    const sanitizedWeights = ensureStrictlyDescendingWeights(currentOrder, currentWeights);
    targetOrderRef.current = currentOrder;
    targetWeightsRef.current = sanitizedWeights;

    // Instant visual feedback: weight badge and vote count update immediately!
    setSourceWeights(sanitizedWeights);

    // Debounce reordering with hysteresis (650ms)
    if (hysteresisTimerRef.current) {
      clearTimeout(hysteresisTimerRef.current);
    }
    hysteresisTimerRef.current = setTimeout(() => {
      commitHysteresisReorder();
    }, 650);
  };

  /**
   * Pointer Drag & Drop:
   * Moves the actual card in real-time, other cards fluidly slide out of the way.
   */
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>, sourceId: number) => {
    if (e.button !== 0) return; // Only primary mouse button / touch

    // Flush any pending hysteresis votes
    if (hysteresisTimerRef.current) {
      clearTimeout(hysteresisTimerRef.current);
      commitHysteresisReorder();
    }

    const startIndex = orderedSourceIds.indexOf(sourceId);
    if (startIndex === -1) return;

    const rowEl = sourceRowRefs.current.get(sourceId);
    const rect = rowEl?.getBoundingClientRect();
    const rowHeight = (rect?.height || 64) + 12;

    const dragInfo: ActiveDragState = {
      draggedId: sourceId,
      startIndex,
      currentIndex: startIndex,
      startY: e.clientY,
      offsetY: 0,
      initialRowHeight: rowHeight,
    };

    activeDragRef.current = dragInfo;
    setActiveDrag(dragInfo);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragRef.current) return;
    const { startY, startIndex, initialRowHeight } = activeDragRef.current;
    const deltaY = e.clientY - startY;

    const slotShift = Math.round(deltaY / initialRowHeight);
    const targetIndex = Math.max(0, Math.min(orderedSourceIds.length - 1, startIndex + slotShift));

    const updated: ActiveDragState = {
      ...activeDragRef.current,
      offsetY: deltaY,
      currentIndex: targetIndex,
    };
    activeDragRef.current = updated;
    setActiveDrag(updated);
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const { startIndex, currentIndex } = activeDragRef.current;
    activeDragRef.current = null;
    setActiveDrag(null);

    if (startIndex === currentIndex) return;

    const newOrder = [...orderedSourceIds];
    const [moved] = newOrder.splice(startIndex, 1);
    newOrder.splice(currentIndex, 0, moved);

    // Reweight all sources: positive votes counting from 1 (lowest) up to N (#1)
    const N = newOrder.length;
    const newWeights: Record<number, number> = {};
    newOrder.forEach((id, idx) => {
      newWeights[id] = N - idx;
    });

    setOrderedSourceIds(newOrder);
    setSourceWeights(newWeights);
    targetOrderRef.current = newOrder;
    targetWeightsRef.current = newWeights;

    syncWeightsToPreferences(newWeights, sources, preferences, onUpdatePreferences);
  };

  /**
   * Automatically inspects the URL when blurred or submitted,
   * resolving the site title/name, format (RSS/Web/JSON), description, and site URL.
   */
  const handleInspectUrl = async (inputUrl: string) => {
    if (!inputUrl || !inputUrl.startsWith("http")) return;
    setIsInspecting(true);
    try {
      const res = await fetch(
        `/api/sources/inspect?url=${encodeURIComponent(inputUrl)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.name && !name) {
          setName(data.name);
        }
        if (data.type) {
          setType(data.type);
        }
        if (data.description && !description) {
          setDescription(data.description);
        }
        if (data.siteUrl && !siteUrl) {
          setSiteUrl(data.siteUrl);
        }
      }
    } catch {
      // Ignore inspection errors, let user fill manually
    } finally {
      setIsInspecting(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || url,
          url,
          type,
          description: description || undefined,
          site_url: siteUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add source");

      const createdSource: SourceRecord | undefined = data.source;
      if (createdSource) {
        setPendingScrollId(createdSource.id);
        const currentVals = Object.values(sourceWeights);
        const minWeight = currentVals.length > 0 ? Math.min(...currentVals) : 1;
        const initialNewWeight = minWeight - 1;

        const nextOrder = [...orderedSourceIds, createdSource.id];
        const nextWeights = {
          ...sourceWeights,
          [createdSource.id]: initialNewWeight,
        };

        setOrderedSourceIds(nextOrder);
        setSourceWeights(nextWeights);
        targetOrderRef.current = nextOrder;
        targetWeightsRef.current = nextWeights;

        syncWeightsToPreferences(nextWeights, [...sources, createdSource], preferences, onUpdatePreferences);
      }

      setName("");
      setUrl("");
      setType("web");
      setDescription("");
      setSiteUrl("");
      setIsAddModalOpen(false);
      await onRefreshSources();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Error saving source");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const res = await fetch("/api/sources/suggestions");
      if (res.ok) {
        const data = await res.json();
        setSuggestedSources(data.suggestions || []);
      }
    } catch (err) {
      console.error("Failed to load suggested sources:", err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions, sources]);

  const handleAddSuggestedSource = async (sug: SuggestedSource) => {
    if (addingSugId) return;
    setAddingSugId(sug.id);
    setAnimatingSugId(sug.id);

    try {
      // Trigger smooth upward exit animation
      await new Promise((r) => setTimeout(r, 220));

      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sug.name,
          url: sug.url,
          type: sug.type || "rss",
          description: sug.description,
          site_url: sug.site_url || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add source");

      const createdSource: SourceRecord | undefined = data.source;
      if (createdSource) {
        setPendingScrollId(createdSource.id);
        const currentVals = Object.values(sourceWeights);
        const minWeight = currentVals.length > 0 ? Math.min(...currentVals) : 1;
        const initialNewWeight = minWeight - 1;

        const nextOrder = [...orderedSourceIds, createdSource.id];
        const nextWeights = {
          ...sourceWeights,
          [createdSource.id]: initialNewWeight,
        };

        setOrderedSourceIds(nextOrder);
        setSourceWeights(nextWeights);
        targetOrderRef.current = nextOrder;
        targetWeightsRef.current = nextWeights;

        syncWeightsToPreferences(nextWeights, [...sources, createdSource], preferences, onUpdatePreferences);
      }

      setSuggestedSources((prev) => prev.filter((s) => s.id !== sug.id));
      await onRefreshSources();
      toast.success(`Source "${sug.name}" added to active sources`);
    } catch (err) {
      console.error("Failed to add suggested source:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add suggestion");
    } finally {
      setAddingSugId(null);
      setAnimatingSugId(null);
    }
  };

  const handleRefreshSingleSource = async (id: number) => {
    setRefreshingId(id);
    try {
      const res = await fetch(`/api/sources/${id}/refresh`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(`Refresh failed: ${data.error || "Unknown error"}`);
      } else {
        await onRefreshSources();
        toast.success("Source refreshed successfully");
      }
    } catch (err) {
      toast.error(`Refresh error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleTriggerGlobalHarvest = async () => {
    setGlobalHarvesting(true);
    try {
      await onTriggerRestart();
      await onRefreshSources();
    } finally {
      setGlobalHarvesting(false);
    }
  };

  const handleToggle = async (id: number) => {
    await fetch(`/api/sources/${id}/toggle`, { method: "PATCH" });
    await onRefreshSources();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this source?")) return;
    await fetch(`/api/sources/${id}`, { method: "DELETE" });
    await onRefreshSources();
  };

  return (
    <div className="gatherer-section admin-pane">
      {/* Top Header Strip: Sources title, PM2 Schedule, and Actions directly on background */}
      <div className="gatherer-header-strip">
        <div className="gatherer-header-text">
          <h3 className="sources-page-title">
            Sources <span className="sources-count-diminished">({sources.length})</span>
          </h3>
          <p className="muted">
            Managed feeds and web content for automatic ingestion • PM2 Schedule: <code>*/15 * * * *</code> (Runs strictly every 15 minutes and exits cleanly)
          </p>
        </div>
        <div className="sources-header-actions">
          {/* Global Refresh Button with unified secondary shape */}
          <button
            type="button"
            className="secondary-btn icon-header-btn"
            onClick={handleTriggerGlobalHarvest}
            disabled={globalHarvesting}
            title="Run full PM2 harvest"
            aria-label="Refresh All Sources"
          >
            <svg
              className={`svg-icon-sm ${globalHarvesting ? "spin-icon" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>

          {/* Accessible Add Button matching button shape */}
          <button
            type="button"
            className="primary-btn header-add-btn"
            onClick={() => {
              setFeedback(null);
              setIsAddModalOpen(true);
            }}
            aria-label="Add new source"
          >
            <svg
              className="svg-icon-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add</span>
          </button>
        </div>
      </div>

      <div className="sources-list">
          {sources.length === 0 ? (
            <div className="sources-empty-state">
              <p className="muted">No sources added yet.</p>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsAddModalOpen(true)}
              >
                Add your first source
              </button>
            </div>
          ) : (
            orderedSourceIds.map((sourceId, index) => {
              const src = sources.find((s) => s.id === sourceId);
              if (!src) return null;

              const weight = sourceWeights[src.id] ?? (orderedSourceIds.length - index);
              const isDragging = activeDrag?.draggedId === src.id;

              // Compute real-time motion and space-making transforms
              let transformStyle: string | undefined;
              let transitionStyle: string | undefined;
              let zIndexStyle: number | undefined;

              if (activeDrag) {
                if (isDragging) {
                  transformStyle = `translateY(${activeDrag.offsetY}px) scale(1.02)`;
                  transitionStyle = "none";
                  zIndexStyle = 50;
                } else {
                  let shiftY = 0;
                  if (activeDrag.startIndex < activeDrag.currentIndex) {
                    if (index > activeDrag.startIndex && index <= activeDrag.currentIndex) {
                      shiftY = -activeDrag.initialRowHeight;
                    }
                  } else if (activeDrag.startIndex > activeDrag.currentIndex) {
                    if (index >= activeDrag.currentIndex && index < activeDrag.startIndex) {
                      shiftY = activeDrag.initialRowHeight;
                    }
                  }
                  transformStyle = `translateY(${shiftY}px)`;
                  transitionStyle = "transform 0.25s cubic-bezier(0.2, 0, 0, 1)";
                }
              }

              return (
                <SourceItemRow
                  key={src.id}
                  source={src}
                  items={items}
                  weight={weight}
                  isDragging={isDragging}
                  isPulse={pendingScrollId === src.id}
                  transformStyle={transformStyle}
                  transitionStyle={transitionStyle}
                  zIndexStyle={zIndexStyle}
                  rowRef={(el) => {
                    if (el) sourceRowRefs.current.set(src.id, el);
                    else sourceRowRefs.current.delete(src.id);
                  }}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onVoteUp={handleVoteUp}
                  onVoteDown={handleVoteDown}
                  onRefresh={handleRefreshSingleSource}
                  isRefreshing={refreshingId === src.id}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onNavigateToFeedWithTag={onNavigateToFeedWithTag}
                  onNavigateToDb={onNavigateToDb}
                />
              );
            })
          )}
        </div>

      {/* Gap and Suggested Sources Section */}
      <div className="suggested-sources-container">
        <div className="suggested-sources-header">
          <div className="section-title-wrapper">
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✨</span>
              <span>Suggested Sources</span>
              {suggestedSources.length > 0 && (
                <span className="nav-counter" style={{ fontSize: "0.76rem" }}>
                  {suggestedSources.length}
                </span>
              )}
            </h3>
            <p className="muted" style={{ margin: "3px 0 0", fontSize: "0.85rem" }}>
              Curated feeds matched to your About Me preferences, local news, and reading interests.
            </p>
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={fetchSuggestions}
            disabled={isLoadingSuggestions}
            style={{ height: "32px", padding: "0 12px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span className={isLoadingSuggestions ? "spin-icon" : ""}>↺</span>
            <span>{isLoadingSuggestions ? "Checking…" : "Refresh Suggestions"}</span>
          </button>
        </div>

        {suggestedSources.length === 0 ? (
          <div className="sources-empty-state" style={{ padding: "1.5rem" }}>
            <p className="muted">
              {isLoadingSuggestions
                ? "Scoring potential feeds against your preferences…"
                : "All suggested sources have been added or none match at this time."}
            </p>
          </div>
        ) : (
          <div className="sources-list suggested-sources-list">
            {suggestedSources.map((sug) => (
              <SuggestedSourceRow
                key={sug.id}
                suggestion={sug}
                isAnimating={animatingSugId === sug.id}
                isAdding={addingSugId === sug.id}
                onAdd={handleAddSuggestedSource}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add New Source Modal Overlay */}
      {isAddModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-source-title"
        >
          <div className="add-source-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h3 id="add-source-title">Add new source</h3>
              <button
                type="button"
                className="icon-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleAddSource} className="admin-form">
              {/* Endpoint URL is FIRST and auto-populates the name, type, and description */}
              <div className="field">
                <label htmlFor="modal-feed-url">
                  Endpoint URL <span className="required-star">*</span>
                </label>
                <div className="inspect-input-wrap">
                  <input
                    id="modal-feed-url"
                    type="url"
                    required
                    autoFocus
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={(e) => handleInspectUrl(e.target.value)}
                    placeholder="https://feeds.bbci.co.uk/news/rss.xml"
                  />
                  {isInspecting && (
                    <span className="inspecting-indicator">Auto-detecting...</span>
                  )}
                </div>
                <span className="field-hint">
                  Enter the URL first; we'll automatically detect the title, feed format, and favicon.
                </span>
              </div>

              {/* Source Name */}
              <div className="field">
                <label htmlFor="modal-feed-name">
                  Source Name <span className="required-star">*</span>
                </label>
                <input
                  id="modal-feed-name"
                  type="text"
                  required
                  minLength={CONFIG.UI.VALIDATION.SOURCE_NAME_MIN_LENGTH}
                  maxLength={CONFIG.UI.VALIDATION.SOURCE_NAME_MAX_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BBC News"
                />
              </div>

              {/* Source Type */}
              <div className="field">
                <label htmlFor="modal-feed-type">Type</label>
                <select
                  id="modal-feed-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="rss">RSS / Atom (XML)</option>
                  <option value="web">Web Page (HTML)</option>
                  <option value="json">JSON API</option>
                </select>
              </div>

              {/* Optional Description */}
              <div className="field">
                <label htmlFor="modal-feed-desc">Description (Optional)</label>
                <input
                  id="modal-feed-desc"
                  type="text"
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. World breaking news, features and analysis"
                />
              </div>

              {/* Optional Site URL */}
              <div className="field">
                <label htmlFor="modal-feed-site">Website URL (Optional)</label>
                <input
                  id="modal-feed-site"
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://www.bbc.co.uk/news"
                />
              </div>

              {feedback && <div className="feedback-note error">{feedback}</div>}

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add source"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
