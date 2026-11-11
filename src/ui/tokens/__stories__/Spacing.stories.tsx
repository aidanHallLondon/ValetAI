import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

const meta: Meta = {
  title: "Tokens/Spacing",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "4px-based geometric spacing scale for paddings, gaps, and margins across all UI cards, headers, and navigation rails.",
      },
    },
  },
};

export default meta;

export const SpacingScale: StoryObj = {
  render: () => {
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const copyToken = (token: string) => {
      navigator.clipboard.writeText(`var(${token})`);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 1500);
    };

    const spaces = [
      { name: "space-1", variable: "--primitive-space-1", rem: "0.25rem", px: "4px", desc: "Micro gaps, icon offsets" },
      { name: "space-2", variable: "--primitive-space-2", rem: "0.5rem", px: "8px", desc: "Tight button padding, badge gaps" },
      { name: "space-3", variable: "--primitive-space-3", rem: "0.75rem", px: "12px", desc: "Form field spacing, compact padding" },
      { name: "space-4", variable: "--primitive-space-4", rem: "1rem", px: "16px", desc: "Standard card padding, component gaps" },
      { name: "space-5", variable: "--primitive-space-5", rem: "1.25rem", px: "20px", desc: "Section gutters, dialog padding" },
      { name: "space-6", variable: "--primitive-space-6", rem: "1.5rem", px: "24px", desc: "Major container gutters" },
      { name: "space-8", variable: "--primitive-space-8", rem: "2rem", px: "32px", desc: "Empty state spacing, section breaks" },
      { name: "space-12", variable: "--primitive-space-12", rem: "3rem", px: "48px", desc: "Large page margin blocks" },
    ];

    return (
      <div style={{ maxWidth: 850 }}>
        <h3 style={{ margin: "0 0 0.25rem", color: "var(--color-foreground-primary)" }}>Primitive Spacing Scale</h3>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "var(--color-foreground-muted)" }}>
          Strict 4px/8px incremental grid scale for margins, paddings, and flex/grid gaps.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {spaces.map((s) => (
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
                gap: "1.5rem",
                cursor: "pointer",
              }}
            >
              <div style={{ width: 140 }}>
                <strong style={{ fontSize: "0.85rem", color: "var(--color-foreground-primary)" }}>{s.name}</strong>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: 2 }}>
                  <code style={{ fontSize: "0.72rem", color: "var(--color-accent-default)" }}>{s.rem}</code>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-foreground-muted)" }}>({s.px})</span>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    height: 24,
                    width: `var(${s.variable})`,
                    background: "var(--color-accent-default)",
                    borderRadius: 2,
                    minWidth: 4,
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--color-foreground-muted)" }}>{s.desc}</span>
              </div>

              <span style={{ fontSize: "0.72rem", color: copiedToken === s.variable ? "var(--color-status-success)" : "var(--color-foreground-muted)" }}>
                {copiedToken === s.variable ? "Copied!" : "Copy"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

