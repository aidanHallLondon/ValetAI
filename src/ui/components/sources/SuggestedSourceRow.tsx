import React from "react";

export interface SuggestedSourceData {
  id: string;
  name: string;
  description?: string;
  suitabilityScore: number;
  type?: string;
  category?: string;
  matchReason?: string;
  url: string;
  site_url?: string;
}

export interface SuggestedSourceRowProps {
  suggestion: SuggestedSourceData;
  isAnimating?: boolean;
  isAdding?: boolean;
  onAdd: (sug: any) => void;
  className?: string;
}

/**
 * AI-recommended source card displaying domain favicon, suitability match score,
 * editorial match explanation, and a 1-click addition button.
 */
export function SuggestedSourceRow({
  suggestion: sug,
  isAnimating = false,
  isAdding = false,
  onAdd,
  className = "",
}: SuggestedSourceRowProps) {
  let domain = "";
  try {
    const u = new URL(sug.site_url || sug.url);
    domain = u.hostname.replace(/^feeds\./, "").replace(/^bbci\./, "bbc.");
    if (domain.includes("bbc")) domain = "bbc.co.uk";
  } catch {
    domain = sug.url;
  }
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  const targetSiteLink = sug.site_url || sug.url;

  return (
    <div
      className={`source-row suggested-source-row ${isAnimating ? "animating-add" : ""} ${className}`.trim()}
    >
      {/* Subtle placeholder icon where drag handle usually sits to maintain identical alignment */}
      <div
        className="source-drag-handle suggested-drag-placeholder"
        title="Suggested feed based on profile"
      >
        <span style={{ fontSize: "0.85rem", opacity: 0.7 }} aria-hidden="true">
          ✨
        </span>
      </div>

      {/* Frameless Avatar Icon linking directly to the website */}
      <a
        href={targetSiteLink}
        target="_blank"
        rel="noopener noreferrer"
        className="source-avatar-container"
        title={`Visit ${sug.name}: ${targetSiteLink}`}
      >
        <img
          src={faviconUrl}
          alt=""
          className="source-avatar-img"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
            const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div className="source-avatar-fallback" style={{ display: "none" }} aria-hidden="true">
          <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
        </div>
      </a>

      {/* Main Source Info with linked title & clipped non-wrapping description */}
      <div className="source-content-col">
        <div className="source-title-row">
          <a
            href={targetSiteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="source-title-link"
            title={`Visit ${sug.name}: ${targetSiteLink}`}
          >
            <strong className="source-display-name">{sug.name}</strong>
          </a>

          {sug.description && (
            <span className="source-description" title={sug.description}>
              — {sug.description}
            </span>
          )}

          {/* Suitability score match badge */}
          <span
            className="source-weight-badge match-score-badge"
            title={`Suitability match score: ${sug.suitabilityScore}%`}
          >
            {sug.suitabilityScore}% Match
          </span>
        </div>

        <div className="source-sub-meta">
          {/* Format tag */}
          <a
            href={sug.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-tag source-feed-link-tag"
            title={`Feed URL: ${sug.url}`}
          >
            {sug.type ? sug.type.toUpperCase() : "RSS"}
          </a>

          <span className="meta-divider">•</span>

          {/* Category */}
          <span className="source-tag category-tag">{sug.category}</span>

          <span className="meta-divider">•</span>

          {/* Match reason */}
          <span
            className="fetch-time"
            style={{ color: "var(--color-accent-default, #0ea5e9)", fontWeight: 500 }}
          >
            💡 {sug.matchReason}
          </span>
        </div>
      </div>

      {/* Single Action: ADD Button */}
      <div className="source-actions">
        <button
          type="button"
          className="primary-btn add-suggestion-btn"
          onClick={() => onAdd(sug)}
          disabled={isAdding}
          title={`Add ${sug.name} to active sources`}
          aria-label={`Add ${sug.name} to sources`}
        >
          {isAdding ? (
            <>
              <span className="spin-icon">⟳</span>
              <span>Adding…</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
              <span>Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
