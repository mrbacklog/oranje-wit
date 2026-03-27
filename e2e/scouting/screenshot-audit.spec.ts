import { test } from "../fixtures/base";

const pages = [
  ["home", "/"],
  ["kaarten", "/kaarten"],
  ["zoek", "/zoek"],
  ["team", "/team"],
  ["vergelijking", "/vergelijking/nieuw"],
  ["verzoeken", "/verzoeken"],
  ["profiel", "/profiel"],
];

for (const [name, path] of pages) {
  test(`screenshot: ${name}`, async ({ page }) => {
    await page.goto(`http://localhost:4106${path}`, { waitUntil: "networkidle", timeout: 15000 });
    await page.screenshot({ path: `apps/scouting/screenshots/${name}.png`, fullPage: true });
  });
}
