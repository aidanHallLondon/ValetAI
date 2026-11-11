import React from "react";
import { AGENT_BOTS, type AgentId } from "../../../utils/agents";
import { BotAvatar } from "../../common/BotAvatar";

export interface AgentPageHeaderProps {
  /**
   * Recognized agent bot identifier. If provided, avatar, name, color, and role are inferred automatically.
   */
  bot?: AgentId;
  /**
   * Custom avatar or icon node (used for custom views like "About Me" or server settings).
   */
  avatarNode?: React.ReactNode;
  /**
   * Main page title. Overrides default bot name if provided.
   */
  title?: string;
  /**
   * Character or persona badge text. Overrides default bot role if provided.
   */
  roleDescription?: string;
  /**
   * Brand or identity accent color for the title or badge.
   */
  badgeColor?: string;
  /**
   * Subtitle description text or elements.
   */
  subtitle: React.ReactNode;
  /**
   * Optional timing benchmark row or telemetry widget.
   */
  timingNode?: React.ReactNode;
  /**
   * Optional right-aligned header navigation or action buttons.
   */
  actionsNode?: React.ReactNode;
  /**
   * Optional custom container class name.
   */
  className?: string;
}

/**
 * Standardized header layout for agent views and control panels.
 * Displays character avatar, identity title, persona description, live telemetry, and action shortcuts.
 */
export function AgentPageHeader({
  bot,
  avatarNode,
  title,
  roleDescription,
  badgeColor,
  subtitle,
  timingNode,
  actionsNode,
  className = "",
}: AgentPageHeaderProps) {
  const botConfig = bot ? AGENT_BOTS[bot] : null;
  const displayTitle = title || botConfig?.name || "Agent";
  const displayRole = roleDescription || botConfig?.roleDescription;
  const displayColor = badgeColor || botConfig?.color;

  return (
    <div className={`agent-page-header ${className}`.trim()}>
      <div className="agent-header-meta">
        {avatarNode ? (
          avatarNode
        ) : bot ? (
          <BotAvatar bot={bot} size="lg" showHalo />
        ) : null}

        <div>
          <h3 className="agent-header-title">{displayTitle}</h3>

          {displayRole && (
            <div className="bot-character-badge">
              <span
                className="bot-name"
                style={{
                  color: bot
                    ? `var(--color-agent-${bot}-light, var(--color-agent-${bot}))`
                    : displayColor,
                }}
              >
                {displayTitle}
              </span>{" "}
              · {displayRole}
            </div>
          )}

          <p className="agent-header-subtitle">{subtitle}</p>

          {timingNode}
        </div>
      </div>

      {actionsNode && (
        <div className="agent-header-nav-actions">{actionsNode}</div>
      )}
    </div>
  );
}
