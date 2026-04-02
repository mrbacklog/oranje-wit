import { test, expect } from "../fixtures/base";

test.describe("Samenstelling", () => {
  test("toont samenstelling overzicht", async ({ page }) => {
    await page.goto("/monitor/samenstelling");

    await expect(page.getByRole("heading", { name: "Samenstelling" })).toBeVisible();
  });

  test("geboortejaar detail toont actieve en gestopte spelers", async ({ page }) => {
    // Seed bevat spelers met geboortejaar 2010 (U17 teams)
    await page.goto("/monitor/samenstelling/2010");

    await expect(page.getByRole("heading", { name: /Geboortejaar 2010/ })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/retentie/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Actief/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Gestopt/ })).toBeVisible();
  });

  test("onbekend geboortejaar toont 404", async ({ page }) => {
    await page.goto("/monitor/samenstelling/1900");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Pagina niet gevonden")).toBeVisible();
  });

  test("terug-link navigeert naar samenstelling overzicht", async ({ page }) => {
    await page.goto("/monitor/samenstelling/2010");

    // Seed garandeert dat geboortejaar 2010 data heeft
    const link = page.getByRole("link", { name: /Terug naar samenstelling/ });
    await expect(link).toBeVisible({ timeout: 10000 });

    await link.click();
    await expect(page).toHaveURL(/\/samenstelling/);
  });
});
