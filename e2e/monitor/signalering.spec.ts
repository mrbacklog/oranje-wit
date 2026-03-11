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

    // Seed maakt 4 signaleringen aan: 2x aandacht, 1x kritiek, 1x op_koers
    await expect(page.getByRole("heading", { name: "Strategisch advies" })).toBeVisible({
      timeout: 15000,
    });

    // Tellers zijn zichtbaar
    await expect(page.getByText("Op koers")).toBeVisible();
  });

  test("signaleringen bevatten links naar detail pagina's", async ({ page }) => {
    await page.goto("/signalering");

    // Seed garandeert signaleringen met adviezen
    await expect(page.getByRole("heading", { name: "Strategisch advies" })).toBeVisible({
      timeout: 15000,
    });

    // Links naar /retentie, /projecties of /samenstelling moeten bestaan
    const detailLinks = page.getByRole("link", { name: /Bekijk/ });
    await expect(detailLinks.first()).toBeVisible();
  });

  test("toont seed-signaleringen: retentie U15 en U17", async ({ page }) => {
    await page.goto("/signalering");

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    // Seed bevat retentie-signaleringen voor U15 en U17
    await expect(page.getByText("U15")).toBeVisible();
    await expect(page.getByText("U17")).toBeVisible();
  });
});
