import { test, expect } from "../fixtures/base";

test.describe("Trainer evaluatie flow", () => {
  test.describe("Foutafhandeling", () => {
    test("toont foutmelding zonder token", async ({ page }) => {
      await page.goto("/invullen");

      await expect(page.getByRole("heading", { name: /Ongeldige link/i })).toBeVisible();
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("toont foutmelding met ongeldig token", async ({ page }) => {
      await page.goto("/invullen?token=ongeldig-test-token");

      await expect(page.getByText(/Verlopen of ongeldige link/i)).toBeVisible();
      await expect(page.getByText(/niet meer actief/i)).toBeVisible();
    });
  });

  test.describe("Bedankt pagina", () => {
    test("toont bevestiging na succesvolle indiening", async ({ page }) => {
      await page.goto("/invullen/bedankt");

      await expect(page.getByRole("heading", { name: /Bedankt/i })).toBeVisible();
      await expect(page.getByText(/evaluatie.*is ontvangen/i)).toBeVisible();
      await expect(page.getByText(/venster sluiten/i)).toBeVisible();
    });

    test("toont teamnaam in bevestiging indien meegegeven", async ({ page }) => {
      await page.goto("/invullen/bedankt?team=" + encodeURIComponent("Oranje Wit D1"));

      await expect(page.getByRole("heading", { name: /Bedankt/i })).toBeVisible();
      await expect(page.getByText(/Oranje Wit D1/i)).toBeVisible();
    });

    test("toont een vinkje-icoon", async ({ page }) => {
      await page.goto("/invullen/bedankt");

      // SVG checkmark icoon moet aanwezig zijn
      const checkmark = page.getByRole("main").locator("svg").first();
      await expect(checkmark).toBeVisible();
    });
  });
});
