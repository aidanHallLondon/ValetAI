import express from "express";
import path from "node:path";
import fs from "node:fs";
import { db } from "../db";
import { contentRouter } from "./routes/content";
import { sourcesRouter, triggerGathererRestart } from "./routes/sources";
import { storiesRouter } from "./routes/stories";
import { taxonomyRouter } from "./routes/taxonomy";
import {
  telemetryRouter,
  getBotTimingStats,
  DEFAULT_MODEL_SETTINGS,
} from "./routes/telemetry";
import { systemRouter } from "./routes/system";
import { aiRouter, fetchServerModelMetadata } from "./routes/ai";
import { libraryRouter } from "./routes/library";

// Re-export common utilities for backward compatibility
export {
  DEFAULT_MODEL_SETTINGS,
  fetchServerModelMetadata,
  triggerGathererRestart,
  getBotTimingStats,
};

export const app = express();
app.use(express.json());

/**
 * Handles health check requests.
 * Returns process uptime, memory metrics, and database connectivity status.
 */
function handleHealthCheck(_req: express.Request, res: express.Response): void {
  try {
    const dbCheck = db.prepare("SELECT 1 as ok").get() as { ok: number } | undefined;
    if (!dbCheck || dbCheck.ok !== 1) {
      throw new Error("Database connectivity check failed");
    }

    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: "healthy",
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "unhealthy",
      error: message,
    });
  }
}

// Health check endpoints
app.get("/healthz", handleHealthCheck);
app.get("/api/health", handleHealthCheck);

// Mount modular sub-routers
app.use("/api/content", contentRouter);
app.use("/api/sources", sourcesRouter);
app.use("/api/stories", storiesRouter);
app.use("/api/taxonomy", taxonomyRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/library", libraryRouter);
app.get("/api/agent/versions", (_req, res) => {
  try {
    const { getActivePromptVersions } = require("../agent/prompt_versioning");
    res.json(getActivePromptVersions());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});
app.use("/api", systemRouter);
app.use("/api", aiRouter);

// Serve static Storybook documentation if built
const storybookStaticPath = path.resolve(process.cwd(), "storybook-static");
if (fs.existsSync(storybookStaticPath)) {
  app.use("/storybook", express.static(storybookStaticPath));
}

// Serve public static assets (favicons, manifest, app icons)
const publicStaticPath = path.resolve(process.cwd(), "public");
if (fs.existsSync(publicStaticPath)) {
  app.use(express.static(publicStaticPath));
}

export async function startUiServer(
  port: number = Number(process.env.PORT || 3001)
) {
  const distPath = path.resolve(process.cwd(), "dist/ui");

  if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
      root: path.resolve(process.cwd(), "src/ui"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(port, () => {
      console.log(`[UI Server] Valet UI & API listening at http://localhost:${port}`);
      resolve(server);
    });
  });
}

const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("src/ui/index.ts") ||
    process.argv[1].endsWith("src/ui"));

if (isMainModule) {
  startUiServer().catch((err) => {
    console.error("[UI Server] Fatal startup error:", err);
    process.exit(1);
  });
}
