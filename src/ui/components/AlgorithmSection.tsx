import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { HydratedContentRecord, SourceRecord } from "../../db/schema";
import {
  AlgorithmPreferences,
  normalizeTokenKey,
} from "../utils/algorithm";
import { ConceptVoteRow } from "./algorithm/ConceptVoteRow";

interface AlgorithmSectionProps {
  items: HydratedContentRecord[];
  sources: SourceRecord[];
  preferences: AlgorithmPreferences;
  onUpdatePreferences: (newPrefs: AlgorithmPreferences) => void;
  onNavigateToFeedWithTag?: (
    tagName: string,
    type: "source" | "category" | "entity" | "tokenset",
    filterMode?: "all" | "unread",
    tokens?: string[]
  ) => void;
  initialFilterTag?: string | null;
}

export interface VoteTokenInfo {
  key: string;
  name: string;
  type: "category" | "entity";
  count: number;
  weight: number;
  isMuted: boolean;
  sourceWeight: number; // Highest source weight of sources where this token appears
  topSourceName?: string;
}

interface ActiveDragState {
  draggedKey: string;
  startIndex: number;
  currentIndex: number;
  startY: number;
  offsetY: number;
  initialRowHeight: number;
}

/**
 * Sorts tokens by vote.weight, then source.weight, then article count, then name.
 */
function sortTokensByVoteAndSource(list: VoteTokenInfo[]): VoteTokenInfo[] {
  return [...list].sort((a, b) => {
    // 1. vote.weight (descending)
    if (b.weight !== a.weight) return b.weight - a.weight;
    // 2. source.weight (descending)
    if (b.sourceWeight !== a.sourceWeight) return b.sourceWeight - a.sourceWeight;
    // 3. article count (descending)
    if (b.count !== a.count) return b.count - a.count;
    // 4. name (alphabetical)
    return a.name.localeCompare(b.name);
  });
}

