# TI Studio Release Audit — Design Spec

**Datum:** 2026-04-11
**Branch:** `release/v2026-04-11-ti-studio-selectie-dragdrop`
**Status:** Goedgekeurd door Antjan

---

## Context

De TI Studio werkindeling-app is functioneel grotendeels klaar maar heeft nog nooit een gestructureerde validatieronde doorlopen. Er zijn 25+ nieuwe werkbord-componenten, een nieuw DB-model (`Reserveringsspeler`), drag & drop implementatie, SSE-stream, en een personen-pagina redesign — allemaal op een bestaande codebase gebouwd. De oude E2E tests zijn verwijderd; er zijn geen nieuwe E2E tests voor de TI Studio.

**Doel:** Vóór release zekerheid krijgen over drie vragen:
- A) **Werkt het überhaupt?** — Playwright loopt als echte gebruiker door de kritische flows
- C) **Is de code solide?** — Audit van data flows, TypeScript-grenzen, API-contracts
- B) **Welke P0-issues zijn echte blockers?** — Go/no-go per backlog-item

---

## Kritische flows (5)

1. **Drag & drop** — speler uit pool slepen → in team droppen → opslaan → pagina herladen → speler zit nog in team
2. **Versie-cyclus** — indeling laden → wijziging maken → opslaan → SSE-stream triggered
3. **Memo** — memo aanmaken → kaart bewerken → memo sluiten met besluit
4. **Validatie** — V/M-balans check → leeftijdscategorie check → feedback zichtbaar in ValidatieDrawer
5. **Personen + werkbord koppeling** — speler pinnen in personen → gepinde speler verschijnt in SpelersPool drawer op werkbord

---

## Aanpak: 3 waves met parallelle agents

### Wave 1 — Parallel (4 agents tegelijk)

#### Agent 1: Code Audit
- **Scope:** alle bestanden onder `src/components/ti-studio/`, `src/app/(teamindeling-studio)/`, `src/app/api/ti-studio/`, en de TI-gerelateerde server actions
- **Checkt:**
  - TypeScript-fouten en `any`-escapes op kritische grenzen
  - Data flow van DB → server action → component state → UI (met name `TiStudioShell.tsx`)
  - API-contract tussen `/api/ti-studio/indeling/[versieId]` (GET/PUT) en de client
  - SSE stream correctheid (`/api/ti-studio/indeling/[versieId]/stream/route.ts`)
  - Auth guards aanwezig op alle muterende routes/actions
  - Lege catch blocks, missing error handling
- **Output:** gerangschikte lijst van bevindingen (kritisch / waarschuwing / info)

#### Agent 2: Playwright Smoke Test
- **Vereiste:** dev server draait op poort 3000 — agent start `pnpm dev` zelf als dat nog niet het geval is
- **Scope:** de 5 kritische flows, één voor één
- **Aanpak:** Playwright opent de browser, navigeert door elke flow als echte gebruiker, maakt screenshots per stap
- **Auth:** gebruikt bestaande Playwright auth-bypass patroon (zie `e2e/` setup)
- **Output:** per flow: ✅ passeert / ❌ faalt + screenshot + foutmelding

#### Agent 3: P0-triage
- **Input:** bestaande backlog uit `project_ti-studio-werkbord-backlog.md`
- **Beoordeelt per P0-item:**
  - Blokkeert dit dagelijks TC-gebruik? (ja/nee)
  - Is er een workaround?
  - Geschatte fix-complexiteit (klein/middel/groot)
- **Output:** go/no-go tabel per backlog-item

#### Agent 4: Unit test scan
- **Scope:** business logic in `TiStudioShell.tsx`, validatielogica, state-transformaties
- **Inventariseert:** welke logica nu volledig untested is
- **Schrijft:** gerichte unit tests (Vitest) voor de meest risicovolle stukken
- **Criterium:** focus op pure functies en state-reducers, niet op rendering

---

### Wave 2 — Op basis van Wave 1 (parallel)

#### Agent 5: E2E tests schrijven
- **Input:** Wave 1 smoke test resultaten
- **Scope:** schrijft stabiele Playwright-tests voor alle flows die Wave 1 groen liet
- **Aanpak voor kapotte flows:** `test.skip` met duidelijk bug-label — géén falende test in CI
- **Locatie:** `e2e/ti-studio/` (nieuwe subfolder)
- **Patroon:** volgt bestaande E2E-conventies (auth bypass, test setup, aria-labels)

#### Agent 6: P0-fixes
- **Input:** P0-triage uit Wave 1 (alleen items gemarkeerd als "blokkerend")
- **Scope:** uitsluitend de go/no-go blockers, geen andere wijzigingen
- **Werkt in isolation (worktree)** om main branch niet te vervuilen tijdens fixes

---

### Wave 3 — Verificatie

**Voorwaarde:** P0-fixes uit Wave 2 Agent 6 zijn gemerged naar de release branch.

Één agent draait:
- Alle nieuwe E2E tests (`pnpm test:e2e` op `e2e/ti-studio/`)
- Alle unit tests (`pnpm test`)

Bij groen: release-beslissing aan Antjan/product-owner.

---

## Randvoorwaarden

- Dev server moet draaien voor Wave 1 Agent 2 en Wave 3
- Playwright auth-bypass moet werken voor TI Studio routes (check bestaand patroon in `e2e/`)
- Wave 2 start pas als Wave 1 volledig klaar is
- Alle agents werken in isolation (worktree) behalve de verificatie-agent

---

## Niet in scope

- Kader-pagina (statisch, lage prioriteit)
- Daisy AI-koppeling (P3, hardcoded demo)
- Ctrl+Z undo (P3)
- Definitief verklaren flow (P3)
- Mobile `(teamindeling)` routes — aparte audit indien nodig
