import { test, expect } from "@playwright/test";

// Beheer-pagina's doen server-side database queries via Railway.
// Met parallelle workers kan de dev server langzaam zijn.
const GOTO_OPTS = { waitUntil: "domcontentloaded" as const, timeout: 45_000 };

test.describe("Beheer — Teams", () => {
  test.setTimeout(90_000);

  test("teams-pagina laadt en toont heading", async ({ page }) => {
    await page.goto("/beheer/teams", GOTO_OPTS);

    await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();
  });

  test("tabel met teams is zichtbaar", async ({ page }) => {
    await page.goto("/beheer/teams", GOTO_OPTS);

    // De pagina toont ofwel een tabel met teams, ofwel een lege-staat melding
    const tabel = page.locator("table");
    const leegMelding = page.getByText("Geen teams gevonden");

    await expect(tabel.or(leegMelding)).toBeVisible();
  });

  test("stats-kaarten tonen teams en spelers", async ({ page }) => {
    await page.goto("/beheer/teams", GOTO_OPTS);

    // Stat-labels binnen .stat-card elementen (exact match om overlap te voorkomen)
    await expect(page.locator(".stat-label").filter({ hasText: /^Teams$/ })).toBeVisible();
    await expect(page.locator(".stat-label").filter({ hasText: /^Spelers$/ })).toBeVisible();
    await expect(page.locator(".stat-label").filter({ hasText: /^Selectieteams$/ })).toBeVisible();
  });
});

test.describe("Beheer — Sportlink Sync", () => {
  test.setTimeout(90_000);

  test("sync-pagina laadt en toont heading", async ({ page }) => {
    await page.goto("/beheer/teams/sync", GOTO_OPTS);

    await expect(page.getByRole("heading", { name: "Sportlink Sync" })).toBeVisible();
  });

  test("stats-kaarten zijn zichtbaar", async ({ page }) => {
    await page.goto("/beheer/teams/sync", GOTO_OPTS);

    // Stat-labels (exact match)
    await expect(page.locator(".stat-label").filter({ hasText: /Spelers/ })).toBeVisible();
    await expect(page.locator(".stat-label").filter({ hasText: /^Teams/ })).toBeVisible();
    await expect(page.locator(".stat-label").filter({ hasText: /Laatste sync/ })).toBeVisible();
  });
});
