import { test } from "../fixtures/base";

test.describe("Visuele controle", () => {
  test.setTimeout(120000);

  const PAGES = [
    { url: "/monitor", name: "dashboard" },
    { url: "/monitor/teams", name: "teams" },
    { url: "/monitor/spelers", name: "spelers" },
    { url: "/monitor/samenstelling", name: "samenstelling" },
    { url: "/monitor/retentie", name: "retentie" },
    { url: "/monitor/signalering", name: "signalering" },
  ];

  // Desktop: alle pagina's in 1 test (deelt browser context, sneller)
  test("desktop screenshots", async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p.url, { timeout: 45000 });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: `e2e/screenshots/monitor-desktop-${p.name}.png`,
        fullPage: true,
      });
    }
  });

  // Mobile: per pagina apart zodat 1 timeout niet alles breekt
  for (const p of PAGES) {
    test(`mobile: ${p.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(p.url, { timeout: 45000 });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: `e2e/screenshots/monitor-mobile-${p.name}.png`,
        fullPage: false, // viewport only, niet fullpage
      });
    });
  }
});
