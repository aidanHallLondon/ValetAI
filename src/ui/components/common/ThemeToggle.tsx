import React, { useState, useEffect } from "react";

type ThemeMode = "system" | "light" | "dark";

export interface ThemeToggleProps {
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  className?: string;
}

export function ThemeToggle({ currentTheme, onThemeChange, className = "" }: ThemeToggleProps = {}) {
  const [internalTheme, setInternalTheme] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem("valet-color-scheme");
      if (stored === "light" || stored === "dark") return stored;
    } catch {}
    return "system";
  });

  const theme = currentTheme !== undefined ? currentTheme : internalTheme;
  const setTheme = (updater: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
    const next = typeof updater === "function" ? updater(theme) : updater;
    if (onThemeChange) {
      onThemeChange(next);
    }
    setInternalTheme(next);
  };

  useEffect(() => {
    const meta = document.querySelector('meta[name="color-scheme"]');
    const root = document.documentElement;
    const body = document.body;

    if (theme === "system") {
      if (meta) meta.setAttribute("content", "light dark");
      root.removeAttribute("data-theme");
      root.removeAttribute("data-color-scheme");
      if (body) {
        body.removeAttribute("data-theme");
        body.removeAttribute("data-color-scheme");
      }
      root.style.colorScheme = "";
      try {
        localStorage.removeItem("valet-color-scheme");
      } catch {}
    } else {
      if (meta) meta.setAttribute("content", theme);
      root.setAttribute("data-theme", theme);
      root.setAttribute("data-color-scheme", theme);
      if (body) {
        body.setAttribute("data-theme", theme);
        body.setAttribute("data-color-scheme", theme);
      }
      root.style.colorScheme = theme;
      try {
        localStorage.setItem("valet-color-scheme", theme);
      } catch {}
    }
  }, [theme]);

  // Sync across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "valet-color-scheme") {
        if (e.newValue === "light" || e.newValue === "dark") {
          setTheme(e.newValue);
        } else {
          setTheme("system");
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const rotateTheme = () => {
    setTheme((prev) => {
      if (prev === "system") return "light";
      if (prev === "light") return "dark";
      return "system";
    });
  };

  const getThemeInfo = () => {
    switch (theme) {
      case "light":
        return { icon: "☀️", label: "Light", next: "Dark" };
      case "dark":
        return { icon: "🌙", label: "Dark", next: "Auto" };
      default:
        return { icon: "💻", label: "Auto", next: "Light" };
    }
  };

  const info = getThemeInfo();

  return (
    <button
      type="button"
      className={`theme-toggle secondary-btn rotating-tool-btn ${className}`.trim()}
      onClick={rotateTheme}
      title={`Theme: ${info.label} (Click to switch to ${info.next})`}
      aria-label={`Current theme: ${info.label}. Switch to ${info.next}`}
    >
      <span aria-hidden="true">{info.icon}</span>
      <span className="rotating-tool-label">{info.label}</span>
    </button>
  );
}

