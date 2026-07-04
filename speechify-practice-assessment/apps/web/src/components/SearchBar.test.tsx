/**
 * Regression tests for finding #16: SearchBar called onChange on every
 * single keystroke with no debounce or throttle.
 *
 * All three tests assert the CORRECT behaviour (onChange is debounced).
 * They FAIL against the original SearchBar and PASS after the fix.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect, vi } from "vitest";
import { buildDebouncedHandler } from "./SearchBar";

const SEARCHBAR_PATH = resolve(__dirname, "./SearchBar.tsx");
const source = readFileSync(SEARCHBAR_PATH, "utf-8");

describe("SearchBar: missing debounce (finding #16)", () => {
  it("source contains a debounce implementation (function call, not just a comment)", () => {
    const strippedSource = source.replace(/\/\/[^\n]*/g, "");
    const hasDebounce = /debounce\s*\(|setTimeout\s*\(|clearTimeout\s*\(|useDebounce\s*\(/i.test(
      strippedSource
    );
    expect(hasDebounce).toBe(true);
  });

  it("onChange is NOT invoked on every individual keystroke within a short burst", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const handle = buildDebouncedHandler(onChange, 300);

    // Type five characters in rapid succession — no timer advance between them
    ["h", "he", "hel", "hell", "hello"].forEach((v) => handle(v));

    // Timer hasn't fired yet — onChange must not have been called
    expect(onChange).toHaveBeenCalledTimes(0);

    // Advance past the debounce window
    vi.advanceTimersByTime(300);

    // Only the final value is emitted
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith("title.includes('hello')");

    vi.useRealTimers();
  });

  it("onChange receives only the final value after rapid typing stops", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const handle = buildDebouncedHandler(onChange, 300);

    // Type "world" quickly then pause
    ["w", "wo", "wor", "worl", "world"].forEach((v) => handle(v));

    // Not called during the burst
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith("title.includes('world')");

    vi.useRealTimers();
  });
});
