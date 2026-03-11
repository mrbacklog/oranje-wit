import { test, expect } from "../fixtures/base";

test.describe("Nieuw Scenario Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scenarios");
    await expect(page.getByRole("heading", { name: "Scenario's", exact: true })).toBeVisible();
  });

  test("wizard opent met 3 opties", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();

    // Drie opties zichtbaar
    await expect(page.getByText("Vanuit blauwdruk")).toBeVisible();
    await expect(page.getByText("Kopieer bestaand scenario")).toBeVisible();
    await expect(page.getByText("Helemaal leeg")).toBeVisible();
  });

  test("wizard sluit bij annuleren", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();
    await expect(page.getByText("Vanuit blauwdruk")).toBeVisible();

    await page.getByRole("button", { name: /annuleren/i }).click();
    await expect(page.getByText("Vanuit blauwdruk")).not.toBeVisible();
  });

  test("blauwdruk-flow: stap 1 naam invoeren", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();
    await page.getByText("Vanuit blauwdruk").click();

    // Stap 1: naam
    await expect(page.getByText("Stap 1 van 5")).toBeVisible();
    await expect(page.getByLabel(/naam/i)).toBeVisible();

    // Volgende is disabled zonder naam
    const volgendeKnop = page.getByRole("button", { name: /volgende/i });
    await expect(volgendeKnop).toBeDisabled();

    // Vul naam in
    await page.getByLabel(/naam/i).fill("E2E Test Scenario");
    await expect(volgendeKnop).toBeEnabled();
  });

  test("blauwdruk-flow: stap 2 senioren met voorstel", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();
    await page.getByText("Vanuit blauwdruk").click();

    // Stap 1: naam invullen en door
    await page.getByLabel(/naam/i).fill("E2E Test Scenario");
    await page.getByRole("button", { name: /volgende/i }).click();

    // Stap 2: senioren
    await expect(page.getByText("Stap 2 van 5")).toBeVisible();
    await expect(page.getByText(/spelers van 19\+/i)).toBeVisible();
    await expect(page.getByText(/voorstel/i)).toBeVisible();

    // Senioren input heeft een numerieke waarde (kan 0 zijn in lege E2E-database)
    const seniorenInput = page.locator("#wiz-senioren");
    const waarde = await seniorenInput.inputValue();
    expect(parseInt(waarde)).toBeGreaterThanOrEqual(0);
  });

  test("blauwdruk-flow: stap 3 A-categorie", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();
    await page.getByText("Vanuit blauwdruk").click();

    // Stap 1 → 2 → 3
    await page.getByLabel(/naam/i).fill("E2E Test Scenario");
    await page.getByRole("button", { name: /volgende/i }).click();
    await page.getByRole("button", { name: /volgende/i }).click();

    // Stap 3: A-categorie
    await expect(page.getByText("Stap 3 van 5")).toBeVisible();
    await expect(page.getByText("U15")).toBeVisible();
    await expect(page.getByText("U17")).toBeVisible();
    await expect(page.getByText("U19")).toBeVisible();
  });

  test("blauwdruk-flow: stap 4 B-teams preview", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();
    await page.getByText("Vanuit blauwdruk").click();

    // Stap 1 → 2 → 3 → 4
    await page.getByLabel(/naam/i).fill("E2E Test Scenario");
    await page.getByRole("button", { name: /volgende/i }).click();
    await page.getByRole("button", { name: /volgende/i }).click();
    await page.getByRole("button", { name: /volgende/i }).click();

    // Stap 4: B-teams
    await expect(page.getByText("Stap 4 van 5")).toBeVisible();
    await expect(page.getByText("B-categorie teams")).toBeVisible();

    // Kleurcategorieen zichtbaar (scope naar de wizard dialog)
    const dialog = page.locator(".dialog-panel");
    await expect(dialog.getByText("Blauw", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Groen", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Geel", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Oranje", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Rood", { exact: true })).toBeVisible();
  });

  test("blauwdruk-flow: stap 5 overzicht en aanmaken", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();
    await page.getByText("Vanuit blauwdruk").click();

    // Loop alle stappen door
    await page.getByLabel(/naam/i).fill("E2E Wizard Test");
    await page.getByRole("button", { name: /volgende/i }).click();
    await page.getByRole("button", { name: /volgende/i }).click();
    await page.getByRole("button", { name: /volgende/i }).click();
    await page.getByRole("button", { name: /volgende/i }).click();

    // Stap 5: overzicht
    await expect(page.getByText("Stap 5 van 5")).toBeVisible();
    await expect(page.getByRole("heading", { name: /E2E Wizard Test.*\d+ teams/ })).toBeVisible();

    // Aanmaken
    await page.getByRole("button", { name: /scenario aanmaken/i }).click();

    // Redirect naar scenario editor
    await page.waitForURL(/\/scenarios\//, { timeout: 10000 });
    await expect(page.url()).toMatch(/\/scenarios\/.+/);
  });

  test("blauwdruk-flow: terug-navigatie werkt", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();
    await page.getByText("Vanuit blauwdruk").click();

    // Stap 1
    await page.getByLabel(/naam/i).fill("Terug-test");
    await page.getByRole("button", { name: /volgende/i }).click();

    // Stap 2 → terug naar stap 1
    await expect(page.getByText("Stap 2 van 5")).toBeVisible();
    await page.getByRole("button", { name: /vorige/i }).click();
    await expect(page.getByText("Stap 1 van 5")).toBeVisible();

    // Naam is bewaard
    await expect(page.getByLabel(/naam/i)).toHaveValue("Terug-test");

    // Terug naar methode-keuze
    await page.getByRole("button", { name: /terug/i }).click();
    await expect(page.getByText("Vanuit blauwdruk")).toBeVisible();
  });

  test("leeg scenario: aanmaken met alleen naam", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();
    await page.getByText("Helemaal leeg").click();

    // Leeg-flow
    await expect(page.getByRole("heading", { name: "Leeg scenario" })).toBeVisible();

    // Disabled zonder naam
    await expect(page.getByRole("button", { name: /leeg scenario aanmaken/i })).toBeDisabled();

    // Vul naam in en maak aan
    await page.getByLabel(/naam/i).fill("E2E Leeg Scenario");
    await page.getByRole("button", { name: /leeg scenario aanmaken/i }).click();

    // Redirect
    await page.waitForURL(/\/scenarios\//, { timeout: 10000 });
  });

  test("kopieer scenario: selecteer bron en kopieer", async ({ page }) => {
    await page.getByRole("button", { name: /nieuw scenario/i }).click();

    // Kopieer knop: check of die enabled is (er moeten scenarios bestaan)
    const kopieerKnop = page.getByText("Kopieer bestaand scenario");
    const isDisabled = await kopieerKnop.locator("..").getAttribute("disabled");

    if (isDisabled !== null) {
      // Geen scenarios om te kopieren, skip test
      test.skip();
      return;
    }

    await kopieerKnop.click();
    await expect(page.getByText("Kopieer scenario")).toBeVisible();

    // Er moet minstens 1 bronscenario zijn
    const bronOpties = page.locator('input[name="bron"]');
    const aantalOpties = await bronOpties.count();

    if (aantalOpties === 0) {
      test.skip();
      return;
    }

    // Selecteer eerste bron
    await bronOpties.first().check({ force: true });

    // Vul naam in
    await page.getByLabel(/nieuwe naam/i).fill("E2E Kopie Scenario");
    await page.getByRole("button", { name: /scenario kopiëren/i }).click();

    // Redirect
    await page.waitForURL(/\/scenarios\//, { timeout: 10000 });
  });
});
