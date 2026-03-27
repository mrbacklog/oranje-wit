import { test, expect } from "../fixtures/base";

test.describe("Zelfevaluatie flow", () => {
  test.describe("Foutafhandeling", () => {
    test("toont foutmelding zonder token", async ({ page }) => {
      await page.goto("/zelf");

      await expect(page.getByRole("heading", { name: /Geen geldige link/i })).toBeVisible();
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("toont foutmelding met ongeldig token", async ({ page }) => {
      await page.goto("/zelf?token=ongeldig-test-token");

      await expect(page.getByRole("heading", { name: /Ongeldige link/i })).toBeVisible();
      await expect(page.getByText(/verlopen of ongeldig/i)).toBeVisible();
    });
  });

  test.describe("Bedankt pagina", () => {
    test("toont bevestiging na succesvolle indiening", async ({ page }) => {
      await page.goto("/zelf/bedankt");

      await expect(page.getByRole("heading", { name: /Bedankt/i })).toBeVisible();
      await expect(page.getByText(/zelfevaluatie.*is ontvangen/i)).toBeVisible();
      await expect(page.getByText(/venster sluiten/i)).toBeVisible();
    });

    test("toont een vinkje-icoon", async ({ page }) => {
      await page.goto("/zelf/bedankt");

      // SVG checkmark icoon moet aanwezig zijn
      const checkmark = page.getByRole("main").locator("svg").first();
      await expect(checkmark).toBeVisible();
    });
  });
});
