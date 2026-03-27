import { test, expect } from "../fixtures/base";

test.describe("Navigatie", () => {
  test("zijbalk of menu bevat alle pagina-links", async ({ page }) => {
    await page.goto("/monitor");

    // Op desktop is er een zijbalk, op mobiel een hamburger menu
    // Controleer dat navigatie-links bestaan (in sidebar of dialog)
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Teams" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Spelers" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Samenstelling" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Ledendynamiek" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Jeugdpijplijn" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Signalering" })).toBeVisible();
  });

  test("navigatie naar elke pagina werkt", async ({ page }) => {
    // Sommige pagina's laden veel data; verhoog test timeout
    test.setTimeout(120000);

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
      await page.goto(pagina.url, { timeout: 45000 });
      await expect(page.getByRole("heading", { name: pagina.heading })).toBeVisible({
        timeout: 15000,
      });
    }
  });

  test("404 pagina bij onbekende URL", async ({ page }) => {
    await page.goto("/monitor/deze-pagina-bestaat-niet");

    await expect(page.getByText("404")).toBeVisible();
  });
});
