import { test, expect } from "@playwright/test";

test.describe("Beheer — Jaarplanning", () => {
  test("kalender toont seizoenen met CRUD-knoppen", async ({ page }) => {
    await page.goto("/beheer/jaarplanning/kalender");

    // Pagina laadt
    await expect(page.locator("h1")).toContainText("Jaarkalender");

    // "Nieuw seizoen" knop is aanwezig
    await expect(page.getByRole("button", { name: "Nieuw seizoen" })).toBeVisible();
  });

  test("nieuw seizoen dialog opent en valideert", async ({ page }) => {
    await page.goto("/beheer/jaarplanning/kalender");

    // Open dialog
    await page.getByRole("button", { name: "Nieuw seizoen" }).click();
    await expect(page.getByText("Nieuw seizoen aanmaken")).toBeVisible();

    // Seizoen veld is aanwezig
    await expect(page.getByLabel("Seizoen")).toBeVisible();

    // Annuleren sluit dialog
    await page.getByRole("button", { name: "Annuleren" }).click();
    await expect(page.getByText("Nieuw seizoen aanmaken")).not.toBeVisible();
  });

  test("mijlpalen toont lijst met CRUD-knoppen", async ({ page }) => {
    await page.goto("/beheer/jaarplanning/mijlpalen");

    // Pagina laadt
    await expect(page.locator("h1")).toContainText("Mijlpalen");

    // "Nieuwe mijlpaal" knop is aanwezig
    await expect(page.getByRole("button", { name: "Nieuwe mijlpaal" })).toBeVisible();
  });

  test("nieuwe mijlpaal dialog opent met formulier", async ({ page }) => {
    await page.goto("/beheer/jaarplanning/mijlpalen");

    // Open dialog
    await page.getByRole("button", { name: "Nieuwe mijlpaal" }).click();
    await expect(page.getByRole("heading", { name: "Nieuwe mijlpaal" })).toBeVisible();

    // Formuliervelden aanwezig
    await expect(page.getByLabel("Seizoen")).toBeVisible();
    await expect(page.getByLabel("Mijlpaal")).toBeVisible();
    await expect(page.getByLabel("Datum")).toBeVisible();

    // Annuleren sluit dialog
    await page.getByRole("button", { name: "Annuleren" }).click();
  });
});
