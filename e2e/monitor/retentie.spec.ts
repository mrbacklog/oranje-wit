import { test, expect } from "../fixtures/base";

test.describe("Retentie / Ledendynamiek", () => {
  test("toont ledendynamiek overzicht met tabs", async ({ page }) => {
    await page.goto("/retentie");

    await expect(page.getByRole("heading", { name: "Ledendynamiek" })).toBeVisible({
      timeout: 10000,
    });

    // Controleer tabs
    await expect(page.getByRole("tab", { name: "Behoud" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Instroom" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Uitstroom" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Cohorten" })).toBeVisible();
  });

  test("seizoen detail pagina toont instroom en uitstroom", async ({ page }) => {
    // Seed maakt seizoen 2024-2025 aan met verloop-data
    await page.goto("/retentie/2024-2025");

    await expect(page.getByRole("heading", { name: /Seizoen 2024-2025/ })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/retentie \d+%/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Instroom/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Uitstroom/ })).toBeVisible();
  });

  test("terug-link navigeert naar retentie overzicht", async ({ page }) => {
    await page.goto("/retentie/2024-2025");

    // Seed-data garandeert dat seizoen 2024-2025 bestaat
    const link = page.getByRole("link", { name: /Terug naar retentie/ });
    await expect(link).toBeVisible({ timeout: 10000 });

    await link.click();
    await expect(page).toHaveURL(/\/retentie$/);
  });

  test("onbekend seizoen toont foutpagina", async ({ page }) => {
    await page.goto("/retentie/2099-2100");

    // Wacht op 404 tekst of "niet gevonden" heading
    await expect(page.getByText("Pagina niet gevonden")).toBeVisible({ timeout: 5000 });
  });
});
