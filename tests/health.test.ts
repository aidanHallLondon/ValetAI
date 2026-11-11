import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "node:http";
import { app } from "../src/ui";

describe("Health Check Endpoints", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === "object" && addr) {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("GET /healthz returns HTTP 200 with ok status and metrics", async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.database).toBe("healthy");
    expect(typeof data.uptimeSeconds).toBe("number");
    expect(data.memory).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it("GET /api/health returns HTTP 200 with identical health payload", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.database).toBe("healthy");
  });

  it("GET and POST /api/system/pause toggle background processing state", async () => {
    // 1. Initial status check
    const initialRes = await fetch(`${baseUrl}/api/system/pause`);
    expect(initialRes.status).toBe(200);
    const initialData = await initialRes.json();
    expect(typeof initialData.paused).toBe("boolean");

    // 2. Pause the system
    const pauseRes = await fetch(`${baseUrl}/api/system/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: true }),
    });
    expect(pauseRes.status).toBe(200);
    const pauseData = await pauseRes.json();
    expect(pauseData.paused).toBe(true);

    // 3. Resume the system
    const resumeRes = await fetch(`${baseUrl}/api/system/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: false }),
    });
    expect(resumeRes.status).toBe(200);
    const resumeData = await resumeRes.json();
    expect(resumeData.paused).toBe(false);
  });
});

