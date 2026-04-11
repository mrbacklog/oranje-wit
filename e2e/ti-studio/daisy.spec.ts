import { test, expect } from "@playwright/test";

/**
 * Daisy Panel — E2E Smoke Tests
 * Doel: verifieer kernfunctioneren van het Daisy AI-panel in TI-studio
 * Focus op UI-interactie: openen, sluiten, suggesties zichtbaar
 */

test.describe("Daisy panel", () => {
  test.beforeEach(async ({ page }) => {
    // Auth wordt afgehandeld via storageState (zie playwright.config.ts)
    await page.goto("/ti-studio/indeling", { timeout: 60_000 });
    await page.waitForLoadState("networkidle");
  });

  test("FAB opent het panel", async ({ page }) => {
    // FAB knop moet zichtbaar zijn
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await expect(fab).toBeVisible({ timeout: 10_000 });

    // Klik op FAB
    await fab.click();

    // Dialog moet zichtbaar zijn na klik
    const panel = page.getByRole("dialog", { name: "Daisy AI assistent" });
    await expect(panel).toBeVisible({ timeout: 5_000 });
  });

  test("panel sluit met sluit-knop", async ({ page }) => {
    // Open panel
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await fab.click();

    const panel = page.getByRole("dialog", { name: "Daisy AI assistent" });
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // Sluit panel
    const sluitKnop = page.getByRole("button", { name: "Daisy sluiten" });
    await expect(sluitKnop).toBeVisible();
    await sluitKnop.click();

    // Panel moet verdwenen zijn
    await expect(panel).not.toBeVisible({ timeout: 5_000 });

    // FAB moet weer zichtbaar zijn
    await expect(fab).toBeVisible({ timeout: 5_000 });
  });

  test("panel sluit met Escape-toets", async ({ page }) => {
    // Open panel
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await fab.click();

    const panel = page.getByRole("dialog", { name: "Daisy AI assistent" });
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // Druk Escape
    await page.keyboard.press("Escape");

    // Panel moet verdwenen zijn
    await expect(panel).not.toBeVisible({ timeout: 5_000 });
  });

  test("suggestie-cards zijn zichtbaar in panel", async ({ page }) => {
    // Open panel
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await fab.click();

    const panel = page.getByRole("dialog", { name: "Daisy AI assistent" });
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // Controleer dat suggestie-cards aanwezig zijn
    // (minstens 1 suggestie moet zichtbaar zijn)
    const suggesties = page.getByRole("button", { name: /Uitvoeren/i });
    await expect(suggesties.first()).toBeVisible({ timeout: 5_000 });
  });

  test("FAB aria-expanded synchroniseert met panel-state", async ({ page }) => {
    const fab = page.getByRole("button", { name: "Daisy openen" });

    // Gesloten: aria-expanded moet false zijn
    await expect(fab).toHaveAttribute("aria-expanded", "false");

    // Open panel
    await fab.click();

    // Open: aria-expanded moet true zijn
    await expect(fab).toHaveAttribute("aria-expanded", "true");

    // Sluit panel
    const sluitKnop = page.getByRole("button", { name: "Daisy sluiten" });
    await sluitKnop.click();

    // Gesloten: aria-expanded moet weer false zijn
    await expect(fab).toHaveAttribute("aria-expanded", "false");
  });
});
