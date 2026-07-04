import { describe, expect, it } from "vitest";
import { searchPosts } from "../src/utils/search";

/**
 * Security Finding 1 (Gap) — vm.runInNewContext sandbox escape
 *
 * The original eval() fix replaced eval with vm.runInNewContext, but Node's vm
 * module is NOT a security boundary: prototype-chain escapes like
 *   this.constructor.constructor('return process')()
 * give full access to the host Node process from inside the sandbox context.
 *
 * The real fix is to eliminate arbitrary expression evaluation entirely and
 * replace it with a pattern-matching safe evaluator that only supports the
 * known patterns the frontend uses (field.includes / field.length / field ===).
 *
 * These tests verify that:
 *  1. Prototype-chain escape attempts have no effect (return no posts / false)
 *  2. require / process / global access attempts are neutralised
 *  3. Legitimate filters still work correctly
 */
describe("Security: eval/vm sandbox — prototype-chain escape blocked", () => {
  it("prototype-chain escape does not return truthy results", () => {
    // Classic vm escape: walk up the prototype chain to reach Function constructor
    const escape = "this.constructor.constructor('return process')()";
    const results = searchPosts(escape);
    // Safe evaluator: unrecognised pattern → false → no posts returned
    expect(results).toHaveLength(0);
  });

  it("process.env mutation attempt is neutralised", () => {
    const before = process.env.__SANDBOX_ESCAPE_TEST;
    searchPosts("process.env.__SANDBOX_ESCAPE_TEST = 'pwned'; true");
    // Safe evaluator ignores this; env must be unchanged
    expect(process.env.__SANDBOX_ESCAPE_TEST).toBe(before);
  });

  it("require() call attempt is neutralised", () => {
    const results = searchPosts("require('fs').writeFileSync('/tmp/pwned', '1')");
    expect(results).toHaveLength(0);
  });

  it("arbitrary JS (setTimeout, Date, etc.) is ignored", () => {
    const results = searchPosts("Date.now() > 0");
    expect(results).toHaveLength(0);
  });

  it("// comment followed by injected code is neutralised", () => {
    // Attacker tries to use comment-stripping logic to smuggle code
    const results = searchPosts("title.length > 0 // '); require('child_process').execSync('id')");
    // The stripping removes everything after // → evaluates title.length > 0
    // which is a valid pattern, so posts ARE returned (the comment injection has no effect)
    expect(results.length).toBeGreaterThan(0); // safe result; no code ran
  });

  // --- Verify legitimate filters still work after the sandbox removal ---

  it("title.includes('Post number 1') still filters correctly", () => {
    const results = searchPosts("title.includes('Post number 1')");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p) => expect(p.title).toContain("Post number 1"));
  });

  it("title.length > 0 still returns all posts", () => {
    const all = searchPosts(undefined);
    const filtered = searchPosts("title.length > 0");
    expect(filtered).toHaveLength(all.length);
  });

  it("body.length > 50 filters posts with long bodies", () => {
    const results = searchPosts("body.length > 50");
    results.forEach((p) => expect(p.body.length).toBeGreaterThan(50));
  });

  it("unrecognised expression returns no posts (safe default)", () => {
    expect(searchPosts("1 === 1")).toHaveLength(0);
    expect(searchPosts("true")).toHaveLength(0);
    expect(searchPosts("() => true")).toHaveLength(0);
  });
});
