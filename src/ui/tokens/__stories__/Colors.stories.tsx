import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

const meta: Meta = {
  title: "Tokens/Colors",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Complete color token architecture for Valet AI. Displays Tier 1 Neutrals, Tier 2 Adaptive Theme Surfaces, Agent Signatures, and Status tokens with real-time theme comparison and click-to-copy CSS variables.",
      },
    },
  },
};

export default meta;

interface ColorTokenProps {
  name: string;
  variable: string;
  value: string;
  textColor?: string;
  description?: string;
}

const ColorCard: React.FC<ColorTokenProps> = ({
  name,
  variable,
  value,
  textColor,
  description,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`var(${variable})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={handleCopy}
      title="Click to copy CSS variable"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--primitive-radius-md)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      }}
    >
      <div
        style={{
          height: 72,
          background: value,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: "6px 10px",
          color: textColor || "inherit",
          fontSize: "0.75rem",
          fontWeight: 600,
          borderBottom: "1px solid rgba(128,128,128,0.15)",
        }}
      >
        <span style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>{value}</span>
      </div>
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-primary)" }}>{name}</strong>
          <span style={{ fontSize: "0.7rem", color: copied ? "var(--color-status-success)" : "var(--color-foreground-muted)" }}>
            {copied ? "Copied!" : "Copy"}
          </span>
        </div>
        <code
          style={{
            fontSize: "0.75rem",
            color: "var(--color-foreground-secondary)",
            background: "var(--surface-subtle)",
            padding: "2px 6px",
            borderRadius: "4px",
            width: "fit-content",
            fontFamily: "var(--primitive-font-mono, monospace)",
          }}
        >
          {variable}
        </code>
        {description && (
          <span style={{ fontSize: "0.72rem", color: "var(--color-foreground-muted)", marginTop: "2px" }}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

const SectionGrid: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <div style={{ marginBottom: "2.5rem" }}>
    <div style={{ marginBottom: "1rem" }}>
      <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--color-foreground-primary)" }}>{title}</h3>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>{subtitle}</p>}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "1rem" }}>
      {children}
    </div>
  </div>
);

/**
 * Side-by-side Dark vs Light Theme Semantic Comparison
 * Covers 100% of Tier 2 semantic variables in src/ui/tokens.css
 */
const semanticComparisonData = [
  // Surfaces
  {
    role: "App Canvas Background",
    variable: "--surface-background",
    darkVal: "#0b0f17",
    darkName: "Dark Slate 900",
    lightVal: "#f8fafc",
    lightName: "Warm Paper 100",
  },
  {
    role: "Card & Feed Surface",
    variable: "--surface-card",
    darkVal: "#141c2b",
    darkName: "Dark Slate 800",
    lightVal: "#ffffff",
    lightName: "Pure White 50",
  },
  {
    role: "Subtle Container Surface",
    variable: "--surface-subtle",
    darkVal: "#1a2436",
    darkName: "Dark Slate 750",
    lightVal: "#f8fafc",
    lightName: "Warm Paper 100",
  },
  {
    role: "Elevated Container & Dropdown",
    variable: "--surface-elevated",
    darkVal: "#202c42",
    darkName: "Dark Slate 700",
    lightVal: "#edf2f7",
    lightName: "Paper 200",
  },
  {
    role: "Interactive Hover Surface",
    variable: "--surface-interactive",
    darkVal: "#1a2436",
    darkName: "Dark Slate 750",
    lightVal: "#edf2f7",
    lightName: "Paper 200",
  },
  {
    role: "Overlay / Backing Canvas",
    variable: "--surface-overlay",
    darkVal: "#070a10",
    darkName: "Dark Slate 950",
    lightVal: "#ffffff",
    lightName: "Pure White 50",
  },
  {
    role: "Modal Dialog Canvas",
    variable: "--surface-dialog",
    darkVal: "#1e293b",
    darkName: "Slate 800",
    lightVal: "#ffffff",
    lightName: "Pure White 50",
  },

  // Foregrounds
  {
    role: "Primary Text (High Emphasis)",
    variable: "--color-foreground-primary",
    darkVal: "#f1f5f9",
    darkName: "Slate 100 (17.6:1 contrast)",
    lightVal: "#090d16",
    lightName: "Paper 950 (17.8:1 contrast)",
  },
  {
    role: "Secondary Text (Medium Emphasis)",
    variable: "--color-foreground-secondary",
    darkVal: "#9cb1d4",
    darkName: "Slate 300 (8.8:1 contrast)",
    lightVal: "#475569",
    lightName: "Paper 700 (7.1:1 contrast)",
  },
  {
    role: "Muted Text & Captions",
    variable: "--color-foreground-muted",
    darkVal: "#869cc5",
    darkName: "Slate 400 (5.05:1+ AA contrast)",
    lightVal: "#57687f",
    lightName: "Paper 600 (5.05:1+ AA contrast)",
  },
  {
    role: "Inverse Foreground Text",
    variable: "--color-foreground-inverse",
    darkVal: "#070a10",
    darkName: "Near-Black (Inverted chips only)",
    lightVal: "#ffffff",
    lightName: "Pure White (Inverted chips only)",
  },

  // Borders
  {
    role: "Subtle Card Border",
    variable: "--border-subtle",
    darkVal: "#2f3e5c",
    darkName: "Slate 600",
    lightVal: "#e2e8f0",
    lightName: "Paper 300",
  },
  {
    role: "Strong Border / Focus Ring",
    variable: "--border-strong",
    darkVal: "#869cc5",
    darkName: "Slate 400",
    lightVal: "#94a3b8",
    lightName: "Paper 500",
  },

  // Accents
  {
    role: "Primary Sky Accent",
    variable: "--color-accent-default",
    darkVal: "#38bdf8",
    darkName: "Sky 400 (Vibrant on Dark)",
    lightVal: "#0369a1",
    lightName: "Sky 700 (5.93:1 AA on White btn)",
  },
  {
    role: "Primary Sky Accent Hover",
    variable: "--color-accent-hover",
    darkVal: "#7dd3fc",
    darkName: "Sky 300",
    lightVal: "#075985",
    lightName: "Sky 800",
  },
  {
    role: "Text on Primary Button",
    variable: "--color-accent-text-on-btn",
    darkVal: "#06101e",
    darkName: "Near-Black (10.0:1 on Sky 400)",
    lightVal: "#ffffff",
    lightName: "Pure White (5.93:1 on Sky 700)",
  },

  // Status
  {
    role: "Success Alert Text",
    variable: "--color-status-success",
    darkVal: "#4ade80",
    darkName: "Green 400 (10.6:1)",
    lightVal: "#166534",
    lightName: "Green 800 (8.2:1)",
  },
  {
    role: "Success Card Background",
    variable: "--color-status-success-bg",
    darkVal: "rgba(74, 222, 128, 0.15)",
    darkName: "Green Tint 15%",
    lightVal: "#dcfce7",
    lightName: "Green 100",
  },
  {
    role: "Success Border",
    variable: "--color-status-success-border",
    darkVal: "rgba(74, 222, 128, 0.35)",
    darkName: "Green Border 35%",
    lightVal: "#86efac",
    lightName: "Green 300",
  },
  {
    role: "Warning Alert Text",
    variable: "--color-status-warning",
    darkVal: "#fbbf24",
    darkName: "Amber 400 (11.4:1)",
    lightVal: "#92400e",
    lightName: "Amber 800 (6.1:1)",
  },
  {
    role: "Warning Card Background",
    variable: "--color-status-warning-bg",
    darkVal: "rgba(251, 191, 36, 0.15)",
    darkName: "Amber Tint 15%",
    lightVal: "#fef3c7",
    lightName: "Amber 100",
  },
  {
    role: "Warning Border",
    variable: "--color-status-warning-border",
    darkVal: "rgba(251, 191, 36, 0.35)",
    darkName: "Amber Border 35%",
    lightVal: "#fde68a",
    lightName: "Amber 200",
  },
  {
    role: "Danger Alert Text",
    variable: "--color-status-danger",
    darkVal: "#f87171",
    darkName: "Red 400 (6.7:1)",
    lightVal: "#991b1b",
    lightName: "Red 800 (7.8:1)",
  },
  {
    role: "Danger Card Background",
    variable: "--color-status-danger-bg",
    darkVal: "rgba(248, 113, 113, 0.15)",
    darkName: "Red Tint 15%",
    lightVal: "#fee2e2",
    lightName: "Red 100",
  },
  {
    role: "Danger Border",
    variable: "--color-status-danger-border",
    darkVal: "rgba(248, 113, 113, 0.35)",
    darkName: "Red Border 35%",
    lightVal: "#fca5a5",
    lightName: "Red 300",
  },
];

export const ThemeComparison: StoryObj = {
  render: () => {
    const [previewTheme, setPreviewTheme] = useState<"dark" | "light">("dark");

    return (
      <div style={{ maxWidth: 1150 }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--color-foreground-primary)" }}>
                Tier 2: Semantic Theme Comparison (Dark vs. Light)
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: "var(--color-foreground-muted)", maxWidth: 700 }}>
                Corresponds to <code>src/ui/tokens.css</code> Tier 2 Semantic Tokens. These tokens map adaptively via{" "}
                <code>[data-theme="dark"]</code> (default slate canvas) and <code>[data-theme="light"]</code> (editorial warm paper).
              </p>
            </div>

            {/* Interactive Theme Switcher */}
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
                onClick={() => setPreviewTheme("dark")}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  borderRadius: "var(--primitive-radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  background: previewTheme === "dark" ? "var(--color-accent-default)" : "transparent",
                  color: previewTheme === "dark" ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-secondary)",
                }}
              >
                🌙 Dark Theme
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme("light")}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  borderRadius: "var(--primitive-radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  background: previewTheme === "light" ? "var(--color-accent-default)" : "transparent",
                  color: previewTheme === "light" ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-secondary)",
                }}
              >
                ☀️ Light Theme
              </button>
            </div>
          </div>
        </div>

        {/* Live Interactive Preview Box */}
        <div
          data-theme={previewTheme}
          style={{
            background: "var(--surface-background)",
            color: "var(--color-foreground-primary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--primitive-radius-lg)",
            padding: "1.5rem",
            marginBottom: "2.5rem",
            boxShadow: "var(--shadow-card)",
            transition: "background 0.2s ease, color 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-accent-default)", fontWeight: 700 }}>
              Live {previewTheme.toUpperCase()} Theme Sandbox
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>
              Root attribute: <code>data-theme="{previewTheme}"</code>
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {/* Card sample */}
            <div
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--primitive-radius-md)",
                padding: "1.25rem",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "var(--color-foreground-primary)" }}>
                Card Surface (<code>--surface-card</code>)
              </h4>
              <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--color-foreground-secondary)", lineHeight: 1.5 }}>
                Primary text is crisp and readable. Secondary text maintains compliant WCAG contrast against the surface.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  type="button"
                  style={{
                    background: "var(--color-accent-default)",
                    color: "var(--color-accent-text-on-btn)",
                    border: "none",
                    borderRadius: "var(--primitive-radius-sm)",
                    padding: "6px 14px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Primary Action
                </button>
                <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>
                  Muted text (<code>--color-foreground-muted</code>)
                </span>
              </div>
            </div>

            {/* Elevated Container sample */}
            <div
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--primitive-radius-md)",
                padding: "1.25rem",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "var(--color-foreground-primary)" }}>
                Elevated Surface (<code>--surface-elevated</code>)
              </h4>
              <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--color-foreground-secondary)", lineHeight: 1.5 }}>
                Used for modal dialogs, dropdowns, and interactive tooltips to create optical depth above the canvas.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span
                  style={{
                    background: "var(--color-status-success-bg)",
                    color: "var(--color-status-success)",
                    border: "1px solid var(--color-status-success-border)",
                    borderRadius: "var(--primitive-radius-xs)",
                    padding: "3px 8px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  Active System
                </span>
                <span
                  style={{
                    background: "var(--color-status-warning-bg)",
                    color: "var(--color-status-warning)",
                    border: "1px solid var(--color-status-warning-border)",
                    borderRadius: "var(--primitive-radius-xs)",
                    padding: "3px 8px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  Model Cold
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Semantic Side-by-Side Comparison Table */}
        <h3 style={{ margin: "0 0 0.75rem", fontSize: "1.2rem", color: "var(--color-foreground-primary)" }}>
          Full Semantic Token Mapping: Dark vs. Light
        </h3>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
          Components consume these semantic tokens directly. They never declare raw colors or hex values.
        </p>

        <div
          style={{
            overflowX: "auto",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--primitive-radius-md)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "var(--surface-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>UI Semantic Role</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>CSS Variable</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Dark Theme [data-theme="dark"]</th>
                <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Light Theme [data-theme="light"]</th>
              </tr>
            </thead>
            <tbody>
              {semanticComparisonData.map((row, idx) => (
                <tr
                  key={row.variable}
                  style={{
                    borderBottom: idx === semanticComparisonData.length - 1 ? "none" : "1px solid var(--border-subtle)",
                    background: idx % 2 === 0 ? "transparent" : "var(--surface-background)",
                  }}
                >
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--color-foreground-primary)" }}>
                    {row.role}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <code
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-foreground-secondary)",
                        background: "var(--surface-subtle)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontFamily: "var(--primitive-font-mono, monospace)",
                      }}
                    >
                      {row.variable}
                    </code>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "4px",
                          background: row.darkVal,
                          border: "1px solid rgba(255,255,255,0.2)",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: "var(--color-foreground-secondary)", fontSize: "0.8rem" }}>
                        {row.darkVal} ({row.darkName})
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "4px",
                          background: row.lightVal,
                          border: "1px solid rgba(0,0,0,0.15)",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: "var(--color-foreground-secondary)", fontSize: "0.8rem" }}>
                        {row.lightVal} ({row.lightName})
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
};

export const AllColors: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 1100 }}>
      {/* 1. Agent Bots */}
      <SectionGrid
        title="Agent Bot Character Colors"
        subtitle="Dedicated signature colors and status accents for the six autonomous intelligence agents."
      >
        <ColorCard name="Agent 0: Scout" variable="--color-agent-scout" value="#0284c7" textColor="#ffffff" description="Gatekeeper triage bot" />
        <ColorCard name="Agent 0: Scout Light" variable="--color-agent-scout-light" value="#38bdf8" textColor="#070a10" description="Scout halo and badge accent" />
        <ColorCard name="Agent 1: Reader" variable="--color-agent-reader" value="#3b82f6" textColor="#ffffff" description="Deep synthesis & entity reader" />
        <ColorCard name="Agent 1: Reader Light" variable="--color-agent-reader-light" value="#60a5fa" textColor="#070a10" description="Reader halo and badge accent" />
        <ColorCard name="Agent 2: Organiser" variable="--color-agent-organiser" value="#10b981" textColor="#ffffff" description="Story thread clusterer" />
        <ColorCard name="Agent 2: Organiser Light" variable="--color-agent-organiser-light" value="#34d399" textColor="#070a10" description="Organiser halo and badge accent" />
        <ColorCard name="Agent 3: Curator" variable="--color-agent-curator" value="#8b5cf6" textColor="#ffffff" description="Knowledge taxonomy shelf curator" />
        <ColorCard name="Agent 3: Curator Light" variable="--color-agent-curator-light" value="#a78bfa" textColor="#070a10" description="Curator halo and badge accent" />
        <ColorCard name="Agent 4: Assistant" variable="--color-agent-assistant" value="#6366f1" textColor="#ffffff" description="Executive personal assistant" />
        <ColorCard name="Agent 4: Assistant Light" variable="--color-agent-assistant-light" value="#818cf8" textColor="#ffffff" description="Assistant halo and badge accent" />
        <ColorCard name="Agent 5: Supervisor" variable="--color-agent-supervisor" value="#f59e0b" textColor="#070a10" description="Prompt quality & audit supervisor" />
        <ColorCard name="Agent 5: Supervisor Light" variable="--color-agent-supervisor-light" value="#fbbf24" textColor="#070a10" description="Supervisor halo and badge accent" />
      </SectionGrid>

      {/* 2. Brand & Primary Accents */}
      <SectionGrid
        title="Tier 1: Brand & Accent Primaries (Dark vs. Light)"
        subtitle="WCAG AA 4.5:1+ compliant on respective light and dark background surfaces."
      >
        <ColorCard name="Sky Accent (Dark)" variable="--primitive-accent-sky-dark" value="#38bdf8" textColor="#070a10" description="Primary action and active states in Dark Mode" />
        <ColorCard name="Sky Accent Hover (Dark)" variable="--primitive-accent-sky-hover-dark" value="#7dd3fc" textColor="#070a10" description="Dark theme button hover" />
        <ColorCard name="Sky Accent (Light)" variable="--primitive-accent-sky-light" value="#0369a1" textColor="#ffffff" description="Primary action in Light Mode (5.93:1 on white btn)" />
        <ColorCard name="Sky Accent Hover (Light)" variable="--primitive-accent-sky-hover-light" value="#075985" textColor="#ffffff" description="Light theme button hover" />
      </SectionGrid>

      {/* 3. Status Colors */}
      <SectionGrid
        title="Tier 1: Status Colors (Success, Warning, Danger)"
        subtitle="Tri-color feedback palette tuned for both Dark and Light surfaces."
      >
        <ColorCard name="Success Dark" variable="--primitive-success-dark" value="#4ade80" textColor="#070a10" description="Online / Healthy in Dark Mode" />
        <ColorCard name="Success Light" variable="--primitive-success-light" value="#166534" textColor="#ffffff" description="Online / Healthy in Light Mode" />
        <ColorCard name="Warning Dark" variable="--primitive-warning-dark" value="#fbbf24" textColor="#070a10" description="Degraded / Cold in Dark Mode" />
        <ColorCard name="Warning Light" variable="--primitive-warning-light" value="#92400e" textColor="#ffffff" description="Degraded / Cold in Light Mode" />
        <ColorCard name="Danger Dark" variable="--primitive-danger-dark" value="#f87171" textColor="#070a10" description="Failed / Error in Dark Mode" />
        <ColorCard name="Danger Light" variable="--primitive-danger-light" value="#991b1b" textColor="#ffffff" description="Failed / Error in Light Mode" />
      </SectionGrid>

      {/* 4. Dark Neutral Scale */}
      <SectionGrid
        title="Tier 1: Dark Palette (Slate & Deep Navy) [data-theme='dark']"
        subtitle="Foundation for dark-mode cards, sidebars, elevation layers, and high-contrast typography."
      >
        <ColorCard name="Dark 950" variable="--primitive-dark-neutral-950" value="#070a10" textColor="#cbd7ed" description="Deepest background / shadow" />
        <ColorCard name="Dark 900" variable="--primitive-dark-neutral-900" value="#0b0f17" textColor="#cbd7ed" description="Application canvas background" />
        <ColorCard name="Dark 850" variable="--primitive-dark-neutral-850" value="#101622" textColor="#cbd7ed" description="Subtle surface elevation" />
        <ColorCard name="Dark 800" variable="--primitive-dark-neutral-800" value="#141c2b" textColor="#cbd7ed" description="Standard card surface" />
        <ColorCard name="Dark 750" variable="--primitive-dark-neutral-750" value="#1a2436" textColor="#cbd7ed" description="Sidebar & drawer surface" />
        <ColorCard name="Dark 700" variable="--primitive-dark-neutral-700" value="#202c42" textColor="#cbd7ed" description="Elevated containers & inputs" />
        <ColorCard name="Dark 600" variable="--primitive-dark-neutral-600" value="#2f3e5c" textColor="#cbd7ed" description="Subtle borders & dividers" />
        <ColorCard name="Dark 500" variable="--primitive-dark-neutral-500" value="#4a5c80" textColor="#cbd7ed" description="Muted component outlines" />
        <ColorCard name="Dark 400" variable="--primitive-dark-neutral-400" value="#869cc5" textColor="#070a10" description="Muted secondary text (5.05:1+ AA)" />
        <ColorCard name="Dark 300" variable="--primitive-dark-neutral-300" value="#9cb1d4" textColor="#070a10" description="Secondary text color" />
        <ColorCard name="Dark 200" variable="--primitive-dark-neutral-200" value="#cbd7ed" textColor="#070a10" description="High-readability subheadings" />
        <ColorCard name="Dark 100" variable="--primitive-dark-neutral-100" value="#f1f5f9" textColor="#070a10" description="Primary body text" />
        <ColorCard name="Dark 50" variable="--primitive-dark-neutral-50" value="#ffffff" textColor="#070a10" description="Pure white highlights" />
      </SectionGrid>

      {/* 5. Light Neutral Scale */}
      <SectionGrid
        title="Tier 1: Light Palette (Editorial Warm Paper) [data-theme='light']"
        subtitle="Clean, warm neutral paper tones for daylight reading without glare."
      >
        <ColorCard name="Light 950" variable="--primitive-light-neutral-950" value="#090d16" textColor="#ffffff" description="Primary text color" />
        <ColorCard name="Light 900" variable="--primitive-light-neutral-900" value="#172033" textColor="#ffffff" description="Deep headlines" />
        <ColorCard name="Light 800" variable="--primitive-light-neutral-800" value="#2d3b55" textColor="#ffffff" description="Secondary headings" />
        <ColorCard name="Light 700" variable="--primitive-light-neutral-700" value="#475569" textColor="#ffffff" description="Body text" />
        <ColorCard name="Light 600" variable="--primitive-light-neutral-600" value="#57687f" textColor="#ffffff" description="Muted text & captions (5.05:1+ AA)" />
        <ColorCard name="Light 500" variable="--primitive-light-neutral-500" value="#94a3b8" textColor="#090d16" description="Placeholder text" />
        <ColorCard name="Light 400" variable="--primitive-light-neutral-400" value="#cbd5e1" textColor="#090d16" description="Card borders" />
        <ColorCard name="Light 300" variable="--primitive-light-neutral-300" value="#e2e8f0" textColor="#090d16" description="Subtle dividers" />
        <ColorCard name="Light 200" variable="--primitive-light-neutral-200" value="#edf2f7" textColor="#090d16" description="Elevated surfaces" />
        <ColorCard name="Light 100" variable="--primitive-light-neutral-100" value="#f8fafc" textColor="#090d16" description="Canvas background" />
        <ColorCard name="Light 50" variable="--primitive-light-neutral-50" value="#ffffff" textColor="#090d16" description="Card surface (white paper)" />
      </SectionGrid>
    </div>
  ),
};

export const AgentColors: StoryObj = {
  render: () => (
    <SectionGrid
      title="Agent Bot Character Colors"
      subtitle="The 6 autonomous agent bots each have an assigned semantic color identifier in src/ui/tokens.css (WCAG AA >= 4.5:1 on their surfaces)."
    >
      <ColorCard name="Scout (Light Mode)" variable="--color-agent-scout" value="#0369a1" textColor="#ffffff" description="Gatekeeper triage (5.93:1 on white)" />
      <ColorCard name="Scout (Dark Mode)" variable="--color-agent-scout-light" value="#38bdf8" textColor="#070a10" description="Scout halo and badge accent" />
      <ColorCard name="Reader (Light Mode)" variable="--color-agent-reader" value="#1d4ed8" textColor="#ffffff" description="Deep synthesis (6.70:1 on white)" />
      <ColorCard name="Reader (Dark Mode)" variable="--color-agent-reader-light" value="#60a5fa" textColor="#070a10" description="Reader halo and badge accent" />
      <ColorCard name="Organiser (Light Mode)" variable="--color-agent-organiser" value="#047857" textColor="#ffffff" description="Story clusterer (5.48:1 on white)" />
      <ColorCard name="Organiser (Dark Mode)" variable="--color-agent-organiser-light" value="#34d399" textColor="#070a10" description="Organiser halo and badge accent" />
      <ColorCard name="Curator (Light Mode)" variable="--color-agent-curator" value="#6d28d9" textColor="#ffffff" description="Taxonomy shelves (7.10:1 on white)" />
      <ColorCard name="Curator (Dark Mode)" variable="--color-agent-curator-light" value="#a78bfa" textColor="#070a10" description="Curator halo and badge accent" />
      <ColorCard name="Assistant (Light Mode)" variable="--color-agent-assistant" value="#4338ca" textColor="#ffffff" description="Executive guidance (7.90:1 on white)" />
      <ColorCard name="Assistant (Dark Mode)" variable="--color-agent-assistant-light" value="#818cf8" textColor="#ffffff" description="Assistant halo and badge accent" />
      <ColorCard name="Supervisor (Light Mode)" variable="--color-agent-supervisor" value="#a14a08" textColor="#ffffff" description="Quality audit (6.00:1 on white)" />
      <ColorCard name="Supervisor (Dark Mode)" variable="--color-agent-supervisor-light" value="#fbbf24" textColor="#070a10" description="Supervisor halo and badge accent" />
    </SectionGrid>
  ),
};

export const ModelBadgeTokens: StoryObj = {
  render: () => {
    return (
      <div style={{ maxWidth: 1000 }}>
        <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>
          Tier 2: Model Parameter Badge Tokens
        </h3>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
          Dedicated background, text, and border tokens for LLM model size indicators (XL, LG, MD) in <code>tokens.css</code>.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {/* XL Model Badge */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--primitive-radius-md)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span
                style={{
                  background: "var(--color-badge-xl-bg)",
                  color: "var(--color-badge-xl-text)",
                  border: "1px solid var(--color-badge-xl-border)",
                  borderRadius: "var(--primitive-radius-xs)",
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                14B+ XL Model
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>Deep Reasoning</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.75rem" }}>
              <code>--color-badge-xl-bg</code>
              <code>--color-badge-xl-text</code>
              <code>--color-badge-xl-border</code>
            </div>
          </div>

          {/* LG Model Badge */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--primitive-radius-md)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span
                style={{
                  background: "var(--color-badge-lg-bg)",
                  color: "var(--color-badge-lg-text)",
                  border: "1px solid var(--color-badge-lg-border)",
                  borderRadius: "var(--primitive-radius-xs)",
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                7B - 14B LG Model
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>Standard Synthesis</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.75rem" }}>
              <code>--color-badge-lg-bg</code>
              <code>--color-badge-lg-text</code>
              <code>--color-badge-lg-border</code>
            </div>
          </div>

          {/* MD Model Badge */}
          <div
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--primitive-radius-md)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span
                style={{
                  background: "var(--color-badge-md-bg)",
                  color: "var(--color-badge-md-text)",
                  border: "1px solid var(--color-badge-md-border)",
                  borderRadius: "var(--primitive-radius-xs)",
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                ≤ 4B Fast Model
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>High Throughput</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.75rem" }}>
              <code>--color-badge-md-bg</code>
              <code>--color-badge-md-text</code>
              <code>--color-badge-md-border</code>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const StatusPalette: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 1100 }}>
      <SectionGrid
        title="Tier 1 & 2: Status Indicators (Foreground, Background, Border)"
        subtitle="Success, Warning, and Danger colors with contrasting backgrounds and borders across themes."
      >
        <ColorCard name="Success Foreground (Dark)" variable="--primitive-success-dark" value="#4ade80" textColor="#070a10" description="Online / Healthy text" />
        <ColorCard name="Success Background (Dark)" variable="--primitive-success-bg-dark" value="rgba(74, 222, 128, 0.15)" description="Tinted success card background" />
        <ColorCard name="Success Border (Dark)" variable="--primitive-success-border-dark" value="rgba(74, 222, 128, 0.35)" description="Subtle success container border" />
        <ColorCard name="Success Foreground (Light)" variable="--primitive-success-light" value="#166534" textColor="#ffffff" description="Light theme success text" />
        <ColorCard name="Success Background (Light)" variable="--primitive-success-bg-light" value="#dcfce7" textColor="#166534" description="Light theme success card" />
        <ColorCard name="Success Border (Light)" variable="--primitive-success-border-light" value="#86efac" textColor="#166534" description="Light theme success border" />

        <ColorCard name="Warning Foreground (Dark)" variable="--primitive-warning-dark" value="#fbbf24" textColor="#070a10" description="Degraded / Cold status text" />
        <ColorCard name="Warning Background (Dark)" variable="--primitive-warning-bg-dark" value="rgba(251, 191, 36, 0.15)" description="Tinted warning card background" />
        <ColorCard name="Warning Border (Dark)" variable="--primitive-warning-border-dark" value="rgba(251, 191, 36, 0.35)" description="Subtle warning container border" />
        <ColorCard name="Warning Foreground (Light)" variable="--primitive-warning-light" value="#92400e" textColor="#ffffff" description="Light theme warning text" />
        <ColorCard name="Warning Background (Light)" variable="--primitive-warning-bg-light" value="#fef3c7" textColor="#92400e" description="Light theme warning card" />
        <ColorCard name="Warning Border (Light)" variable="--primitive-warning-border-light" value="#fde68a" textColor="#92400e" description="Light theme warning border" />

        <ColorCard name="Danger Foreground (Dark)" variable="--primitive-danger-dark" value="#f87171" textColor="#070a10" description="Failed / Critical error text" />
        <ColorCard name="Danger Background (Dark)" variable="--primitive-danger-bg-dark" value="rgba(248, 113, 113, 0.15)" description="Tinted error card background" />
        <ColorCard name="Danger Border (Dark)" variable="--primitive-danger-border-dark" value="rgba(248, 113, 113, 0.35)" description="Subtle danger container border" />
        <ColorCard name="Danger Foreground (Light)" variable="--primitive-danger-light" value="#991b1b" textColor="#ffffff" description="Light theme error text" />
        <ColorCard name="Danger Background (Light)" variable="--primitive-danger-bg-light" value="#fee2e2" textColor="#991b1b" description="Light theme danger card" />
        <ColorCard name="Danger Border (Light)" variable="--primitive-danger-border-light" value="#fca5a5" textColor="#991b1b" description="Light theme danger border" />
      </SectionGrid>
    </div>
  ),
};
