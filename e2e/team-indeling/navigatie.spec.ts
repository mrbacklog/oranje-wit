import { test, expect } from "../fixtures/base";
import { SCENARIO_NAAM } from "../../packages/test-utils/src/seed/dataset";

test.describe("Team-Indeling navigatie", () => {
  test("homepage laadt en redirect niet naar login", async ({ page }) => {
    await page.goto("/ti-studio");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("blauwdruk pagina is bereikbaar en toont tabs", async ({ page }) => {
    await page.goto("/ti-studio/blauwdruk");
    await expect(page.getByRole("heading", { name: /blauwdruk/i })).toBeVisible();

    // Blauwdruk tabs moeten zichtbaar zijn
    await expect(page.getByText("Kaders")).toBeVisible({ timeout: 10000 });
  });

  test("scenarios pagina is bereikbaar en toont seed-scenario", async ({ page }) => {
    // Scenarios pagina kan traag zijn bij eerste compile; verhoog timeout
    await page.goto("/ti-studio/scenarios", { timeout: 30000 });
    await expect(page.getByRole("heading", { name: /scenario/i, level: 2 })).toBeVisible({
      timeout: 15000,
    });

    // Seed scenario moet in de lijst staan; als pagina cached was, reload
    const scenarioZichtbaar = await page
      .getByText(SCENARIO_NAAM)
      .isVisible()
      .catch(() => false);
    if (!scenarioZichtbaar) {
      await page.reload({ timeout: 30000 });
    }
    await expect(page.getByText(SCENARIO_NAAM)).toBeVisible({ timeout: 15000 });
  });

  test("vergelijk pagina is bereikbaar", async ({ page }) => {
    await page.goto("/ti-studio/vergelijk");
    await expect(page).toHaveURL(/\/vergelijk/);
  });

  test("instellingen pagina is bereikbaar", async ({ page }) => {
    await page.goto("/ti-studio/instellingen");
    await expect(page).toHaveURL(/\/instellingen/);
  });
});
