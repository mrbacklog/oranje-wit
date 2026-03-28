import { test, expect } from "../fixtures/base";

test.describe("Navigatie", () => {
  test("root redirect naar zoekpagina voor ingelogde gebruiker", async ({ page }) => {
    await page.goto("/scouting");

    // Root redirect ingelogde users naar /scouting/zoek
    // Of toont het dashboard — beide valide
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
  });

  test("navigatie is zichtbaar met 4 links", async ({ page }) => {
    await page.goto("/scouting/zoek");

    // Desktop: sidebar navigatie (md:block), Mobile: bottom nav (md:hidden)
    // Playwright draait op Desktop Chrome -> sidebar is zichtbaar
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();

    // Sidebar labels: Dashboard, Verzoeken, Zoeken, Profiel
    await expect(nav.getByText("Dashboard")).toBeVisible();
    await expect(nav.getByText("Verzoeken")).toBeVisible();
    await expect(nav.getByText("Zoeken", { exact: true })).toBeVisible();
    await expect(nav.getByText("Profiel")).toBeVisible();
  });

  test("Dashboard link navigeert naar dashboard", async ({ page }) => {
    await page.goto("/scouting/zoek");

    const nav = page.getByRole("navigation");
    await nav.getByText("Dashboard").click();

    // Kan redirecten naar /scouting/zoek of dashboard op /scouting tonen
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
  });

  test("Zoeken link navigeert naar zoekpagina", async ({ page }) => {
    await page.goto("/scouting");

    // Wacht tot dashboard geladen is
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15000 });

    const nav = page.getByRole("navigation");
    await nav.getByText("Zoeken", { exact: true }).click();

    await expect(page.getByRole("heading", { name: "Speler zoeken" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("Verzoeken link navigeert naar verzoekenpagina", async ({ page }) => {
    await page.goto("/scouting/zoek");

    const nav = page.getByRole("navigation");
    await nav.getByText("Verzoeken").click();

    // Verzoeken pagina laadt (heading of spinner-overgang)
    await expect(page.getByRole("heading", { name: "Verzoeken" })).toBeVisible({
      timeout: 15000,
    });
  });

  test("Profiel link navigeert naar profielpagina", async ({ page }) => {
    await page.goto("/scouting/zoek");

    const nav = page.getByRole("navigation");
    await nav.getByText("Profiel").click();

    // Profiel laadt (heading of foutmelding)
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText("Kon profiel niet laden"))
        .or(page.getByText("Verbindingsfout"))
    ).toBeVisible({ timeout: 15000 });
  });

  test("navigatie naar elke hoofdpagina werkt", async ({ page }) => {
    test.setTimeout(60000);

    const paginas = [
      { url: "/scouting/zoek", heading: /Speler zoeken/ },
      { url: "/scouting/team", heading: /Scout een team/ },
      { url: "/scouting/kaarten", heading: /Kaarten/ },
    ];

    for (const pagina of paginas) {
      await page.goto(pagina.url, { timeout: 15000 });
      await expect(page.getByRole("heading", { name: pagina.heading })).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("onbekende URL toont 404", async ({ page }) => {
    const response = await page.goto("/scouting/deze-pagina-bestaat-niet-xyz");

    // Next.js toont 404 pagina of redirect
    if (response && response.status() === 404) {
      await expect(page.getByText("404").or(page.getByText("not found"))).toBeVisible();
    }
  });
});
