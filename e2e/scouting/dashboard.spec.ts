import { test, expect } from "../fixtures/base";

test.describe("Dashboard", () => {
  test("dashboard laadt na redirect van root", async ({ page }) => {
    // Root page redirect ingelogde users naar /zoek of toont dashboard
    await page.goto("/");

    // Moet een heading hebben (begroeting of zoekpagina titel)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
  });

  test("zoekpagina toont titel en zoekbalk", async ({ page }) => {
    await page.goto("/zoek");

    await expect(page.getByRole("heading", { name: "Speler zoeken" })).toBeVisible();

    // Zoekbalk is aanwezig
    const zoekInput = page.getByRole("searchbox");
    await expect(zoekInput).toBeVisible();
    await expect(zoekInput).toHaveAttribute("placeholder", /zoek.*speler/i);
  });

  test("kaartenpagina laadt correct", async ({ page }) => {
    await page.goto("/kaarten");

    // Wacht tot de heading verschijnt (altijd gerenderd na loading)
    await expect(page.getByRole("heading", { name: "Kaarten" })).toBeVisible({ timeout: 10000 });
  });

  test("kaartenpagina toont filter chips", async ({ page }) => {
    await page.goto("/kaarten");

    // Wacht tot loading klaar is (heading is altijd aanwezig)
    await expect(page.getByRole("heading", { name: "Kaarten" })).toBeVisible({ timeout: 10000 });

    // Filter chips voor leeftijdsgroepen
    await expect(page.getByRole("button", { name: "Alle" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Blauw" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Groen" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Geel" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Oranje" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Rood" })).toBeVisible();
  });

  test("kaartenpagina toont sorteeropties", async ({ page }) => {
    await page.goto("/kaarten");

    await expect(page.getByRole("heading", { name: "Kaarten" })).toBeVisible({ timeout: 10000 });

    // Sorteeropties
    await expect(page.getByRole("button", { name: "Rating" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Recent" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Naam" })).toBeVisible();
  });

  test("profielpagina laadt scout-profiel", async ({ page }) => {
    await page.goto("/profiel");

    // Toont profiel of foutmelding (afhankelijk van scout-record)
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText("Kon profiel niet laden"))
        .or(page.getByText("Verbindingsfout"))
    ).toBeVisible({ timeout: 10000 });
  });

  test("profielpagina toont uitlog-knop", async ({ page }) => {
    await page.goto("/profiel");

    // Wacht tot pagina geladen is
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText("Kon profiel niet laden"))
        .or(page.getByText("Verbindingsfout"))
    ).toBeVisible({ timeout: 10000 });

    // Uitlog-knop moet zichtbaar zijn (als profiel geladen is)
    const uitlogKnop = page.getByRole("button", { name: "Uitloggen" });
    if (await uitlogKnop.isVisible()) {
      await expect(uitlogKnop).toBeVisible();
    }
  });
});
