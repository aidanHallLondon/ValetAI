/**
 * Utility to detect websites that refuse embedding in an <iframe>
 * via X-Frame-Options: DENY/SAMEORIGIN or Content-Security-Policy: frame-ancestors.
 */

// Well-known domains that strictly enforce X-Frame-Options or frame-ancestors
const KNOWN_BLOCKED_DOMAINS = new Set([
  "bbc.co.uk",
  "bbc.com",
  "bbci.co.uk",
  "nytimes.com",
  "reuters.com",
  "theguardian.com",
  "bloomberg.com",
  "wsj.com",
  "washingtonpost.com",
  "ft.com",
  "technologyreview.com",
  "wired.com",
  "arstechnica.com",
  "techcrunch.com",
  "theverge.com",
  "cnn.com",
  "github.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "youtube.com",
  "medium.com",
  "substack.com",
]);

const runtimeBlockedCache = new Map<string, boolean>();

/**
 * Extracts normalized root domain from a given URL.
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase().replace(/^www\./, "").replace(/^feeds\./, "");
  } catch {
    return "";
  }
}

/**
 * Synchronous check whether a URL belongs to a domain known to refuse iframes.
 */
export function isKnownRefusalDomain(url: string | null | undefined): boolean {
  if (!url) return false;
  const domain = extractDomain(url);
  if (!domain) return false;

  if (runtimeBlockedCache.has(domain)) {
    return runtimeBlockedCache.get(domain)!;
  }

  for (const blocked of KNOWN_BLOCKED_DOMAINS) {
    if (domain === blocked || domain.endsWith("." + blocked)) {
      runtimeBlockedCache.set(domain, true);
      return true;
    }
  }

  return false;
}

/**
 * Asynchronously checks whether a URL allows iframe embedding via server check.
 */
export async function checkIfUrlRefusesIframe(url: string): Promise<boolean> {
  if (!url) return false;
  if (isKnownRefusalDomain(url)) return true;

  const domain = extractDomain(url);
  if (runtimeBlockedCache.has(domain)) {
    return runtimeBlockedCache.get(domain)!;
  }

  try {
    const res = await fetch(`/api/system/check-iframe?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      const refuses = Boolean(data.refusesIframe);
      runtimeBlockedCache.set(domain, refuses);
      return refuses;
    }
  } catch {}

  return false;
}

