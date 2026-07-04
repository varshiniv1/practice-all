import { describe, expect, it, vi, afterEach } from "vitest";
import request from "supertest";
import app from "../src/index";

describe("trending", () => {
  // This asserts success every time, but the underlying route has roughly
  // a 30% chance of throwing -- so this test fails intermittently in CI.
  it("returns trending topics", async () => {
    const res = await request(app).get("/trending");
    expect(res.status).toBe(200);
    expect(res.body.topics.length).toBeGreaterThan(0);
  });
});

describe("trending - unhandled rejection regression", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Regression test: when fetchTrendingTopics throws, the route must catch
  // the rejection and respond with 500. Without a .catch() the promise
  // rejection is unhandled, Express never sends a response, and the client
  // hangs (supertest times out below).
  it("responds with 500 when fetchTrendingTopics throws", async () => {
    // Pin Math.random below 0.3 so the error branch is taken every time.
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const res = await request(app).get("/trending").timeout(3000);
    expect(res.status).toBe(500);
  });
});
