import type { HydratedContentRecord } from "../../db/schema";

export type TokenType = "source" | "category" | "entity";

/**
 * Stores token metrics, weight offsets, and mute status.
 */
export interface TokenInfo {
  key: string;
  name: string;
  type: TokenType;
  count: number;
  weight: number; // -3 (suppressed) to +3 (max priority), 0 = neutral
  isMuted: boolean;
}

/**
 * Stores composite weights for pairs of paired tokens.
 */
export interface TokenSetInfo {
  id: string; // e.g. "bbc news+sport"
  tokens: [string, string];
  weight: number; // -3 to +3
  count: number;
}

/**
 * Stores learned user preference weights for tag clusters.
 */
export interface VotedVector {
  id: string; // sorted tag keys joined by "|"
  tags: string[]; // sorted normalized tag keys
  weight: number; // offset: -3 to +3 (0 = neutral)
  label?: string; // human-readable summary of tags
  voteCount?: number;
  updatedAt: number;
}

/**
 * Stores user ranking weights, muted tags, and article votes.
 */
export interface AlgorithmPreferences {
  tokenWeights: Record<string, number>;
  tokenMuted: Record<string, boolean>;
  tokenSetWeights: Record<string, number>;
  articleVotes: Record<number, "up" | "down">;
  votedVectors?: Record<string, VotedVector>;
  // Legacy aliases
  tagTemperatures?: Record<string, number>;
  tagMuted?: Record<string, boolean>;
  comboTemperatures?: Record<string, number>;
  articleRatings?: Record<number, "hot" | "not">;
  boostedTopics?: string[];
  mutedTopics?: string[];
}

export type TagInfo = TokenInfo;
export type TagComboInfo = TokenSetInfo;

export const DEFAULT_ALGORITHM_PREFERENCES: AlgorithmPreferences = {
  tokenWeights: {},
  tokenMuted: {},
  tokenSetWeights: {},
  articleVotes: {},
  votedVectors: {},
};

// Aliases for compatibility
export type TagPreferencesState = AlgorithmPreferences;
export const DEFAULT_PREFERENCES = DEFAULT_ALGORITHM_PREFERENCES;

/**
 * Normalizes a token string for dictionary key lookup.
 */
export function normalizeTokenKey(token: string): string {
  return token.trim().toLowerCase();
}

export const normalizeTagKey = normalizeTokenKey;

/**
 * Creates an alphabetically sorted composite key for two tokens.
 */
export function createTokenSetKey(tokenA: string, tokenB: string): string {
  const a = normalizeTokenKey(tokenA);
  const b = normalizeTokenKey(tokenB);
  return a < b ? `${a}+${b}` : `${b}+${a}`;
}

export const createComboKey = createTokenSetKey;

/**
 * Semantic human label for a token weight.
 */
export function formatWeightLabel(weight: number, isMuted = false): string {
  if (isMuted) return "Blocked";
  if (weight >= 3) return "Top Priority";
  if (weight === 2) return "High Affinity";
  if (weight === 1) return "Boosted";
  if (weight === 0) return "Neutral";
  if (weight === -1) return "Deprioritized";
  if (weight === -2) return "Low Affinity";
  return "Suppressed";
}

export const formatTemperature = (w: number) => formatWeightLabel(w);
export const getTemperatureLabel = (w: number, muted = false) => formatWeightLabel(w, muted);

/**
 * Safe accessor for a token's current weight (-3 to +3).
 */
export function getTokenWeight(prefs: AlgorithmPreferences | undefined, key: string): number {
  if (!prefs) return 0;
  const weights = prefs.tokenWeights || prefs.tagTemperatures || {};
  return weights[key] || 0;
}

/**
 * Safe accessor to check if a token is explicitly blocked / muted.
 */
export function isTokenMuted(prefs: AlgorithmPreferences | undefined, key: string): boolean {
  if (!prefs) return false;
  const muted = prefs.tokenMuted || prefs.tagMuted || {};
  return Boolean(muted[key]);
}

/**
 * Safe accessor for an article's direct user vote.
 */
export function getArticleVote(prefs: AlgorithmPreferences | undefined, id: number): "up" | "down" | null {
  if (!prefs) return null;
  if (prefs.articleVotes && prefs.articleVotes[id]) return prefs.articleVotes[id];
  if (prefs.articleRatings && prefs.articleRatings[id]) {
    return prefs.articleRatings[id] === "hot" ? "up" : "down";
  }
  return null;
}

