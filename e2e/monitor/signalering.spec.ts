import { test, expect } from "../fixtures/base";

test.describe("Signalering", () => {
  test("toont signaleringen met filterchips", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/signalering", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    const filterGroup = page.getByRole("group", { name: "Filter op thema" });
    await expect(filterGroup.getByRole("link", { name: "Alles" })).toBeVisible();
    await expect(filterGroup.getByRole("link", { name: "Werving" })).toBeVisible();
    await expect(filterGroup.getByRole("link", { name: "Retentie" })).toBeVisible();
    await expect(filterGroup.getByRole("link", { name: "Pijplijn" })).toBeVisible();
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

  test("filterchips updaten de URL", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/signalering", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    const filterGroup = page.getByRole("group", { name: "Filter op thema" });
    await filterGroup.getByRole("link", { name: "Werving" }).click();
    await expect(page).toHaveURL(/filter=werving/, { timeout: 10000 });

    await filterGroup.getByRole("link", { name: "Retentie" }).click();
    await expect(page).toHaveURL(/filter=retentie/, { timeout: 10000 });

    await filterGroup.getByRole("link", { name: "Alles" }).click();
    await expect(page).not.toHaveURL(/filter=/, { timeout: 10000 });
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
