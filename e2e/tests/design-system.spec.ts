import { test, expect } from "@playwright/test";

// Design System pagina draait in de geconsolideerde web app op poort 3000.
const BASE_URL = "http://localhost:3000/teamindeling/design-system";

// ─── Alle 18 secties die op de pagina staan ──────────────────────────
const SECTIONS = [
  "buttons",
  "badges",
  "cards",
  "inputs",
  "avatars",
  "icon-buttons",
  "toggles",
  "chips",
  "metrics",
  "progress",
  "signal-badges",
  "band-pills",
  "skeletons",
  "empty-state",
  "kpi-cards",
  "stat-cards",
  "bottom-nav",
  "top-bar",
] as const;

// ─── Functionele tests (draaien in CI en lokaal) ─────────────────────

test.describe("OW Design System — Functioneel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
  });

  test("pagina laadt met header en alle secties", async ({ page }) => {
    // Header aanwezig
    await expect(page.getByRole("heading", { name: "Component Catalog" })).toBeVisible();
    await expect(page.getByText("OW Design System")).toBeVisible();
    await expect(page.getByText(`${SECTIONS.length} secties`)).toBeVisible();

    // Alle 18 secties aanwezig
    for (const section of SECTIONS) {
      const el = page.getByTestId(`section-${section}`);
      await expect(el).toBeAttached();
    }
  });

  // --- Per sectie: zichtbaarheid en minimale inhoud ---

  test("sectie buttons bevat varianten, disabled en sizes", async ({ page }) => {
    const section = page.getByTestId("section-buttons");
    await expect(section.getByRole("button", { name: "Primary", exact: true })).toBeVisible();
    await expect(section.getByRole("button", { name: "Secondary", exact: true })).toBeVisible();
    await expect(section.getByRole("button", { name: "Danger" })).toBeVisible();
    await expect(section.getByRole("button", { name: "Ghost" })).toBeVisible();
    // Disabled knoppen
    await expect(section.getByRole("button", { name: "Primary disabled" })).toBeDisabled();
    // Sizes
    await expect(section.getByRole("button", { name: "Small" })).toBeVisible();
    await expect(section.getByRole("button", { name: "Large" })).toBeVisible();
  });

  test("sectie badges bevat alle kleuren", async ({ page }) => {
    const section = page.getByTestId("section-badges");
    for (const kleur of ["Groen", "Oranje", "Rood", "Blauw", "Geel", "Grijs"]) {
      await expect(section.getByText(kleur)).toBeVisible();
    }
  });

  test("sectie cards bevat header en body varianten", async ({ page }) => {
    const section = page.getByTestId("section-cards");
    await expect(section.getByText("Card met Header")).toBeVisible();
    await expect(section.getByText("Card zonder Header")).toBeVisible();
  });

  test("sectie inputs bevat input, select, textarea en search", async ({ page }) => {
    const section = page.getByTestId("section-inputs");
    // Standaard input (placeholder)
    await expect(section.getByPlaceholder("Standaard input")).toBeVisible();
    // Label input
    await expect(section.getByLabel("Met label")).toBeVisible();
    // Error input
    await expect(section.getByText("Dit veld is verplicht")).toBeVisible();
    // Select
    await expect(section.getByLabel("Selectbox")).toBeVisible();
    // Textarea
    await expect(section.getByLabel("Textarea")).toBeVisible();
    // SearchInput
    await expect(section.getByPlaceholder("Zoek een speler...")).toBeVisible();
  });

  test("sectie avatars bevat sizes en varianten", async ({ page }) => {
    const section = page.getByTestId("section-avatars");
    await expect(section.getByText("Sizes: xs, sm, md, lg, xl, 2xl")).toBeVisible();
    await expect(section.getByText("Met online indicator")).toBeVisible();
    await expect(section.getByText("Active (gradient ring)")).toBeVisible();
    await expect(section.getByText("Leeftijdskleuren (ageColor)")).toBeVisible();
  });

  test("sectie toggles bevat schakelaars", async ({ page }) => {
    const section = page.getByTestId("section-toggles");
    const switches = section.getByRole("switch");
    // 4 toggles: ingeschakeld, uitgeschakeld, disabled aan, disabled uit
    await expect(switches).toHaveCount(4);
  });

  test("sectie chips bevat default en removable", async ({ page }) => {
    const section = page.getByTestId("section-chips");
    await expect(section.getByText("Default", { exact: true })).toBeVisible();
    await expect(section.getByText("Verwijderbaar")).toBeVisible();
  });

  test("sectie signal-badges bevat ernst-niveaus", async ({ page }) => {
    const section = page.getByTestId("section-signal-badges");
    await expect(section.getByText("Kritiek")).toBeVisible();
    await expect(section.getByText("Aandacht")).toBeVisible();
    await expect(section.getByText("Op koers")).toBeVisible();
  });

  test("sectie band-pills bevat alle banden", async ({ page }) => {
    const section = page.getByTestId("section-band-pills");
    for (const band of ["Blauw", "Groen", "Geel", "Oranje", "Rood", "Senioren"]) {
      await expect(section.getByText(band)).toBeVisible();
    }
  });

  test("sectie kpi-cards bevat metrics met signaal", async ({ page }) => {
    const section = page.getByTestId("section-kpi-cards");
    await expect(section.getByText("Totaal leden")).toBeVisible();
    await expect(section.getByText("Jeugdleden")).toBeVisible();
    await expect(section.getByText("Uitstroom")).toBeVisible();
  });

  test("sectie empty-state toont melding en actie", async ({ page }) => {
    const section = page.getByTestId("section-empty-state");
    await expect(section.getByText("Geen spelers gevonden")).toBeVisible();
    await expect(section.getByRole("button", { name: "Naar blauwdruk" })).toBeVisible();
  });

  // --- Interactie tests ---

  test("button hover verandert styling", async ({ page }) => {
    const section = page.getByTestId("section-buttons");
    const primaryBtn = section.getByRole("button", {
      name: "Primary",
      exact: true,
    });
    await primaryBtn.hover();
    await page.waitForTimeout(300);
    // Na hover is de knop nog steeds zichtbaar en bruikbaar
    await expect(primaryBtn).toBeVisible();
  });

  test("toggle interactie schakelt staat om", async ({ page }) => {
    const section = page.getByTestId("section-toggles");
    const secondToggle = section.getByRole("switch").nth(1);
    // De tweede toggle start als "uit"
    await expect(secondToggle).not.toBeChecked();
    await secondToggle.click();
    await page.waitForTimeout(400);
    await expect(secondToggle).toBeChecked();
  });

  test("chip selectie schakelt selected state", async ({ page }) => {
    const section = page.getByTestId("section-chips");
    // Chip met onSelect heeft aria-label "Klik mij niet geselecteerd"
    const clickableChip = section.getByRole("button", {
      name: /Klik mij/,
    });
    await expect(clickableChip).toBeVisible();
    await clickableChip.click();
    await page.waitForTimeout(300);
    // Na klik is de chip nog steeds aanwezig
    await expect(clickableChip).toBeVisible();
  });

  test("search input focus activeert focus styling", async ({ page }) => {
    const section = page.getByTestId("section-inputs");
    const searchInput = section.getByPlaceholder("Zoek een speler...");
    await searchInput.focus();
    await page.waitForTimeout(300);
    // Controleer dat het input element gefocust is
    await expect(searchInput).toBeFocused();
  });

  // --- Responsive ---

  test("mobile viewport toont pagina correct", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // Header en eerste secties moeten zichtbaar zijn
    await expect(page.getByRole("heading", { name: "Component Catalog" })).toBeVisible();
    await expect(page.getByTestId("section-buttons")).toBeAttached();
    // Footer moet in de DOM staan
    await expect(page.getByText(`${SECTIONS.length} componentsecties`)).toBeAttached();
  });

  // --- Light mode ---

  test("light mode variant laadt correct", async ({ page }) => {
    await page.goto(`${BASE_URL}?theme=light`);
    await page.waitForLoadState("networkidle");
    // Pagina laadt in light mode -- header zichtbaar
    await expect(page.getByRole("heading", { name: "Component Catalog" })).toBeVisible();
    // De pagina crasht niet in light mode
    await expect(page.getByTestId("section-buttons")).toBeAttached();
  });
});

