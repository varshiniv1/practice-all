/**
 * Failing regression test for finding #18: @typescript-eslint/no-explicit-any
 * is set to "off" in .eslintrc.json. This means unsafe `any` casts silently
 * pass the linter across the entire repo, including the cast in
 * utils/search.ts that bypasses TypeScript's type system.
 *
 * This test asserts the CORRECT configuration (rule must be active).
 * It currently FAILS because the rule is explicitly disabled.
 * It will PASS once the rule is set to "warn" or "error".
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const eslintrc = JSON.parse(
  readFileSync(resolve(__dirname, "../../../.eslintrc.json"), "utf-8")
);

const ACTIVE_SETTINGS = new Set(["error", "warn", 1, 2]);

describe("ESLint config: @typescript-eslint/no-explicit-any must be active (finding #18)", () => {
  it('@typescript-eslint/no-explicit-any is not set to "off"', () => {
    const setting = eslintrc?.rules?.["@typescript-eslint/no-explicit-any"];

    // FAILS now: the rule is explicitly "off" — any casts pass the linter silently
    expect(setting).not.toBe("off");
    expect(setting).not.toBe(0);
  });

  it('@typescript-eslint/no-explicit-any is set to "error" or "warn" so unsafe casts fail CI', () => {
    const setting = eslintrc?.rules?.["@typescript-eslint/no-explicit-any"];

    // A missing key would fall back to no enforcement (the plugin rule is not
    // part of eslint:recommended), so the rule must be explicitly active.
    // FAILS now: "off" is not in ACTIVE_SETTINGS
    expect(ACTIVE_SETTINGS.has(setting)).toBe(true);
  });
});
