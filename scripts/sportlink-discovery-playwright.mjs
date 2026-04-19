/**
 * Sportlink API Discovery via Playwright
 *
 * Logt in op clubweb.sportlink.com, navigeert door de UI,
 * en onderschept alle API calls naar Navajo endpoints.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");

const CLUBWEB_URL = "https://clubweb.sportlink.com";
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-discovery-playwright.mjs <email> <password>");
  process.exit(1);
}

// Verzamel alle unieke API calls
const apiCalls = new Map(); // entity -> { method, url, requestBody, responseKeys, responsePreview }

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // ── Onderschep ALLE network requests ───────────────────────────────────────
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/navajo/") || url.includes("/api/")) {
      const entity = req.headers()["x-navajo-entity"] || extractEntityFromUrl(url);
      const method = req.method();
      const key = `${method} ${entity || url}`;

      if (!apiCalls.has(key)) {
        let body = null;
        try {
          body = req.postData();
        } catch {}
        apiCalls.set(key, {
          method,
          url: url.length > 120 ? url.slice(0, 120) + "..." : url,
          entity,
          requestBody: body ? safeParse(body) : null,
          response: null,
        });
        console.log(`→ ${method} ${entity || url.slice(0, 100)}`);
      }
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (!url.includes("/navajo/") && !url.includes("/api/")) return;

    const req = res.request();
    const entity = req.headers()["x-navajo-entity"] || extractEntityFromUrl(url);
    const method = req.method();
    const key = `${method} ${entity || url}`;

    try {
      const contentType = res.headers()["content-type"] || "";
      if (contentType.includes("json") || contentType.includes("text")) {
        const text = await res.text();
        const data = safeParse(text);
        if (apiCalls.has(key)) {
          const entry = apiCalls.get(key);
          entry.response = {
            status: res.status(),
            keys: data && typeof data === "object" ? Object.keys(data).slice(0, 30) : null,
            preview: typeof data === "object" ? truncObj(data) : String(data).slice(0, 300),
            size: text.length,
          };
        }
        console.log(`  ← ${res.status()} (${text.length} bytes) ${entity || ""}`);
      }
    } catch {}
  });

  // ── Stap 1: Login ──────────────────────────────────────────────────────────
  console.log("\n═══ STAP 1: Inloggen ═══\n");
  await page.goto(CLUBWEB_URL);
  await page.waitForLoadState("networkidle");

  // Keycloak login form
  try {
    await page.fill('input[name="username"]', email, { timeout: 10000 });
    await page.fill('input[name="password"]', password);
    await page.click('input[type="submit"], button[type="submit"]');
    console.log("✓ Credentials ingevoerd");
  } catch (e) {
    console.log("Login form niet gevonden, mogelijk al ingelogd");
  }

  // OTP skip als nodig
  try {
    const otpForm = await page.waitForSelector('form[action*="authenticate"]', { timeout: 5000 });
    if (otpForm) {
      await page.click('input[type="submit"], button[type="submit"]');
      console.log("✓ OTP overgeslagen");
    }
  } catch {
    // Geen OTP pagina
  }

  // Wacht tot clubweb geladen is
  await page.waitForLoadState("networkidle");
  await delay(3000);
  console.log("✓ Clubweb geladen:", page.url());

  // ── Stap 2: Screenshot van de hoofdpagina ──────────────────────────────────
  await page.screenshot({ path: "scripts/sportlink-discovery-home.png", fullPage: true });
  console.log("✓ Screenshot: sportlink-discovery-home.png");

  // ── Stap 3: Zoek alle navigatie-elementen ──────────────────────────────────
  console.log("\n═══ STAP 2: Navigatie verkennen ═══\n");

  // Zoek alle klikbare menu-items, tabs, links
  const navItems = await page.evaluate(() => {
    const items = [];
    // Menu items
    document
      .querySelectorAll(
        "nav a, .menu a, .sidebar a, [role='tab'], [role='menuitem'], .nav-item, .tab, button[class*='tab'], button[class*='menu'], a[class*='nav'], a[class*='menu']"
      )
      .forEach((el) => {
        items.push({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 80),
          href: el.href || null,
          id: el.id || null,
          class: el.className?.toString().slice(0, 80),
        });
      });
    // Als er geen standaard nav is, zoek alle links en buttons
    if (items.length < 5) {
      document.querySelectorAll("a[href], button").forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 1 && text.length < 50) {
          items.push({
            tag: el.tagName,
            text,
            href: el.href || null,
            id: el.id || null,
            class: el.className?.toString().slice(0, 80),
          });
        }
      });
    }
    return items;
  });

  console.log(`Gevonden: ${navItems.length} navigatie-elementen\n`);
  for (const item of navItems.slice(0, 50)) {
    console.log(`  ${item.tag} "${item.text}" ${item.href || ""}`);
  }

  // ── Stap 4: Klik door alle navigatie-items ─────────────────────────────────
  console.log("\n═══ STAP 3: Pagina's doorlopen ═══\n");

  // Verzamel unieke link-teksten om door te klikken
  const clickTargets = [...new Set(navItems.map((i) => i.text).filter((t) => t && t.length > 1))];

  for (const target of clickTargets.slice(0, 30)) {
    try {
      const el = await page.$(`text="${target}"`);
      if (!el) continue;

      // Check of het zichtbaar is
      const visible = await el.isVisible().catch(() => false);
      if (!visible) continue;

      console.log(`\n── Klikken: "${target}" ──`);
      await el.click({ timeout: 3000 });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      await delay(1500);

      // Screenshot
      const safeName = target.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
      await page.screenshot({
        path: `scripts/sportlink-discovery-${safeName}.png`,
        fullPage: true,
      });

      // Zoek sub-tabs/sub-menu's
      const subItems = await page.evaluate(() => {
        const subs = [];
        document
          .querySelectorAll("[role='tab'], .tab-item, .sub-tab, button[class*='tab']")
          .forEach((el) => {
            const text = el.textContent?.trim();
            if (text && text.length > 1) subs.push(text);
          });
        return [...new Set(subs)];
      });

      if (subItems.length > 0) {
        console.log(`  Sub-items: ${subItems.join(", ")}`);
        for (const sub of subItems.slice(0, 10)) {
          try {
            const subEl = await page.$(`text="${sub}"`);
            if (subEl && (await subEl.isVisible())) {
              console.log(`  → Klikken sub: "${sub}"`);
              await subEl.click({ timeout: 2000 });
              await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
              await delay(1000);
            }
          } catch {}
        }
      }
    } catch (e) {
      // Skip als klikken mislukt
    }
  }

  // ── Stap 5: Probeer ook specifieke lid-pagina te openen ────────────────────
  console.log("\n═══ STAP 4: Lid-detail proberen ═══\n");

  // Probeer een lid aan te klikken in de ledenlijst
  try {
    // Zoek naar een tabel rij of lijst item
    const rows = await page.$$("tr[class*='member'], tr[data-id], .member-row, .list-item");
    if (rows.length > 0) {
      console.log(`${rows.length} leden-rijen gevonden, klik eerste...`);
      await rows[0].click();
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      await delay(2000);
      await page.screenshot({ path: "scripts/sportlink-discovery-lid-detail.png", fullPage: true });
    }
  } catch {}

  // ── Resultaten ─────────────────────────────────────────────────────────────
  console.log("\n\n═══════════════════════════════════════════════════════");
  console.log("═══ RESULTATEN: Alle onderschepte API calls ═══");
  console.log("═══════════════════════════════════════════════════════\n");

  const sorted = [...apiCalls.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  for (const [key, call] of sorted) {
    console.log(`\n─── ${key} ───`);
    console.log(`URL: ${call.url}`);
    if (call.entity) console.log(`Entity: ${call.entity}`);
    if (call.requestBody) {
      console.log(
        `Request body keys: ${typeof call.requestBody === "object" ? Object.keys(call.requestBody).join(", ") : "n/a"}`
      );
    }
    if (call.response) {
      console.log(`Response: ${call.response.status} (${call.response.size} bytes)`);
      if (call.response.keys) console.log(`Response keys: ${call.response.keys.join(", ")}`);
      console.log(`Preview: ${call.response.preview}`);
    }
  }

  console.log(`\n\nTotaal: ${apiCalls.size} unieke API calls onderschept`);

  // Sla resultaten op als JSON
  const output = Object.fromEntries(
    sorted.map(([key, call]) => [
      key,
      {
        ...call,
        response: call.response
          ? {
              status: call.response.status,
              keys: call.response.keys,
              size: call.response.size,
            }
          : null,
      },
    ])
  );

  const fs = await import("fs");
  fs.writeFileSync("scripts/sportlink-discovery-results.json", JSON.stringify(output, null, 2));
  console.log("\n✓ Resultaten opgeslagen in scripts/sportlink-discovery-results.json");

  await browser.close();
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function extractEntityFromUrl(url) {
  const match = url.match(/\/clubweb\/(.+?)(\?|$)/);
  return match ? match[1] : null;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function truncObj(obj) {
  if (!obj || typeof obj !== "object") return String(obj).slice(0, 200);
  const keys = Object.keys(obj);
  const entries = keys.slice(0, 8).map((k) => {
    const v = obj[k];
    if (v === null) return `${k}: null`;
    if (typeof v === "string") return `${k}: "${v.slice(0, 40)}"`;
    if (typeof v === "number" || typeof v === "boolean") return `${k}: ${v}`;
    if (Array.isArray(v)) return `${k}: Array(${v.length})`;
    if (typeof v === "object") return `${k}: {${Object.keys(v).length} keys}`;
    return `${k}: ${typeof v}`;
  });
  return `{ ${entries.join(", ")}${keys.length > 8 ? ", ..." : ""} }`;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

run().catch((e) => {
  console.error("✗ Fout:", e.message);
  process.exit(1);
});
