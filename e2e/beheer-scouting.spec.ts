import { test, expect } from "@playwright/test";

const GOTO_OPTS = { waitUntil: "domcontentloaded" as const, timeout: 45_000 };

test.describe("Beheer — Scouting / Scouts", () => {
  test.setTimeout(90_000);

  test("scouts-pagina laadt en toont heading", async ({ page }) => {
    await page.goto("/beheer/scouting/scouts", GOTO_OPTS);

    await expect(page.locator("h1")).toContainText("Scouts");
  });

  test("scouts-pagina toont tabel of lege melding", async ({ page }) => {
    await page.goto("/beheer/scouting/scouts", GOTO_OPTS);

    const tabel = page.locator("table");
    const leegMelding = page.getByText("Nog geen scouts geregistreerd");

    await expect(tabel.or(leegMelding).first()).toBeVisible();
  });
});
