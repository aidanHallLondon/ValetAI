import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { HydratedContentRecord } from "../../../db/schema";
import { FeedCard } from "./FeedCard";
import { LayoutSwitcher, FeedLayoutMode } from "../common/LayoutSwitcher";
import { FeedFilterBar } from "./FeedFilterBar";
import {
  TagPreferencesState,
  DEFAULT_PREFERENCES,
  calculateArticleEffectiveScore,
  formatTemperature,
  formatWeightLabel,
  getTokenWeight,
  isTokenMuted,
  getArticleVote,
  normalizeTagKey,
  extractArticleTags,
  recordVectorVote,
  DEBUG,
} from "../../utils/algorithm";

export interface DynamicFilterTag {
  id: string;
  type: "source" | "entity" | "tokenset";
  value: string;
  label: string;
  tokens?: string[];
}

interface ToastMessage {
  id: number;
  message: string;
  onUndo: () => void;
}

export type { FeedLayoutMode };

interface DismissedCardState {
  direction: "left" | "right";
  isCollapsing: boolean;
  isHidden: boolean;
  collapseTimer: ReturnType<typeof setTimeout>;
  hideTimer: ReturnType<typeof setTimeout>;
}

interface SwipedUndoItem {
  id: number;
  title: string;
  direction: "left" | "right";
  previousPrefs: TagPreferencesState;
  wasRead: boolean;
}

interface FeedViewProps {
  items: HydratedContentRecord[];
  preferences: TagPreferencesState;
  onUpdatePreferences: (newPrefs: TagPreferencesState) => void;
  onSelectItem: (item: HydratedContentRecord, orderedItems?: HydratedContentRecord[]) => void;
  onMarkRead?: (id: number, isRead?: boolean) => void;
  onRefreshItems?: () => void;
  activeMode: string;
  onChangeMode: (mode: string) => void;
  onOpenSettings: () => void;
  initialTagFilter?: {
    type: "source" | "category" | "entity" | "tokenset";
    value: string;
    tokens?: string[];
    unreadOnly?: boolean;
  } | null;
}

