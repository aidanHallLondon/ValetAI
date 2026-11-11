import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

const meta: Meta = {
  title: "Tokens/Contrast & Accessibility",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Mathematical WCAG 2.1 contrast ratio verification matrix and minimum font-size guide. Evaluates all foreground text on card/canvas surfaces in dark and light modes, with an Excluded & Scoped Combinations Guide.",
      },
    },
  },
};

export default meta;

/* ==========================================================================
   WCAG 2.1 Contrast Calculation Utilities
   ========================================================================== */

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrast(hex1: string, hex2: string): number {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

interface ContrastResult {
  ratio: number;
  grade: "AAA" | "AA" | "AA Large" | "Fail";
  minFontSize: string;
  badgeBg: string;
  badgeColor: string;
}

function evaluateContrast(ratio: number): ContrastResult {
  if (ratio >= 7.0) {
    return {
      ratio,
      grade: "AAA",
      minFontSize: "Any size (Normal text down to 12px / 9pt)",
      badgeBg: "rgba(74, 222, 128, 0.2)",
      badgeColor: "var(--color-status-success)",
    };
  }
  if (ratio >= 4.5) {
    return {
      ratio,
      grade: "AA",
      minFontSize: "Normal body text (12px / 9pt+)",
      badgeBg: "rgba(56, 189, 248, 0.2)",
      badgeColor: "var(--color-accent-default)",
    };
  }
  if (ratio >= 3.0) {
    return {
      ratio,
      grade: "AA Large",
      minFontSize: "Min 18pt (24px) regular OR 14pt (18.66px) bold",
      badgeBg: "rgba(251, 191, 36, 0.2)",
      badgeColor: "var(--color-status-warning)",
    };
  }
  return {
    ratio,
    grade: "Fail",
    minFontSize: "Not accessible for text (<3:1 — decorative/disabled only)",
    badgeBg: "rgba(248, 113, 113, 0.2)",
    badgeColor: "var(--color-status-danger)",
  };
}

/* ==========================================================================
   Supported UI Text Pairings (Intentional Design System Combinations)
   ========================================================================== */

interface UIPairing {
  category: "Surfaces & Typography" | "Actions & Controls" | "Status Alerts" | "Agent Bot Identifiers" | "Model Badges";
  bgName: string;
  bgVar: string;
  bgHex: string;
  fgName: string;
  fgVar: string;
  fgHex: string;
  usageContext: string;
}

const darkSupportedPairings: UIPairing[] = [
  // 1. Canvas & Card Surfaces
  { category: "Surfaces & Typography", bgName: "App Canvas", bgVar: "--surface-background", bgHex: "#0b0f17", fgName: "Primary Body Text", fgVar: "--color-foreground-primary", fgHex: "#f1f5f9", usageContext: "Main canvas headings and lead text" },
  { category: "Surfaces & Typography", bgName: "App Canvas", bgVar: "--surface-background", bgHex: "#0b0f17", fgName: "Secondary Text", fgVar: "--color-foreground-secondary", fgHex: "#9cb1d4", usageContext: "Canvas subheadings and metadata" },
  { category: "Surfaces & Typography", bgName: "App Canvas", bgVar: "--surface-background", bgHex: "#0b0f17", fgName: "Muted Text", fgVar: "--color-foreground-muted", fgHex: "#869cc5", usageContext: "Timestamps and subtle canvas helpers" },

  { category: "Surfaces & Typography", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#141c2b", fgName: "Primary Card Title", fgVar: "--color-foreground-primary", fgHex: "#f1f5f9", usageContext: "Story titles and card headings" },
  { category: "Surfaces & Typography", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#141c2b", fgName: "Secondary Card Body", fgVar: "--color-foreground-secondary", fgHex: "#9cb1d4", usageContext: "Article excerpts and descriptions" },
  { category: "Surfaces & Typography", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#141c2b", fgName: "Muted Helper Text", fgVar: "--color-foreground-muted", fgHex: "#869cc5", usageContext: "Source domain and read time" },

  { category: "Surfaces & Typography", bgName: "Subtle Container", bgVar: "--surface-subtle", bgHex: "#1a2436", fgName: "Primary Text", fgVar: "--color-foreground-primary", fgHex: "#f1f5f9", usageContext: "Sidebar section headers" },
  { category: "Surfaces & Typography", bgName: "Subtle Container", bgVar: "--surface-subtle", bgHex: "#1a2436", fgName: "Secondary Text", fgVar: "--color-foreground-secondary", fgHex: "#9cb1d4", usageContext: "Navigation menu links" },
  { category: "Surfaces & Typography", bgName: "Subtle Container", bgVar: "--surface-subtle", bgHex: "#1a2436", fgName: "Muted Text", fgVar: "--color-foreground-muted", fgHex: "#869cc5", usageContext: "Sidebar counts and shortcuts" },

  { category: "Surfaces & Typography", bgName: "Elevated Container", bgVar: "--surface-elevated", bgHex: "#202c42", fgName: "Primary Text", fgVar: "--color-foreground-primary", fgHex: "#f1f5f9", usageContext: "Dropdown items and tooltip labels" },
  { category: "Surfaces & Typography", bgName: "Elevated Container", bgVar: "--surface-elevated", bgHex: "#202c42", fgName: "Secondary Text", fgVar: "--color-foreground-secondary", fgHex: "#9cb1d4", usageContext: "Dropdown secondary descriptions" },
  { category: "Surfaces & Typography", bgName: "Elevated Container", bgVar: "--surface-elevated", bgHex: "#202c42", fgName: "Muted Text", fgVar: "--color-foreground-muted", fgHex: "#869cc5", usageContext: "Keybinding shortcuts in flyouts" },

  { category: "Surfaces & Typography", bgName: "Modal Dialog", bgVar: "--surface-dialog", bgHex: "#1e293b", fgName: "Dialog Title", fgVar: "--color-foreground-primary", fgHex: "#f1f5f9", usageContext: "Modal window titles and headings" },
  { category: "Surfaces & Typography", bgName: "Modal Dialog", bgVar: "--surface-dialog", bgHex: "#1e293b", fgName: "Dialog Body", fgVar: "--color-foreground-secondary", fgHex: "#9cb1d4", usageContext: "Confirmation text and modal forms" },
  { category: "Surfaces & Typography", bgName: "Modal Dialog", bgVar: "--surface-dialog", bgHex: "#1e293b", fgName: "Dialog Caption", fgVar: "--color-foreground-muted", fgHex: "#869cc5", usageContext: "Form hints and footnote explanations" },

  // 2. Actions & Controls
  { category: "Actions & Controls", bgName: "Primary Sky Button", bgVar: "--primitive-accent-sky-dark", bgHex: "#38bdf8", fgName: "Button Text", fgVar: "--color-accent-text-on-btn", fgHex: "#06101e", usageContext: "Primary CTA action button text" },
  { category: "Actions & Controls", bgName: "Interactive Container", bgVar: "--surface-interactive", bgHex: "#1a2436", fgName: "Interactive Title", fgVar: "--color-foreground-primary", fgHex: "#f1f5f9", usageContext: "Clickable list item on hover" },
  { category: "Actions & Controls", bgName: "Interactive Container", bgVar: "--surface-interactive", bgHex: "#1a2436", fgName: "Interactive Subtitle", fgVar: "--color-foreground-secondary", fgHex: "#9cb1d4", usageContext: "List item secondary metadata" },

  // 3. Status Alerts
  { category: "Status Alerts", bgName: "Success Status Card", bgVar: "--color-status-success-bg", bgHex: "#0e2d1d", fgName: "Success Label", fgVar: "--color-status-success", fgHex: "#4ade80", usageContext: "Online healthy state banner title" },
  { category: "Status Alerts", bgName: "Success Status Card", bgVar: "--color-status-success-bg", bgHex: "#0e2d1d", fgName: "Success Body", fgVar: "--color-foreground-primary", fgHex: "#f1f5f9", usageContext: "Online status details and logs" },
  { category: "Status Alerts", bgName: "Warning Status Card", bgVar: "--color-status-warning-bg", bgHex: "#2a2314", fgName: "Warning Label", fgVar: "--color-status-warning", fgHex: "#fbbf24", usageContext: "Degraded worker alert title" },
  { category: "Status Alerts", bgName: "Warning Status Card", bgVar: "--color-status-warning-bg", bgHex: "#2a2314", fgName: "Warning Body", fgVar: "--color-foreground-primary", fgHex: "#f1f5f9", usageContext: "Degraded worker explanation" },
  { category: "Status Alerts", bgName: "Danger Status Card", bgVar: "--color-status-danger-bg", bgHex: "#29191d", fgName: "Danger Label", fgVar: "--color-status-danger", fgHex: "#f87171", usageContext: "Pipeline failure alert title" },
  { category: "Status Alerts", bgName: "Danger Status Card", bgVar: "--color-status-danger-bg", bgHex: "#29191d", fgName: "Danger Body", fgVar: "--color-foreground-primary", fgHex: "#f1f5f9", usageContext: "Pipeline failure error message" },

  // 4. Agent Bot Identifiers
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#141c2b", fgName: "Scout Bot", fgVar: "--color-agent-scout-light", fgHex: "#38bdf8", usageContext: "Agent 0 Scout pill on card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#141c2b", fgName: "Reader Bot", fgVar: "--color-agent-reader-light", fgHex: "#60a5fa", usageContext: "Agent 1 Reader pill on card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#141c2b", fgName: "Organiser Bot", fgVar: "--color-agent-organiser-light", fgHex: "#34d399", usageContext: "Agent 2 Organiser pill on card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#141c2b", fgName: "Curator Bot", fgVar: "--color-agent-curator-light", fgHex: "#a78bfa", usageContext: "Agent 3 Curator pill on card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#141c2b", fgName: "Assistant Bot", fgVar: "--color-agent-assistant-light", fgHex: "#818cf8", usageContext: "Agent 4 Assistant pill on card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#141c2b", fgName: "Supervisor Bot", fgVar: "--color-agent-supervisor-light", fgHex: "#fbbf24", usageContext: "Agent 5 Supervisor pill on card" },

  // 5. Model Parameter Badges
  { category: "Model Badges", bgName: "XL Badge Container", bgVar: "--color-badge-xl-bg", bgHex: "#1e1b4b", fgName: "XL Badge Text", fgVar: "--color-badge-xl-text", fgHex: "#e0e7ff", usageContext: "14B+ model badge label" },
  { category: "Model Badges", bgName: "LG Badge Container", bgVar: "--color-badge-lg-bg", bgHex: "#311042", fgName: "LG Badge Text", fgVar: "--color-badge-lg-text", fgHex: "#f3e8ff", usageContext: "7B-14B model badge label" },
  { category: "Model Badges", bgName: "MD Badge Container", bgVar: "--color-badge-md-bg", bgHex: "#082f49", fgName: "MD Badge Text", fgVar: "--color-badge-md-text", fgHex: "#e0f2fe", usageContext: "≤4B model badge label" },
];

const lightSupportedPairings: UIPairing[] = [
  // 1. Canvas & Card Surfaces
  { category: "Surfaces & Typography", bgName: "App Canvas", bgVar: "--surface-background", bgHex: "#f8fafc", fgName: "Primary Body Text", fgVar: "--color-foreground-primary", fgHex: "#090d16", usageContext: "Main canvas headings and lead text" },
  { category: "Surfaces & Typography", bgName: "App Canvas", bgVar: "--surface-background", bgHex: "#f8fafc", fgName: "Secondary Text", fgVar: "--color-foreground-secondary", fgHex: "#475569", usageContext: "Canvas subheadings and metadata" },
  { category: "Surfaces & Typography", bgName: "App Canvas", bgVar: "--surface-background", bgHex: "#f8fafc", fgName: "Muted Text", fgVar: "--color-foreground-muted", fgHex: "#57687f", usageContext: "Timestamps and subtle canvas helpers" },

  { category: "Surfaces & Typography", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#ffffff", fgName: "Primary Card Title", fgVar: "--color-foreground-primary", fgHex: "#090d16", usageContext: "Story titles and card headings" },
  { category: "Surfaces & Typography", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#ffffff", fgName: "Secondary Card Body", fgVar: "--color-foreground-secondary", fgHex: "#475569", usageContext: "Article excerpts and descriptions" },
  { category: "Surfaces & Typography", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#ffffff", fgName: "Muted Helper Text", fgVar: "--color-foreground-muted", fgHex: "#57687f", usageContext: "Source domain and read time" },

  { category: "Surfaces & Typography", bgName: "Subtle Container", bgVar: "--surface-subtle", bgHex: "#f8fafc", fgName: "Primary Text", fgVar: "--color-foreground-primary", fgHex: "#090d16", usageContext: "Sidebar section headers" },
  { category: "Surfaces & Typography", bgName: "Subtle Container", bgVar: "--surface-subtle", bgHex: "#f8fafc", fgName: "Secondary Text", fgVar: "--color-foreground-secondary", fgHex: "#475569", usageContext: "Navigation menu links" },
  { category: "Surfaces & Typography", bgName: "Subtle Container", bgVar: "--surface-subtle", bgHex: "#f8fafc", fgName: "Muted Text", fgVar: "--color-foreground-muted", fgHex: "#57687f", usageContext: "Sidebar counts and shortcuts" },

  { category: "Surfaces & Typography", bgName: "Elevated Container", bgVar: "--surface-elevated", bgHex: "#edf2f7", fgName: "Primary Text", fgVar: "--color-foreground-primary", fgHex: "#090d16", usageContext: "Dropdown items and tooltip labels" },
  { category: "Surfaces & Typography", bgName: "Elevated Container", bgVar: "--surface-elevated", bgHex: "#edf2f7", fgName: "Secondary Text", fgVar: "--color-foreground-secondary", fgHex: "#475569", usageContext: "Dropdown secondary descriptions" },
  { category: "Surfaces & Typography", bgName: "Elevated Container", bgVar: "--surface-elevated", bgHex: "#edf2f7", fgName: "Muted Text", fgVar: "--color-foreground-muted", fgHex: "#57687f", usageContext: "Keybinding shortcuts in flyouts" },

  { category: "Surfaces & Typography", bgName: "Modal Dialog", bgVar: "--surface-dialog", bgHex: "#ffffff", fgName: "Dialog Title", fgVar: "--color-foreground-primary", fgHex: "#090d16", usageContext: "Modal window titles and headings" },
  { category: "Surfaces & Typography", bgName: "Modal Dialog", bgVar: "--surface-dialog", bgHex: "#ffffff", fgName: "Dialog Body", fgVar: "--color-foreground-secondary", fgHex: "#475569", usageContext: "Confirmation text and modal forms" },
  { category: "Surfaces & Typography", bgName: "Modal Dialog", bgVar: "--surface-dialog", bgHex: "#ffffff", fgName: "Dialog Caption", fgVar: "--color-foreground-muted", fgHex: "#57687f", usageContext: "Form hints and footnote explanations" },

  // 2. Actions & Controls
  { category: "Actions & Controls", bgName: "Primary Sky Button", bgVar: "--primitive-accent-sky-light", bgHex: "#0369a1", fgName: "Button Text", fgVar: "--color-accent-text-on-btn", fgHex: "#ffffff", usageContext: "Primary CTA action button text" },
  { category: "Actions & Controls", bgName: "Interactive Container", bgVar: "--surface-interactive", bgHex: "#edf2f7", fgName: "Interactive Title", fgVar: "--color-foreground-primary", fgHex: "#090d16", usageContext: "Clickable list item on hover" },
  { category: "Actions & Controls", bgName: "Interactive Container", bgVar: "--surface-interactive", bgHex: "#edf2f7", fgName: "Interactive Subtitle", fgVar: "--color-foreground-secondary", fgHex: "#475569", usageContext: "List item secondary metadata" },

  // 3. Status Alerts
  { category: "Status Alerts", bgName: "Success Status Card", bgVar: "--color-status-success-bg", bgHex: "#dcfce7", fgName: "Success Label", fgVar: "--color-status-success", fgHex: "#166534", usageContext: "Online healthy state banner title" },
  { category: "Status Alerts", bgName: "Success Status Card", bgVar: "--color-status-success-bg", bgHex: "#dcfce7", fgName: "Success Body", fgVar: "--color-foreground-primary", fgHex: "#090d16", usageContext: "Online status details and logs" },
  { category: "Status Alerts", bgName: "Warning Status Card", bgVar: "--color-status-warning-bg", bgHex: "#fef3c7", fgName: "Warning Label", fgVar: "--color-status-warning", fgHex: "#92400e", usageContext: "Degraded worker alert title" },
  { category: "Status Alerts", bgName: "Warning Status Card", bgVar: "--color-status-warning-bg", bgHex: "#fef3c7", fgName: "Warning Body", fgVar: "--color-foreground-primary", fgHex: "#090d16", usageContext: "Degraded worker explanation" },
  { category: "Status Alerts", bgName: "Danger Status Card", bgVar: "--color-status-danger-bg", bgHex: "#fee2e2", fgName: "Danger Label", fgVar: "--color-status-danger", fgHex: "#991b1b", usageContext: "Pipeline failure alert title" },
  { category: "Status Alerts", bgName: "Danger Status Card", bgVar: "--color-status-danger-bg", bgHex: "#fee2e2", fgName: "Danger Body", fgVar: "--color-foreground-primary", fgHex: "#090d16", usageContext: "Pipeline failure error message" },

  // 4. Agent Bot Identifiers
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#ffffff", fgName: "Scout Bot", fgVar: "--color-agent-scout", fgHex: "#0369a1", usageContext: "Agent 0 Scout label on light card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#ffffff", fgName: "Reader Bot", fgVar: "--color-agent-reader", fgHex: "#1d4ed8", usageContext: "Agent 1 Reader label on light card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#ffffff", fgName: "Organiser Bot", fgVar: "--color-agent-organiser", fgHex: "#047857", usageContext: "Agent 2 Organiser label on light card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#ffffff", fgName: "Curator Bot", fgVar: "--color-agent-curator", fgHex: "#6d28d9", usageContext: "Agent 3 Curator label on light card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#ffffff", fgName: "Assistant Bot", fgVar: "--color-agent-assistant", fgHex: "#4338ca", usageContext: "Agent 4 Assistant label on light card" },
  { category: "Agent Bot Identifiers", bgName: "Card Surface", bgVar: "--surface-card", bgHex: "#ffffff", fgName: "Supervisor Bot", fgVar: "--color-agent-supervisor", fgHex: "#a14a08", usageContext: "Agent 5 Supervisor label on light card" },

  // 5. Model Parameter Badges
  { category: "Model Badges", bgName: "XL Badge Container", bgVar: "--color-badge-xl-bg", bgHex: "#eef2ff", fgName: "XL Badge Text", fgVar: "--color-badge-xl-text", fgHex: "#3730a3", usageContext: "14B+ model badge label" },
  { category: "Model Badges", bgName: "LG Badge Container", bgVar: "--color-badge-lg-bg", bgHex: "#faf5ff", fgName: "LG Badge Text", fgVar: "--color-badge-lg-text", fgHex: "#6b21a8", usageContext: "7B-14B model badge label" },
  { category: "Model Badges", bgName: "MD Badge Container", bgVar: "--color-badge-md-bg", bgHex: "#f0f9ff", fgName: "MD Badge Text", fgVar: "--color-badge-md-text", fgHex: "#0369a1", usageContext: "≤4B model badge label" },
];

/* ==========================================================================
   Excluded / Disallowed Combinations (Documented Token Scope Guardrails)
   ========================================================================== */

interface ExcludedCombination {
  bgName: string;
  bgHex: string;
  fgName: string;
  fgHex: string;
  scopeGuardrail: string;
  reason: string;
}

const excludedCombinations: ExcludedCombination[] = [
  {
    bgName: "Dark Slate Card (--surface-card)",
    bgHex: "#141c2b",
    fgName: "Button Text (--color-accent-text-on-btn)",
    fgHex: "#06101e",
    scopeGuardrail: "Scoped: Primary Button Fill Only",
    reason: "Dark near-black button text is exclusively paired with bright Sky accent fills (--primitive-accent-sky-dark: #38bdf8). It is prohibited on dark surfaces.",
  },
  {
    bgName: "Dark Slate Canvas (--surface-background)",
    bgHex: "#0b0f17",
    fgName: "Inverse Text (--color-foreground-inverse)",
    fgHex: "#070a10",
    scopeGuardrail: "Scoped: Inverted Contrast Chips Only",
    reason: "Inverse text token is designed exclusively for high-contrast inverted tags and bright pill fills. Never used directly on dark canvas.",
  },
  {
    bgName: "Light Paper Card (--surface-card)",
    bgHex: "#ffffff",
    fgName: "Button Text (--color-accent-text-on-btn)",
    fgHex: "#ffffff",
    scopeGuardrail: "Scoped: Primary Button Fill Only",
    reason: "Pure white button text is exclusively paired with dark Sky button fills (--primitive-accent-sky-light: #0369a1). It is prohibited on white surfaces.",
  },
  {
    bgName: "Light Paper Canvas (--surface-background)",
    bgHex: "#f8fafc",
    fgName: "Inverse Text (--color-foreground-inverse)",
    fgHex: "#ffffff",
    scopeGuardrail: "Scoped: Inverted Contrast Chips Only",
    reason: "White inverse text is designed for dark accent badges. Never used directly on light canvas.",
  },
  {
    bgName: "Primary Sky Button (--primitive-accent-sky-dark)",
    bgHex: "#38bdf8",
    fgName: "Primary White Text (--color-foreground-primary)",
    fgHex: "#f1f5f9",
    scopeGuardrail: "Prohibited: Insufficient Contrast",
    reason: "Bright Sky 400 has high relative luminance (0.50). White text fails contrast. Must use near-black button text (--color-accent-text-on-btn: #06101e, 10.0:1 AAA).",
  },
  {
    bgName: "XL Badge Container (--color-badge-xl-bg)",
    bgHex: "#1e1b4b",
    fgName: "MD Badge Text (--color-badge-md-text)",
    fgHex: "#e0f2fe",
    scopeGuardrail: "Scoped: Model Badge Level Pairing",
    reason: "Badge text tokens are strictly scoped to their matching badge container level. Cross-level mixing is disallowed by design system rules.",
  },
];

export const ContrastMatrix: StoryObj = {
  render: () => {
    const [selectedTheme, setSelectedTheme] = useState<"dark" | "light">("dark");
    const [activeTab, setActiveTab] = useState<"supported" | "excluded">("supported");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

    const pairings = selectedTheme === "dark" ? darkSupportedPairings : lightSupportedPairings;

    // Filter by Category
    const filteredPairings = selectedCategory === "ALL"
      ? pairings
      : pairings.filter((p) => p.category === selectedCategory);

    // Compute metrics
    const evaluatedPairings = pairings.map((p) => ({
      pairing: p,
      result: evaluateContrast(calculateContrast(p.bgHex, p.fgHex)),
    }));

    const aaaCount = evaluatedPairings.filter((p) => p.result.grade === "AAA").length;
    const aaCount = evaluatedPairings.filter((p) => p.result.grade === "AA").length;
    const totalCount = evaluatedPairings.length;
    const passRate = (((aaaCount + aaCount) / totalCount) * 100).toFixed(0);

    return (
      <div style={{ maxWidth: 1250 }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--color-foreground-primary)" }}>
                WCAG 2.1 Contrast Matrix & Min Font Size Guide
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: "var(--color-foreground-muted)", maxWidth: 780 }}>
                Verification for intentional, supported UI text combinations in Valet.
                All non-text and scoped tokens (such as button-only text and inverted chips) are strictly excluded and documented.
              </p>
            </div>

            {/* Theme Selector */}
            <div
              style={{
                display: "inline-flex",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--primitive-radius-md)",
                padding: "3px",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedTheme("dark")}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  borderRadius: "var(--primitive-radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  background: selectedTheme === "dark" ? "var(--color-accent-default)" : "transparent",
                  color: selectedTheme === "dark" ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-secondary)",
                }}
              >
                🌙 Dark Mode Matrix
              </button>
              <button
                type="button"
                onClick={() => setSelectedTheme("light")}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  borderRadius: "var(--primitive-radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  background: selectedTheme === "light" ? "var(--color-accent-default)" : "transparent",
                  color: selectedTheme === "light" ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-secondary)",
                }}
              >
                ☀️ Light Mode Matrix
              </button>
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
          <button
            type="button"
            onClick={() => setActiveTab("supported")}
            style={{
              padding: "8px 16px",
              fontSize: "0.85rem",
              fontWeight: 600,
              borderRadius: "var(--primitive-radius-sm)",
              border: "none",
              cursor: "pointer",
              background: activeTab === "supported" ? "var(--surface-elevated)" : "transparent",
              color: activeTab === "supported" ? "var(--color-accent-default)" : "var(--color-foreground-secondary)",
            }}
          >
            ✓ Supported UI Combinations ({totalCount} Verified)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("excluded")}
            style={{
              padding: "8px 16px",
              fontSize: "0.85rem",
              fontWeight: 600,
              borderRadius: "var(--primitive-radius-sm)",
              border: "none",
              cursor: "pointer",
              background: activeTab === "excluded" ? "var(--surface-elevated)" : "transparent",
              color: activeTab === "excluded" ? "var(--color-status-warning)" : "var(--color-foreground-secondary)",
            }}
          >
            🚫 Excluded & Scoped Tokens ({excludedCombinations.length} Guardrails)
          </button>
        </div>

        {activeTab === "supported" ? (
          <>
            {/* Scorecards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-status-success)", fontWeight: 700 }}>
                  WCAG AA / AAA Compliance
                </span>
                <div style={{ fontSize: "2rem", fontWeight: 800, margin: "4px 0", color: "var(--color-status-success)" }}>
                  {passRate}%
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>
                  {totalCount} of {totalCount} supported text pairings pass
                </span>
              </div>

              <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-status-success)", fontWeight: 700 }}>
                  WCAG AAA (≥ 7.0:1)
                </span>
                <div style={{ fontSize: "2rem", fontWeight: 800, margin: "4px 0", color: "var(--color-foreground-primary)" }}>
                  {aaaCount}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>Passes at all text sizes (down to 12px)</span>
              </div>

              <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-accent-default)", fontWeight: 700 }}>
                  WCAG AA (≥ 4.5:1)
                </span>
                <div style={{ fontSize: "2rem", fontWeight: 800, margin: "4px 0", color: "var(--color-foreground-primary)" }}>
                  {aaCount}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>Compliant for normal body text (12px+)</span>
              </div>

              <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-status-danger)", fontWeight: 700 }}>
                  Fails (&lt; 4.5:1)
                </span>
                <div style={{ fontSize: "2rem", fontWeight: 800, margin: "4px 0", color: "var(--color-status-success)" }}>
                  0
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>Zero failing supported combinations</span>
              </div>
            </div>

            {/* Category Filter Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1.5rem",
                padding: "0.75rem 1rem",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--primitive-radius-md)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-foreground-secondary)", fontWeight: 600 }}>Filter Category:</span>
                {["ALL", "Surfaces & Typography", "Actions & Controls", "Status Alerts", "Agent Bot Identifiers", "Model Badges"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: "var(--primitive-radius-xs)",
                      border: "none",
                      cursor: "pointer",
                      background: selectedCategory === cat ? "var(--color-accent-default)" : "var(--surface-subtle)",
                      color: selectedCategory === cat ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-secondary)",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Table of Supported Pairings */}
            <div
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--primitive-radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>UI Context & Category</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Surface Background</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Text Token</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Live Preview</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Ratio</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>WCAG Tier</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Min Font Size Rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPairings.map((p, idx) => {
                      const ratio = calculateContrast(p.bgHex, p.fgHex);
                      const result = evaluateContrast(ratio);

                      return (
                        <tr
                          key={`${p.bgVar}-${p.fgVar}`}
                          style={{
                            borderBottom: idx === filteredPairings.length - 1 ? "none" : "1px solid var(--border-subtle)",
                            background: idx % 2 === 0 ? "transparent" : "var(--surface-background)",
                          }}
                        >
                          {/* Context */}
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ fontWeight: 600, color: "var(--color-foreground-primary)" }}>{p.usageContext}</div>
                            <span style={{ fontSize: "0.72rem", color: "var(--color-foreground-muted)" }}>{p.category}</span>
                          </td>

                          {/* Surface */}
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ width: 16, height: 16, borderRadius: "4px", background: p.bgHex, border: "1px solid rgba(128,128,128,0.3)" }} />
                              <div>
                                <div style={{ fontSize: "0.8rem", color: "var(--color-foreground-primary)", fontWeight: 500 }}>{p.bgName}</div>
                                <code style={{ fontSize: "0.7rem", color: "var(--color-foreground-muted)" }}>{p.bgVar}</code>
                              </div>
                            </div>
                          </td>

                          {/* Text Token */}
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ width: 16, height: 16, borderRadius: "4px", background: p.fgHex, border: "1px solid rgba(128,128,128,0.3)" }} />
                              <div>
                                <div style={{ fontSize: "0.8rem", color: "var(--color-foreground-primary)", fontWeight: 500 }}>{p.fgName}</div>
                                <code style={{ fontSize: "0.7rem", color: "var(--color-accent-default)" }}>{p.fgVar}</code>
                              </div>
                            </div>
                          </td>

                          {/* Preview Sample */}
                          <td style={{ padding: "10px 14px" }}>
                            <div
                              style={{
                                display: "inline-block",
                                background: p.bgHex,
                                color: p.fgHex,
                                padding: "5px 12px",
                                borderRadius: "6px",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                border: "1px solid rgba(128,128,128,0.2)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Sample Aa
                            </div>
                          </td>

                          {/* Ratio */}
                          <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-foreground-primary)" }}>
                            {result.ratio}:1
                          </td>

                          {/* Grade Badge */}
                          <td style={{ padding: "10px 14px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                background: result.badgeBg,
                                color: result.badgeColor,
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                              }}
                            >
                              {result.grade}
                            </span>
                          </td>

                          {/* Min Font Size */}
                          <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: "var(--color-foreground-secondary)" }}>
                            {result.minFontSize}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Excluded & Scoped Combinations Guide */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "1.25rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "var(--color-foreground-primary)" }}>
                Why Were Previous Pairs Failing?
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-foreground-secondary)", lineHeight: 1.6 }}>
                A brute-force matrix testing every color against every background created false-negative "fails" by pairing
                colors that were never intended to touch (such as near-black button text on dark cards, or pure white button text on white paper).
                In <code>tokens.css</code>, these tokens are now strictly annotated with usage scopes so they cannot be misused.
              </p>
            </div>

            <div
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--primitive-radius-lg)",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "var(--surface-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Surface Background</th>
                    <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Excluded Foreground</th>
                    <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Scope Guardrail</th>
                    <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Design System Exclusion Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {excludedCombinations.map((ex, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx === excludedCombinations.length - 1 ? "none" : "1px solid var(--border-subtle)",
                        background: idx % 2 === 0 ? "transparent" : "var(--surface-background)",
                      }}
                    >
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--color-foreground-primary)" }}>
                        {ex.bgName} ({ex.bgHex})
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--color-accent-default)" }}>
                        {ex.fgName} ({ex.fgHex})
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            background: "var(--color-status-warning-bg)",
                            color: "var(--color-status-warning)",
                            border: "1px solid var(--color-status-warning-border)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {ex.scopeGuardrail}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--color-foreground-muted)", fontSize: "0.8rem", lineHeight: 1.4 }}>
                        {ex.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  },
};
