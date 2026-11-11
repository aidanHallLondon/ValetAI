import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "../src/agent/story_clusterer";
import {
  normalizeCanonicalUrl,
  computeContentHash,
  stripHtmlAndEntities,
  decodeHtmlEntities,
} from "../src/gatherer";

describe("Vector & Cosine Similarity", () => {
  it("calculates exact similarity for identical vectors", () => {
    const vecA = [1, 2, 3];
    const vecB = [1, 2, 3];
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 5);
  });

  it("calculates zero similarity for orthogonal vectors", () => {
    const vecA = [1, 0];
    const vecB = [0, 1];
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(0.0, 5);
  });

  it("calculates -1.0 for diametrically opposite vectors", () => {
    const vecA = [1, 0];
    const vecB = [-1, 0];
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(-1.0, 5);
  });

  it("handles zero vectors without dividing by zero", () => {
    const vecA = [0, 0, 0];
    const vecB = [1, 2, 3];
    expect(cosineSimilarity(vecA, vecB)).toBe(0);
  });

  it("works with Float32Array instances", () => {
    const vecA = new Float32Array([0.5, 0.5]);
    const vecB = new Float32Array([0.5, 0.5]);
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 5);
  });
});

describe("URL Canonicalization", () => {
  it("removes tracking query parameters like utm_source and fbclid", () => {
    const raw = "https://example.com/article?utm_source=twitter&utm_medium=feed&fbclid=12345&id=99";
    const canonical = normalizeCanonicalUrl(raw);
    expect(canonical).toContain("id=99");
    expect(canonical).not.toContain("utm_source");
    expect(canonical).not.toContain("utm_medium");
    expect(canonical).not.toContain("fbclid");
  });

  it("normalizes trailing slashes on paths", () => {
    const urlA = "https://example.com/tech/news/";
    const urlB = "https://example.com/tech/news";
    expect(normalizeCanonicalUrl(urlA)).toBe(normalizeCanonicalUrl(urlB));
  });

  it("lowercases hostnames while preserving case in path/query", () => {
    const raw = "https://EXAMPLE.COM/Path/To/Doc?Key=Value";
    const canonical = normalizeCanonicalUrl(raw);
    expect(canonical).toContain("https://example.com");
    expect(canonical).toContain("Path/To/Doc");
  });

  it("strips hash fragments", () => {
    const raw = "https://example.com/news#section-2";
    expect(normalizeCanonicalUrl(raw)).toBe("https://example.com/news");
  });
});

describe("Content Hashing & HTML Normalization", () => {
  it("produces deterministic SHA-256 hashes", () => {
    const hash1 = computeContentHash("Hello world text", "Article Title");
    const hash2 = computeContentHash("Hello world text", "Article Title");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("normalizes outer whitespace and case before hashing", () => {
    const hash1 = computeContentHash("  hello world  ", "Title");
    const hash2 = computeContentHash("hello world", "TITLE");
    expect(hash1).toBe(hash2);
  });

  it("decodes HTML entities properly", () => {
    const encoded = "Valet &amp; AI &apos;Assistant&apos; &quot;Ready&quot; &hellip;";
    const decoded = decodeHtmlEntities(encoded);
    expect(decoded).toBe("Valet & AI 'Assistant' \"Ready\" ...");
  });

  it("strips HTML tags and script elements", () => {
    const html = "<div><p>Article paragraph text.</p><script>alert(1)</script><span>More text.</span></div>";
    const stripped = stripHtmlAndEntities(html);
    expect(stripped).toContain("Article paragraph text.");
    expect(stripped).toContain("More text.");
    expect(stripped).not.toContain("<p>");
    expect(stripped).not.toContain("alert(1)");
  });
});
