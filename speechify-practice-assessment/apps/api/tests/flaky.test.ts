import { describe, expect, it } from "vitest";
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
