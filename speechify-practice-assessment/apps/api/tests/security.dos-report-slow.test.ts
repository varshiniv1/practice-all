import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/index";

// Finding #8: GET /posts/report/slow runs an O(n²) synchronous loop inline
// on the request thread with no authentication guard. Any unauthenticated
// caller can trigger it repeatedly to starve the event loop (DoS).
//
// Fix requires: add requireAuth (or an admin-only check) before the handler.

describe("security: unauthenticated DoS via /posts/report/slow (finding #8)", () => {
  it("returns 401 for unauthenticated requests", async () => {
    // Without a token the server must reject the request before doing any
    // CPU work. Currently the handler runs unconditionally and returns 200,
    // so this assertion FAILS until requireAuth is added.
    const res = await request(app).get("/posts/report/slow");
    expect(res.status).toBe(401);
  });

  it("returns 401 when Authorization header is absent but other headers are present", async () => {
    const res = await request(app)
      .get("/posts/report/slow")
      .set("Content-Type", "application/json");
    expect(res.status).toBe(401);
  });
});
