import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/user.json";

// Probeer meerdere poorten — niet alle apps draaien altijd tegelijk
const PORTS = [4100, 4102, 4104, 4106];

async function findAvailablePort(page: import("@playwright/test").Page): Promise<number> {
  for (const port of PORTS) {
    try {
      const response = await page.request.get(`http://localhost:${port}/api/auth/csrf`);
      if (response.ok()) return port;
    } catch {
      // poort niet beschikbaar, volgende proberen
    }
  }
  throw new Error(`Geen beschikbare app gevonden op poorten ${PORTS.join(", ")}`);
}

setup("authenticatie via e2e-test provider", async ({ page }) => {
  const port = await findAvailablePort(page);
  const baseUrl = `http://localhost:${port}`;

  // Ga naar de sign-in pagina om CSRF token op te halen
  await page.goto(`${baseUrl}/api/auth/csrf`);
  const csrfResponse = await page.evaluate(() => document.body.innerText.trim());
  const { csrfToken } = JSON.parse(csrfResponse);

  // Log in via de e2e-test Credentials provider
  // Gebruik page.evaluate zodat cookies (CSRF) automatisch meegaan
  const result = await page.evaluate(
    async ({ csrfToken, email }) => {
      const res = await fetch("/api/auth/callback/e2e-test", {
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

  // Verifieer dat we ingelogd zijn
  await page.goto(`${baseUrl}/`);
  await expect(page).not.toHaveURL(/\/login/);

  // Sla de sessie op voor alle andere tests
  await page.context().storageState({ path: AUTH_FILE });
});
