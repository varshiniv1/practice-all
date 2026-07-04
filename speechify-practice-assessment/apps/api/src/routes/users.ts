import { Router } from "express";
import { users, findUserById } from "../db";
import { requireAuth } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";

const router = Router();

router.get("/:id", (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  const { id, username, bio } = user;
  res.json({ id, username, bio });
});

// PATCH /users/:id -- update a profile's bio/email.
// Requires *a* valid token, but never checks that the caller is updating
// their own profile.
router.patch("/:id", requireAuth, (req: AuthedRequest, res) => {
  if (req.user!.sub !== req.params.id) return res.status(403).json({ error: "Forbidden" });
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });

  const { bio, email } = req.body ?? {};
  if (bio !== undefined) user.bio = bio;
  if (email !== undefined) user.email = email;

  res.json({ id: user.id, username: user.username, bio: user.bio });
});

router.get("/", requireAuth, (req: AuthedRequest, res) => {
  if (!req.user!.isAdmin) return res.status(403).json({ error: "Forbidden" });
  // Admin-only listing -- but the admin check was never actually wired up.
  res.json(users.map((u) => ({ id: u.id, username: u.username, email: u.email })));
});

export default router;
