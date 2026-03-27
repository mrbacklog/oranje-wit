import { test, expect } from "../fixtures/base";

test.describe("Coordinator flow", () => {
  test.describe("Foutafhandeling", () => {
    test("toont foutmelding zonder token", async ({ page }) => {
      await page.goto("/evaluatie/coordinator");

      await expect(page.getByRole("heading", { name: /Geen geldige link/i })).toBeVisible();
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("toont foutmelding met ongeldig token", async ({ page }) => {
      await page.goto("/evaluatie/coordinator?token=ongeldig-test-token");

      await expect(page.getByRole("heading", { name: /Ongeldige link/i })).toBeVisible();
      await expect(page.getByText(/verlopen of ongeldig/i)).toBeVisible();
    });
  });

  test.describe("Team detail pagina", () => {
    test("toont foutmelding zonder token", async ({ page }) => {
      await page.goto("/evaluatie/coordinator/fake-ronde-id/999");

      await expect(page.getByText(/Geen geldige link/i)).toBeVisible();
    });

    test("toont foutmelding met ongeldig token", async ({ page }) => {
      await page.goto("/evaluatie/coordinator/fake-ronde-id/999?token=ongeldig-test-token");

      await expect(page.getByText(/Ongeldige of verlopen link/i)).toBeVisible();
    });
  });
});
