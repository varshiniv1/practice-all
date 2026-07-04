import { describe, it, expect, vi } from "vitest";

/**
 * Security Finding #7 — Hardcoded JWT secret fallback
 *
 * Original code: `process.env.JWT_SECRET || "snapfeed-super-secret-key-2024"`
 * Anyone who reads the repo can forge valid tokens with the committed secret.
 * The fix: throw at module-load time when JWT_SECRET is absent so the server
 * refuses to start rather than silently using a known-public key.
 *
 * This test confirms the runtime guard is in place.  It must FAIL against the
 * original code (the module loads without error) and PASS after the fix.
 */
describe("[security] JWT_SECRET must be required at startup", () => {
  it("auth middleware throws on module load when JWT_SECRET is absent", async () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    vi.resetModules();

    try {
      await expect(import("../src/middleware/auth")).rejects.toThrow(
        "JWT_SECRET env var is required"
      );
    } finally {
      if (saved !== undefined) process.env.JWT_SECRET = saved;
      vi.resetModules();
    }
  });
});
