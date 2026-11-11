import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

const meta: Meta = {
  title: "Tokens/Timing & Motion",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Normalized time/timing primitives and semantic motion cases for Valet AI. Covers micro-durations, cubic-bezier easing curves, compound transitions, and WCAG-compliant reduced-motion accessibility.",
      },
    },
  },
};

export default meta;

/* ==========================================================================
   Section 1: Primitive Duration Scales
   ========================================================================== */

interface DurationItem {
  name: string;
  variable: string;
  ms: number;
  description: string;
}

const DURATIONS: DurationItem[] = [
  { name: "Instant", variable: "--primitive-duration-instant", ms: 75, description: "Micro-interactions, checkbox clicks, active press state" },
  { name: "Fast", variable: "--primitive-duration-fast", ms: 150, description: "Hover states, badge fades, button color morphs, tooltips" },
  { name: "Normal", variable: "--primitive-duration-normal", ms: 200, description: "Standard UI transitions, tabs, cards, dropdown toggles" },
  { name: "Moderate", variable: "--primitive-duration-moderate", ms: 300, description: "Dialog/modal pop-in, drawer slides, accordion expand" },
  { name: "Slow", variable: "--primitive-duration-slow", ms: 500, description: "Toast notifications, floating snackbars, complex panel reveals" },
  { name: "Deliberate", variable: "--primitive-duration-deliberate", ms: 750, description: "State sync animations, progress indicators, graceful dismissals" },
];

