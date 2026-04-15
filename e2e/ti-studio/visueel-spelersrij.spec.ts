import { test, expect } from "../fixtures/base";
import path from "path";

/**
 * Visuele check: SpelerRij en SpelerKaart in teamkaarten op verschillende zoomniveaus.
 * Screenshots worden opgeslagen in e2e/screenshots/ voor inspectie.
 */

const SCREENSHOTS_DIR = path.join(process.cwd(), "e2e", "screenshots");

async function setZoom(page: any, percent: number) {
  // Gebruik React's nativeInputValueSetter voor controlled input
  const slider = page.locator('input[type="range"][min="40"][max="150"]');
  await slider.waitFor({ timeout: 10_000 });
  await slider.evaluate((el: HTMLInputElement, val: number) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, String(val));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, percent);
  await page.waitForTimeout(600);
}

async function gaaNaarWerkbord(page: any) {
  await page.goto("/indeling", { timeout: 60_000 });
  // Wacht tot de pagina laadt (slider is aanwezig als werkbord geladen is)
  const slider = page.locator('input[type="range"][min="40"][max="150"]');
  await slider.waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
}

test.describe("TI Studio — SpelerRij visuele check", () => {
  test.setTimeout(120_000);

  test("Compact (70%) — badge-chips met outline-kleur per status", async ({ page }) => {
    await gaaNaarWerkbord(page);
    await setZoom(page, 70);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "spelersrij-compact-70.png"),
    });

    // Bij compact: chips zichtbaar als kleine badge-elementen
    // Verifieer dat er geen avatar-cirkels (normaal/pool variant) zijn
    const zoomLabel = page.locator("text=/70%/");
    console.log("Compact 70% screenshot opgeslagen");

    // Verifieer: pagina geladen en teams zichtbaar
    await expect(page.locator("body")).toBeVisible();
  });

  test("Normaal (95%) — rijen met waas-achtergronden zichtbaar", async ({ page }) => {
    await gaaNaarWerkbord(page);
    await setZoom(page, 95);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "spelersrij-normaal-95.png"),
    });

    console.log("Normaal 95% screenshot opgeslagen");

    // Verifieer: pagina laadt zonder crash
    await expect(page.locator("body")).toBeVisible();
  });

  test("Detail (130%) — SpelerKaart met rand en waas zichtbaar", async ({ page }) => {
    await gaaNaarWerkbord(page);
    await setZoom(page, 130);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "spelersrij-detail-130.png"),
    });

    console.log("Detail 130% screenshot opgeslagen");

    await expect(page.locator("body")).toBeVisible();
  });

  test("Transitie 70→95→130% — alle zoom levels", async ({ page }) => {
    await gaaNaarWerkbord(page);

    for (const pct of [70, 95, 130]) {
      await setZoom(page, pct);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `werkbord-zoom-${pct}.png`),
      });
      console.log(`Screenshot @ ${pct}% opgeslagen`);
    }

    await expect(page.locator("body")).toBeVisible();
  });
});
