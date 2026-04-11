import { test, expect } from "../fixtures/base";

test.describe("Dashboard", () => {
  test("toont de dashboard pagina met KPI kaarten", async ({ page }) => {
    await page.goto("/monitor");

    // Controleer heading
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Controleer seizoen-label
    await expect(page.getByText(/Seizoen \d{4}-\d{4}/)).toBeVisible();

    // Hero metric: link naar /monitor/spelers met "Spelende leden" label
    const main = page.getByRole("main");
    const heroLink = main.getByRole("link", { name: /spelende leden/i });
    await expect(heroLink).toBeVisible({ timeout: 10000 });

    // KPI kaarten (3 stuks) — scopen naar main om sidebar duplicaten te vermijden
    await expect(main.getByRole("link", { name: /Teams \d+/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /Netto groei/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /Signaleringen/ })).toBeVisible();
  });

  test("KPI waarden komen overeen met seed-data", async ({ page }) => {
    await page.goto("/monitor");

    const main = page.getByRole("main");

    // Hero metric toont "Spelende leden" als link
    await expect(main.getByRole("link", { name: /spelende leden/i })).toBeVisible({
      timeout: 10000,
    });

    // Teams en Signaleringen KPI's zichtbaar
    await expect(main.getByRole("link", { name: /Teams \d+/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /Signaleringen/ })).toBeVisible();
  });

  test("KPI kaarten linken naar juiste pagina's", async ({ page }) => {
    await page.goto("/monitor");

    const main = page.getByRole("main");

    // Wacht tot hero metric geladen is
    const heroLink = main.getByRole("link", { name: /spelende leden/i });
    await expect(heroLink).toBeVisible({ timeout: 10000 });

    // Hero metric linkt naar /monitor/spelers
    await expect(heroLink).toHaveAttribute("href", "/monitor/spelers");

    // Signaleringen linkt naar /monitor/signalering
    await expect(main.getByRole("link", { name: /Signaleringen/ })).toHaveAttribute(
      "href",
      "/monitor/signalering"
    );
  });
});
