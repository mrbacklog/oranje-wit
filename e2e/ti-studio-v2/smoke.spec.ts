import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Smoke Tests — Personen pagina
 * Doel: verifieer basale werking van /personen route en sub-navigatie
 * Spec: docs/superpowers/specs/2026-05-13-personen-pagina-v2.md sectie 1
 */

test.describe("Personen pagina — Shell en navigatie", () => {
  test.setTimeout(60_000);

  test("navigeert van /personen naar /personen/spelers", async ({ page }) => {
    // Spec: /personen zonder sub-pad doet redirect naar /personen/spelers
    await page.goto("/personen", { timeout: 30_000 });

    // Verifieer redirect
    expect(page.url()).toContain("/personen/spelers");
  });

  test("toont de drie sub-tabs (Spelers, Staf, Reserveringen)", async ({ page }) => {
    await page.goto("/personen/spelers", { timeout: 30_000 });

    // Zoek de sub-navigatie elementen
    const spelersTab = page.getByRole("link", { name: /spelers/i });
    const stafTab = page.getByRole("link", { name: /staf/i });
    const reserveringenTab = page.getByRole("link", {
      name: /reserveringen/i,
    });

    // Verifieer alle drie tabs zijn zichtbaar
    await expect(spelersTab).toBeVisible();
    await expect(stafTab).toBeVisible();
    await expect(reserveringenTab).toBeVisible();
  });

  test("Staf-tab link opent /personen/staf", async ({ page }) => {
    await page.goto("/personen/spelers", { timeout: 30_000 });

    const stafTab = page.getByRole("link", { name: /staf/i });
    await stafTab.click();

    expect(page.url()).toContain("/personen/staf");
  });

  test("Reserveringen-tab link opent /personen/reserveringen", async ({ page }) => {
    await page.goto("/personen/spelers", { timeout: 30_000 });

    const reserveringenTab = page.getByRole("link", {
      name: /reserveringen/i,
    });
    await reserveringenTab.click();

    expect(page.url()).toContain("/personen/reserveringen");
  });

  test("geen console errors op /personen/spelers", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/personen/spelers", { timeout: 30_000 });
    await page.waitForTimeout(1000);

    // Filter non-critical errors
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("NetworkError") &&
        !e.includes("WebSocket") &&
        !e.includes("Failed to fetch")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("geen console errors op /personen/staf", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/personen/staf", { timeout: 30_000 });
    await page.waitForTimeout(1000);

    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("NetworkError") &&
        !e.includes("WebSocket") &&
        !e.includes("Failed to fetch")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("geen console errors op /personen/reserveringen", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/personen/reserveringen", { timeout: 30_000 });
    await page.waitForTimeout(1000);

    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("NetworkError") &&
        !e.includes("WebSocket") &&
        !e.includes("Failed to fetch")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("toont tabel-koppen op spelers-tab", async ({ page }) => {
    await page.goto("/personen/spelers", { timeout: 30_000 });

    // Basis tabel-headers verwacht: naam, status, indeling, etc
    // Lookup via accessibility API — heading text
    const headers = page.locator("thead th");
    const headerCount = await headers.count();

    expect(headerCount).toBeGreaterThan(0);
  });
});
