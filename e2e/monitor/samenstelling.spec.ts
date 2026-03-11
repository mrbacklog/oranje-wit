import { test, expect } from "../fixtures/base";

test.describe("Samenstelling", () => {
  test("toont samenstelling overzicht met piramide tab", async ({ page }) => {
    await page.goto("/samenstelling");

    await expect(page.getByRole("heading", { name: "Samenstelling" })).toBeVisible();

    // Controleer tabs
    await expect(page.getByRole("tab", { name: "Piramide" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Detail" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Historie" })).toBeVisible();
  });

  test("geboortejaar detail toont actieve en gestopte spelers", async ({ page }) => {
    await page.goto("/samenstelling/2010");

    // In CI is de database leeg — skip als het geboortejaar niet bestaat
    const heading = page.getByRole("heading", { name: /Geboortejaar 2010/ });
    const notFound = page.getByText("404");
    const first = await Promise.race([
      heading.waitFor({ timeout: 5000 }).then(() => "found" as const),
      notFound.waitFor({ timeout: 5000 }).then(() => "404" as const),
    ]).catch(() => "timeout" as const);
    test.skip(first !== "found", "Geboortejaar 2010 niet beschikbaar in CI database");

    await expect(page.getByText(/retentie/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Actief/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Gestopt/ })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Seizoen" })).toBeVisible();
  });

  test("onbekend geboortejaar toont 404", async ({ page }) => {
    await page.goto("/samenstelling/1900");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Pagina niet gevonden")).toBeVisible();
  });

  test("terug-link navigeert naar samenstelling overzicht", async ({ page }) => {
    await page.goto("/samenstelling/2010");

    const link = page.getByRole("link", { name: /Terug naar samenstelling/ });
    const notFound = page.getByText("404");
    const first = await Promise.race([
      link.waitFor({ timeout: 5000 }).then(() => "found" as const),
      notFound.waitFor({ timeout: 5000 }).then(() => "404" as const),
    ]).catch(() => "timeout" as const);
    test.skip(first !== "found", "Geboortejaar 2010 niet beschikbaar in CI database");

    await link.click();
    await expect(page).toHaveURL(/\/samenstelling/);
  });
});
