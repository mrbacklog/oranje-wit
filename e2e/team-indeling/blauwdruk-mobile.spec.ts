// Blauwdruk mobile pagina is verwijderd in april 2026.
// /teamindeling/blauwdruk redirect naar /teamindeling.
// Tests voor blauwdruk-inhoud zijn verplaatst naar TI Studio (ti-studio/kaders).

import { test, expect } from "../fixtures/base";

test.describe("Blauwdruk redirect", () => {
  test("redirect naar overzicht", async ({ page }) => {
    await page.goto("/teamindeling/blauwdruk");
    await expect(page).toHaveURL("/teamindeling");
  });
});