export const DurationScales = () => {
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const triggerPlay = () => {
    setPlaying(false);
    setTimeout(() => setPlaying(true), 20);
  };

  const copy = (val: string) => {
    navigator.clipboard.writeText(`var(${val})`);
    setCopied(val);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--color-foreground-primary)" }}>
            Primitive Duration Scales (Tier 1)
          </h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>
            Calibrated timing steps from 75ms micro-feedback to 750ms deliberate transitions.
          </p>
        </div>
        <button
          onClick={triggerPlay}
          style={{
            background: "var(--color-accent-default)",
            color: "var(--color-accent-text-on-btn)",
            border: "none",
            borderRadius: "var(--primitive-radius-sm)",
            padding: "8px 16px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ▶ Play All ({playing ? "Restarting" : "Run Animation"})
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {DURATIONS.map((dur) => (
          <div
            key={dur.variable}
            onClick={() => copy(dur.variable)}
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--primitive-radius-md)",
              padding: "14px 18px",
              cursor: "pointer",
              transition: "border-color 0.15s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <strong style={{ fontSize: "0.95rem", color: "var(--color-foreground-primary)" }}>{dur.name}</strong>
                <code style={{ fontSize: "0.8rem", color: "var(--color-accent-default)", background: "var(--surface-subtle)", padding: "2px 6px", borderRadius: "4px" }}>
                  {dur.variable}
                </code>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-foreground-primary)" }}>{dur.ms}ms</span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>
                  {copied === dur.variable ? "✓ Copied" : "Copy"}
                </span>
              </div>
            </div>

            <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "var(--color-foreground-muted)" }}>
              {dur.description}
            </p>

            {/* Animation track */}
            <div
              style={{
                width: "100%",
                height: "6px",
                background: "var(--surface-subtle)",
                borderRadius: "3px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "var(--color-accent-default)",
                  borderRadius: "3px",
                  width: playing ? "100%" : "0%",
                  transition: playing ? `width ${dur.ms}ms cubic-bezier(0.2, 0, 0, 1)` : "none",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   Section 2: Primitive Easing Curves
   ========================================================================== */

interface EasingItem {
  name: string;
  variable: string;
  curve: string;
  cubicValue: string;
  usage: string;
}

const EASINGS: EasingItem[] = [
  { name: "Standard", variable: "--primitive-easing-standard", curve: "cubic-bezier(0.2, 0, 0, 1)", cubicValue: "0.2, 0, 0, 1", usage: "General UI transitions, tabs, card hovers (natural deceleration)" },
  { name: "Entrance", variable: "--primitive-easing-entrance", curve: "cubic-bezier(0, 0, 0.2, 1)", cubicValue: "0, 0, 0.2, 1", usage: "Elements entering the screen (modals, dropdowns, tooltips)" },
  { name: "Exit", variable: "--primitive-easing-exit", curve: "cubic-bezier(0.4, 0, 1, 1)", cubicValue: "0.4, 0, 1, 1", usage: "Elements leaving the screen (dialog dismiss, fade-out)" },
  { name: "Bounce", variable: "--primitive-easing-bounce", curve: "cubic-bezier(0.34, 1.56, 0.64, 1)", cubicValue: "0.34, 1.56, 0.64, 1", usage: "Playful feedback, toggle switches, toast pops, counter updates" },
  { name: "Linear", variable: "--primitive-easing-linear", curve: "linear", cubicValue: "0, 0, 1, 1", usage: "Continuous spinning loaders, progress bars, marquee scrolls" },
];

export const EasingCurves = () => {
  const [active, setActive] = useState(false);

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--color-foreground-primary)" }}>
            Primitive Easing Curves (Tier 1)
          </h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>
            Physics-calibrated cubic-bezier curves for natural momentum and fluid motion.
          </p>
        </div>
        <button
          onClick={() => setActive(!active)}
          style={{
            background: "var(--color-accent-default)",
            color: "var(--color-accent-text-on-btn)",
            border: "none",
            borderRadius: "var(--primitive-radius-sm)",
            padding: "8px 16px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {active ? "Reset Curves" : "▶ Test Curves (800ms)"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {EASINGS.map((e) => (
          <div
            key={e.variable}
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--primitive-radius-md)",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <strong style={{ fontSize: "0.95rem", color: "var(--color-foreground-primary)" }}>{e.name}</strong>
                <code style={{ fontSize: "0.8rem", color: "var(--color-accent-default)", background: "var(--surface-subtle)", padding: "2px 6px", borderRadius: "4px" }}>
                  {e.variable}
                </code>
              </div>
              <code style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>{e.curve}</code>
            </div>

            <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "var(--color-foreground-muted)" }}>
              {e.usage}
            </p>

            {/* Interactive physics track */}
            <div
              style={{
                width: "100%",
                height: "36px",
                background: "var(--surface-subtle)",
                borderRadius: "var(--primitive-radius-sm)",
                position: "relative",
                display: "flex",
                alignItems: "center",
                padding: "0 6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "var(--color-accent-default)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                  transform: active ? "translateX(calc(960px - 90px))" : "translateX(0px)",
                  transition: `transform 800ms ${e.curve}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   Section 3: Semantic Motion Cases & Compound Transitions
   ========================================================================== */

interface SemanticCase {
  title: string;
  durationVar: string;
  easingVar: string;
  compoundVar?: string;
  description: string;
  demoType: "hover" | "toggle" | "dialog" | "fade";
}

const CASES: SemanticCase[] = [
  {
    title: "Interactive Hover & Focus",
    durationVar: "--motion-duration-hover (150ms)",
    easingVar: "--motion-easing-default (cubic-bezier)",
    compoundVar: "--transition-interactive / --transition-color",
    description: "Buttons, list rows, interactive card borders, and icon highlight states.",
    demoType: "hover",
  },
  {
    title: "Active Tap / Instant Click",
    durationVar: "--motion-duration-active (75ms)",
    easingVar: "--primitive-easing-linear",
    compoundVar: "--transition-fast",
    description: "Pressed button sink, checkbox tick, radio selection.",
    demoType: "hover",
  },
  {
    title: "Toggle Switch Spring Bounce",
    durationVar: "--motion-duration-feedback (200ms)",
    easingVar: "--motion-easing-bounce",
    compoundVar: "transform var(--motion-duration-feedback) var(--motion-easing-bounce)",
    description: "Binary setting switches, bookmark stars, favorite icons.",
    demoType: "toggle",
  },
  {
    title: "Modal / Dialog Reveal",
    durationVar: "--motion-duration-dialog (300ms)",
    easingVar: "--motion-easing-enter",
    compoundVar: "--transition-dialog",
    description: "Command Center overlays, reader article modals, alert dialogues.",
    demoType: "dialog",
  },
  {
    title: "Inline Fade / State Feedback",
    durationVar: "--motion-duration-feedback (200ms)",
    easingVar: "--motion-easing-default",
    compoundVar: "--transition-fade",
    description: "Filter pill dismissals, search clear icons, helper message swaps.",
    demoType: "fade",
  },
];

export const SemanticMotionCases = () => {
  const [toggleState, setToggleState] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fadeState, setFadeState] = useState(true);

  return (
    <div style={{ maxWidth: 960 }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--color-foreground-primary)" }}>
        Semantic Motion Cases & Transitions (Tier 2)
      </h2>
      <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>
        Pre-composed transition tokens mapping purposeful UX intent directly to primitive durations and curves.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1rem" }}>
        {CASES.map((c) => (
          <div
            key={c.title}
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
              <strong style={{ fontSize: "0.95rem", color: "var(--color-foreground-primary)", display: "block", marginBottom: "6px" }}>
                {c.title}
              </strong>
              <p style={{ fontSize: "0.8rem", color: "var(--color-foreground-muted)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                {c.description}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "1rem" }}>
                <code style={{ fontSize: "0.72rem", color: "var(--color-accent-default)", background: "var(--surface-subtle)", padding: "2px 6px", borderRadius: "3px" }}>
                  {c.durationVar}
                </code>
                {c.compoundVar && (
                  <code style={{ fontSize: "0.72rem", color: "var(--color-foreground-secondary)", background: "var(--surface-subtle)", padding: "2px 6px", borderRadius: "3px" }}>
                    {c.compoundVar}
                  </code>
                )}
              </div>
            </div>

            {/* Interactive Demo Box */}
            <div
              style={{
                background: "var(--surface-subtle)",
                borderRadius: "var(--primitive-radius-sm)",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "70px",
              }}
            >
              {c.demoType === "toggle" && (
                <div
                  onClick={() => setToggleState(!toggleState)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: "9999px",
                    background: toggleState ? "var(--color-accent-default)" : "var(--surface-elevated)",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background var(--motion-duration-feedback) var(--motion-easing-default)",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: toggleState ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-inverse)",
                      position: "absolute",
                      top: 2,
                      left: 2,
                      transform: toggleState ? "translateX(20px)" : "translateX(0px)",
                      transition: "transform var(--motion-duration-feedback) var(--motion-easing-bounce)",
                    }}
                  />
                </div>
              )}

              {c.demoType === "hover" && (
                <button
                  style={{
                    background: "var(--surface-elevated)",
                    color: "var(--color-foreground-primary)",
                    border: "1px solid var(--border-subtle)",
                    padding: "8px 16px",
                    borderRadius: "var(--primitive-radius-sm)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    transition: "var(--transition-interactive)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-accent-default)";
                    e.currentTarget.style.color = "var(--color-accent-text-on-btn)";
                    e.currentTarget.style.borderColor = "var(--color-accent-default)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface-elevated)";
                    e.currentTarget.style.color = "var(--color-foreground-primary)";
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                  }}
                >
                  Hover Me (150ms)
                </button>
              )}

              {c.demoType === "dialog" && (
                <div style={{ position: "relative", textAlign: "center" }}>
                  <button
                    onClick={() => setDialogOpen(!dialogOpen)}
                    style={{
                      background: "var(--color-accent-default)",
                      color: "var(--color-accent-text-on-btn)",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "var(--primitive-radius-sm)",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    {dialogOpen ? "Dismiss Modal" : "Open Modal Demo"}
                  </button>

                  {dialogOpen && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "10px 14px",
                        background: "var(--surface-dialog, var(--surface-card))",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "var(--primitive-radius-md)",
                        boxShadow: "var(--shadow-modal)",
                        fontSize: "0.75rem",
                        color: "var(--color-foreground-primary)",
                        animation: "dialogIn var(--motion-duration-dialog) var(--motion-easing-enter)",
                      }}
                    >
                      <style>{`
                        @keyframes dialogIn {
                          from { opacity: 0; transform: scale(0.92) translateY(6px); }
                          to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                      `}</style>
                      ✓ Animated in via <code>--transition-dialog</code>
                    </div>
                  )}
                </div>
              )}

              {c.demoType === "fade" && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => setFadeState(!fadeState)}
                    style={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--color-foreground-secondary)",
                      padding: "4px 10px",
                      borderRadius: "var(--primitive-radius-sm)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Toggle Fade
                  </button>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-status-success)",
                      fontWeight: 600,
                      opacity: fadeState ? 1 : 0,
                      transition: "var(--transition-fade)",
                    }}
                  >
                    Active Status
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   Section 4: Reduced Motion & Accessibility Guide
   ========================================================================== */

export const ReducedMotionGuide = () => {
  return (
    <div style={{ maxWidth: 960 }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--color-foreground-primary)" }}>
        Accessibility: Reduced Motion Guardrails (WCAG 2.1)
      </h2>
      <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>
        Valet AI automatically respects operating system motion preferences via the <code>prefers-reduced-motion</code> media query.
      </p>

      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 10px 0", color: "var(--color-status-warning)" }}>
          Automatic Token Zeroing
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--color-foreground-secondary)", lineHeight: 1.6, margin: "0 0 1rem 0" }}>
          When a user enables <em>"Reduce Motion"</em> in macOS (Settings › Accessibility › Display) or Windows, all primitive duration variables are zeroed out:
        </p>

        <pre
          style={{
            background: "var(--surface-background)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--primitive-radius-sm)",
            padding: "1rem",
            fontSize: "0.8rem",
            color: "var(--color-accent-default)",
            overflowX: "auto",
            lineHeight: 1.5,
          }}
        >
{`@media (prefers-reduced-motion: reduce) {
  :root {
    --primitive-duration-instant: 0ms;
    --primitive-duration-fast: 0ms;
    --primitive-duration-normal: 0ms;
    --primitive-duration-moderate: 0ms;
    --primitive-duration-slow: 0ms;
    --primitive-duration-deliberate: 0ms;

    --transition-interactive: none;
    --transition-fast: none;
    --transition-color: none;
    --transition-transform: none;
    --transition-dialog: none;
    --transition-drawer: none;
    --transition-fade: none;
    --transition-toast: none;
  }
}`}
        </pre>
      </div>
    </div>
  );
};

