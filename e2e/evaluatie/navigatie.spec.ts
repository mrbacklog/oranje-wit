import { test, expect } from "../fixtures/base";

test.describe("Navigatie", () => {
  test("homepagina toont evaluatie dashboard voor TC-gebruiker", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("/evaluatie", { timeout: 60000 });

    // TC-gebruiker ziet AdminDashboard met heading "Evaluaties"
    await expect(page.getByRole("heading", { name: "Evaluaties" })).toBeVisible({ timeout: 15000 });
  });

  test("login pagina laadt correct", async ({ page }) => {
    // De geconsolideerde app heeft een generieke login pagina
    // Een ingelogde gebruiker wordt doorgestuurd; gebruik een nieuw context
    const context = await page.context().browser()!.newContext();
    const loginPage = await context.newPage();

    await loginPage.goto("/login", { timeout: 45000 });

    // Generieke login pagina met verenigingsnaam
    await expect(loginPage.getByRole("heading", { name: /Oranje Wit/i })).toBeVisible({
      timeout: 15000,
    });

    await context.close();
  });

  test.describe("Evaluatie dashboard (TC-gebruiker)", () => {
    test("dashboard toont statistieken", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/evaluatie", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: "Evaluaties" })).toBeVisible({
        timeout: 15000,
      });

      // StatCards zijn zichtbaar (exact: true om strict mode violations te voorkomen)
      await expect(page.getByText("Rondes", { exact: true })).toBeVisible();
      await expect(page.getByText("Ingediend", { exact: true })).toBeVisible();
      await expect(page.getByText("Uitnodigingen", { exact: true })).toBeVisible();
    });

    test("dashboard heeft link naar beheer", async ({ page }) => {
      test.setTimeout(90000);
      await page.goto("/evaluatie", { timeout: 60000 });

      await expect(page.getByRole("heading", { name: "Evaluaties" })).toBeVisible({
        timeout: 15000,
      });

      // "Beheer" link naar /beheer/evaluatie
      await expect(page.getByRole("link", { name: /Beheer/i })).toBeVisible();
    });
  });

  test.describe("Token-beveiligde pagina's", () => {
    test("invullen pagina zonder token toont foutmelding", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/invullen", { timeout: 45000 });

      await expect(page.getByText(/Ongeldige link/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("invullen pagina met ongeldig token toont foutmelding", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/invullen?token=ongeldig-token-12345", { timeout: 45000 });

      await expect(page.getByText(/Verlopen of ongeldige link/i)).toBeVisible({ timeout: 15000 });
    });

    test("zelfevaluatie pagina zonder token toont foutmelding", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/zelf", { timeout: 45000 });

      await expect(page.getByText(/Geen geldige link/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("zelfevaluatie pagina met ongeldig token toont foutmelding", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/zelf?token=ongeldig-token-12345", { timeout: 45000 });

      await expect(page.getByText(/Ongeldige link/i)).toBeVisible({ timeout: 15000 });
    });

    test("coordinator pagina zonder token toont foutmelding", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/coordinator", { timeout: 45000 });

      await expect(page.getByText(/Geen geldige link/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/uitnodigingsmail/i)).toBeVisible();
    });

    test("coordinator pagina met ongeldig token toont foutmelding", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/evaluatie/coordinator?token=ongeldig-token-12345", { timeout: 45000 });

      await expect(page.getByText(/Ongeldige link/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Bedankt pagina's", () => {
    test("trainer bedankt pagina laadt", async ({ page }) => {
      await page.goto("/evaluatie/invullen/bedankt", { timeout: 45000 });

      await expect(page.getByRole("heading", { name: /Bedankt/i })).toBeVisible();
      await expect(page.getByText(/evaluatie.*is ontvangen/i)).toBeVisible();
      await expect(page.getByText(/venster sluiten/i)).toBeVisible();
    });

    test("trainer bedankt pagina toont teamnaam", async ({ page }) => {
      await page.goto("/evaluatie/invullen/bedankt?team=Oranje+Wit+A1", { timeout: 45000 });

      await expect(page.getByRole("heading", { name: /Bedankt/i })).toBeVisible();
      await expect(page.getByText(/Oranje Wit A1/i)).toBeVisible();
    });

    test("zelfevaluatie bedankt pagina laadt", async ({ page }) => {
      await page.goto("/evaluatie/zelf/bedankt", { timeout: 45000 });

      await expect(page.getByRole("heading", { name: /Bedankt/i })).toBeVisible();
      await expect(page.getByText(/zelfevaluatie.*is ontvangen/i)).toBeVisible();
      await expect(page.getByText(/venster sluiten/i)).toBeVisible();
    });
  });
});
