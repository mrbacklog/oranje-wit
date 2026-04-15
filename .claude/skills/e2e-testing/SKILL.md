---
name: e2e-testing
description: E2E tests schrijven, draaien en onderhouden met Playwright. Bevat patronen voor auth bypass, fixtures en teststructuur.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: "[actie: run|write|heal|explore] [app: ti|monitor|evaluatie] [beschrijving]"
---

# E2E Testing met Playwright

## Overzicht

E2E tests draaien tegen lokale dev servers met een conditionele auth bypass. Tests worden geschreven in Playwright en staan in `e2e/<app>/`.

## Setup

### Auth Bypass
De `packages/auth/src/index.ts` bevat een conditionele Credentials provider die alleen actief is met `E2E_TEST=true`. Dit wordt NOOIT gezet op Railway productie.

### Playwright Config
`playwright.config.ts` in de monorepo root configureert drie projecten (per app) met automatische dev server startup.

## Acties

### `run` — Draai bestaande tests
```bash
# Alle apps
pnpm test:e2e

# Specifieke app
pnpm test:e2e:ti
pnpm test:e2e:monitor
pnpm test:e2e:evaluatie

# Interactieve UI
pnpm test:e2e:ui
```

### `write` — Schrijf nieuwe tests

1. Bepaal welke feature getest moet worden
2. Maak een nieuw bestand: `e2e/<app>/<feature>.spec.ts`
3. Importeer uit fixtures:
```typescript
import { test, expect } from "../fixtures/base";
```
4. Schrijf tests met Nederlandse beschrijvingen:
```typescript
test.describe("Kaders beheer", () => {
  test("kan teamgrootte-target aanpassen", async ({ page }) => {
    await page.goto("/kaders");
    // ... test logica
  });
});
```
5. Gebruik accessibility-first selectors:
   - `page.getByRole("button", { name: "Opslaan" })`
   - `page.getByLabel("Teamnaam")`
   - `page.getByText("Scenario aangemaakt")`
6. Draai de test: `pnpm test:e2e:<app>`

### `heal` — Repareer falende tests

1. Draai de test suite en analyseer de foutmelding
2. Bepaal of het een app-bug of een test-bug is:
   - **App-bug**: rapporteer aan ontwikkelaar met reproductie-stappen
   - **Test-bug**: pas de test aan (selector gewijzigd, flow veranderd)
3. Herdraai na fix

### `explore` — Exploratory testing via Playwright MCP

Gebruik de Playwright MCP tools voor interactieve browser-controle:

1. `mcp__playwright__browser_navigate` — Navigeer naar URL
2. `mcp__playwright__browser_snapshot` — Maak een accessibility snapshot
3. `mcp__playwright__browser_click` — Klik op een element
4. `mcp__playwright__browser_fill_form` — Vul formulieren in
5. `mcp__playwright__browser_take_screenshot` — Maak een screenshot

**Belangrijk**: Start eerst de dev server met `E2E_TEST=true pnpm dev:<app>`.

## Conventies

| Aspect | Regel |
|---|---|
| Bestandslocatie | `e2e/<app>/<feature>.spec.ts` |
| Imports | `import { test, expect } from "../fixtures/base"` |
| Taal beschrijvingen | Nederlands |
| Selectors | Accessibility-first: `getByRole`, `getByLabel`, `getByText` |
| Groepering | Per feature, niet per pagina |
| Auth | Automatisch via storageState (setup project) |
| Mutaties tegen productie | NOOIT — alleen read-only navigatie |

## Teststructuur

```
e2e/
  auth.setup.ts              # Auth sessie seed (draait als eerste)
  fixtures/
    base.ts                  # Gedeelde test + expect exports
    seed.ts                  # Database seeding voor CI
  .auth/
    user.json                # storageState (gitignored)
  team-indeling/
    navigatie.spec.ts        # Basisnavigatie
    kaders.spec.ts           # Kaders beheer
    scenarios.spec.ts        # Scenario's, drag-drop
  monitor/
    dashboard.spec.ts        # Dashboard KPI's
    leden.spec.ts            # Ledenlijst
  evaluatie/
    rondes.spec.ts           # Evaluatierondes
```

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, draai dan de bestaande E2E tests en rapporteer de resultaten.
