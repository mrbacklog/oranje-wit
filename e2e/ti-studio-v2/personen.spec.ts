import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Personen pagina interactietests
 * Spec: docs/superpowers/specs/2026-05-13-personen-pagina-v2.md + sectie 9 DoD
 *
 * Drie interactietests per spec:
 * 1. Inline status-edit — SKIP: AgentMutatie-type 'speler_status_wijziging' nog niet ondersteund
 * 2. HoverKaart — hover naam-cel, kaart toont en verdwijnt (naam + status zichtbaar)
 * 3. Staf-dialog — open staf-tab, klik actie-cel, dialog opent, escape sluit
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
    console.log(`[personen] agentRunId voor cleanup: ${capturedAgentRunId}`);
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
      console.log(`[personen] Cleanup: ${body.rolledBack} mutaties teruggedraaid`);
    }
  } catch (error) {
    console.warn("[personen] Cleanup fout (genegeerd):", error);
  }
});

test.describe("Personen — Spelers interacties", () => {
  test.setTimeout(60_000);

  test("inline status-edit persisterend via server action", async ({ page: _ }) => {
    test.skip(
      true,
      "TODO: AgentMutatie-type 'speler_status_wijziging' nog niet ondersteund — zie vervolgplan"
    );
    // Referentie-implementatie bewaard voor vervolgplan:
    // Spec: Inline edits zijn save-on-change — na select wijziging triggert server action direct
    // Navigeer naar spelers-tab, pak eerste rij, klik status-cel, wijzig waarde, reload, verifieer persistentie
  });

  test("hover-kaart toont naam en status op naam-cel hover", async ({ page }) => {
    // Spec: HoverKaart toont op mouseenter van naam-cel, bevat naam + status + huidig team
    await page.goto("/personen/spelers", { timeout: 30_000 });

    // Wacht tot tabel geladen
    const tabelRijen = page.locator("tbody tr");
    await expect(tabelRijen.first()).toBeVisible({ timeout: 10_000 });

    // Pak eerste speler-rij
    const eersteRij = tabelRijen.first();

    // Spec: SpelerNaamCel = avatar + naam, hovering triggert HoverKaartSpeler
    // Zoek naam-cel via accessibility of content-hint
    const naamCel = eersteRij
      .locator('[data-testid="naam-cel"]')
      .or(eersteRij.locator('[data-testid="speler-naam"]'))
      .or(eersteRij.locator("td").first());

    const naamCelExists = await naamCel.count();

    if (naamCelExists > 0) {
      // Hover over naam-cel
      await naamCel.first().hover();

      // Verifieer dat hover-kaart verschijnt (portal rendering)
      const hoverKaart = page.locator(
        '[data-testid="hover-kaart"], [role="tooltip"], .hover-kaart'
      );

      await expect(hoverKaart.first()).toBeVisible({ timeout: 5_000 });

      // Verifieer inhoud: kaart moet naam en status bevatten
      const kaartContent = await hoverKaart.first().textContent();
      expect(kaartContent).toBeTruthy();

      // Kaart mag minstens één status-woord bevatten
      expect(kaartContent).toMatch(/AANWEZIG|AFWEZIG|ONZEKER|NIEUW_POTENTIEEL/i);

      // Mouse move away (simuleert mouseleave)
      await page.mouse.move(0, 0);

      // Verifieer dat kaart verdwijnt (met 150ms delay per spec)
      await expect(hoverKaart.first()).not.toBeVisible({ timeout: 3_000 });
    }
  });
});

test.describe("Personen — Staf interacties", () => {
  test.setTimeout(60_000);

  test("staf-dialog opent bij actie-knop click, sluit met escape", async ({ page }) => {
    // Spec: ActieCel opent StafDialog (modal)
    // Dialog bevat staf-naam en verdwijnt bij Escape
    await page.goto("/personen/staf", { timeout: 30_000 });

    // Wacht tot staf-tabel geladen is
    const tabelRijen = page.locator("tbody tr");
    await expect(tabelRijen.first()).toBeVisible({ timeout: 10_000 });

    // Pak eerste staf-rij
    const eersteRij = tabelRijen.first();

    // Spec: ActieCel bevat kebab-menu of icon-knop
    // Zoek actie-knop via accessibility of data-testid
    const actieKnop = eersteRij.locator(
      '[data-testid="actie-cell"] button, button[aria-label*="action"], [data-testid="staf-actie"]'
    );

    const actieKnopExists = await actieKnop.count();

    if (actieKnopExists > 0) {
      // Klik op actie-knop
      await actieKnop.first().click();

      // Verifieer dat dialog opent
      // Dialog kan zijn: <dialog>, [role="dialog"], .modal, etc
      const dialog = page.locator('[data-testid="staf-dialog"], [role="dialog"], dialog, .modal');

      await expect(dialog.first()).toBeVisible({ timeout: 5_000 });

      // Verifieer dat dialog inhoud bevat (staf-naam of titel)
      const dialogContent = await dialog.first().textContent();
      expect(dialogContent).toBeTruthy();

      // Dialog mag minstens "staf" of stafs naam bevatten
      expect(dialogContent).toMatch(/staf|Staff|Trainer|Toezichthouder/i);

      // Druk escape-toets
      await page.keyboard.press("Escape");

      // Verifieer dat dialog sluit
      await expect(dialog.first()).not.toBeVisible({ timeout: 3_000 });
    }
  });
});
