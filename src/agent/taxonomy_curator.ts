import { db } from "../db";
import type { ProcessedAnalysis } from "../db/schema";
import { cosineSimilarity } from "./story_clusterer";
import { getActivePromptVersions } from "./prompt_versioning";

/**
 * Defines a curated category shelf with article counts and entities.
 */
export interface CuratedShelf {
  id: string;
  title: string;
  icon: string;
  description: string;
  articleCount: number;
  topEntities: string[];
  sampleArticles: Array<{ id: number; title: string }>;
}

/**
 * Stores complete curation metrics and active knowledge shelves.
 */
export interface TaxonomyCuratorResult {
  totalArticlesAnalyzed: number;
  totalVectorsScanned: number;
  totalEntitiesConsolidated: number;
  shelves: CuratedShelf[];
  lastCuratedAt: string;
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

// Canonical shelf archetypes for theme classification
const SHELF_ARCHETYPES = [
  {
    id: "geopolitics-policy",
    title: "Geopolitics & Global Affairs",
    icon: "🌍",
    keywords: ["russia", "ukraine", "us", "china", "iran", "korea", "poland", "war", "military", "treaty", "nato", "sanctions", "protests", "looting", "government", "oleshky"],
    description: "International relations, national defense, diplomatic policy, and conflict coverage.",
  },
  {
    id: "crypto-cyber",
    title: "Crypto, Cyber & Security",
    icon: "🔐",
    keywords: ["binance", "crypto", "bitcoin", "ether", "hack", "stolen", "cyber", "malware", "fbi", "blockchain", "exploit", "north korea", "recovery"],
    description: "Digital assets, cybersecurity exploits, threat intelligence, and protocol security.",
  },
  {
    id: "ai-compute",
    title: "AI, Compute & Semiconductors",
    icon: "💻",
    keywords: ["ai", "intel", "nvidia", "openai", "nscale", "chip", "semiconductor", "model", "llm", "deepmind", "gpu", "datacenter", "inference", "compute", "cloud"],
    description: "Machine intelligence models, hardware accelerators, silicon fabrication, and datacenter infrastructure.",
  },
  {
    id: "finance-markets",
    title: "Finance & Economy",
    icon: "📈",
    keywords: ["markets", "economy", "inflation", "interest", "rates", "fed", "stocks", "earnings", "revenue", "bank", "cost-of-living", "venture", "capital"],
    description: "Macroeconomic indicators, monetary policy, market liquidity, and institutional capital.",
  },
  {
    id: "science-energy",
    title: "Science & Energy Systems",
    icon: "🔬",
    keywords: ["energy", "climate", "battery", "storage", "fusion", "solar", "nuclear", "research", "physics", "biology", "space", "biotech"],
    description: "Scientific discoveries, next-generation power infrastructure, and research papers.",
  },
  {
    id: "culture-society",
    title: "Culture, Media & Society",
    icon: "📰",
    keywords: ["celebrity", "entertainment", "bushby", "film", "music", "books", "society", "lifestyle", "sports", "bbc", "reuters"],
    description: "Societal developments, arts, human interest investigations, and media coverage.",
  },
];

/**
 * Curates all completed articles into macro topic shelves.
 */
export function curateTaxonomy(): TaxonomyCuratorResult {
  console.log("[TaxonomyCurator] Starting full library taxonomy curation pass...");

  // 1. Fetch completed articles with analysis
  const contentRows = db
    .prepare(
      `SELECT c.id, c.raw_text, c.analysis_json, ce.embedding
       FROM content c
       LEFT JOIN content_embeddings ce ON ce.content_id = c.id
       WHERE c.status = 'completed'
       ORDER BY c.id DESC`
    )
    .all() as Array<{
      id: number;
      raw_text: string;
      analysis_json: string | null;
      embedding: Buffer | null;
    }>;

  let totalVectors = 0;
  const entityCounts = new Map<string, number>();
  const entityAliases = new Map<string, string>(); // alias -> canonical

  interface ParsedArticle {
    id: number;
    title: string;
    summary: string;
    entities: string[];
    category: string;
    vector: Float32Array | null;
  }

  const articles: ParsedArticle[] = [];

  for (const row of contentRows) {
    let analysis: ProcessedAnalysis | null = null;
    if (row.analysis_json) {
      try {
        analysis = JSON.parse(row.analysis_json);
      } catch {}
    }

    const title = (analysis?.title || row.raw_text.slice(0, 80)).trim();
    const summary = (analysis?.summary || "").trim();
    const rawEntities = analysis?.keyEntities || [];
    const category = analysis?.category || "general";
    const vector = row.embedding ? bufferToFloatArray(row.embedding) : null;
    if (vector) totalVectors++;

    // Consolidate entities
    const cleanedEntities: string[] = [];
    for (const raw of rawEntities) {
      const trimmed = raw.trim();
      if (!trimmed || trimmed.length < 2) continue;

      // Filter out pure noise sources like "Reuters", "BBC News" from topical entities
      const lower = trimmed.toLowerCase();
      if (lower === "reuters" || lower === "bbc" || lower === "bbc news" || lower === "bbc technews") {
        continue;
      }

      // Canonicalize common acronyms/variants
      let canonical = trimmed;
      if (lower === "u.s." || lower === "united states" || lower === "usa") canonical = "US";
      else if (lower === "u.k." || lower === "united kingdom") canonical = "UK";
      else if (lower === "ai" || lower === "artificial intelligence") canonical = "Artificial Intelligence";
      else if (lower === "llm" || lower === "llms" || lower === "large language models") canonical = "Large Language Models";
      else if (lower.includes("binance")) canonical = "Binance";

      entityAliases.set(trimmed, canonical);
      entityCounts.set(canonical, (entityCounts.get(canonical) || 0) + 1);
      if (!cleanedEntities.includes(canonical)) {
        cleanedEntities.push(canonical);
      }
    }

    articles.push({
      id: row.id,
      title,
      summary,
      entities: cleanedEntities,
      category,
      vector,
    });
  }

  // 2. Classify articles into macro shelves based on keyword affinity & semantic centroids
  const shelfBuckets = new Map<
    string,
    {
      archetype: typeof SHELF_ARCHETYPES[0];
      articles: ParsedArticle[];
      entityFreq: Map<string, number>;
    }
  >();

  for (const arch of SHELF_ARCHETYPES) {
    shelfBuckets.set(arch.id, {
      archetype: arch,
      articles: [],
      entityFreq: new Map(),
    });
  }

  // Assign each article to best matching shelf archetype
  for (const art of articles) {
    const textBlob = `${art.title} ${art.summary} ${art.entities.join(" ")}`.toLowerCase();

    let bestShelfId = "culture-society";
    let highestScore = 0;

    for (const arch of SHELF_ARCHETYPES) {
      let score = 0;
      for (const kw of arch.keywords) {
        if (textBlob.includes(kw)) {
          score += 2;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestShelfId = arch.id;
      }
    }

    // Default fallback based on category if keyword score is 0
    if (highestScore === 0) {
      if (art.category === "finance") bestShelfId = "finance-markets";
      else if (art.category === "technology") bestShelfId = "ai-compute";
      else if (art.category === "research") bestShelfId = "science-energy";
    }

    const bucket = shelfBuckets.get(bestShelfId);
    if (bucket) {
      bucket.articles.push(art);
      for (const ent of art.entities) {
        bucket.entityFreq.set(ent, (bucket.entityFreq.get(ent) || 0) + 1);
      }
    }
  }

  // Stamp curator version and shelf on all processed content in database
  const activeVersions = getActivePromptVersions();
  const updateContentShelfStmt = db.prepare(`
    UPDATE content
    SET curator_version = @version,
        curator_status = 'completed',
        curated_shelf = @shelf
    WHERE id = @contentId
  `);

  for (const [shelfId, bucket] of shelfBuckets.entries()) {
    for (const art of bucket.articles) {
      updateContentShelfStmt.run({
        version: activeVersions.curator.version,
        shelf: shelfId,
        contentId: art.id,
      });
    }
  }

  // 3. Construct curated shelf objects (only for shelves that actually have articles)
  const resultShelves: CuratedShelf[] = [];

  for (const [_shelfId, bucket] of shelfBuckets.entries()) {
    if (bucket.articles.length === 0) continue;

    const topEntities = Array.from(bucket.entityFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ent]) => ent);

    const sampleArticles = bucket.articles.slice(0, 3).map((a) => ({
      id: a.id,
      title: a.title,
    }));

    resultShelves.push({
      id: bucket.archetype.id,
      title: bucket.archetype.title,
      icon: bucket.archetype.icon,
      description: bucket.archetype.description,
      articleCount: bucket.articles.length,
      topEntities,
      sampleArticles,
    });
  }

