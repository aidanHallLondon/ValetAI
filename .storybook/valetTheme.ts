import { create } from "@storybook/theming/create";

export const valetDark = create({
  base: "dark",

  // Typography - Aligned strictly with src/ui/tokens.css
  fontBase: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',

  // Brand Primaries
  colorPrimary: "#38bdf8",
  colorSecondary: "#38bdf8",

  // UI Surfaces
  appBg: "#070a10",           // --primitive-dark-neutral-950
  appContentBg: "#0b0f17",    // --surface-background
  appPreviewBg: "#0b0f17",
  appBorderColor: "#2f3e5c",  // --border-subtle
  appBorderRadius: 8,         // --primitive-radius-md

  // Text Colors (WCAG AA compliant >= 4.5:1)
  textColor: "#f1f5f9",       // --color-foreground-primary
  textInverseColor: "#070a10",// --color-foreground-inverse
  textMutedColor: "#869cc5",  // --color-foreground-muted

  // Toolbar & Navigation
  barTextColor: "#9cb1d4",    // --color-foreground-secondary
  barSelectedColor: "#38bdf8",// --color-accent-default
  barHoverColor: "#7dd3fc",   // --primitive-accent-sky-hover-dark
  barBg: "#0b0f17",           // --surface-background

  // Form Controls
  inputBg: "#141c2b",         // --surface-card
  inputBorder: "#2f3e5c",     // --border-subtle
  inputTextColor: "#f1f5f9",  // --color-foreground-primary
  inputBorderRadius: 6,       // --primitive-radius-sm

  // Branding
  brandTitle: "Valet Design System",
  brandUrl: "/",
  brandTarget: "_self",
});

export const valetLight = create({
  base: "light",

  // Typography
  fontBase: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
  fontCode: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',

  // Brand Primaries
  colorPrimary: "#0369a1",
  colorSecondary: "#0369a1",

  // UI Surfaces
  appBg: "#f8fafc",           // --surface-background
  appContentBg: "#ffffff",    // --surface-card
  appPreviewBg: "#f8fafc",
  appBorderColor: "#e2e8f0",  // --border-subtle
  appBorderRadius: 8,

  // Text Colors
  textColor: "#090d16",       // --color-foreground-primary
  textInverseColor: "#ffffff",// --color-foreground-inverse
  textMutedColor: "#57687f",  // --color-foreground-muted

  // Toolbar & Navigation
  barTextColor: "#475569",    // --color-foreground-secondary
  barSelectedColor: "#0369a1",// --color-accent-default
  barHoverColor: "#075985",
  barBg: "#f8fafc",

  // Form Controls
  inputBg: "#ffffff",
  inputBorder: "#cbd5e1",
  inputTextColor: "#090d16",
  inputBorderRadius: 6,

  // Branding
  brandTitle: "Valet Design System",
  brandUrl: "/",
  brandTarget: "_self",
});

