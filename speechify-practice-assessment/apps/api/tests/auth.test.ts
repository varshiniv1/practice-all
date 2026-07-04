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

  it("[security] login response must not expose passwordHash", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "alice", password: "alice123" });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("[security] register response must not expose passwordHash", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "testleak", password: "hunter2" });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});
