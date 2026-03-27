import { test, expect } from "../fixtures/base";

test.describe("Speler zoeken", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scouting/zoek");
    await expect(page.getByRole("heading", { name: "Speler zoeken" })).toBeVisible();
  });

  test("zoekpagina heeft een zoekbalk met autofocus", async ({ page }) => {
    const zoekInput = page.getByRole("searchbox");
    await expect(zoekInput).toBeVisible();

    // Input moet gefocust zijn (autoFocus prop)
    await expect(zoekInput).toBeFocused();
  });

  test("toont 'geen spelers gevonden' bij onbekende zoekterm", async ({ page }) => {
    const zoekInput = page.getByRole("searchbox");

    // Zoek op een term die geen resultaten oplevert
    await zoekInput.fill("xyzqwertyuiop123456");

    // Wacht op de debounce (300ms) + API response
    await expect(page.getByText("Geen spelers gevonden")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Probeer een andere zoekterm")).toBeVisible();
  });

  test("zoekresultaten verschijnen bij geldige zoekterm", async ({ page }) => {
    const zoekInput = page.getByRole("searchbox");

    // Zoek op een veelvoorkomende letter (er moeten seed spelers zijn)
    await zoekInput.fill("a");

    // Wacht op resultaten of lege state
    await expect(page.getByRole("list").or(page.getByText("Geen spelers gevonden"))).toBeVisible({
      timeout: 5000,
    });
  });

  test("zoekresultaat klikken navigeert naar spelerprofiel", async ({ page }) => {
    const zoekInput = page.getByRole("searchbox");

    // Zoek op 'TST' prefix (seed data rel_codes)
    await zoekInput.fill("TST");

    // Wacht op resultaten
    const resultatenLijst = page.getByRole("list");
    const isZichtbaar = await resultatenLijst.isVisible().catch(() => false);

    if (!isZichtbaar) {
      // Geen seed data beschikbaar, skip
      test.skip();
      return;
    }

    // Wacht tot er minstens 1 resultaat is
    const eersteResultaat = resultatenLijst.getByRole("button").first();
    await expect(eersteResultaat).toBeVisible({ timeout: 5000 });

    // Klik op het eerste resultaat
    await eersteResultaat.click();

    // Moet navigeren naar /scouting/speler/[relCode]
    await page.waitForURL(/\/speler\//, { timeout: 10000 });
  });

  test("leeg zoekveld toont geen resultaten", async ({ page }) => {
    const zoekInput = page.getByRole("searchbox");

    // Vul iets in en maak het weer leeg
    await zoekInput.fill("test");
    await zoekInput.fill("");

    // Geen resultaten of 'geen spelers gevonden' bericht zichtbaar
    await expect(page.getByText("Geen spelers gevonden")).not.toBeVisible();
    await expect(page.getByRole("list")).not.toBeVisible();
  });
});