  // Sort shelves by article volume descending
  resultShelves.sort((a, b) => b.articleCount - a.articleCount);

  const result: TaxonomyCuratorResult = {
    totalArticlesAnalyzed: articles.length,
    totalVectorsScanned: totalVectors,
    totalEntitiesConsolidated: entityCounts.size,
    shelves: resultShelves,
    lastCuratedAt: new Date().toISOString(),
  };

  // 4. Cache result into database settings table
  try {
    const existingRow = db.prepare("SELECT value FROM settings WHERE key = 'curated_taxonomy'").get();
    if (existingRow) {
      db.prepare("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'curated_taxonomy'").run(
        JSON.stringify(result)
      );
    } else {
      db.prepare("INSERT INTO settings (key, value) VALUES ('curated_taxonomy', ?)").run(
        JSON.stringify(result)
      );
    }
  } catch (err) {
    console.warn("[TaxonomyCurator] Could not persist to settings table:", err);
  }

  console.log(
    `[TaxonomyCurator] Completed curation: Scanned ${articles.length} articles & ${totalVectors} vectors. Created ${resultShelves.length} macro shelves.`
  );

  return result;
}

/**
 * Returns cached curated shelves or computes fresh shelves.
 */
export function getCuratedTaxonomy(): TaxonomyCuratorResult {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'curated_taxonomy'").get() as
      | { value: string }
      | undefined;
    if (row && row.value) {
      return JSON.parse(row.value);
    }
  } catch {}

  return curateTaxonomy();
}

