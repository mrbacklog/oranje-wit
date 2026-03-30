import { test, expect } from "@playwright/test";

const GOTO_OPTS = { waitUntil: "domcontentloaded" as const, timeout: 45_000 };

test.describe("Beheer — Evaluatie / Rondes", () => {
  test.setTimeout(90_000);

  test("rondes-pagina laadt en toont heading", async ({ page }) => {
    await page.goto("/beheer/evaluatie/rondes", GOTO_OPTS);

    await expect(page.locator("h1")).toContainText("Evaluatierondes");
  });

  test("rondes-pagina toont tabel of lege melding", async ({ page }) => {
    await page.goto("/beheer/evaluatie/rondes", GOTO_OPTS);

    const tabel = page.locator("table");
    const leegMelding = page.getByText("Nog geen evaluatierondes aangemaakt");

    await expect(tabel.or(leegMelding).first()).toBeVisible();
  });
});

test.describe("Beheer — Evaluatie / Coordinatoren", () => {
  test.setTimeout(90_000);

  test("coordinatoren-pagina laadt en toont heading", async ({ page }) => {
    await page.goto("/beheer/evaluatie/coordinatoren", GOTO_OPTS);

    await expect(page.locator("h1")).toContainText("Coordinatoren");
  });
});

test.describe("Beheer — Evaluatie / Templates", () => {
  test.setTimeout(90_000);

  test("templates-pagina laadt en toont heading", async ({ page }) => {
    await page.goto("/beheer/evaluatie/templates", GOTO_OPTS);

    await expect(page.locator("h1")).toContainText("E-mail templates");

    // Tabel of lege status is zichtbaar
    const table = page.locator("table");
    const empty = page.getByText("Geen e-mail templates gevonden.");
    await expect(table.or(empty).first()).toBeVisible();
  });
});
