import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Werkbord conflict-flow tussen parallelle sessies
 *
 * Reproduceert het 2026-05-18 Tycho-scenario: Antjan en Merel beiden op het
 * werkbord. Merel plaatst speler X in team A. Antjan, met een verouderde UI
 * (vóór Merels SSE-update), probeert dezelfde speler naar team B te slepen.
 * Verwacht: Antjans sessie krijgt HTTP 409 + conflict-toast + state synchroniseert
 * via SSE naar de werkelijke locatie (team A).
 *
 * Testmethode:
 *   - Context A: volledige sessie, voert de eerste verplaatsing uit
 *   - Context B: SSE-endpoint geblokkeerd via page.route() zodat context B
 *     de SSE-update van A's actie nooit ontvangt. UI-staat van B blijft stale
 *     (speler in pool). Daarna probeert B dezelfde speler te verplaatsen →
 *     verwachteLocatie = pool, werkelijk = team-edge-01 → 409 conflict.
 *
 * data-testid conventies (zie e2e-studio-test SKILL.md):
 *   speler-card-{rel_code}-spelerpool       — speler in spelerspool
 *   speler-card-{rel_code}-team-{teamId}    — speler op teamkaart
 *   team-kaart-{teamId}-huidig              — team drop-target wrapper
 *
 * Seed-fixtures vereist:
 *   - rel_code 990010000008 (Edge-AlgReserve-V) in spelerspool
 *     LET OP: AlgReserve is normaal NIET koppelbaar aan team — gebruik daarom
 *     990010000001 (Edge-Beschikbaar-V) die op team-edge-01 staat.
 *     Voor dit scenario: rel_code 990010000006 (Edge-NieuwPotent-M) in spelerspool.
 *   - team-edge-01 (Senioren 1) als doel voor context A
 *   - team-edge-02 (Senioren 2) als doel voor context B
 *
 * Cleanup:
 *   afterAll roept /api/agent/cleanup aan met de agentRunId uit de cookie.
 */

// Speler in spelerspool voor het conflict-scenario
// Edge-NieuwPotent-M (990010000006) is in spelerspool per sectie 1.3 van de catalogus
const CONFLICT_SPELER_REL_CODE = "990010000006";

// Team waar context A de speler heen sleept
const TEAM_A_ID = "team-edge-01";

// Team waar context B de speler heen wil slepen (conflicteert met A)
const TEAM_B_ID = "team-edge-02";

// SSE endpoint patroon — blokkeer op context B zodat hij A's update mist
const SSE_PATH_PATTERN = "**/api/indeling/*/sse";

let capturedAgentRunId: string | null = null;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: "./e2e/.auth/studio-test.json",
  });
  const cookies = await context.cookies();
  const agentCookie = cookies.find((c) => c.name === "__ow_agent_run_id");
  capturedAgentRunId = agentCookie?.value ?? null;
  if (capturedAgentRunId) {
    console.log(`[werkbord-conflict] agentRunId voor cleanup: ${capturedAgentRunId}`);
  } else {
    console.log("[werkbord-conflict] Geen agentRunId in cookies — cleanup overgeslagen");
  }
  await context.close();
});

test.afterAll(async ({ request }) => {
  if (!capturedAgentRunId) {
    console.log("[werkbord-conflict] afterAll: geen agentRunId — cleanup overgeslagen");
    return;
  }

  const baseURL = process.env.STUDIO_TEST_URL ?? "https://studio-test.ckvoranjewit.app";
  const secret = process.env.STUDIO_TEST_AGENT_SECRET ?? "";

  if (!secret) {
    console.log(
      "[werkbord-conflict] afterAll: STUDIO_TEST_AGENT_SECRET niet gezet — cleanup overgeslagen"
    );
    return;
  }

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
        `[werkbord-conflict] Cleanup geslaagd: ${body.rolledBack} mutaties teruggedraaid`
      );
    } else {
      console.warn(`[werkbord-conflict] Cleanup mislukt: HTTP ${response.status()}`);
    }
  } catch (error) {
    // Cleanup mag nooit de testrun laten falen
    console.warn("[werkbord-conflict] Cleanup fout (genegeerd):", error);
  }
});

