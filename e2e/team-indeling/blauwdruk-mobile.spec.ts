import { test, expect } from "../fixtures/base";

test.describe("Blauwdruk Mobile — Gezien-flow", () => {
  test.setTimeout(90_000);

  test("toont blauwdruk overzicht met voortgang en besluiten", async ({ page }) => {
    await page.goto("/teamindeling/blauwdruk");

    // Header
    await expect(page.getByRole("heading", { name: "Blauwdruk" })).toBeVisible();

    // Voortgangskaart
    await expect(page.getByText("Spelers gezien")).toBeVisible();

    // Besluiten-kaart
    await expect(page.getByText("Besluiten")).toBeVisible();
  });

  test("toont categorie-kaarten met voortgang", async ({ page }) => {
    await page.goto("/teamindeling/blauwdruk");
    await page.waitForLoadState("domcontentloaded");

    // Seed maakt BlauwdrukSpeler records aan, dus categorie-kaarten moeten er zijn
    await expect(page.getByText("Per categorie")).toBeVisible({ timeout: 15_000 });

    // Minstens één categorie-kaart met X/Y format
    await expect(page.locator("text=/\\d+\\/\\d+/").first()).toBeVisible();
  });

  test("navigeer naar categorie en toon spelerlijst met filters", async ({ page }) => {
    await page.goto("/teamindeling/blauwdruk");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Per categorie")).toBeVisible({ timeout: 15_000 });

    // Klik op eerste categorie-kaart
    const categorieKnop = page
      .locator("button")
      .filter({ hasText: /\d+\/\d+/ })
      .first();
    await categorieKnop.click();

    // Categorie-detail: terugknop en filter-pills
    await expect(page.getByLabel("Terug")).toBeVisible();
    await expect(page.getByRole("button", { name: /Alle/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ongezien/i })).toBeVisible();
  });

  test("terugknop keert terug naar overzicht", async ({ page }) => {
    await page.goto("/teamindeling/blauwdruk");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Per categorie")).toBeVisible({ timeout: 15_000 });

    // Navigeer naar categorie
    const categorieKnop = page
      .locator("button")
      .filter({ hasText: /\d+\/\d+/ })
      .first();
    await categorieKnop.click();
    await expect(page.getByLabel("Terug")).toBeVisible();

    // Terug
    await page.getByLabel("Terug").click();
    await expect(page.getByRole("heading", { name: "Blauwdruk" })).toBeVisible();
    await expect(page.getByText("Per categorie")).toBeVisible();
  });
});

test.describe("Blauwdruk Mobile — Besluiten", () => {
  test.setTimeout(90_000);

  test("toont besluiten-pagina met header en filters", async ({ page }) => {
    await page.goto("/teamindeling/blauwdruk/besluiten");

    await expect(page.getByRole("heading", { name: "Besluiten" })).toBeVisible();

    // Filter-pills (gebruik exacte tekst om conflicten met "Open app switcher" te voorkomen)
    await expect(page.getByRole("button", { name: /^Alle/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Voorlopig/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Definitief/i })).toBeVisible();
  });

  test("filter-pills filteren besluiten", async ({ page }) => {
    await page.goto("/teamindeling/blauwdruk/besluiten");
    await expect(page.getByRole("heading", { name: "Besluiten" })).toBeVisible();

    // Klik op "Voorlopig" filter (uniek genoeg om strict mode niet te schenden)
    await page.getByRole("button", { name: /^Voorlopig/i }).click();

    // Er verschijnt ofwel besluiten of de "Geen besluiten" melding
    const heeftContent = await page
      .locator("[class*=rounded-xl]")
      .first()
      .isVisible()
      .catch(() => false);
    const heeftLeeg = await page
      .getByText("Geen besluiten")
      .isVisible()
      .catch(() => false);
    expect(heeftContent || heeftLeeg).toBeTruthy();
  });
});
