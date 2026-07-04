import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Tooling Finding 1 — CI always shows green regardless of failures.
 *
 * Both the Lint and Run tests steps carry `continue-on-error: true`.
 * GitHub marks the job as passed even when lint violations or test failures
 * occur, so no finding from the audit would ever block a merge automatically.
 *
 * These tests assert the safe configuration. They intentionally FAIL against
 * the current ci.yml to prove the misconfiguration before any fix is applied.
 */

const CI_YML = readFileSync(
  resolve(__dirname, "../../../.github/workflows/ci.yml"),
  "utf-8"
);

const lines = CI_YML.split("\n");

/**
 * Returns the lines belonging to a named step, from the line after
 * `- name: <stepName>` up to (but not including) the next step boundary.
 */
function linesForStep(stepName: string): string[] {
  const start = lines.findIndex((l) => l.includes(`name: ${stepName}`));
  if (start === -1) return [];
  const result: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s{6}- /.test(lines[i])) break; // next top-level step
    result.push(lines[i]);
  }
  return result;
}

describe("CI configuration: continue-on-error safety gates", () => {
  it("Lint step does not have continue-on-error: true", () => {
    const stepLines = linesForStep("Lint");
    const hasContinueOnError = stepLines.some((l) =>
      /continue-on-error:\s*true/.test(l)
    );
    // EXPECTED (safe)  → false  (lint failures block the job)
    // ACTUAL (broken)  → true   (lint failures are silently swallowed)
    expect(hasContinueOnError).toBe(false);
  });

  it("Run tests step does not have continue-on-error: true", () => {
    const stepLines = linesForStep("Run tests");
    const hasContinueOnError = stepLines.some((l) =>
      /continue-on-error:\s*true/.test(l)
    );
    // EXPECTED (safe)  → false  (test failures block the job)
    // ACTUAL (broken)  → true   (test failures are silently swallowed)
    expect(hasContinueOnError).toBe(false);
  });
});
