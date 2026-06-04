import { test, expect } from "../fixtures/base";

/**
 * TI Studio — Presentatielaag (coverflow) — Smoke Tests
 * De /presentatie pagina is READ-ONLY: een coverflow-carrousel waarmee de TC
 * snel tussen teams schakelt. Geen mutaties, geen drag-drop.
 *
 * Harde design-eis: altijd 3 kaarten leesbaar (links-klein · center-groot ·
 * rechts-klein), geen overlap. Hier toetsen we dat ≥3 slides renderen en er
 * precies één gecentreerd (active) is.
 */

test.describe("TI Studio — Presentatielaag (coverflow)", () => {
  test.setTimeout(120_000);

  test("Flow 1 — Pagina laadt zonder login-redirect (nav zichtbaar)", async ({ page }) => {
    await page.goto("/presentatie", { timeout: 60_000 });

    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav).toBeVisible({ timeout: 20_000 });
    expect(page.url()).not.toContain("/login");
  });

  test("Flow 2 — Coverflow rendert ≥3 kaarten met één gecentreerd", async ({ page }) => {
    await page.goto("/presentatie", { timeout: 60_000 });
    await page.getByRole("navigation", { name: "Hoofdnavigatie" }).waitFor({ timeout: 20_000 });

    // Swiper moet renderen
    const swiper = page.locator(".swiper").first();
    await expect(swiper).toBeVisible({ timeout: 20_000 });

    // Harde eis: minstens 3 kaarten leesbaar
    await expect
      .poll(() => page.locator(".swiper-slide").count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(3);

    // Precies één center-kaart (active)
    await expect(page.locator(".swiper-slide-active")).toHaveCount(1, { timeout: 10_000 });
  });

  test("Flow 3 — Center-kaart toont teaminfo (naam + ♀/♂ pills)", async ({ page }) => {
    await page.goto("/presentatie", { timeout: 60_000 });
    await page.locator(".swiper-slide-active").first().waitFor({ timeout: 20_000 });

    const active = page.locator(".swiper-slide-active").first();
    // Teamnaam — niet leeg
    const tekst = (await active.textContent()) ?? "";
    expect(tekst.trim().length).toBeGreaterThan(0);
    // Geslacht-pills aanwezig (♀ / ♂)
    expect(tekst).toMatch(/[♀♂]/);
  });

  test("Flow 4 — Filterbalk werkt: filteren laat carrousel intact", async ({ page }) => {
    await page.goto("/presentatie", { timeout: 60_000 });
    await page.locator(".swiper").first().waitFor({ timeout: 20_000 });

    // Een herkenbare filterknop (categorie of kleur)
    const filterKnop = page
      .getByRole("button", { name: /^(Senioren|Jeugd|Blauw|Rood|Geel|Groen|Oranje|Alle teams)$/i })
      .first();

    if ((await filterKnop.count()) > 0) {
      await filterKnop.click();
      // Na filteren moet de carrousel blijven werken (geen crash): of slides, of een
      // nette "geen teams in dit filter"-melding.
      await page.waitForTimeout(800);
      const slides = await page.locator(".swiper-slide").count();
      const legeMelding = await page.getByText(/geen teams/i).count();
      expect(slides > 0 || legeMelding > 0).toBeTruthy();
    }
  });

  test("Flow 5 — Read-only: geen draggable spelerkaarten in de carrousel", async ({ page }) => {
    await page.goto("/presentatie", { timeout: 60_000 });
    await page.locator(".swiper").first().waitFor({ timeout: 20_000 });

    // De presentatielaag mag niets sleepbaars bevatten (mutaties horen op /indeling)
    const draggables = await page.locator(".swiper [draggable='true']").count();
    expect(draggables).toBe(0);
  });

  test("Flow 6 — Geen kritieke console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/presentatie", { timeout: 60_000 });
    await page.getByRole("navigation", { name: "Hoofdnavigatie" }).waitFor({ timeout: 20_000 });
    await page.waitForTimeout(1000);

    const critical = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("401") &&
        !e.includes("NetworkError") &&
        !e.includes("WebSocket") &&
        !e.includes("Subscription") &&
        !e.includes("request") &&
        !e.includes("Failed to fetch") &&
        !e.includes("favicon")
    );
    if (critical.length > 0) console.warn("Kritieke console errors:", critical);
    expect(critical).toHaveLength(0);
  });
});
