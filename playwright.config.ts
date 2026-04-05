import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
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
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "smoke",
      testDir: "./e2e/smoke",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev:web",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: { E2E_TEST: "true" },
  },
});
