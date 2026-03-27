import { test, expect } from "@playwright/test";

// Design System pagina heeft geen auth nodig — importeer rechtstreeks uit Playwright.
// De pagina draait in de team-indeling app op poort 4100.

const BASE_URL = "http://localhost:4100/design-system";

test.describe("OW Design System — Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // Wacht tot Framer Motion animaties zijn afgerond
    await page.waitForTimeout(1500);
  });

  // ─── Full page screenshot ───────────────────────────────────────────

  test("volledige pagina", async ({ page }) => {
    await expect(page).toHaveScreenshot("design-system-full.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  // ─── Per sectie screenshots ─────────────────────────────────────────

  const sections = [
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
  ];

  for (const section of sections) {
    test(`sectie: ${section}`, async ({ page }) => {
      const element = page.getByTestId(`section-${section}`);
      await element.scrollIntoViewIfNeeded();
      // Wacht op scroll- en entree-animaties
      await page.waitForTimeout(500);
      await expect(element).toHaveScreenshot(`section-${section}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  }

  // ─── Interactie tests ───────────────────────────────────────────────

  test("button hover state", async ({ page }) => {
    const buttonsSection = page.getByTestId("section-buttons");
    const primaryBtn = buttonsSection.getByRole("button", { name: /opslaan/i }).first();
    await primaryBtn.hover();
    await page.waitForTimeout(300);
    await expect(buttonsSection).toHaveScreenshot("buttons-hover.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("toggle interactie", async ({ page }) => {
    const togglesSection = page.getByTestId("section-toggles");
    const toggle = togglesSection.getByRole("switch").first();
    await toggle.click();
    await page.waitForTimeout(400);
    await expect(togglesSection).toHaveScreenshot("toggles-clicked.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("chip selectie", async ({ page }) => {
    const chipsSection = page.getByTestId("section-chips");
    const chip = chipsSection.getByRole("button").nth(1);
    await chip.click();
    await page.waitForTimeout(300);
    await expect(chipsSection).toHaveScreenshot("chips-selected.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("search input focus", async ({ page }) => {
    const inputsSection = page.getByTestId("section-inputs");
    const input = inputsSection.locator("input[type='text']").first();
    await input.focus();
    await page.waitForTimeout(300);
    await expect(inputsSection).toHaveScreenshot("inputs-focused.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  // ─── Responsive: mobile viewport ───────────────────────────────────

  test("mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot("design-system-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  // ─── Light mode variant ────────────────────────────────────────────

  test("light mode variant", async ({ page }) => {
    await page.goto(`${BASE_URL}?theme=light`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot("design-system-light.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
