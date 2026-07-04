import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Tooling Finding 6 — "no-eval": "off" in .eslintrc.json
 *
 * The no-eval rule is the primary lint guard against eval() usage. It is
 * explicitly disabled across the entire repo, meaning the live eval() call
 * that existed in apps/api/src/utils/search.ts (Critical RCE, Finding 1)
 * passed the linter without any diagnostic. The misconfiguration meant that
 * fixing the rule in source code alone is not enough — the lint gate that
 * would catch any future re-introduction is also missing.
 *
 * This test asserts the safe configuration. It intentionally FAILS against
 * the current .eslintrc.json to prove the misconfiguration before any fix.
 */

const eslintrc = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../../.eslintrc.json"),
    "utf-8"
  )
);

// ESLint accepts "error"/2 or "warn"/1. "off"/0 disables the rule entirely.
const ACTIVE_SETTINGS = new Set(["error", "warn", 1, 2]);

describe("ESLint config: no-eval rule must be active", () => {
  it("no-eval is not explicitly disabled with \"off\"", () => {
    const setting = eslintrc?.rules?.["no-eval"];

    // EXPECTED (safe)   → anything other than "off" / 0
    // ACTUAL (broken)   → "off" — eval() silently passes the linter
    expect(setting).not.toBe("off");
    expect(setting).not.toBe(0);
  });

  it("no-eval is set to \"error\" so eval() usage fails CI lint", () => {
    const setting = eslintrc?.rules?.["no-eval"];

    // A missing key falls back to eslint:recommended which does NOT include
    // no-eval, so undefined also fails this check — the rule must be explicit.
    // EXPECTED (safe)   → "error" or "warn"
    // ACTUAL (broken)   → "off"
    expect(ACTIVE_SETTINGS.has(setting)).toBe(true);
  });
});
