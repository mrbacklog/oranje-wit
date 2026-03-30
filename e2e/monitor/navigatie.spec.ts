import { test, expect } from "../fixtures/base";

test.describe("Navigatie", () => {
  test("BottomNav bevat alle navigatie-links", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor", { timeout: 45000 });

    // BottomNav is altijd zichtbaar met 4 manifest-items + Apps knop
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Overzicht" })).toBeVisible({ timeout: 15000 });
    await expect(nav.getByRole("link", { name: "Teams" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Analyse" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Signalen" })).toBeVisible();
  });

  test("navigatie naar elke pagina werkt", async ({ page }) => {
    // Sommige pagina's laden veel data; verhoog test timeout
    test.setTimeout(180000);

    const paginas = [
      { url: "/monitor/teams", heading: /Teams/ },
      { url: "/monitor/samenstelling", heading: /Samenstelling/ },
      { url: "/monitor/retentie", heading: /Ledendynamiek/ },
      { url: "/monitor/projecties", heading: /Jeugdpijplijn/ },
      { url: "/monitor/signalering", heading: /Signalering/ },
      // Spelers als laatste: zwaarste pagina (alle leden + seizoenen)
      { url: "/monitor/spelers", heading: /Spelers/ },
    ];

    for (const pagina of paginas) {
      await page.goto(pagina.url, { timeout: 60000 });
      await expect(page.getByRole("heading", { name: pagina.heading })).toBeVisible({
        timeout: 30000,
      });
    }
  });

  test("404 pagina bij onbekende URL", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/deze-pagina-bestaat-niet", { timeout: 45000 });

    await expect(page.getByText("404")).toBeVisible({ timeout: 15000 });
  });
});
