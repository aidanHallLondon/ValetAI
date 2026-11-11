export type SettingsTab =
  | "about-me"
  | "gatherer"
  | "algorithm"
  | "tags"
  | "db"
  | "queue"
  | "ai-server"
  | "ai-models"
  | "ai-usage"
  | "ai-connection"
  | "ai-status"
  | "ai-prompts"
  | "ai-agent-scout"
  | "ai-agent-analyst"
  | "ai-agent-clusterer"
  | "ai-agent-curator"
  | "ai-agent-assistant"
  | "ai-agent-auditor"
  | "ai-rag"
  | "storybook";

export interface SettingsBreadcrumb {
  section: string;
  title: string;
}

export function getSettingsBreadcrumb(tab: SettingsTab): SettingsBreadcrumb {
  switch (tab) {
    case "about-me":
      return { section: "Profile", title: "About me" };
    case "gatherer":
      return { section: "Data", title: "Sources" };
    case "algorithm":
    case "tags":
      return { section: "Scoring", title: "Algorithm" };
    case "db":
      return { section: "Library", title: "Items" };
    case "queue":
      return { section: "Library", title: "Queue" };
    case "ai-server":
    case "ai-connection":
      return { section: "Thinking", title: "Server" };
    case "ai-models":
      return { section: "Thinking", title: "Models" };
    case "ai-rag":
      return { section: "Thinking", title: "Tools" };
    case "ai-agent-scout":
      return { section: "Thinking › Agents", title: "Scout" };
    case "ai-agent-analyst":
    case "ai-prompts":
      return { section: "Thinking › Agents", title: "Reader" };
    case "ai-agent-clusterer":
      return { section: "Thinking › Agents", title: "Organiser" };
    case "ai-agent-curator":
      return { section: "Thinking › Agents", title: "Curator" };
    case "ai-agent-assistant":
      return { section: "Thinking › Agents", title: "Assistant" };
    case "ai-agent-auditor":
      return { section: "Thinking › Agents", title: "Supervisor" };
    case "ai-status":
      return { section: "Thinking", title: "Activity" };
    case "ai-usage":
      return { section: "Thinking", title: "Usage" };
    case "storybook":
      return { section: "Design System", title: "Storybook" };
    default:
      return { section: "Settings", title: "Configuration" };
  }
}

