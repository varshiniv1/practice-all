import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/index";

async function loginAs(username: string, password: string): Promise<string> {
  const res = await request(app)
    .post("/auth/login")
    .send({ username, password });
  return res.body.token as string;
}

describe("security: user route authorization", () => {
  it("issue #1 — PATCH /users/:id rejects updates to another user's profile (IDOR)", async () => {
    // Alice tries to overwrite Bob's bio/email using her own valid token.
    // Should be 403; currently returns 200 because no ownership check exists.
    const aliceToken = await loginAs("alice", "alice123");

    const res = await request(app)
      .patch("/users/u2") // Bob's id
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ bio: "Hacked by Alice", email: "alice@evil.com" });

    expect(res.status).toBe(403);
  });

  it("issue #2 — GET /users/ is admin-only and rejects non-admin tokens", async () => {
    // Any authenticated non-admin user should get 403, not the full user list.
    // Currently returns 200 because the admin check was never wired up.
    const aliceToken = await loginAs("alice", "alice123");

    const res = await request(app)
      .get("/users/")
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(res.status).toBe(403);
  });
});
