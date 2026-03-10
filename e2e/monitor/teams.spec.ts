import { test, expect } from "../fixtures/base";

test.describe("Teams", () => {
  test("toont teams overzicht met categorieën", async ({ page }) => {
    await page.goto("/teams");

    // Teams heading in main content (level 1)
    await expect(page.getByRole("heading", { name: "Teams", level: 1 })).toBeVisible({
      timeout: 15000,
    });

    // Controleer dat er team-buttons bestaan
    await expect(page.getByRole("button", { name: "Senioren selectie" })).toBeVisible();
  });

  test("kan een team selecteren en details bekijken", async ({ page }) => {
    await page.goto("/teams");

    // Wacht tot teams geladen zijn
    await expect(page.getByRole("button", { name: "Senioren 1" })).toBeVisible({
      timeout: 15000,
    });

    // Klik op Senioren 1
    await page.getByRole("button", { name: "Senioren 1" }).click();

    // Team detail toont heading en tabs
    await expect(page.getByRole("heading", { name: "Senioren 1", level: 2 })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Spelers & Staf" })).toBeVisible();
  });

  test("team detail toont spelers en staf", async ({ page }) => {
    await page.goto("/teams");

    await expect(page.getByRole("button", { name: "Senioren 1" })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole("button", { name: "Senioren 1" }).click();

    // Spelers sectie
    await expect(page.getByText(/\d+ spelers/)).toBeVisible();

    // Staf sectie
    await expect(page.getByRole("heading", { name: "Staf", level: 4 })).toBeVisible();
  });
});