/**
 * Visual badge display for weight status.
 */
export function getWeightBadgeText(weight: number, isMuted = false): string {
  if (isMuted) return "🚫 Blocked";
  if (weight > 0) return `▲ +${weight}`;
  if (weight < 0) return `▼ ${weight}`;
  return "Neutral";
}

/**
 * CSS styling classification for a weight value.
 */
export function getWeightVisualClass(weight: number, isMuted = false): string {
  if (isMuted) return "weight-muted";
  if (weight >= 2) return "weight-high-boost";
  if (weight === 1) return "weight-mid-boost";
  if (weight === 0) return "weight-neutral";
  if (weight === -1) return "weight-mid-demote";
  return "weight-high-demote";
}

export const getTemperatureThermalClass = getWeightVisualClass;

/**
 * Extracts a normalized, deduplicated list of tags for an article:
 * Source name + Category + Key entities.
 */
export function extractArticleTags(item: HydratedContentRecord): string[] {
  const tags: string[] = [];
  if (item.source_name && item.source_name.trim()) {
    tags.push(normalizeTokenKey(item.source_name));
  }
  if (item.analysis?.category && item.analysis.category.trim()) {
    tags.push(normalizeTokenKey(item.analysis.category));
  }
  if (item.analysis?.keyEntities && Array.isArray(item.analysis.keyEntities)) {
    for (const ent of item.analysis.keyEntities) {
      if (ent && ent.trim()) {
        const norm = normalizeTokenKey(ent);
        if (!tags.includes(norm)) {
          tags.push(norm);
        }
      }
    }
  }
  return tags.sort();
}

/**
 * Creates a canonical unique key for a set of tags (joined with "|").
 */
export function createVectorKey(tags: string[]): string {
  const uniqueNormalized = Array.from(new Set(tags.map(normalizeTokenKey))).sort();
  return uniqueNormalized.join("|");
}

/**
 * Computes Cosine Similarity between two sets of tags.
 * Overlap count / sqrt(|A| * |B|)
 */
export function computeTagSimilarity(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 || tagsB.length === 0) return 0;
  const setB = new Set(tagsB.map(normalizeTokenKey));
  let overlap = 0;
  for (const t of tagsA) {
    if (setB.has(normalizeTokenKey(t))) overlap++;
  }
  if (overlap === 0) return 0;
  return overlap / Math.sqrt(tagsA.length * tagsB.length);
}

/**
 * Records an upvote or downvote for an article's combination of tags as a simple vector.
 * Multiple votes for a vector change its offset; they do not add duplicate vectors.
 */
export function recordVectorVote(
  prefs: AlgorithmPreferences,
  tags: string[],
  direction: "up" | "down",
  articleId?: number
): { nextPrefs: AlgorithmPreferences; newWeight: number; vectorKey: string } {
  const normTags = Array.from(new Set(tags.map(normalizeTokenKey))).sort();
  const vectorKey = normTags.join("|");
  const existingVectors = { ...(prefs.votedVectors || {}) };
  const existing = existingVectors[vectorKey];

  let nextWeight = 0;
  if (!existing || existing.weight === 0) {
    nextWeight = direction === "up" ? 1 : -1;
  } else if (direction === "up") {
    // If currently downvoted, flip directly to +1. If already upvoted, reinforce (+1 to +2 to +3).
    // If clicked again at max +3 or toggling, reset to 0.
    if (existing.weight < 0) {
      nextWeight = 1;
    } else if (existing.weight >= 3) {
      nextWeight = 0; // reset
    } else {
      nextWeight = existing.weight + 1;
    }
  } else {
    // direction === "down"
    if (existing.weight > 0) {
      nextWeight = -1;
    } else if (existing.weight <= -3) {
      nextWeight = 0; // reset
    } else {
      nextWeight = existing.weight - 1;
    }
  }

  if (nextWeight === 0) {
    delete existingVectors[vectorKey];
  } else {
    existingVectors[vectorKey] = {
      id: vectorKey,
      tags: normTags,
      weight: nextWeight,
      label: normTags.join(", "),
      voteCount: (existing?.voteCount || 0) + 1,
      updatedAt: Date.now(),
    };
  }

  const nextArticleVotes = { ...(prefs.articleVotes || {}) };
  if (articleId !== undefined) {
    if (nextWeight === 0) {
      delete nextArticleVotes[articleId];
    } else {
      nextArticleVotes[articleId] = direction;
    }
  }

  const nextPrefs: AlgorithmPreferences = {
    ...prefs,
    votedVectors: existingVectors,
    articleVotes: nextArticleVotes,
    articleRatings: {
      ...(prefs.articleRatings || {}),
      ...(articleId !== undefined
        ? { [articleId]: nextWeight > 0 ? "hot" : nextWeight < 0 ? "not" : undefined }
        : {}),
    } as Record<number, "hot" | "not">,
  };

  return { nextPrefs, newWeight: nextWeight, vectorKey };
}

