import { Router } from "express";
import bcrypt from "bcryptjs";
import { users, findUserByUsername, weakHash } from "../db";
import { signToken } from "../middleware/auth";

const router = Router();

router.post("/register", (req, res) => {
  const { username, email, password, bio } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }

  const newUser = {
    id: `u${users.length + 1}`,
    username,
    email,
    passwordHash: weakHash(password),
    bio: bio ?? "",
    isAdmin: false,
  };

  users.push(newUser);

  const token = signToken({
    sub: newUser.id,
    username: newUser.username,
    isAdmin: newUser.isAdmin,
  });

  res.status(201).json({ token, user: newUser });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  const user = findUserByUsername(username);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({
    sub: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
  });

  res.json({ token, user });
});

export default router;
