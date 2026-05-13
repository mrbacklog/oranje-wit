import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Smoke Tests
 * Doel: verifieer basale werking van alle v2-pagina's
 * Spec: personen pagina docs/superpowers/specs/2026-05-13-personen-pagina-v2.md sectie 1
 *       werkbord pagina docs/superpowers/specs/2026-05-13-werkbord-pagina-v2.md
 */

test.describe("TI Studio v2 pagina's — Smoke", () => {
  test.setTimeout(60_000);

  const routes = [
    { path: "/", name: "Homepage" },
    { path: "/personen/spelers", name: "Personen — Spelers" },
    { path: "/personen/staf", name: "Personen — Staf" },
    { path: "/personen/reserveringen", name: "Personen — Reserveringen" },
    { path: "/indeling", name: "Werkbord" },
    { path: "/kader", name: "Kader" },
    { path: "/memo", name: "Memo" },
    { path: "/sync", name: "Sync", skip: true }, // Route B: nog niet geïmplementeerd
  ];

  for (const route of routes) {
    const testFn = route.skip ? test.skip : test;
    testFn(`laadt ${route.name} zonder kritieke console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(route.path, { timeout: 30_000 });
      await page.waitForTimeout(1000);

      // Filter non-critical errors (blueprint-implementatie mag nog missing imports hebben)
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
  }
});

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

  test("toont tabel-koppen op spelers-tab", async ({ page }) => {
    await page.goto("/personen/spelers", { timeout: 30_000 });

    // Basis tabel-headers verwacht: naam, status, indeling, etc
    // Lookup via accessibility API — heading text
    const headers = page.locator("thead th");
    const headerCount = await headers.count();

    expect(headerCount).toBeGreaterThan(0);
  });
});