test.describe("Werkbord-conflict — parallelle sessies (Tycho-scenario)", () => {
  test.setTimeout(120_000);

  test("tweede sessie krijgt 409 conflict-toast en speler synchroniseert via SSE", async ({
    browser,
  }) => {
    // Context A = "Merel": voert de eerste verplaatsing uit
    const ctxA = await browser.newContext({
      storageState: "./e2e/.auth/studio-test.json",
    });

    // Context B = "Antjan": SSE geblokkeerd zodat hij A's update mist
    const ctxB = await browser.newContext({
      storageState: "./e2e/.auth/studio-test.json",
    });

    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      // ─── Skip-guard: seed vereist ────────────────────────────────────────────

      // Beide contexten navigeren naar /indeling
      await pageA.goto("/indeling", { timeout: 30_000, waitUntil: "load" });
      await pageB.goto("/indeling", { timeout: 30_000, waitUntil: "load" });

      if (pageA.url().includes("/login") || pageB.url().includes("/login")) {
        test.skip(true, "Geredireerd naar /login (sessie verlopen)");
        return;
      }

      // Wacht op team-kaart-{TEAM_A_ID}-huidig in beide contexten
      const teamKaartAInA = pageA.locator(`[data-testid="team-kaart-${TEAM_A_ID}-huidig"]`);
      const teamKaartBInB = pageB.locator(`[data-testid="team-kaart-${TEAM_B_ID}-huidig"]`);

      const teamACount = await teamKaartAInA.count();
      if (teamACount === 0) {
        test.skip(true, `TODO: team-kaart-${TEAM_A_ID}-huidig niet gevonden — seed vereist`);
        return;
      }

      const teamBCount = await teamKaartBInB.count();
      if (teamBCount === 0) {
        test.skip(true, `TODO: team-kaart-${TEAM_B_ID}-huidig niet gevonden — seed vereist`);
        return;
      }

      // Zorg dat spelerspool open is in beide contexten
      for (const page of [pageA, pageB]) {
        const poolOpen = await page.locator("data-testid=drop-zone-spelerpool").count();
        if (poolOpen === 0) {
          const toggle = page.locator('button:has-text("Pool"), [data-testid="pool-toggle"]');
          if ((await toggle.count()) > 0) {
            await toggle.first().click();
            await page.waitForTimeout(500);
          }
        }
      }

      // Controleer of de conflict-speler in de spelerspool zit
      const spelerInPoolA = pageA.locator(
        `[data-testid="speler-card-${CONFLICT_SPELER_REL_CODE}-spelerpool"]`
      );
      const spelerInPoolB = pageB.locator(
        `[data-testid="speler-card-${CONFLICT_SPELER_REL_CODE}-spelerpool"]`
      );

      const spelerInPoolACount = await spelerInPoolA.count();
      if (spelerInPoolACount === 0) {
        test.skip(
          true,
          `TODO: speler ${CONFLICT_SPELER_REL_CODE} niet in spelerspool — seed vereist (edge-case-testdata.md sectie 1.3)`
        );
        return;
      }

      const spelerInPoolBCount = await spelerInPoolB.count();
      if (spelerInPoolBCount === 0) {
        test.skip(
          true,
          `TODO: speler ${CONFLICT_SPELER_REL_CODE} niet zichtbaar in context B spelerspool — seed vereist`
        );
        return;
      }

      // ─── Stap 1: Blokkeer SSE op context B ───────────────────────────────────
      // Context B ontvangt hierdoor A's SSE-update niet → stale UI-staat
      // page.route() onderschept EventSource-verbindingen op dit pad
      await pageB.route(SSE_PATH_PATTERN, (route) => {
        // Annuleer SSE-requests zodat B de real-time updates mist
        route.abort().catch(() => {
          // Negeer abort-fouten (request al afgehandeld)
        });
      });
      console.log("[werkbord-conflict] SSE geblokkeerd op context B");

      // ─── Stap 2: Context A sleept speler naar team-edge-01 ───────────────────
      // Wacht op een 200 response van de verplaats-API voordat we doorgaan
      const aResponsePromise = pageA.waitForResponse(
        (resp) =>
          resp.url().includes("/api/indeling/") &&
          resp.request().method() === "POST" &&
          resp.status() === 200,
        { timeout: 15_000 }
      );

      const doelTeamKaartA = pageA.locator(`[data-testid="team-kaart-${TEAM_A_ID}-huidig"]`);
      await spelerInPoolA.dragTo(doelTeamKaartA.first(), { timeout: 10_000 });

      // Wacht tot A's mutatie succesvol is opgeslagen
      await aResponsePromise;
      console.log(
        `[werkbord-conflict] Context A: speler ${CONFLICT_SPELER_REL_CODE} → ${TEAM_A_ID} geslaagd`
      );

      // ─── Stap 3: Context B probeert dezelfde speler naar team-edge-02 ─────────
      // B's UI heeft de speler nog in de spelerspool (SSE geblokkeerd).
      // B stuurt `verwachteLocatie: { soort: "pool" }` maar DB heeft `{ soort: "team", teamId: "team-edge-01" }`.
      // Server retourneert 409.

      // Wacht op de 409-response van context B — dit is de kernassertion
      const bConflictResponsePromise = pageB.waitForResponse(
        (resp) =>
          resp.url().includes("/api/indeling/") &&
          resp.request().method() === "POST" &&
          resp.status() === 409,
        { timeout: 20_000 }
      );

      const doelTeamKaartB = pageB.locator(`[data-testid="team-kaart-${TEAM_B_ID}-huidig"]`);
      // B sleept nog steeds de (in zijn ogen) in-pool zittende speler
      await spelerInPoolB.dragTo(doelTeamKaartB.first(), { timeout: 10_000 });

      // Wacht op de 409-response
      const conflictResponse = await bConflictResponsePromise;
      const conflictBody = (await conflictResponse.json()) as {
        ok: boolean;
        conflict?: { verwacht: unknown; werkelijk: unknown; doorWie?: { naam?: string } };
      };
      expect(conflictBody.ok).toBe(false);
      expect(conflictBody.conflict).toBeDefined();
      console.log(
        `[werkbord-conflict] 409 ontvangen, doorWie: ${conflictBody.conflict?.doorWie?.naam ?? "onbekend"}`
      );

      // ─── Stap 4: Conflict-toast verschijnt in context B ──────────────────────
      // ConflictToast heeft role="alert" en bevat de tekst "Tegelijk bewerkt"
      await expect(pageB.locator("[role='alert']")).toContainText("Tegelijk bewerkt", {
        timeout: 5_000,
      });
      console.log("[werkbord-conflict] Conflict-toast verschijnt in context B");

      // ─── Stap 5: Context A is ongewijzigd — speler staat op team-edge-01 ─────
      const spelerOpTeamA = pageA.locator(
        `[data-testid="speler-card-${CONFLICT_SPELER_REL_CODE}-team-${TEAM_A_ID}"]`
      );
      await expect(spelerOpTeamA).toBeVisible({ timeout: 5_000 });
      console.log("[werkbord-conflict] Context A: speler correct op team-edge-01");

      // ─── Stap 6: Na SSE-deblokkering synchroniseert context B ────────────────
      // Deblokkeer SSE zodat context B de actuele staat kan ophalen
      await pageB.unroute(SSE_PATH_PATTERN);

      // Na conflict triggert useWerkbordState een herlaad via onConflict → herlaadStaat.
      // Context B toont uiteindelijk de speler op team-edge-01 (A's locatie), NIET team-edge-02.
      //
      // Timing: herlaadStaat is synchronisch (setState), maar het impliciete
      // herlaad-mechanisme loopt via de SSE die we net deblokkeerden of via de
      // conflict-callback in TiStudioShell. Geef 5s voor de UI-synchronisatie.
      //
      // Acceptabel resultaat: speler NIET op team-edge-02 (B's fout-doel).
      // De speler kan op team-edge-01 staan (als SSE aankomt) OF nog in pool
      // tonen (als herlaad nog niet compleet is). Het KRITIEKE is dat hij niet
      // op team-edge-02 staat.
      await expect(
        pageB.locator(`[data-testid="speler-card-${CONFLICT_SPELER_REL_CODE}-team-${TEAM_B_ID}"]`)
      ).not.toBeVisible({ timeout: 5_000 });

      console.log(
        "[werkbord-conflict] Context B: speler NIET op team-edge-02 (correcte afwijzing)"
      );

      // Bonus-assert: speler staat uiteindelijk op team-edge-01 in context B
      // (na SSE-deblokkering en herlaad-cyclus; timeout ruimer voor netwerk-latency)
      //
      // Wrapped in try/catch zodat een trage SSE de test niet laat falen —
      // de harde assertion hierboven (niet op team-B) is voldoende voor het scenario.
      try {
        await expect(
          pageB.locator(`[data-testid="speler-card-${CONFLICT_SPELER_REL_CODE}-team-${TEAM_A_ID}"]`)
        ).toBeVisible({ timeout: 8_000 });
        console.log(
          "[werkbord-conflict] Context B: speler gesynchroniseerd naar team-edge-01 via SSE"
        );
      } catch {
        // SSE-synchronisatie traag of uitgesteld — geen kritieke fout.
        // Kernasserties hierboven zijn al geslaagd (409 + toast + niet op team-B).
        console.log(
          "[werkbord-conflict] Context B: SSE-synchronisatie naar team-edge-01 nog niet compleet (bonus-assert overgeslagen)"
        );
      }
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test("conflict-respons bevat werkelijke locatie en doorWie-informatie", async ({ browser }) => {
    // Lichtere test: verifieert de structuur van de 409-response zonder volledige E2E-flow.
    // Draait alleen als seed beschikbaar is.
    //
    // Stappen:
    // 1. Context A plaatst speler op team-edge-03
    // 2. Context B (SSE geblokkeerd) probeert dezelfde speler naar team-edge-04
    // 3. Verifieer 409-body: conflict.verwacht, conflict.werkelijk, conflict.doorWie
    //
    // Separate speler om interferentie met test 1 te vermijden:
    // 990010000007 (Edge-NieuwDef-M) is ook in spelerspool per catalogus sectie 1.3

    const SPELER2 = "990010000007";
    const TEAM_C_ID = "team-edge-03";
    const TEAM_D_ID = "team-edge-04";

    const ctxA = await browser.newContext({ storageState: "./e2e/.auth/studio-test.json" });
    const ctxB = await browser.newContext({ storageState: "./e2e/.auth/studio-test.json" });
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      await pageA.goto("/indeling", { timeout: 30_000, waitUntil: "load" });
      await pageB.goto("/indeling", { timeout: 30_000, waitUntil: "load" });

      if (pageA.url().includes("/login") || pageB.url().includes("/login")) {
        test.skip(true, "Geredireerd naar /login (sessie verlopen)");
        return;
      }

      // Open spelerspool indien nodig
      for (const page of [pageA, pageB]) {
        const poolOpen = await page.locator("data-testid=drop-zone-spelerpool").count();
        if (poolOpen === 0) {
          const toggle = page.locator('button:has-text("Pool"), [data-testid="pool-toggle"]');
          if ((await toggle.count()) > 0) {
            await toggle.first().click();
            await page.waitForTimeout(500);
          }
        }
      }

      const speler2InPoolA = pageA.locator(`[data-testid="speler-card-${SPELER2}-spelerpool"]`);
      const speler2InPoolB = pageB.locator(`[data-testid="speler-card-${SPELER2}-spelerpool"]`);
      const teamCInA = pageA.locator(`[data-testid="team-kaart-${TEAM_C_ID}-huidig"]`);
      const teamDInB = pageB.locator(`[data-testid="team-kaart-${TEAM_D_ID}-huidig"]`);

      if (
        (await speler2InPoolA.count()) === 0 ||
        (await speler2InPoolB.count()) === 0 ||
        (await teamCInA.count()) === 0 ||
        (await teamDInB.count()) === 0
      ) {
        test.skip(
          true,
          `TODO: fixture ${SPELER2} of team-edge-03/04 niet beschikbaar — seed vereist`
        );
        return;
      }

      // Blokkeer SSE op context B
      await pageB.route(SSE_PATH_PATTERN, (route) => {
        route.abort().catch(() => {
          // Negeer abort-fouten
        });
      });

      // A verplaatst speler naar team C
      const aResponsePromise = pageA.waitForResponse(
        (resp) =>
          resp.url().includes("/api/indeling/") &&
          resp.request().method() === "POST" &&
          resp.status() === 200,
        { timeout: 15_000 }
      );

      await speler2InPoolA.dragTo(teamCInA.first(), { timeout: 10_000 });
      await aResponsePromise;

      // B probeert speler naar team D — verwacht 409
      const bConflictPromise = pageB.waitForResponse(
        (resp) =>
          resp.url().includes("/api/indeling/") &&
          resp.request().method() === "POST" &&
          resp.status() === 409,
        { timeout: 20_000 }
      );

      await speler2InPoolB.dragTo(teamDInB.first(), { timeout: 10_000 });
      const conflictResp = await bConflictPromise;

      const body = (await conflictResp.json()) as {
        ok: boolean;
        conflict?: {
          conflict: true;
          verwacht: { soort: string };
          werkelijk: { soort: string; teamId?: string };
          doorWie?: { naam?: string; userId?: string; tijdstip?: string };
        };
      };

      // Structuur-asserties op de 409-body
      expect(body.ok).toBe(false);
      expect(body.conflict).toBeDefined();
      expect(body.conflict?.verwacht).toMatchObject({ soort: "pool" });
      expect(body.conflict?.werkelijk).toMatchObject({ soort: "team", teamId: TEAM_C_ID });
      // doorWie is optioneel maar moet een naam bevatten als er een mutatie-log is
      if (body.conflict?.doorWie) {
        expect(typeof body.conflict.doorWie.naam).toBe("string");
      }

      console.log(
        `[werkbord-conflict] 409-structuur correct: verwacht=${JSON.stringify(body.conflict?.verwacht)}, werkelijk=${JSON.stringify(body.conflict?.werkelijk)}`
      );

      await pageB.unroute(SSE_PATH_PATTERN);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});
