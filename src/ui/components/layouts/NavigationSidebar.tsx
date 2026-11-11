import React from "react";
import { BotAvatar } from "../common/BotAvatar";
import { AGENT_BOTS } from "../../utils/agents";
import type { SettingsTab } from "../../utils/settingsNavigation";

export interface NavigationSidebarProps {
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
  sourcesCount?: number;
  itemsCount?: number;
  queuedCount?: number;
  isAiOnline?: boolean;
}

export function NavigationSidebar({
  isDrawerOpen,
  onCloseDrawer,
  activeTab,
  onSelectTab,
  sourcesCount = 0,
  itemsCount = 0,
  queuedCount = 0,
  isAiOnline = false,
}: NavigationSidebarProps) {
  return (
    <>
      {/* Backdrop for LHS Drawer (mobile/small screen only) */}
      <div
        className={`lhs-drawer-backdrop ${isDrawerOpen ? "open" : ""}`}
        onClick={onCloseDrawer}
        aria-hidden="true"
      />

      {/* Sidebar Navigation in LHS Drawer - positioned under logo and name */}
      <aside
        className={`navigation-sidebar command-sidebar lhs-drawer ${isDrawerOpen ? "open" : ""}`}
        aria-label="Settings Navigation"
      >
        <nav className="sidebar-nav">
          {/* About Me - Top Priority Personal Directives & Preferences */}
          <button
            type="button"
            className={activeTab === "about-me" ? "nav-item active nav-about-me" : "nav-item nav-about-me"}
            onClick={() => onSelectTab("about-me")}
          >
            <span className="nav-icon" aria-hidden="true">
              👤
            </span>
            <span>About me</span>
          </button>

          <button
            type="button"
            className={activeTab === "gatherer" ? "nav-item active" : "nav-item"}
            onClick={() => onSelectTab("gatherer")}
          >
            <span className="nav-icon" aria-hidden="true">
              📡
            </span>
            <span>Sources</span>
            <span className="nav-counter">{sourcesCount}</span>
          </button>

          {/* Algorithm Engine Tuning */}
          <button
            type="button"
            className={
              activeTab === "algorithm" || activeTab === "tags"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => onSelectTab("algorithm")}
          >
            <span className="nav-icon" aria-hidden="true">
              🎛️
            </span>
            <span>Algorithm</span>
          </button>

          {/* Library Group with Items and Queue */}
          <div className="nav-group-header">
            <span className="nav-icon" aria-hidden="true">
              🗄️
            </span>
            <span>Library</span>
          </div>

          <div className="nav-sub-group">
            <button
              type="button"
              className={
                activeTab === "db"
                  ? "nav-item nav-sub-item active"
                  : "nav-item nav-sub-item"
              }
              onClick={() => onSelectTab("db")}
            >
              <span>Items</span>
              <span className="nav-counter">{itemsCount}</span>
            </button>

            <button
              type="button"
              className={
                activeTab === "queue"
                  ? "nav-item nav-sub-item active"
                  : "nav-item nav-sub-item"
              }
              onClick={() => onSelectTab("queue")}
            >
              <span>Queue</span>
              {queuedCount > 0 ? (
                <span className="nav-counter queue-active-counter">{queuedCount}</span>
              ) : (
                <span className="nav-counter muted-counter">0</span>
              )}
            </button>
          </div>

          {/* Thinking Group with Direct Sub-Nav Items */}
          <div className="nav-group-header">
            <span className="nav-icon" aria-hidden="true">
              🧠
            </span>
            <span>Thinking</span>
            <span
              className={
                isAiOnline ? "nav-indicator online" : "nav-indicator offline"
              }
            />
          </div>

          <div className="nav-sub-group">
            <button
              type="button"
              className={
                activeTab === "ai-server" || activeTab === "ai-connection"
                  ? "nav-item nav-sub-item active"
                  : "nav-item nav-sub-item"
              }
              onClick={() => onSelectTab("ai-server")}
            >
              <span>Server</span>
            </button>

            <button
              type="button"
              className={
                activeTab === "ai-models"
                  ? "nav-item nav-sub-item active"
                  : "nav-item nav-sub-item"
              }
              onClick={() => onSelectTab("ai-models")}
            >
              <span>Models</span>
            </button>

            <button
              type="button"
              className={
                activeTab === "ai-rag"
                  ? "nav-item nav-sub-item active"
                  : "nav-item nav-sub-item"
              }
              onClick={() => onSelectTab("ai-rag")}
            >
              <span>Tools</span>
            </button>

            {/* Agents Navigation Group with Nested Dedicated Agent Pages */}
            <div className="nav-agents-wrapper">
              <button
                type="button"
                className={
                  activeTab === "ai-prompts" ||
                  activeTab === "ai-agent-scout" ||
                  activeTab === "ai-agent-analyst" ||
                  activeTab === "ai-agent-clusterer" ||
                  activeTab === "ai-agent-curator" ||
                  activeTab === "ai-agent-assistant" ||
                  activeTab === "ai-agent-auditor"
                    ? "nav-item nav-sub-item active nav-agents-header"
                    : "nav-item nav-sub-item nav-agents-header"
                }
                onClick={() => onSelectTab("ai-agent-scout")}
              >
                <span>Agents</span>
              </button>

              <div className="nav-nested-agents-list">
                <button
                  type="button"
                  className={
                    activeTab === "ai-agent-scout"
                      ? "nav-item nav-agent-item active"
                      : "nav-item nav-agent-item"
                  }
                  onClick={() => onSelectTab("ai-agent-scout")}
                  title={AGENT_BOTS.scout.name}
                >
                  <BotAvatar bot="scout" size="xs" />
                  <span>{AGENT_BOTS.scout.name}</span>
                </button>

                <button
                  type="button"
                  className={
                    activeTab === "ai-agent-analyst" || activeTab === "ai-prompts"
                      ? "nav-item nav-agent-item active"
                      : "nav-item nav-agent-item"
                  }
                  onClick={() => onSelectTab("ai-agent-analyst")}
                  title={AGENT_BOTS.reader.name}
                >
                  <BotAvatar bot="reader" size="xs" />
                  <span>{AGENT_BOTS.reader.name}</span>
                </button>

                <button
                  type="button"
                  className={
                    activeTab === "ai-agent-clusterer"
                      ? "nav-item nav-agent-item active"
                      : "nav-item nav-agent-item"
                  }
                  onClick={() => onSelectTab("ai-agent-clusterer")}
                  title={AGENT_BOTS.organiser.name}
                >
                  <BotAvatar bot="organiser" size="xs" />
                  <span>{AGENT_BOTS.organiser.name}</span>
                </button>

                <button
                  type="button"
                  className={
                    activeTab === "ai-agent-curator"
                      ? "nav-item nav-agent-item active"
                      : "nav-item nav-agent-item"
                  }
                  onClick={() => onSelectTab("ai-agent-curator")}
                  title={AGENT_BOTS.curator.name}
                >
                  <BotAvatar bot="curator" size="xs" />
                  <span>{AGENT_BOTS.curator.name}</span>
                </button>

                <button
                  type="button"
                  className={
                    activeTab === "ai-agent-assistant"
                      ? "nav-item nav-agent-item active"
                      : "nav-item nav-agent-item"
                  }
                  onClick={() => onSelectTab("ai-agent-assistant")}
                  title={AGENT_BOTS.assistant.name}
                >
                  <BotAvatar bot="assistant" size="xs" />
                  <span>{AGENT_BOTS.assistant.name}</span>
                </button>

                <button
                  type="button"
                  className={
                    activeTab === "ai-agent-auditor"
                      ? "nav-item nav-agent-item active"
                      : "nav-item nav-agent-item"
                  }
                  onClick={() => onSelectTab("ai-agent-auditor")}
                  title={AGENT_BOTS.supervisor.name}
                >
                  <BotAvatar bot="supervisor" size="xs" />
                  <span>{AGENT_BOTS.supervisor.name}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              className={
                activeTab === "ai-status"
                  ? "nav-item nav-sub-item active"
                  : "nav-item nav-sub-item"
              }
              onClick={() => onSelectTab("ai-status")}
            >
              <span>Activity</span>
            </button>

            <button
              type="button"
              className={
                activeTab === "ai-usage"
                  ? "nav-item nav-sub-item active"
                  : "nav-item nav-sub-item"
              }
              onClick={() => onSelectTab("ai-usage")}
            >
              <span>Usage</span>
            </button>
          </div>

          {/* Design System & Component Library at the bottom */}
          <div className="nav-group-header" style={{ marginTop: "var(--primitive-space-3)" }}>
            <span className="nav-icon" aria-hidden="true">
              🎨
            </span>
            <span>Design System</span>
          </div>

          <button
            type="button"
            className={activeTab === "storybook" ? "nav-item active" : "nav-item"}
            onClick={() => onSelectTab("storybook")}
            title="Open Storybook component library"
          >
            <span className="nav-icon" aria-hidden="true">
              📖
            </span>
            <span>Storybook</span>
            <span className="nav-counter" style={{ fontSize: "0.6875rem" }}>UI</span>
          </button>
        </nav>
      </aside>
    </>
  );
}

