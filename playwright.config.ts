import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    trace: "on-first-retry",
    locale: "nl-NL",
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "web",
      testIgnore: ["**/tests/**"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "design-system",
      testDir: "./e2e/tests",
      use: {
        ...devices["Desktop Chrome"],
        // Geen storageState — design-system pagina heeft geen auth nodig
      },
      // Geen dependencies op setup — geen auth vereist
    },
  ],
  webServer: {
    command: "pnpm dev:web",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    env: { E2E_TEST: "true" },
  },
});
