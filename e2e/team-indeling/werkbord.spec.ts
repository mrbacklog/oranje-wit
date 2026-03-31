import { test, expect } from "../fixtures/base";

test.describe("Werkbord", () => {
  // Seed maakt een blauwdruk aan voor 2025-2026, dus werkbord laadt altijd

  test("werkbord pagina is bereikbaar via URL", async ({ page }) => {
    await page.goto("/ti-studio/werkbord", { timeout: 15000 });
    await expect(page).toHaveURL(/\/werkbord/);
  });

  test("werkbord heading is zichtbaar", async ({ page }) => {
    await page.goto("/ti-studio/werkbord", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Werkbord" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("navigatie via BottomNav naar werkbord", async ({ page }) => {
    // Start op de scenarios pagina
    await page.goto("/ti-studio/scenarios", { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);

    // Wacht tot de pagina volledig geladen is
    await expect(page.getByRole("heading", { name: "Scenario's", exact: true })).toBeVisible({
      timeout: 15000,
    });

    // BottomNav is altijd zichtbaar met manifest-items
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    const werkbordLink = nav.getByRole("link", { name: /werkbord/i });
    await expect(werkbordLink).toBeVisible({ timeout: 5000 });

    // Klik op de Werkbord link
    await werkbordLink.click();
    await expect(page).toHaveURL(/\/werkbord/);
  });

  test("toont kanban bord met kolommen", async ({ page }) => {
    await page.goto("/ti-studio/werkbord", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Werkbord" })).toBeVisible({
      timeout: 10000,
    });

    // Seed blauwdruk garandeert dat het kanban bord toont
    await expect(page.getByRole("heading", { name: "Open" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "In bespreking" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Opgelost" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Geaccepteerd risico" })).toBeVisible();
  });

  test("toont statistieken", async ({ page }) => {
    await page.goto("/ti-studio/werkbord", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Werkbord" })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText("Blockers")).toBeVisible();
    await expect(page.getByText("Besluiten")).toBeVisible();
    await expect(page.getByText("Afgerond")).toBeVisible();
  });

  test("nieuw werkitem knop is zichtbaar", async ({ page }) => {
    await page.goto("/ti-studio/werkbord", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Werkbord" })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByRole("button", { name: /nieuw werkitem/i })).toBeVisible();
  });

  test("toon archief checkbox toont vijfde kolom", async ({ page }) => {
    await page.goto("/ti-studio/werkbord", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Werkbord" })).toBeVisible({
      timeout: 10000,
    });

    const archiefCheckbox = page.getByLabel(/toon archief/i);
    await expect(archiefCheckbox).toBeVisible();
    await expect(archiefCheckbox).not.toBeChecked();

    // Na aanklikken verschijnt de vijfde kolom
    await archiefCheckbox.check();
    await expect(page.getByRole("heading", { name: "Gearchiveerd" })).toBeVisible();
  });
});
