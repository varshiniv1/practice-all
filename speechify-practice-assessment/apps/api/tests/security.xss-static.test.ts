import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Security Finding 3 (Gap) — dangerouslySetInnerHTML XSS: no regression test
 *
 * PostList.tsx previously rendered post bodies via:
 *   <div dangerouslySetInnerHTML={{ __html: post.body }} />
 *
 * The db seeds several posts whose body contains a live XSS payload:
 *   <img src=x onerror="alert('xss-N')">
 *
 * The fix replaced dangerouslySetInnerHTML with plain text rendering:
 *   <div>{post.body}</div>
 *
 * Without a regression test the fix could be silently reverted — the same
 * pattern used for tooling.eslint-no-eval.test.ts and ci.config.test.ts.
 */

const POST_LIST_PATH = resolve(
  __dirname,
  "../../../apps/web/src/components/PostList.tsx"
);

describe("Security: dangerouslySetInnerHTML must not appear in PostList.tsx", () => {
  it("PostList.tsx does not contain dangerouslySetInnerHTML", () => {
    const source = readFileSync(POST_LIST_PATH, "utf-8");

    // EXPECTED (safe)      → absent; post.body rendered as plain text
    // ACTUAL (vulnerable)  → present; raw HTML injected into the DOM
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });

  it("PostList.tsx renders post.body as a text node, not raw HTML", () => {
    const source = readFileSync(POST_LIST_PATH, "utf-8");

    // The safe pattern is {post.body} (JSX text node — React escapes entities).
    // This verifies the replacement was applied, not just that the bad pattern
    // was deleted without a functional substitute.
    expect(source).toContain("{post.body}");
  });
});
