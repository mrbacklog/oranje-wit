import { test, expect } from "../fixtures/base";

test.describe("Signalering", () => {
  test("toont signaleringen met tabs", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/signalering", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    // Controleer tabs
    await expect(page.getByRole("tab", { name: "Overzicht" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Werving" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Retentie" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Pijplijn" })).toBeVisible();
  });

  test("overzicht toont tellers", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/signalering", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    // KPI-kaarten zijn zichtbaar: Kritiek, Aandacht, Op koers (exact: true om strict mode te voorkomen)
    await expect(page.getByText("Kritiek", { exact: true })).toBeVisible();
    await expect(page.getByText("Aandacht", { exact: true })).toBeVisible();
    await expect(page.getByText("Op koers", { exact: true })).toBeVisible();
  });

  test("tabs schakelen toont content", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/signalering", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    // Wacht tot tabs interactief zijn (hydration kan even duren)
    const wervingTab = page.getByRole("tab", { name: "Werving" });
    await expect(wervingTab).toBeVisible();

    // Klik op Werving tab
    await wervingTab.click();
    await expect(page).toHaveURL(/tab=werving/, { timeout: 10000 });

    // Klik op Retentie tab
    await page.getByRole("tab", { name: "Retentie" }).click();
    await expect(page).toHaveURL(/tab=retentie/, { timeout: 10000 });

    // Terug naar Overzicht
    await page.getByRole("tab", { name: "Overzicht" }).click();
    await expect(page).not.toHaveURL(/tab=/, { timeout: 10000 });
  });

  test("signaleringen bevatten detail links indien aanwezig", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/signalering", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    // Als er actieve signaleringen zijn, is er een "Strategisch advies" sectie met links
    const strategischAdvies = page.getByText("Strategisch advies");
    const heeftAdvies = await strategischAdvies.isVisible().catch(() => false);

    if (heeftAdvies) {
      const detailLinks = page.getByRole("link", { name: /Bekijk/ });
      await expect(detailLinks.first()).toBeVisible();
    }
  });
});
