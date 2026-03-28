import { test, expect } from "@playwright/test";

// Raamwerk-pagina doet server-side database queries via Railway.
const GOTO_OPTS = { waitUntil: "domcontentloaded" as const, timeout: 45_000 };

test.describe("Beheer — Jeugd / Raamwerk", () => {
  test.setTimeout(90_000);

  test("raamwerk-pagina laadt en toont heading", async ({ page }) => {
    await page.goto("/beheer/jeugd/raamwerk", GOTO_OPTS);

    await expect(page.getByRole("heading", { name: "Vaardigheidsraamwerk" })).toBeVisible();
  });

  test("'Nieuw seizoen' knop is zichtbaar", async ({ page }) => {
    await page.goto("/beheer/jeugd/raamwerk", GOTO_OPTS);

    await expect(page.getByRole("button", { name: "Nieuw seizoen" })).toBeVisible();
  });

  test("nieuw seizoen dialog opent en sluit", async ({ page }) => {
    // Dialog test heeft volledige hydration nodig (client component), gebruik "load"
    await page.goto("/beheer/jeugd/raamwerk", { timeout: 60_000 });

    // Wacht tot de button interactief is (hydration compleet)
    const btn = page.getByRole("button", { name: "Nieuw seizoen" });
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();

    // Wacht tot de dialog zichtbaar is (native <dialog> met showModal)
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.locator("h2")).toContainText("Nieuwe raamwerkversie");

    // Formuliervelden aanwezig
    await expect(page.getByLabel("Seizoen")).toBeVisible();
    await expect(page.getByLabel("Naam")).toBeVisible();

    // Annuleren sluit dialog
    await page.getByRole("button", { name: "Annuleren" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("als er versies zijn, toont de tabel ze", async ({ page }) => {
    await page.goto("/beheer/jeugd/raamwerk", GOTO_OPTS);

    // De pagina toont ofwel een tabel met versies, ofwel een lege-staat melding
    const tabel = page.locator("table");
    const leegMelding = page.getByText("Nog geen raamwerkversies");

    await expect(tabel.or(leegMelding)).toBeVisible();
  });
});
