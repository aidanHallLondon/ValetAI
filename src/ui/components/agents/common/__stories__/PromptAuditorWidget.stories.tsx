import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import { PromptAuditorWidget } from "../PromptAuditorWidget";
import { AGENT_BOTS } from "../../../../utils/agents";
import { ComponentAnatomy } from "../../../common/__stories__/AnatomyCard";

const meta: Meta<typeof PromptAuditorWidget> = {
  title: "Complex Components/PromptAuditorWidget",
  component: PromptAuditorWidget,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Real-time agent prompt quality auditor and token verification widget. Validates interpolation syntax, detects required tokens, flags model security constraints, and provides one-click token fixes.",
      },
    },
  },
};

export default meta;

// Mock fetch interceptor helper for Storybook preview
function useMockAuditApi() {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/ai/audit-prompt")) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const prompt: string = body.prompt || "";
        const issues = [];
        const suggestions = [];
        let score = 100;

        // Check for missing raw_text
        if (!prompt.includes("{{raw_text}}")) {
          issues.push({
            severity: "error" as const,
            message: "Missing required interpolation token {{raw_text}}",
            fix: "\nArticle text:\n{{raw_text}}",
          });
          score -= 35;
        }

        // Check for single braces
        if (/\{[a-zA-Z0-9_]+\}/.test(prompt)) {
          issues.push({
            severity: "warning" as const,
            message: "Detected single braces {token}. Use double braces {{token}} for safe template interpolation.",
            fix: prompt.replace(/(?<!\{)\{([a-zA-Z0-9_]+)\}(?!\})/g, "{{$1}}"),
          });
          score -= 15;
        }

        // Check for personal directives
        if (!prompt.includes("{{directives}}")) {
          suggestions.push({
            title: "Add Personal Directives Token",
            description: "Include {{directives}} so Scout respects user feed interests and blocklists.",
            fix: "\nUser Directives:\n{{directives}}",
          });
          score -= 10;
        }

        return new Response(
          JSON.stringify({
            valid: issues.filter((i) => i.severity === "error").length === 0,
            score: Math.max(score, 20),
            issues,
            suggestions,
            tokensFound: prompt.match(/\{\{[a-zA-Z0-9_]+\}\}/g) || [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);
}

export const Anatomy: StoryObj = {
  render: () => {
    useMockAuditApi();
    const prompt = `You are Scout. Evaluate: {raw_text}`;

    return (
      <div style={{ maxWidth: 680, padding: "1rem" }}>
        <ComponentAnatomy
          level="Complex Component"
          componentName="PromptAuditorWidget"
          description="Supervisor agent prompt validator displaying live quality score badges and one-click token remediation."
          primitives={["Badge", "Button"]}
          tokens={["--color-status-success", "--color-status-warning", "--color-status-danger", "--primitive-font-mono"]}
        >
          <PromptAuditorWidget
            prompt={prompt}
            promptType="scout-system"
            agentName={AGENT_BOTS.scout.name}
          />
        </ComponentAnatomy>
      </div>
    );
  },
};

export const HealthyPrompt: StoryObj = {
  render: () => {
    useMockAuditApi();
    const [prompt, setPrompt] = useState(
      `You are ${AGENT_BOTS.scout.name}, a fast wire triage agent.\nEvaluate the following article against personal directives:\n\nDirectives:\n{{directives}}\n\nArticle:\n{{raw_text}}\n\nOutput JSON schema strictly.`
    );

    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-foreground-primary)", display: "block", marginBottom: 6 }}>
            Scout System Prompt (Valid 100/100)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              fontFamily: "var(--primitive-font-mono, monospace)",
              fontSize: "0.8rem",
              background: "var(--surface-subtle)",
              color: "var(--color-foreground-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--primitive-radius-md)",
            }}
          />
        </div>
        <PromptAuditorWidget
          prompt={prompt}
          promptType="scout-system"
          agentName={AGENT_BOTS.scout.name}
          onApplyFix={(fix) => setPrompt((prev) => `${prev}${fix}`)}
        />
      </div>
    );
  },
};

export const PromptWithIssues: StoryObj = {
  render: () => {
    useMockAuditApi();
    const [prompt, setPrompt] = useState(
      `You are Scout. Triage this post quickly.\nRead {article_content} and check {user_topics}.`
    );

    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-foreground-primary)", display: "block", marginBottom: 6 }}>
            Prompt with Syntax Warnings and Missing Required Tokens
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              fontFamily: "var(--primitive-font-mono, monospace)",
              fontSize: "0.8rem",
              background: "var(--surface-subtle)",
              color: "var(--color-foreground-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--primitive-radius-md)",
            }}
          />
        </div>
        <PromptAuditorWidget
          prompt={prompt}
          promptType="scout-system"
          agentName={AGENT_BOTS.scout.name}
          onApplyFix={(fix, isFull) => setPrompt(isFull ? fix : `${prompt}${fix}`)}
        />
      </div>
    );
  },
};

