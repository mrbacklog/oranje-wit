import { test, expect } from "@playwright/test";

// Archief-pagina's doen server-side database queries via Railway.
const GOTO_OPTS = { waitUntil: "domcontentloaded" as const, timeout: 45_000 };

test.describe("Beheer — Archief", () => {
  test.setTimeout(90_000);

  test("teams-archief laadt en toont heading", async ({ page }) => {
    await page.goto("/beheer/archief/teams", GOTO_OPTS);

    await expect(page.getByRole("heading", { name: "Teamhistorie" })).toBeVisible();
  });

  test("teams-archief toont seizoenen-sectie of lege staat", async ({ page }) => {
    await page.goto("/beheer/archief/teams", GOTO_OPTS);

    // De heading "Seizoenen" (h3) of een tabel — first() voor als beide matchen
    const seizoenHeading = page.getByRole("heading", { name: "Seizoenen" });
    const tabel = page.locator("table");

    await expect(seizoenHeading.or(tabel).first()).toBeVisible();
  });

  test("resultaten-archief laadt en toont heading", async ({ page }) => {
    await page.goto("/beheer/archief/resultaten", GOTO_OPTS);

    await expect(page.getByRole("heading", { name: "Competitieresultaten" })).toBeVisible();
  });

  test("resultaten-archief toont seizoenen-sectie", async ({ page }) => {
    await page.goto("/beheer/archief/resultaten", GOTO_OPTS);

    // De heading "Seizoenen" is altijd aanwezig (ook als er geen resultaten zijn)
    await expect(page.getByRole("heading", { name: "Seizoenen" })).toBeVisible();
  });
});
