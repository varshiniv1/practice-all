import { describe, expect, it } from "vitest";
import { searchPosts } from "../src/utils/search";

describe("searchPosts", () => {
  it("returns all posts when no expression is given", () => {
    expect(searchPosts(undefined).length).toBeGreaterThan(0);
  });

  it("filters posts by title", () => {
    const results = searchPosts("title.includes('Post number 1')");
    expect(results.length).toBeGreaterThan(0);
  });
});
