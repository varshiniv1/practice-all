import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/index";

// Regression test for finding #10: no rate limiting on /auth/login or
// /auth/register allows trivial brute-force attacks.
//
// A safe implementation must return 429 Too Many Requests after a threshold
// of rapid failed attempts from the same client.
describe("security: rate limiting on auth endpoints (finding #10)", () => {
  it("returns 429 after repeated failed login attempts from the same IP", async () => {
    const ATTEMPTS = 20;
    let lastStatus = 0;

    for (let i = 0; i < ATTEMPTS; i++) {
      const res = await request(app)
        .post("/auth/login")
        .send({ username: "alice", password: `wrongpassword${i}` });
      lastStatus = res.status;
      if (res.status === 429) break;
    }

    // Without rate limiting the server returns 401 every time.
    // This assertion fails until a rate-limiter middleware is added.
    expect(lastStatus).toBe(429);
  });

  it("returns 429 after repeated register attempts from the same IP", async () => {
    const ATTEMPTS = 20;
    let lastStatus = 0;

    for (let i = 0; i < ATTEMPTS; i++) {
      const res = await request(app)
        .post("/auth/register")
        .send({ username: `spamuser${i}`, password: "password123" });
      lastStatus = res.status;
      if (res.status === 429) break;
    }

    expect(lastStatus).toBe(429);
  });
});
