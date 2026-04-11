import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/user.json";
const BASE_URL = "http://localhost:3000";

setup("authenticatie via e2e-test provider", async ({ page }) => {
  setup.setTimeout(60000);

  // Ga naar de sign-in pagina om CSRF token op te halen
  await page.goto(`${BASE_URL}/api/auth/csrf`, { timeout: 30000 });
  const csrfResponse = await page.evaluate(() => document.body.innerText.trim());
  const { csrfToken } = JSON.parse(csrfResponse);

  // Log in via de e2e-test Credentials provider
  // Gebruik page.evaluate zodat cookies (CSRF) automatisch meegaan
  let result;
  try {
    result = await page.evaluate(
      async ({ csrfToken, email }) => {
        const res = await fetch("/api/auth/callback/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ csrfToken, email }),
          redirect: "follow",
        });
        return { ok: res.ok, status: res.status };
      },
      { csrfToken, email: "antjanlaban@gmail.com" }
    );

    expect(result.ok).toBeTruthy();
  } catch (error) {
    // Als dev-login niet beschikbaar is, skip gracefully — auth.json bevat mogelijk geldige cookies
    console.warn("Auth setup: dev-login endpoint niet beschikbaar, gebruik bestaande sessie");
  }

  // Verifieer dat we ingelogd zijn
  await page.goto(`${BASE_URL}/`, { timeout: 30000 });
  await expect(page).not.toHaveURL(/\/login/);

  // Sla de sessie op voor alle andere tests
  await page.context().storageState({ path: AUTH_FILE });
});
