import { test, expect } from "../fixtures/base";

// Eerste seed-speler: TSTN001 = "Daan de Jong" (M, Senioren 1)
const SEED_SPELER_RELCODE = "TSTN001";
const SEED_SPELER_NAAM = "Daan de Jong";

test.describe("Spelers", () => {
  // Spelers pagina laadt veel data, verhoog timeout
  test.setTimeout(60000);

  test("toont spelersoverzicht met heading", async ({ page }) => {
    await page.goto("/spelers", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: /Spelers/ })).toBeVisible({
      timeout: 15000,
    });
  });

  test("spelersoverzicht bevat seed-spelers", async ({ page }) => {
    await page.goto("/spelers", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: /Spelers/ })).toBeVisible({
      timeout: 15000,
    });

    // Zoek naar een seed-speler in de lijst (TSTN-prefix)
    await expect(page.getByText(SEED_SPELER_NAAM).first()).toBeVisible({ timeout: 10000 });
  });

  test("speler detail pagina toont seizoensoverzicht", async ({ page }) => {
    // Gebruik seed-speler TSTN001
    await page.goto(`/spelers/${SEED_SPELER_RELCODE}`);

    await expect(page.getByRole("heading", { name: SEED_SPELER_NAAM, level: 1 })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByRole("heading", { name: "Seizoensoverzicht" })).toBeVisible();

    // Seizoenstabel met kolommen
    const tabel = page.getByRole("table");
    await expect(tabel).toBeVisible();
    await expect(tabel.getByRole("columnheader", { name: "Seizoen" })).toBeVisible();
    await expect(tabel.getByRole("columnheader", { name: "Team" })).toBeVisible();
    await expect(tabel.getByRole("columnheader", { name: "Status" })).toBeVisible();

    // Seed-speler speelt bij Senioren 1
    await expect(tabel.getByText("Senioren 1")).toBeVisible();
  });

  test("onbekende speler toont 404", async ({ page }) => {
    await page.goto("/spelers/ONGELDIG999");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Speler niet gevonden")).toBeVisible();
    await expect(page.getByRole("link", { name: "Terug naar Spelers" })).toBeVisible();
  });

  test("terug-link op speler detail navigeert naar overzicht", async ({ page }) => {
    await page.goto(`/spelers/${SEED_SPELER_RELCODE}`);

    const link = page.getByRole("link", { name: /Terug naar overzicht/ });
    await expect(link).toBeVisible({ timeout: 10000 });

    await link.click();
    await expect(page).toHaveURL(/\/spelers$/);
  });
});
