import { posts } from "../db";
import type { Post } from "@snapfeed/shared/src/types";

// Fields callers are allowed to reference in filter expressions.
const ALLOWED_FIELDS = new Set(["title", "body", "authorId"]);

/**
 * Safe expression evaluator — no eval(), no vm, no arbitrary code execution.
 *
 * Supports the patterns the frontend actually uses:
 *   field.includes('value')
 *   field.length > N  (and <, >=, <=, ===, !==)
 *   field === 'value'
 *
 * Any unrecognised expression returns false (safe default).
 * Single-line // comments are stripped first so cache-busting timestamps work.
 */
function evalSafe(raw: string, post: Post): boolean {
  const expr = raw.replace(/\/\/.*$/m, "").trim();
  const fields = post as unknown as Record<string, string>;

  // field.includes('value')
  const inc = expr.match(/^(\w+)\.includes\('(.*)'\)$/);
  if (inc && ALLOWED_FIELDS.has(inc[1])) {
    return String(fields[inc[1]] ?? "").includes(inc[2]);
  }

  // field.length <op> N
  const len = expr.match(/^(\w+)\.length\s*(===|!==|>=|<=|>|<)\s*(\d+)$/);
  if (len && ALLOWED_FIELDS.has(len[1])) {
    const l = String(fields[len[1]] ?? "").length;
    const n = parseInt(len[3], 10);
    if (len[2] === ">") return l > n;
    if (len[2] === "<") return l < n;
    if (len[2] === ">=") return l >= n;
    if (len[2] === "<=") return l <= n;
    if (len[2] === "===") return l === n;
    if (len[2] === "!==") return l !== n;
  }

  // field === 'value'
  const eq = expr.match(/^(\w+)\s*===\s*'(.*)'$/);
  if (eq && ALLOWED_FIELDS.has(eq[1])) {
    return String(fields[eq[1]] ?? "") === eq[2];
  }

  return false;
}

export function searchPosts(expression: string | undefined): Post[] {
  if (!expression) return posts;
  return posts.filter((post) => {
    try {
      return evalSafe(expression, post);
    } catch {
      return false;
    }
  });
}
