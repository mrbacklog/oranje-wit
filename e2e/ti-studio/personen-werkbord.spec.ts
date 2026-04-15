import { test, expect } from "../fixtures/base";

const GOTO_OPTS = { waitUntil: "domcontentloaded" as const, timeout: 45_000 };

test.describe("TI Studio — Personen & Werkbord", () => {
  test.setTimeout(90_000);

  test("personen spelers pagina laadt", async ({ page }) => {
    await page.goto("/personen/spelers", GOTO_OPTS);

    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 30_000 });

    expect(page.url()).toContain("/personen/spelers");
    expect(page.url()).not.toContain("/login");

    const spelerContent = page.getByText(/speler|team|status/i).first();

    if (!(await spelerContent.isVisible({ timeout: 5_000 }).catch(() => false))) {
      const container = page.locator("main, [role='main']").first();
      await expect(container).toBeVisible({ timeout: 10_000 });
    } else {
      await expect(spelerContent).toBeVisible();
    }
  });
});
