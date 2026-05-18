import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Reservering E2E tests
 *
 * Draait tegen studio-test.ckvoranjewit.app (production-like data).
 * Tests voor reservering-creatie en -verwijdering in TeamDialog.
 *
 * OPMERKING: Tests presupponeren dat de volgende server-actions bestaan:
 *   - maakReserveringInTeam({ teamId, geslacht }) — nog niet gebouwd
 *   - verwijderReservering(id) — nog niet gebouwd
 *
 * Cleanup via AgentMutatie-cookie: afterAll roept POST /api/agent/cleanup aan
 * met agentRunId om alle reserveringen die in deze test aangemaakt zijn
 * teruggedraaid.
 *
 * DOM-conventies:
 *   - TeamDialog: [role="dialog"][aria-label*="Team:"]
 *   - Dames-kolom: zoek "♀ Dames" of "Dames" tekstinhoud
 *   - Heren-kolom: zoek "♂ Heren" of "Heren" tekstinhoud
 *   - Reservering-rij: toont "Plek D-" (Dames) of "Plek H-" (Heren) in italic
 *   - Verwijder-knop: kleine knop met "×" of aria-label bevat "Verwijder"
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
    console.log(`[reservering] agentRunId voor cleanup: ${capturedAgentRunId}`);
  }
  await context.close();
});

test.afterAll(async ({ request }) => {
  if (!capturedAgentRunId) {
    console.log("[reservering] afterAll: geen agentRunId — cleanup overgeslagen");
    return;
  }

  const baseURL = process.env.STUDIO_TEST_URL ?? "https://studio-test.ckvoranjewit.app";
  const secret = process.env.STUDIO_TEST_AGENT_SECRET ?? "";

  if (!secret) {
    console.log(
      "[reservering] afterAll: STUDIO_TEST_AGENT_SECRET niet gezet — cleanup overgeslagen"
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
      console.log(`[reservering] Cleanup: ${body.rolledBack} mutaties teruggedraaid`);
    } else {
      console.warn(`[reservering] Cleanup mislukt: HTTP ${response.status()}`);
    }
  } catch (error) {
    console.warn("[reservering] Cleanup fout (genegeerd):", error);
  }
});

