import { test, expect } from "../fixtures/base";

test.describe("Tab deeplinks", () => {
  test("retentie tab via URL param opent juiste tab", async ({ page }) => {
    await page.goto("/retentie?tab=instroom");

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
    await page.goto("/retentie");

    await expect(page.getByRole("tab", { name: "Behoud" })).toBeVisible({ timeout: 15000 });

    // Klik op Cohorten tab
    await page.getByRole("tab", { name: "Cohorten" }).click();

    // URL moet ?tab=cohorten bevatten
    await expect(page).toHaveURL(/tab=cohorten/);
  });

  test("tab state behouden na page refresh", async ({ page }) => {
    // Navigeer naar specifieke tab
    await page.goto("/signalering?tab=werving");

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    // Werving tab moet geselecteerd zijn
    await expect(page.getByRole("tab", { name: "Werving" })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    // Refresh pagina
    await page.reload();

    // Tab moet nog steeds geselecteerd zijn
    await expect(page.getByRole("tab", { name: "Werving" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("projecties tab deeplink werkt", async ({ page }) => {
    await page.goto("/projecties?tab=projectie");

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
    await page.goto("/signalering");

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
