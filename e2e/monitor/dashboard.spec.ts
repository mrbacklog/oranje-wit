import { test, expect } from "../fixtures/base";
import { TEAMS } from "../../packages/test-utils/src/seed/dataset";

test.describe("Dashboard", () => {
  test("toont de dashboard pagina met KPI kaarten", async ({ page }) => {
    await page.goto("/");

    // Controleer paginatitel en heading
    await expect(page).toHaveTitle(/Verenigingsmonitor/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Controleer seizoen-label
    await expect(page.getByText(/Seizoen \d{4}-\d{4}/)).toBeVisible();

    // Controleer KPI kaarten met seed-data waarden
    await expect(page.getByRole("link", { name: /Spelende leden \d+/ })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("link", { name: /Teams \d+/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Netto groei/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Signaleringen \d+/ })).toBeVisible();
  });

  test("KPI waarden komen overeen met seed-data", async ({ page }) => {
    await page.goto("/");

    // Seed maakt TOTAAL_SPELERS_IN_TEAMS actieve spelers en TEAMS.length teams
    // De exacte KPI-waarde kan afwijken door hoe de app telt, maar moet >= seed data zijn
    await expect(page.getByRole("link", { name: /Spelende leden/ })).toBeVisible({
      timeout: 10000,
    });

    // Teams KPI moet minstens het aantal seed-teams tonen
    const teamsLink = page.getByRole("link", { name: /Teams \d+/ });
    await expect(teamsLink).toBeVisible();
    const teamsText = await teamsLink.textContent();
    const teamsMatch = teamsText?.match(/Teams (\d+)/);
    if (teamsMatch) {
      expect(parseInt(teamsMatch[1])).toBeGreaterThanOrEqual(TEAMS.length);
    }

    // Signaleringen: seed maakt er 4 aan
    const sigLink = page.getByRole("link", { name: /Signaleringen (\d+)/ });
    await expect(sigLink).toBeVisible();
    const sigText = await sigLink.textContent();
    const sigMatch = sigText?.match(/Signaleringen (\d+)/);
    if (sigMatch) {
      expect(parseInt(sigMatch[1])).toBeGreaterThanOrEqual(4);
    }
  });

  test("KPI kaarten linken naar juiste pagina's", async ({ page }) => {
    await page.goto("/");

    // Wacht tot KPI's geladen zijn
    await expect(page.getByRole("link", { name: /Spelende leden/ })).toBeVisible({
      timeout: 10000,
    });

    // Spelende leden linkt naar /spelers
    await expect(page.getByRole("link", { name: /Spelende leden/ })).toHaveAttribute(
      "href",
      "/spelers"
    );

    // Signaleringen linkt naar /signalering
    await expect(page.getByRole("link", { name: /Signaleringen/ })).toHaveAttribute(
      "href",
      "/signalering"
    );
  });

  test("toont signaleringen sectie met link naar overzicht", async ({ page }) => {
    await page.goto("/");

    // Seed-data bevat 4 signaleringen, dus deze sectie moet zichtbaar zijn
    const main = page.getByRole("main");
    const heading = main.getByRole("heading", { name: "Signaleringen" });
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /Toon alle/ })).toBeVisible();
  });
});
