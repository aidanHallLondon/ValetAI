import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  PipelineStageHeaderMenu,
  type StageFilterOption,
} from "../PipelineStageHeaderMenu";
import { ComponentAnatomy } from "../../common/__stories__/AnatomyCard";

const meta: Meta<typeof PipelineStageHeaderMenu> = {
  title: "Complex Components/PipelineStageHeaderMenu",
  component: PipelineStageHeaderMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Interactive stage column header with popover filter selection and stage execution triggers for pipeline tables.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => {
    return (
      <div style={{ padding: "1.5rem", background: "var(--surface-background)" }}>
        <ComponentAnatomy
          level="Complex Component"
          componentName="PipelineStageHeaderMenu"
          description="Coordinates stage filtering, health diagnostics, and selective reprocessing."
          complex={[]}
          combined={[]}
          primitives={["BotAvatar", "Button"]}
          tokens={["--color-primary", "--surface-card", "--border-subtle"]}
        />
      </div>
    );
  },
};

export const InteractiveSandbox: StoryObj = {
  render: () => {
    const [activeBotMenu, setActiveBotMenu] = useState<string | null>("reader");
    const [stageFilter, setStageFilter] = useState<StageFilterOption>("all");

    return (
      <div style={{ padding: "3rem", background: "var(--surface-background)" }}>
        <table className="library-pipeline-table" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <PipelineStageHeaderMenu
                botKey="reader"
                activeBotMenu={activeBotMenu}
                onToggleBotMenu={setActiveBotMenu}
                stageFilter={stageFilter}
                onSelectStageFilter={setStageFilter}
                counts={{ all: 48, problems: 3, problemsOld: 7 }}
                cleanActionLabel="Clean issues"
                forceActionLabel="Force rerun all"
                onReprocessClean={() => console.log("Clean reader")}
                onReprocessForce={() => console.log("Force reader")}
                isProcessing={false}
              />
            </tr>
          </thead>
        </table>
      </div>
    );
  },
};

