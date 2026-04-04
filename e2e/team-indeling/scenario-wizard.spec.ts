import { test, expect } from "../fixtures/base";

test.describe("Werkindeling auto-create", () => {
  test("Indeling-pagina toont direct de editor (geen wizard)", async ({ page }) => {
    await page.goto("/ti-studio/indeling", { timeout: 30000 });
    // Geen wizard-tekst zichtbaar
    await expect(page.getByText("Kies een methode")).not.toBeVisible();
    await expect(page.getByText("Vanuit blauwdruk")).not.toBeVisible();
    // Pagina laadt (geen crash)
    await expect(page).toHaveURL(/\/ti-studio\/indeling/);
  });

  test("Vergelijk-pagina toont WhatIf-selector", async ({ page }) => {
    await page.goto("/ti-studio/vergelijk", { timeout: 30000 });
    await expect(page).toHaveURL(/\/ti-studio\/vergelijk/);
    // WhatIf-header aanwezig
    await expect(page.getByText("What-If vergelijking")).toBeVisible({ timeout: 10000 });
  });
});
