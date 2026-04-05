import { test, expect } from "../fixtures/base";

/**
 * Smoke tests — één happy-path per domein.
 * Doel: verifieer dat de app niet kapot is na een Release.
 * Bewust kort: geen edge cases, geen uitgebreide flows.
 */

test.describe("Smoke — app laadt", () => {
  test("monitor: overzicht laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Monitor|Overzicht/ })).toBeVisible({
      timeout: 15000,
    });
  });

  test("teamindeling: blauwdruk pagina laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/teamindeling", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /Blauwdruk/ })).toBeVisible({ timeout: 15000 });
  });

  test("ti-studio: indeling laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/ti-studio/indeling", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("evaluatie: overzicht laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/evaluatie", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Evaluatie|Overzicht/ })).toBeVisible({
      timeout: 15000,
    });
  });

  test("scouting: overzicht laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/scouting", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("beheer: jaarplanning laadt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/beheer", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("cross-domain: AppSwitcher opent", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor", { timeout: 45000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 15000 });
    await nav.getByText("Apps", { exact: true }).click();
    const switcher = page.getByRole("dialog", { name: "App switcher" });
    await expect(switcher).toBeVisible({ timeout: 10000 });
  });

  test("api health: antwoordt HTTP 200", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("status");
  });
});
