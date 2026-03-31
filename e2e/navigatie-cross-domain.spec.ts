import { test, expect } from "./fixtures/base";

/**
 * Cross-domain navigatie tests.
 *
 * Verifieert dat de shell (BottomNav + AppSwitcher) correct werkt
 * over alle 7 domeinen, inclusief cross-domain navigatie,
 * pills sub-navigatie, en skip routes.
 */

// ─── Domein-definities (afgeleid uit manifest) ─────────────────

interface DomeinDef {
  naam: string;
  baseUrl: string;
  bottomNavLabels: [string, string, string, string];
}

const DOMEINEN: DomeinDef[] = [
  {
    naam: "Mijn OW",
    baseUrl: "/",
    bottomNavLabels: ["Overzicht", "Taken", "Nieuws", "Profiel"],
  },
  {
    naam: "Monitor",
    baseUrl: "/monitor",
    bottomNavLabels: ["Overzicht", "Teams", "Analyse", "Signalen"],
  },
  {
    naam: "Team-Indeling (desktop)",
    baseUrl: "/ti-studio",
    bottomNavLabels: ["Overzicht", "Blauwdruk", "Werkbord", "Indeling"],
  },
  {
    naam: "Team-Indeling (mobile)",
    baseUrl: "/teamindeling",
    bottomNavLabels: ["Overzicht", "Blauwdruk", "Indeling", "Teams"],
  },
  {
    naam: "Evaluatie",
    baseUrl: "/evaluatie",
    bottomNavLabels: ["Overzicht", "Rondes", "Teams", "Resultaten"],
  },
  {
    naam: "Scouting",
    baseUrl: "/scouting",
    bottomNavLabels: ["Overzicht", "Opdrachten", "Zoeken", "Profiel"],
  },
  {
    naam: "Beheer",
    baseUrl: "/beheer",
    bottomNavLabels: ["Planning", "Inrichting", "Data", "Gebruikers"],
  },
  {
    naam: "Beleid",
    baseUrl: "/beleid",
    bottomNavLabels: ["Verhaal", "Doelgroepen", "Bronnen", "Delen"],
  },
];

// ─── 1. Shell-integriteit per domein ───────────────────────────

test.describe("Shell-integriteit per domein", () => {
  for (const domein of DOMEINEN) {
    test(`${domein.naam}: BottomNav bevat 4 labels + Apps knop`, async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(domein.baseUrl, { timeout: 45000 });

      // BottomNav is de eerste <nav> — scope daar naartoe
      const nav = page.getByRole("navigation").first();
      await expect(nav).toBeVisible({ timeout: 15000 });

      // Verifieer alle 4 navigatie-labels
      for (const label of domein.bottomNavLabels) {
        await expect(nav.getByText(label, { exact: true })).toBeVisible({ timeout: 15000 });
      }

      // 5e positie: Apps knop
      await expect(nav.getByText("Apps", { exact: true })).toBeVisible({ timeout: 15000 });
    });
  }
});

// ─── 2. Cross-domain navigatie via AppSwitcher ─────────────────

test.describe("Cross-domain navigatie via AppSwitcher", () => {
  const routes = [
    { van: "Monitor", vanUrl: "/monitor", naar: "Scout", naarUrl: "/scouting" },
    { van: "Scouting", vanUrl: "/scouting", naar: "Beheer", naarUrl: "/beheer" },
    { van: "Beheer", vanUrl: "/beheer", naar: "Beleid", naarUrl: "/beleid" },
    { van: "Beleid", vanUrl: "/beleid", naar: "Monitor", naarUrl: "/monitor" },
  ];

  for (const route of routes) {
    test(`${route.van} -> ${route.naar} via AppSwitcher`, async ({ page }) => {
      test.setTimeout(90000);

      // Navigeer naar het brondomein
      await page.goto(route.vanUrl, { timeout: 45000 });

      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible({ timeout: 15000 });

      // Open AppSwitcher via de "Apps" knop in de BottomNav
      await nav.getByText("Apps", { exact: true }).click();

      // Wacht tot de AppSwitcher dialog verschijnt
      const switcher = page.getByRole("dialog", { name: "App switcher" });
      await expect(switcher).toBeVisible({ timeout: 10000 });

      // Klik op het doeldomein — de naam in AppSwitcher komt uit APP_META
      await switcher.getByText(route.naar, { exact: true }).click();

      // Wacht tot we op de juiste URL zijn
      await page.waitForURL(`**${route.naarUrl}**`, { timeout: 45000 });

      // Verifieer dat de URL klopt
      expect(page.url()).toContain(route.naarUrl);
    });
  }
});

// ─── 3. BottomNav navigatie binnen domein ──────────────────────

