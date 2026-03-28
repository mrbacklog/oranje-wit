import { test, expect } from "@playwright/test";

test.describe("Beheer — Scouting / Scouts", () => {
  test("scoutlijst is zichtbaar met heading en toevoegen-knop", async ({ page }) => {
    await page.goto("/beheer/scouting/scouts");

    // Pagina laadt met juiste heading
    await expect(page.locator("h1")).toContainText("Scouts");

    // Toevoegen-knop is aanwezig
    await expect(page.getByRole("button", { name: "Scout toevoegen" })).toBeVisible();
  });

  test("toevoegen-dialog opent en sluit", async ({ page }) => {
    await page.goto("/beheer/scouting/scouts");

    // Open dialog
    await page.getByRole("button", { name: "Scout toevoegen" }).click();
    await expect(page.getByRole("heading", { name: "Scout toevoegen" })).toBeVisible();

    // Formuliervelden aanwezig
    await expect(page.getByLabel("Naam")).toBeVisible();
    await expect(page.getByLabel("E-mailadres")).toBeVisible();
    await expect(page.getByLabel("Rol")).toBeVisible();

    // Annuleren sluit dialog
    await page.getByRole("button", { name: "Annuleren" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
