import { test, expect } from "../fixtures/base";

test.describe("Tab deeplinks", () => {
  test("retentie tab via URL param opent juiste tab", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/retentie?tab=instroom", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Ledendynamiek" })).toBeVisible({
      timeout: 15000,
    });

    // Instroom tab moet geselecteerd zijn
    const instroomTab = page.getByRole("tab", { name: "Instroom" });
    await expect(instroomTab).toHaveAttribute("aria-selected", "true");

    // Behoud tab moet NIET geselecteerd zijn
    const behoudTab = page.getByRole("tab", { name: "Behoud" });
    await expect(behoudTab).toHaveAttribute("aria-selected", "false");
  });

  test("tab klik update URL params", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/retentie", { timeout: 45000 });

    // Wacht tot de tabs zichtbaar en interactief zijn (hydration)
    const cohortenTab = page.getByRole("tab", { name: "Cohorten" });
    await expect(cohortenTab).toBeVisible({ timeout: 15000 });

    // Klik op Cohorten tab en wacht tot de URL updatet
    await cohortenTab.click();
    await expect(page).toHaveURL(/tab=cohorten/, { timeout: 10000 });
  });

  test("tab state behouden na page refresh", async ({ page }) => {
    test.setTimeout(60000);
    // Navigeer naar specifieke tab
    await page.goto("/monitor/signalering?tab=werving", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    // Werving tab moet geselecteerd zijn
    await expect(page.getByRole("tab", { name: "Werving" })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    // Refresh pagina
    await page.reload({ timeout: 45000 });

    // Tab moet nog steeds geselecteerd zijn
    await expect(page.getByRole("tab", { name: "Werving" })).toHaveAttribute(
      "aria-selected",
      "true",
      { timeout: 15000 }
    );
  });

  test("projecties tab deeplink werkt", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/projecties?tab=projectie", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Jeugdpijplijn" })).toBeVisible({
      timeout: 15000,
    });

    // Projectie tab moet geselecteerd zijn
    await expect(page.getByRole("tab", { name: "Projectie" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("signalering tabs werken met URL params", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/signalering", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    // Klik door alle tabs en controleer URL
    const tabs = ["Werving", "Retentie", "Pijplijn"];
    for (const tab of tabs) {
      await page.getByRole("tab", { name: tab }).click();
      await expect(page).toHaveURL(new RegExp(`tab=${tab.toLowerCase()}`));
    }

    // Terug naar Overzicht — geen ?tab= in URL
    await page.getByRole("tab", { name: "Overzicht" }).click();
    await expect(page).not.toHaveURL(/tab=/);
  });
});
