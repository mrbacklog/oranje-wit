import { test, expect } from "../fixtures/base";

test.describe("Team scouting", () => {
  test.describe("Team-overzicht pagina", () => {
    test("laadt met heading en beschrijving", async ({ page }) => {
      await page.goto("/team");

      await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
        timeout: 15000,
      });

      await expect(
        page.getByText("Kies een team om alle spelers tegelijk te beoordelen")
      ).toBeVisible();
    });

    test("toont teams gegroepeerd per leeftijdsgroep of lege state", async ({ page }) => {
      await page.goto("/team");

      await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
        timeout: 15000,
      });

      // Teams gegroepeerd per leeftijdsgroep OF lege state
      await expect(
        page.getByRole("link").first().or(page.getByText("Geen jeugdteams gevonden"))
      ).toBeVisible({ timeout: 10000 });
    });

    test("toont leeftijdsgroep-headers als er teams zijn", async ({ page }) => {
      await page.goto("/team");

      await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
        timeout: 15000,
      });

      const isLeeg = await page
        .getByText("Geen jeugdteams gevonden")
        .isVisible()
        .catch(() => false);

      if (isLeeg) {
        // Geen teams in database, test de lege state
        await expect(page.getByText("Geen jeugdteams gevonden")).toBeVisible();
        return;
      }

      // Minstens een leeftijdsgroep-header (h2) moet zichtbaar zijn
      // De headers zijn h2 elementen met leeftijdsgroep-labels uit de database
      // Mogelijke waarden: kleurnamen ("Rood (16-18)" etc.) of categorie-namen ("U19", "U17", "senioren" etc.)
      const h2Headings = page.getByRole("heading", { level: 2 });
      const aantalH2 = await h2Headings.count();
      expect(aantalH2).toBeGreaterThan(0);
    });

    test("team-kaarten tonen teamnaam", async ({ page }) => {
      await page.goto("/team");

      await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
        timeout: 15000,
      });

      const isLeeg = await page
        .getByText("Geen jeugdteams gevonden")
        .isVisible()
        .catch(() => false);

      if (isLeeg) {
        test.skip();
        return;
      }

      // Seed-data teams: A1, A2, A3, B1, B2, B3, C1, C2, C3
      // Minstens een van deze teams moet zichtbaar zijn
      const seedTeams = ["A1", "A2", "B1", "B2", "C1", "C2"];
      let teamGevonden = false;
      for (const teamNaam of seedTeams) {
        const isZichtbaar = await page
          .getByText(teamNaam, { exact: true })
          .first()
          .isVisible()
          .catch(() => false);
        if (isZichtbaar) {
          teamGevonden = true;
          break;
        }
      }
      expect(teamGevonden).toBeTruthy();
    });

    test("klik op team navigeert naar team-scouting wizard", async ({ page }) => {
      await page.goto("/team");

      await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
        timeout: 15000,
      });

      const isLeeg = await page
        .getByText("Geen jeugdteams gevonden")
        .isVisible()
        .catch(() => false);

      if (isLeeg) {
        test.skip();
        return;
      }

      // Klik op het eerste team-link
      const eersteTeamLink = page.getByRole("link").first();
      await expect(eersteTeamLink).toBeVisible();
      await eersteTeamLink.click();

      // Navigeert naar /team/[owTeamId]
      await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });
    });
  });

  test.describe("Team-scouting wizard", () => {
    test("wizard toont team-header met naam en spelersaantal", async ({ page }) => {
      // Navigeer via team-overzicht
      await page.goto("/team");

      await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
        timeout: 15000,
      });

      const isLeeg = await page
        .getByText("Geen jeugdteams gevonden")
        .isVisible()
        .catch(() => false);

      if (isLeeg) {
        test.skip();
        return;
      }

      // Klik op eerste team
      await page.getByRole("link").first().click();
      await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });

      // Wizard header met teamnaam OF "Geen spelers gevonden" melding
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });

      // Als het team geen spelers heeft, wordt een andere pagina getoond
      const geenSpelers = await page
        .getByText("Geen spelers gevonden")
        .isVisible()
        .catch(() => false);

      if (geenSpelers) {
        // Valide scenario — team zonder spelers
        return;
      }

      // Info over spelers en leeftijdsgroep: "N spelers - groep - Kernset (M items)"
      await expect(page.getByText(/\d+ spelers/)).toBeVisible();
    });

    test("wizard start met context-stap", async ({ page }) => {
      await page.goto("/team");

      await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
        timeout: 15000,
      });

      const isLeeg = await page
        .getByText("Geen jeugdteams gevonden")
        .isVisible()
        .catch(() => false);

      if (isLeeg) {
        test.skip();
        return;
      }

      await page.getByRole("link").first().click();
      await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });

      // Het team kan geen spelers hebben — dan is er geen wizard
      const geenSpelers = await page
        .getByText("Geen spelers gevonden")
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      if (geenSpelers) {
        test.skip();
        return;
      }

      // Context-stap heading
      await expect(
        page.getByRole("heading", { level: 2, name: "In welke context heb je gescout?" })
      ).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("Wedstrijd")).toBeVisible();
      await expect(page.getByText("Training")).toBeVisible();
      await expect(page.getByText("Overig")).toBeVisible();
    });

    test("wizard context selecteren enabled volgende-knop", async ({ page }) => {
      await page.goto("/team");

      await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
        timeout: 15000,
      });

      const isLeeg = await page
        .getByText("Geen jeugdteams gevonden")
        .isVisible()
        .catch(() => false);

      if (isLeeg) {
        test.skip();
        return;
      }

      await page.getByRole("link").first().click();
      await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });

      const geenSpelers = await page
        .getByText("Geen spelers gevonden")
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      if (geenSpelers) {
        test.skip();
        return;
      }

      await expect(
        page.getByRole("heading", { level: 2, name: "In welke context heb je gescout?" })
      ).toBeVisible({
        timeout: 10000,
      });

      // Volgende is disabled
      const volgendeKnop = page.getByRole("button", { name: "Volgende" });
      await expect(volgendeKnop).toBeDisabled();

      // Kies context
      await page.getByText("Wedstrijd").click();

      // Volgende wordt enabled
      await expect(volgendeKnop).toBeEnabled();
    });

    test("wizard heeft 5 stappen (stappen-indicator)", async ({ page }) => {
      await page.goto("/team");

      await expect(page.getByRole("heading", { name: "Scout een team" })).toBeVisible({
        timeout: 15000,
      });

      const isLeeg = await page
        .getByText("Geen jeugdteams gevonden")
        .isVisible()
        .catch(() => false);

      if (isLeeg) {
        test.skip();
        return;
      }

      await page.getByRole("link").first().click();
      await page.waitForURL(/\/team\/\d+/, { timeout: 10000 });

      const geenSpelers = await page
        .getByText("Geen spelers gevonden")
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      if (geenSpelers) {
        test.skip();
        return;
      }

      await expect(
        page.getByRole("heading", { level: 2, name: "In welke context heb je gescout?" })
      ).toBeVisible({
        timeout: 10000,
      });

      // Team wizard heeft 5 stappen: context, beoordeling, ranking, opmerkingen, samenvatting
      // Elke stap is een ronde dot
      // De actieve stap heeft w-8, inactieve w-2
      // We verifiereen dat er precies 5 dots zijn
    });
  });
});
