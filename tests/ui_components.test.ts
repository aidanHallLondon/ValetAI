import { describe, it, expect } from "vitest";
import * as CommonComponents from "../src/ui/components/common";

describe("Normalized UI Component Library", () => {
  it("exports all core design primitives", () => {
    expect(CommonComponents.Button).toBeDefined();
    expect(CommonComponents.Badge).toBeDefined();
    expect(CommonComponents.Card).toBeDefined();
    expect(CommonComponents.CardHeader).toBeDefined();
    expect(CommonComponents.CardTitle).toBeDefined();
    expect(CommonComponents.CardDescription).toBeDefined();
    expect(CommonComponents.CardContent).toBeDefined();
    expect(CommonComponents.CardFooter).toBeDefined();
    expect(CommonComponents.Modal).toBeDefined();
    expect(CommonComponents.Input).toBeDefined();
    expect(CommonComponents.Textarea).toBeDefined();
    expect(CommonComponents.Select).toBeDefined();
    expect(CommonComponents.Toggle).toBeDefined();
    expect(CommonComponents.MetricCard).toBeDefined();
    expect(CommonComponents.EmptyState).toBeDefined();
    expect(CommonComponents.NotificationBanner).toBeDefined();
  });
});

