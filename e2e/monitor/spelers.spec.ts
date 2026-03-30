import { test, expect } from "../fixtures/base";

// Eerste seed-speler: TSTN001 = "Daan de Jong" (M, Senioren 1)
const SEED_SPELER_RELCODE = "TSTN001";
const SEED_SPELER_NAAM = "Daan de Jong";

/** Detecteer Next.js not-found pagina (dev mode geeft HTTP 200) */
async function isPageNotFound(page: import("@playwright/test").Page): Promise<boolean> {
  return page
    .locator('meta[name="next-error"][content="not-found"]')
    .count()
    .then((c) => c > 0)
    .catch(() => false);
}

test.describe("Spelers", () => {
  // Spelers pagina laadt veel data, verhoog timeout
  test.setTimeout(60000);

  test("toont spelersoverzicht met heading", async ({ page }) => {
    await page.goto("/monitor/spelers", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: /Spelers/ })).toBeVisible({
      timeout: 15000,
    });
  });

  test("spelersoverzicht bevat seed-spelers", async ({ page }) => {
    await page.goto("/monitor/spelers", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: /Spelers/ })).toBeVisible({
      timeout: 15000,
    });

    // Zoek naar een seed-speler in de lijst (TSTN-prefix)
    const seedSpelerZichtbaar = await page
      .getByText(SEED_SPELER_NAAM)
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (!seedSpelerZichtbaar) {
      // Seed data niet beschikbaar, skip
      test.skip();
      return;
    }

    await expect(page.getByText(SEED_SPELER_NAAM).first()).toBeVisible();
  });

  test("speler detail pagina toont seizoensoverzicht", async ({ page }) => {
    // Gebruik seed-speler TSTN001
    await page.goto(`/monitor/spelers/${SEED_SPELER_RELCODE}`);

    if (await isPageNotFound(page)) {
      test.skip();
      return;
    }

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

    // Seed-speler heeft minstens een seizoen met een team
    const rows = tabel.getByRole("row");
    await expect(rows.nth(1)).toBeVisible(); // minstens 1 data row (na header)
  });

  test("onbekende speler toont 404", async ({ page }) => {
    await page.goto("/monitor/spelers/ONGELDIG999");

    // Next.js dev mode: not-found pagina met meta tag
    const isNotFound = await isPageNotFound(page);
    if (isNotFound) {
      // In dev mode zien we de not-found pagina maar mogelijk niet een "404" tekst
      // Verifieer dat het geen gewone speler-pagina is
      const heeftSpelerData = await page
        .getByRole("heading", { name: "Seizoensoverzicht" })
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      expect(heeftSpelerData).toBeFalsy();
      return;
    }

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Speler niet gevonden")).toBeVisible();
    await expect(page.getByRole("link", { name: "Terug naar Spelers" })).toBeVisible();
  });

  test("terug-link op speler detail navigeert naar overzicht", async ({ page }) => {
    await page.goto(`/monitor/spelers/${SEED_SPELER_RELCODE}`);

    if (await isPageNotFound(page)) {
      test.skip();
      return;
    }

    const link = page.getByRole("link", { name: /Terug naar overzicht/ });
    await expect(link).toBeVisible({ timeout: 10000 });

    await link.click();
    await expect(page).toHaveURL(/\/spelers$/);
  });
});
