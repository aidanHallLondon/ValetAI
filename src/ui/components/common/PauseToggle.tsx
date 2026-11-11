import React, { useState, useEffect } from "react";

export interface PauseToggleProps {
  onStatusChange?: (isPaused: boolean) => void;
  isPaused?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function PauseToggle({
  onStatusChange,
  isPaused: controlledPaused,
  onToggle,
  className = "",
}: PauseToggleProps) {
  const [internalPaused, setInternalPaused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isControlled = controlledPaused !== undefined;
  const isPaused = isControlled ? controlledPaused : internalPaused;

  const fetchStatus = async () => {
    if (isControlled) return;
    try {
      const res = await fetch("/api/system/pause");
      if (res.ok) {
        const data = await res.json();
        setInternalPaused(Boolean(data.paused));
        onStatusChange?.(Boolean(data.paused));
      }
    } catch {}
  };

  useEffect(() => {
    if (isControlled) return;
    fetchStatus();
    // Poll every 5 seconds to stay in sync with other tabs or agent events
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, [isControlled]);

  const handleToggle = async () => {
    if (onToggle) {
      onToggle();
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    const nextState = !isPaused;
    setInternalPaused(nextState); // optimistic update

    try {
      const res = await fetch("/api/system/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: nextState }),
      });
      if (res.ok) {
        const data = await res.json();
        setInternalPaused(Boolean(data.paused));
        onStatusChange?.(Boolean(data.paused));
      } else {
        // Rollback
        setInternalPaused(!nextState);
      }
    } catch {
      setInternalPaused(!nextState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`pause-toggle header-pause-btn ${isPaused ? "state-paused" : "state-active"} ${className}`.trim()}
      onClick={handleToggle}
      disabled={isLoading}
      title={
        isPaused
          ? "Background gathering & reading is paused. Click to resume."
          : "Background processing active. Click to pause and save server power / tokens."
      }
      aria-label={isPaused ? "Resume background processing" : "Pause background processing"}
    >
      <span className={`pause-indicator-dot ${isPaused ? "dot-paused" : "dot-active"}`} />
      <span className="pause-icon" aria-hidden="true">
        {isPaused ? "▶" : "⏸"}
      </span>
      <span className="pause-btn-text">{isPaused ? "Paused" : "Active"}</span>
    </button>
  );
}

