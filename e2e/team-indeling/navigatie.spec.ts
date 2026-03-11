import { test, expect } from "../fixtures/base";
import { SCENARIO_NAAM } from "../../packages/test-utils/src/seed/dataset";

test.describe("Team-Indeling navigatie", () => {
  test("homepage laadt en redirect niet naar login", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("blauwdruk pagina is bereikbaar en toont seed-blauwdruk", async ({ page }) => {
    await page.goto("/blauwdruk");
    await expect(page.getByRole("heading", { name: /blauwdruk/i })).toBeVisible();

    // Seed blauwdruk speerpunten moeten zichtbaar zijn
    await expect(page.getByText("Doorstroom jeugd naar senioren")).toBeVisible({
      timeout: 10000,
    });
  });

  test("scenarios pagina is bereikbaar en toont seed-scenario", async ({ page }) => {
    await page.goto("/scenarios");
    await expect(page.getByRole("heading", { name: /scenario/i, level: 2 })).toBeVisible();

    // Seed scenario moet in de lijst staan
    await expect(page.getByText(SCENARIO_NAAM)).toBeVisible({ timeout: 10000 });
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
