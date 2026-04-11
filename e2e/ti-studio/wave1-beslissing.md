# Wave 1 Beslissing — 2026-04-11

## Migratie-fix (vóór Wave 2)
Pending migratie `20260411000000_werkitem-toelichting-en-log` toegepast. Indeling-pagina laadt nu 200 OK.

## Go/No-Go per flow (na migratie-fix)
- Drag & drop: ✅ (indeling laadt, infrastructuur aanwezig — echte drag/drop nog niet gerookt)
- Versie-cyclus: ✅ (indeling laadt, opslaan-mechanisme aanwezig)
- Memo: ✅ (pagina laadt correct)
- Validatie: ⚠️ (ValidatieDrawer bestaat niet in main branch — validatie-dot op kaarten wel)
- Personen + werkbord koppeling: ✅ (personen-pagina laadt, SpelersPool aanwezig)

## Kritische code issues (uit code-audit)
- K1: `verwerpWhatIf` heeft geen auth guard — elke ingelogde gebruiker kan archiveren
- K2: `pasWhatIfToe` heeft conditionale requireTC — bij geen kaderafwijkingen geen auth
- K3: 5 write-actions in werkindeling-actions.ts missen requireTC (hernoem, voegSpelerToe, verwijderSpeler, verwijderWerkindeling, slaPositiesOp)
- K4: `getVersiesVoorDrawer` leest gevoelige what-if data zonder auth
- K5: Geen rollback bij mislukte optimistic update (speler in twee teams)

## P0-blockers (uit p0-triage)
| Item | Blokkerend | Complexiteit |
|---|---|---|
| Speler-duplicaat cross-team | ja | klein (~1u) |
| Toast bij opslaan | nee | klein (~45 min) |
| ValidatieDrawer ontbreekt | nee | middel (~1-2u) |
| Kaartformaat auto-update | nee | klein (~30 min) |

## Wave 2 scope

**Wave 2A — Auth fixes (Agent 6, PRIO 1):**
- requireTC toevoegen aan verwerpWhatIf, pasWhatIfToe, 5× werkindeling-actions, getVersiesVoorDrawer

**Wave 2B — E2E tests (Agent 5):**
Tests schrijven voor alle 5 flows (indeling werkt na migratie)

**P0-fixes in Wave 2A:**
- Speler-duplicaat blokkeren (klein)
- Toast bij opslaan succes/fout (klein)

**Niet in Wave 2 (defer):**
- ValidatieDrawer port uit worktree (middel, workaround via TeamDrawer)
- Kaartformaat auto-update (niet blokkerend)
- SSE-indicator (P1)
- Rollback optimistic update (K5, complex — separaat issue)
- any-casts in page.tsx (W1, tech debt)
- logger.info cleanup (W7)
