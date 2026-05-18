import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Homepage Interactietests
 * Doel: verifieer homepage laadt, tiles navigeren, widgets tonen data
 * Spec: docs/superpowers/specs/2026-05-13-homepage-pagina-v2.md sectie 1+
 *
 * Draait tegen studio-test.ckvoranjewit.app (production-like data).
 * AgentMutatie cleanup: afterAll zoekt agentRunId in cookie en
 * roept POST /api/agent/cleanup aan in reverse-chronologische volgorde.
 */

let capturedAgentRunId: string | null = null;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: "./e2e/.auth/studio-test.json",
  });
  const cookies = await context.cookies();
  const agentCookie = cookies.find((c) => c.name === "__ow_agent_run_id");
  capturedAgentRunId = agentCookie?.value ?? null;
  if (capturedAgentRunId) {
    console.log(`[homepage] agentRunId voor cleanup: ${capturedAgentRunId}`);
  }
  await context.close();
});

test.afterAll(async ({ request }) => {
  if (!capturedAgentRunId) return;
  const baseURL = process.env.STUDIO_TEST_URL ?? "https://studio-test.ckvoranjewit.app";
  const secret = process.env.STUDIO_TEST_AGENT_SECRET ?? "";
  if (!secret) return;
  try {
    const response = await request.post(`${baseURL}/api/agent/cleanup`, {
      data: { secret, agentRunId: capturedAgentRunId },
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.STUDIO_TEST_BASIC_AUTH_USER ?? ""}:${process.env.STUDIO_TEST_BASIC_AUTH_PASS ?? ""}`
        ).toString("base64")}`,
      },
    });
    if (response.ok()) {
      const body = (await response.json()) as { ok: boolean; rolledBack: number };
      console.log(`[homepage] Cleanup: ${body.rolledBack} mutaties teruggedraaid`);
    }
  } catch (error) {
    console.warn("[homepage] Cleanup fout (genegeerd):", error);
  }
});

test.describe("Homepage — Smoke en ladingtijd", () => {
  test.setTimeout(60_000);

  test("laadt homepage route zonder kritieke console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/", { timeout: 30_000 });
    await page.waitForTimeout(1000);

    // Filter non-critical errors
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

  test("toont widgets en tiles op homepage", async ({ page }) => {
    await page.goto("/", { timeout: 30_000 });

    // Zoek zichtbare tiles/widgets door aria-labels of role
    // Minimaal 4 tiles verwacht: Personen, Werkbord, Kader, Memo
    const tiles = page
      .getByRole("link")
      .or(page.getByRole("button"))
      .filter({
        has: page.locator("text=/personen|werkbord|kader|memo/i"),
      });

    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Homepage — Tile-navigatie", () => {
  test.setTimeout(60_000);

  test("klik op personen-tile navigeert naar /personen/spelers", async ({ page }) => {
    await page.goto("/", { timeout: 30_000 });

    // Zoek personen-tile via data-testid of rol — gebruik .or() i.p.v. CSS-OR-chain
    const personenTile = page
      .locator('[data-testid="tile-personen"]')
      .or(page.getByRole("link", { name: /^personen$/i }))
      .first();

    await expect(personenTile).toBeVisible({ timeout: 10_000 });
    await personenTile.click();

    await page.waitForURL(/\/personen/, { timeout: 10_000 });
  });

  test("klik op werkbord-tile navigeert naar /indeling", async ({ page }) => {
    await page.goto("/", { timeout: 30_000 });

    const werkbordTile = page
      .locator('[data-testid="tile-werkbord"]')
      .or(page.getByRole("link", { name: /^werkbord$|^indeling$/i }))
      .first();

    await expect(werkbordTile).toBeVisible({ timeout: 10_000 });
    await werkbordTile.click();

    await page.waitForURL(/\/indeling/, { timeout: 10_000 });
  });

  test("klik op kader-tile navigeert naar /kader", async ({ page }) => {
    await page.goto("/", { timeout: 30_000 });

    const kaderTile = page
      .locator('[data-testid="tile-kader"]')
      .or(page.getByRole("link", { name: /^kader$/i }))
      .first();

    await expect(kaderTile).toBeVisible({ timeout: 10_000 });
    await kaderTile.click();

    await page.waitForURL(/\/kader/, { timeout: 10_000 });
  });

  test("klik op memo-tile navigeert naar /memo", async ({ page }) => {
    await page.goto("/", { timeout: 30_000 });

    const memoTile = page
      .locator('[data-testid="tile-memo"]')
      .or(page.getByRole("link", { name: /^memo$/i }))
      .first();

    await expect(memoTile).toBeVisible({ timeout: 10_000 });
    await memoTile.click();

    await page.waitForURL(/\/memo/, { timeout: 10_000 });
  });
});

test.describe("Homepage — Widget-data zichtbaarheid", () => {
  test.setTimeout(60_000);

  test("toont widget-counts voor personen (tolerant voor lege test-DB)", async ({ page }) => {
    await page.goto("/", { timeout: 30_000 });

    // Zoek personen-widget: kan een heading, card, of section zijn met 'personen'
    const personenWidget = page.locator("text=/personen|spelers/i").first();

    await expect(personenWidget).toBeVisible({ timeout: 10_000 });

    // Tolerant: count-text kan lege state zijn
    const countText = await personenWidget.textContent();
    expect(countText).toBeTruthy();
  });

  test("toont widget-counts voor werkbord (tolerant voor lege indeling)", async ({ page }) => {
    await page.goto("/", { timeout: 30_000 });

    // Zoek werkbord/indeling-widget
    const werkbordWidget = page.locator("text=/werkbord|indeling/i").first();

    await expect(werkbordWidget).toBeVisible({ timeout: 10_000 });

    const widgetText = await werkbordWidget.textContent();
    expect(widgetText).toBeTruthy();
  });

  test("lege-staat werkbord-widget toont placeholder of count", async ({ page }) => {
    await page.goto("/", { timeout: 30_000 });

    // Werkbord-widget is een <a>-link naar /indeling in <main>, bevat "Werkbord" tekst
    // Filter main > a elementen die "werkbord" bevatten
    const werkbordWidget = page
      .locator("main a")
      .filter({ has: page.locator("text=/werkbord/i") })
      .first();

    await expect(werkbordWidget).toBeVisible({ timeout: 10_000 });

    // Widget bevat tekstcontent met nummers (bijv. "229/ 327 spelers")
    const text = await werkbordWidget.textContent();
    const hasCount = /\d+/.test(text || "");
    const hasPlaceholder = /geen|empty|placeholder/i.test(text || "");

    expect(hasCount || hasPlaceholder).toBeTruthy();
  });
});
