import { describe, it, expect } from "vitest";
import {
  normalizeTokenKey,
  normalizeTagKey,
  weightToSourceMultiplier,
  calculateArticleEffectiveScore,
  DEFAULT_ALGORITHM_PREFERENCES,
  type AlgorithmPreferences,
} from "../src/ui/utils/algorithm";
import type { HydratedContentRecord } from "../src/db/schema";

describe("Algorithm Normalization & Weights", () => {
  it("normalizes token keys by trimming and lowercasing", () => {
    expect(normalizeTokenKey("  Artificial Intelligence  ")).toBe("artificial intelligence");
    expect(normalizeTagKey("TECH")).toBe("tech");
  });

  it("converts positive weights into multiplier boosts", () => {
    expect(weightToSourceMultiplier(0)).toBe(1.0);
    expect(weightToSourceMultiplier(1)).toBe(1.3);
    expect(weightToSourceMultiplier(2)).toBe(1.8);
    expect(weightToSourceMultiplier(3)).toBe(2.5);
  });

  it("converts negative weights into demotions", () => {
    expect(weightToSourceMultiplier(-1)).toBe(0.7);
    expect(weightToSourceMultiplier(-2)).toBe(0.4);
    expect(weightToSourceMultiplier(-3)).toBe(0.1);
  });
});

describe("Article Scoring & Ranking", () => {
  const baseItem: HydratedContentRecord = {
    id: 1,
    source_id: 10,
    source_name: "TechCrunch",
    source_url: "https://techcrunch.com/article-1",
    canonical_url: "https://techcrunch.com/article-1",
    raw_text: "Sample article text about artificial intelligence and robotics breakthroughs.",
    content_hash: "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
    image_url: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    status: "completed",
    scout_status: "passed",
    reader_status: "completed",
    organiser_status: "completed",
    curator_status: "completed",
    is_read: 0,
    story_id: null,
    story_title: null,
    story_summary: null,
    story_count: 0,
    analysis_json: JSON.stringify({
      title: "AI Breakthrough Announced",
      summary: "Significant advancement in neural networks.",
      category: "technology",
      sentiment: "positive",
      keyEntities: ["OpenAI", "Robotics"],
      actionItems: [],
      relevanceScore: 80,
    }),
    analysis: {
      title: "AI Breakthrough Announced",
      summary: "Significant advancement in neural networks.",
      category: "technology",
      sentiment: "positive",
      keyEntities: ["OpenAI", "Robotics"],
      actionItems: [],
      relevanceScore: 80,
    },
    tags: [
      { id: 1, content_id: 1, tag_name: "technology", tag_type: "category" },
      { id: 2, content_id: 1, tag_name: "OpenAI", tag_type: "entity" },
      { id: 3, content_id: 1, tag_name: "Robotics", tag_type: "entity" },
    ],
  };

  it("calculates default score based on AI relevance score", () => {
    const result = calculateArticleEffectiveScore(baseItem, DEFAULT_ALGORITHM_PREFERENCES);
    expect(result.isMuted).toBe(false);
    expect(result.effectiveScore).toBeGreaterThan(0);
    expect(result.aiScore).toBe(80);
  });

  it("returns zero and marks isMuted when tag is muted", () => {
    const mutedPrefs: AlgorithmPreferences = {
      ...DEFAULT_ALGORITHM_PREFERENCES,
      tokenMuted: {
        robotics: true,
      },
    };

    const result = calculateArticleEffectiveScore(baseItem, mutedPrefs);
    expect(result.isMuted).toBe(true);
    expect(result.effectiveScore).toBe(0);
    expect(result.rankScore).toBe(0);
  });

  it("boosts score when source has positive weight", () => {
    const boostedSourcePrefs: AlgorithmPreferences = {
      ...DEFAULT_ALGORITHM_PREFERENCES,
      tokenWeights: {
        techcrunch: 2,
      },
    };

    const normal = calculateArticleEffectiveScore(baseItem, DEFAULT_ALGORITHM_PREFERENCES);
    const boosted = calculateArticleEffectiveScore(baseItem, boostedSourcePrefs);
    expect(boosted.effectiveScore).toBeGreaterThan(normal.effectiveScore);
  });

  it("demotes score when source has negative weight", () => {
    const demotedSourcePrefs: AlgorithmPreferences = {
      ...DEFAULT_ALGORITHM_PREFERENCES,
      tokenWeights: {
        techcrunch: -2,
      },
    };

    const normal = calculateArticleEffectiveScore(baseItem, DEFAULT_ALGORITHM_PREFERENCES);
    const demoted = calculateArticleEffectiveScore(baseItem, demotedSourcePrefs);
    expect(demoted.effectiveScore).toBeLessThan(normal.effectiveScore);
  });
});

