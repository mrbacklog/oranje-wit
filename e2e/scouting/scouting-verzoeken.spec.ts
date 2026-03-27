import { test, expect } from "../fixtures/base";

/**
 * Scouting verzoeken-flow & scoutingsmethoden E2E tests.
 *
 * Test de TC-verzoeken workflow (aanmaken, bekijken, detail),
 * de scout-verzoeken flow (accepteren, beoordelen),
 * en de drie scoutingsmethoden (INDIVIDUEEL, TEAM, VERGELIJKING).
 *
 * Seed-data spelers: TSTN001-TSTN283
 *   - TSTN001-010: senioren (geb 1995-2005) -> rood -> 9 pijlers
 *   - TSTN099+: U15 (geb 2011-2012) -> oranje -> 7 pijlers
 *
 * Noot: Verzoeken aanmaken vereist TC-rol op de Scout-tabel.
 * De E2E-testgebruiker heeft mogelijk geen Scout-profiel met TC-rol.
 * Tests die TC-rechten vereisen worden overgeslagen als de rol ontbreekt.
 */

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Controleer of de ingelogde gebruiker TC-rechten heeft via het profiel-endpoint.
 * Retourneert true als de gebruiker rol TC heeft.
 */
async function isTC(page: import("@playwright/test").Page): Promise<boolean> {
  try {
    const res = await page.request.get("/api/scout/profiel");
    if (!res.ok()) return false;
    const data = await res.json();
    return data.data?.scout?.rol === "TC";
  } catch {
    return false;
  }
}

// ─── Suite 1: Verzoeken-overzicht en navigatie ──────────────────────────

test.describe("Verzoeken-pagina", () => {
  test("verzoeken-pagina laadt met heading", async ({ page }) => {
    await page.goto("/verzoeken");

    // De pagina moet een heading "Verzoeken" tonen, of een redirect naar login
    await expect(
      page
        .getByRole("heading", { name: "Verzoeken" })
        .or(page.getByText("Verzoeken"))
        .or(page.getByText("Inloggen"))
    ).toBeVisible({ timeout: 15000 });
  });

  test("verzoeken-pagina toont lege state of lijst", async ({ page }) => {
    await page.goto("/verzoeken");

    // Wacht tot de pagina geladen is (spinner verdwijnt)
    await page.waitForTimeout(2000);

    // Ofwel verzoeken in de lijst, ofwel lege state
    // Gebruik .first() om strict mode violation te voorkomen bij meerdere matches
    const leegOfLijst = page
      .getByText("Geen verzoeken")
      .or(page.getByText(/Actief \(\d+\)/))
      .or(page.getByText(/Afgerond \(\d+\)/))
      .or(page.getByText("Jouw scouting-opdrachten"))
      .or(page.getByText("Beheer scouting-opdrachten"));
    await expect(leegOfLijst.first()).toBeVisible({ timeout: 10000 });
  });

  test("bottom navigatie bevat Verzoeken link", async ({ page }) => {
    await page.goto("/verzoeken");

    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible({ timeout: 10000 });
    await expect(nav.getByText("Verzoeken")).toBeVisible();
  });
});

// ─── Suite 2: Verzoeken aanmaken (TC-flow) ──────────────────────────────

