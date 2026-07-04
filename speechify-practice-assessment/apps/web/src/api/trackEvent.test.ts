/**
 * Failing regression test for finding #17: trackEvent() in client.ts calls
 * fetch() with no .catch() handler and no await. When the analytics endpoint
 * is unreachable the rejected Promise has no handler, creating an unhandled
 * rejection — crashing Node workers and polluting monitoring with noise.
 *
 * These tests assert the CORRECT behaviour (the fetch error is handled).
 * They currently FAIL because no error handling exists on the fire-and-forget.
 * They will PASS once a .catch() (or async/await + try-catch) is added.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { trackEvent } from "./client";

const CLIENT_PATH = resolve(__dirname, "./client.ts");
const source = readFileSync(CLIENT_PATH, "utf-8");

// Extract just the trackEvent function body for targeted analysis
const trackEventMatch = source.match(
  /export\s+function\s+trackEvent[\s\S]*?^}/m
);
const trackEventSource = trackEventMatch ? trackEventMatch[0] : source;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("client.ts – trackEvent fire-and-forget (finding #17)", () => {
  it("trackEvent source must contain a .catch() or async/await to handle fetch errors", () => {
    const hasCatch = /\.catch\s*\(/.test(trackEventSource);
    const hasAsyncAwait =
      /async\s+function\s+trackEvent|await\s+fetch/.test(trackEventSource);

    // FAILS now: trackEvent() calls fetch() with no error handling at all.
    // Any rejection from the analytics endpoint becomes an unhandled rejection.
    expect(hasCatch || hasAsyncAwait).toBe(true);
  });

  it("trackEvent must not return void — it should return a Promise or handle errors internally", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
    );

    const result = trackEvent("page_view", { url: "/home" });

    // If trackEvent is async (or explicitly returns the fetch promise), the
    // caller can attach .catch(). Currently it returns void (undefined), so
    // errors are silently swallowed as unhandled rejections.
    //
    // FAILS now: result is undefined, not a Promise
    expect(result).toBeInstanceOf(Promise);
  });

  it("trackEvent must not leave fetch rejection unhandled when the endpoint is down", async () => {
    const rejection = new Error("Analytics endpoint unreachable");
    let capturedUnhandled: Error | null = null;

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(rejection));

    // Override vitest's unhandledRejection handler just for this test to detect it
    const origHandler = process.listeners("unhandledRejection").at(-1);
    process.removeAllListeners("unhandledRejection");
    process.once("unhandledRejection", (reason) => {
      capturedUnhandled = reason as Error;
    });

    trackEvent("crash_event", { page: "/checkout" });

    // Flush the microtask queue so any unhandled rejection event fires
    await new Promise((r) => setTimeout(r, 30));

    // Restore vitest's original handler
    if (origHandler) process.on("unhandledRejection", origHandler as (...args: unknown[]) => void);

    // FAILS now: fetch rejected and there is no .catch(), so capturedUnhandled
    // is set to the rejection reason instead of remaining null.
    expect(capturedUnhandled).toBeNull();
  });
});
