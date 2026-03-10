import { test, expect } from "../fixtures/base";

test.describe("Signalering", () => {
  test("toont signaleringen met tabs", async ({ page }) => {
    await page.goto("/signalering");

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    // Controleer tabs
    await expect(page.getByRole("tab", { name: "Overzicht" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Werving" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Retentie" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Pijplijn" })).toBeVisible();
  });

  test("overzicht toont tellers en strategisch advies", async ({ page }) => {
    await page.goto("/signalering");

    // Wacht tot signaleringen geladen zijn via specifiekere locators
    await expect(page.getByRole("heading", { name: "Strategisch advies" })).toBeVisible({
      timeout: 15000,
    });

    // Tellers zijn zichtbaar
    await expect(page.getByText("Op koers")).toBeVisible();
  });

  test("signaleringen bevatten links naar detail pagina's", async ({ page }) => {
    await page.goto("/signalering");

    // Wacht tot signaleringen geladen zijn
    await expect(page.getByRole("heading", { name: "Strategisch advies" })).toBeVisible({
      timeout: 15000,
    });

    // Links naar /retentie, /projecties of /samenstelling moeten bestaan
    const detailLinks = page.getByRole("link", { name: /Bekijk/ });
    await expect(detailLinks.first()).toBeVisible();
  });
});