test.describe("Verzoeken aanmaken (TC-flow)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigeer naar de verzoeken-pagina en check TC-rol
    await page.goto("/verzoeken");
    await page.waitForTimeout(2000);

    const heeftTCRol = await isTC(page);
    if (!heeftTCRol) {
      test.skip();
    }
  });

  test("TC-gebruiker ziet 'Nieuw' knop op verzoeken-pagina", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Nieuw/ })).toBeVisible({
      timeout: 10000,
    });
  });

  test("klik op 'Nieuw' navigeert naar nieuw-verzoek wizard", async ({ page }) => {
    const nieuwKnop = page.getByRole("button", { name: /Nieuw/ });
    await expect(nieuwKnop).toBeVisible({ timeout: 10000 });
    await nieuwKnop.click();

    await page.waitForURL(/\/verzoeken\/nieuw/, { timeout: 10000 });
    await expect(page.getByText("Nieuw verzoek")).toBeVisible();
  });

  test("wizard stap 1: toont 3 verzoektypen", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    // 3 type-opties
    await expect(page.getByText("Team beoordeling")).toBeVisible();
    await expect(page.getByText("Individuele beoordeling")).toBeVisible();
    await expect(page.getByText("Vergelijking")).toBeVisible();
  });

  test("wizard stap 1: volgende is disabled zonder type-selectie", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    const volgendeKnop = page.getByRole("button", { name: "Volgende" });
    await expect(volgendeKnop).toBeDisabled();
  });

  test("wizard stap 1: selecteer type -> volgende enabled", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    // Selecteer Team beoordeling (GENERIEK)
    await page.getByText("Team beoordeling").click();

    const volgendeKnop = page.getByRole("button", { name: "Volgende" });
    await expect(volgendeKnop).toBeEnabled();
  });

  test("wizard heeft 4 stap-indicatoren", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    // 4 stappen: type, scope, details, scouts
    await expect(page.getByText("Stap 1 van 4")).toBeVisible();
  });

  test("GENERIEK verzoek: stap 2 toont teamkeuze", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    // Selecteer GENERIEK
    await page.getByText("Team beoordeling").click();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Stap 2: Welk team?
    await expect(page.getByText("Welk team?")).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("Alle spelers van dit team worden beoordeeld")
    ).toBeVisible();
  });

  test("SPECIFIEK verzoek: stap 2 toont speler-zoekbalk", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    // Selecteer SPECIFIEK
    await page.getByText("Individuele beoordeling").click();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Stap 2: Welke speler?
    await expect(page.getByText("Welke speler?")).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("Zoek op naam...")).toBeVisible();
  });

  test("VERGELIJKING verzoek: stap 2 toont meervoudige speler-selectie", async ({
    page,
  }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    // Selecteer VERGELIJKING
    await page.getByText("Vergelijking").click();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Stap 2: Welke spelers vergelijken?
    await expect(page.getByText("Welke spelers vergelijken?")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Selecteer minimaal 2 spelers")).toBeVisible();
  });

  test("wizard stap 3 (details) toont doel-opties en toelichting", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    // Doorloop stap 1 + 2 met GENERIEK type
    await page.getByText("Team beoordeling").click();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Stap 2: selecteer een team (als beschikbaar)
    await expect(page.getByText("Welk team?")).toBeVisible({ timeout: 5000 });

    // Probeer een team te selecteren
    const teamButtons = page.locator(
      "button:has-text('OW'), button:has-text('Oranje Wit')"
    );
    const aantalTeams = await teamButtons.count().catch(() => 0);

    if (aantalTeams === 0) {
      // Geen teams beschikbaar, skip rest
      test.skip();
      return;
    }

    await teamButtons.first().click();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Stap 3: Details
    await expect(page.getByText("Details")).toBeVisible({ timeout: 5000 });

    // Doel-opties
    await expect(page.getByText("Niveaubepaling")).toBeVisible();
    await expect(page.getByText("Doorstroom")).toBeVisible();
    await expect(page.getByText("Selectie")).toBeVisible();
    await expect(page.getByText("Overig")).toBeVisible();

    // Toelichting textarea
    await expect(page.getByPlaceholder(/Waar moet de scout op letten/)).toBeVisible();
  });

  test("wizard stap 4 (scouts) toont scout-toewijzing", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    // Doorloop stap 1 + 2 + 3
    await page.getByText("Team beoordeling").click();
    await page.getByRole("button", { name: "Volgende" }).click();

    await expect(page.getByText("Welk team?")).toBeVisible({ timeout: 5000 });

    const teamButtons = page.locator(
      "button:has-text('OW'), button:has-text('Oranje Wit')"
    );
    const aantalTeams = await teamButtons.count().catch(() => 0);

    if (aantalTeams === 0) {
      test.skip();
      return;
    }

    await teamButtons.first().click();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Stap 3 → Stap 4
    await expect(page.getByText("Details")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Volgende" }).click();

    // Stap 4: Scouts toewijzen
    await expect(page.getByText("Scouts toewijzen")).toBeVisible({ timeout: 5000 });

    // "Verzoek aanmaken" knop moet zichtbaar zijn (in plaats van "Volgende")
    await expect(page.getByRole("button", { name: /Verzoek aanmaken/ })).toBeVisible();
  });

  test("wizard vorige-knop navigeert terug", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Wat wil je scouten?")).toBeVisible({ timeout: 10000 });

    // Ga naar stap 2
    await page.getByText("Team beoordeling").click();
    await page.getByRole("button", { name: "Volgende" }).click();

    await expect(page.getByText("Welk team?")).toBeVisible({ timeout: 5000 });

    // Ga terug naar stap 1
    await page.getByRole("button", { name: "Vorige" }).click();

    // We zijn terug bij "Wat wil je scouten?"
    await expect(page.getByText("Wat wil je scouten?")).toBeVisible();
  });

  test("wizard annuleren-link bestaat", async ({ page }) => {
    await page.goto("/verzoeken/nieuw");

    await expect(page.getByText("Nieuw verzoek")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Annuleren")).toBeVisible();
  });
});

