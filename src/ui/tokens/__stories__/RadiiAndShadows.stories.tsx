import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

const meta: Meta = {
  title: "Tokens/Radii & Shadows",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Normalized corner radius scales (4px to full pill), elevation drop shadows, and layout container max-width constraints.",
      },
    },
  },
};

export default meta;

export const RadiiAndShadowsOverview: StoryObj = {
  render: () => {
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const copyToken = (token: string) => {
      navigator.clipboard.writeText(`var(${token})`);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 1500);
    };

    const radii = [
      { name: "radius-xs", variable: "--primitive-radius-xs", value: "4px", desc: "Code chips, micro tags" },
      { name: "radius-sm", variable: "--primitive-radius-sm", value: "6px", desc: "Standard buttons, text inputs" },
      { name: "radius-md", variable: "--primitive-radius-md", value: "8px", desc: "Dropdown menus, small cards" },
      { name: "radius-lg", variable: "--primitive-radius-lg", value: "12px", desc: "Standard cards, modals" },
      { name: "radius-xl", variable: "--primitive-radius-xl", value: "16px", desc: "Large hero dialogs" },
      { name: "radius-full", variable: "--primitive-radius-full", value: "9999px", desc: "Pills, toggle sliders, avatars" },
    ];

    const shadows = [
      {
        name: "Card Elevation",
        variable: "--shadow-card",
        desc: "Resting card and interactive container elevation",
      },
      {
        name: "Modal Elevation",
        variable: "--shadow-modal",
        desc: "Top-layer dialogs, popovers, and floating drawers",
      },
    ];

    const layoutTokens = [
      { name: "Feed Max Width", variable: "--feed-max-width", value: "720px", desc: "Optimal line length for reading feed" },
      { name: "Command Center Width", variable: "--command-center-max-width", value: "1480px", desc: "Admin and intelligence dashboard canvas" },
    ];

    return (
      <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* 1. Border Radii */}
        <section>
          <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>Corner Radii</h3>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
            Standard curvature tokens from micro chips (4px) to full pill rounding (9999px).
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {radii.map((r) => (
              <div
                key={r.variable}
                onClick={() => copyToken(r.variable)}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: `var(${r.variable})`,
                  padding: "1.25rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    border: "2px solid var(--color-accent-default)",
                    borderRadius: `var(${r.variable})`,
                    marginBottom: "0.75rem",
                    background: "rgba(56, 189, 248, 0.1)",
                  }}
                />
                <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-primary)" }}>{r.name}</strong>
                <code style={{ fontSize: "0.72rem", color: "var(--color-accent-default)", margin: "2px 0" }}>
                  {r.value}
                </code>
                <span style={{ fontSize: "0.7rem", color: "var(--color-foreground-muted)" }}>{r.desc}</span>
                <span style={{ fontSize: "0.68rem", color: copiedToken === r.variable ? "var(--color-status-success)" : "var(--color-foreground-muted)", marginTop: 4 }}>
                  {copiedToken === r.variable ? "Copied!" : "Click to copy"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Elevation & Shadows */}
        <section>
          <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>Elevation & Depth Shadows</h3>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
            Adaptive shadows designed for dark deep-navy and light warm-paper surfaces.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {shadows.map((s) => (
              <div
                key={s.variable}
                onClick={() => copyToken(s.variable)}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--primitive-radius-lg)",
                  padding: "1.5rem",
                  boxShadow: `var(${s.variable})`,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong style={{ color: "var(--color-foreground-primary)" }}>{s.name}</strong>
                  <span style={{ fontSize: "0.7rem", color: copiedToken === s.variable ? "var(--color-status-success)" : "var(--color-foreground-muted)" }}>
                    {copiedToken === s.variable ? "Copied!" : "Copy"}
                  </span>
                </div>
                <code style={{ fontSize: "0.75rem", color: "var(--color-accent-default)" }}>{s.variable}</code>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--color-foreground-muted)" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Layout Dimensions */}
        <section>
          <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>Layout Dimensions</h3>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
            Standard max-width constraints for reader views and administrative canvases.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {layoutTokens.map((l) => (
              <div
                key={l.variable}
                onClick={() => copyToken(l.variable)}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--primitive-radius-md)",
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <strong style={{ color: "var(--color-foreground-primary)", fontSize: "0.9rem" }}>{l.name}</strong>
                  <code style={{ fontSize: "0.75rem", color: "var(--color-accent-default)" }}>{l.value}</code>
                </div>
                <code style={{ fontSize: "0.72rem", color: "var(--color-foreground-muted)", display: "block", marginBottom: "0.25rem" }}>
                  {l.variable}
                </code>
                <span style={{ fontSize: "0.72rem", color: "var(--color-foreground-muted)" }}>{l.desc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  },
};

