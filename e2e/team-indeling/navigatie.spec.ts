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

  test("scenarios redirect naar indeling", async ({ page }) => {
    // De /scenarios route bestaat niet meer — redirect naar /indeling
    await page.goto("/ti-studio/scenarios/niet-bestaand", { timeout: 30000 });
    await expect(page).toHaveURL(/\/ti-studio\/indeling/);
  });

  test("vergelijk redirect naar indeling", async ({ page }) => {
    // De /vergelijk route is geïntegreerd in /indeling
    await page.goto("/ti-studio/vergelijk", { timeout: 15000 });
    await expect(page).toHaveURL(/\/ti-studio\/indeling/);
  });

  test("instellingen pagina is bereikbaar", async ({ page }) => {
    await page.goto("/ti-studio/instellingen");
    await expect(page).toHaveURL(/\/instellingen/);
  });
});
