import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { NotificationBanner } from "../NotificationBanner";
import { ComponentAnatomy } from "./AnatomyCard";

const meta: Meta<typeof NotificationBanner> = {
  title: "Combined Components/NotificationBanner",
  component: NotificationBanner,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "System feedback banner for inline messages, confirmations, and alerts with automatic status coloring and dismiss triggers.",
      },
    },
  },
};

export default meta;

export const Anatomy: StoryObj = {
  render: () => {
    return (
      <div style={{ maxWidth: 640, padding: "1rem" }}>
        <ComponentAnatomy
          level="Combined Component"
          componentName="NotificationBanner"
          description="Alert surface integrating semantic status fills, status iconography, and an accessible dismiss action."
          primitives={["Card", "Button"]}
          tokens={["--color-status-success", "--color-status-warning", "--color-status-danger", "--surface-card"]}
        >
          <NotificationBanner
            variant="success"
            message="✓ Master guidance directive updated and approved by Supervisor (94/100)."
            onDismiss={() => alert("Dismissed")}
          />
        </ComponentAnatomy>
      </div>
    );
  },
};

export const AllVariants = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 600 }}>
    <NotificationBanner
      variant="success"
      message="✓ Master guidance directive updated and approved by Supervisor (94/100)."
      onDismiss={() => {}}
    />
    <NotificationBanner
      variant="warning"
      message="⚠️ Unfilled template placeholders detected: [TOWN], [TEAM]. Please edit tags."
      onDismiss={() => {}}
    />
    <NotificationBanner
      variant="danger"
      message="Error: LM Studio connection refused on http://localhost:1234. Is the server running?"
      onDismiss={() => {}}
    />
    <NotificationBanner
      variant="info"
      message="ℹ️ Valet recovered 3 pending articles that were paused during system reboot."
      onDismiss={() => {}}
    />
  </div>
);
