import React, { useState, useRef } from "react";

export interface StageHoldRunButtonProps {
  /**
   * Accessible action label, e.g. "Reader Stage".
   */
  label: string;
  /**
   * Whether the stage is actively processing.
   */
  isProcessing: boolean;
  /**
   * Action invoked on standard click (issues/problems only).
   */
  onRunIssues: () => void;
  /**
   * Action invoked on 650ms long-press hold (rerun all).
   */
  onRunAll: () => void;
  /**
   * Optional custom button class name.
   */
  className?: string;
}

/**
 * Compact Run Action Button with Click (Issues) and Press & Hold (All).
 *
 * Click: Runs the stage on failed or pending items only.
 * Long press & hold (650ms): Forces a complete rerun across all library items.
 */
export function StageHoldRunButton({
  label,
  isProcessing,
  onRunIssues,
  onRunAll,
  className = "",
}: StageHoldRunButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const didLongPressRef = useRef(false);

  const startHold = () => {
    if (isProcessing) return;
    didLongPressRef.current = false;
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      setIsHolding(false);
      onRunAll();
    }, 650);
  };

  const cancelHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }
    onRunIssues();
  };

  return (
    <button
      type="button"
      className={`stage-hold-run-button stage-hold-run-btn ${isHolding ? "holding" : ""} ${className}`}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onClick={handleClick}
      disabled={isProcessing}
      title={`Click: run ${label} on issues only · Press & hold: rerun all`}
      aria-label={`Run ${label}`}
    >
      <span className="hold-run-icon">{isProcessing ? "…" : "↻"}</span>
      {isHolding && <span className="hold-progress-fill" />}
    </button>
  );
}