export function AlgorithmSection({
  items,
  sources,
  preferences,
  onUpdatePreferences,
  onNavigateToFeedWithTag,
  initialFilterTag = null,
}: AlgorithmSectionProps) {
  const [searchQuery, setSearchQuery] = useState<string>(initialFilterTag || "");
  const [typeFilter, setTypeFilter] = useState<"all" | "category" | "entity">("all");
  const [sortBy, setSortBy] = useState<"vote" | "count" | "name">("vote");
  const [expandedTokenKeys, setExpandedTokenKeys] = useState<Set<string>>(
    new Set(initialFilterTag ? [normalizeTokenKey(initialFilterTag)] : [])
  );

  // Local weights state for instant user feedback and hysteresis
  const [localWeights, setLocalWeights] = useState<Record<string, number>>(() => {
    return preferences.tokenWeights || preferences.tagTemperatures || {};
  });

  // Extract all distinct non-source tokens (categories & entities) and map their source weights
  const { allTokens } = useMemo(() => {
    const tokensMap: Record<string, VoteTokenInfo> = {};

    const rawWeights = preferences.tokenWeights || preferences.tagTemperatures || {};
    const rawMuted = preferences.tokenMuted || preferences.tagMuted || {};

    // 1. Build a map of source weights for tie-breaker sorting
    const sourceWeightsMap: Record<string, number> = {};
    for (const src of sources) {
      const sKey = normalizeTokenKey(src.name);
      sourceWeightsMap[sKey] = rawWeights[sKey] || 0;
    }

    // 2. Register categories and entities from items (Sources are NOT included in this list anymore)
    for (const item of items) {
      const sName = item.source_name || undefined;
      const sKey = sName ? normalizeTokenKey(sName) : "";
      const itemSrcWeight = sKey ? (sourceWeightsMap[sKey] || 0) : 0;

      if (item.analysis?.category) {
        const cat = item.analysis.category;
        const cKey = normalizeTokenKey(cat);
        if (!tokensMap[cKey]) {
          tokensMap[cKey] = {
            key: cKey,
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            type: "category",
            count: 0,
            weight: rawWeights[cKey] || 0,
            isMuted: Boolean(rawMuted[cKey]),
            sourceWeight: itemSrcWeight,
            topSourceName: sName,
          };
        } else {
          if (itemSrcWeight > tokensMap[cKey].sourceWeight) {
            tokensMap[cKey].sourceWeight = itemSrcWeight;
            tokensMap[cKey].topSourceName = sName;
          }
        }
        tokensMap[cKey].count += 1;
      }

      if (item.analysis?.keyEntities) {
        for (const ent of item.analysis.keyEntities) {
          const eKey = normalizeTokenKey(ent);
          if (!tokensMap[eKey]) {
            tokensMap[eKey] = {
              key: eKey,
              name: ent,
              type: "entity",
              count: 0,
              weight: rawWeights[eKey] || 0,
              isMuted: Boolean(rawMuted[eKey]),
              sourceWeight: itemSrcWeight,
              topSourceName: sName,
            };
          } else {
            if (itemSrcWeight > tokensMap[eKey].sourceWeight) {
              tokensMap[eKey].sourceWeight = itemSrcWeight;
              tokensMap[eKey].topSourceName = sName;
            }
          }
          tokensMap[eKey].count += 1;
        }
      }
    }

    // Reflect any voted vector tokens that may not be in current ingested items
    for (const [vKey, vec] of Object.entries(preferences.votedVectors || {})) {
      if (vec && vec.tags && vec.tags.length === 1 && !tokensMap[vKey]) {
        // Only if it's not a source
        const isSource = sources.some((s) => normalizeTokenKey(s.name) === vKey);
        if (!isSource) {
          tokensMap[vKey] = {
            key: vKey,
            name: vec.label || vKey,
            type: "entity",
            count: 0,
            weight: rawWeights[vKey] || vec.weight || 0,
            isMuted: Boolean(rawMuted[vKey]),
            sourceWeight: 0,
          };
        }
      }
    }

    return { allTokens: Object.values(tokensMap) };
  }, [items, sources, preferences]);

  // Voted tokens: only show voted on vectors/concepts by default
  const votedTokens = useMemo(() => {
    return allTokens.filter((t) => {
      const curW = localWeights[t.key] ?? t.weight;
      if (curW !== 0 || t.isMuted) return true;

      // Part of any active multi-tag voted vector
      const hasVector = Object.values(preferences.votedVectors || {}).some(
        (v) =>
          v &&
          v.weight !== 0 &&
          v.tags &&
          v.tags.some((tag) => normalizeTokenKey(tag) === t.key)
      );
      if (hasVector) return true;

      // Part of any active compound rule
      const rawSetWeights =
        preferences.tokenSetWeights || preferences.comboTemperatures || {};
      const hasCompound = Object.entries(rawSetWeights).some(([k, w]) => {
        if (w === 0) return false;
        const [tA, tB] = k.split("+");
        return (
          normalizeTokenKey(tA) === t.key || normalizeTokenKey(tB) === t.key
        );
      });
      return hasCompound;
    });
  }, [allTokens, localWeights, preferences]);

  // Displayed tokens according to search, filter, and sort
  const displayedTokens = useMemo(() => {
    const baseList = searchQuery.trim() ? allTokens : votedTokens;

    const filtered = baseList.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!t.name.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      return true;
    });

    const withCurrentWeights = filtered.map((t) => ({
      ...t,
      weight: localWeights[t.key] ?? t.weight,
    }));

    if (sortBy === "count") {
      return withCurrentWeights.sort((a, b) => b.count - a.count);
    }
    if (sortBy === "name") {
      return withCurrentWeights.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Default: ORDER BY vote.weight, source.weight
    return sortTokensByVoteAndSource(withCurrentWeights);
  }, [allTokens, votedTokens, searchQuery, typeFilter, sortBy, localWeights]);

  // Ordered keys for drag-and-drop and animated reordering
  const [orderedTokenKeys, setOrderedTokenKeys] = useState<string[]>(() => {
    return displayedTokens.map((t) => t.key);
  });

  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hysteresisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetWeightsRef = useRef<Record<string, number>>(localWeights);

  // Drag state
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const activeDragRef = useRef<ActiveDragState | null>(null);

  // Sync orderedTokenKeys when displayed tokens list changes
  useEffect(() => {
    if (!activeDragRef.current && !hysteresisTimerRef.current) {
      setOrderedTokenKeys(displayedTokens.map((t) => t.key));
    }
  }, [displayedTokens]);

  // Sync localWeights when external preferences change
  useEffect(() => {
    if (!hysteresisTimerRef.current) {
      const w = preferences.tokenWeights || preferences.tagTemperatures || {};
      setLocalWeights(w);
      targetWeightsRef.current = w;
    }
  }, [preferences]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hysteresisTimerRef.current) {
        clearTimeout(hysteresisTimerRef.current);
      }
    };
  }, []);

  // Find all active rules and multi-tag voted vectors that include this concept
  const getRulesForToken = (tokenName: string) => {
    const norm = normalizeTokenKey(tokenName);
    const matchedRules: Array<{
      id: string;
      type: "vector" | "compound";
      tags: string[];
      weight: number;
      label?: string;
    }> = [];

    // 1. Check votedVectors (multi-tag vectors)
    for (const vec of Object.values(preferences.votedVectors || {})) {
      if (!vec || vec.weight === 0 || !vec.tags || vec.tags.length <= 1) continue;
      const hasToken = vec.tags.some((t) => normalizeTokenKey(t) === norm);
      if (hasToken) {
        matchedRules.push({
          id: vec.id,
          type: "vector",
          tags: vec.tags,
          weight: vec.weight,
          label: vec.label,
        });
      }
    }

    // 2. Check tokenSetWeights (pairwise rules)
    const rawSetWeights = preferences.tokenSetWeights || preferences.comboTemperatures || {};
    for (const [key, w] of Object.entries(rawSetWeights)) {
      if (w === 0) continue;
      const [tA, tB] = key.split("+");
      if (normalizeTokenKey(tA) === norm || normalizeTokenKey(tB) === norm) {
        const vecKey = [normalizeTokenKey(tA), normalizeTokenKey(tB)].sort().join("|");
        if (!matchedRules.some((r) => r.id === vecKey)) {
          matchedRules.push({
            id: key,
            type: "compound",
            tags: [tA, tB],
            weight: w,
          });
        }
      }
    }

    return matchedRules;
  };

  /**
   * Commits hysteresis reorder after debounce delay.
   * Runs FLIP animation so cards smoothly glide into place.
   */
  const commitHysteresisReorder = useCallback(() => {
    if (hysteresisTimerRef.current) {
      clearTimeout(hysteresisTimerRef.current);
      hysteresisTimerRef.current = null;
    }

    const nextWeights = { ...targetWeightsRef.current };

    // Record first bounding tops
    const firstTops = new Map<string, number>();
    orderedTokenKeys.forEach((key) => {
      const el = rowRefs.current.get(key);
      if (el) firstTops.set(key, el.getBoundingClientRect().top);
    });

    // Re-evaluate display list with updated weights and sort by ORDER BY vote.weight, source.weight
    const tokensWithWeights = displayedTokens.map((t) => ({
      ...t,
      weight: nextWeights[t.key] ?? 0,
    }));
    const newSorted = sortTokensByVoteAndSource(tokensWithWeights);
    const newKeys = newSorted.map((t) => t.key);

    // Save to global preferences
    const nextVectors = { ...(preferences.votedVectors || {}) };
    Object.entries(nextWeights).forEach(([key, w]) => {
      if (w === 0) {
        delete nextVectors[key];
      } else {
        const t = allTokens.find((item) => item.key === key);
        nextVectors[key] = {
          id: key,
          tags: [key],
          weight: w,
          label: t?.name || key,
          updatedAt: Date.now(),
        };
      }
    });

    onUpdatePreferences({
      ...preferences,
      tokenWeights: nextWeights,
      tagTemperatures: nextWeights,
      votedVectors: nextVectors,
    });

    setOrderedTokenKeys(newKeys);

    // Run FLIP animation on next frame
    requestAnimationFrame(() => {
      newKeys.forEach((key) => {
        const el = rowRefs.current.get(key);
        const firstTop = firstTops.get(key);
        if (el && firstTop !== undefined) {
          const lastTop = el.getBoundingClientRect().top;
          const deltaY = firstTop - lastTop;
          if (deltaY !== 0) {
            el.style.transform = `translateY(${deltaY}px)`;
            el.style.transition = "none";
            void el.offsetHeight; // Force reflow
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
  }, [orderedTokenKeys, displayedTokens, allTokens, preferences, onUpdatePreferences]);

  /**
   * Voting with Hysteresis Debounce:
   * Immediately updates weight in-place, then smoothly animates to new order.
   */
  const handleVote = (tokenKey: string, delta: number) => {
    const curW = targetWeightsRef.current[tokenKey] ?? (localWeights[tokenKey] || 0);
    const nextW = Math.max(-3, Math.min(3, curW + delta));

    const updated = { ...targetWeightsRef.current };
    if (nextW === 0) {
      delete updated[tokenKey];
    } else {
      updated[tokenKey] = nextW;
    }
    targetWeightsRef.current = updated;
    setLocalWeights(updated);

    if (hysteresisTimerRef.current) {
      clearTimeout(hysteresisTimerRef.current);
    }
    hysteresisTimerRef.current = setTimeout(() => {
      commitHysteresisReorder();
    }, 650);
  };

  /**
   * Show / Hide (Eye Icon) toggle:
   * Sets token to muted/hidden without deleting.
   */
  const handleToggleMute = (tokenName: string) => {
    const key = normalizeTokenKey(tokenName);
    const rawMuted = { ...(preferences.tokenMuted || preferences.tagMuted || {}) };
    if (rawMuted[key]) {
      delete rawMuted[key];
    } else {
      rawMuted[key] = true;
    }

    onUpdatePreferences({
      ...preferences,
      tokenMuted: rawMuted,
      tagMuted: rawMuted,
    });
  };

  const handleSetVectorWeight = (vecId: string, delta: number) => {
    const nextVectors = { ...(preferences.votedVectors || {}) };
    const vec = nextVectors[vecId];
    if (!vec) return;
    const nextWeight = Math.max(-3, Math.min(3, vec.weight + delta));
    if (nextWeight === 0) {
      delete nextVectors[vecId];
    } else {
      nextVectors[vecId] = { ...vec, weight: nextWeight, updatedAt: Date.now() };
    }
    onUpdatePreferences({
      ...preferences,
      votedVectors: nextVectors,
    });
  };

  const handleResetVector = (vecId: string) => {
    const nextVectors = { ...(preferences.votedVectors || {}) };
    delete nextVectors[vecId];
    onUpdatePreferences({
      ...preferences,
      votedVectors: nextVectors,
    });
  };

  const handleSetTokenSetWeight = (setKey: string, delta: number) => {
    const rawSetWeights = {
      ...(preferences.tokenSetWeights || preferences.comboTemperatures || {}),
    };
    const curWeight = rawSetWeights[setKey] || 0;
    const nextWeight = Math.max(-3, Math.min(3, curWeight + delta));
    if (nextWeight === 0) {
      delete rawSetWeights[setKey];
    } else {
      rawSetWeights[setKey] = nextWeight;
    }
    onUpdatePreferences({
      ...preferences,
      tokenSetWeights: rawSetWeights,
      comboTemperatures: rawSetWeights,
    });
  };

  const handleResetTokenSet = (setKey: string) => {
    const rawSetWeights = {
      ...(preferences.tokenSetWeights || preferences.comboTemperatures || {}),
    };
    delete rawSetWeights[setKey];
    onUpdatePreferences({
      ...preferences,
      tokenSetWeights: rawSetWeights,
      comboTemperatures: rawSetWeights,
    });
  };

  const toggleExpandToken = (tokenKey: string) => {
    setExpandedTokenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(tokenKey)) {
        next.delete(tokenKey);
      } else {
        next.add(tokenKey);
      }
      return next;
    });
  };

  /**
   * Pointer Drag & Drop for Votes:
   * Moves whole card with pointer tracking, other cards fluidly glide out of the way.
   * "there is no need for vectors to have unique weights - The sort is ORDER BY vote.weight, source.weight"
   */
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>, key: string) => {
    if (e.button !== 0) return;

    if (hysteresisTimerRef.current) {
      clearTimeout(hysteresisTimerRef.current);
      commitHysteresisReorder();
    }

    const startIndex = orderedTokenKeys.indexOf(key);
    if (startIndex === -1) return;

    const rowEl = rowRefs.current.get(key);
    const rect = rowEl?.getBoundingClientRect();
    const rowHeight = (rect?.height || 56) + 12;

    const dragInfo: ActiveDragState = {
      draggedKey: key,
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
    const targetIndex = Math.max(0, Math.min(orderedTokenKeys.length - 1, startIndex + slotShift));

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

    const { startIndex, currentIndex, draggedKey } = activeDragRef.current;
    activeDragRef.current = null;
    setActiveDrag(null);

    if (startIndex === currentIndex) return;

    const newOrder = [...orderedTokenKeys];
    const [moved] = newOrder.splice(startIndex, 1);
    newOrder.splice(currentIndex, 0, moved);

    // Determine target weight at destination slot:
    const tokensMap = new Map(allTokens.map((t) => [t.key, t]));
    let targetWeight = 0;
    if (currentIndex === 0) {
      const topW = localWeights[newOrder[1]] ?? (tokensMap.get(newOrder[1])?.weight || 0);
      targetWeight = Math.max(topW, 1);
    } else if (currentIndex === newOrder.length - 1) {
      const btmW = localWeights[newOrder[newOrder.length - 2]] ?? (tokensMap.get(newOrder[newOrder.length - 2])?.weight || 0);
      targetWeight = Math.min(btmW, -1);
    } else {
      const neighborKey = startIndex > currentIndex ? newOrder[currentIndex + 1] : newOrder[currentIndex - 1];
      targetWeight = localWeights[neighborKey] ?? (tokensMap.get(neighborKey)?.weight || 0);
    }

    const nextWeights = { ...localWeights };
    if (targetWeight === 0) {
      delete nextWeights[draggedKey];
    } else {
      nextWeights[draggedKey] = targetWeight;
    }
    setLocalWeights(nextWeights);
    targetWeightsRef.current = nextWeights;
    setOrderedTokenKeys(newOrder);

    // Save to preferences
    const nextVectors = { ...(preferences.votedVectors || {}) };
    if (targetWeight === 0) {
      delete nextVectors[draggedKey];
    } else {
      const t = tokensMap.get(draggedKey);
      nextVectors[draggedKey] = {
        id: draggedKey,
        tags: [draggedKey],
        weight: targetWeight,
        label: t?.name || draggedKey,
        updatedAt: Date.now(),
      };
    }

    onUpdatePreferences({
      ...preferences,
      tokenWeights: nextWeights,
      tagTemperatures: nextWeights,
      votedVectors: nextVectors,
    });
  };

  // Summary counts
  const upvotedCount = allTokens.filter(
    (t) => (localWeights[t.key] ?? t.weight) > 0 && !t.isMuted
  ).length;
  const downvotedCount = allTokens.filter(
    (t) => (localWeights[t.key] ?? t.weight) < 0 && !t.isMuted
  ).length;
  const blockedCount = allTokens.filter((t) => t.isMuted).length;

  const tokensByMap = useMemo(() => {
    return new Map(allTokens.map((t) => [t.key, t]));
  }, [allTokens]);

  return (
    <div className="algorithm-section-container">
      {/* Header */}
      <header className="algorithm-page-header">
        <div>
          <h2>Your Personal Algorithm</h2>
          <p className="section-description">
            Control the ranking weights behind your feed. Upvote concepts to prioritize them, downvote to
            demote, or create compound rules to fine-tune exactly what you want to read.
          </p>
        </div>

        {/* Global Summary Badge Strip */}
        <div className="algorithm-stats-strip">
          <span className="stat-pill">
            <strong>{allTokens.length}</strong> Concepts
          </span>
          <span className="stat-pill cool">
            ▼ <strong>{downvotedCount}</strong> Downvoted
          </span>
          <span className="stat-pill hot">
            ▲ <strong>{upvotedCount}</strong> Upvoted
          </span>
          <span className="stat-pill muted">
            👁️ <strong>{blockedCount}</strong> Hidden
          </span>
        </div>
      </header>

      {/* Main Votes Section */}
      <section className="algorithm-catalog-section">
        <div className="catalog-header-bar">
          <h3>Votes</h3>
          <span className="catalog-hint">
            See and amend the votes affecting the article ranking.
          </span>
        </div>

        {/* Filter & Sort Controls */}
        <div className="algorithm-controls-bar">
          <div className="catalog-search-wrapper">
            <span className="search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              className="catalog-search-input"
              placeholder="Search concepts or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Toggle: Sources excluded, only Domains & Entities */}
          <div className="type-toggle-group" role="group" aria-label="Concept types">
            <button
              type="button"
              className={typeFilter === "all" ? "filter-chip-btn active" : "filter-chip-btn"}
              onClick={() => setTypeFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={typeFilter === "category" ? "filter-chip-btn active" : "filter-chip-btn"}
              onClick={() => setTypeFilter("category")}
            >
              📁 Domains
            </button>
            <button
              type="button"
              className={typeFilter === "entity" ? "filter-chip-btn active" : "filter-chip-btn"}
              onClick={() => setTypeFilter("entity")}
            >
              🏷️ Entities
            </button>
          </div>

          <div className="tags-sort-group" role="group" aria-label="Sort concepts">
            <span className="sort-label">Sort:</span>
            <button
              type="button"
              className={sortBy === "vote" ? "sort-chip-btn hot active" : "sort-chip-btn hot"}
              onClick={() => setSortBy("vote")}
            >
              Rank & Source
            </button>
            <button
              type="button"
              className={sortBy === "count" ? "sort-chip-btn active" : "sort-chip-btn"}
              onClick={() => setSortBy("count")}
            >
              Most Articles
            </button>
            <button
              type="button"
              className={sortBy === "name" ? "sort-chip-btn active" : "sort-chip-btn"}
              onClick={() => setSortBy("name")}
            >
              Name
            </button>
          </div>
        </div>

        {/* Votes List: Uses identical .source-row structure and styling */}
        <div className="sources-list algorithm-tokens-list">
          {orderedTokenKeys.length === 0 ? (
            <div className="empty-catalog-state">
              <span className="empty-icon" aria-hidden="true">
                🎛️
              </span>
              <h4>{searchQuery ? "No matching concepts found" : "No votes yet"}</h4>
              <p>
                {searchQuery
                  ? "Try searching for a different keyword or resetting your filter."
                  : "Upvote or downvote articles in your feed, or tap any tag to vote on it."}
              </p>
            </div>
          ) : (
            orderedTokenKeys.map((tokenKey, index) => {
              const token = tokensByMap.get(tokenKey);
              if (!token) return null;

              const isDragging = activeDrag?.draggedKey === token.key;
              const weight = localWeights[token.key] ?? token.weight;
              const isExpanded = expandedTokenKeys.has(token.key);
              const matchedRules = getRulesForToken(token.name);

              // Live displacement during pointer drag
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
                <ConceptVoteRow
                  key={`${token.type}-${token.key}`}
                  token={token}
                  weight={weight}
                  isDragging={isDragging}
                  transformStyle={transformStyle}
                  transitionStyle={transitionStyle}
                  zIndexStyle={zIndexStyle}
                  rowRef={(el) => {
                    if (el) rowRefs.current.set(token.key, el);
                    else rowRefs.current.delete(token.key);
                  }}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onNavigateToFeedWithTag={onNavigateToFeedWithTag}
                  onVote={handleVote}
                  onToggleMute={handleToggleMute}
                  isExpanded={isExpanded}
                  onToggleExpand={toggleExpandToken}
                  matchedRules={matchedRules as any}
                  onNavigateToFeedWithCompoundTag={onNavigateToFeedWithTag}
                  onSetRuleWeight={(id, type, w) => {
                    if (type === "vector") handleSetVectorWeight(id, w);
                    else handleSetTokenSetWeight(id, w);
                  }}
                  onResetRule={(id, type) => {
                    if (type === "vector") handleResetVector(id);
                    else handleResetTokenSet(id);
                  }}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
