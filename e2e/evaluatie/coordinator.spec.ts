import { test, expect } from "../fixtures/base";

test.describe("Coordinator flow", () => {
  test.describe("Foutafhandeling", () => {
    test("toont foutmelding zonder token", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/coordinator", { timeout: 45000 });

      await expect(page.getByRole("heading", { name: /Geen geldige link/i })).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("toont foutmelding met ongeldig token", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/coordinator?token=ongeldig-test-token", { timeout: 45000 });

      await expect(page.getByRole("heading", { name: /Ongeldige link/i })).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByText(/verlopen of ongeldig/i)).toBeVisible();
    });
  });

  test.describe("Team detail pagina", () => {
    test("toont foutmelding zonder token", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/coordinator/fake-ronde-id/999", { timeout: 45000 });

      await expect(page.getByText(/Geen geldige link/i)).toBeVisible({ timeout: 15000 });
    });

    test("toont foutmelding met ongeldig token", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/coordinator/fake-ronde-id/999?token=ongeldig-test-token", {
        timeout: 45000,
      });

      await expect(page.getByText(/Ongeldige of verlopen link/i)).toBeVisible({ timeout: 15000 });
    });
  });
});
