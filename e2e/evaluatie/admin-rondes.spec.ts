import { test, expect } from "../fixtures/base";

test.describe("Admin rondes beheer", () => {
  test.describe("Rondes overzicht", () => {
    test("toont lege staat of bestaande rondes", async ({ page }) => {
      await page.goto("/evaluatie/admin");
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: "Evaluatierondes" })).toBeVisible();

      // Of een lege staat tekst of een tabel met rondes
      const leegTekst = page.getByText(/Nog geen evaluatierondes/i);
      const tabel = page.locator("table");

      const heeftLegeTekst = await leegTekst.isVisible().catch(() => false);
      const heeftTabel = await tabel.isVisible().catch(() => false);

      // Precies een van beide moet zichtbaar zijn
      expect(heeftLegeTekst || heeftTabel).toBeTruthy();
    });

    test("rondes tabel toont verwachte kolommen", async ({ page }) => {
      await page.goto("/evaluatie/admin");
      await page.waitForLoadState("networkidle");

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

  test.describe("Nieuwe ronde aanmaken", () => {
    test("formulier heeft alle benodigde velden", async ({ page }) => {
      await page.goto("/evaluatie/admin/nieuw");

      // Naam veld
      const naamInput = page.locator('input[name="naam"]');
      await expect(naamInput).toBeVisible();
      await expect(naamInput).toHaveAttribute("required", "");

      // Seizoen veld met default waarde
      const seizoenInput = page.locator('input[name="seizoen"]');
      await expect(seizoenInput).toBeVisible();
      await expect(seizoenInput).toHaveValue("2025-2026");

      // Ronde nummer
      const rondeInput = page.locator('input[name="ronde"]');
      await expect(rondeInput).toBeVisible();
      await expect(rondeInput).toHaveAttribute("type", "number");
      await expect(rondeInput).toHaveValue("1");

      // Type dropdown
      const typeSelect = page.locator('select[name="type"]');
      await expect(typeSelect).toBeVisible();

      // Controleer opties
      await expect(typeSelect.locator("option")).toHaveCount(2);
      await expect(typeSelect.locator('option[value="trainer"]')).toHaveText("Trainer-evaluatie");
      await expect(typeSelect.locator('option[value="speler"]')).toHaveText("Speler-zelfevaluatie");

      // Deadline
      const deadlineInput = page.locator('input[name="deadline"]');
      await expect(deadlineInput).toBeVisible();
      await expect(deadlineInput).toHaveAttribute("type", "date");
    });

    test("navigatie via 'Nieuwe ronde' link vanuit overzicht", async ({ page }) => {
      await page.goto("/evaluatie/admin");
      await page.waitForLoadState("networkidle");

      await page.getByRole("link", { name: /Nieuwe ronde/i }).click();

      await expect(page.getByRole("heading", { name: /Nieuwe evaluatieronde/i })).toBeVisible();
      expect(page.url()).toContain("/evaluatie/admin/nieuw");
    });

    test("submit knop is aanwezig en enabled", async ({ page }) => {
      await page.goto("/evaluatie/admin/nieuw");

      const submitKnop = page.getByRole("button", {
        name: /Ronde aanmaken/i,
      });
      await expect(submitKnop).toBeVisible();
      await expect(submitKnop).toBeEnabled();
    });
  });

  test.describe("Coordinatoren beheer", () => {
    test("toevoegen formulier heeft naam en email velden", async ({ page }) => {
      await page.goto("/evaluatie/admin/coordinatoren");
      await page.waitForLoadState("networkidle");

      // Naam input
      const naamInput = page.getByPlaceholder("Naam");
      await expect(naamInput).toBeVisible();

      // Email input
      const emailInput = page.getByPlaceholder("email@voorbeeld.nl");
      await expect(emailInput).toBeVisible();

      // Toevoegen knop
      await expect(page.getByRole("button", { name: /Toevoegen/i })).toBeVisible();
    });

    test("toont lege staat of bestaande coordinatoren", async ({ page }) => {
      await page.goto("/evaluatie/admin/coordinatoren");
      await page.waitForLoadState("networkidle");

      // Of lege tekst of coordinator kaarten
      const legeTekst = page.getByText(/Nog geen coordinatoren/i);
      const kaarten = page.locator(".rounded-lg.border.bg-white.p-4");

      const heeftLegeTekst = await legeTekst.isVisible().catch(() => false);
      const heeftKaarten = (await kaarten.count().catch(() => 0)) > 0;

      expect(heeftLegeTekst || heeftKaarten).toBeTruthy();
    });
  });

  test.describe("E-mail templates beheer", () => {
    test("toont templatelijst met instructie", async ({ page }) => {
      await page.goto("/evaluatie/admin/templates");
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: /E-mail templates/i })).toBeVisible();

      // Instructietekst over {{variabele}} syntax
      await expect(page.getByText(/variabele.*dynamische waarden/i)).toBeVisible();
    });

    test("templates hebben bewerken-knoppen indien aanwezig", async ({ page }) => {
      await page.goto("/evaluatie/admin/templates");
      await page.waitForLoadState("networkidle");

      const templateKaarten = page.locator(".rounded-lg.border.bg-white.p-4");
      const aantalKaarten = await templateKaarten.count();

      if (aantalKaarten === 0) {
        // Geen templates in database
        test.skip();
        return;
      }

      // Elke template moet een "Bewerken" knop hebben
      const eersteKaart = templateKaarten.first();
      await expect(eersteKaart.getByText(/Bewerken/i)).toBeVisible();
    });
  });
});
