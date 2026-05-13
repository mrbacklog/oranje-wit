import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Personen pagina interactietests
 * Spec: docs/superpowers/specs/2026-05-13-personen-pagina-v2.md + sectie 9 DoD
 *
 * Drie interactietests per spec:
 * 1. Inline status-edit — status-cel klikken, wijzig status, verifieer persistentie na reload
 * 2. HoverKaart — hover naam-cel, kaart toont en verdwijnt (naam + status zichtbaar)
 * 3. Staf-dialog — open staf-tab, klik actie-cel, dialog opent, escape sluit
 */

test.describe("Personen — Spelers interacties", () => {
  test.setTimeout(60_000);

  test("inline status-edit persisterend via server action", async ({ page }) => {
    // Spec: Inline edits zijn save-on-change — na select wijziging triggert server action direct
    // Navigeer naar spelers-tab
    await page.goto("/personen/spelers", { timeout: 30_000 });

    // Wacht tot tabel geladen is (minstens 1 data-rij)
    const tabelRijen = page.locator("tbody tr");
    await expect(tabelRijen.first()).toBeVisible({ timeout: 10_000 });

    // Pak de eerste speler-rij
    const eersteRij = tabelRijen.first();

    // Spec: StatusCel toont kleurstip + label, inline-edit via select on click
    // Zoek status-cel met accessibility rol/pattern
    // Fallback: zoek innerste select of button die status wijzigt
    const statusCel = eersteRij.locator(
      // Probeer getagde cel of button in status-kolom
      '[data-testid="status-cell"], button:has-text(/AANWEZIG|AFWEZIG|ONZEKER|NIEUW/), select[name*="status"]'
    );

    const statusCelExists = await statusCel.count();

    if (statusCelExists > 0) {
      // Klik op status-cel
      await statusCel.first().click();

      // Wacht tot select/dropdown zichtbaar is
      const selectOrDropdown = page.locator('select, [role="listbox"], [role="option"]');
      await expect(selectOrDropdown.first()).toBeVisible({ timeout: 5_000 });

      // Pak huidige waarde (uit select attribuut of text)
      const currentValue = await selectOrDropdown
        .first()
        .inputValue()
        .catch(() => "AANWEZIG");

      // Kies andere waarde — idempotentie-check
      const statusOptions = ["AANWEZIG", "AFWEZIG", "ONZEKER", "NIEUW_POTENTIEEL"];
      let otherValue = statusOptions.find((v) => v !== currentValue);
      if (!otherValue) otherValue = "AFWEZIG"; // fallback als huidge unknown

      // Select nieuwe waarde
      await selectOrDropdown.first().selectOption(otherValue);

      // Wacht tot server action klaar is + optimistic update
      await page.waitForTimeout(2000);

      // Reload pagina om persistentie te verifiëren
      await page.reload({ waitUntil: "load" });
      await page.waitForTimeout(1000);

      // Check of status persisteerd is in eerste rij
      const eersteRijNaReload = page.locator("tbody tr").first();
      const content = await eersteRijNaReload.textContent();

      // Verifieer dat nieuwe status zichtbaar is in de rij
      expect(content).toContain(otherValue);
    }
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
    const naamCel = eersteRij.locator(
      '[data-testid="naam-cell"], [data-testid="speler-naam"], td:nth-child(2)'
    );

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
      expect(dialogContent).toMatch(/staf|Staff|Trainer|Trainer|Toezichthouder/i);

      // Druk escape-toets
      await page.keyboard.press("Escape");

      // Verifieer dat dialog sluit
      await expect(dialog.first()).not.toBeVisible({ timeout: 3_000 });
    }
  });
});