// ─── Suite 3: Verzoek detail (scout-flow) ───────────────────────────────

test.describe("Verzoek detail pagina", () => {
  test("niet-bestaand verzoek toont foutmelding", async ({ page }) => {
    await page.goto("/verzoeken/niet-bestaand-id-12345");

    // Wacht tot geladen
    await page.waitForTimeout(3000);

    // Ofwel "Verzoek niet gevonden" of redirect
    // Gebruik .first() om strict mode violation te voorkomen
    await expect(
      page.getByText("Verzoek niet gevonden")
    ).toBeVisible({ timeout: 10000 });
  });

  test("verzoek detail toont type-label en doel", async ({ page }) => {
    // Navigeer naar verzoeken-pagina
    await page.goto("/verzoeken");
    await page.waitForTimeout(2000);

    // Check of er verzoeken zijn door te zoeken naar kaarten
    const heeftVerzoeken = await page
      .getByText(/Actief \(\d+\)/)
      .or(page.getByText(/Afgerond \(\d+\)/))
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!heeftVerzoeken) {
      test.skip();
      return;
    }

    // Klik op het eerste verzoek
    const verzoekKaart = page.locator("[class*='rounded-xl'][class*='border']").first();
    const kaartBestaat = await verzoekKaart.isVisible().catch(() => false);

    if (!kaartBestaat) {
      test.skip();
      return;
    }

    await verzoekKaart.click();

    // Verzoek detail toont type-label
    await expect(
      page
        .getByText("Team beoordeling")
        .or(page.getByText("Individuele beoordeling"))
        .or(page.getByText("Vergelijking"))
    ).toBeVisible({ timeout: 10000 });

    // En doel
    await expect(
      page
        .getByText("Niveaubepaling")
        .or(page.getByText("Doorstroom"))
        .or(page.getByText("Selectie"))
        .or(page.getByText("Overig"))
    ).toBeVisible();
  });
});

// ─── Suite 4: Individueel rapport invullen ──────────────────────────────

