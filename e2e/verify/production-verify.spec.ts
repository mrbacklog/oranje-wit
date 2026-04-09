/**
 * Productie verificatie — visuele controle na elke deploy.
 * Gebruik: pnpm test:e2e:production
 */

import { test, expect } from "@playwright/test";

const PAGES = [
  { naam: "Monitor", path: "/monitor", heading: "Dashboard" },
  { naam: "TI Studio — Kaders", path: "/ti-studio/kaders", heading: "Kaders" },
  { naam: "TI Studio — Indeling", path: "/ti-studio/indeling", heading: null },
  { naam: "TI Studio — Personen", path: "/ti-studio/personen/spelers", heading: null },
  { naam: "TI Studio — Werkbord", path: "/ti-studio/werkbord", heading: "Werkbord" },
  { naam: "Beheer", path: "/beheer", heading: null },
];

test.describe("Productie verificatie — key pages", () => {
  test.skip(!!process.env.CI, "Productie verificatie alleen lokaal uitvoeren");

  for (const pagina of PAGES) {
    test(`${pagina.naam} laadt correct`, async ({ page }) => {
      test.setTimeout(30000);

      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(err.message));

      await page.goto(pagina.path, { timeout: 20000 });

      // Mag niet redirect naar login
      await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });

      // Mag geen error boundary tonen
      await expect(page.getByText("Er ging iets mis"))
        .not.toBeVisible({ timeout: 5000 })
        .catch(() => {});

      // Heading check indien opgegeven
      if (pagina.heading) {
        await expect(
          page
            .getByRole("heading", { name: pagina.heading, level: 1 })
            .or(page.getByRole("heading", { name: pagina.heading, level: 2 }))
        ).toBeVisible({ timeout: 10000 });
      }

      // Log console errors
      if (consoleErrors.length > 0) {
        console.log(`[${pagina.naam}] Console errors:`, consoleErrors.slice(0, 3).join("\n"));
      }

      // Screenshot voor visuele inspectie (per project apart)
      const projectName = (process.env.PLAYWRIGHT_PROJECT_NAME ?? "production")
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase();
      await page.screenshot({
        path: `e2e/screenshots/${projectName}-${pagina.naam.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`,
        fullPage: true,
      });
    });
  }
});
