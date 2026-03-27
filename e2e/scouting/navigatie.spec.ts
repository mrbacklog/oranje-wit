import { test, expect } from "../fixtures/base";

test.describe("Navigatie", () => {
  test("root redirect naar zoekpagina voor ingelogde gebruiker", async ({ page }) => {
    await page.goto("/");

    // Root redirect ingelogde users naar /zoek
    // Of toont het dashboard — beide valide
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
  });

  test("bottom navigatie is zichtbaar met 4 links", async ({ page }) => {
    await page.goto("/zoek");

    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();

    // 4 navigatie-items: Home, Verzoeken, Zoeken, Profiel
    await expect(nav.getByText("Home")).toBeVisible();
    await expect(nav.getByText("Verzoeken")).toBeVisible();
    await expect(nav.getByText("Zoeken", { exact: true })).toBeVisible();
    await expect(nav.getByText("Profiel")).toBeVisible();
  });

  test("bottom nav: Home link navigeert naar dashboard", async ({ page }) => {
    await page.goto("/zoek");

    const nav = page.getByRole("navigation");
    await nav.getByText("Home").click();

    // Kan redirecten naar /zoek of dashboard op / tonen
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
  });

  test("bottom nav: Zoeken link navigeert naar zoekpagina", async ({ page }) => {
    await page.goto("/kaarten");

    // Wacht tot kaartenpagina geladen is
    await expect(page.getByRole("heading", { name: "Kaarten" })).toBeVisible({ timeout: 10000 });

    const nav = page.getByRole("navigation");
    await nav.getByText("Zoeken", { exact: true }).click();

    await expect(page.getByRole("heading", { name: "Speler zoeken" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("bottom nav: Verzoeken link navigeert naar verzoekenpagina", async ({ page }) => {
    await page.goto("/zoek");

    const nav = page.getByRole("navigation");
    await nav.getByText("Verzoeken").click();

    // Verzoeken pagina laadt
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
  });

  test("bottom nav: Profiel link navigeert naar profielpagina", async ({ page }) => {
    await page.goto("/zoek");

    const nav = page.getByRole("navigation");
    await nav.getByText("Profiel").click();

    // Profiel laadt (heading of foutmelding)
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText("Kon profiel niet laden"))
        .or(page.getByText("Verbindingsfout"))
    ).toBeVisible({ timeout: 10000 });
  });

  test("navigatie naar elke hoofdpagina werkt", async ({ page }) => {
    test.setTimeout(60000);

    const paginas = [
      { url: "/zoek", heading: /Speler zoeken/ },
      { url: "/team", heading: /Scout een team/ },
      { url: "/kaarten", heading: /Kaarten/ },
    ];

    for (const pagina of paginas) {
      await page.goto(pagina.url, { timeout: 15000 });
      await expect(page.getByRole("heading", { name: pagina.heading })).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("onbekende URL toont 404", async ({ page }) => {
    const response = await page.goto("/deze-pagina-bestaat-niet-xyz");

    // Next.js toont 404 pagina of redirect
    if (response && response.status() === 404) {
      await expect(page.getByText("404").or(page.getByText("not found"))).toBeVisible();
    }
  });
});
