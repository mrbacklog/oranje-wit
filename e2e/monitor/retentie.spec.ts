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
    await page.goto("/retentie/2024-2025");

    await expect(page.getByRole("heading", { name: /Seizoen 2024-2025/ })).toBeVisible();
    await expect(page.getByText(/retentie \d+%/)).toBeVisible();

    // Instroom en uitstroom secties
    await expect(page.getByRole("heading", { name: /Instroom/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Uitstroom/ })).toBeVisible();
  });

  test("terug-link navigeert naar retentie overzicht", async ({ page }) => {
    await page.goto("/retentie/2024-2025");

    await page.getByRole("link", { name: /Terug naar retentie/ }).click();
    await expect(page).toHaveURL(/\/retentie$/);
  });

  test("onbekend seizoen toont 404", async ({ page }) => {
    await page.goto("/retentie/2099-2100");

    await expect(page.getByText("404")).toBeVisible();
  });
});
