import React, { useState } from "react";
import type { HydratedContentRecord } from "../../../db/schema";
import { formatHumanAge } from "../../utils/time";

export interface ChildArticleData {
  id: number;
  title: string;
  summary?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  published_at?: string | null;
}

export interface StoryClusterDrawerProps {
  childArticles: ChildArticleData[];
  parentItem: HydratedContentRecord;
  onSelectArticle?: (item: HydratedContentRecord) => void;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Expandable nested drawer displaying multi-source news collation and related articles.
 * Shows domain favicons, publication recency, and links to source coverage.
 */
export function StoryClusterDrawer({
  childArticles,
  parentItem,
  onSelectArticle,
  defaultExpanded = false,
  className = "",
}: StoryClusterDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!childArticles || childArticles.length === 0) return null;

  return (
    <div className={`story-cluster-container ${className}`.trim()}>
      <button
        type="button"
        className="story-cluster-toggle-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        aria-expanded={isExpanded}
        title="Toggle clustered coverage sources"
      >
        <span className="story-cluster-badge">
          ✦ Story Cluster · {childArticles.length + 1} Coverage Sources
        </span>
        <span className="story-cluster-toggle-arrow">
          {isExpanded
            ? "▲ Hide related reports"
            : `▼ View ${childArticles.length} other covering sources`}
        </span>
      </button>

      {isExpanded && (
        <div className="story-cluster-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="story-cluster-child-list">
            {childArticles.map((child) => {
              let childDomain = "";
              if (child.source_url) {
                try {
                  const u = new URL(child.source_url);
                  childDomain = u.hostname.replace(/^feeds\./, "").replace(/^bbci\./, "bbc.");
                  if (childDomain.includes("bbc")) childDomain = "bbc.co.uk";
                } catch {}
              }
              const childFavicon = childDomain
                ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(childDomain)}&sz=32`
                : null;
              const childAge = child.published_at ? formatHumanAge(child.published_at) : "";

              return (
                <div key={child.id} className="story-cluster-child-item">
                  <div className="child-item-meta">
                    {childFavicon ? (
                      <img src={childFavicon} alt="" className="child-item-favicon" />
                    ) : (
                      <span aria-hidden="true">📰</span>
                    )}
                    <span className="child-item-source">{child.source_name || "Source"}</span>
                    {childAge && <span className="child-item-age">· {childAge}</span>}
                  </div>
                  <a
                    href={child.source_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="child-item-title"
                    onClick={(e) => {
                      if (!child.source_url) {
                        e.preventDefault();
                        const childAnalysis = parentItem.analysis
                          ? { ...parentItem.analysis, title: child.title, summary: child.summary || "" }
                          : {
                              title: child.title,
                              summary: child.summary || "",
                              category: "general",
                              sentiment: "neutral" as const,
                              keyEntities: [],
                              actionItems: [],
                              relevanceScore: 70,
                            };
                        onSelectArticle?.({
                          ...parentItem,
                          id: child.id,
                          raw_text: child.summary || "",
                          analysis: childAnalysis,
                        });
                      }
                    }}
                  >
                    {child.title} ↗
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