/**
 * Calculates the personal algorithmic affinity score for an article
 * by comparing its tag vector to active voted vectors and individual token weights.
 */
export const DEBUG = true;

/**
 * Stores final calculated article ranking scores and weight adjustments.
 */
export interface ArticleScoreResult {
  rankScore: number;
  effectiveScore: number;
  isMuted: boolean;
  totalAdjustment: number;
  aiScore: number;
  sourceWeight: number;
  sourceBoost: number;
  sourceMultiplier: number;
  vectorMultiplier: number;
  vectorAdjustment: number;
  baseValue: number;
  ageHours: number;
  decayFactor: number;
  matchedTags: Array<{ name: string; delta: number; label: string }>;
  debugTooltip: string;
}

/**
 * Converts integer weights into multiplier scaling factors for ranking.
 */
export function weightToSourceMultiplier(weight: number): number {
  switch (weight) {
    case 3:
      return 2.5; // +150% boost
    case 2:
      return 1.8; // +80% boost
    case 1:
      return 1.3; // +30% boost
    case 0:
      return 1.0; // Neutral baseline
    case -1:
      return 0.7; // -30% penalty
    case -2:
      return 0.4; // -60% penalty
    case -3:
      return 0.1; // -90% suppressed
    default:
      if (weight > 3) return Number((2.5 + (weight - 3) * 0.3).toFixed(2));
      if (weight < -3) return 0.05;
      return 1.0;
  }
}

/**
 * Calculates the ranking score using AI relevance, weights, and decay.
 */
