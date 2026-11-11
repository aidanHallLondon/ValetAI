import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { AttachedEditorFrame } from "../AttachedEditorFrame";
import { ComponentAnatomy } from "../../../common/__stories__/AnatomyCard";

const meta: Meta<typeof AttachedEditorFrame> = {
  title: "Complex Components/AttachedEditorFrame",
  component: AttachedEditorFrame,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Integrated prompt editor frame featuring Undo/Redo history buttons, default reset trigger, attached supervisor quality auditor footer, and mono-code editing surface.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => {
    const prompt = `You are Scout, the gatekeeper triage agent.\nEvaluate the incoming wire article:\n{{raw_text}}\n\nDirectives:\n{{directives}}`;
    const [val, setVal] = useState(prompt);

    return (
      <div style={{ maxWidth: 780, padding: "1rem" }}>
        <ComponentAnatomy
          level="Complex Component"
          componentName="AttachedEditorFrame"
          description="Mono-code prompt tuning frame with history toolbar and attached supervisor quality auditor footer."
          complex={["PromptAuditorWidget"]}
          primitives={["Textarea", "Button"]}
          tokens={["--primitive-font-mono", "--surface-card", "--border-subtle", "--color-status-warning"]}
        >
          <AttachedEditorFrame
            id="anatomy-editor"
            value={val}
            onChange={setVal}
            promptType="scout-system"
            rows={6}
          />
        </ComponentAnatomy>
      </div>
    );
  },
};

export const Default: StoryObj = {
  render: () => {
    const defaultPrompt = `You are Scout, the gatekeeper triage agent.\nEvaluate the incoming wire article:\n{{raw_text}}\n\nDirectives:\n{{directives}}`;
    const [history, setHistory] = useState<string[]>([defaultPrompt]);
    const [index, setIndex] = useState(0);

    const currentValue = history[index] || defaultPrompt;

    const handleChange = (newVal: string) => {
      const nextHistory = history.slice(0, index + 1);
      nextHistory.push(newVal);
      setHistory(nextHistory);
      setIndex(nextHistory.length - 1);
    };

    const handleUndo = () => {
      if (index > 0) setIndex(index - 1);
    };

    const handleRedo = () => {
      if (index < history.length - 1) setIndex(index + 1);
    };

    const handleReset = () => {
      handleChange(defaultPrompt);
    };

    return (
      <div style={{ maxWidth: 740 }}>
        <AttachedEditorFrame
          id="scout-prompt-editor"
          value={currentValue}
          onChange={handleChange}
          onResetDefault={handleReset}
          promptType="scout-system"
          rows={7}
          canUndo={index > 0}
          canRedo={index < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>
    );
  },
};
