import { test, expect } from "../fixtures/base";

test.describe("Dashboard", () => {
  test("toont de dashboard pagina met KPI kaarten", async ({ page }) => {
    await page.goto("/");

    // Controleer paginatitel en heading
    await expect(page).toHaveTitle(/Verenigingsmonitor/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Controleer seizoen-label
    await expect(page.getByText(/Seizoen \d{4}-\d{4}/)).toBeVisible();

    // Controleer KPI kaarten (als links naar detail-pagina's)
    await expect(page.getByRole("link", { name: /Spelende leden \d+/ })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("link", { name: /Teams \d+/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Netto groei/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Signaleringen \d+/ })).toBeVisible();
  });

  test("KPI kaarten linken naar juiste pagina's", async ({ page }) => {
    await page.goto("/");

    // Wacht tot KPI's geladen zijn
    await expect(page.getByRole("link", { name: /Spelende leden/ })).toBeVisible({
      timeout: 10000,
    });

    // Spelende leden linkt naar /spelers
    await expect(page.getByRole("link", { name: /Spelende leden/ })).toHaveAttribute(
      "href",
      "/spelers"
    );

    // Signaleringen linkt naar /signalering
    await expect(page.getByRole("link", { name: /Signaleringen/ })).toHaveAttribute(
      "href",
      "/signalering"
    );
  });

  test("toont signaleringen sectie met link naar overzicht", async ({ page }) => {
    await page.goto("/");

    // De signaleringen heading staat in de main content area
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Signaleringen" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("link", { name: /Toon alle/ })).toBeVisible();
  });
});