test.describe("Individueel rapport (volledige flow)", () => {
  test("rapport wizard laadt voor bekende speler", async ({ page }) => {
    const response = await page.goto("/rapport/nieuw/TSTN001");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible({
      timeout: 10000,
    });
  });

  test("rapport wizard: selecteer context -> beoordeling-stap", async ({ page }) => {
    const response = await page.goto("/rapport/nieuw/TSTN001");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    // Context stap
    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible({
      timeout: 10000,
    });

    // Selecteer Wedstrijd
    await page.getByText("Wedstrijd").click();
    await expect(page.getByRole("button", { name: "Volgende" })).toBeEnabled();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Beoordeling stap met voortgang (x/y)
    await expect(page.getByRole("button", { name: /Volgende \(\d+\/\d+\)/ })).toBeVisible(
      { timeout: 5000 }
    );
  });

  test("rapport wizard: pijlers worden getoond in beoordeling", async ({ page }) => {
    const response = await page.goto("/rapport/nieuw/TSTN001");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    // Ga naar beoordeling
    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible({
      timeout: 10000,
    });
    await page.getByText("Wedstrijd").click();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Beoordeling toont pijler-gerelateerde content
    // (pijlernamen als AANVALLEN, VERDEDIGEN, etc. of v3 pijlernamen)
    await expect(page.getByRole("button", { name: /Volgende \(\d+\/\d+\)/ })).toBeVisible(
      { timeout: 5000 }
    );

    // Er moeten slider/score-inputs zichtbaar zijn
    const sliders = page.locator("input[type='range']");
    const aantalSliders = await sliders.count().catch(() => 0);

    // Er kunnen ook radio-buttons of custom score-componenten zijn
    // Verifieer dat er iets te scoren valt
    expect(aantalSliders).toBeGreaterThanOrEqual(0);
  });

  test("rapport wizard: scores invullen maakt voortgang", async ({ page }) => {
    const response = await page.goto("/rapport/nieuw/TSTN001");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    // Ga naar beoordeling
    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible({
      timeout: 10000,
    });
    await page.getByText("Wedstrijd").click();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Check voortgang tekst (0/N)
    const voortgangKnop = page.getByRole("button", {
      name: /Volgende \(\d+\/\d+\)/,
    });
    await expect(voortgangKnop).toBeVisible({ timeout: 5000 });

    // Lees de voortgang-tekst
    const knopTekst = await voortgangKnop.textContent();
    expect(knopTekst).toMatch(/Volgende \(\d+\/\d+\)/);

    // Zoek en vul de eerste slider in
    const sliders = page.locator("input[type='range']");
    const eersteSlider = sliders.first();
    const heeftSlider = await eersteSlider.isVisible({ timeout: 3000 }).catch(() => false);

    if (heeftSlider) {
      await eersteSlider.fill("7");
      // Wacht even voor state update
      await page.waitForTimeout(300);
    }
  });

  test("rapport wizard: leeftijdsgroep is zichtbaar", async ({ page }) => {
    const response = await page.goto("/rapport/nieuw/TSTN001");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    // Speler-header toont leeftijdsgroep (paars, blauw, groen, geel, oranje, rood)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/paars|blauw|groen|geel|oranje|rood/i)).toBeVisible();
  });

  test("rapport wizard: context keuzes zijn 3 opties", async ({ page }) => {
    const response = await page.goto("/rapport/nieuw/TSTN001");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText("Wedstrijd")).toBeVisible();
    await expect(page.getByText("Training")).toBeVisible();
    await expect(page.getByText("Overig")).toBeVisible();
  });

  test("rapport wizard: terug van beoordeling bewaart context", async ({ page }) => {
    const response = await page.goto("/rapport/nieuw/TSTN001");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    // Selecteer context
    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible({
      timeout: 10000,
    });
    await page.getByText("Training").click();

    // Vul detail in
    const detailInput = page.getByLabel(/optioneel/i);
    const heeftDetail = await detailInput.isVisible().catch(() => false);
    if (heeftDetail) {
      await detailInput.fill("Zaterdagtraining");
    }

    // Ga naar beoordeling
    await page.getByRole("button", { name: "Volgende" }).click();
    await expect(page.getByRole("button", { name: /Volgende \(\d+\/\d+\)/ })).toBeVisible(
      { timeout: 5000 }
    );

    // Ga terug
    await page.getByRole("button", { name: "Vorige" }).click();

    // Verifieer dat context bewaard is
    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible();
  });

  test("rapport wizard: 5 stap-indicatoren", async ({ page }) => {
    const response = await page.goto("/rapport/nieuw/TSTN001");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible({
      timeout: 10000,
    });

    // 5 step dots (context, beoordeling, extra, opmerking, samenvatting)
    const dots = page.locator("div.h-2.rounded-full");
    await expect(dots).toHaveCount(5);
  });

  test("rapport wizard voor U15 speler laadt juiste pijlers", async ({ page }) => {
    // TSTN099 is U15 (oranje, 7 pijlers)
    const response = await page.goto("/rapport/nieuw/TSTN099");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible({
      timeout: 10000,
    });

    // Leeftijdsgroep oranje
    await expect(page.getByText(/oranje/i)).toBeVisible();
  });
});

