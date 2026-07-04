import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/index";

/**
 * Performance Finding 1 — N+1 serial await with hardcoded 25 ms delay.
 *
 * GET /posts fetches the author for each post one at a time inside a for…of
 * loop, each time awaiting lookupAuthor() which has a hardcoded 25 ms
 * setTimeout simulating a network round-trip. With 40 seed posts this means
 * the handler waits ≥ 40 × 25 ms = 1000 ms before sending any response.
 *
 * The test asserts the safe/fast behaviour. It intentionally FAILS against
 * the current code to prove the problem before any fix is applied.
 */
describe("Performance: N+1 serial author lookup on GET /posts", () => {
  it("responds within 200 ms (only achievable with parallel lookups)", async () => {
    // Embed Date.now() in a JS comment so the expression is always a unique
    // cache key but still evaluates as: title.length > 0 (truthy for every post).
    // This guarantees a cold cache on every run and forces the full lookup path.
    const filter = encodeURIComponent(`title.length > 0 // ${Date.now()}`);

    const start = Date.now();
    const res = await request(app).get(`/posts?filter=${filter}`);
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0); // sanity: posts were returned

    // Serial (current):   40 posts × 25 ms = ≥ 1000 ms  → FAILS
    // Parallel (fixed):   all 40 concurrent ≈ 25–50 ms  → passes
    expect(elapsed).toBeLessThan(200);
  }, 5000); // 5 s timeout so the test can fail cleanly rather than time-out
});
