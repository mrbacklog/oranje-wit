/**
 * Auth setup voor productie verificatie.
 * Injecteert PRODUCTION_SESSION_TOKEN als cookie zodat Playwright ingelogd is.
 */

import { test as setup } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/production.json";

setup("productie sessie laden", async ({ page }) => {
  const token = process.env.PRODUCTION_SESSION_TOKEN;
  if (!token) {
    // In CI geen token aanwezig — schrijf lege storage state zodat andere tests niet falen
    if (process.env.CI) {
      const fs = await import("fs");
      fs.mkdirSync("e2e/.auth", { recursive: true });
      fs.writeFileSync("e2e/.auth/production.json", JSON.stringify({ cookies: [], origins: [] }));
      return;
    }
    throw new Error(
      "PRODUCTION_SESSION_TOKEN niet gevonden in .env.local\n" +
        "1. Log in op https://www.ckvoranjewit.app\n" +
        "2. F12 → Application → Cookies → ow-session → kopieer value\n" +
        "3. Zet in .env.local: PRODUCTION_SESSION_TOKEN=<value>"
    );
  }

  await page.goto("https://www.ckvoranjewit.app/", { timeout: 20000 });

  await page.context().addCookies([
    {
      name: "ow-session",
      value: token,
      domain: "www.ckvoranjewit.app",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);

  await page.context().storageState({ path: AUTH_FILE });
});
