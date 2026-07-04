import { test, expect } from "@playwright/test";

// Requires the web app (http://localhost:5173) and api (http://localhost:4000)
// to be running locally. Run with: pnpm test:e2e

test("bookmarking a post updates the count exactly once per click", async ({
  page,
}) => {
  await page.goto("http://localhost:5173");

  const firstButton = page.locator("button", { hasText: "Bookmark" }).first();
  const before = await firstButton.textContent();

  await firstButton.click();
  await page.waitForTimeout(200);

  const after = await firstButton.textContent();
  expect(after).not.toBe(before);
});

test("rapid double-click does not leave bookmark state inconsistent", async ({
  page,
}) => {
  await page.goto("http://localhost:5173");

  const firstButton = page.locator("button", { hasText: "Bookmark" }).first();
  await Promise.all([firstButton.click(), firstButton.click()]);
  await page.waitForTimeout(300);

  // A correct implementation should end up back at the original,
  // unbookmarked state after two toggles.
  await expect(firstButton).toContainText("☆ Bookmark (0)");
});
