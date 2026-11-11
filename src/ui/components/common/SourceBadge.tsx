import React from "react";

export interface SourceBadgeProps {
  sourceName?: string;
  sources?: string[];
  faviconUrl?: string | null;
  domain?: string;
  isCluster?: boolean;
  clusterCount?: number;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  title?: string;
  size?: "sm" | "md";
}

export function SourceBadge({
  sourceName,
  sources,
  faviconUrl,
  domain,
  isCluster = false,
  clusterCount = 0,
  onClick,
  className = "",
  title: customTitle,
  size = "md",
}: SourceBadgeProps) {
  const isMultiSource = !isCluster && Boolean(sources && sources.length > 1);
  const isInteractive = Boolean(onClick);

  // Compute domain favicon if not explicitly provided
  let effectiveFavicon = faviconUrl;
  if (!effectiveFavicon && domain) {
    effectiveFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  }

  // Determine tooltip and accessible label
  let effectiveTitle = customTitle;
  let ariaLabel = "";

  if (!effectiveTitle) {
    if (isCluster) {
      effectiveTitle = `${clusterCount + 1} clustered coverage sources. Click to open story view.`;
      ariaLabel = `Story cluster: ${clusterCount + 1} sources`;
    } else if (isMultiSource && sources) {
      effectiveTitle = `Multiple coverage sources: ${sources.join(", ")}`;
      ariaLabel = `Sources: ${sources.join(", ")}`;
    } else if (sourceName) {
      effectiveTitle = onClick ? `Filter feed by ${sourceName}` : sourceName;
      ariaLabel = `Source: ${sourceName}`;
    }
  }

  const badgeContent = (
    <>
      {isCluster ? (
        <>
          <span className="source-badge-cluster-icon" aria-hidden="true">
            ✦
          </span>
          <span className="source-badge-cluster-count">
            +{clusterCount}
          </span>
        </>
      ) : isMultiSource ? (
        <>
          <svg
            className="source-badge-multi-icon"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="7" width="15" height="14" rx="2" ry="2" />
            <path d="M6 3h13a2 2 0 0 1 2 2v13" />
          </svg>
          <span className="source-badge-multi-pill">
            {sources?.length || 2}
          </span>
        </>
      ) : (
        <>
          {effectiveFavicon ? (
            <img
              src={effectiveFavicon}
              alt=""
              className="source-badge-favicon"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <span className="source-badge-fallback" aria-hidden="true">
              📰
            </span>
          )}
          {sourceName && (
            <span className="source-badge-name" title={sourceName}>
              {sourceName}
            </span>
          )}
        </>
      )}
    </>
  );

  const classes = [
    "source-badge",
    isCluster ? "is-cluster" : isMultiSource ? "is-multi" : "is-single",
    isInteractive ? "is-interactive" : "is-static",
    size === "sm" ? "size-sm" : "size-md",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (isInteractive) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        title={effectiveTitle}
        aria-label={ariaLabel || effectiveTitle}
      >
        {badgeContent}
      </button>
    );
  }

  return (
    <span
      className={classes}
      title={effectiveTitle}
      aria-label={ariaLabel || effectiveTitle}
    >
      {badgeContent}
    </span>
  );
}

