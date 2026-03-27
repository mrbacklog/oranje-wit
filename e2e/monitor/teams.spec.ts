import { test, expect } from "../fixtures/base";

test.describe("Teams", () => {
  test("toont teams overzicht met heading", async ({ page }) => {
    await page.goto("/monitor/teams");

    // Teams heading in main content (level 1)
    await expect(page.getByRole("heading", { name: "Teams", level: 1 })).toBeVisible({
      timeout: 15000,
    });

    // Er moeten team-buttons bestaan (seed maakt 14 teams aan)
    const buttons = page.locator("button[aria-pressed]");
    await expect(buttons.first()).toBeVisible({ timeout: 15000 });
  });

  test("kan een team selecteren en details bekijken", async ({ page }) => {
    await page.goto("/monitor/teams");

    // Wacht tot team-buttons geladen zijn
    const buttons = page.locator("button[aria-pressed]");
    await expect(buttons.first()).toBeVisible({ timeout: 15000 });

    // Klik op eerste team
    await buttons.first().click();

    // Team detail toont heading (level 2) en tabs
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Spelers & Staf" })).toBeVisible();
  });

  test("team detail toont spelers en staf", async ({ page }) => {
    await page.goto("/monitor/teams");

    const buttons = page.locator("button[aria-pressed]");
    await expect(buttons.first()).toBeVisible({ timeout: 15000 });
    await buttons.first().click();

    // Spelers sectie
    await expect(page.getByText(/\d+ spelers/)).toBeVisible();

    // Staf sectie
    await expect(page.getByRole("heading", { name: "Staf", level: 4 })).toBeVisible();
  });
});
