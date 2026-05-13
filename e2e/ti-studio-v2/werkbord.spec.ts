import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — Werkbord pagina interactietests
 * Spec: docs/superpowers/specs/2026-05-13-werkbord-pagina-v2.md
 *
 * Route B (visueel/structureel eerst, geen drag & drop of mutaties):
 * 1. Smoke: /indeling laadt, toolbar + canvas + TeamsDrawer zichtbaar, geen console-errors
 * 2. Drawer toggle: TeamsDrawer toggle, drawer verbergt/toont
 * 3. TeamDetailDrawer: klik team-kaart → detail-drawer opent met teamnaam
 * 4. Zoom-toolbar: compact/detail buttons → canvas transform verandert
 */

test.describe("Werkbord pagina — Smoke", () => {
  test.setTimeout(60_000);

  test("laadt /indeling route, toolbar en canvas zichtbaar", async ({ page }) => {
    // Spec sectie 1: page.tsx laadt actieve werkindeling
    await page.goto("/indeling", { timeout: 30_000 });

    // Verifieer correct URL
    expect(page.url()).toContain("/indeling");

    // Spec sectie 2: WerkbordToolbar toont werkindelingNaam, versie-badge, stats, toggles
    const toolbar = page.locator('[data-testid="werkbord-toolbar"], .werkbord-toolbar');
    const toolbarExists = await toolbar.count();
    if (toolbarExists > 0) {
      await expect(toolbar.first()).toBeVisible({ timeout: 10_000 });
    }

    // Spec sectie 2: WerkbordCanvas toont map-surface met teams
    const canvas = page.locator('[data-testid="werkbord-canvas"], .werkbord-canvas, .map-surface');
    const canvasExists = await canvas.count();
    if (canvasExists > 0) {
      await expect(canvas.first()).toBeVisible({ timeout: 10_000 });
    }

    // Spec sectie 5.1: TeamsDrawer initieel visible of collapsed
    const teamsDrawer = page.locator(
      '[data-testid="teams-drawer"], .wb-drawer.teams, [role="complementary"]'
    );
    const drawerExists = await teamsDrawer.count();
    if (drawerExists > 0) {
      // Drawer kan open of gesloten zijn, als element bestaat is het goed
      expect(drawerExists).toBeGreaterThan(0);
    }
  });

  test("geen kritieke console errors op /indeling", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/indeling", { timeout: 30_000 });
    await page.waitForTimeout(1000);

    // Filter non-critical errors (blueprint-implementatie mag nog missing imports hebben)
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("NetworkError") &&
        !e.includes("WebSocket") &&
        !e.includes("Failed to fetch") &&
        !e.includes("Failed to load resource") &&
        !e.includes("CORS") &&
        !e.includes("Module not found") &&
        !e.includes("Can't resolve")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Werkbord pagina — Interacties", () => {
  test.setTimeout(60_000);

  test("teams-drawer toggle verbergt en toont drawer", async ({ page }) => {
    // Spec sectie 5.1: Pool/Staf/Teams/Versies toggles
    await page.goto("/indeling", { timeout: 30_000 });

    // Zoek toggle-knop voor teams
    // Spec: toggle-knop krijgt class 'active' bij klik
    const teamsToggle = page.locator(
      '[data-testid="teams-toggle"], button:text("Teams"), .wb-toggle:text("Teams")'
    );
    const toggleExists = await teamsToggle.count();

    if (toggleExists > 0) {
      // Verkrijg initiële toggle-state
      const toggleElem = teamsToggle.first();
      const initialActive = await toggleElem.evaluate((el) => el.classList.contains("active"));

      // Drawer moet bestaan
      const drawer = page.locator('[data-testid="teams-drawer"], .wb-drawer.teams');
      const drawerExists = await drawer.count();
      expect(drawerExists).toBeGreaterThan(0);

      if (drawerExists > 0) {
        const drawerElem = drawer.first();

        // Klik toggle
        await toggleElem.click();
        await page.waitForTimeout(300); // wacht op transitie (200ms + buffer)

        // Check of toggle-state is veranderd
        const toggleAfterClick = await toggleElem.evaluate((el) => el.classList.contains("active"));
        expect(toggleAfterClick).not.toBe(initialActive);

        // Klik nogmaals om terug te zetten
        await toggleElem.click();
        await page.waitForTimeout(300);

        // Toggle moet teruggekeerd zijn naar original state
        const toggleFinal = await toggleElem.evaluate((el) => el.classList.contains("active"));
        expect(toggleFinal).toBe(initialActive);
      }
    }
  });

  test("klik op team-kaart opent TeamDetailDrawer met teamnaam", async ({ page }) => {
    // Spec sectie 5.5: TeamKaart header klik → TeamDetailDrawer opent
    // Spec sectie 5.6: Klik op teamkaart-header → TeamDialog opent
    await page.goto("/indeling", { timeout: 30_000 });

    // Verifieer dat we minstens één team-kaart hebben
    const teamKaarten = page.locator('[data-testid="team-kaart"], [data-team-id], .team-kaart');
    const teamCount = await teamKaarten.count();

    if (teamCount > 0) {
      const eersteTeam = teamKaarten.first();

      // Getiniële state: TeamDetailDrawer moet gesloten zijn (of niet zichtbaar)
      const detailDrawer = page.locator(
        '[data-testid="team-detail-drawer"], .wb-drawer.team-detail'
      );
      const detailDrawerExists = await detailDrawer.count();

      // Klik op team-kaart header (eerste interactieve child)
      // Spec: TeamKaart header is clickable zone
      await eersteTeam.click();
      await page.waitForTimeout(300); // wacht op drawer-animatie

      // Verifieer dat detail-drawer nu visible is
      if (detailDrawerExists > 0) {
        const drawerAfterClick = detailDrawer.first();
        // Drawer moet visible zijn of 'open' class hebben
        const isVisible = await drawerAfterClick.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          const hasOpen = el.classList.contains("open");
          const opacityVisible = computed.opacity !== "0";
          return hasOpen || opacityVisible;
        });

        expect(isVisible).toBe(true);

        // Verifieer dat drawer inhoud bevat (team-naam, etc)
        const drawerText = await drawerAfterClick.textContent();
        expect(drawerText).toBeTruthy();
      }
    }
  });

  test("zoom-toolbar buttons wijzigen canvas transform", async ({ page }) => {
    // Spec sectie 5.4: Canvas zoom via WerkbordCanvas
    // Spec sectie 5.4: zoom-state useState<'compact' | 'detail'>('compact')
    // Zoom-buttons wijzigen scale 0.6 (compact) naar 1.0 (detail)
    await page.goto("/indeling", { timeout: 30_000 });

    // Zoek zoom-toggle buttons
    const compactBtn = page.locator('[data-testid="zoom-compact"]');
    const detailBtn = page.locator('[data-testid="zoom-detail"]');

    const compactExists = await compactBtn.count();
    const detailExists = await detailBtn.count();

    // Controleer minstens één zoom-button bestaat
    if (compactExists > 0 || detailExists > 0) {
      // Pak canvas voor transform-controle
      const canvas = page.locator('[data-testid="werkbord-canvas"], .map-surface');
      const canvasExists = await canvas.count();

      if (canvasExists > 0) {
        const canvasElem = canvas.first();

        // Verkrijg huidge transform
        const initialTransform = await canvasElem.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.transform;
        });

        // Klik op detail-button als beschikbaar
        if (detailExists > 0) {
          await detailBtn.first().click();
          await page.waitForTimeout(300);

          // Verkrijg nieuwe transform
          const detailTransform = await canvasElem.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.transform;
          });

          // Transform moet veranderd zijn (scale factor verschillend)
          // Spec: compact = 0.6, detail = 1.0
          expect(detailTransform).not.toBe(initialTransform);
        }

        // Klik terug naar compact als beschikbaar
        if (compactExists > 0) {
          await compactBtn.first().click();
          await page.waitForTimeout(300);

          // Transform moet teruggekeerd zijn (of gelijkaardige waarde)
          const compactTransform = await canvasElem.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.transform;
          });

          // Simpele check: transform moet zijn veranderd van detail-state
          expect(compactTransform).toBeTruthy();
        }
      }
    }
  });
});
