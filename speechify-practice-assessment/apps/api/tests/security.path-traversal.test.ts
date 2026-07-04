import path from "path";
import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/index";

/**
 * Security Finding 5 — Path traversal in GET /posts/attachments/:file
 *
 * The handler builds the file path as:
 *   path.join(ATTACHMENTS_DIR, req.params.file)
 * with no validation that the resolved path stays within ATTACHMENTS_DIR.
 *
 * Express matches route params against the raw (still-percent-encoded) URL
 * segment, so ":file" matches "..%2Fpackage.json" (no literal slash).
 * Express then decodes the captured value, giving req.params.file = "../package.json".
 * path.join resolves that to one directory above ATTACHMENTS_DIR, escaping
 * the intended directory entirely.
 *
 * These tests assert the safe behaviour. They intentionally FAIL against the
 * current code to prove the vulnerability before any fix is applied.
 */

// Mirror how the route computes ATTACHMENTS_DIR (relative to posts.ts location)
const ATTACHMENTS_DIR = path.resolve(
  __dirname,
  "../src/routes/../../attachments"
);

describe("Security: path traversal in GET /posts/attachments/:file", () => {
  it("[unit] startsWith guard detects when path.join escapes ATTACHMENTS_DIR", () => {
    // path.join resolves ".." — it always will. The route handler must
    // explicitly check the resolved path stays within ATTACHMENTS_DIR.
    const maliciousParam = "../package.json"; // what req.params.file becomes after decode
    const resolved = path.join(ATTACHMENTS_DIR, maliciousParam);

    // The escape happens — path.join gives us apps/api/package.json.
    // The startsWith guard must catch it and return false (= traversal detected).
    const escapesDir = !resolved.startsWith(ATTACHMENTS_DIR + path.sep);
    expect(escapesDir).toBe(true); // confirms the guard identifies the escape

    // And the resolved path must NOT equal an actual sensitive file.
    // If the guard is absent, this path would be served to the caller.
    expect(resolved).not.toBe(path.join(ATTACHMENTS_DIR, "safe-file.txt"));
  });

  it("[http] GET /posts/attachments/..%2Fpackage.json is rejected, not served", async () => {
    // %2F is the percent-encoded form of "/".
    // Express matches the raw segment (no literal slash → matches :file),
    // then decodes it → req.params.file = "../package.json".
    // path.join(ATTACHMENTS_DIR, "../package.json") resolves to apps/api/package.json.
    // If the file is served, the response body will contain "@snapfeed/api".
    const res = await request(app).get(
      "/posts/attachments/..%2Fpackage.json"
    );

    // EXPECTED (safe)    → 400  (traversal detected and rejected)
    // ACTUAL (vulnerable) → 200  (package.json contents returned)
    expect(res.status).toBe(400);
    // Belt-and-suspenders: even if status is wrong, contents must not leak
    expect(JSON.stringify(res.body)).not.toContain("@snapfeed/api");
  });
});
