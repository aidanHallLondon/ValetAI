import crypto from "node:crypto";
import { db, getSetting, parseSourceRecord, parseContentRecord } from "../db";
import type { SourceRecord } from "../db/schema";
import { CONFIG } from "../config";

/**
 * Defines raw article data collected from an external source.
 */
export interface ParsedGatheredItem {
  title?: string;
  url?: string;
  text: string;
  imageUrl?: string;
  publishedAt?: string;
}

/**
 * Converts HTML entities into standard text characters.
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&hellip;/g, "...")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "--")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Removes HTML tags and extracts clean text for processing.
 */
export function stripHtmlAndEntities(raw: string, preserveParagraphs: boolean = false): string {
  if (!raw) return "";
  let text = raw;
  // Unwrap nested/double-encoded XML/HTML entities
  for (let i = 0; i < 3; i++) {
    text = decodeHtmlEntities(text);
  }
  // Strip scripts, styles, CDATA markers, and HTML comments
  text = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");
  // Decode entities one final time in case CDATA had them
  text = decodeHtmlEntities(text);

  if (preserveParagraphs) {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n\n")
      .trim();
  }

  // Collapse whitespace
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Combines title and description text without duplicate words.
 */
export function combineTitleAndDesc(title: string, desc: string): string {
  const t = title.trim();
  const d = desc.trim();
  if (!d) return t;
  if (!t) return d;

  const tNorm = t.toLowerCase().replace(/[^a-z0-9]/g, "");
  const dNorm = d.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (dNorm.includes(tNorm) || tNorm.includes(dNorm)) {
    return t.length >= d.length ? t : d;
  }

  return `${t}\n\n${d}`;
}

/**
 * Resolves Google News redirect URLs to original publisher links.
 */
export async function decodeGoogleNewsUrl(sourceUrl: string): Promise<string> {
  try {
    const parsed = new URL(sourceUrl);
    if (!parsed.hostname.includes("news.google.com")) return sourceUrl;
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (!lastPart || lastPart === "articles" || lastPart === "rss") return sourceUrl;

    const res = await fetch(`https://news.google.com/rss/articles/${lastPart}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return sourceUrl;
    const html = await res.text();
    const sgMatch = html.match(/data-n-a-sg=["']([^"']+)["']/);
    const tsMatch = html.match(/data-n-a-ts=["']([^"']+)["']/);
    if (!sgMatch || !tsMatch) return sourceUrl;

    const sg = sgMatch[1];
    const ts = tsMatch[1];
    const payload = [
      "Fbv4je",
      JSON.stringify([
        "garturlreq",
        [
          ["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1],
          "X",
          "X",
          1,
          [1, 1, 1],
          1,
          1,
          null,
          0,
          0,
          null,
          0,
        ],
        lastPart,
        parseInt(ts, 10),
        sg,
      ]),
    ];
    const reqData = `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`;

    const postRes = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Origin: "https://news.google.com",
        Referer: "https://news.google.com/",
      },
      body: reqData,
      signal: AbortSignal.timeout(4000),
    });
    if (!postRes.ok) return sourceUrl;
    const text = await postRes.text();
    const splitParts = text.split("\n\n");
    if (splitParts.length < 2) return sourceUrl;
    const parsedData = JSON.parse(splitParts[1]);
    const batchResponses = parsedData.filter(
      (d: any) => (d[0] === "wrb.fr" || d[0] === "w779db") && d[1] === "Fbv4je"
    );
    if (batchResponses.length === 0) return sourceUrl;
    const innerData = JSON.parse(batchResponses[0][2]);
    return innerData[1] || sourceUrl;
  } catch {
    return sourceUrl;
  }
}

/**
 * Removes tracking query parameters and hash fragments from URLs.
 */
export function normalizeCanonicalUrl(rawUrl: string): string {
  try {
    const decoded = rawUrl.replace(/&amp;/g, "&").trim();
    const parsed = new URL(decoded);

    // Feed and campaign tracking parameters to strip
    const TRACKING_PARAMS = new Set([
      "at_medium",
      "at_campaign",
      "at_custom1",
      "at_custom2",
      "at_custom3",
      "at_custom4",
      "oc",
      "ref",
      "source",
      "fbclid",
      "gclid",
      "msclkid",
      "mc_cid",
      "mc_eid",
    ]);

    const cleanParams = new URLSearchParams();
    for (const [key, value] of parsed.searchParams.entries()) {
      const lower = key.toLowerCase();
      if (!lower.startsWith("utm_") && !TRACKING_PARAMS.has(lower)) {
        cleanParams.append(key, value);
      }
    }

    cleanParams.sort();
    parsed.search = cleanParams.toString() ? `?${cleanParams.toString()}` : "";
    parsed.hash = "";

    let finalUrl = parsed.toString();
    if (parsed.pathname.length > 1 && finalUrl.endsWith("/")) {
      finalUrl = finalUrl.slice(0, -1);
    }
    return finalUrl;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Generates a SHA-256 hash to detect duplicate content in SQLite.
 */
export function computeContentHash(text: string, title?: string): string {
  const normalized = (title ? `${title.trim().toLowerCase()}\n` : "") + text.trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Extracts channel title, description, and website link from feed XML.
 */
export function parseFeedMetadata(xml: string, baseUrl: string): { title?: string; description?: string; link?: string } {
  const firstItemIndex = xml.search(/<(item|entry)\b/i);
  const headerBlock = firstItemIndex !== -1 ? xml.substring(0, firstItemIndex) : xml;

  const titleMatch = headerBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
  const descMatch = headerBlock.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
                    headerBlock.match(/<subtitle>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/subtitle>/i);
  const linkMatch = headerBlock.match(/<link[^>]*href=["']([^"']+)["']/i) ||
                    headerBlock.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);

  const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : undefined;
  const description = descMatch
    ? descMatch[1]
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : undefined;

  let link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : undefined;
  if (link && !link.startsWith("http")) {
    try {
      link = new URL(link, baseUrl).toString();
    } catch {
      link = undefined;
    }
  }

  return { title, description, link };
}

/**
 * Extracts title, description, and canonical link from HTML pages.
 */
export function parseHtmlMetadata(html: string, baseUrl: string): { title?: string; description?: string; link?: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  const linkMatch = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
                    html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']*)["']/i);

  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : undefined;
  const description = descMatch ? descMatch[1].replace(/\s+/g, " ").trim() : undefined;
  const link = linkMatch ? linkMatch[1].trim() : baseUrl;

  return { title, description, link };
}

/**
 * Parses RSS and Atom XML feeds into structured article items.
 */
export function parseRssFeed(xml: string, baseUrl: string): ParsedGatheredItem[] {
  const items: ParsedGatheredItem[] = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];

  for (const block of itemMatches) {
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const descMatch = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
                      block.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i) ||
                      block.match(/<summary>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i);
    const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i) ||
                      block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const pubDateMatch = block.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i) ||
                         block.match(/<published>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/published>/i) ||
                         block.match(/<updated>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/updated>/i);

    // Extract image thumbnail from media:thumbnail, media:content, or enclosure
    const mediaThumbMatch = block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i) ||
                            block.match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
                            block.match(/<enclosure[^>]+type=["']image\/[^"']+["'][^>]+url=["']([^"']+)["']/i) ||
                            block.match(/<img[^>]+src=["']([^"']+)["']/i);

    const title = titleMatch ? stripHtmlAndEntities(titleMatch[1]) : "";
    const description = descMatch ? stripHtmlAndEntities(descMatch[1]) : "";
    const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : baseUrl;
    const pubDate = pubDateMatch ? pubDateMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
    const imageUrl = mediaThumbMatch ? mediaThumbMatch[1].trim() : undefined;

    const rawText = combineTitleAndDesc(title, description);

    if (rawText.length > 10) {
      items.push({
        title,
        url: link,
        text: rawText.slice(0, CONFIG.GATHERER.MAX_TEXT_LENGTH),
        imageUrl,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
      });
    }
  }

  return items;
}

/**
 * Extracts clean text from raw HTML or JSON response bodies.
 */
export function extractReadableText(rawBody: string, contentType: string, sourceType: string): string {
  const trimmed = rawBody.trim();

  if (sourceType === "json" || contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2).slice(0, CONFIG.GATHERER.MAX_TEXT_LENGTH);
    } catch {
      return trimmed.slice(0, CONFIG.GATHERER.MAX_TEXT_LENGTH);
    }
  }

  return stripHtmlAndEntities(trimmed).slice(0, CONFIG.GATHERER.MAX_TEXT_LENGTH);
}

/**
 * Executes async tasks with bounded concurrency using a worker pool.
 */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrencyLimit: number,
  taskFn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await taskFn(items[index]);
    }
  }

  const poolSize = Math.max(1, Math.min(concurrencyLimit, items.length));
  const workers = Array.from({ length: poolSize }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Fetches and processes an individual source.
 * Catches errors locally so parallel workers continue.
 */
async function fetchAndProcessSource(
  source: SourceRecord,
  stmts: {
    checkDuplicateStmt: any;
    checkCanonicalStmt: any;
    updateExistingContentStmt: any;
    insertContentStmt: any;
    updateSourceFetchedStmt: any;
  }
): Promise<number> {
  let insertedForThisSource = 0;
  let extractedDescription: string | null = null;
  let extractedSiteUrl: string | null = null;

  try {
    console.log(`[Gatherer] Fetching source #${source.id} (${source.name}): ${source.url}`);
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": CONFIG.GATHERER.USER_AGENT,
        Accept: CONFIG.GATHERER.ACCEPT_HEADER,
      },
      signal: AbortSignal.timeout(CONFIG.GATHERER.FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") ?? "text/plain";
    const rawBody = await response.text();

    // Check if this is an RSS/Atom feed with multiple discrete items
    const isRss =
      source.type === "rss" ||
      contentType.includes("xml") ||
      rawBody.includes("<rss") ||
      rawBody.includes("<feed");

    let itemsToInsert: ParsedGatheredItem[] = [];

    if (isRss) {
      const meta = parseFeedMetadata(rawBody, source.url);
      if (meta.description) extractedDescription = meta.description;
      if (meta.link) extractedSiteUrl = meta.link;

      const parsedItems = parseRssFeed(rawBody, source.url);
      // Ingest all available discrete items from feed (SHA-256 and URL deduplication prevent duplicates)
      itemsToInsert = parsedItems;
    } else {
      const meta = parseHtmlMetadata(rawBody, source.url);
      if (meta.description) extractedDescription = meta.description;
      if (meta.link) extractedSiteUrl = meta.link;

      const text = extractReadableText(rawBody, contentType, source.type);
      if (text) {
        itemsToInsert = [{ text, url: source.url }];
      }
    }

    for (const item of itemsToInsert) {
      let finalItemUrl = item.url || source.url;
      if (finalItemUrl.includes("news.google.com")) {
        try {
          const decoded = await decodeGoogleNewsUrl(finalItemUrl);
          if (decoded && decoded !== finalItemUrl) {
            finalItemUrl = decoded;
            item.url = decoded;
          }
        } catch {}
      }

      const canonicalUrl = normalizeCanonicalUrl(finalItemUrl);
      const contentHash = computeContentHash(item.text, item.title);

      // 1. Check if this exact source article already exists via canonical URL
      const existingCanonical = stmts.checkCanonicalStmt.get(source.id, canonicalUrl) as
        | { id: number; content_hash: string; raw_text: string }
        | undefined;

      if (existingCanonical) {
        // If the text hasn't changed at all, skip
        if (existingCanonical.content_hash === contentHash) {
          continue;
        }

        // Developing story / article revision on the same source URL!
        // Update the existing row in-place rather than creating a duplicate
        stmts.updateExistingContentStmt.run({
          id: existingCanonical.id,
          raw_text: item.text,
          content_hash: contentHash,
          image_url: item.imageUrl || null,
          published_at: item.publishedAt || new Date().toISOString(),
        });

        console.log(
          `[Gatherer] Updated in-place revised content #${existingCanonical.id} for "${item.title || "n/a"}" (${canonicalUrl})`
        );
        continue;
      }

      // 2. Strict Deduplication Check via content hash (for identical content without matching URL)
      const existingHash = stmts.checkDuplicateStmt.get(contentHash);
      if (existingHash) {
        continue;
      }

      // 3. Insert new unique content item
      const insertedRow = stmts.insertContentStmt.get({
        source_id: source.id,
        source_url: finalItemUrl,
        canonical_url: canonicalUrl,
        raw_text: item.text,
        content_hash: contentHash,
        image_url: item.imageUrl || null,
        published_at: item.publishedAt || new Date().toISOString(),
      });

      const validatedRecord = parseContentRecord(insertedRow);
      insertedForThisSource++;

      console.log(
        `[Gatherer] Inserted new unique content #${validatedRecord.id} (hash=${contentHash.slice(0, 8)}, title="${item.title || "n/a"}")`
      );
    }

    stmts.updateSourceFetchedStmt.run({
      id: source.id,
      insertedCount: insertedForThisSource,
      description: extractedDescription,
      siteUrl: extractedSiteUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Gatherer] Error fetching source #${source.id} (${source.url}): ${message}`);
  }

  return insertedForThisSource;
}

/**
 * Fetches enabled sources and inserts new pending rows into SQLite.
 */
export async function runGathererOnce(): Promise<number> {
  const isPaused = getSetting<boolean>("backgroundProcessingPaused", false);
  if (isPaused) {
    console.log("[Gatherer] Background processing is paused. Skipping harvest.");
    return 0;
  }

  console.log(`[Gatherer] Starting scheduled one-shot harvest at ${new Date().toISOString()}`);

  const rawSources = db
    .prepare("SELECT * FROM sources WHERE enabled = 1 ORDER BY id ASC")
    .all();

  const sources = rawSources.map(parseSourceRecord);

  if (sources.length === 0) {
    console.log("[Gatherer] No enabled data sources configured in SQLite. Exiting cleanly.");
    return 0;
  }

  const checkDuplicateStmt = db.prepare(
    "SELECT id FROM content WHERE content_hash = ? LIMIT 1"
  );

  const checkCanonicalStmt = db.prepare(
    "SELECT id, content_hash, raw_text, status, published_at FROM content WHERE source_id = ? AND canonical_url = ? LIMIT 1"
  );

  const updateExistingContentStmt = db.prepare(`
    UPDATE content
    SET raw_text = @raw_text,
        content_hash = @content_hash,
        image_url = COALESCE(@image_url, image_url),
        published_at = COALESCE(@published_at, published_at),
        updated_at = datetime('now')
    WHERE id = @id
  `);

  const insertContentStmt = db.prepare(`
    INSERT INTO content (source_id, source_url, canonical_url, raw_text, content_hash, image_url, published_at, status)
    VALUES (@source_id, @source_url, @canonical_url, @raw_text, @content_hash, @image_url, @published_at, 'pending')
    RETURNING *
  `);

  const updateSourceFetchedStmt = db.prepare(`
    UPDATE sources
    SET last_fetched_at = datetime('now'),
        last_fetch_count = @insertedCount,
        description = COALESCE(@description, description),
        site_url = COALESCE(@siteUrl, site_url)
    WHERE id = @id
  `);

  const stmts = {
    checkDuplicateStmt,
    checkCanonicalStmt,
    updateExistingContentStmt,
    insertContentStmt,
    updateSourceFetchedStmt,
  };

  const results = await runWithConcurrency(
    sources,
    CONFIG.GATHERER.CONCURRENCY,
    (source) => fetchAndProcessSource(source, stmts)
  );

  const insertedCount = results.reduce((sum, count) => sum + count, 0);

  console.log(`[Gatherer] Harvest complete. Inserted ${insertedCount} new unique item(s).`);
  return insertedCount;
}

// Run immediately and exit cleanly when invoked as an entry point by PM2
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("src/gatherer/index.ts") ||
    process.argv[1].endsWith("src/gatherer"));

if (isMainModule) {
  runGathererOnce()
    .then(() => {
      db.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Gatherer] Fatal error:", err);
      db.close();
      process.exit(1);
    });
}
