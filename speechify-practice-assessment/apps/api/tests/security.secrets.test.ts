import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// Finding #6: .env not gitignored in sub-project; hardcoded secret fallback in source
const subProjectRoot = path.resolve(__dirname, "../../../");

describe("[security] secrets exposure", () => {
  it("[security] speechify-practice-assessment/.gitignore must list .env so the file cannot be accidentally staged", () => {
    const content = readFileSync(path.join(subProjectRoot, ".gitignore"), "utf-8");
    const lines = content.split("\n").map((l) => l.trim());
    expect(lines).toContain(".env");
  });

  it("[security] auth middleware must not contain a hardcoded JWT_SECRET fallback value", () => {
    const content = readFileSync(
      path.join(subProjectRoot, "apps/api/src/middleware/auth.ts"),
      "utf-8"
    );
    expect(content).not.toContain("snapfeed-super-secret-key-2024");
  });
});
