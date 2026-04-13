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
      testIgnore: ["**/tests/**", "**/ti-studio/**"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "ti-studio",
      testDir: "./e2e/ti-studio",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/user.json",
        baseURL: "http://localhost:3000",
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
    {
      name: "production",
      testMatch: /.*production-verify\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/production.json",
        baseURL: "https://www.ckvoranjewit.app",
      },
      dependencies: ["setup"],
    },
    {
      name: "ti-studio-production-setup",
      testMatch: /.*ti-studio-production-auth\.setup\.ts/,
    },
    {
      name: "ti-studio-production",
      testMatch: /.*ti-studio-production\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/ti-studio-production.json",
        baseURL: "https://teamindeling.ckvoranjewit.app",
      },
      dependencies: ["ti-studio-production-setup"],
    },
  ],
  webServer: [
    {
      command: "pnpm dev:web",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: { E2E_TEST: "true" },
    },
  ],
});
