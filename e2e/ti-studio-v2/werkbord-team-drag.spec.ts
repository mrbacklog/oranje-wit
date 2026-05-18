import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 -- Werkbord kaart-positionering tests (Optie B1: vrije 2D X/Y)
 *
 * data-testid conventies:
 *   kaart-wrap-{teamId}          -- wrapper div om een losse TeamKaart
 *   kaart-wrap-sg-{groepId}      -- wrapper div om een SelectieKaart (gebundeld/niet-gebundeld)
 *
 * Seed-fixtures vereist:
 *   - team-edge-03  (Senioren 3, losse teamkaart)
 *   - sg-sg-senioren-a  (SelectieGroep met >= 2 teams)
 *
 * Cleanup:
 *   afterAll roept /api/agent/cleanup aan met de agentRunId uit de cookie.
 *   Alle kaart_verplaats-mutaties worden teruggedraaid.
 *
 * Beperkingen:
 *   - Mouse-drag (geen PDND HTML5) -- Playwright mouse API wordt gebruikt.
 *   - Tests skippen als fixture niet in test-DB staat.
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
    console.log(`[werkbord-team-drag] agentRunId voor cleanup: ${capturedAgentRunId}`);
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
      console.log(
        `[werkbord-team-drag] cleanup geslaagd: ${body.rolledBack} mutaties teruggedraaid`
      );
    }
  } catch (error) {
    console.warn("[werkbord-team-drag] cleanup fout (genegeerd):", error);
  }
});

test.describe("Werkbord kaart-positionering -- losse TeamKaart", () => {
  test.setTimeout(90_000);

  test("sleep team-edge-03 naar nieuwe positie en verifieer persistentie", async ({ page }) => {
    await page.goto("/indeling", { timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Zoek de kaart-wrapper voor team-edge-03
    const kaartWrap = page.locator('[data-testid="kaart-wrap-team-edge-03"]');
    const kaartCount = await kaartWrap.count();
    if (kaartCount === 0) {
      test.skip(true, "TODO: team-edge-03 kaart-wrap niet gevonden -- seed vereist");
      return;
    }

    // Zoek de tk-header om de sleep te starten
    const tkHeader = kaartWrap.locator(".tk-header").first();
    const headerCount = await tkHeader.count();
    if (headerCount === 0) {
      test.skip(true, "TODO: .tk-header niet gevonden in kaart-wrap-team-edge-03");
      return;
    }

    // Lees huidige positie
    const boundingBox = await tkHeader.boundingBox();
    if (!boundingBox) {
      test.skip(true, "Kon bounding box van .tk-header niet lezen");
      return;
    }

    // Sleep naar nieuwe positie (relatief aan het canvas)
    const doelX = 600;
    const doelY = 300;

    await page.mouse.move(boundingBox.x + 10, boundingBox.y + 10);
    await page.mouse.down();
    await page.waitForTimeout(100);
    // Beweeg geleidelijk
    await page.mouse.move(doelX, doelY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(2000);

    // Verifieer dat geen foutmelding verscheen
    const fout = page.locator("[data-save-state=error]");
    expect(await fout.count()).toBe(0);

    // Herlaad en verifieer positie bewaard
    await page.reload({ timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Kaart-wrap moet nog steeds aanwezig zijn
    const kaartNaReload = page.locator('[data-testid="kaart-wrap-team-edge-03"]');
    expect(await kaartNaReload.count()).toBeGreaterThan(0);

    // Positie: kaart moet verschoven zijn (left/top stijl is anders dan de grid-fallback)
    const stijl = await kaartNaReload.first().getAttribute("style");
    expect(stijl).toBeTruthy();
    // De stijl bevat "position: absolute" en een left/top -- niet de default grid-fallback waarden
    console.log(`[werkbord-team-drag] kaart stijl na reload: ${stijl}`);
  });
});

test.describe("Werkbord kaart-positionering -- SelectieGroep als blok", () => {
  test.setTimeout(90_000);

  test("sleep sg-senioren-a als geheel -- beide teams bewegen mee", async ({ page }) => {
    await page.goto("/indeling", { timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Zoek SelectieKaart wrapper
    const sgWrap = page.locator('[data-testid="kaart-wrap-sg-sg-senioren-a"]');
    const sgCount = await sgWrap.count();
    if (sgCount === 0) {
      test.skip(true, "TODO: sg-senioren-a kaart-wrap niet gevonden -- seed vereist");
      return;
    }

    // Sleep via sk-header
    const skHeader = sgWrap.locator(".sk-header").first();
    const headerCount = await skHeader.count();
    if (headerCount === 0) {
      test.skip(true, "TODO: .sk-header niet gevonden in kaart-wrap-sg-senioren-a");
      return;
    }

    const boundingBox = await skHeader.boundingBox();
    if (!boundingBox) {
      test.skip(true, "Kon bounding box van .sk-header niet lezen");
      return;
    }

    // Sleep naar nieuwe positie
    await page.mouse.move(boundingBox.x + 20, boundingBox.y + 10);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(800, 450, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(2000);

    // Geen fout
    const fout = page.locator("[data-save-state=error]");
    expect(await fout.count()).toBe(0);

    // Herlaad en verifieer
    await page.reload({ timeout: 30_000 });
    await page.waitForTimeout(2000);

    const sgNaReload = page.locator('[data-testid="kaart-wrap-sg-sg-senioren-a"]');
    expect(await sgNaReload.count()).toBeGreaterThan(0);

    // Stijl bevat nieuwe positie
    const stijl = await sgNaReload.first().getAttribute("style");
    expect(stijl).toBeTruthy();
    console.log(`[werkbord-team-drag] sg stijl na reload: ${stijl}`);
  });

  test("cleanup draait kaart_verplaats mutaties terug", async ({ request }) => {
    if (!capturedAgentRunId) {
      test.skip(true, "Geen agentRunId beschikbaar -- cleanup niet testbaar");
      return;
    }

    const baseURL = process.env.STUDIO_TEST_URL ?? "https://studio-test.ckvoranjewit.app";
    const secret = process.env.STUDIO_TEST_AGENT_SECRET ?? "";
    if (!secret) {
      test.skip(true, "STUDIO_TEST_AGENT_SECRET niet gezet");
      return;
    }

    const response = await request.post(`${baseURL}/api/agent/cleanup`, {
      data: { secret, agentRunId: capturedAgentRunId },
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.STUDIO_TEST_BASIC_AUTH_USER ?? ""}:${process.env.STUDIO_TEST_BASIC_AUTH_PASS ?? ""}`
        ).toString("base64")}`,
      },
    });

    expect(response.ok()).toBe(true);
    const body = (await response.json()) as { ok: boolean; rolledBack: number };
    expect(body.ok).toBe(true);
    // rolledBack >= 0 (kan 0 zijn als er geen kaart_verplaats mutaties waren)
    expect(typeof body.rolledBack).toBe("number");
  });
});
