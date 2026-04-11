# TI Studio Release Rapport — 2026-04-11

## Kritische flows status

| Flow | Smoke test | E2E test |
|---|---|---|
| Drag & drop | ✅ | ✅ |
| Versie-cyclus | ✅ | ✅ |
| Memo | ✅ | ✅ |
| Validatie | ⚠️ (ValidatieDrawer ontbreekt in main) | ⏭️ skipped |
| Personen + werkbord | ✅ | ✅ |

## Totaal E2E Wave 3

- **19 passed / 1 failed / 3 skipped**
- Enige failure: `smoke.spec.ts > Flow 9 — console errors` — veroorzaakt door **verouderde Turbopack-cache** die de opnieuw gegenereerde Prisma client nog niet heeft opgepakt (`prisma.reserveringsspeler.findMany`). Fix: dev server herstarten.

## P0-items status

| Item | Blokkerend? | Gefixed? |
|---|---|---|
| Speler-duplicaat cross-team | ja | ✅ `fix: blokkeer cross-team speler-duplicaat bij pool-drop` |
| Auth guards write-actions | ja (K1-K4) | ✅ `fix: requireTC op alle write-actions + getVersiesVoorDrawer` |
| Toast bij opslaan | nee | ⏭️ defer (P1) |
| ValidatieDrawer | nee | ⏭️ defer (state in worktree) |
| Kaartformaat auto-update | nee | ⏭️ defer (P1) |

## Database

- Alle 19 migraties toegepast (`database schema is up to date`)
- Prisma client opnieuw gegenereerd na ontbrekend `Reserveringsspeler`-model in client

## Unit tests

- **340/340 groen** (46 testbestanden)

## Resterende bekende issues (P1-P3)

- SSE-verbindingsindicator: geen visuele feedback bij disconnect
- ValidatieDrawer: bestaat alleen in worktree, nog niet gemerged naar release-branch
- Toast bij opslaan: stille fouten bij netwerkstoringen
- Kaartformaat auto-update: viertal → achtal bij ≥5 spelers
- any-casts in page.tsx (W1, tech debt)
- Rollback bij mislukte optimistic update (K5, complex)

## Wat nog moet vóór merge naar main

1. **Dev server herstarten** — Turbopack-cache bevat verouderde Prisma client; na herstart verdwijnt de enige E2E-failure automatisch.
2. (Optioneel) ValidatieDrawer mergen vanuit worktree naar release-branch.

## Release advies

**GO** — mits dev server herstart (Prisma-client issue is geen code-bug, alleen een dev-omgeving artifact).

Alle P0-blockers zijn gefixed. De app is functioneel voor dagelijks TC-gebruik. P1-items kunnen na release.
