import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect, useRef } from "react";
import { FontSizeToggle } from "../../components/common/FontSizeToggle";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";

const meta: Meta = {
  title: "Tokens/Typography",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Typography system built on Inter and JetBrains Mono. Documents font weights, line heights, dynamic scaling (standard, medium, large), and semantic text hierarchy.",
      },
    },
  },
};

export default meta;

export const TypographyOverview: StoryObj = {
  render: () => {
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [activeFontScale, setActiveFontScale] = useState<"standard" | "medium" | "large">("standard");

    const copyToken = (token: string) => {
      navigator.clipboard.writeText(`var(${token})`);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 1500);
    };

    const fontFamilies = [
      {
        name: "Sans (UI & App Shell)",
        variable: "--primitive-font-sans",
        stack: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        sample: "The quick brown fox jumps over the lazy dog",
        role: "Primary interface font, menus, cards, controls",
      },
      {
        name: "Serif (Editorial & Long-form Reader)",
        variable: "--primitive-font-serif",
        stack: "'Newsreader', 'Charis SIL', Georgia, serif",
        sample: "Deep analytical synthesis of emerging technologies and global current affairs.",
        role: "Long-form editorial reading mode",
      },
      {
        name: "Mono (Code, Prompts & Metrics)",
        variable: "--primitive-font-mono",
        stack: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        sample: "const valet = { vectors: 1024, model: 'qwen3.5-2b' };",
        role: "System prompts, token costs, latency, code blocks",
      },
    ];

    const fontSizes = [
      { name: "Caption (xs)", variable: "--primitive-font-size-xs", rem: "0.75rem", px: "12px", sample: "Metadata, timestamps & badges" },
      { name: "Small Body (sm)", variable: "--primitive-font-size-sm", rem: "0.8125rem", px: "13px", sample: "Secondary card text and helper labels" },
      { name: "Standard Body (md)", variable: "--primitive-font-size-md", rem: "0.9375rem", px: "15px", sample: "Default interface controls and UI text" },
      { name: "Reading Base (base)", variable: "--primitive-font-size-base", rem: "1.0625rem", px: "17px", sample: "Optimized article reading typography" },
      { name: "Small Title (lg)", variable: "--primitive-font-size-lg", rem: "1.1875rem", px: "19px", sample: "Card titles and sub-headings" },
      { name: "Medium Title (xl)", variable: "--primitive-font-size-xl", rem: "1.375rem", px: "22px", sample: "Section headers and dialog titles" },
      { name: "Large Title (2xl)", variable: "--primitive-font-size-2xl", rem: "1.625rem", px: "26px", sample: "Primary page headers" },
      { name: "Hero Title (3xl)", variable: "--primitive-font-size-3xl", rem: "2rem", px: "32px", sample: "Display headlines" },
    ];

    const fontWeights = [
      { name: "Regular", variable: "--primitive-font-weight-regular", weight: 400, desc: "Default body copy and descriptions" },
      { name: "Medium", variable: "--primitive-font-weight-medium", weight: 500, desc: "Interactive labels and secondary emphasis" },
      { name: "Semibold", variable: "--primitive-font-weight-semibold", weight: 600, desc: "Headings, button labels, badges" },
      { name: "Bold", variable: "--primitive-font-weight-bold", weight: 700, desc: "Primary page titles and section headers" },
      { name: "Extrabold", variable: "--primitive-font-weight-extrabold", weight: 800, desc: "Display figures and hero emphasis" },
    ];

    const lineHeights = [
      { name: "Tight", variable: "--primitive-line-height-tight", ratio: "1.25", desc: "Display headlines and multi-line titles" },
      { name: "Snug", variable: "--primitive-line-height-snug", ratio: "1.4", desc: "Compact card titles and button labels" },
      { name: "Normal", variable: "--primitive-line-height-normal", ratio: "1.6", desc: "Default body text and form descriptions" },
      { name: "Relaxed", variable: "--primitive-line-height-relaxed", ratio: "1.75", desc: "Long-form editorial reading mode" },
    ];

    const semanticRoles = [
      { role: "Caption", variable: "--font-size-caption", baseFormula: "calc(var(--primitive-font-size-xs) * var(--font-scale))", defaultPx: "12px" },
      { role: "Small Body", variable: "--font-size-body-sm", baseFormula: "calc(var(--primitive-font-size-sm) * var(--font-scale))", defaultPx: "13px" },
      { role: "Standard Body", variable: "--font-size-body", baseFormula: "calc(var(--primitive-font-size-md) * var(--font-scale))", defaultPx: "15px" },
      { role: "Reading Base", variable: "--font-size-reading", baseFormula: "calc(var(--primitive-font-size-base) * var(--font-scale))", defaultPx: "17px" },
      { role: "Small Title", variable: "--font-size-title-sm", baseFormula: "calc(var(--primitive-font-size-lg) * var(--font-scale))", defaultPx: "19px" },
      { role: "Medium Title", variable: "--font-size-title-md", baseFormula: "calc(var(--primitive-font-size-xl) * var(--font-scale))", defaultPx: "22px" },
      { role: "Large Title", variable: "--font-size-title-lg", baseFormula: "calc(var(--primitive-font-size-2xl) * var(--font-scale))", defaultPx: "26px" },
    ];

    return (
      <div style={{ maxWidth: 1050, display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Header */}
        <div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", color: "var(--color-foreground-primary)" }}>
            Typography System
          </h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-foreground-muted)", maxWidth: 750 }}>
            Structured typography matching <code>src/ui/tokens.css</code>. Includes primitive font stacks, scale,
            weights, line heights, and dynamic root scaling.
          </p>
        </div>

        {/* 1. Font Families */}
        <section>
          <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>1. Primitive Font Stacks</h3>
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
            Defined in <code>tokens.css</code> under Tier 1 Typography.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {fontFamilies.map((f) => (
              <div
                key={f.variable}
                onClick={() => copyToken(f.variable)}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--primitive-radius-md)",
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div>
                    <strong style={{ color: "var(--color-foreground-primary)" }}>{f.name}</strong>
                    <code style={{ marginLeft: "0.75rem", fontSize: "0.75rem", color: "var(--color-accent-default)" }}>
                      {f.variable}
                    </code>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: copiedToken === f.variable ? "var(--color-status-success)" : "var(--color-foreground-muted)" }}>
                    {copiedToken === f.variable ? "Copied!" : "Click to copy"}
                  </span>
                </div>
                <div style={{ fontFamily: `var(${f.variable})`, fontSize: "1.1rem", color: "var(--color-foreground-primary)", marginBottom: "0.25rem" }}>
                  {f.sample}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)", fontFamily: "var(--primitive-font-mono)" }}>
                  Stack: {f.stack}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Primitive Type Scale */}
        <section>
          <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>2. Primitive Type Scale</h3>
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
            Proportional rem scale with 16px baseline pixel references.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {fontSizes.map((s) => (
              <div
                key={s.variable}
                onClick={() => copyToken(s.variable)}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--primitive-radius-md)",
                  padding: "0.75rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 240 }}>
                  <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-primary)" }}>{s.name}</strong>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: 2 }}>
                    <code style={{ fontSize: "0.72rem", color: "var(--color-accent-default)" }}>{s.variable}</code>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-foreground-muted)" }}>({s.rem} / {s.px})</span>
                  </div>
                </div>
                <div style={{ flex: 1, fontSize: `var(${s.variable})`, color: "var(--color-foreground-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.sample}
                </div>
                <span style={{ fontSize: "0.72rem", color: copiedToken === s.variable ? "var(--color-status-success)" : "var(--color-foreground-muted)" }}>
                  {copiedToken === s.variable ? "Copied!" : "Copy"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Font Weights */}
        <section>
          <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>3. Font Weights</h3>
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
            Numeric font-weight spectrum from Regular (400) to Extrabold (800).
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            {fontWeights.map((w) => (
              <div
                key={w.variable}
                onClick={() => copyToken(w.variable)}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--primitive-radius-md)",
                  padding: "1rem",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-foreground-muted)" }}>{w.weight}</span>
                  <span style={{ fontSize: "0.7rem", color: copiedToken === w.variable ? "var(--color-status-success)" : "var(--color-foreground-muted)" }}>
                    {copiedToken === w.variable ? "Copied!" : "Copy"}
                  </span>
                </div>
                <div style={{ fontWeight: w.weight, fontSize: "1.25rem", color: "var(--color-foreground-primary)" }}>
                  {w.name}
                </div>
                <code style={{ fontSize: "0.7rem", color: "var(--color-accent-default)", display: "block", marginTop: "0.25rem" }}>
                  {w.variable}
                </code>
                <span style={{ fontSize: "0.7rem", color: "var(--color-foreground-muted)", display: "block", marginTop: 4 }}>
                  {w.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Line Heights */}
        <section>
          <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>4. Primitive Line Heights</h3>
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
            Line height ratios calibrated for headline punch and long-form readability.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {lineHeights.map((lh) => (
              <div
                key={lh.variable}
                onClick={() => copyToken(lh.variable)}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--primitive-radius-md)",
                  padding: "1rem",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong style={{ fontSize: "0.9rem", color: "var(--color-foreground-primary)" }}>{lh.name}</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-accent-default)", fontWeight: 700 }}>
                    {lh.ratio}
                  </span>
                </div>
                <code style={{ fontSize: "0.72rem", color: "var(--color-foreground-muted)", display: "block", marginBottom: "0.5rem" }}>
                  {lh.variable}
                </code>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-foreground-secondary)", lineHeight: Number(lh.ratio) }}>
                  Line height preview text demonstrating vertical cadence and baseline spacing.
                </p>
                <span style={{ fontSize: "0.7rem", color: "var(--color-foreground-muted)", display: "block", marginTop: 6 }}>
                  {lh.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Semantic Typography Roles & Dynamic Scaling */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>
                5. Tier 2 Semantic Typography & Dynamic Scaling
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
                Controlled via <code>html[data-font-size="standard | medium | large"]</code>.
              </p>
            </div>

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
              {(["standard", "medium", "large"] as const).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setActiveFontScale(scale)}
                  style={{
                    padding: "4px 12px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    borderRadius: "var(--primitive-radius-sm)",
                    border: "none",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    background: activeFontScale === scale ? "var(--color-accent-default)" : "transparent",
                    color: activeFontScale === scale ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-secondary)",
                  }}
                >
                  {scale} ({scale === "standard" ? "16px" : scale === "medium" ? "18.5px" : "21.5px"})
                </button>
              ))}
            </div>
          </div>

          <div
            data-font-size={activeFontScale}
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--primitive-radius-md)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--surface-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Semantic Role</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>CSS Variable</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Dynamic Formula</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--color-foreground-primary)" }}>Baseline</th>
                </tr>
              </thead>
              <tbody>
                {semanticRoles.map((r, idx) => (
                  <tr
                    key={r.variable}
                    style={{
                      borderBottom: idx === semanticRoles.length - 1 ? "none" : "1px solid var(--border-subtle)",
                      background: idx % 2 === 0 ? "transparent" : "var(--surface-background)",
                    }}
                  >
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--color-foreground-primary)" }}>
                      {r.role}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <code style={{ fontSize: "0.75rem", color: "var(--color-accent-default)" }}>
                        {r.variable}
                      </code>
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--color-foreground-secondary)", fontFamily: "var(--primitive-font-mono)", fontSize: "0.75rem" }}>
                      {r.baseFormula}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--color-foreground-muted)", fontSize: "0.8rem" }}>
                      {r.defaultPx}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  },
};

