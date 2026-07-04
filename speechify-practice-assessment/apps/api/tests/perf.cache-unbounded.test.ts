/**
 * Failing regression test for finding #14: utils/cache.ts has no TTL or size
 * cap, so an attacker who sends many unique filter strings can grow the
 * in-process Map without limit until the API OOMs.
 *
 * These tests assert the CORRECT behaviour (bounded cache).
 * They currently FAIL because no eviction or cap exists.
 * They will PASS once a maximum size (and/or TTL) is enforced.
 */
import { describe, it, expect } from "vitest";
import { cacheSet, cacheStats } from "../src/utils/cache";

describe("Cache: unbounded memory growth (finding #14)", () => {
  it("should not grow beyond a maximum size when flooded with unique keys", () => {
    const MAX_ACCEPTABLE_SIZE = 1_000;

    for (let i = 0; i < 10_000; i++) {
      cacheSet(`attacker-unique-filter-${i}`, { result: i });
    }

    // FAILS now: no cap — store.size grows to at least 10 000
    expect(cacheStats().size).toBeLessThanOrEqual(MAX_ACCEPTABLE_SIZE);
  });

  it("should support a TTL so stale entries are eventually evicted", async () => {
    // Set a short-lived entry using a TTL option.
    // FAILS now: cacheSet() accepts only (key, value) — no TTL parameter exists,
    // so there is no eviction mechanism at all.
    const TTL_MS = 50;

    // @ts-expect-error — TTL parameter does not exist yet (that's the bug)
    cacheSet("ttl-probe", "temporary", { ttl: TTL_MS });

    await new Promise((r) => setTimeout(r, TTL_MS + 20));

    // After the TTL the entry should have expired.
    // Import cacheGet inline so TypeScript doesn't complain about the import order.
    const { cacheGet } = await import("../src/utils/cache");

    // FAILS now: the value is still present because there is no TTL logic
    expect(cacheGet("ttl-probe")).toBeUndefined();
  });
});
