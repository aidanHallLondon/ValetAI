export type AgentId = "scout" | "reader" | "organiser" | "curator" | "assistant" | "supervisor";

export interface AgentBotMeta {
  id: AgentId;
  name: string;
  botName: string; // Alias for name
  title: string;   // Alias for name
  key: string;
  tabKey: string;
  roleDescription: string;
  color: string;
  colorLight: string;
  colorDimmed: string;
  bgLight: string;
  iconEmoji: string;
}

/**
 * Canonical Agent Definitions
 * Canonical names MUST NEVER vary in the UI:
 * Scout, Reader, Organiser, Curator, Assistant, Supervisor
 */
export const AGENT_BOTS: Record<AgentId, AgentBotMeta> = {
  scout: {
    id: "scout",
    name: "Scout",
    botName: "Scout",
    title: "Scout",
    key: "agent-scout",
    tabKey: "ai-agent-scout",
    roleDescription: "Fast Gatekeeper & Triage Analyst",
    color: "#0284c7",
    colorLight: "#38bdf8",
    colorDimmed: "rgba(2, 132, 199, 0.45)",
    bgLight: "rgba(2, 132, 199, 0.12)",
    iconEmoji: "🎯",
  },
  reader: {
    id: "reader",
    name: "Reader",
    botName: "Reader",
    title: "Reader",
    key: "agent-analyst",
    tabKey: "ai-agent-analyst",
    roleDescription: "Analytical Intelligence Reader",
    color: "#3b82f6",
    colorLight: "#60a5fa",
    colorDimmed: "rgba(59, 130, 246, 0.45)",
    bgLight: "rgba(59, 130, 246, 0.12)",
    iconEmoji: "📖",
  },
  organiser: {
    id: "organiser",
    name: "Organiser",
    botName: "Organiser",
    title: "Organiser",
    key: "agent-clusterer",
    tabKey: "ai-agent-clusterer",
    roleDescription: "Multi-Source Story Weaver",
    color: "#10b981",
    colorLight: "#34d399",
    colorDimmed: "rgba(16, 185, 129, 0.45)",
    bgLight: "rgba(16, 185, 129, 0.12)",
    iconEmoji: "🧵",
  },
  curator: {
    id: "curator",
    name: "Curator",
    botName: "Curator",
    title: "Curator",
    key: "agent-curator",
    tabKey: "ai-agent-curator",
    roleDescription: "Knowledge Ontologist & Archivist",
    color: "#8b5cf6",
    colorLight: "#a78bfa",
    colorDimmed: "rgba(139, 92, 246, 0.45)",
    bgLight: "rgba(139, 92, 246, 0.12)",
    iconEmoji: "🗂️",
  },
  assistant: {
    id: "assistant",
    name: "Assistant",
    botName: "Assistant",
    title: "Assistant",
    key: "agent-assistant",
    tabKey: "ai-agent-assistant",
    roleDescription: "Personal Preferences & Executive Briefing",
    color: "#6366f1",
    colorLight: "#818cf8",
    colorDimmed: "rgba(99, 102, 241, 0.45)",
    bgLight: "rgba(99, 102, 241, 0.12)",
    iconEmoji: "🤵",
  },
  supervisor: {
    id: "supervisor",
    name: "Supervisor",
    botName: "Supervisor",
    title: "Supervisor",
    key: "agent-auditor",
    tabKey: "ai-agent-auditor",
    roleDescription: "Prompt Sentinel & Quality Guardian",
    color: "#f59e0b",
    colorLight: "#fbbf24",
    colorDimmed: "rgba(245, 158, 11, 0.45)",
    bgLight: "rgba(245, 158, 11, 0.12)",
    iconEmoji: "🛡️",
  },
};

export function getAgentBot(id: AgentId): AgentBotMeta {
  return AGENT_BOTS[id];
}

export function getAgentName(id: AgentId): string {
  return AGENT_BOTS[id]?.name || id;
}

