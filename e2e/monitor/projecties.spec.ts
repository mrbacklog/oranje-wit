import { test, expect } from "../fixtures/base";

test.describe("Projecties redirect", () => {
  test("redirect van /monitor/projecties naar /monitor/samenstelling", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/projecties", { timeout: 45000 });
    await page.waitForURL("**/monitor/samenstelling**", {
      timeout: 15000,
      waitUntil: "commit",
    });
    await expect(page.getByRole("heading", { name: /Samenstelling/ })).toBeVisible({
      timeout: 15000,
    });
  });
});