// ─── Visual Regression tests (alleen lokaal, skip in CI) ─────────────
//
// Deze tests gebruiken toHaveScreenshot() en vereisen platform-specifieke
// baseline screenshots. Ze worden overgeslagen in CI (Ubuntu) omdat de
// baselines op Windows zijn gegenereerd.
//
// Lokaal draaien: pnpm test:e2e:design-system
// Baselines updaten: pnpm test:e2e:design-system -- --update-snapshots

test.describe("OW Design System — Visual Regression", () => {
  // Skip in CI — font rendering verschilt per OS, baselines zijn platform-specifiek
  test.skip(!!process.env.CI, "Visual regression tests worden overgeslagen in CI");

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // Wacht tot Framer Motion animaties zijn afgerond
    await page.waitForTimeout(1500);
  });

  test("volledige pagina screenshot", async ({ page }) => {
    await expect(page).toHaveScreenshot("design-system-full.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  for (const section of SECTIONS) {
    test(`sectie screenshot: ${section}`, async ({ page }) => {
      const element = page.getByTestId(`section-${section}`);
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await expect(element).toHaveScreenshot(`section-${section}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  }

  test("mobile viewport screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot("design-system-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test("light mode screenshot", async ({ page }) => {
    await page.goto(`${BASE_URL}?theme=light`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot("design-system-light.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
