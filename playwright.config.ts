import { defineConfig, devices } from "@playwright/test";

// Detecteer welk project getest wordt via --project flag
const args = process.argv.join(" ");
const hasProjectFlag = args.includes("--project");

function needsServer(app: string): boolean {
  if (!hasProjectFlag) return true;
  return args.includes(`--project=${app}`) || args.includes(`--project ${app}`);
}

type WebServerConfig = {
  command: string;
  port: number;
  reuseExistingServer: boolean;
  env: Record<string, string>;
};

const webServers: WebServerConfig[] = [];

if (needsServer("team-indeling")) {
  webServers.push({
    command: "pnpm dev:ti",
    port: 4100,
    reuseExistingServer: !process.env.CI,
    env: { E2E_TEST: "true" },
  });
}

if (needsServer("monitor")) {
  webServers.push({
    command: "pnpm dev:monitor",
    port: 4102,
    reuseExistingServer: !process.env.CI,
    env: { E2E_TEST: "true" },
  });
}

if (needsServer("evaluatie")) {
  webServers.push({
    command: "pnpm dev:evaluatie",
    port: 4104,
    reuseExistingServer: !process.env.CI,
    env: { E2E_TEST: "true" },
  });
}

if (needsServer("scouting")) {
  webServers.push({
    command: "pnpm dev:scouting",
    port: 4106,
    reuseExistingServer: !process.env.CI,
    env: { E2E_TEST: "true" },
  });
}

// Auth setup heeft minstens één server nodig
if (webServers.length === 0) {
  webServers.push({
    command: "pnpm dev:ti",
    port: 4100,
    reuseExistingServer: !process.env.CI,
    env: { E2E_TEST: "true" },
  });
}

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
    {
      name: "scouting",
      testDir: "./e2e/scouting",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4106",
        storageState: "./e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: webServers,
});
