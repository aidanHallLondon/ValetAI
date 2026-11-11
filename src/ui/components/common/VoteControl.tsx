import React from "react";

export interface VoteControlProps {
  vote?: "hot" | "not" | "up" | "down" | null;
  onVote: (direction: "hot" | "not") => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

export function VoteControl({
  vote,
  onVote,
  size = "md",
  className = "",
  ariaLabel = "Article rating",
}: VoteControlProps) {
  const isUpvoted = vote === "hot" || vote === "up";
  const isDownvoted = vote === "not" || vote === "down";

  return (
    <div
      className={`vote-buttons-group vote-control ${size === "sm" ? "size-sm" : ""} ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={`vote-circle-btn vote-btn-down ${isDownvoted ? "is-active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onVote("not");
        }}
        title={
          isDownvoted
            ? "Downvoted (Click to remove vote)"
            : "Downvote (Not interested)"
        }
        aria-pressed={isDownvoted}
        aria-label="Downvote"
      >
        <span aria-hidden="true">▼</span>
      </button>

      <button
        type="button"
        className={`vote-circle-btn vote-btn-up ${isUpvoted ? "is-active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onVote("hot");
        }}
        title={
          isUpvoted
            ? "Upvoted (Click to remove vote)"
            : "Upvote (High interest)"
        }
        aria-pressed={isUpvoted}
        aria-label="Upvote"
      >
        <span aria-hidden="true">▲</span>
      </button>
    </div>
  );
}

