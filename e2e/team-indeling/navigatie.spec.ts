import { test, expect } from "../fixtures/base";

test.describe("Team-Indeling navigatie", () => {
  test("homepage laadt en redirect niet naar login", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("blauwdruk pagina is bereikbaar", async ({ page }) => {
    await page.goto("/blauwdruk");
    await expect(page.getByRole("heading", { name: /blauwdruk/i })).toBeVisible();
  });

  test("scenarios pagina is bereikbaar", async ({ page }) => {
    await page.goto("/scenarios");
    await expect(page.getByRole("heading", { name: /scenario/i })).toBeVisible();
  });

  test("vergelijk pagina is bereikbaar", async ({ page }) => {
    await page.goto("/vergelijk");
    await expect(page).toHaveURL(/\/vergelijk/);
  });

  test("import pagina is bereikbaar", async ({ page }) => {
    await page.goto("/import");
    await expect(page).toHaveURL(/\/import/);
  });
});
