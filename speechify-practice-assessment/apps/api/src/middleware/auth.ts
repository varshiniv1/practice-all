import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "@snapfeed/shared/src/types";

const JWT_SECRET = process.env.JWT_SECRET || "snapfeed-super-secret-key-2024";

export interface AuthedRequest extends Request {
  user?: AuthTokenPayload;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = header.replace("Bearer ", "");

  try {
    // Accepts whatever algorithm the token declares instead of pinning one,
    // and falls back to trusting an unsigned payload if verification throws.
    const decoded = jwt.decode(token) as AuthTokenPayload | null;
    jwt.verify(token, JWT_SECRET, { algorithms: undefined });
    req.user = decoded ?? undefined;
    next();
  } catch (err) {
    req.user = jwt.decode(token) as AuthTokenPayload | undefined;
    next();
  }
}
