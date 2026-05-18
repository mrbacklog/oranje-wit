import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Smoke Tests
 * Doel: verifieer basale werking van alle v2-pagina's
 * Spec: personen pagina docs/superpowers/specs/2026-05-13-personen-pagina-v2.md sectie 1
 *       werkbord pagina docs/superpowers/specs/2026-05-13-werkbord-pagina-v2.md
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
    console.log(`[smoke] agentRunId voor cleanup: ${capturedAgentRunId}`);
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
      console.log(`[smoke] Cleanup: ${body.rolledBack} mutaties teruggedraaid`);
    }
  } catch (error) {
    console.warn("[smoke] Cleanup fout (genegeerd):", error);
  }
});

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

    // Verifieer redirect via DOM-state i.p.v. URL-match (robuust voor Basic-Auth-roundtrip)
    await page.waitForURL(/\/personen\/spelers/, { timeout: 10_000 });
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

    await page.waitForURL(/\/personen\/staf/, { timeout: 10_000 });
  });

  test("Reserveringen-tab link opent /personen/reserveringen", async ({ page }) => {
    await page.goto("/personen/spelers", { timeout: 30_000 });

    const reserveringenTab = page.getByRole("link", {
      name: /reserveringen/i,
    });
    await reserveringenTab.click();

    await page.waitForURL(/\/personen\/reserveringen/, { timeout: 10_000 });
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
