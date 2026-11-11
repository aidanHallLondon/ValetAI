import { Router, Request, Response } from "express";
import { getSetting, setSetting, DEFAULT_PRICING, type PricingSettings } from "../../db";
import { triggerGathererRestart } from "./sources";

export const systemRouter = Router();

/**
 * GET /api/system/pause or /api/pause
 * Returns whether background processing is paused.
 */
systemRouter.get(["/pause", "/system/pause"], (_req: Request, res: Response) => {
  const paused = getSetting<boolean>("backgroundProcessingPaused", false);
  res.json({ paused });
});

/**
 * POST /api/system/pause or /api/pause
 * Toggles or explicitly sets background processing paused state.
 */
systemRouter.post(["/pause", "/system/pause"], async (req: Request, res: Response) => {
  const current = getSetting<boolean>("backgroundProcessingPaused", false);
  const next = typeof req.body?.paused === "boolean" ? req.body.paused : !current;
  setSetting("backgroundProcessingPaused", next);
  console.log(`[System] Background processing paused state changed to: ${next}`);

  if (!next) {
    void triggerGathererRestart();
  }

  res.json({ paused: next });
});

/**
 * POST /api/gatherer/trigger
 * Triggers an immediate, out-of-schedule Gatherer harvest across all active sources.
 */
systemRouter.post("/gatherer/trigger", async (_req: Request, res: Response) => {
  console.log("[UI Server] Manual gatherer trigger requested");
  const result = await triggerGathererRestart();
  res.json({ success: result.triggered, output: result.output });
});

/**
 * POST /api/settings/pricing
 * Updates pricing per million tokens configuration.
 */
systemRouter.post("/settings/pricing", (req: Request, res: Response) => {
  const current = getSetting<PricingSettings>("pricingSettings", DEFAULT_PRICING);
  const updated: PricingSettings = {
    llmInputPricePerMillion: Number(req.body?.llmInputPricePerMillion ?? current.llmInputPricePerMillion),
    llmOutputPricePerMillion: Number(req.body?.llmOutputPricePerMillion ?? current.llmOutputPricePerMillion),
    embeddingPricePerMillion: Number(req.body?.embeddingPricePerMillion ?? current.embeddingPricePerMillion),
    currencySymbol: req.body?.currencySymbol || current.currencySymbol || "$",
    perModelRates: req.body?.perModelRates ?? current.perModelRates ?? {},
  };
  setSetting("pricingSettings", updated);
  res.json({ pricing: updated, success: true });
});

const iframePermissionCache = new Map<string, boolean>();

/**
 * GET /api/system/check-iframe
 * Checks whether a target URL refuses iframe embedding via X-Frame-Options or CSP headers.
 */
systemRouter.get("/system/check-iframe", async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || typeof targetUrl !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  let domain = "";
  try {
    const u = new URL(targetUrl);
    domain = u.hostname.toLowerCase();
  } catch {
    return res.json({ refusesIframe: true, reason: "invalid-url" });
  }

  if (iframePermissionCache.has(domain)) {
    return res.json({ domain, refusesIframe: iframePermissionCache.get(domain) });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const headRes = await fetch(targetUrl, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeout);

    const xfo = (headRes.headers.get("x-frame-options") || "").toLowerCase();
    const csp = (headRes.headers.get("content-security-policy") || "").toLowerCase();

    const refuses =
      xfo === "deny" ||
      xfo === "sameorigin" ||
      csp.includes("frame-ancestors 'none'") ||
      csp.includes("frame-ancestors 'self'");

    iframePermissionCache.set(domain, refuses);
    res.json({ domain, refusesIframe: refuses });
  } catch {
    // If request fails or times out, default to true for safety
    iframePermissionCache.set(domain, true);
    res.json({ domain, refusesIframe: true, fallback: true });
  }
});