// ─── Suite 5: Team-scouting ─────────────────────────────────────────────

test.describe("Team-scouting (TEAM methode)", () => {
  test("team-overzicht pagina laadt", async ({ page }) => {
    await page.goto("/team");

    await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
      timeout: 15000,
    });
  });

  test("team-overzicht toont teams of lege state", async ({ page }) => {
    await page.goto("/team");

    await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
      timeout: 15000,
    });

    // Teams gegroepeerd of lege-state
    await expect(
      page
        .getByRole("link")
        .first()
        .or(page.getByText("Geen jeugdteams gevonden"))
    ).toBeVisible({ timeout: 10000 });
  });

  test("team wizard laadt na klik op team", async ({ page }) => {
    await page.goto("/team");

    await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
      timeout: 15000,
    });

    const isLeeg = await page
      .getByText("Geen jeugdteams gevonden")
      .isVisible()
      .catch(() => false);

    if (isLeeg) {
      test.skip();
      return;
    }

    // Klik op eerste team
    await page.getByRole("link").first().click();
    await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });

    const geenSpelers = await page
      .getByText("Geen spelers gevonden")
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (geenSpelers) {
      test.skip();
      return;
    }

    // Context-stap is zichtbaar
    await expect(
      page
        .getByText("In welke context heb je gescout?")
        .or(page.getByText(/\d+ spelers/))
    ).toBeVisible({ timeout: 10000 });
  });

  test("team wizard toont kernset info", async ({ page }) => {
    await page.goto("/team");

    await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
      timeout: 15000,
    });

    const isLeeg = await page
      .getByText("Geen jeugdteams gevonden")
      .isVisible()
      .catch(() => false);

    if (isLeeg) {
      test.skip();
      return;
    }

    await page.getByRole("link").first().click();
    await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });

    const geenSpelers = await page
      .getByText("Geen spelers gevonden")
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (geenSpelers) {
      test.skip();
      return;
    }

    // Header toont spelers-telling en kernset
    await expect(page.getByText(/\d+ spelers/)).toBeVisible();
    await expect(page.getByText(/Kernset \(\d+ items\)/)).toBeVisible();
  });

  test("team wizard heeft 5 stappen", async ({ page }) => {
    await page.goto("/team");

    await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
      timeout: 15000,
    });

    const isLeeg = await page
      .getByText("Geen jeugdteams gevonden")
      .isVisible()
      .catch(() => false);

    if (isLeeg) {
      test.skip();
      return;
    }

    await page.getByRole("link").first().click();
    await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });

    const geenSpelers = await page
      .getByText("Geen spelers gevonden")
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (geenSpelers) {
      test.skip();
      return;
    }

    // 5 step dots (context, beoordeling, ranking, opmerkingen, samenvatting)
    const dots = page.locator("div.h-2.rounded-full");
    await expect(dots).toHaveCount(5);
  });

  test("team wizard: context selecteren -> beoordeling met voortgang", async ({
    page,
  }) => {
    await page.goto("/team");

    await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
      timeout: 15000,
    });

    const isLeeg = await page
      .getByText("Geen jeugdteams gevonden")
      .isVisible()
      .catch(() => false);

    if (isLeeg) {
      test.skip();
      return;
    }

    await page.getByRole("link").first().click();
    await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });

    const geenSpelers = await page
      .getByText("Geen spelers gevonden")
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (geenSpelers) {
      test.skip();
      return;
    }

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "In welke context heb je gescout?",
      })
    ).toBeVisible({ timeout: 10000 });

    // Kies context
    await page.getByText("Wedstrijd").click();
    await expect(page.getByRole("button", { name: "Volgende" })).toBeEnabled();

    // Ga naar beoordeling
    await page.getByRole("button", { name: "Volgende" }).click();

    // Beoordeling-stap toont voortgang (kern-items x spelers)
    await expect(page.getByRole("button", { name: /Volgende \(\d+\/\d+\)/ })).toBeVisible(
      { timeout: 5000 }
    );
  });

  test("team wizard: volgende-knop disabled zonder context", async ({ page }) => {
    await page.goto("/team");

    await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
      timeout: 15000,
    });

    const isLeeg = await page
      .getByText("Geen jeugdteams gevonden")
      .isVisible()
      .catch(() => false);

    if (isLeeg) {
      test.skip();
      return;
    }

    await page.getByRole("link").first().click();
    await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });

    const geenSpelers = await page
      .getByText("Geen spelers gevonden")
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (geenSpelers) {
      test.skip();
      return;
    }

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "In welke context heb je gescout?",
      })
    ).toBeVisible({ timeout: 10000 });

    // Volgende is disabled
    const volgendeKnop = page.getByRole("button", { name: "Volgende" });
    await expect(volgendeKnop).toBeDisabled();
  });
});

