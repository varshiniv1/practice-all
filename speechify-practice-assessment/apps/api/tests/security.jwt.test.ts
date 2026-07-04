import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/index";

/**
 * Security Finding 2 (Gap) — JWT auth bypass: no test for token rejection
 *
 * auth.ts was fixed to use jwt.verify() with algorithm pinned to ["HS256"],
 * but no test verified that a forged, expired, or alg:none token is actually
 * rejected. A regression could silently re-open the authentication bypass.
 *
 * These tests hit POST /posts/p1/bookmark which is protected by requireAuth.
 * The middleware runs before post-ID lookup, so 401 is returned for any
 * invalid token regardless of whether p1 exists.
 */
describe("Security: JWT rejection on requireAuth-protected routes", () => {
  const PROTECTED = "/posts/p1/bookmark";

  it("no Authorization header → 401", async () => {
    const res = await request(app).post(PROTECTED);
    expect(res.status).toBe(401);
  });

  it("malformed header (not Bearer) → 401", async () => {
    const res = await request(app)
      .post(PROTECTED)
      .set("Authorization", "Basic dXNlcjpwYXNz");
    expect(res.status).toBe(401);
  });

  it("token signed with wrong secret → 401", async () => {
    const forged = jwt.sign({ sub: "u1", isAdmin: false }, "wrong-secret-key");
    const res = await request(app)
      .post(PROTECTED)
      .set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it("expired token → 401", async () => {
    const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
    const expired = jwt.sign(
      { sub: "u1", isAdmin: false },
      JWT_SECRET,
      { expiresIn: -1 } // expired 1 second in the past
    );
    const res = await request(app)
      .post(PROTECTED)
      .set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it("alg:none token (unsigned) → 401", async () => {
    // Manually craft an unsigned JWT (alg:none attack).
    // Some libraries strip the padding — base64url requires no padding.
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }))
      .toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ sub: "u1", isAdmin: true, iat: Math.floor(Date.now() / 1000) })
    ).toString("base64url");
    const algNoneToken = `${header}.${payload}.`;
    const res = await request(app)
      .post(PROTECTED)
      .set("Authorization", `Bearer ${algNoneToken}`);
    expect(res.status).toBe(401);
  });

  it("truncated / garbage token → 401", async () => {
    const res = await request(app)
      .post(PROTECTED)
      .set("Authorization", "Bearer not.a.jwt");
    expect(res.status).toBe(401);
  });
});
