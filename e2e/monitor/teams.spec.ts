import { test, expect } from "../fixtures/base";

test.describe("Teams", () => {
  test("toont teams overzicht met heading", async ({ page }) => {
    await page.goto("/monitor/teams");

    // Teams heading in main content (level 1)
    await expect(page.getByRole("heading", { name: "Teams", level: 1 })).toBeVisible({
      timeout: 15000,
    });

    // Er moeten team-links bestaan (seed maakt teams aan)
    const teamLinks = page.getByRole("link").filter({ hasText: /Sen|U\d+/ });
    await expect(teamLinks.first()).toBeVisible({ timeout: 15000 });
  });

  test("kan een team aanklikken en detail bekijken", async ({ page }) => {
    await page.goto("/monitor/teams");

    // Wacht tot team-links geladen zijn
    const teamLinks = page.getByRole("link").filter({ hasText: /Sen|U\d+/ });
    await expect(teamLinks.first()).toBeVisible({ timeout: 15000 });

    // Klik op eerste team
    await teamLinks.first().click();

    // Team detail toont heading
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test("team detail pagina toont spelers", async ({ page }) => {
    await page.goto("/monitor/teams");

    const teamLinks = page.getByRole("link").filter({ hasText: /Sen|U\d+/ });
    await expect(teamLinks.first()).toBeVisible({ timeout: 15000 });
    await teamLinks.first().click();

    // Spelers sectie
    await expect(page.getByText(/speler/i)).toBeVisible({ timeout: 15000 });
  });
});
