import { test, expect } from "../fixtures/base";
import { SCENARIO_NAAM } from "../../packages/test-utils/src/seed/dataset";

test.describe("Team-Indeling navigatie", () => {
  test("homepage laadt en redirect niet naar login", async ({ page }) => {
    await page.goto("/ti-studio");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("kaders pagina is bereikbaar en toont besluiten", async ({ page }) => {
    await page.goto("/ti-studio/kaders");
    await expect(page.getByRole("heading", { name: /kaders/i })).toBeVisible();
  });

  test("blauwdruk redirect werkt naar kaders", async ({ page }) => {
    await page.goto("/ti-studio/blauwdruk");
    await expect(page).toHaveURL(/\/kaders/);
  });

  test("scenarios pagina redirect naar indeling (geen werkindeling in seed)", async ({ page }) => {
    // Seed-data maakt geen werkindeling aan, dus /scenarios toont onboarding op /indeling
    await page.goto("/ti-studio/scenarios", { timeout: 30000 });
    // Redirect naar /indeling (waar onboarding is)
    await expect(page).toHaveURL(/\/indeling/);
    await expect(page.getByRole("heading", { name: "Nog geen werkindeling" })).toBeVisible({
      timeout: 15000,
    });
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
