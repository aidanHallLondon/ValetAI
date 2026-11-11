import React from "react";

export interface ArticlePaginationProps {
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalItems?: number;
  className?: string;
}

export function ArticlePagination({
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  currentIndex,
  totalItems,
  className = "",
}: ArticlePaginationProps) {
  return (
    <div className={`article-pagination ${className}`.trim()} role="navigation" aria-label="Article pagination">
      <button
        type="button"
        className="pagination-btn prev-btn"
        onClick={onPrev}
        disabled={!hasPrev}
        title="Previous article (Left Arrow)"
        aria-label="Previous article"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        type="button"
        className="pagination-btn next-btn"
        onClick={onNext}
        disabled={!hasNext}
        title="Next article (Right Arrow)"
        aria-label="Next article"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {typeof currentIndex === "number" && typeof totalItems === "number" && totalItems > 0 && (
        <span className="pagination-count-label">
          {currentIndex + 1} of {totalItems}
        </span>
      )}
    </div>
  );
}

