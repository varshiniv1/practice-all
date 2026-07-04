import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "@snapfeed/shared/src/types";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET env var is required");

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
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
