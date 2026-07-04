import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/index";

describe("auth", () => {
  it("logs in the seeded user with correct credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "alice", password: "alice123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects an unknown user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "nobody", password: "whatever" });

    expect(res.status).toBe(401);
  });
});
