import { db } from "../db";
import { CONFIG } from "../config";
import type { HydratedContentRecord, ProcessedAnalysis } from "../db/schema";
import { getActivePromptVersions } from "./prompt_versioning";

/**
 * Stores candidate story match data for article clustering.
 */
interface StoryClusterCandidate {
  storyId: number;
  title: string;
  representativeContentId: number;
  similarity: number;
  sharedEntities: string[];
}

/**
 * Calculates cosine similarity between two float32 vectors.
 */
export function cosineSimilarity(vecA: number[] | Float32Array, vecB: number[] | Float32Array): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Converts a database buffer into a Float32Array vector.
 */
function bufferToFloatArray(buffer: Buffer): Float32Array {
  return new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
}

/**
 * Assigns an article to an existing story or creates a new story.
 */
export function clusterArticleIntoStory(contentId: number): number {
  const contentRow = db
    .prepare(
      `SELECT c.*, s.name as source_name
       FROM content c
       LEFT JOIN sources s ON s.id = c.source_id
       WHERE c.id = ?`
    )
    .get(contentId) as Record<string, unknown> | undefined;

  if (!contentRow) {
    throw new Error(`Content #${contentId} not found`);
  }

  // If already linked to a valid story, return existing story_id
  if (contentRow.story_id) {
    const existingStory = db
      .prepare("SELECT id FROM stories WHERE id = ?")
      .get(contentRow.story_id);
    if (existingStory) {
      return contentRow.story_id as number;
    }
  }

  let analysis: ProcessedAnalysis | null = null;
  if (contentRow.analysis_json) {
    try {
      analysis = JSON.parse(contentRow.analysis_json as string);
    } catch {}
  }

  const title = (analysis?.title || (contentRow.raw_text as string).slice(0, 80)).trim();
  const entities = (analysis?.keyEntities || []).map((e) => e.toLowerCase());
  const publishedAt = (contentRow.published_at || contentRow.created_at) as string;

  // 1. Get embedding for this content if available
  const embedRow = db
    .prepare("SELECT embedding FROM content_embeddings WHERE content_id = ?")
    .get(contentId) as { embedding: Buffer } | undefined;

  const contentVector = embedRow ? bufferToFloatArray(embedRow.embedding) : null;

  // 2. Query recent active stories (last 7 days)
  const candidateStories = db
    .prepare(
      `SELECT s.*, c.analysis_json, ce.embedding
       FROM stories s
       LEFT JOIN content c ON c.id = s.representative_content_id
       LEFT JOIN content_embeddings ce ON ce.content_id = s.representative_content_id
       WHERE datetime(s.last_updated_at) >= datetime('now', '-7 days')
       ORDER BY s.last_updated_at DESC`
    )
    .all() as Array<{
      id: number;
      title: string;
      summary: string | null;
      representative_content_id: number;
      analysis_json: string | null;
      embedding: Buffer | null;
    }>;

  let bestMatch: StoryClusterCandidate | null = null;
  let highestScore = 0;

  for (const story of candidateStories) {
    let repAnalysis: ProcessedAnalysis | null = null;
    if (story.analysis_json) {
      try {
        repAnalysis = JSON.parse(story.analysis_json);
      } catch {}
    }

    const repEntities = (repAnalysis?.keyEntities || []).map((e) => e.toLowerCase());
    const sharedEntities = entities.filter((e) => repEntities.includes(e));

    // Vector similarity against representative and all child articles in candidate story
    let sim = 0;
    if (contentVector) {
      if (story.embedding) {
        sim = cosineSimilarity(contentVector, bufferToFloatArray(story.embedding));
      }
      try {
        const childRows = db.prepare(`
          SELECT ce.embedding
          FROM content c
          JOIN content_embeddings ce ON ce.content_id = c.id
          WHERE c.story_id = ?
        `).all(story.id) as Array<{ embedding: Buffer | null }>;
        for (const cr of childRows) {
          if (cr.embedding) {
            const childSim = cosineSimilarity(contentVector, bufferToFloatArray(cr.embedding));
            if (childSim > sim) sim = childSim;
          }
        }
      } catch {}
    }

    // Direct title keyword overlap
    const titleWordsA = new Set(title.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const titleWordsB = new Set(story.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    let sharedTitleWords = 0;
    for (const w of titleWordsA) {
      if (titleWordsB.has(w)) sharedTitleWords++;
    }
    const titleOverlapRatio = titleWordsA.size > 0 ? sharedTitleWords / Math.min(titleWordsA.size, titleWordsB.size) : 0;

    // Calibrated Clustering Criteria for BGE-M3 embeddings:
    // 1) High vector similarity (>= 0.68)
    // 2) Moderate vector similarity (>= 0.62) with 1+ shared entity or 25%+ title overlap
    // 3) Strong title word overlap (>= 0.40) with baseline vector similarity (>= 0.55)
    let isMatch = false;
    let matchConfidence = 0;

    if (sim >= 0.68) {
      isMatch = true;
      matchConfidence = sim;
    } else if (sim >= 0.62 && (sharedEntities.length >= 1 || titleOverlapRatio >= 0.25)) {
      isMatch = true;
      matchConfidence = sim + 0.12;
    } else if (titleOverlapRatio >= 0.40 && sim >= 0.55) {
      isMatch = true;
      matchConfidence = 0.70 + titleOverlapRatio * 0.2;
    }

    if (isMatch && matchConfidence > highestScore) {
      highestScore = matchConfidence;
      bestMatch = {
        storyId: story.id,
        title: story.title,
        representativeContentId: story.representative_content_id,
        similarity: sim,
        sharedEntities,
      };
    }
  }

  const activeVersions = getActivePromptVersions();

  if (bestMatch && highestScore >= 0.68) {
    // Attach to existing story!
    const storyId = bestMatch.storyId;
    db.prepare(`
      UPDATE content
      SET story_id = @storyId,
          organiser_version = @version,
          organiser_status = 'completed'
      WHERE id = @contentId
    `).run({
      storyId,
      version: activeVersions.organiser.version,
      contentId,
    });

    // Update story article_count and last_updated_at
    db.prepare(
      `UPDATE stories
       SET article_count = (SELECT COUNT(*) FROM content WHERE story_id = @storyId),
           last_updated_at = (
             SELECT MAX(COALESCE(published_at, created_at))
             FROM content
             WHERE story_id = @storyId
           ),
           updated_at = datetime('now')
       WHERE id = @storyId`
    ).run({ storyId });

    console.log(
      `[StoryClusterer] Merged article #${contentId} ("${title.slice(0, 40)}") into Story #${storyId} ("${bestMatch.title.slice(0, 40)}") [score=${highestScore.toFixed(2)}]`
    );
    return storyId;
  }

  // Create new discrete Story
  const insertStoryStmt = db.prepare(`
    INSERT INTO stories (
      title, summary, category, image_url, representative_content_id,
      is_ai_synthesized, is_followed, article_count,
      first_published_at, last_updated_at
    )
    VALUES (
      @title, @summary, @category, @imageUrl, @contentId,
      0, 0, 1,
      @publishedAt, @publishedAt
    )
    RETURNING id
  `);

  const newStory = insertStoryStmt.get({
    title,
    summary: analysis?.summary || (contentRow.raw_text as string).slice(0, 240),
    category: analysis?.category || "general",
    imageUrl: (contentRow.image_url as string) || null,
    contentId,
    publishedAt,
  }) as { id: number };

  db.prepare(`
    UPDATE content
    SET story_id = @storyId,
        organiser_version = @version,
        organiser_status = 'completed'
    WHERE id = @contentId
  `).run({
    storyId: newStory.id,
    version: activeVersions.organiser.version,
    contentId,
  });

  console.log(`[StoryClusterer] Created new Story #${newStory.id} for article #${contentId}: "${title.slice(0, 50)}"`);
  return newStory.id;
}

/**
 * Groups all completed articles into stories in SQLite.
 */
export function clusterAllContent(): {
  totalContent: number;
  storiesCount: number;
  multiArticleStories: number;
} {
  const completedRows = db
    .prepare(
      `SELECT id FROM content
       WHERE status = 'completed'
       ORDER BY id ASC`
    )
    .all() as Array<{ id: number }>;

  console.log(`[StoryClusterer] Clustering ${completedRows.length} completed articles into stories...`);

  for (const row of completedRows) {
    clusterArticleIntoStory(row.id);
  }

  const storiesCount = (
    db.prepare("SELECT COUNT(*) as count FROM stories").get() as { count: number }
  ).count;

  const multiArticleStories = (
    db.prepare("SELECT COUNT(*) as count FROM stories WHERE article_count > 1").get() as { count: number }
  ).count;

  console.log(
    `[StoryClusterer] Finished: ${completedRows.length} articles clustered into ${storiesCount} stories (${multiArticleStories} contain multiple updates/sources).`
  );

  return {
    totalContent: completedRows.length,
    storiesCount,
    multiArticleStories,
  };
}

if (process.argv[1]?.endsWith("story_clusterer.ts")) {
  clusterAllContent();
}

