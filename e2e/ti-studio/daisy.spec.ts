import { test, expect } from "@playwright/test";

test.describe("Daisy panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ti-studio/indeling");
    await page.waitForLoadState("networkidle");
  });

  test("FAB opent het panel", async ({ page }) => {
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await expect(fab).toBeVisible();
    await fab.click();

    const panel = page.getByRole("dialog", { name: "Daisy chat" });
    await expect(panel).toBeVisible();
  });

  test("panel sluit met sluit-knop", async ({ page }) => {
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await fab.click();

    const sluitKnop = page.getByRole("button", { name: "Daisy sluiten" });
    await expect(sluitKnop).toBeVisible();
    await sluitKnop.click();

    await expect(fab).toBeVisible();
  });

  test("input field is aanwezig en accepteert tekst", async ({ page }) => {
    const fab = page.getByRole("button", { name: "Daisy openen" });
    await fab.click();

    const input = page.getByPlaceholder("Vraag Daisy iets...");
    await expect(input).toBeVisible();
    await input.fill("Hoeveel spelers zitten er in Sen 1?");
    await expect(input).toHaveValue("Hoeveel spelers zitten er in Sen 1?");
  });
});
