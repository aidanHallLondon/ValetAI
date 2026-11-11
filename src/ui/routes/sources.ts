import { Router, Request, Response } from "express";
import { exec } from "node:child_process";
import { CONFIG } from "../../config";
import {
  db,
  CreateSourceInputSchema,
  parseSourceRecord,
  getSetting,
} from "../../db";

export const sourcesRouter = Router();

/**
 * Restarts the Gatherer process immediately using the PM2 CLI.
 */
export function triggerGathererRestart(): Promise<{
  triggered: boolean;
  output: string;
}> {
  return new Promise((resolve) => {
    exec("pm2 restart gatherer", (error, stdout, stderr) => {
      if (error) {
        console.warn(
          `[UI Server] pm2 restart gatherer returned non-zero (${error.message}). stderr: ${stderr.trim()}`
        );
        resolve({
          triggered: false,
          output: stderr.trim() || error.message,
        });
        return;
      }
      resolve({
        triggered: true,
        output: stdout.trim(),
      });
    });
  });
}

/**
 * Curated catalogue of premier RSS feeds aligned with Feeder.co knowledge base
 * and prioritized against the user's About Me directives.
 */
const CATALOGUE_SUGGESTIONS = [
  {
    id: "sug-sidebar-io",
    name: "Sidebar.io",
    url: "https://sidebar.io/feed.xml",
    site_url: "https://sidebar.io",
    type: "rss" as const,
    description: "The 5 best design links every day. Essential reading for UX and digital product design leaders.",
    category: "Design & UX",
    matchReason: "Direct match for 'UX design leadership'",
    baseScore: 98,
    keywords: ["ux", "design", "leadership", "ui", "product"],
  },
  {
    id: "sug-ars-technica",
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    site_url: "https://arstechnica.com",
    type: "rss" as const,
    description: "Original, high-context tech reporting, deep dives into AI breakthroughs, security, and hardware.",
    category: "Technology",
    matchReason: "Direct match for 'high-context technology & CS breakthroughs'",
    baseScore: 97,
    keywords: ["technology", "ai", "computer science", "breakthroughs", "coding"],
  },
  {
    id: "sug-bbc-shropshire",
    name: "BBC News - Shropshire",
    url: "http://feeds.bbci.co.uk/news/england/shropshire/rss.xml",
    site_url: "https://www.bbc.co.uk/news/england/shropshire",
    type: "rss" as const,
    description: "Local news and community developments across Shrewsbury and Shropshire.",
    category: "Local UK",
    matchReason: "Direct match for 'Shrewsbury where I grew up until 18'",
    baseScore: 96,
    keywords: ["shrewsbury", "shropshire", "local uk"],
  },
  {
    id: "sug-quanta",
    name: "Quanta Magazine",
    url: "https://api.quantamagazine.org/feed/",
    site_url: "https://www.quantamagazine.org",
    type: "rss" as const,
    description: "Illuminating theoretical physics, mathematics, and computer science breakthroughs.",
    category: "Science & Maths",
    matchReason: "Direct match for 'accessible science, maths, physics, engineering'",
    baseScore: 95,
    keywords: ["science", "physics", "maths", "engineering", "theoretical"],
  },
  {
    id: "sug-smashing-mag",
    name: "Smashing Magazine",
    url: "https://www.smashingmagazine.com/feed/",
    site_url: "https://www.smashingmagazine.com",
    type: "rss" as const,
    description: "For web designers and developers. Practical insights into UX architecture and front-end engineering.",
    category: "Design & Web",
    matchReason: "Direct match for 'UX design leadership & coding'",
    baseScore: 94,
    keywords: ["ux", "design", "coding", "web", "front-end"],
  },
  {
    id: "sug-notes-from-poland",
    name: "Notes From Poland",
    url: "https://notesfrompoland.com/feed/",
    site_url: "https://notesfrompoland.com",
    type: "rss" as const,
    description: "Independent, fact-checked English-language reporting on Polish society, culture, and affairs.",
    category: "Central Europe",
    matchReason: "Direct match for 'Polish wife & European context'",
    baseScore: 93,
    keywords: ["poland", "polish", "central europe"],
  },
  {
    id: "sug-guardian-uk",
    name: "The Guardian - UK News",
    url: "https://www.theguardian.com/uk-news/rss",
    site_url: "https://www.theguardian.com/uk-news",
    type: "rss" as const,
    description: "Comprehensive UK reporting, policy analysis, and investigative journalism.",
    category: "UK News",
    matchReason: "Matches 'rigorously fact-checked UK reporting'",
    baseScore: 92,
    keywords: ["uk", "london", "investigative", "fact-checked"],
  },
  {
    id: "sug-shropshire-star",
    name: "Shropshire Star",
    url: "https://www.shropshirestar.com/feed/",
    site_url: "https://www.shropshirestar.com",
    type: "rss" as const,
    description: "Daily regional newspaper covering Shrewsbury, Telford, and Shropshire.",
    category: "Local UK",
    matchReason: "Local regional reporting for Shrewsbury",
    baseScore: 91,
    keywords: ["shrewsbury", "shropshire", "local news"],
  },
  {
    id: "sug-mit-tech-review",
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/",
    site_url: "https://www.technologyreview.com",
    type: "rss" as const,
    description: "Authoritative journalism on AI breakthroughs, computing, and commercial biotechnology.",
    category: "Technology",
    matchReason: "Matches 'AI & computer science breakthroughs'",
    baseScore: 90,
    keywords: ["ai", "computing", "technology", "breakthroughs"],
  },
  {
    id: "sug-hacker-news",
    name: "Hacker News (Frontpage)",
    url: "https://news.ycombinator.com/rss",
    site_url: "https://news.ycombinator.com",
    type: "rss" as const,
    description: "Curated community feed of software engineering, CS research, and computer breakthroughs.",
    category: "Coding & CS",
    matchReason: "Matches 'coding breakthroughs & computer science'",
    baseScore: 89,
    keywords: ["coding", "computer science", "software", "algorithms"],
  },
  {
    id: "sug-bbc-london",
    name: "BBC News - London",
    url: "http://feeds.bbci.co.uk/news/england/london/rss.xml",
    site_url: "https://www.bbc.co.uk/news/england/london",
    type: "rss" as const,
    description: "Regional coverage across Greater London, Surrey borders, and local civic issues.",
    category: "Local UK",
    matchReason: "Matches 'London and Cheam/Ewell local news'",
    baseScore: 88,
    keywords: ["london", "cheam", "ewell", "surrey"],
  },
  {
    id: "sug-verge",
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    site_url: "https://www.theverge.com",
    type: "rss" as const,
    description: "Covers the intersection of technology, science, design, and culture.",
    category: "Technology",
    matchReason: "Matches 'technology news'",
    baseScore: 86,
    keywords: ["technology", "design", "science"],
  },
];