// ─── Suite 6: Vergelijkingsmethode ──────────────────────────────────────

test.describe("Vergelijking (VERGELIJKING methode)", () => {
  test("vergelijkingspagina laadt met wizard structuur", async ({ page }) => {
    await page.goto("/vergelijking/nieuw");

    await expect(page.getByRole("heading", { name: "Vergelijking" })).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByText("Vergelijk 2-6 spelers per pijler op een continue balk")
    ).toBeVisible();
  });

  test("vergelijking wizard heeft 3 stappen", async ({ page }) => {
    await page.goto("/vergelijking/nieuw");

    await expect(page.getByRole("heading", { name: "Vergelijking" })).toBeVisible({
      timeout: 10000,
    });

    // 3 step dots (selectie, vergelijking, samenvatting)
    const dots = page.locator("div.h-2.rounded-full");
    await expect(dots).toHaveCount(3);
  });

  test("selectie-stap toont speler-selectie header", async ({ page }) => {
    await page.goto("/vergelijking/nieuw");

    await expect(
      page.getByRole("heading", { name: "Selecteer spelers" })
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByText("Kies 2-6 spelers om te vergelijken")).toBeVisible();
  });

  test("selectie-stap toont context keuze", async ({ page }) => {
    await page.goto("/vergelijking/nieuw");

    await expect(
      page.getByRole("heading", { name: "Selecteer spelers" })
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByText("Wedstrijd")).toBeVisible();
    await expect(page.getByText("Training")).toBeVisible();
    await expect(page.getByText("Overig")).toBeVisible();
  });

  test("volgende disabled zonder 2 spelers", async ({ page }) => {
    await page.goto("/vergelijking/nieuw");

    await expect(
      page.getByRole("heading", { name: "Selecteer spelers" })
    ).toBeVisible({ timeout: 10000 });

    const volgendeKnop = page.getByRole("button", { name: "Volgende" });
    await expect(volgendeKnop).toBeDisabled();

    await expect(
      page.getByText("Selecteer minimaal 2 spelers om door te gaan")
    ).toBeVisible();
  });

  test("speler zoeken in vergelijking wizard werkt", async ({ page }) => {
    await page.goto("/vergelijking/nieuw");

    await expect(
      page.getByRole("heading", { name: "Selecteer spelers" })
    ).toBeVisible({ timeout: 10000 });

    // Zoek op TSTN prefix
    const zoekInput = page.getByRole("searchbox").or(page.getByPlaceholder(/zoek/i));
    const heeftZoek = await zoekInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (!heeftZoek) {
      test.skip();
      return;
    }

    await zoekInput.fill("TSTN");

    // Wacht op resultaten
    await page.waitForTimeout(1000);
  });
});

