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
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "team-indeling",
      testDir: "./e2e/team-indeling",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4100",
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "monitor",
      testDir: "./e2e/monitor",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4102",
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "evaluatie",
      testDir: "./e2e/evaluatie",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4104",
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "pnpm dev:ti",
      port: 4100,
      reuseExistingServer: !process.env.CI,
      env: { E2E_TEST: "true" },
    },
    {
      command: "pnpm dev:monitor",
      port: 4102,
      reuseExistingServer: !process.env.CI,
      env: { E2E_TEST: "true" },
    },
    {
      command: "pnpm dev:evaluatie",
      port: 4104,
      reuseExistingServer: !process.env.CI,
      env: { E2E_TEST: "true" },
    },
  ],
});