export function FeedView({
  items,
  preferences,
  onUpdatePreferences,
  onSelectItem,
  onMarkRead,
  onRefreshItems,
  activeMode,
  onChangeMode,
  onOpenSettings,
  initialTagFilter = null,
}: FeedViewProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(() => {
    if (typeof document !== "undefined") {
      return document.getElementById("header-feed-toolbar-portal");
    }
    return null;
  });

  useEffect(() => {
    const el = document.getElementById("header-feed-toolbar-portal");
    if (el && el !== portalTarget) {
      setPortalTarget(el);
    }
  });

  // Reading layout mode: "list" (stream) vs "grid" (scanning) vs "compact" (dense title-only)
  const [layoutMode, setLayoutMode] = useState<FeedLayoutMode>(() => {
    try {
      const stored = localStorage.getItem("valet-reading-layout");
      if (stored === "grid" || stored === "list" || stored === "compact") return stored;
    } catch {}
    return "list";
  });

  // Toggle state to include unprocessed / raw ingested articles
  const [includeRawContent, setIncludeRawContent] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("valet-include-raw-content");
      if (stored !== null) return stored === "true";
    } catch {}
    return true; // Default to true so user sees incoming ingested raw items!
  });

  const handleToggleIncludeRaw = () => {
    setIncludeRawContent((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("valet-include-raw-content", String(next));
      } catch {}
      return next;
    });
  };

  const handleSetLayoutMode = (mode: FeedLayoutMode) => {
    setLayoutMode(mode);
    try {
      localStorage.setItem("valet-reading-layout", mode);
    } catch {}
  };

  // Dynamic filter tags clicked from cards (unified into the single filter bar)
  const [dynamicTags, setDynamicTags] = useState<DynamicFilterTag[]>([]);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [includeReadContent, setIncludeReadContent] = useState<boolean>(true);

  // Toast notification state with Undo
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Swipe dismiss state with delayed gap collapse
  const [dismissedMap, setDismissedMap] = useState<Map<number, DismissedCardState>>(new Map());
  const [undoStack, setUndoStack] = useState<SwipedUndoItem[]>([]);

  // Cleanup active collapse timers on unmount
  useEffect(() => {
    return () => {
      dismissedMap.forEach((entry) => {
        clearTimeout(entry.collapseTimer);
        clearTimeout(entry.hideTimer);
      });
    };
  }, [dismissedMap]);

  const showToast = useCallback((message: string, onUndo: () => void) => {
    const id = Date.now();
    setToast({ id, message, onUndo });
  }, []);

  const handleToggleFollowStory = useCallback(
    async (storyId: number) => {
      try {
        const res = await fetch(`/api/stories/${storyId}/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          onRefreshItems?.();
        }
      } catch (err) {
        console.error("Failed to toggle follow story:", err);
      }
    },
    [onRefreshItems]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast((cur) => (cur?.id === toast.id ? null : cur));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Adjust weight for any token (category, entity, or source)
  const handleAdjustTagTemperature = useCallback(
    (tagName: string, delta: number, description?: string) => {
      const key = normalizeTagKey(tagName);
      const current = getTokenWeight(preferences, key);
      const nextWeight = Math.max(-3, Math.min(3, current + delta));
      const previous = { ...preferences };

      const existingWeights = { ...(preferences.tokenWeights || preferences.tagTemperatures || {}) };
      if (nextWeight === 0) {
        delete existingWeights[key];
      } else {
        existingWeights[key] = nextWeight;
      }

      // Also mirror to votedVectors as a 1-tag vector so vector scoring includes it directly
      const existingVectors = { ...(preferences.votedVectors || {}) };
      if (nextWeight === 0) {
        delete existingVectors[key];
      } else {
        existingVectors[key] = {
          id: key,
          tags: [key],
          weight: nextWeight,
          label: description || tagName,
          updatedAt: Date.now(),
        };
      }

      const nextPrefs: TagPreferencesState = {
        ...preferences,
        tokenWeights: existingWeights,
        tagTemperatures: existingWeights,
        votedVectors: existingVectors,
      };

      onUpdatePreferences(nextPrefs);

      const symbol = delta > 0 ? "▲" : "▼";
      const actionName = delta > 0 ? "Upvoted" : "Downvoted";
      const label = description || tagName;
      showToast(`${symbol} Valet tuned: ${actionName} "${label}" (${formatWeightLabel(nextWeight)})`, () => {
        onUpdatePreferences(previous);
      });
    },
    [preferences, onUpdatePreferences, showToast]
  );

  // Tag click handlers from cards: Injects into single unified filter bar
  const handleFilterBySource = useCallback((sourceName: string) => {
    setDynamicTags((prev) => {
      const exists = prev.some(
        (t) => t.type === "source" && t.value.toLowerCase() === sourceName.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (t) => !(t.type === "source" && t.value.toLowerCase() === sourceName.toLowerCase())
        );
      }
      return [
        ...prev,
        {
          id: `source-${sourceName}`,
          type: "source",
          value: sourceName,
          label: sourceName,
        },
      ];
    });
  }, []);

  const handleFilterByEntity = useCallback((entity: string) => {
    setDynamicTags((prev) => {
      const exists = prev.some(
        (t) => t.type === "entity" && t.value.toLowerCase() === entity.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (t) => !(t.type === "entity" && t.value.toLowerCase() === entity.toLowerCase())
        );
      }
      return [
        ...prev,
        {
          id: `entity-${entity}`,
          type: "entity",
          value: entity,
          label: entity,
        },
      ];
    });
  }, []);

  const handleFilterByTokenSet = useCallback((tokens: string[], label?: string) => {
    const normTokens = tokens.map((t) => t.trim()).filter(Boolean);
    if (normTokens.length === 0) return;
    const tagId = `tokenset-${normTokens.map(normalizeTagKey).sort().join("+")}`;
    const displayLabel = label || normTokens.join(" + ");

    setDynamicTags((prev) => {
      const exists = prev.some((t) => t.id === tagId);
      if (exists) {
        return prev;
      }
      return [
        ...prev,
        {
          id: tagId,
          type: "tokenset",
          value: normTokens.join("+"),
          label: displayLabel,
          tokens: normTokens,
        },
      ];
    });
  }, []);

  useEffect(() => {
    if (initialTagFilter) {
      if (initialTagFilter.type === "source") {
        handleFilterBySource(initialTagFilter.value);
      } else if (initialTagFilter.type === "entity") {
        handleFilterByEntity(initialTagFilter.value);
      } else if (initialTagFilter.type === "tokenset") {
        handleFilterByTokenSet(
          initialTagFilter.tokens || initialTagFilter.value.split("+"),
          initialTagFilter.value
        );
      }
      if (initialTagFilter.unreadOnly) {
        setUnreadOnly(true);
        setIncludeReadContent(false);
      }
    }
  }, [initialTagFilter, handleFilterBySource, handleFilterByEntity, handleFilterByTokenSet]);

  const handleRemoveDynamicTag = (tagToRemove: DynamicFilterTag) => {
    setDynamicTags((prev) => prev.filter((t) => t.id !== tagToRemove.id));
  };

  const handleUnmuteTag = (tagKey: string) => {
    const previous = { ...preferences };
    const nextMuted = { ...(preferences.tokenMuted || preferences.tagMuted || {}) };
    delete nextMuted[tagKey];

    const nextPrefs: TagPreferencesState = {
      ...preferences,
      tokenMuted: nextMuted,
      tagMuted: nextMuted,
    };
    onUpdatePreferences(nextPrefs);
    showToast(`Unblocked "${tagKey}"`, () => {
      onUpdatePreferences(previous);
    });
  };

  // 'All Briefs' always clears everything
  const handleClearAll = () => {
    onChangeMode("all");
    setDynamicTags([]);
    setUnreadOnly(false);
    setIncludeReadContent(true);
  };

  // Toggle or select a preset mode
  const handleToggleMode = (modeId: string) => {
    if (activeMode === modeId) {
      onChangeMode("all");
    } else {
      onChangeMode(modeId);
    }
  };

  // Content Steering on Article Cards: Up/downvoting an article records its combination of tags as a vector
  const handleRateCard = (item: HydratedContentRecord, rating: "hot" | "not") => {
    const previousPrefs = { ...preferences };
    const direction = rating === "hot" ? "up" : "down";
    const tags = extractArticleTags(item);

    const { nextPrefs, newWeight } = recordVectorVote(
      preferences,
      tags,
      direction,
      item.id
    );

    onUpdatePreferences(nextPrefs);

    const symbol = direction === "up" ? "▲" : "▼";
    const actionDesc =
      newWeight === 0
        ? "Reset vector to neutral"
        : newWeight > 0
        ? `Upvoted vector (offset: +${newWeight})`
        : `Downvoted vector (offset: ${newWeight})`;

    // Human-readable summary of tags in this vector
    const displayTags = (item.analysis?.keyEntities && item.analysis.keyEntities.length > 0)
      ? item.analysis.keyEntities.slice(0, 3)
      : tags.slice(0, 3);
    const tagSummary = displayTags.join(", ");

    showToast(
      `${symbol} Valet vector tuned: ${actionDesc} [${tagSummary}].`,
      () => {
        onUpdatePreferences(previousPrefs);
      }
    );
  };

  // Helper to undo any swiped entry from undo stack
  const handleUndoEntry = useCallback(
    (entry: SwipedUndoItem) => {
      setDismissedMap((curr) => {
        const existing = curr.get(entry.id);
        if (existing) {
          clearTimeout(existing.collapseTimer);
          clearTimeout(existing.hideTimer);
          const next = new Map(curr);
          next.delete(entry.id);
          return next;
        }
        return curr;
      });

      onMarkRead?.(entry.id, entry.wasRead);
      onUpdatePreferences(entry.previousPrefs);

      setUndoStack((stack) => {
        const remaining = stack.filter((u) => u.id !== entry.id);
        if (remaining.length > 0) {
          const prevEntry = remaining[remaining.length - 1];
          const prevSymbol = prevEntry.direction === "right" ? "▲" : "▼";
          const prevVerb = prevEntry.direction === "right" ? "Upvoted" : "Downvoted";
          showToast(
            `${prevSymbol} Marked read & ${prevVerb} "${prevEntry.title}"`,
            () => handleUndoEntry(prevEntry)
          );
        } else {
          setToast(null);
        }
        return remaining;
      });
    },
    [onMarkRead, onUpdatePreferences, showToast]
  );

  // Swipe Dismiss Gesture Handler (Touch / Pointer drag deliberate swipe)
  // Left: Downvote vector + Mark as Read + Tumble left off screen
  // Right: Upvote vector + Mark as Read + Tumble right off screen
  // Gap is held open for 2.2 seconds before slowly collapsing so user can swipe multiple cards without layout shift!
  const handleSwipeDismiss = useCallback(
    (item: HydratedContentRecord, swipeDirection: "left" | "right") => {
      const id = item.id;
      const title = item.analysis?.title || item.source_name || `Brief #${id}`;
      const previousPrefs = { ...preferences };
      const wasRead = Boolean(item.is_read);

      // 1. Mark article as read immediately in database & state
      onMarkRead?.(id, true);

      // 2. Adjust personal vector weights
      const direction = swipeDirection === "right" ? "up" : "down";
      const tags = extractArticleTags(item);
      const { nextPrefs } = recordVectorVote(preferences, tags, direction, id);
      onUpdatePreferences(nextPrefs);

      // 3. Clear existing timers if any
      setDismissedMap((prev) => {
        const existing = prev.get(id);
        if (existing) {
          clearTimeout(existing.collapseTimer);
          clearTimeout(existing.hideTimer);
        }

        // Schedule delayed gap collapse:
        // Keep card gap open for 2200ms so user can swipe subsequent cards without layout shift
        const collapseTimer = setTimeout(() => {
          setDismissedMap((curr) => {
            const entry = curr.get(id);
            if (!entry) return curr;
            const next = new Map(curr);
            next.set(id, { ...entry, isCollapsing: true });
            return next;
          });
        }, 2200);

        // Once collapsed (2200ms + 500ms = 2700ms), hide completely
        const hideTimer = setTimeout(() => {
          setDismissedMap((curr) => {
            const entry = curr.get(id);
            if (!entry) return curr;
            const next = new Map(curr);
            next.set(id, { ...entry, isHidden: true });
            return next;
          });
        }, 2700);

        const next = new Map(prev);
        next.set(id, {
          direction: swipeDirection,
          isCollapsing: false,
          isHidden: false,
          collapseTimer,
          hideTimer,
        });
        return next;
      });

      // 4. Update Undo Stack & Show Undo Toast
      const undoItem: SwipedUndoItem = {
        id,
        title,
        direction: swipeDirection,
        previousPrefs,
        wasRead,
      };

      setUndoStack((prev) => [...prev, undoItem]);

      const symbol = swipeDirection === "right" ? "▲" : "▼";
      const verb = swipeDirection === "right" ? "Upvoted" : "Downvoted";
      const toastMsg = `${symbol} Marked read & ${verb} "${title}"`;

      showToast(toastMsg, () => handleUndoEntry(undoItem));
    },
    [preferences, onMarkRead, onUpdatePreferences, showToast, handleUndoEntry]
  );

  const candidateItems = useMemo(() => {
    return items.filter((item) => {
      const isRaw = item.status === "pending" || item.status === "processing";
      if (isRaw && !includeRawContent) return false;
      return true;
    });
  }, [items, includeRawContent]);

  const rawCount = items.filter(
    (item) => item.status === "pending" || item.status === "processing"
  ).length;

  const followedCount = candidateItems.filter((i) => i.is_followed).length;
  const urgentCount = candidateItems.filter(
    (i) => (i.analysis?.relevanceScore && i.analysis.relevanceScore >= 75) || (i.scout_score && i.scout_score >= 75)
  ).length;
  const readCount = candidateItems.filter((i) => i.is_read).length;

  // Calculate effective scores and filter items
  const processedItems = useMemo(() => {
    const scored = candidateItems.map((item) => {
      const scoreData = calculateArticleEffectiveScore(item, preferences);
      return { item, scoreData };
    });

    const filtered = scored.filter(({ item, scoreData }) => {
      // 0. Read Filter: exclude read items if read toggle is off or unreadOnly is active
      if ((!includeReadContent || unreadOnly) && item.is_read) return false;

      // 1. Exclude if explicitly muted via settings
      if (scoreData.isMuted) return false;

      // 2. Dynamic Source filters from single unified bar
      const activeSourceFilters = dynamicTags
        .filter((t) => t.type === "source")
        .map((t) => t.value.toLowerCase());
      if (
        activeSourceFilters.length > 0 &&
        !activeSourceFilters.includes((item.source_name || "").toLowerCase())
      ) {
        return false;
      }

      // 3. Dynamic Entity filters from single unified bar
      const activeEntityFilters = dynamicTags
        .filter((t) => t.type === "entity")
        .map((t) => t.value.toLowerCase());
      if (activeEntityFilters.length > 0) {
        const entities = item.analysis?.keyEntities || [];
        const hasMatchingEntity = entities.some((e) =>
          activeEntityFilters.includes(e.toLowerCase())
        );
        if (!hasMatchingEntity) return false;
      }

      // 3b. Dynamic Token Set filters from single unified bar
      const activeTokenSetFilters = dynamicTags.filter((t) => t.type === "tokenset");
      if (activeTokenSetFilters.length > 0) {
        const articleTags = extractArticleTags(item);
        // An article matches a token set if it contains all tokens in that set
        const matchesAnySet = activeTokenSetFilters.some((ts) => {
          const reqTokens = (ts.tokens && ts.tokens.length > 0
            ? ts.tokens
            : ts.value.split("+")
          ).map(normalizeTagKey);
          return reqTokens.every((req) => articleTags.includes(req));
        });
        if (!matchesAnySet) return false;
      }

      // 4. Primary Filter Modes: All | Favourites | Urgent
      if (activeMode === "all") return true;
      if (activeMode === "following" || activeMode === "favourites") {
        return Boolean(item.is_followed);
      }
      if (activeMode === "urgent" || activeMode === "high-relevance") {
        return scoreData.effectiveScore >= 75 || (item.scout_score && item.scout_score >= 75);
      }
      return item.analysis?.category === activeMode;
    });

    // Sort by:
    // 1. Followed stories first
    // 2. Rank score descending (multiplicative formula with HN decay)
    // 3. Publication / creation time
    return filtered.sort((a, b) => {
      const followA = a.item.is_followed ? 1 : 0;
      const followB = b.item.is_followed ? 1 : 0;
      if (followB !== followA) {
        return followB - followA;
      }

      if (b.scoreData.rankScore !== a.scoreData.rankScore) {
        return b.scoreData.rankScore - a.scoreData.rankScore;
      }
      const timeA = new Date(a.item.published_at || a.item.created_at).getTime();
      const timeB = new Date(b.item.published_at || b.item.created_at).getTime();
      return timeB - timeA;
    });
  }, [candidateItems, preferences, dynamicTags, activeMode, unreadOnly, includeReadContent]);

  // Active visible card order as displayed to the user for sequential reader navigation
  const orderedItems = useMemo(() => {
    return processedItems
      .filter(({ item }) => !dismissedMap.get(item.id)?.isHidden)
      .map(({ item }) => item);
  }, [processedItems, dismissedMap]);

  // Console output for feed ranking debug data
  useEffect(() => {
    if (!DEBUG || processedItems.length === 0) return;
    console.group(`[Valet Feed Debug] ${processedItems.length} Articles Ranked`);
    console.table(
      processedItems.slice(0, 15).map(({ item, scoreData }, idx) => ({
        Rank: idx + 1,
        Score: scoreData.rankScore.toFixed(2),
        Base: scoreData.baseValue,
        AI: scoreData.aiScore,
        Source: `${item.source_name || "Unknown"} (${scoreData.sourceWeight >= 0 ? "+" : ""}${scoreData.sourceWeight})`,
        SrcMult: `${scoreData.sourceMultiplier?.toFixed(2)}×`,
        VecMult: `${scoreData.vectorMultiplier?.toFixed(2)}×`,
        Age:
          scoreData.ageHours < 1
            ? `${Math.round(scoreData.ageHours * 60)}m`
            : `${scoreData.ageHours.toFixed(1)}h`,
        Decay: `${scoreData.decayFactor.toFixed(2)}×`,
        Title: (item.analysis?.title || item.source_name || `#${item.id}`).slice(0, 50),
      }))
    );
    console.log(
      "--- TOP 5 RANKED ARTICLES DEBUG DUMPS (COPY/PASTEABLE) ---\n" +
        processedItems
          .slice(0, 5)
          .map(
            ({ item, scoreData }, idx) =>
              `=== #${idx + 1} "${item.analysis?.title || item.source_name}" (Score: ${scoreData.rankScore.toFixed(2)}) ===\n` +
              scoreData.debugTooltip
          )
          .join("\n\n")
    );
    console.groupEnd();
  }, [processedItems]);

  const isAllActive = activeMode === "all" && dynamicTags.length === 0 && !unreadOnly && includeReadContent;
  const isFavouritesActive = activeMode === "following" || activeMode === "favourites";
  const isUrgentActive = activeMode === "urgent" || activeMode === "high-relevance";
  const mutedDict = preferences.tokenMuted || preferences.tagMuted || {};
  const mutedTagKeys = Object.keys(mutedDict).filter(
    (k) => mutedDict[k]
  );
  const hasAnyFiltersActive =
    activeMode !== "all" || dynamicTags.length > 0 || mutedTagKeys.length > 0 || unreadOnly || !includeReadContent;

  const unifiedBar = (
    <section
      className={`feed-unified-bar ${portalTarget ? "in-header-row-2" : ""}`}
      aria-label="Unified feed controls and filters"
    >
      {/* Compact 3-Mode Layout Switcher */}
      <LayoutSwitcher
        layoutMode={layoutMode}
        onChangeLayoutMode={handleSetLayoutMode}
      />

      <span className="controls-divider" aria-hidden="true" />

      {/* Unified Filter Pills Container */}
      <FeedFilterBar
        isAllActive={isAllActive}
        isFavouritesActive={isFavouritesActive}
        isUrgentActive={isUrgentActive}
        followedCount={followedCount}
        urgentCount={urgentCount}
        rawCount={rawCount}
        readCount={readCount}
        includeRawContent={includeRawContent}
        includeReadContent={includeReadContent}
        unreadOnly={unreadOnly}
        dynamicTags={dynamicTags}
        mutedTagKeys={mutedTagKeys}
        preferences={preferences}
        hasAnyFiltersActive={hasAnyFiltersActive}
        onClearAll={handleClearAll}
        onToggleMode={handleToggleMode}
        onToggleIncludeRaw={handleToggleIncludeRaw}
        onToggleIncludeRead={() => {
          setIncludeReadContent((prev) => !prev);
          if (unreadOnly) setUnreadOnly(false);
        }}
        onRemoveDynamicTag={handleRemoveDynamicTag}
        onUnsetUnreadOnly={() => {
          setUnreadOnly(false);
          setIncludeReadContent(true);
        }}
        onUnmuteTag={handleUnmuteTag}
        onAdjustTagTemperature={handleAdjustTagTemperature}
        onRecordVectorVote={(tokens, dir) => {
          const { nextPrefs } = recordVectorVote(preferences, tokens, dir);
          onUpdatePreferences(nextPrefs);
        }}
      />
    </section>
  );

  return (
    <div className="feed-view feed-container">
      {portalTarget ? createPortal(unifiedBar, portalTarget) : unifiedBar}

      {/* Main Stream of Articles (Stream or Grid layout) */}
      <main className={`feed-stream feed-stream-${layoutMode}`} aria-label="Feed">
        {processedItems.length === 0 ? (
          <div className="feed-empty-state">
            <div className="empty-icon" aria-hidden="true">
              📰
            </div>
            <h3>No articles matched</h3>
            <p>
              {candidateItems.length === 0
                ? "No articles found. Add your favorite RSS or Web feeds in Settings or enable raw content."
                : "No items match your active filters or preferences."}
            </p>
            {hasAnyFiltersActive && (
              <button
                type="button"
                className="secondary-btn"
                onClick={handleClearAll}
              >
                Reset All Filters
              </button>
            )}
            {candidateItems.length === 0 && (
              <button
                type="button"
                className="primary-btn"
                onClick={onOpenSettings}
              >
                Go to Settings
              </button>
            )}
          </div>
        ) : (
          processedItems.map(({ item, scoreData }) => {
            const dismissedState = dismissedMap.get(item.id);
            if (dismissedState?.isHidden) {
              return null;
            }

            return (
              <FeedCard
                key={item.id}
                item={item}
                preferences={preferences}
                scoreData={scoreData}
                layoutMode={layoutMode}
                rating={
                  getArticleVote(preferences, item.id) === "up"
                    ? "hot"
                    : getArticleVote(preferences, item.id) === "down"
                    ? "not"
                    : null
                }
                onSelect={(it) => onSelectItem(it, orderedItems)}
                onFilterBySource={handleFilterBySource}
                onFilterByEntity={handleFilterByEntity}
                onToggleFollowStory={handleToggleFollowStory}
                onRate={handleRateCard}
                onAdjustTagTemperature={handleAdjustTagTemperature}
                onSwipeDismiss={handleSwipeDismiss}
                isDismissed={Boolean(dismissedState)}
                tumblingDirection={dismissedState?.direction || null}
                isCollapsing={Boolean(dismissedState?.isCollapsing)}
              />
            );
          })
        )}
      </main>

      {/* Floating Undo Toast Notification */}
      {toast && (
        <aside className="undo-toast" role="status" aria-live="polite">
          <div className="toast-content">
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-undo-btn"
              onClick={() => {
                toast.onUndo();
                setToast(null);
              }}
            >
              Undo
            </button>
          </div>
          <button
            type="button"
            className="toast-dismiss-btn"
            onClick={() => setToast(null)}
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </aside>
      )}
    </div>
  );
}
