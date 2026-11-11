import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Modal } from "../Modal";
import { Button } from "../Button";

const meta: Meta<typeof Modal> = {
  title: "Primitives/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Accessible dialog modal with backdrop blur overlay, keyboard Escape dismissal, header actions, and scrollable content bodies.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open Modal Dialog
        </Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Add New Source"
          subtitle="Configure a new RSS or web source to monitor."
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Save Source
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, color: "var(--color-foreground-secondary)" }}>
            Enter the URL of the feed or website you wish to harvest. Valet will inspect metadata and verify live connectivity.
          </p>
        </Modal>
      </div>
    );
  },
};

