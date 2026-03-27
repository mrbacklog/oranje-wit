import { test, expect } from "../fixtures/base";

test.describe("Navigatie", () => {
  test("homepagina toont evaluatie titel", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Evaluatie/);
    await expect(page.getByRole("heading", { name: "Evaluatie" })).toBeVisible();
    await expect(page.getByText("c.k.v. Oranje Wit")).toBeVisible();
  });

  test("login pagina laadt correct", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /Evaluatie.*Admin/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Inloggen met Google/i })).toBeVisible();
  });

  test.describe("Admin pagina's", () => {
    test("admin rondes overzicht laadt", async ({ page }) => {
      await page.goto("/admin");
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: "Evaluatierondes" })).toBeVisible();

      // De "Nieuwe ronde" link moet zichtbaar zijn
      await expect(page.getByRole("link", { name: /Nieuwe ronde/i })).toBeVisible();
    });

    test("admin layout bevat navigatielinks", async ({ page }) => {
      await page.goto("/admin");

      const nav = page.locator("header nav");
      await expect(nav.getByText("Evaluatie")).toBeVisible();
      await expect(nav.getByRole("link", { name: "Rondes" })).toBeVisible();
      await expect(nav.getByRole("link", { name: /rdinatoren/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: /E-mail templates/i })).toBeVisible();
    });

    test("admin nieuwe ronde pagina laadt", async ({ page }) => {
      await page.goto("/admin/nieuw");

      await expect(page.getByRole("heading", { name: /Nieuwe evaluatieronde/i })).toBeVisible();

      // Formuliervelden controleren
      await expect(page.getByText("Naam")).toBeVisible();
      await expect(page.getByText("Seizoen")).toBeVisible();
      await expect(page.getByText("Ronde nummer")).toBeVisible();
      await expect(page.getByText("Type")).toBeVisible();
      await expect(page.getByText("Deadline")).toBeVisible();

      // Submit knop
      await expect(page.getByRole("button", { name: /Ronde aanmaken/i })).toBeVisible();
    });

    test("admin coordinatoren pagina laadt", async ({ page }) => {
      await page.goto("/admin/coordinatoren");
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: "Coordinatoren" })).toBeVisible();

      // Toevoegen formulier is zichtbaar
      await expect(page.getByRole("button", { name: /Toevoegen/i })).toBeVisible();
    });

    test("admin templates pagina laadt", async ({ page }) => {
      await page.goto("/admin/templates");
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: /E-mail templates/i })).toBeVisible();

      // Instructietekst over variabelen
      await expect(page.getByText(/Gebruik.*variabele/i)).toBeVisible();
    });

    test("navigatie tussen admin pagina's werkt", async ({ page }) => {
      await page.goto("/admin");
      await page.waitForLoadState("networkidle");

      // Naar coordinatoren
      await page.getByRole("link", { name: /rdinatoren/i }).click();
      await expect(page.getByRole("heading", { name: "Coordinatoren" })).toBeVisible();

      // Naar templates
      await page.getByRole("link", { name: /E-mail templates/i }).click();
      await expect(page.getByRole("heading", { name: /E-mail templates/i })).toBeVisible();

      // Terug naar rondes
      await page.getByRole("link", { name: "Rondes" }).click();
      await expect(page.getByRole("heading", { name: "Evaluatierondes" })).toBeVisible();
    });
  });

  test.describe("Token-beveiligde pagina's", () => {
    test("invullen pagina zonder token toont foutmelding", async ({ page }) => {
      await page.goto("/invullen");

      await expect(page.getByText(/Ongeldige link/i)).toBeVisible();
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("invullen pagina met ongeldig token toont foutmelding", async ({ page }) => {
      await page.goto("/invullen?token=ongeldig-token-12345");

      await expect(page.getByText(/Verlopen of ongeldige link/i)).toBeVisible();
    });

    test("zelfevaluatie pagina zonder token toont foutmelding", async ({ page }) => {
      await page.goto("/zelf");

      await expect(page.getByText(/Geen geldige link/i)).toBeVisible();
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("zelfevaluatie pagina met ongeldig token toont foutmelding", async ({ page }) => {
      await page.goto("/zelf?token=ongeldig-token-12345");

      await expect(page.getByText(/Ongeldige link/i)).toBeVisible();
    });

    test("coordinator pagina zonder token toont foutmelding", async ({ page }) => {
      await page.goto("/coordinator");

      await expect(page.getByText(/Geen geldige link/i)).toBeVisible();
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("coordinator pagina met ongeldig token toont foutmelding", async ({ page }) => {
      await page.goto("/coordinator?token=ongeldig-token-12345");

      await expect(page.getByText(/Ongeldige link/i)).toBeVisible();
    });
  });

  test.describe("Bedankt pagina's", () => {
    test("trainer bedankt pagina laadt", async ({ page }) => {
      await page.goto("/invullen/bedankt");

      await expect(page.getByRole("heading", { name: /Bedankt/i })).toBeVisible();
      await expect(page.getByText(/evaluatie.*is ontvangen/i)).toBeVisible();
      await expect(page.getByText(/venster sluiten/i)).toBeVisible();
    });

    test("trainer bedankt pagina toont teamnaam", async ({ page }) => {
      await page.goto("/invullen/bedankt?team=Oranje+Wit+A1");

      await expect(page.getByRole("heading", { name: /Bedankt/i })).toBeVisible();
      await expect(page.getByText(/Oranje Wit A1/i)).toBeVisible();
    });

    test("zelfevaluatie bedankt pagina laadt", async ({ page }) => {
      await page.goto("/zelf/bedankt");

      await expect(page.getByRole("heading", { name: /Bedankt/i })).toBeVisible();
      await expect(page.getByText(/zelfevaluatie.*is ontvangen/i)).toBeVisible();
      await expect(page.getByText(/venster sluiten/i)).toBeVisible();
    });
  });
});
