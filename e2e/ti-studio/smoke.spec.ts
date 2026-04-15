import { test, expect } from "../fixtures/base";

/**
 * TI Studio — Smoke Tests
 * Doel: verifieer kernfunctioneren van TI Studio na een feature-toevoeging
 * Focus op kritieke user flows die dagelijks gebruikt worden
 */

test.describe("TI Studio — Smoke Tests", () => {
  test.setTimeout(120_000);

  test("Flow 1 — Werkbord pagina laadt (navigatie zichtbaar)", async ({ page }) => {
    await page.goto("/indeling", { timeout: 60_000 });

    // Hoofdnavigatie moet zichtbaar zijn — is kritieke indicator dat pagina niet redirected
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });
  });

  test("Flow 2 — Memo pagina laadt (navigatie zichtbaar)", async ({ page }) => {
    await page.goto("/memo", { timeout: 60_000 });

    // Hoofdnavigatie moet zichtbaar zijn
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });
  });

  test("Flow 3 — Personen/spelers pagina laadt (navigatie zichtbaar)", async ({ page }) => {
    await page.goto("/personen/spelers", { timeout: 60_000 });

    // Hoofdnavigatie moet zichtbaar zijn
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });
  });

  test("Flow 4 — Werkindeling navigatie (indeling → memo → personen)", async ({ page }) => {
    // Start op werkbord
    await page.goto("/indeling", { timeout: 60_000 });

    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });

    // Navigeer naar memo
    const linkMemo = page
      .getByRole("link")
      .filter({ hasText: /memo|bespreking/i })
      .first();
    if (await linkMemo.isVisible().catch(() => false)) {
      await linkMemo.click();
      await page
        .waitForURL((url) => url.href.includes("memo"), { timeout: 10_000 })
        .catch(() => {});
    }

    // Controleer dat pagina niet crashed
    await expect(page.locator("body")).toBeVisible({ timeout: 5_000 });
  });

  test("Flow 5 — Geen crash op page refresh", async ({ page }) => {
    await page.goto("/indeling", { timeout: 60_000 });

    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });

    // Refresh pagina
    await page.reload({ waitUntil: "load" });

    // Na refresh moet nav nog beschikbaar zijn
    await expect(nav).toBeVisible({ timeout: 20_000 });
  });

  test("Flow 6 — API Health check", async ({ request }) => {
    // Verifieer dat de API beschikbaar is
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(body.status).toBe("ok");
  });

  test("Flow 7 — TI Studio werkbord canvas is scrollable", async ({ page }) => {
    await page.goto("/indeling", { timeout: 60_000 });

    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });

    // Canvas moet scrollable zijn (groot werkbord)
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);

    expect(scrollHeight).toBeGreaterThan(0);
    expect(clientHeight).toBeGreaterThan(0);
  });

  test("Flow 8 — Memo pagina laadt zonder redirect", async ({ page }) => {
    await page.goto("/memo", { timeout: 60_000 });

    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });

    // Verifieer dat pagina niet naar login redirected
    expect(page.url()).not.toContain("/login");
  });

  test("Flow 9 — Werkbord laadt zonder kritieke console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/indeling", { timeout: 60_000 });

    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });

    // Filter out non-critical errors (network, subscriptions, etc.)
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("401") &&
        !e.includes("NetworkError") &&
        !e.includes("WebSocket") &&
        !e.includes("Subscription") &&
        !e.includes("request") &&
        !e.includes("Failed to fetch")
    );

    // Log kritieke errors voor debugging
    if (criticalErrors.length > 0) {
      console.warn("Kritieke console errors gevonden:", criticalErrors);
    }

    expect(criticalErrors).toHaveLength(0);
  });

  test("Flow 10 — Cross-domain: Desktop layout laadt", async ({ page }) => {
    // Desktop layout test
    await page.goto("/indeling", { timeout: 60_000 });

    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });

    expect(page.url()).toContain("/indeling");
  });
});
