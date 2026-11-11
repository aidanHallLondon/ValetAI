import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../Card";
import { Button } from "../Button";
import { Badge } from "../Badge";

const meta: Meta<typeof Card> = {
  title: "Primitives/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Structured container surface with modular header, title, description, content body, and footer slots. Supports interactive hover elevations.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: 480 }}>
      <CardHeader action={<Badge variant="success" dot>Active</Badge>}>
        <CardTitle>Article Analysis Engine</CardTitle>
        <CardDescription>Configures Deep Reader LLM prompt and temperature settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-foreground-secondary)" }}>
          The Deep Reader extracts executive takeaways, tags entities, and scores relevance against your personal profile.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">Reset Defaults</Button>
        <Button variant="primary" size="sm">Apply Changes</Button>
      </CardFooter>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card interactive style={{ maxWidth: 400 }}>
      <CardHeader>
        <CardTitle>Autonomous Agent Pipeline</CardTitle>
        <CardDescription>Click to inspect background worker telemetry.</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Badge variant="primary">Scout</Badge>
          <Badge variant="info">Reader</Badge>
          <Badge variant="neutral">Organiser</Badge>
        </div>
      </CardContent>
    </Card>
  ),
};

