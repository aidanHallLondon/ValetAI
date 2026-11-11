import type { Preview } from "@storybook/react";
import React from "react";
import "../src/ui/tokens.css";
import "../src/ui/styles.css";
import { valetDark, valetLight } from "./valetTheme";
import { ToastProvider } from "../src/ui/context/ToastContext";

const preview: Preview = {
  parameters: {
    docs: {
      theme: valetDark,
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#070a10" },
        { name: "light", value: "#f8fafc" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          "Tokens",
          ["Colors", "Typography", "Spacing", "Radii & Shadows", "Timing & Motion", "Contrast & Accessibility"],
          "Primitives",
          ["Badge", "BotAvatar", "Button", "Card", "Input", "Modal", "Select", "StageHoldRunButton", "Textarea", "Toggle"],
          "Combined Components",
          ["ArticlePagination", "FontSizeToggle", "HeaderTokenBadge", "LayoutSwitcher", "NotificationBanner", "PauseToggle", "PillToggle", "SourceBadge", "ThemeToggle", "VoteControl"],
          "Complex Components",
          ["AgentIssueCard", "AgentLiveRequestCard", "AttachedEditorFrame", "BotTimingRow", "CompoundRuleItem", "ConceptVoteRow", "EmptyState", "FeedCard", "FeedCardMetaRow", "FeedFilterBar", "MetricCard", "PipelineControlBar", "PipelineStageHeaderMenu", "PipelineTableRow", "PromptAuditorWidget", "ServerModelsTable", "SourceItemRow", "StoryClusterDrawer", "SuggestedSourceRow", "TokenCostModal"],
          "Layouts",
          ["AppHeader", "NavigationSidebar", "AgentPageHeader", "AgentTabs", "FeedView", "ReaderPage", "ReaderModal", "CommandCenter"],
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "dark", icon: "moon", title: "Dark Theme" },
          { value: "light", icon: "sun", title: "Light Theme" },
        ],
        dynamicTitle: true,
      },
    },
    fontSize: {
      description: "Global root font scale",
      defaultValue: "standard",
      toolbar: {
        title: "Font Size",
        icon: "paragraph",
        items: [
          { value: "standard", icon: "paragraph", title: "Standard (A)" },
          { value: "medium", icon: "arrowup", title: "Medium (A+)" },
          { value: "large", icon: "expand", title: "Large (A++)" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "dark";
      const fontSize = context.globals.fontSize || "standard";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-color-scheme", theme);
        document.documentElement.setAttribute("data-font-size", fontSize);
      }

      // In Docs mode, render the story cleanly without redundant wrapper padding, but wrapped in ToastProvider
      if (context.viewMode === "docs") {
        return React.createElement(ToastProvider, null, React.createElement(Story, null));
      }

      const isFullscreen = context.parameters.layout === "fullscreen";

      return React.createElement(
        ToastProvider,
        null,
        React.createElement(
          "div",
          {
            "data-theme": theme,
            "data-font-size": fontSize,
            style: {
              minHeight: "100%",
              colorScheme: theme,
              background: "var(--surface-background)",
              color: "var(--color-foreground-primary)",
              padding: isFullscreen ? 0 : "1rem",
              boxSizing: "border-box",
              fontFamily: "var(--primitive-font-sans, Inter, sans-serif)",
            },
          },
          React.createElement(Story, null)
        )
      );
    },
  ],
};

export default preview;
