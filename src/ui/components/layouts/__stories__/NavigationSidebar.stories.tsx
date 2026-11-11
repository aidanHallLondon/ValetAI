import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { NavigationSidebar } from "../NavigationSidebar";
import type { SettingsTab } from "../CommandCenter";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof NavigationSidebar> = {
  title: "Layouts/NavigationSidebar",
  component: NavigationSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Left navigation rail and responsive drawer providing persistent access to personal directives (About Me), feed sources, algorithm tuning, library queue, the six autonomous intelligence agents, and the Storybook workbench.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>("about-me");

    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-background)", minHeight: "100vh" }}>
        <ComponentAnatomy
          level="Layout"
          componentName="NavigationSidebar"
          description="Slide-out drawer and docked navigation rail featuring categorised groups and agent bot avatars."
          primitives={["Badge", "Button", "BotAvatar"]}
          tokens={["--surface-card", "--surface-subtle", "--color-status-success", "--color-agent-scout", "--color-agent-reader"]}
        >
          <div style={{ height: "650px", position: "relative", border: "1px solid var(--border-subtle)", borderRadius: "var(--primitive-radius-md)", overflow: "hidden" }}>
            <NavigationSidebar
              isDrawerOpen={true}
              onCloseDrawer={() => { }}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              sourcesCount={9}
              itemsCount={142}
              queuedCount={3}
              isAiOnline={true}
            />
            <div style={{ marginLeft: "260px", padding: "1.5rem" }}>
              <h4 style={{ margin: "0 0 8px", color: "var(--color-foreground-primary)" }}>Active Viewport Panel</h4>
              <p style={{ margin: 0, color: "var(--color-foreground-secondary)", fontSize: "0.9rem" }}>
                Active destination: <strong style={{ color: "var(--color-accent-default)" }}>{activeTab}</strong>
              </p>
            </div>
          </div>
        </ComponentAnatomy>
      </div>
    );
  },
};

export const InteractiveDrawer: StoryObj = {
  render: () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>("about-me");
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div style={{ height: "100vh", position: "relative", background: "var(--surface-background)" }}>
        {!isOpen && (
          <div style={{ padding: "2rem" }}>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setIsOpen(true)}
              style={{
                background: "var(--color-accent-default)",
                color: "var(--color-accent-text-on-btn)",
                padding: "8px 16px",
                borderRadius: "var(--primitive-radius-md)",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ☰ Open Settings Navigation Drawer
            </button>
          </div>
        )}
        <NavigationSidebar
          isDrawerOpen={isOpen}
          onCloseDrawer={() => setIsOpen(false)}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          sourcesCount={9}
          itemsCount={142}
          queuedCount={3}
          isAiOnline={true}
        />
        <div style={{ marginLeft: isOpen ? "270px" : "1rem", padding: "2rem", transition: "margin-left 0.22s ease" }}>
          <h2 style={{ color: "var(--color-foreground-primary)", marginTop: 0 }}>Active Tab Preview</h2>
          <p style={{ color: "var(--color-foreground-secondary)" }}>
            Currently selected navigation destination: <strong style={{ color: "var(--color-accent-default)" }}>{activeTab}</strong>
          </p>
        </div>
      </div>
    );
  },
};
