import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * Playwright config voor productie verificatie na deploy.
 * Gebruik: pnpm test:e2e:production
 */
export default defineConfig({
  testDir: "./e2e/verify",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-production-report" }], ["list"]],
  use: {
    baseURL: "https://www.ckvoranjewit.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "nl-NL",
  },
  projects: [
    {
      name: "production-setup",
      testMatch: /production-auth\.setup\.ts/,
    },
    {
      name: "production",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/production.json",
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ["production-setup"],
    },
    {
      name: "production-mobile",
      use: {
        ...devices["Pixel 7"],
        storageState: "./e2e/.auth/production.json",
      },
      dependencies: ["production-setup"],
    },
  ],
});
