import { test, expect } from "@playwright/test";

// Helper: inloggen via dev-login (CSRF + POST)
async function devLogin(page: import("@playwright/test").Page) {
  const BASE = "http://localhost:3000";
  await page.goto(`${BASE}/api/auth/csrf`);
  const body = await page.evaluate(() => document.body.innerText.trim());
  const { csrfToken } = JSON.parse(body);

  await page.evaluate(
    async ({ csrfToken, email }) => {
      await fetch("/api/auth/callback/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, email }),
        redirect: "follow",
      });
    },
    { csrfToken, email: "antjanlaban@gmail.com" }
  );

  // Verifieer dat we ingelogd zijn
  await page.goto(`${BASE}/`);
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("Beheer — Systeem / Gebruikers", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
  });

  test("gebruikerslijst is zichtbaar en toont CRUD-knoppen", async ({ page }) => {
    await page.goto("/beheer/systeem/gebruikers");

    // Pagina laadt zonder wit scherm
    await expect(page.locator("h1")).toContainText("Gebruikers");

    // Tabel is zichtbaar
    await expect(page.locator("table")).toBeVisible();

    // Uitnodigen-knop is aanwezig
    await expect(page.getByRole("button", { name: "Uitnodigen" })).toBeVisible();
  });

  test("uitnodigen-dialog opent en sluit", async ({ page }) => {
    await page.goto("/beheer/systeem/gebruikers");

    // Open dialog
    await page.getByRole("button", { name: "Uitnodigen" }).click();
    await expect(page.getByText("Gebruiker uitnodigen")).toBeVisible();

    // Formuliervelden aanwezig
    await expect(page.getByLabel("E-mailadres")).toBeVisible();
    await expect(page.getByLabel("Naam")).toBeVisible();

    // Annuleren sluit dialog
    await page.getByRole("button", { name: "Annuleren" }).click();
    await expect(page.getByText("Gebruiker uitnodigen")).not.toBeVisible();
  });
});