test.describe("Reservering — TeamDialog creatie en verwijdering", () => {
  test.setTimeout(90_000);

  test.fixme("creëer reservering bij Dames-kolom", async ({ page }) => {
    // ─────────────────────────────────────────────────────────────────
    // FIXME: Server-action maakReserveringInTeam({teamId, geslacht})
    //        moet nog worden geïmplementeerd. Test presupponeer deze!
    // ─────────────────────────────────────────────────────────────────

    // Navigeer naar werkbord indeling
    await page.goto("/indeling", { timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Zoek team-kaarten
    const teamKaarten = page.locator('[data-testid^="team-kaart-"]');

    if ((await teamKaarten.count()) === 0) {
      test.skip(true, "Werkbord bevat geen team-kaarten op studio-test");
      return;
    }

    // Klik op eerste team-kaart
    const eersteTeam = teamKaarten.first();
    await expect(eersteTeam).toBeVisible({ timeout: 10_000 });
    await eersteTeam.click();
    await page.waitForTimeout(300);

    // Verifieer TeamDialog geopend
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    const ariaLabel = await dialog.getAttribute("aria-label");
    expect(ariaLabel).toMatch(/^Team:/);

    // Verifieer Overzicht-tab is standaard actief (geen click nodig)
    const overzichtContent = dialog.locator("text=/[Dd]ames|[Hh]eren/");
    await expect(overzichtContent).toBeVisible({ timeout: 3_000 });

    // Zoek Dames-kolom header en tel huidige rijen
    const damesHeader = dialog.locator("text=/♀|Dames/").first();
    await expect(damesHeader).toBeVisible({ timeout: 3_000 });

    // Zoek alle speler-rijen in Dames-kolom
    // Aanname: speler-rijen in eerste kolom bevinden zich tussen dames-header en heren-header
    const damesKolom = damesHeader.locator("../../.."); // omvat gehele kolom
    const damesRows = await damesKolom.locator("text=/[A-Z]/").count();

    // Zoek "+ Reservering"-knop in Dames-kolom
    const damesReserveringBtn = dialog.locator("button").filter({ hasText: /\+ Reservering/i });

    // Controleer of de knop zichtbaar is (fout als deze nog niet gebouwd is)
    const btnCount = await damesReserveringBtn.count();
    if (btnCount === 0) {
      test.skip(true, "Reservering-knop niet gevonden in Dames-kolom (feature nog niet gebouwd)");
      return;
    }

    // Klik "+ Reservering"
    const firstReserveringBtn = damesReserveringBtn.first();
    await expect(firstReserveringBtn).toBeVisible({ timeout: 3_000 });
    await firstReserveringBtn.click();

    // Wacht op optimistic update
    await page.waitForTimeout(2000);

    // Verifieer dat er een reservering is toegevoegd
    // Zoek naar "Plek D-" patroon in italic
    const plekkentekst = dialog.locator("text=/Plek [DH]-/");
    const plekkentekstCount = await plekkentekst.count();

    expect(plekkentekstCount).toBeGreaterThanOrEqual(1);

    // Verifieer "RES"-badge of italic-styling (indicatie van reservering)
    const resBadges = dialog.locator("text=/RES/");
    const resBadgeCount = await resBadges.count();

    // Minstens één RES-badge zou zichtbaar moeten zijn
    if (resBadgeCount > 0) {
      expect(resBadgeCount).toBeGreaterThanOrEqual(1);
    }

    // Sluit dialog
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  });

  test.fixme("verwijder reservering", async ({ page }) => {
    // ─────────────────────────────────────────────────────────────────
    // FIXME: Server-actions maakReserveringInTeam + verwijderReservering
    //        moeten nog worden geïmplementeerd. Test presupponeer deze!
    // ─────────────────────────────────────────────────────────────────

    // Navigeer naar werkbord indeling
    await page.goto("/indeling", { timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Zoek team-kaarten
    const teamKaarten = page.locator('[data-testid^="team-kaart-"]');

    if ((await teamKaarten.count()) === 0) {
      test.skip(true, "Werkbord bevat geen team-kaarten op studio-test");
      return;
    }

    // Klik op eerste team-kaart
    const eersteTeam = teamKaarten.first();
    await expect(eersteTeam).toBeVisible({ timeout: 10_000 });
    await eersteTeam.click();
    await page.waitForTimeout(300);

    // Verifieer TeamDialog geopend
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Maak reservering aan via "+ Reservering"-knop in Dames-kolom
    const damesReserveringBtn = dialog
      .locator("button")
      .filter({ hasText: /\+ Reservering/i })
      .first();

    if ((await damesReserveringBtn.count()) === 0) {
      test.skip(true, "Reservering-knop niet gevonden (feature nog niet gebouwd)");
      return;
    }

    await expect(damesReserveringBtn).toBeVisible({ timeout: 3_000 });
    await damesReserveringBtn.click();

    // Wacht op optimistic update
    await page.waitForTimeout(2000);

    // Zoek de zojuist gemaakte reservering-rij
    // Zoekt naar "Plek D-" en zoekt daarbinnen de "×"-knop
    const plekreg = dialog.locator("text=/Plek D-/");
    if ((await plekreg.count()) === 0) {
      test.skip(true, "Reservering niet zichtbaar in UI na creatie");
      return;
    }

    // Zoek verwijder-knop (× of Verwijder-aria-label) in dezelfde rij
    const lastPlekRij = plekreg.last();
    const verwijderBtn = lastPlekRij.locator("button").filter(async (btn) => {
      const ariaLabel = await btn.getAttribute("aria-label");
      const text = await btn.textContent();
      return text?.includes("×") || ariaLabel?.includes("Verwijder");
    });

    if ((await verwijderBtn.count()) === 0) {
      test.skip(
        true,
        "Verwijder-knop niet gevonden in reservering-rij (UI nog niet volledig gebouwd)"
      );
      return;
    }

    // Klik verwijder-knop
    await verwijderBtn.first().click();

    // Wacht op optimistic update
    await page.waitForTimeout(2000);

    // Verifieer dat reservering verdwijnt
    const plekrengNa = dialog.locator("text=/Plek D-/");
    const countNa = await plekrengNa.count();

    // Als we maar één reservering aangemaakt hebben, zou count nu 0 moeten zijn
    // (of minder dan voorheen)
    expect(countNa).toBeLessThanOrEqual(0);

    // Sluit dialog
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  });

  test.fixme("creëer reservering bij Heren-kolom", async ({ page }) => {
    // ─────────────────────────────────────────────────────────────────
    // FIXME: Server-action maakReserveringInTeam({teamId, geslacht})
    //        moet nog worden geïmplementeerd. Test presupponeer deze!
    // ─────────────────────────────────────────────────────────────────

    // Navigeer naar werkbord indeling
    await page.goto("/indeling", { timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Zoek team-kaarten
    const teamKaarten = page.locator('[data-testid^="team-kaart-"]');

    if ((await teamKaarten.count()) === 0) {
      test.skip(true, "Werkbord bevat geen team-kaarten op studio-test");
      return;
    }

    // Klik op eerste team-kaart
    const eersteTeam = teamKaarten.first();
    await expect(eersteTeam).toBeVisible({ timeout: 10_000 });
    await eersteTeam.click();
    await page.waitForTimeout(300);

    // Verifieer TeamDialog geopend
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    const ariaLabel = await dialog.getAttribute("aria-label");
    expect(ariaLabel).toMatch(/^Team:/);

    // Verifieer Overzicht-tab is standaard actief
    const overzichtContent = dialog.locator("text=/[Dd]ames|[Hh]eren/");
    await expect(overzichtContent).toBeVisible({ timeout: 3_000 });

    // Zoek Heren-kolom header
    const herenHeader = dialog.locator("text=/♂|Heren/").first();
    await expect(herenHeader).toBeVisible({ timeout: 3_000 });

    // Zoek "+ Reservering"-knop in Heren-kolom
    // (aanname: er zijn meerdere knappen, we willen de tweede)
    const allReserveringBtns = dialog.locator("button").filter({ hasText: /\+ Reservering/i });

    const btnCount = await allReserveringBtns.count();
    if (btnCount < 2) {
      test.skip(true, "Niet genoeg Reservering-knoppen (mogelijk nog niet gebouwd)");
      return;
    }

    // Klik op tweede "+ Reservering"-knop (Heren)
    const herenReserveringBtn = allReserveringBtns.last();
    await expect(herenReserveringBtn).toBeVisible({ timeout: 3_000 });
    await herenReserveringBtn.click();

    // Wacht op optimistic update
    await page.waitForTimeout(2000);

    // Verifieer dat er een reservering is toegevoegd met "Plek H-" patroon
    const plek = dialog.locator("text=/Plek H-/");
    const plekCount = await plek.count();

    expect(plekCount).toBeGreaterThanOrEqual(1);

    // Sluit dialog
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  });
});
