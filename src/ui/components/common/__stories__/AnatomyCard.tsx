import React, { useState } from "react";

export interface ComponentAnatomyProps {
  level: "Primitive" | "Combined Component" | "Complex Component" | "Layout";
  componentName: string;
  description?: string;
  primitives?: string[];
  combined?: string[];
  complex?: string[];
  layouts?: string[];
  tokens?: string[];
  children?: React.ReactNode;
}

export const ComponentAnatomy: React.FC<ComponentAnatomyProps> = ({
  level,
  componentName,
  description,
  primitives = [],
  combined = [],
  complex = [],
  layouts = [],
  tokens = [],
  children,
}) => {
  const [highlightParts, setHighlightParts] = useState(false);

  const getTierBadge = () => {
    switch (level) {
      case "Primitive":
        return { label: "Primitive Atom • Tier 1", color: "var(--color-status-success)" };
      case "Combined Component":
        return { label: "Combined Component • Tier 2", color: "var(--primitive-accent-sky-dark)" };
      case "Complex Component":
        return { label: "Complex Organism • Tier 3", color: "var(--color-agent-curator)" };
      case "Layout":
        return { label: "Page & Screen Layout • Tier 4", color: "var(--color-agent-supervisor)" };
      default:
        return { label: level, color: "var(--color-accent-default)" };
    }
  };

  const tier = getTierBadge();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: "1.25rem",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--primitive-radius-lg)",
        boxShadow: "var(--shadow-card)",
        maxWidth: 1100,
        margin: "0 auto 1.5rem",
      }}
    >
      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: tier.color,
              marginBottom: "4px",
            }}
          >
            {tier.label}
          </span>
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--color-foreground-primary)" }}>
            {componentName} Anatomy
          </h3>
          {description && (
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-foreground-secondary)" }}>
              {description}
            </p>
          )}
        </div>

        {children && (
          <button
            type="button"
            onClick={() => setHighlightParts(!highlightParts)}
            style={{
              background: highlightParts ? "var(--color-accent-default)" : "var(--surface-subtle)",
              color: highlightParts ? "var(--color-accent-text-on-btn)" : "var(--color-foreground-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--primitive-radius-md)",
              padding: "6px 12px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--motion-duration-hover) ease",
            }}
          >
            {highlightParts ? "✓ Subcomponents Highlighted" : "👁 Highlight Subcomponents"}
          </button>
        )}
      </div>

      {/* Composition Badges Matrix */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          background: "var(--surface-subtle)",
          padding: "12px",
          borderRadius: "var(--primitive-radius-md)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Primitives */}
        {primitives.length > 0 && (
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-foreground-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              🧱 Primitives Used ({primitives.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {primitives.map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "var(--surface-card)",
                    color: "var(--color-foreground-primary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Combined Components */}
        {combined.length > 0 && (
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-foreground-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              🧩 Combined Components ({combined.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {combined.map((c) => (
                <span
                  key={c}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "rgba(56, 189, 248, 0.12)",
                    color: "var(--primitive-accent-sky-dark)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Complex Components */}
        {complex.length > 0 && (
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-foreground-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              📦 Complex Components ({complex.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {complex.map((c) => (
                <span
                  key={c}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "rgba(139, 92, 246, 0.12)",
                    color: "var(--color-agent-curator)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Layouts */}
        {layouts.length > 0 && (
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-foreground-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              📐 Layout Shells ({layouts.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {layouts.map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "rgba(245, 158, 11, 0.12)",
                    color: "var(--color-agent-supervisor)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tokens */}
        {tokens.length > 0 && (
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-foreground-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              🎨 Key Tokens ({tokens.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {tokens.map((t) => (
                <code
                  key={t}
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "var(--surface-card)",
                    color: "var(--color-foreground-secondary)",
                    border: "1px solid var(--border-subtle)",
                    fontFamily: "var(--primitive-font-mono, monospace)",
                  }}
                >
                  {t}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Component Preview Container */}
      {children && (
        <div
          style={{
            marginTop: "0.5rem",
            position: "relative",
            outline: highlightParts ? "2px dashed var(--color-accent-default)" : "none",
            outlineOffset: "4px",
            borderRadius: "var(--primitive-radius-md)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

