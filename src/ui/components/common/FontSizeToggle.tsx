import React, { useState, useEffect } from "react";

export type FontSizeScale = "standard" | "medium" | "large";

export function FontSizeToggle() {
  const [scale, setScale] = useState<FontSizeScale>(() => {
    try {
      const stored = localStorage.getItem("valet-font-scale");
      if (stored === "medium" || stored === "large") return stored;
    } catch {}
    return "standard";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", scale);
    try {
      if (scale === "standard") {
        localStorage.removeItem("valet-font-scale");
      } else {
        localStorage.setItem("valet-font-scale", scale);
      }
    } catch {}
  }, [scale]);

  const rotateScale = () => {
    setScale((prev) => {
      if (prev === "standard") return "medium";
      if (prev === "medium") return "large";
      return "standard";
    });
  };

  const getScaleInfo = () => {
    switch (scale) {
      case "medium":
        return { display: "A+", label: "Medium", next: "Large" };
      case "large":
        return { display: "A++", label: "Large", next: "Standard" };
      default:
        return { display: "A", label: "Normal", next: "Medium" };
    }
  };

  const info = getScaleInfo();

  return (
    <button
      type="button"
      className="font-size-toggle secondary-btn rotating-tool-btn"
      onClick={rotateScale}
      title={`Font Size: ${info.label} (Click to switch to ${info.next})`}
      aria-label={`Current font size: ${info.label}. Switch to ${info.next}`}
    >
      <span className="font-tool-icon" aria-hidden="true">
        {info.display}
      </span>
      <span className="rotating-tool-label">{info.label}</span>
    </button>
  );
}

