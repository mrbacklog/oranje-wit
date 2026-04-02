import { test, expect } from "../fixtures/base";

test.describe("Tab deeplinks", () => {
  test("retentie tab via URL param opent juiste tab", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/retentie?tab=verloop", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Ledendynamiek" })).toBeVisible({
      timeout: 15000,
    });

    const verloopTab = page.getByRole("tab", { name: "Verloop" });
    await expect(verloopTab).toHaveAttribute("aria-selected", "true");

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

  test("signalering filter state behouden na page refresh", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/signalering?filter=werving", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    const wervingLink = page
      .getByRole("group", { name: "Filter op thema" })
      .getByRole("link", { name: "Werving" });
    await expect(wervingLink).toHaveAttribute("aria-current", "page");

    await page.reload({ timeout: 45000 });

    await expect(wervingLink).toHaveAttribute("aria-current", "page", { timeout: 15000 });
  });

  test("projecties redirect bewaart niet de tab param", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/projecties?tab=projectie", { timeout: 45000 });
    await page.waitForURL("**/monitor/samenstelling**", {
      timeout: 15000,
      waitUntil: "commit",
    });
    await expect(page.getByRole("heading", { name: /Samenstelling/ })).toBeVisible({
      timeout: 15000,
    });
  });

  test("signalering filter werkt met URL params", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/monitor/signalering", { timeout: 45000 });

    await expect(page.getByRole("heading", { name: "Signalering" })).toBeVisible({
      timeout: 15000,
    });

    const filterGroup = page.getByRole("group", { name: "Filter op thema" });
    const filters = ["Werving", "Retentie", "Pijplijn"] as const;
    for (const name of filters) {
      await filterGroup.getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`filter=${name.toLowerCase()}`));
    }

    await filterGroup.getByRole("link", { name: "Alles" }).click();
    await expect(page).not.toHaveURL(/filter=/);
  });
});