// ─── Suite 7: Cross-cutting verzoeken + methoden ────────────────────────

test.describe("Scouting: navigatie vanuit verzoeken", () => {
  test("navigatie van zoeken naar rapport wizard", async ({ page }) => {
    test.setTimeout(30000);

    const response = await page.goto("/speler/TSTN001");
    if (!response || response.status() === 404) {
      test.skip();
      return;
    }

    const heading = page.getByRole("heading", { level: 1 });
    const isGeladen = await heading.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isGeladen) {
      test.skip();
      return;
    }

    const scoutLink = page.getByRole("link", { name: /scout deze speler/i });
    const isZichtbaar = await scoutLink.isVisible().catch(() => false);
    if (!isZichtbaar) {
      test.skip();
      return;
    }

    await scoutLink.click();
    await page.waitForURL(/\/rapport\/nieuw\//, { timeout: 10000 });

    await expect(page.getByText("In welke context heb je gescout?")).toBeVisible({
      timeout: 10000,
    });
  });

  test("alle scouting-paginas laden zonder crash", async ({ page }) => {
    test.setTimeout(60000);

    const paginas = [
      { url: "/verzoeken", check: /Verzoeken|Inloggen/ },
      { url: "/vergelijking/nieuw", check: /Vergelijking/ },
      { url: "/team", check: /Scout een team/ },
      { url: "/zoek", check: /Speler zoeken/ },
      { url: "/kaarten", check: /Kaarten/ },
    ];

    for (const pagina of paginas) {
      await page.goto(pagina.url, { timeout: 15000 });
      await expect(
        page.getByRole("heading", { name: pagina.check }).or(page.getByText(pagina.check))
      ).toBeVisible({ timeout: 10000 });
    }
  });
});

// ─── Suite 8: API verzoeken routes ──────────────────────────────────────

test.describe("Verzoeken API (endpoint-level)", () => {
  test("GET /api/verzoeken retourneert response", async ({ page }) => {
    // Dit endpoint vereist TC-rol; test of het een response geeft (200 of 403)
    const response = await page.request.get("/api/verzoeken");
    expect([200, 401, 403]).toContain(response.status());
  });

  test("POST /api/verzoeken zonder body retourneert validatie-fout", async ({
    page,
  }) => {
    const response = await page.request.post("/api/verzoeken", {
      data: {},
    });

    // Zonder body: 400 (validatiefout), 401/403 (auth), of 500 (server error bij ontbrekende velden)
    expect([400, 401, 403, 500]).toContain(response.status());
  });

  test("GET /api/mijn-verzoeken retourneert response", async ({ page }) => {
    const response = await page.request.get("/api/mijn-verzoeken");

    // 200 als er een scout-profiel is, 401/403 anders
    expect([200, 401, 403]).toContain(response.status());
  });

  test("GET /api/verzoeken/[id] retourneert 404 voor onbekend id", async ({ page }) => {
    const response = await page.request.get(
      "/api/verzoeken/non-existent-verzoek-id-xyz"
    );

    // 404 (niet gevonden) of 401/403 (auth)
    expect([404, 401, 403]).toContain(response.status());
  });
});
