import { Router, Request, Response } from "express";
import { db } from "../../db";
import { clusterAllContent } from "../../agent/story_clusterer";

export const storiesRouter = Router();

/**
 * POST /api/stories/:id/follow
 * Toggles or sets the follow state of a story thread.
 */
storiesRouter.post("/:id/follow", (req: Request, res: Response) => {
  const storyId = Number(req.params.id);
  if (!Number.isInteger(storyId) || storyId <= 0) {
    res.status(400).json({ error: "Invalid story ID" });
    return;
  }

  const isFollowed =
    req.body?.is_followed !== undefined
      ? req.body.is_followed
        ? 1
        : 0
      : null;

  try {
    const current = db
      .prepare("SELECT is_followed FROM stories WHERE id = ?")
      .get(storyId) as { is_followed: number } | undefined;

    if (!current) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    const nextVal =
      isFollowed !== null ? isFollowed : current.is_followed ? 0 : 1;

    db.prepare(
      "UPDATE stories SET is_followed = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(nextVal, storyId);

    res.json({ success: true, storyId, is_followed: Boolean(nextVal) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/stories/cluster-all
 * Triggers full story re-clustering across all completed articles.
 */
storiesRouter.post("/cluster-all", (_req: Request, res: Response) => {
  try {
    const stats = clusterAllContent();
    res.json({ success: true, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

