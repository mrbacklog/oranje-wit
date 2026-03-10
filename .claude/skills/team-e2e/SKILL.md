---
name: team-e2e
description: Start een Agent Team voor E2E frontend testing. Gebruik na feature development om de app via de browser te verifiëren, of voor regressietests.
disable-model-invocation: true
argument-hint: "<app: ti|monitor|evaluatie> [beschrijving van wat getest moet worden]"
---

# Agent Team: E2E Testing

Start een agent team voor het testen van de frontend via Playwright voor c.k.v. Oranje Wit.

## Team samenstelling

### Lead: e2e-tester
- **Rol**: Coördineert E2E testing, schrijft en draait Playwright tests
- **Verantwoordelijkheden**:
  - Start de dev server (`E2E_TEST=true pnpm dev:<app>`)
  - Draait bestaande E2E tests (`pnpm test:e2e:<app>`)
  - Gebruikt Playwright MCP voor exploratory testing van specifieke features
  - Schrijft nieuwe tests voor ontbrekende scenario's
  - Analyseert en rapporteert testresultaten
  - Geeft go/no-go voor deployment

### Teammate 1: ontwikkelaar
- **Rol**: Fixt bugs die de e2e-tester vindt
- **Verantwoordelijkheden**:
  - Ontvangt bugrapporten van e2e-tester met reproductie-stappen
  - Fixt code issues (server actions, componenten, styling)
  - Draait unit tests na fixes (`pnpm test:<app>`)
  - Bevestigt aan e2e-tester dat de fix klaar is voor hertest

### Teammate 2: deployment (optioneel, bij post-deploy verificatie)
- **Rol**: Post-deploy smoke tests tegen productie
- **Verantwoordelijkheden**:
  - Bevestigt dat de service live is na deployment
  - Rapporteert deployment-status aan e2e-tester
  - e2e-tester doet dan read-only navigatie-checks tegen productie URL

## Werkwijze

### Fase 1: Setup
1. **e2e-tester** start dev server met `E2E_TEST=true`
2. **e2e-tester** draait bestaande E2E suite

### Fase 2: Exploratory Testing (optioneel, bij nieuwe features)
3. **e2e-tester** gebruikt Playwright MCP om de feature interactief te verkennen
4. **e2e-tester** schrijft nieuwe spec-bestanden voor ontdekte scenario's
5. **e2e-tester** draait de nieuwe tests om ze te valideren

### Fase 3: Bug-fix Loop
6. Bij falende tests: **e2e-tester** rapporteert aan **ontwikkelaar**
7. **ontwikkelaar** fixt → **e2e-tester** hertest → herhaal tot groen
8. **e2e-tester** geeft go-ahead

### Fase 4: Post-deploy Verificatie (optioneel)
9. **deployment** bevestigt service live
10. **e2e-tester** doet read-only smoke test tegen productie URL
11. Alleen navigatie, GEEN mutaties tegen productie

## Communicatiepatronen

```
TC (gebruiker)
    ↕ test-opdracht of feature-verificatie
e2e-tester (lead)
    ↕ bugrapporten + hertest
    ├── ontwikkelaar (fix code, hertest-trigger)
    └── deployment (post-deploy status, optioneel)
```

## Wanneer `/team-e2e` gebruiken vs `/team-release`

| Situatie | Team |
|---|---|
| Feature bouwen + testen + deployen | `/team-release` (ontwikkelaar lead, e2e als fase) |
| Alleen testen na wijzigingen | `/team-e2e` (e2e-tester lead) |
| Regressietest voor release | `/team-e2e` |
| Exploratory testing van nieuwe feature | `/team-e2e` |
| Post-deploy productie-check | `/team-e2e` met deployment teammate |

## App-configuratie

| App | Dev commando | E2E Test | Live URL |
|---|---|---|---|
| Team-Indeling | `pnpm dev:ti` (4100) | `pnpm test:e2e:ti` | teamindeling.ckvoranjewit.app |
| Monitor | `pnpm dev:monitor` (4102) | `pnpm test:e2e:monitor` | monitor.ckvoranjewit.app |
| Evaluatie | `pnpm dev:evaluatie` (4104) | `pnpm test:e2e:evaluatie` | evaluaties.ckvoranjewit.app |

## Context

- **Taal**: Nederlands
- **Framework**: Playwright met Chromium
- **Auth**: Conditionele Credentials provider (`E2E_TEST=true`)
- **Database**: Productie DB voor dev server, test DB in CI
- **Playwright MCP**: Headless browser-controle voor exploratory testing

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, vraag dan:
1. Welke app? (team-indeling / monitor / evaluatie)
2. Wat moet er getest worden? (regressie / specifieke feature / exploratory)
3. Is dit pre-deploy of post-deploy?
