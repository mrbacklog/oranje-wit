import { test, expect } from "@playwright/test";

test.describe("Beheer — Evaluatie / Rondes", () => {
  test("rondes-pagina laadt met CRUD-knoppen", async ({ page }) => {
    await page.goto("/beheer/evaluatie/rondes");

    // Pagina laadt
    await expect(page.locator("h1")).toContainText("Evaluatierondes");

    // "Nieuwe ronde" knop is aanwezig
    await expect(page.getByRole("button", { name: "Nieuwe ronde" })).toBeVisible();
  });

  test("nieuwe ronde dialog opent en sluit", async ({ page }) => {
    await page.goto("/beheer/evaluatie/rondes");

    // Open dialog
    await page.getByRole("button", { name: "Nieuwe ronde" }).click();
    await expect(page.getByText("Nieuwe evaluatieronde")).toBeVisible();

    // Formuliervelden aanwezig
    await expect(page.getByLabel("Seizoen")).toBeVisible();
    await expect(page.getByLabel("Naam")).toBeVisible();
    await expect(page.getByLabel("Type")).toBeVisible();
    await expect(page.getByLabel("Deadline")).toBeVisible();

    // Annuleren sluit dialog
    await page.getByRole("button", { name: "Annuleren" }).click();
    await expect(page.getByText("Nieuwe evaluatieronde")).not.toBeVisible();
  });
});

test.describe("Beheer — Evaluatie / Coordinatoren", () => {
  test("coordinatoren-pagina laadt met CRUD-knoppen", async ({ page }) => {
    await page.goto("/beheer/evaluatie/coordinatoren");

    // Pagina laadt
    await expect(page.locator("h1")).toContainText("Coordinatoren");

    // "Coordinator toevoegen" knop is aanwezig
    await expect(page.getByRole("button", { name: "Coordinator toevoegen" })).toBeVisible();
  });

  test("coordinator toevoegen dialog opent en sluit", async ({ page }) => {
    await page.goto("/beheer/evaluatie/coordinatoren");

    // Open dialog
    await page.getByRole("button", { name: "Coordinator toevoegen" }).click();
    await expect(page.getByRole("heading", { name: "Coordinator toevoegen" })).toBeVisible();

    // Formuliervelden aanwezig
    await expect(page.getByLabel("Naam")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();

    // Annuleren sluit dialog
    await page.getByRole("button", { name: "Annuleren" }).click();
    await expect(page.getByRole("heading", { name: "Coordinator toevoegen" })).not.toBeVisible();
  });
});

test.describe("Beheer — Evaluatie / Templates", () => {
  test("templates-pagina laadt en toont tabel", async ({ page }) => {
    await page.goto("/beheer/evaluatie/templates");

    // Pagina laadt
    await expect(page.locator("h1")).toContainText("E-mail templates");

    // Tabel of lege status is zichtbaar
    const table = page.locator("table");
    const empty = page.getByText("Geen e-mail templates gevonden.");
    await expect(table.or(empty).first()).toBeVisible();
  });
});
