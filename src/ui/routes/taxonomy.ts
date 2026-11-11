import { Router, Request, Response } from "express";

export const taxonomyRouter = Router();

/**
 * GET /api/taxonomy/shelves
 * Returns the current curated knowledge shelves from the library.
 */
taxonomyRouter.get("/shelves", (_req: Request, res: Response) => {
  try {
    const { getCuratedTaxonomy } = require("../../agent/taxonomy_curator");
    const result = getCuratedTaxonomy();
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/taxonomy/curate
 * Triggers a fresh vector & entity taxonomy discovery pass across all library articles.
 */
taxonomyRouter.post("/curate", (_req: Request, res: Response) => {
  try {
    const { curateTaxonomy } = require("../../agent/taxonomy_curator");
    const result = curateTaxonomy();
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

