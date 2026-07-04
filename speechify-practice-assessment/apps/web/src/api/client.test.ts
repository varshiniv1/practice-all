/**
 * Failing regression tests for finding #9: missing res.ok guards in client.ts.
 *
 * These tests assert the CORRECT behaviour (throw on 4xx/5xx).
 * They currently FAIL because the code has no res.ok check.
 * They will PASS once the guard is added.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPosts, login, toggleBookmark } from "./client";

// Minimal localStorage stub — coerces values to strings like the real API does.
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: unknown) => { store[k] = String(v); },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })
  );
}

describe("client.ts – missing res.ok guard (finding #9)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorageMock.clear();
  });

  // ------------------------------------------------------------------ fetchPosts
  it("fetchPosts: should throw on 500 instead of returning error body", async () => {
    mockFetch(500, { message: "Internal server error" });
    // FAILS now: fetchPosts() resolves with { message: ... } instead of rejecting
    await expect(fetchPosts()).rejects.toThrow();
  });

  it("fetchPosts: should throw on 403 instead of returning error body", async () => {
    mockFetch(403, { message: "Forbidden" });
    // FAILS now: fetchPosts() resolves with { message: ... } instead of rejecting
    await expect(fetchPosts()).rejects.toThrow();
  });

  // ------------------------------------------------------------------ login
  it("login: should throw on 401 instead of storing 'undefined' as token", async () => {
    mockFetch(401, { message: "Invalid credentials" });
    // FAILS now: login() resolves, leaving localStorage["token"] === "undefined"
    await expect(login("bad", "bad")).rejects.toThrow();
  });

  it("login: should not write to localStorage when server returns an error", async () => {
    mockFetch(401, { message: "Invalid credentials" });
    try {
      await login("bad", "bad");
    } catch {
      // expected after the fix
    }
    // FAILS now: "undefined" is stored because there is no early return on error
    expect(localStorageMock.getItem("token")).toBeNull();
  });

  // ------------------------------------------------------------------ toggleBookmark
  it("toggleBookmark: should throw on 401 instead of returning error body", async () => {
    mockFetch(401, { message: "Unauthorized" });
    // FAILS now: resolves silently with the error object
    await expect(toggleBookmark("post-123")).rejects.toThrow();
  });

  it("toggleBookmark: should throw on 500 instead of returning error body", async () => {
    mockFetch(500, { message: "Internal server error" });
    // FAILS now: resolves silently with the error object
    await expect(toggleBookmark("post-123")).rejects.toThrow();
  });
});
