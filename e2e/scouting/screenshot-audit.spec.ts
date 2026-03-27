import { test } from "../fixtures/base";

const pages = [
  ["home", "/scouting"],
  ["kaarten", "/scouting/kaarten"],
  ["zoek", "/scouting/zoek"],
  ["team", "/scouting/team"],
  ["vergelijking", "/scouting/vergelijking/nieuw"],
  ["verzoeken", "/scouting/verzoeken"],
  ["profiel", "/scouting/profiel"],
];

for (const [name, path] of pages) {
  test(`screenshot: ${name}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle", timeout: 15000 });
    await page.screenshot({ path: `e2e/screenshots/scouting-${name}.png`, fullPage: true });
  });
}