/**
 * GET /api/sources
 * Lists all configured external data sources.
 */
sourcesRouter.get("/", (_req: Request, res: Response) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM sources ORDER BY id DESC`)
      .all();
    const sources = rows.map(parseSourceRecord);
    res.json({ sources });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/sources/suggestions
 * Returns suggested RSS feeds scored against user's About Me directives.
 */
sourcesRouter.get("/suggestions", (_req: Request, res: Response) => {
  try {
    const existingRows = db.prepare(`SELECT url, name FROM sources`).all() as { url: string; name: string }[];
    const existingUrls = new Set(existingRows.map((r) => r.url.trim().toLowerCase()));
    const existingNames = new Set(existingRows.map((r) => r.name.trim().toLowerCase()));

    const userNotes = (getSetting<string>("userPreferencesNotes", "") || "").toLowerCase();

    // Filter out already subscribed feeds and adjust score by About Me affinity
    const suggestions = CATALOGUE_SUGGESTIONS
      .filter((sug) => {
        const urlNorm = sug.url.trim().toLowerCase();
        const nameNorm = sug.name.trim().toLowerCase();
        return !existingUrls.has(urlNorm) && !existingNames.has(nameNorm);
      })
      .map((sug) => {
        let score = sug.baseScore;
        // Boost if keywords appear directly in user preferences notes
        const matchedKw = sug.keywords.filter((kw) => userNotes.includes(kw));
        if (matchedKw.length > 0) {
          score = Math.min(99, score + matchedKw.length * 2);
        }
        return {
          id: sug.id,
          name: sug.name,
          url: sug.url,
          site_url: sug.site_url,
          type: sug.type,
          description: sug.description,
          category: sug.category,
          matchReason: sug.matchReason,
          suitabilityScore: score,
        };
      })
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    res.json({ suggestions });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/sources/inspect?url=...
 * Inspects a source URL to auto-populate title/name, feed type, and favicon.
 */
sourcesRouter.get("/inspect", async (req: Request, res: Response) => {
  const urlParam = req.query.url;
  if (typeof urlParam !== "string" || !urlParam) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  try {
    const targetUrl = new URL(urlParam);
    const origin = targetUrl.origin;
    const defaultFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(targetUrl.hostname)}&sz=64`;

    const response = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": CONFIG.GATHERER.USER_AGENT,
        Accept: CONFIG.GATHERER.ACCEPT_HEADER,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      res.json({
        name: targetUrl.hostname.replace(/^www\./, ""),
        type: "web",
        favicon: defaultFavicon,
      });
      return;
    }

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    let detectedType: "web" | "rss" | "json" = "web";
    let detectedName = "";
    let detectedDescription = "";
    let detectedSiteUrl = origin;

    if (contentType.includes("json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
      detectedType = "json";
      detectedName = targetUrl.hostname.replace(/^www\./, "") + " API";
    } else if (
      contentType.includes("xml") ||
      contentType.includes("rss") ||
      contentType.includes("atom") ||
      text.includes("<rss") ||
      text.includes("<feed")
    ) {
      detectedType = "rss";
      const { parseFeedMetadata } = await import("../../gatherer/index");
      const meta = parseFeedMetadata(text, targetUrl.toString());
      if (meta.title) detectedName = meta.title;
      if (meta.description) detectedDescription = meta.description;
      if (meta.link) detectedSiteUrl = meta.link;
    } else {
      detectedType = "web";
      const { parseHtmlMetadata } = await import("../../gatherer/index");
      const meta = parseHtmlMetadata(text, targetUrl.toString());
      if (meta.title) detectedName = meta.title;
      if (meta.description) detectedDescription = meta.description;
      if (meta.link) detectedSiteUrl = meta.link;
    }

    if (!detectedName) {
      detectedName = targetUrl.hostname
        .replace(/^www\./, "")
        .split(".")[0];
      detectedName = detectedName.charAt(0).toUpperCase() + detectedName.slice(1);
    }

    res.json({
      name: detectedName,
      type: detectedType,
      description: detectedDescription || undefined,
      siteUrl: detectedSiteUrl || undefined,
      favicon: defaultFavicon,
    });
  } catch (err) {
    try {
      const u = new URL(urlParam);
      res.json({
        name: u.hostname.replace(/^www\./, ""),
        type: "web",
        favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=64`,
      });
    } catch {
      res.status(400).json({ error: "Invalid URL" });
    }
  }
});

/**
 * POST /api/sources
 * Adds a new data source and triggers Gatherer restart.
 */
sourcesRouter.post("/", async (req: Request, res: Response) => {
  const parsedInput = CreateSourceInputSchema.safeParse(req.body);
  if (!parsedInput.success) {
    res.status(400).json({
      error: parsedInput.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  const { name, url, type, description, site_url } = parsedInput.data;

  try {
    const insertedRow = db
      .prepare(
        `INSERT INTO sources (name, url, type, enabled, description, site_url, last_fetch_count)
         VALUES (@name, @url, @type, 1, @description, @site_url, 0)
         RETURNING *`
      )
      .get({
        name,
        url,
        type,
        description: description || null,
        site_url: site_url || null,
      });

    const source = parseSourceRecord(insertedRow);
    const pm2Result = await triggerGathererRestart();

    res.status(201).json({
      source,
      gathererRestart: pm2Result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("UNIQUE constraint failed") ? 409 : 500;
    res.status(status).json({
      error:
        status === 409
          ? "A data source with this URL already exists."
          : message,
    });
  }
});

/**
 * PATCH /api/sources/:id/toggle
 * Enables or disables an existing data source.
 */
sourcesRouter.patch("/:id/toggle", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid source ID" });
    return;
  }

  const updated = db
    .prepare(
      `UPDATE sources
       SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END
       WHERE id = @id
       RETURNING *`
    )
    .get({ id });

  if (!updated) {
    res.status(404).json({ error: "Source not found" });
    return;
  }

  res.json({ source: parseSourceRecord(updated) });
});

/**
 * POST /api/sources/:id/refresh
 * Immediately harvests content from a single specific source.
 */
sourcesRouter.post("/:id/refresh", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid source ID" });
    return;
  }

  const sourceRow = db.prepare("SELECT * FROM sources WHERE id = ?").get(id);
  if (!sourceRow) {
    res.status(404).json({ error: "Source not found" });
    return;
  }

  const source = parseSourceRecord(sourceRow);
  try {
    const {
      extractReadableText,
      parseRssFeed,
      computeContentHash,
      parseFeedMetadata,
      parseHtmlMetadata,
    } = await import("../../gatherer/index");
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

    const isRss =
      source.type === "rss" ||
      contentType.includes("xml") ||
      rawBody.includes("<rss") ||
      rawBody.includes("<feed");

    let extractedDescription: string | null = null;
    let extractedSiteUrl: string | null = null;

    if (isRss) {
      const meta = parseFeedMetadata(rawBody, source.url);
      if (meta.description) extractedDescription = meta.description;
      if (meta.link) extractedSiteUrl = meta.link;
    } else {
      const meta = parseHtmlMetadata(rawBody, source.url);
      if (meta.description) extractedDescription = meta.description;
      if (meta.link) extractedSiteUrl = meta.link;
    }

    const checkDuplicateStmt = db.prepare(
      "SELECT id FROM content WHERE content_hash = ? LIMIT 1"
    );

    const insertStmt = db.prepare(`
      INSERT INTO content (source_id, source_url, raw_text, content_hash, image_url, published_at, status)
      VALUES (@source_id, @source_url, @raw_text, @content_hash, @image_url, @published_at, 'pending')
    `);

    let inserted = 0;
    if (isRss) {
      const items = parseRssFeed(rawBody, source.url);
      for (const item of items.slice(0, 8)) {
        const hash = computeContentHash(item.text, item.title);
        if (!checkDuplicateStmt.get(hash)) {
          insertStmt.run({
            source_id: source.id,
            source_url: item.url || source.url,
            raw_text: item.text,
            content_hash: hash,
            image_url: item.imageUrl || null,
            published_at: item.publishedAt || new Date().toISOString(),
          });
          inserted++;
        }
      }
    } else {
      const text = extractReadableText(rawBody, contentType, source.type);
      if (text) {
        const hash = computeContentHash(text);
        if (!checkDuplicateStmt.get(hash)) {
          insertStmt.run({
            source_id: source.id,
            source_url: source.url,
            raw_text: text,
            content_hash: hash,
            image_url: null,
            published_at: new Date().toISOString(),
          });
          inserted++;
        }
      }
    }

    db.prepare(`
      UPDATE sources
      SET last_fetched_at = datetime('now'),
          last_fetch_count = @inserted,
          description = COALESCE(@description, description),
          site_url = COALESCE(@siteUrl, site_url)
      WHERE id = @id
    `).run({
      id: source.id,
      inserted,
      description: extractedDescription,
      siteUrl: extractedSiteUrl,
    });
    res.json({ success: true, refreshed: true, inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /api/sources/:id
 * Removes a data source from the database.
 */
sourcesRouter.delete("/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid source ID" });
    return;
  }

  const info = db.prepare(`DELETE FROM sources WHERE id = @id`).run({ id });
  if (info.changes === 0) {
    res.status(404).json({ error: "Source not found" });
    return;
  }

  res.json({ deleted: true, id });
});

