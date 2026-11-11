import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Toggle } from "../Toggle";

const meta: Meta<typeof Toggle> = {
  title: "Primitives/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Binary switch control with smooth bouncy thumb transitions, keyboard navigation, and ARIA switch accessibility roles.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Interactive: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Toggle
          checked={checked}
          onChange={setChecked}
          label={checked ? "Background Processing Active" : "Background Processing Paused"}
        />
        <Toggle
          checked={true}
          disabled
          onChange={() => {}}
          label="Locked Configuration (Disabled)"
        />
      </div>
    );
  },
};

