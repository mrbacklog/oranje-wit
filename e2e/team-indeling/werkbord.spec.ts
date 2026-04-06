import { test, expect } from "../fixtures/base";

test.describe("Opvolging (was: Werkbord)", () => {
  // Seed maakt kaderdata aan voor 2025-2026, dus opvolging laadt altijd

  test("opvolging pagina is bereikbaar via URL", async ({ page }) => {
    await page.goto("/ti-studio/opvolging", { timeout: 15000, waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/opvolging/);
  });

  test("opvolging heading is zichtbaar", async ({ page }) => {
    await page.goto("/ti-studio/opvolging", { timeout: 15000, waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Opvolging" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("werkbord redirect werkt naar opvolging", async ({ page }) => {
    await page.goto("/ti-studio/werkbord", { timeout: 15000, waitUntil: "domcontentloaded" });
    // Wacht tot de opvolging pagina goed gerenderd is — dit zorgt ook voor de redirect
    await expect(page.getByRole("heading", { name: "Opvolging" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveURL(/\/opvolging/);
  });

  test("toont kanban bord met kolommen", async ({ page }) => {
    await page.goto("/ti-studio/opvolging", { timeout: 15000, waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Opvolging" })).toBeVisible({
      timeout: 10000,
    });

    // Seed kaderdata garandeert dat het kanban bord toont
    await expect(page.getByRole("heading", { name: "Open" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "In bespreking" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Opgelost" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Geaccepteerd risico" })).toBeVisible();
  });

  test("toont statistieken", async ({ page }) => {
    await page.goto("/ti-studio/opvolging", { timeout: 15000, waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Opvolging" })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText("Blockers", { exact: true })).toBeVisible();
    await expect(page.getByText("Besluiten", { exact: true })).toBeVisible();
    await expect(page.getByText("Afgerond", { exact: true })).toBeVisible();
  });

  test("nieuw werkitem knop is zichtbaar", async ({ page }) => {
    await page.goto("/ti-studio/opvolging", { timeout: 15000, waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Opvolging" })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByRole("button", { name: /nieuw werkitem/i })).toBeVisible();
  });

  test("toon archief checkbox is zichtbaar", async ({ page }) => {
    await page.goto("/ti-studio/opvolging", { timeout: 15000, waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Opvolging" })).toBeVisible({
      timeout: 10000,
    });

    const archiefCheckbox = page.getByLabel(/toon archief/i);
    await expect(archiefCheckbox).toBeVisible();
    await expect(archiefCheckbox).not.toBeChecked();
  });
});
