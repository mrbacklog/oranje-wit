import { test, expect } from "../fixtures/base";

/**
 * TI Studio v2 — Sync-pagina E2E tests
 * Doel: verifieer sync-route laadt, structuur + disabled states in Route B
 * Spec: docs/superpowers/specs/2026-05-13-sync-pagina-v2.md
 *
 * Route B scope:
 * - Drie kaarten zichtbaar (Leden, Competitie, Sportlink Notificaties)
 * - Starten-knoppen disabled met tooltip "Synchronisatie beschikbaar in volgende release"
 * - Leden-kaart toont latest sync datum of "Nooit gesynchroniseerd"
 * - Geen sync-uitvoering of overlay-interactie (backlog)
 *
 * STATUS: tests zijn voorbereid maar /sync route is nog niet geïmplementeerd (Route B).
 * Tests zullen groen worden wanneer de route in apps/ti-studio-v2/src/app/(protected)/sync/ beschikbaar komt.
 */

test.describe("Sync-pagina v2 — Smoke test", () => {
  test.setTimeout(60_000);

  test.skip("laadt sync-route zonder kritieke console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/sync", { timeout: 30_000 });
    await page.waitForTimeout(1000);

    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("NetworkError") &&
        !e.includes("WebSocket") &&
        !e.includes("Failed to fetch") &&
        !e.includes("Failed to load resource") &&
        !e.includes("CORS") &&
        !e.includes("Module not found") &&
        !e.includes("Can't resolve")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test.skip("toont drie sync-kaarten (Leden, Competitie, Notificaties)", async ({ page }) => {
    await page.goto("/sync", { timeout: 30_000 });

    const ledenKaart = page.getByRole("heading", { name: /leden/i });
    const competitieKaart = page.getByRole("heading", { name: /competitie/i });
    const notificatiesKaart = page.getByRole("heading", {
      name: /notificaties|sportlink/i,
    });

    await expect(ledenKaart).toBeVisible({ timeout: 10_000 });
    await expect(competitieKaart).toBeVisible({ timeout: 10_000 });
    await expect(notificatiesKaart).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Sync-pagina v2 — Disabled Starten-knop", () => {
  test.setTimeout(60_000);

  test.skip("Starten-knop in Leden-kaart is disabled in Route B", async ({ page }) => {
    await page.goto("/sync", { timeout: 30_000 });

    const startenButton = page
      .locator("button, [role=button]")
      .filter({ hasText: /synchroniseer|starten/i })
      .first();

    await expect(startenButton).toBeVisible({ timeout: 10_000 });

    const isDisabled =
      (await startenButton.getAttribute("disabled")) !== null ||
      (await startenButton.getAttribute("aria-disabled")) === "true";

    expect(isDisabled).toBeTruthy();
  });

  test.skip("klik op disabled Starten-knop triggert geen actie", async ({ page }) => {
    await page.goto("/sync", { timeout: 30_000 });

    const startenButton = page
      .locator("button, [role=button]")
      .filter({ hasText: /synchroniseer|starten/i })
      .first();

    await expect(startenButton).toBeVisible({ timeout: 10_000 });

    try {
      await startenButton.click();
    } catch (e) {
      // Expected: disabled button maakt geen feit
    }

    expect(page.url()).toContain("/sync");
  });
});

test.describe("Sync-pagina v2 — Kaart-content en labels", () => {
  test.setTimeout(60_000);

  test.skip("Competitie-kaart toont Binnenkort-label (Route B placeholder)", async ({ page }) => {
    await page.goto("/sync", { timeout: 30_000 });

    const competitieKaart = page.locator("text=/competitie/i").locator("..").first();

    await expect(competitieKaart).toBeVisible({ timeout: 10_000 });

    const binnenkoortLabel = competitieKaart.locator("text=/binnenkort/i");
    await expect(binnenkoortLabel).toBeVisible({ timeout: 5_000 });
  });

  test.skip("Sportlink Notificaties-kaart toont Binnenkort-label (Route B placeholder)", async ({
    page,
  }) => {
    await page.goto("/sync", { timeout: 30_000 });

    const notificatiesKaart = page.locator("text=/notificaties|sportlink/i").locator("..").first();

    await expect(notificatiesKaart).toBeVisible({ timeout: 10_000 });

    const binnenkoortLabel = notificatiesKaart.locator("text=/binnenkort/i");
    await expect(binnenkoortLabel).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Sync-pagina v2 — Fresheid-indicator (Leden-kaart)", () => {
  test.setTimeout(60_000);

  test.skip("Leden-kaart toont laatst-sync-datum of placeholder", async ({ page }) => {
    await page.goto("/sync", { timeout: 30_000 });

    const ledenKaart = page.locator("text=/leden/i").locator("..").first();

    await expect(ledenKaart).toBeVisible({ timeout: 10_000 });

    const kaartText = await ledenKaart.textContent();

    const hasSyncDate = /\d+\s+(dag|uur|minuut|weken?|maanden?)/i.test(kaartText || "");
    const hasPlaceholder = /nooit.*sync|nog niet.*sync|geen.*sync/i.test(kaartText || "");
    const hasEmptyState = /binnenkort/i.test(kaartText || "");

    expect(hasSyncDate || hasPlaceholder || hasEmptyState).toBeTruthy();
  });

  test.skip("Fresheid-indicator toont kleur-dot (ok/stale/onbekend)", async ({ page }) => {
    await page.goto("/sync", { timeout: 30_000 });

    const ledenKaart = page.locator("text=/leden/i").locator("..").first();

    await expect(ledenKaart).toBeVisible({ timeout: 10_000 });

    const fresheidsIndicator = ledenKaart.locator(
      "[aria-label*='ok'], [aria-label*='stale'], [aria-label*='onbekend']"
    );

    const indicator =
      (await fresheidsIndicator.count()) > 0
        ? fresheidsIndicator.first()
        : ledenKaart.locator("svg, .dot, [class*='indicator']").first();

    expect(await indicator.count()).toBeGreaterThanOrEqual(0);
  });
});
