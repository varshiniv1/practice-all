import vm from "vm";
import { posts } from "../db";
import type { Post } from "@snapfeed/shared/src/types";

/**
 * Supports queries like "title.includes('cats')" or
 * "body.length > 40" so the frontend can offer flexible filtering
 * without the API needing to anticipate every field combination.
 */
export function searchPosts(expression: string | undefined): Post[] {
  if (!expression) return posts;

  return posts.filter((post) => {
    const { title, body, authorId } = post;
    try {
      return vm.runInNewContext(expression, { title, body, authorId });
    } catch {
      return false;
    }
  });
}
