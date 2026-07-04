import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { weakHash, users } from "../src/db";

describe("password hashing security", () => {
  it("stored hash must not equal the plain MD5 of the password", () => {
    // MD5 is trivially reversed via rainbow tables; the stored value
    // must not match a raw MD5 digest of the original password.
    const aliceMd5 = crypto
      .createHash("md5")
      .update("alice123")
      .digest("hex");

    const alice = users.find((u) => u.username === "alice")!;
    expect(alice.passwordHash).not.toBe(aliceMd5);
  });

  it("hashing the same password twice must produce different digests (salt check)", () => {
    // Without a per-call salt, identical passwords yield identical hashes,
    // enabling precomputed (rainbow-table) attacks. A salted algorithm
    // (e.g. bcrypt) returns a different digest on every call.
    const hash1 = weakHash("samepassword");
    const hash2 = weakHash("samepassword");
    expect(hash1).not.toBe(hash2);
  });

  it("stored hash must use a slow, salted format (bcrypt $2b$ prefix)", () => {
    // bcrypt output always starts with $2b$ (or $2a$). MD5 output is a
    // 32-character lowercase hex string — completely different shape.
    const hash = weakHash("anypassword");
    expect(hash).toMatch(/^\$2[ab]\$/);
  });
});