test.describe("BottomNav navigatie binnen domein", () => {
  // Monitor: 4 nav items met hun hrefs
  test.describe("Monitor", () => {
    const items = [
      { label: "Overzicht", href: "/monitor" },
      { label: "Teams", href: "/monitor/teams" },
      { label: "Analyse", href: "/monitor/retentie" },
      { label: "Signalen", href: "/monitor/signalering" },
    ];

    for (const item of items) {
      test(`klik op "${item.label}" navigeert naar ${item.href}`, async ({ page }) => {
        test.setTimeout(90000);

        // Start op een andere pagina dan het doel (tenzij Overzicht)
        const startUrl = item.href === "/monitor" ? "/monitor/teams" : "/monitor";
        await page.goto(startUrl, { timeout: 45000 });

        const nav = page.getByRole("navigation");
        await expect(nav).toBeVisible({ timeout: 15000 });

        // Klik op het nav-item
        await nav.getByText(item.label, { exact: true }).click();

        // Verifieer URL
        await page.waitForURL(`**${item.href}**`, { timeout: 45000 });
        expect(page.url()).toContain(item.href);
      });
    }
  });

  // Scouting: 4 nav items
  test.describe("Scouting", () => {
    const items = [
      { label: "Overzicht", href: "/scouting" },
      { label: "Opdrachten", href: "/scouting/verzoeken" },
      { label: "Zoeken", href: "/scouting/zoek" },
      { label: "Profiel", href: "/scouting/profiel" },
    ];

    for (const item of items) {
      test(`klik op "${item.label}" navigeert naar ${item.href}`, async ({ page }) => {
        test.setTimeout(90000);

        const startUrl = item.href === "/scouting" ? "/scouting/zoek" : "/scouting";
        await page.goto(startUrl, { timeout: 45000 });

        const nav = page.getByRole("navigation");
        await expect(nav).toBeVisible({ timeout: 15000 });

        await nav.getByText(item.label, { exact: true }).click();

        await page.waitForURL(`**${item.href}**`, { timeout: 45000 });
        expect(page.url()).toContain(item.href);
      });
    }
  });

  // Beheer: 4 nav items
  test.describe("Beheer", () => {
    const items = [
      { label: "Planning", href: "/beheer/jaarplanning/kalender" },
      { label: "Inrichting", href: "/beheer/jeugd/raamwerk" },
      { label: "Data", href: "/beheer/teams" },
      { label: "Gebruikers", href: "/beheer/systeem/gebruikers" },
    ];

    for (const item of items) {
      test(`klik op "${item.label}" navigeert naar ${item.href}`, async ({ page }) => {
        test.setTimeout(90000);

        const startUrl =
          item.href === "/beheer/jaarplanning/kalender"
            ? "/beheer/systeem/gebruikers"
            : "/beheer/jaarplanning/kalender";
        await page.goto(startUrl, { timeout: 45000 });

        const nav = page.getByRole("navigation");
        await expect(nav).toBeVisible({ timeout: 15000 });

        await nav.getByText(item.label, { exact: true }).click();

        await page.waitForURL(`**${item.href}**`, { timeout: 45000 });
        expect(page.url()).toContain(item.href);
      });
    }
  });
});

// ─── 4. Pills sub-navigatie ────────────────────────────────────
// Pills-component bestaat maar wordt nog niet gerenderd op pagina's.
// Deze test wordt geactiveerd zodra pills geïmplementeerd zijn.

test.describe("Pills sub-navigatie", () => {
  test.skip(true, "Pills worden nog niet gerenderd op pagina's");

  test("Monitor/Analyse pills zijn zichtbaar en navigeren correct", async ({ page }) => {
    test.setTimeout(120000);

    await page.goto("/monitor/retentie", { timeout: 45000 });

    // Pills staan in een <nav aria-label="Sub-navigatie">
    const pillNav = page.getByRole("navigation", { name: "Sub-navigatie" });
    await expect(pillNav).toBeVisible({ timeout: 15000 });

    const pills = [
      { label: "Retentie", href: "/monitor/retentie" },
      { label: "Samenstelling", href: "/monitor/samenstelling" },
      { label: "Projecties", href: "/monitor/projecties" },
    ];

    for (const pill of pills) {
      await expect(pillNav.getByRole("link", { name: pill.label })).toBeVisible({ timeout: 15000 });
    }

    for (const pill of pills) {
      await pillNav.getByRole("link", { name: pill.label }).click();
      await page.waitForURL(`**${pill.href}**`, { timeout: 45000 });
      expect(page.url()).toContain(pill.href);
    }
  });
});

// ─── 5. Skip routes: geen shell ────────────────────────────────

test.describe("Skip routes: geen shell", () => {
  const skipRoutes = [
    { url: "/evaluatie/invullen", naam: "evaluatie invullen" },
    { url: "/evaluatie/invullen/bedankt", naam: "evaluatie invullen bedankt" },
  ];

  for (const route of skipRoutes) {
    test(`${route.naam}: geen BottomNav zichtbaar`, async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(route.url, { timeout: 45000 });

      // Wacht tot de pagina geladen is
      await page.waitForLoadState("domcontentloaded");

      // Geef de pagina even tijd om te renderen
      await page.waitForTimeout(2000);

      // Er mag geen <nav> element zijn (BottomNav)
      const navCount = await page.getByRole("navigation").count();
      expect(navCount).toBe(0);

      // Er mag ook geen floating AppSwitcher FAB zijn
      const fabCount = await page.getByLabel("Open app switcher").count();
      expect(fabCount).toBe(0);
    });
  }
});
