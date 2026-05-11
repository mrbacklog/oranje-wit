import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Smoke Tests
 * Doel: verifieer basale werking van de schaduw-app
 * Focus op shell, navigatie beschikbaarheid en health endpoint
 */

test.describe("TI Studio v2 — Smoke Tests", () => {
  test.setTimeout(60_000);

  test("pagina laadt met titel 'TI Studio v2'", async ({ page }) => {
    await page.goto("/", { timeout: 30_000 });

    // Verifieer dat de pagina titel TI Studio v2 bevat
    const title = await page.title();
    expect(title).toContain("TI Studio v2");
  });

  test("geen kritieke console errors bij pagina-load", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/", { timeout: 30_000 });

    // Wacht even zodat all errors geregistreerd worden
    await page.waitForTimeout(2000);

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("NetworkError") &&
        !e.includes("WebSocket") &&
        !e.includes("Failed to fetch")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("API health endpoint geeft ok: true", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});
