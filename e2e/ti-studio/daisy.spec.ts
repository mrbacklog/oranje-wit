import { test, expect } from "../fixtures/base";

test.describe("Daisy panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ti-studio/indeling");
    await page.waitForLoadState("domcontentloaded");
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

  test("bericht sturen en antwoord ontvangen", async ({ page }) => {
    test.setTimeout(30_000);

    // Mock de AI chat endpoint — CI draait zonder echte API key.
    // Test verificeert het volledige UI-pad: input → submit → response renderen.
    await page.route("**/api/ai/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain; charset=utf-8",
        body: "Er zijn 8 spelers geselecteerd voor Sen 1 in de huidige werkindeling.",
      });
    });

    const fab = page.getByRole("button", { name: "Daisy openen" });
    await expect(fab).toBeVisible({ timeout: 20_000 });
    await fab.click();

    const panel = page.getByRole("dialog", { name: "Daisy chat" });
    await expect(panel).toBeVisible({ timeout: 5_000 });

    const input = page.getByPlaceholder("Vraag Daisy iets...");
    await input.fill("Hoeveel spelers zitten er in Sen 1?");
    await page.keyboard.press("Enter");

    // Antwoord moet zichtbaar worden in het panel
    await expect(panel).toContainText("Sen 1", { timeout: 15_000 });
  });

  test("SSE werkbord stream: geen 503 bij pagina laden", async ({ page }) => {
    test.setTimeout(30_000);

    const sseStatussen: number[] = [];
    page.on("response", (response) => {
      if (
        response.url().includes("/api/ti-studio/indeling/") &&
        response.url().includes("/stream")
      ) {
        sseStatussen.push(response.status());
      }
    });

    await page.goto("/ti-studio/indeling", { timeout: 60_000 });
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });

    // Wacht kort zodat de SSE-verbinding geprobeerd kan worden
    await page.waitForTimeout(2000);

    for (const status of sseStatussen) {
      expect(status, `SSE endpoint gaf HTTP ${status}`).not.toBe(503);
    }
  });
});
