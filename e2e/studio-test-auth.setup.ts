/**
 * Auth setup voor studio-test.ckvoranjewit.app
 *
 * Vereiste env vars:
 *   STUDIO_TEST_URL              (default: https://studio-test.ckvoranjewit.app)
 *   STUDIO_TEST_BASIC_AUTH_USER
 *   STUDIO_TEST_BASIC_AUTH_PASS
 *   STUDIO_TEST_AGENT_SECRET
 *
 * Werkwijze:
 *   1. Voeg Basic-Auth header toe aan alle requests
 *   2. Haal CSRF-token op via /api/auth/csrf
 *   3. POST naar /api/auth/callback/agent-login met secret
 *   4. Zet __ow_agent_run_id cookie
 *   5. Sla storage state op in e2e/.auth/studio-test.json
 */

import { test as setup } from "@playwright/test";
import * as fs from "fs";
import * as crypto from "crypto";

const AUTH_FILE = "e2e/.auth/studio-test.json";

setup("studio-test auth — Basic Auth + agent-login", async ({ page }) => {
  const baseUrl = process.env.STUDIO_TEST_URL ?? "https://studio-test.ckvoranjewit.app";
  const user = process.env.STUDIO_TEST_BASIC_AUTH_USER ?? "";
  const pass = process.env.STUDIO_TEST_BASIC_AUTH_PASS ?? "";
  const secret = process.env.STUDIO_TEST_AGENT_SECRET ?? "";

  // Graceful skip als secrets ontbreken
  if (!user || !pass || !secret) {
    console.log(
      "STUDIO_TEST secrets niet gezet (STUDIO_TEST_BASIC_AUTH_USER / STUDIO_TEST_BASIC_AUTH_PASS / STUDIO_TEST_AGENT_SECRET) — skipping"
    );
    fs.mkdirSync("e2e/.auth", { recursive: true });
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    setup.skip(true, "STUDIO_TEST secrets niet gezet");
    return;
  }

  const agentRunId = crypto.randomUUID();
  console.log(`[studio-test-auth] agentRunId: ${agentRunId}`);

  // Basic Auth header op alle requests
  const basicAuth = Buffer.from(`${user}:${pass}`).toString("base64");
  await page.setExtraHTTPHeaders({
    Authorization: `Basic ${basicAuth}`,
  });

  // Stap 1: Haal CSRF-token op
  const csrfUrl = `${baseUrl}/api/auth/csrf`;
  await page.goto(csrfUrl, { timeout: 30_000 });
  const csrfBody = await page.textContent("body");
  let csrfToken = "";
  try {
    const parsed = JSON.parse(csrfBody ?? "{}") as { csrfToken?: string };
    csrfToken = parsed.csrfToken ?? "";
  } catch {
    console.error("[studio-test-auth] Kon CSRF-token niet parsen:", csrfBody);
    throw new Error("CSRF-token ophalen mislukt");
  }

  if (!csrfToken) {
    throw new Error(`CSRF-token leeg — antwoord: ${csrfBody}`);
  }
  console.log(`[studio-test-auth] CSRF-token ontvangen (${csrfToken.length} tekens)`);

  // Stap 2: POST naar agent-login callback
  const loginResult = await page.evaluate(
    async ({
      callbackUrl,
      csrfToken,
      secret,
      basicAuth,
    }: {
      callbackUrl: string;
      csrfToken: string;
      secret: string;
      basicAuth: string;
    }) => {
      const res = await fetch(callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({ csrfToken, secret }).toString(),
        redirect: "follow",
        credentials: "include",
      });
      return { ok: res.ok, status: res.status, url: res.url };
    },
    {
      callbackUrl: `${baseUrl}/api/auth/callback/agent-login`,
      csrfToken,
      secret,
      basicAuth,
    }
  );

  console.log(
    `[studio-test-auth] agent-login: status=${loginResult.status}, ok=${loginResult.ok}, url=${loginResult.url}`
  );

  if (!loginResult.ok && loginResult.status !== 200) {
    // NextAuth kan redirecten na succesvolle login (302 → 200 na follow)
    // status 200 op eindbestemming is OK
    if (loginResult.status >= 400) {
      throw new Error(`agent-login mislukt: status=${loginResult.status}, url=${loginResult.url}`);
    }
  }

  // Stap 3: Zet __ow_agent_run_id cookie
  await page.context().addCookies([
    {
      name: "__ow_agent_run_id",
      value: agentRunId,
      domain: new URL(baseUrl).hostname,
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "Lax",
    },
  ]);

  // Stap 4: Verifieer login door naar homepage te gaan
  await page.goto(baseUrl, { timeout: 30_000 });
  const finalUrl = page.url();
  console.log(`[studio-test-auth] Eindpagina na login: ${finalUrl}`);

  // Stap 5: Sla storage state op
  fs.mkdirSync("e2e/.auth", { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`[studio-test-auth] Storage state opgeslagen in ${AUTH_FILE}`);
  console.log(`[studio-test-auth] agentRunId voor cleanup: ${agentRunId}`);
});
