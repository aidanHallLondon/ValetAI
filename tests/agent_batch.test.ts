import { describe, it, expect } from "vitest";
import { claimPendingContentBatch, claimNextPendingContent } from "../src/agent";
import { CONFIG } from "../src/config";

describe("Agent Batch Processing", () => {
  it("exports batch claiming function with default batch size", () => {
    expect(typeof claimPendingContentBatch).toBe("function");
    expect(CONFIG.AGENT.BATCH_SIZE).toBe(5);
  });

  it("exports backwards-compatible single item claimer", () => {
    expect(typeof claimNextPendingContent).toBe("function");
  });

  it("returns an array when claiming batches from database", () => {
    const batch = claimPendingContentBatch(2);
    expect(Array.isArray(batch)).toBe(true);
    expect(batch.length).toBeLessThanOrEqual(2);
  });
});

