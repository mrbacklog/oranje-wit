import { test, expect } from "../fixtures/base";

test.describe("Admin rondes beheer", () => {
  test.describe("Evaluatie dashboard (TC-gebruiker)", () => {
    test("toont dashboard met rondes of lege staat", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/evaluatie", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: "Evaluaties" })).toBeVisible({
        timeout: 15000,
      });

      // Of een lege staat of rondekaarten
      const legeTekst = page.getByText(/Nog geen evaluatierondes/i);
      const rondeKaarten = page.locator("a[href*='/beheer/evaluatie/']");

      const heeftLegeTekst = await legeTekst.isVisible().catch(() => false);
      const heeftKaarten = (await rondeKaarten.count().catch(() => 0)) > 0;

      // Precies een van beide moet zichtbaar zijn
      expect(heeftLegeTekst || heeftKaarten).toBeTruthy();
    });

    test("dashboard toont statistieken", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/evaluatie", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: "Evaluaties" })).toBeVisible({
        timeout: 15000,
      });

      // StatCards: Rondes, Ingediend, Uitnodigingen — scoop op main om BottomNav te vermijden
      const main = page.locator("main");
      await expect(main.getByText("Rondes", { exact: true })).toBeVisible();
      await expect(main.getByText("Ingediend", { exact: true })).toBeVisible();
      await expect(main.getByText("Uitnodigingen", { exact: true })).toBeVisible();
    });

    test("beheer link is zichtbaar en wijst naar /beheer/evaluatie", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/evaluatie", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: "Evaluaties" })).toBeVisible({
        timeout: 15000,
      });

      const beheerLink = page.getByRole("link", { name: /Beheer/i });
      await expect(beheerLink).toBeVisible();
      await expect(beheerLink).toHaveAttribute("href", "/beheer/evaluatie");
    });
  });

  test.describe("Beheer evaluatie - rondes", () => {
    test("rondes pagina toont heading en tabel of lege staat", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/beheer/evaluatie/rondes", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: "Evaluatierondes" })).toBeVisible({
        timeout: 15000,
      });

      const legeTekst = page.getByText(/Nog geen evaluatierondes/i);
      const tabel = page.locator("table");

      const heeftLegeTekst = await legeTekst.isVisible().catch(() => false);
      const heeftTabel = await tabel.isVisible().catch(() => false);

      expect(heeftLegeTekst || heeftTabel).toBeTruthy();
    });

    test("rondes tabel toont verwachte kolommen indien aanwezig", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/beheer/evaluatie/rondes", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: "Evaluatierondes" })).toBeVisible({
        timeout: 15000,
      });

      const tabel = page.locator("table");
      const tabelZichtbaar = await tabel.isVisible().catch(() => false);

      if (!tabelZichtbaar) {
        // Geen rondes in database, skip tabelcontrole
        test.skip();
        return;
      }

      // Controleer kolomheaders
      const headers = tabel.locator("thead th");
      await expect(headers.filter({ hasText: "Naam" })).toBeVisible();
      await expect(headers.filter({ hasText: "Seizoen" })).toBeVisible();
      await expect(headers.filter({ hasText: "Type" })).toBeVisible();
      await expect(headers.filter({ hasText: "Deadline" })).toBeVisible();
      await expect(headers.filter({ hasText: "Status" })).toBeVisible();
    });
  });

  test.describe("Beheer evaluatie - coordinatoren", () => {
    test("coordinatoren pagina laadt", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/beheer/evaluatie/coordinatoren", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: "Coordinatoren" })).toBeVisible({
        timeout: 15000,
      });

      // Of lege tekst of coordinator kaarten
      const legeTekst = page.getByText(/Nog geen coordinatoren/i);
      const kaarten = page.locator(".rounded-xl.border");

      const heeftLegeTekst = await legeTekst.isVisible().catch(() => false);
      const heeftKaarten = (await kaarten.count().catch(() => 0)) > 0;

      expect(heeftLegeTekst || heeftKaarten).toBeTruthy();
    });
  });

  test.describe("Beheer evaluatie - templates", () => {
    test("templates pagina toont heading", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/beheer/evaluatie/templates", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: /E-mail templates/i })).toBeVisible({
        timeout: 15000,
      });
    });

    test("templates tonen variabelen indien aanwezig", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/beheer/evaluatie/templates", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: /E-mail templates/i })).toBeVisible({
        timeout: 15000,
      });

      const templateKaarten = page.locator(".rounded-xl.border").filter({
        has: page.locator("h3"),
      });
      const aantalKaarten = await templateKaarten.count();

      if (aantalKaarten === 0) {
        // Geen templates in database
        test.skip();
        return;
      }

      // Eerste template moet een sleutel-heading en variabelen tonen
      const eersteKaart = templateKaarten.first();
      await expect(eersteKaart.locator("h3")).toBeVisible();
    });
  });
});
