import { test, expect } from "../fixtures/base";

test.describe("Spelers", () => {
  // Spelers pagina laadt veel data, verhoog timeout
  test.setTimeout(60000);

  test("toont spelersoverzicht met heading", async ({ page }) => {
    await page.goto("/spelers", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: /Spelers/ })).toBeVisible({
      timeout: 15000,
    });
  });

  test("speler detail pagina toont seizoensoverzicht", async ({ page }) => {
    // Gebruik een bekende speler
    await page.goto("/spelers/NLS54M7");

    // In CI is de database leeg — skip als de speler niet bestaat
    const heading = page.getByRole("heading", { name: "Nikki Baas", level: 1 });
    const notFound = page.getByText("404");
    const first = await Promise.race([
      heading.waitFor({ timeout: 5000 }).then(() => "found" as const),
      notFound.waitFor({ timeout: 5000 }).then(() => "404" as const),
    ]).catch(() => "timeout" as const);
    test.skip(first !== "found", "Speler NLS54M7 niet beschikbaar in CI database");

    await expect(page.getByRole("heading", { name: "Seizoensoverzicht" })).toBeVisible();

    // Seizoenstabel met kolommen
    const tabel = page.getByRole("table");
    await expect(tabel).toBeVisible();
    await expect(tabel.getByRole("columnheader", { name: "Seizoen" })).toBeVisible();
    await expect(tabel.getByRole("columnheader", { name: "Team" })).toBeVisible();
    await expect(tabel.getByRole("columnheader", { name: "Status" })).toBeVisible();
  });

  test("onbekende speler toont 404", async ({ page }) => {
    await page.goto("/spelers/ONGELDIG999");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Speler niet gevonden")).toBeVisible();
    await expect(page.getByRole("link", { name: "Terug naar Spelers" })).toBeVisible();
  });

  test("terug-link op speler detail navigeert naar overzicht", async ({ page }) => {
    await page.goto("/spelers/NLS54M7");

    const link = page.getByRole("link", { name: /Terug naar overzicht/ });
    const notFound = page.getByText("404");
    const first = await Promise.race([
      link.waitFor({ timeout: 5000 }).then(() => "found" as const),
      notFound.waitFor({ timeout: 5000 }).then(() => "404" as const),
    ]).catch(() => "timeout" as const);
    test.skip(first !== "found", "Speler NLS54M7 niet beschikbaar in CI database");

    await link.click();
    await expect(page).toHaveURL(/\/spelers$/);
  });
});
