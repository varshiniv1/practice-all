/**
 * Failing regression test for finding #15: /auth/register has no duplicate-
 * username check. Registering a username that already exists silently pushes a
 * second user object into the array. findUserByUsername() always returns the
 * FIRST match, so the new account's password is permanently unreachable via
 * login — the second user is a ghost.
 *
 * These tests assert the CORRECT behaviour (reject duplicates with 409).
 * They currently FAIL because no uniqueness check exists.
 * They will PASS once a duplicate guard is added to the register route.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/index";

describe("security: duplicate username on register (finding #15)", () => {
  it("returns 409 when registering a username that is already taken", async () => {
    // "alice" is seeded in db.ts — it already exists
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "alice", password: "brandnewpassword" });

    // FAILS now: register has no uniqueness check so it returns 201 and pushes
    // a second "alice" whose password is unreachable via /auth/login
    expect(res.status).toBe(409);
  });

  it("returns an error body explaining the conflict", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "bob", password: "anotherpassword" });

    // FAILS now: returns 201 with a token instead of an error
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/username.*taken|already.*exists|conflict/i);
  });

  it("the second registration's password must not become unreachable (ghost account)", async () => {
    // Register a fresh user with password A
    const username = "ghosttest_user";
    await request(app)
      .post("/auth/register")
      .send({ username, password: "passwordA" });

    // Attempt a second registration for the same username with password B.
    // A correct implementation returns 409 here and stops.
    // The broken implementation silently pushes a second user object.
    await request(app)
      .post("/auth/register")
      .send({ username, password: "passwordB" });

    // If a duplicate was silently created, findUserByUsername() returns the
    // FIRST match (passwordA) — logging in with passwordB must fail because
    // the second account's hash is never reached.
    // Once a 409 guard exists, only passwordA is valid and passwordB is never
    // stored at all, so this login attempt correctly returns 401 either way.
    //
    // We want to verify that the second registration was rejected outright (409)
    // by checking the register response directly:
    const dupRes = await request(app)
      .post("/auth/register")
      .send({ username, password: "passwordC" });

    // FAILS now: returns 201 (pushes a third ghost) instead of rejecting
    expect(dupRes.status).toBe(409);
  });
});
