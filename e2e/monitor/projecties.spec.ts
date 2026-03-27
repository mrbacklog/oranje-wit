import { test, expect } from "../fixtures/base";

test.describe("Projecties / Jeugdpijplijn", () => {
  test("toont jeugdpijplijn met tabs", async ({ page }) => {
    await page.goto("/monitor/projecties");

    await expect(page.getByRole("heading", { name: "Jeugdpijplijn" })).toBeVisible();

    // Tabs
    await expect(page.getByRole("tab", { name: "Pijplijn" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Projectie" })).toBeVisible();
  });

  test("pijplijn tab toont stip-op-de-horizon en tabel", async ({ page }) => {
    await page.goto("/monitor/projecties");

    // Stip op de horizon sectie
    await expect(page.getByRole("heading", { name: "Stip op de horizon" })).toBeVisible();

    // Categorie-labels U15, U17, U19
    await expect(page.getByText("U15")).toBeVisible();
    await expect(page.getByText("U17")).toBeVisible();
    await expect(page.getByText("U19")).toBeVisible();

    // Pijplijn per leeftijd tabel
    await expect(page.getByRole("heading", { name: "Pijplijn per leeftijd" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("kan wisselen naar projectie tab", async ({ page }) => {
    await page.goto("/monitor/projecties");

    await page.getByRole("tab", { name: "Projectie" }).click();

    // Projectie tab bevat de doorstroom of senioren tabel
    // De content moet veranderen na tab-wissel
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });
});
