import { test, expect } from "../fixtures/base";

test.describe("Navigatie", () => {
  test("dashboard laadt met begroeting", async ({ page }) => {
    await page.goto("/");

    // Dashboard toont een begroeting met de naam van de scout
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("dashboard toont scout-acties", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Scout een speler")).toBeVisible();
    await expect(page.getByText("Scout een team")).toBeVisible();
  });

  test("navigatie naar zoekpagina werkt", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Scout een speler").click();
    await page.waitForURL(/\/zoek/);
  });

  test("navigatie naar team-overzicht werkt", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Scout een team").click();
    await page.waitForURL(/\/team/);
  });

  test("bottom navigatie is zichtbaar", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();
  });
});