export function calculateArticleEffectiveScore(
  item: HydratedContentRecord,
  prefs: AlgorithmPreferences
): ArticleScoreResult {
  const tokenWeights = prefs.tokenWeights || prefs.tagTemperatures || {};
  const tokenMuted = prefs.tokenMuted || prefs.tagMuted || {};
  const tokenSetWeights = prefs.tokenSetWeights || prefs.comboTemperatures || {};
  const votedVectors = prefs.votedVectors || {};

  const analysis = item.analysis;
  const aiScore = Math.max(5, analysis?.relevanceScore ?? 50);

  // Extract all tag keys from this article
  const allTokenKeys = extractArticleTags(item);

  // Check if any tag on this article is explicitly blocked/muted
  const isMuted = allTokenKeys.some((k) => tokenMuted[k] === true);
  if (isMuted) {
    return {
      rankScore: 0,
      effectiveScore: 0,
      isMuted: true,
      totalAdjustment: -100,
      aiScore,
      sourceWeight: 0,
      sourceBoost: 0,
      sourceMultiplier: 0,
      vectorMultiplier: 0,
      vectorAdjustment: 0,
      baseValue: 0,
      ageHours: 0,
      decayFactor: 1,
      matchedTags: [],
      debugTooltip: "Blocked / Muted via Personal Algorithm settings",
    };
  }

  // 1. Source Multiplier
  const sKey = item.source_name ? normalizeTokenKey(item.source_name) : "";
  const sourceWeight = sKey ? (tokenWeights[sKey] ?? 0) : 0;
  const sourceMultiplier = weightToSourceMultiplier(sourceWeight);

  // 2. Vector & Non-Source Concept Multipliers
  const appliedTokens: Array<{ name: string; weight: number }> = [];
  let vectorDelta = 0;

  // Compare against multi-tag voted vectors using Cosine Similarity
  for (const vec of Object.values(votedVectors)) {
    if (!vec || vec.weight === 0 || !vec.tags || vec.tags.length === 0) continue;
    // Skip 1-tag vector that matches the source (source is boosted directly above)
    if (vec.tags.length === 1 && normalizeTokenKey(vec.tags[0]) === sKey) {
      continue;
    }
    const sim = computeTagSimilarity(allTokenKeys, vec.tags);
    if (sim > 0.05) {
      const delta = sim * vec.weight * 0.15;
      vectorDelta += delta;
      appliedTokens.push({
        name: vec.label || vec.tags.slice(0, 3).join(" + "),
        weight: vec.weight,
      });
    }
  }

  // Individual non-source token weights
  for (const key of allTokenKeys) {
    if (key === sKey) continue;
    if (tokenWeights[key] && !votedVectors[key]) {
      const w = tokenWeights[key];
      const sim = 1 / Math.sqrt(Math.max(1, allTokenKeys.length));
      const delta = sim * w * 0.12;
      vectorDelta += delta;
      appliedTokens.push({ name: key, weight: w });
    }
  }

  // Compound pairwise rules
  for (let i = 0; i < allTokenKeys.length; i++) {
    for (let j = i + 1; j < allTokenKeys.length; j++) {
      const setKey = createTokenSetKey(allTokenKeys[i], allTokenKeys[j]);
      if (tokenSetWeights[setKey]) {
        const w = tokenSetWeights[setKey];
        vectorDelta += w * 0.10;
        appliedTokens.push({
          name: `${allTokenKeys[i]} + ${allTokenKeys[j]}`,
          weight: w,
        });
      }
    }
  }

  // Clamped vector multiplier between 0.15x and 3.0x
  const vectorMultiplier = Number(
    Math.max(0.15, Math.min(3.0, 1.0 + vectorDelta)).toFixed(2)
  );

  // 3. Multiplicative Base Value
  const rawBase = aiScore * sourceMultiplier * vectorMultiplier;
  const baseValue = Number(rawBase.toFixed(1));

  // 4. Time Gravity Decay (Gentle 12-hour half-life curve)
  // Decay = 1 + (AgeInHours / 12)^1.2
  const articleTime = new Date(item.published_at || item.created_at).getTime();
  const now = Date.now();
  const ageMs = Math.max(0, now - articleTime);
  const ageHours = ageMs / (1000 * 60 * 60);
  const decayFactor = Number((1 + Math.pow(ageHours / 12, 1.2)).toFixed(2));
  const rankScore = Number((rawBase / decayFactor).toFixed(2));

  // Clamped affinity score (0-100) for standard visual progress meters
  const clampedScore = Math.max(
    0,
    Math.min(100, Math.round(rawBase / 2.5))
  );

  // Formatted Debug Tooltip
  const debugTooltip = [
    `⚡ Rank Score: ${rankScore.toFixed(2)}`,
    `Formula: (AI × Source × Vectors) / [1 + (AgeHours / 12)^1.2]`,
    `──────────────────────────────────────`,
    `• Multipliers:`,
    `   - AI Relevance: ${aiScore}`,
    `   - Source (${item.source_name || "Unknown"}): ${sourceMultiplier.toFixed(2)}× (Weight: ${sourceWeight >= 0 ? "+" : ""}${sourceWeight})`,
    `   - Concept / Vectors: ${vectorMultiplier.toFixed(2)}× (${vectorMultiplier >= 1 ? "+" : ""}${Math.round((vectorMultiplier - 1) * 100)}%)`,
    `• Base Value: ${aiScore} × ${sourceMultiplier.toFixed(2)} × ${vectorMultiplier.toFixed(2)} = ${baseValue}`,
    `• Time Gravity (12h Half-Life):`,
    `   - Age: ${ageHours < 1 ? `${Math.round(ageHours * 60)}m` : `${ageHours.toFixed(1)}h`} (decay: ${decayFactor.toFixed(2)}×)`,
    `• Final: ${baseValue} / ${decayFactor.toFixed(2)} = ${rankScore.toFixed(2)}`,
  ].join("\n");

  return {
    rankScore,
    effectiveScore: clampedScore,
    isMuted: false,
    totalAdjustment: Math.round((sourceMultiplier * vectorMultiplier - 1) * 100),
    aiScore,
    sourceWeight,
    sourceBoost: Math.round((sourceMultiplier - 1) * 100),
    sourceMultiplier,
    vectorMultiplier,
    vectorAdjustment: Math.round((vectorMultiplier - 1) * 100),
    baseValue,
    ageHours,
    decayFactor,
    matchedTags: appliedTokens.map((t) => ({
      name: t.name,
      delta: t.weight,
      label: formatWeightLabel(t.weight),
    })),
    debugTooltip,
  };
}

export const calculateArticleAffinity = calculateArticleEffectiveScore;
