import { test, expect } from "@playwright/test";

// Portaal-pagina doet meerdere async Suspense queries (SSR streaming).
// Gebruik "commit" (wacht op eerste byte) + langere expect timeouts.
const GOTO_OPTS = { waitUntil: "commit" as const, timeout: 60_000 };

test.describe("Portaal", () => {
  test.setTimeout(90_000);

  test("portaal laadt na login en toont welkom-tekst", async ({ page }) => {
    await page.goto("/", GOTO_OPTS);

    // Welkom-heading is zichtbaar (bevat "Welkom")
    // SSR streaming kan langzaam zijn, langere expect timeout
    await expect(page.getByRole("heading", { name: /Welkom/ })).toBeVisible({ timeout: 30_000 });
  });

  test("app-tegels zijn zichtbaar", async ({ page }) => {
    await page.goto("/", GOTO_OPTS);

    // De "Apps" sectie-heading is zichtbaar
    await expect(page.getByRole("heading", { name: "Apps" })).toBeVisible({ timeout: 30_000 });

    // Er zijn meerdere app-tegels aanwezig
    const tegels = page.locator(".app-tile");
    await expect(tegels.first()).toBeVisible({ timeout: 15_000 });
  });

  test("beheer-tegel is aanwezig voor TC-lid", async ({ page }) => {
    await page.goto("/", GOTO_OPTS);

    // De beheer app-tegel (met class app-tile) is zichtbaar voor een TC-lid
    await expect(page.locator(".app-tile").filter({ hasText: "Beheer" })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("uitloggen-knop is zichtbaar", async ({ page }) => {
    await page.goto("/", GOTO_OPTS);

    await expect(page.getByRole("button", { name: "Uitloggen" })).toBeVisible({ timeout: 30_000 });
  });
});
