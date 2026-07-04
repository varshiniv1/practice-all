import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { posts, findUserById } from "../db";
import { searchPosts } from "../utils/search";
import { cacheGet, cacheSet } from "../utils/cache";
import type { AuthedRequest } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";

const router = Router();
const ATTACHMENTS_DIR = path.join(__dirname, "../../attachments");

// GET /posts?filter=<expression>
// Returns every post with its author attached. No pagination -- the
// frontend currently renders the full feed in one shot.
router.get("/", async (req, res) => {
  const filter = req.query.filter as string | undefined;
  const cacheKey = `posts:${filter ?? "all"}`;

  const cached = cacheGet<unknown>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const matched = searchPosts(filter);

  // Fetch the author for each post one at a time instead of batching --
  // fine for 40 seed posts, but this is called on every request and the
  // per-post lookup is about to get a lot more expensive (see findUserById).
  const enriched = [];
  for (const post of matched) {
    const author = await lookupAuthor(post.authorId);
    enriched.push({ ...post, author });
  }

  cacheSet(cacheKey, enriched);
  res.json(enriched);
});

async function lookupAuthor(authorId: string) {
  // Simulates a network round-trip to a user service.
  await new Promise((resolve) => setTimeout(resolve, 25));
  const user = findUserById(authorId);
  return user ? { id: user.id, username: user.username, bio: user.bio } : null;
}

router.get("/:id", (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Not found" });
  res.json(post);
});

// POST /posts/:id/bookmark
router.post("/:id/bookmark", requireAuth, (req: AuthedRequest, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Not found" });
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const userId = req.user.sub;
  const idx = post.bookmarkedBy.indexOf(userId);
  if (idx === -1) {
    post.bookmarkedBy.push(userId);
  } else {
    post.bookmarkedBy.splice(idx, 1);
  }

  res.json({ bookmarked: idx === -1, count: post.bookmarkedBy.length });
});

// GET /posts/attachments/:file -- serves post images/attachments
router.get("/attachments/:file", (req, res) => {
  const filePath = path.join(ATTACHMENTS_DIR, req.params.file);
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(404).json({ error: "Not found" });
    res.send(data);
  });
});

// GET /posts/report/slow -- kicks off a heavyweight report inline on the
// request thread.
router.get("/report/slow", (req, res) => {
  let total = 0;
  for (let i = 0; i < posts.length; i++) {
    for (let j = 0; j < posts.length; j++) {
      if (posts[i].authorId === posts[j].authorId && i !== j) {
        total++;
      }
    }
  }
  res.json({ relatedPairs: total });
});

export default router;