/* ==========================================================================
   Story 2: Live Font Size Selector & Typography Interaction
   ========================================================================== */

export const FontSizeScaleSystem: StoryObj = {
  render: () => {
    const [selectedScale, setSelectedScale] = useState<"standard" | "medium" | "large">("standard");
    const [viewMode, setViewMode] = useState<"interactive" | "side-by-side">("interactive");
    const titleRef = useRef<HTMLHeadingElement>(null);
    const bodyRef = useRef<HTMLParagraphElement>(null);
    const captionRef = useRef<HTMLSpanElement>(null);
    const [computedMetrics, setComputedMetrics] = useState({ title: "26px", body: "18px", caption: "12px", root: "16px" });

    useEffect(() => {
      const updateMetrics = () => {
        if (titleRef.current && bodyRef.current && captionRef.current) {
          setComputedMetrics({
            title: window.getComputedStyle(titleRef.current).fontSize,
            body: window.getComputedStyle(bodyRef.current).fontSize,
            caption: window.getComputedStyle(captionRef.current).fontSize,
            root: window.getComputedStyle(document.documentElement).fontSize,
          });
        }
      };
      updateMetrics();
      const timer = setTimeout(updateMetrics, 100);
      return () => clearTimeout(timer);
    }, [selectedScale]);

    const scales = [
      { id: "standard", label: "Normal (A)", rootPx: "16px", multiplier: "1.00x", desc: "Default density for desktop browsing" },
      { id: "medium", label: "Medium (A+)", rootPx: "18.5px", multiplier: "1.15x", desc: "Enhanced legibility for comfortable reading" },
      { id: "large", label: "Large (A++)", rootPx: "21.5px", multiplier: "1.35x", desc: "High accessibility for low-vision & relaxed reading" },
    ] as const;

    return (
      <div style={{ maxWidth: 1040 }}>
        {/* Architecture Flow Banner */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--color-foreground-primary)" }}>
            How Font Size Selection & Typography Work Together
          </h2>
          <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.9rem", color: "var(--color-foreground-secondary)", lineHeight: 1.5 }}>
            Valet AI employs a dual-tier fluid typography engine. Instead of re-declaring fixed pixel sizes across every component,
            the system coordinates two synchronized layers: <strong>Root REM Scaling</strong> and <strong>Semantic Variable Calculations</strong>.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
            <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-accent-default)" }}>STEP 1</span>
                <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-primary)" }}>User Selection</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-foreground-muted)", lineHeight: 1.4 }}>
                User clicks header tool <code>&lt;FontSizeToggle /&gt;</code>, cycling <code>standard</code> → <code>medium</code> → <code>large</code>.
              </p>
            </div>

            <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-accent-default)" }}>STEP 2</span>
                <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-primary)" }}>DOM State</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-foreground-muted)", lineHeight: 1.4 }}>
                Sets <code>html[data-font-size]</code> and syncs to <code>localStorage</code> for persistent user preference across sessions.
              </p>
            </div>

            <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-status-success)" }}>STEP 3</span>
                <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-primary)" }}>Root Base Shift</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-foreground-muted)", lineHeight: 1.4 }}>
                Root <code>html font-size</code> adjusts: <code>16px</code> → <code>18.5px</code> (+15.6%) → <code>21.5px</code> (+34.4%).
              </p>
            </div>

            <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-status-warning)" }}>STEP 4</span>
                <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-primary)" }}>Calc Multiplier</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-foreground-muted)", lineHeight: 1.4 }}>
                Variables like <code>--font-size-reading</code> scale via <code>calc(var(--primitive-font-size-base) * var(--font-scale))</code>.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Live Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-foreground-secondary)" }}>
              Interactive Mode:
            </span>
            <div style={{ display: "inline-flex", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "3px" }}>
              <button
                type="button"
                onClick={() => setViewMode("interactive")}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  borderRadius: "var(--primitive-radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "interactive" ? "var(--color-accent-default)" : "transparent",
                  color: viewMode === "interactive" ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-secondary)",
                }}
              >
                Sandbox Preview
              </button>
              <button
                type="button"
                onClick={() => setViewMode("side-by-side")}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  borderRadius: "var(--primitive-radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "side-by-side" ? "var(--color-accent-default)" : "transparent",
                  color: viewMode === "side-by-side" ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-secondary)",
                }}
              >
                Side-by-Side Comparison
              </button>
            </div>
          </div>

          {viewMode === "interactive" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>Simulate Header Tool:</span>
              <FontSizeToggle />
              <div style={{ display: "inline-flex", gap: "4px" }}>
                {scales.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedScale(s.id);
                      document.documentElement.setAttribute("data-font-size", s.id);
                    }}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: "var(--primitive-radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      background: selectedScale === s.id ? "var(--color-accent-default)" : "var(--surface-card)",
                      color: selectedScale === s.id ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-primary)",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Mode 1: Interactive Live Sandbox */}
        {viewMode === "interactive" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.5rem", alignItems: "start" }}>
            {/* The Live Rendered Article Card */}
            <div
              data-font-size={selectedScale}
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--primitive-radius-lg)",
                padding: "var(--primitive-space-5)",
                boxShadow: "var(--shadow-card)",
                transition: "all var(--motion-duration-feedback) var(--motion-easing-default)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--primitive-space-3)" }}>
                <Badge variant="primary">AI Synthesis</Badge>
                <span ref={captionRef} style={{ fontSize: "var(--font-size-caption)", color: "var(--color-foreground-muted)" }}>
                  2 min read • 98% Match
                </span>
              </div>

              <h1
                ref={titleRef}
                style={{
                  fontSize: "var(--font-size-title-lg)",
                  fontWeight: 700,
                  margin: "0 0 var(--primitive-space-2) 0",
                  color: "var(--color-foreground-primary)",
                  lineHeight: "var(--primitive-line-height-tight)",
                }}
              >
                Autonomous Agents and the Future of Personalized Algorithm Feeds
              </h1>

              <div style={{ fontSize: "var(--font-size-title-sm)", fontWeight: 500, color: "var(--color-accent-default)", marginBottom: "var(--primitive-space-4)" }}>
                Curated by Reader & Organiser Bots
              </div>

              <p
                ref={bodyRef}
                style={{
                  fontSize: "var(--font-size-reading)",
                  lineHeight: "var(--primitive-line-height-relaxed)",
                  color: "var(--color-foreground-primary)",
                  margin: "0 0 var(--primitive-space-4) 0",
                  fontFamily: "var(--font-family-editorial)",
                }}
              >
                Local edge synthesis allows readers to distill dense academic research and technical documentation
                into personalized executive summaries without exposing private telemetry to third-party providers.
              </p>

              <div style={{ display: "flex", gap: "var(--primitive-space-2)", alignItems: "center" }}>
                <Button variant="primary" size="sm">Read Full Synthesis</Button>
                <Button variant="secondary" size="sm">Bookmark</Button>
                <Button variant="ghost" size="sm">Share</Button>
              </div>
            </div>

            {/* Live Computed Metrics Card */}
            <div style={{ background: "var(--surface-subtle)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "16px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 12px 0", color: "var(--color-foreground-primary)" }}>
                Live Computed Measurements
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem" }}>
                <div>
                  <span style={{ color: "var(--color-foreground-muted)", display: "block" }}>Active Mode</span>
                  <strong style={{ color: "var(--color-accent-default)", textTransform: "uppercase" }}>{selectedScale}</strong>
                </div>

                <div>
                  <span style={{ color: "var(--color-foreground-muted)", display: "block" }}>Root HTML Font Size</span>
                  <code style={{ color: "var(--color-foreground-primary)" }}>{computedMetrics.root}</code>
                </div>

                <div>
                  <span style={{ color: "var(--color-foreground-muted)", display: "block" }}>Title (--font-size-title-lg)</span>
                  <code style={{ color: "var(--color-foreground-primary)", fontWeight: 700 }}>{computedMetrics.title}</code>
                </div>

                <div>
                  <span style={{ color: "var(--color-foreground-muted)", display: "block" }}>Reading (--font-size-reading)</span>
                  <code style={{ color: "var(--color-foreground-primary)" }}>{computedMetrics.body}</code>
                </div>

                <div>
                  <span style={{ color: "var(--color-foreground-muted)", display: "block" }}>Caption (--font-size-caption)</span>
                  <code style={{ color: "var(--color-foreground-primary)" }}>{computedMetrics.caption}</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Side-by-Side 3-Scale Matrix */}
        {viewMode === "side-by-side" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {scales.map((s) => (
              <div
                key={s.id}
                data-font-size={s.id}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--primitive-radius-md)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--color-accent-default)" }}>{s.label}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>{s.rootPx} ({s.multiplier})</span>
                  </div>

                  <h3
                    style={{
                      fontSize: "var(--font-size-title-sm)",
                      fontWeight: 700,
                      margin: "0 0 8px 0",
                      color: "var(--color-foreground-primary)",
                      lineHeight: "var(--primitive-line-height-snug)",
                    }}
                  >
                    Autonomous Feed Architecture
                  </h3>

                  <p
                    style={{
                      fontSize: "var(--font-size-body)",
                      lineHeight: "var(--primitive-line-height-normal)",
                      color: "var(--color-foreground-secondary)",
                      margin: "0 0 12px 0",
                    }}
                  >
                    Personalized ranking dynamically elevates content matching reader directives.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <Button variant="primary" size="xs">Explore</Button>
                  <span style={{ fontSize: "var(--font-size-caption)", color: "var(--color-foreground-muted)" }}>
                    {s.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
};

