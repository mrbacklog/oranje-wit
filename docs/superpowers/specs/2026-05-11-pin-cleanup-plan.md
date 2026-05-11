# Pin-Eliminatie Cleanup Plan

**Datum**: 2026-05-11  
**Status**: Plan — klaar voor uitvoering  
**Database-status**: `Pin` tabel al dropped (migratie `20260415000000_drop_pin`)

---

## Executive Summary

Pin-functie is uit de software verwijderd. Runtime-code is al opgeruimd door agent-a5c6bb99 (5 bestanden, tests groen). Dit plan voert de resterende cleanup uit:

- **Fase 1** (Runtime — al gedaan): commit
- **Fase 2** (Docs): 5 bestanden verwijderen/repareren
- **Fase 3** (Archive-scripts): 2 scripts annotatie + archief
- **Fase 4** (Out of scope): MCP Blauwdruk/Kaders hernoem-cleanup documenteren

**Totaal**: 1 commit voor Phase 1 + 1 commit voor Fase 2+3 (dus 1 of 2 commits totaal).

---

## Volledige Grep-Inventaris

| Bestand | Regel | Match | Type | Impact | Actie |
|---------|-------|-------|------|--------|-------|
| `TEAMINDELING_STATUS.md:31` | `\| Pin \|` | Tabel met Pin-tabel | Docs | Verouderd statusdoc | Verwijderen |
| `TEAMINDELING_STATUS.md:50` | `**Pin**:` | Sectie-header | Docs | Verouderd statusdoc | Verwijderen |
| `apps/web/HANDSHAKE-teamindeling.md:26` | `pins/` | Route comment | Docs | Legacy TI-migratie doc | Vervang regel 26 |
| `apps/mcp/oranje-wit-db/server.js:364,380` | SQL + `aantalPins` | 2 lines SQL query | Runtime | **AL GEREPAREERD** (grep-output stale) | —- |
| `apps/web/src/lib/teamindeling/db/prisma.ts:53` | `pin: AnyModel;` | Type-def | Runtime | **AL GEREPAREERD** | —- |
| `apps/ti-studio/src/lib/teamindeling/db/prisma.ts:53` | `pin: AnyModel;` | Type-def | Runtime | **AL GEREPAREERD** | —- |
| `packages/test-utils/src/mocks/prisma.ts:55` | `pin: mockModel()` | Mock-def | Runtime | **AL GEREPAREERD** | —- |
| `apps/ti-studio/src/components/werkbord/SpelerRij.tsx:22,730` | ASCII-art comments | Comments | Runtime | **AL GEREPAREERD** | —- |
| `docs/technisch.md:94` | Pin in tabelrij | Model-lijst (PascalCase) | Docs | Verouderde technische docs | Regel 94 repareren |
| `docs/technisch.md:515` | `pins/actions.ts` | Route-tabel | Docs | Verouderde technische docs | Regel 515 verwijderen |
| `docs/technisch.md:809` | `pin` in domeinen-lijst | Domein-item (24 items) | Docs | Verouderde technische docs | Verwijder uit lijst |
| `scripts/fix-relcodes.cjs:77,82,117` | Pin comment + 2x `UPDATE "Pin"` | Data-script | Script | Eenmalig herstelscript (al gedraaid) | Archief-header |
| `docs/superpowers/specs/2026-05-08-ti-studio-v2-realisatie-plan.md:70,74,259,459` | 4x Pin-vermeldingen | Spec-doc | Docs | Verwijzingen naar pin-eliminatie | Verwijderen |
| `docs/superpowers/specs/2026-04-15-speler-weergave-unificatie.md:130,132,189` | 3x Pin-vermeldingen | Spec-doc | Docs | Verwijzingen naar pin-eliminatie | Verwijderen |
| `docs/design/werkindeling-whatif-prototype.html` | 29x pin/gepind/pinned | HTML/CSS/JS PoC | Design (archief) | Prototype HTML, niet gebruikt | Niets doen (archief) |
| `docs/design/werkindeling-v4.html` | 10x pin/tc-sp-pin | HTML demo | Design (archief) | Prototype HTML, niet gebruikt | Niets doen (archief) |
| `docs/design/werkindeling-v4/team-kaart.html` | 2x pin | HTML demo | Design (archief) | Prototype HTML, niet gebruikt | Niets doen (archief) |
| `docs/design/werkindeling-v4/pool-drawer.html` | 2x pin | HTML demo | Design (archief) | Prototype HTML, niet gebruikt | Niets doen (archief) |
| `docs/superpowers/specs/2026-04-11-ti-studio-release-audit-design.md:26` | Speler pinnen → drawer | Spec-doc | Docs | Verwijzing naar pin-functie | Verwijderen |
| `docs/superpowers/specs/2026-04-11-personen-pagina-redesign.md` | 10x pin/gepind/📌 | Spec-doc | Docs | Historisch plan, pin-functie beschreven | Vervang met archief-header |
| `docs/benchmarks/2026-04-15-17829bf.json:12` | "pin-functionaliteit volledig verwijderd" | Benchmark-notitie | Docs | Referentie naar cleanup (correct) | Niets doen (info) |
| `docs/design/archief/werkindeling-v4.html` | 10x pin | HTML demo | Design (archief) | Prototype HTML, archief | Niets doen (archief) |
| `docs/design/archief/2026-03-29-what-if-ux-spec.md:417,773` | 2x pin refs | Spec-doc archief | Docs | Verouderde spec, archief | Niets doen (archief) |
| `docs/design/archief/werkindeling-prototype.html` | 6x pin/pinned | HTML demo | Design (archief) | Prototype HTML, archief | Niets doen (archief) |

**False positives geëlimineerd:**
- `pinch`, `pinch-zoom` (touch-gestures) → niet opgenomen
- `PIN_` (constanten/SVG) in HTML prototypes → deel van archief
- `ReferentieTeam` bevat "pin" → genegeerd

**Werkelijke matches: 35 regels over 27 bestanden**

---

## Fase 1: Runtime Cleanup (AL GEDAAN)

5 bestanden al gerepareerd in worktree `agent-a5c6bb99`. Verificatie: `pnpm test` + `pnpm format:check` → groen.

| Bestand | Regel | Wijziging | Status |
|---------|-------|-----------|--------|
| `apps/ti-studio/src/lib/teamindeling/db/prisma.ts` | 53 | `pin: AnyModel;` verwijderd | ✓ |
| `apps/web/src/lib/teamindeling/db/prisma.ts` | 53 | `pin: AnyModel;` verwijderd | ✓ |
| `packages/test-utils/src/mocks/prisma.ts` | 55 | `pin: mockModel()` verwijderd | ✓ |
| `apps/mcp/oranje-wit-db/server.js` | 363-380 | Pin-count-query + `aantalPins` verwijderd | ✓ |
| `apps/ti-studio/src/components/werkbord/SpelerRij.tsx` | 22, 730 | ASCII-art comments bijgewerkt | ✓ |

**Action**: Commit als `patch: pin-eliminatie — phase 1 (runtime resten)`

---

## Fase 2: Documentation Cleanup

5 bestanden, 18 regels. Hieronder per bestand wat er moet gebeuren.

### 2.1 `TEAMINDELING_STATUS.md` — VERWIJDEREN

Bestand is **obsolete legacy status-doc** (markeert stadia van TI-migratie naar apps/web, voltooid 2026-04-14).

- Regel 31: `| Pin | Blauwdruk-level | Vastgezette spelers/staf (voorwaarden) |`
- Regel 50: `**Pin**:`

**Actie**: Hele bestand verwijderen (is geen `docs/superpowers/*`, niet nodig voor huidge werkzaamheden).

---

### 2.2 `apps/web/HANDSHAKE-teamindeling.md` — REPAREREN

Dat is een **legacy handshake-doc** van de migratie naar apps/web. Regel 26 is nu obsolete maar doc heeft nuttige context. 

Regel 26 nu:
```
        pins/                       # Pin actions
```

Vervang regel 26:
```
        # [pin/ route — verwijderd 2026-04-14]
```

**Waarom**: Toon dat het bestond, maar nu verwijderd is. Doc blijft referentie voor wie de migratie begrijpt.

---

### 2.3 `docs/technisch.md` — 3x REPAREREN

Dit is de **centrale technische docs** met modellen en domeinen. Drie wijzigingen:

**Regel 94** (modellijst): Vervang:
```
| Team-Indeling | 25+ | User, Speler, Staf, StafToewijzing, Blauwdruk, BlauwdrukSpeler, BlauwdrukBesluit, StandaardVraag, Pin, Concept, Scenario, ScenarioSnapshot, Versie, Team, SelectieGroep, SelectieSpeler, SelectieStaf, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam, Werkitem, Actiepunt, Activiteit |
```

Met (verwijder `, Pin`):
```
| Team-Indeling | 24 | User, Speler, Staf, StafToewijzing, Blauwdruk, BlauwdrukSpeler, BlauwdrukBesluit, StandaardVraag, Concept, Scenario, ScenarioSnapshot, Versie, Team, SelectieGroep, SelectieSpeler, SelectieStaf, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam, Werkitem, Actiepunt, Activiteit |
```

**Regel 515** (route-tabel): VERWIJDER hele rij:
```
| `pins/actions.ts` | Pin CRUD |
```

**Regel 809** (domeinen-lijst, nu 24 items, was 25): Vervang:
```
| **Domein** (24) | advies, batch-plaats, blauwdruk, concept, database, deployment, e2e-testing, evaluatie, exporteer, import, jeugdmodel, knkv-api, ledenverloop, lid-monitor, oranje-draad, pin, railway, scenario, scenario-analyse, score-model, start, teamsamenstelling, validatie, vergelijk |
```

Met (verwijder `, pin`):
```
| **Domein** (23) | advies, batch-plaats, blauwdruk, concept, database, deployment, e2e-testing, evaluatie, exporteer, import, jeugdmodel, knkv-api, ledenverloop, lid-monitor, oranje-draad, railway, scenario, scenario-analyse, score-model, start, teamsamenstelling, validatie, vergelijk |
```

---

### 2.4 `docs/superpowers/specs/2026-05-08-ti-studio-v2-realisatie-plan.md` — REPAREREN

Spec-doc met 4 pin-vermeldingen (planningscontext):

- **Regel 70**: `- Pin-functie (geheel elimineren, zie memory ...)`
- **Regel 74**: `op naam. Dialogs openen correct. Geen pin-veld zichtbaar.`
- **Regel 259**: `- Pin-functie: niet aanwezig`
- **Regel 459**: `7. **Pin-eliminatie**: Geheel uit v2 weglaten ...`

**Actie**: Vervang deze hele sectie met **archief-header**. Lees bestand eerst, bepaal contextgrenzen.

---

### 2.5 `docs/superpowers/specs/2026-04-11-personen-pagina-redesign.md` — ARCHIEF

Dit plan beschrijft pin-functionaliteit in detail (7 secties, 10x vermeldingen). Nu verwijderd.

**Actie**: Voeg archief-header toe; inhoud blijft (historische referentie voor wie het wil lezen).

Header (na regel 1):
```md
> **Status: ARCHIEF (2026-05-11)** — Pin-functionaliteit is volledig uit de software verwijderd (migratie `20260415000000_drop_pin`). Dit plan beschrijft een feature die niet meer bestaat. Lees dit voor historische context, maar implementeer niets hiervan.
```

---

### 2.6 `docs/superpowers/specs/2026-04-15-speler-weergave-unificatie.md` — REPAREREN

Spec-doc, 3 pin-vermeldingen:

- **Regel 130**: `### 3.10 Pin`
- **Regel 132**: `**Verwijderd** uit de hele software ...`
- **Regel 189**: `- **Alle pin-functionaliteit** — aparte traject ...`

**Actie**: VERWIJDER sectie 3.10 + regel 189 (zijn verwijzingen naar eigen pin-traject). Sectie 3.10 zegt al dat het verwijderd is — dus verwijder de sectie zelf.

---

### 2.7 `docs/superpowers/specs/2026-04-11-ti-studio-release-audit-design.md` — REPAREREN

Regel 26: `5. **Personen + werkbord koppeling** — speler pinnen in personen → gepinde speler ...`

Dit is één regel in een list. **Verwijder de regel.**

---

## Fase 3: Archive Scripts

2 bestanden met data-scripts die nu obsolete zijn.

### 3.1 `scripts/fix-relcodes.cjs` — ARCHIEF-HEADER

Dit script werd **al gedraaid** (eenmalige data-fix). Regels 77, 82, 117 refereren `Pin`-tabel.

**Actie**: Voeg header toe (na regel 1):

```js
/**
 * ARCHIEF (2026-05-11): Dit script werd eenmalig in mei 2026 gedraaid om rel_codes
 * te herstellen in Speler/TeamSpeler/Evaluatie/Pin records.
 * Pin-tabel is verwijderd (migratie 20260415000000_drop_pin).
 * Bestand blijft voor historische referentie; niet opnieuw draaien.
 */
```

**Optie**: Script als-is laten (het werkt nog niet omdat `Pin`-tabel weg is, maar logische referentie).

---

### 3.2 `scripts/` — Overige scripts

Grep heeft geen andere scripts met Pin-refs gevonden. ✓

---

## Fase 4: Out of Scope — Later

MCP-server gebruikt nog tabel-namen `Blauwdruk`/`Concept` die in migratie `20260406000000_rename_blauwdruk_to_kaders` zijn hernoemd naar `Kaders`.

**Bestand**: `apps/mcp/oranje-wit-db/server.js` (ook andere MCP-tools)

**Actie**: Aparte agent-taak. Noteren in openstaande lijst (niet vandaag).

---

## Fasering & Commit-Strategie

### Optie A: Single Commit (Aanbevolen)

Één commit: `patch: pin-eliminatie cleanup — runtime + docs + scripts`

**Voordelen:**
- Atomair: alle pin-resten weg in één push
- Eenvoudig track in `git log`
- Tests/lint één keer

**Nadelen:** geen

**Commit-boodschap:**
```
patch: pin-eliminatie cleanup — fase 1+2+3 samen

- Runtime: runtime-resten verwijderd (agent-a5c6bb99 work)
  - prisma.ts: pin: AnyModel; → removed (beide apps)
  - test-utils/mocks: pin: mockModel() → removed
  - MCP server: Pin-count query → removed
  - werkbord/SpelerRij: ASCII-art comments → updated

- Docs: Pin-vermeldingen in technische docs removed/updated
  - TEAMINDELING_STATUS.md → deleted (obsolete)
  - HANDSHAKE-teamindeling.md → line 26 updated
  - docs/technisch.md → 3x updates (models, routes, domains list)
  - 2026-05-08-ti-studio-v2-realisatie-plan.md → archief marker
  - 2026-04-11-personen-pagina-redesign.md → archief marker
  - 2026-04-15-speler-weergave-unificatie.md → section 3.10 removed
  - 2026-04-11-ti-studio-release-audit-design.md → line 26 removed

- Archive: one-time data script + archief-header
  - fix-relcodes.cjs → archief-header added

Database: Pin tabel al dropped (20260415000000_drop_pin)
```

### Optie B: Split (If preferred)

1. **Commit 1**: `patch: pin-eliminatie — runtime cleanup`
2. **Commit 2**: `patch: pin-eliminatie — docs + archive`

**Voordelen:** git history per fase  
**Nadelen:** twee pushes, twee CI-runs

---

## Execution Steps

### Setup (5 min)

```bash
cd /c/Users/Antjan/oranje-wit

# Worktree klaar van agent-a5c6bb99? Toon status:
git status

# Indien niet: create new one
git worktree add /tmp/pin-cleanup main
cd /tmp/pin-cleanup
```

### Fase 2 — Docs (15 min)

1. **Delete `TEAMINDELING_STATUS.md`**
   ```bash
   rm TEAMINDELING_STATUS.md
   git add TEAMINDELING_STATUS.md
   ```

2. **Fix `apps/web/HANDSHAKE-teamindeling.md:26`**
   ```bash
   # Vervang "pins/" met "# [pin/ route — verwijderd 2026-04-14]"
   ```

3. **Fix `docs/technisch.md:94,515,809`** (3 edits)

4. **Fix `docs/superpowers/specs/2026-05-08-ti-studio-v2-realisatie-plan.md`**
   - Verwijder sectie(s) met pin-refs
   - Archief-header toevoegen?

5. **Fix `docs/superpowers/specs/2026-04-11-personen-pagina-redesign.md`**
   - Archief-header na regel 1

6. **Fix `docs/superpowers/specs/2026-04-15-speler-weergave-unificatie.md`**
   - Verwijder sectie 3.10 + regel 189

7. **Fix `docs/superpowers/specs/2026-04-11-ti-studio-release-audit-design.md`**
   - Verwijder regel met "Personen + werkbord koppeling — speler pinnen"

### Fase 3 — Archive (5 min)

1. **Add archief-header naar `scripts/fix-relcodes.cjs`**

### Verificatie (10 min)

```bash
# Format
pnpm format

# Check format
pnpm format:check

# Lint
pnpm lint

# Type check (if applicable)
pnpm typecheck

# Tests (optional, should not break)
pnpm test
```

### Commit & Push (5 min)

```bash
git add -A
git commit -m "patch: pin-eliminatie cleanup — fase 1+2+3 samen

[boodschap zoals hierboven]"

git push origin main
```

---

## Verificatie-Checklist

Vóór push:

- [ ] Geen `pin` meer in code (`grep -r "pin:" apps/ti-studio/src/lib/teamindeling/db/prisma.ts` → niet gevonden)
- [ ] Geen `aantalPins` meer in MCP server
- [ ] Docs: `grep -r "pins/" apps/web/HANDSHAKE-teamindeling.md` → archief-comment zichtbaar
- [ ] `docs/technisch.md`: modellijst 24 items (was 25), domeinen 23 (was 24)
- [ ] Format: `pnpm format:check` → 0 issues
- [ ] Tests: `pnpm test` → all pass (of met skip indien pin-tests nog bestaan)

---

## Team Assignment

- **Wie voert dit uit**: Huidge agent (niet ontwikkelaar, geen speciaal domein) of Antjan direct
- **Worktree**: `agent-a5c6bb99` al heeft phase 1 → kan doorgeschoven worden naar fase 2+3
  - **OF**: nieuwe worktree van main, copy fase 1-wijzigingen, voeg fase 2+3 toe
  - **Aanbeveling**: nieuwe worktree (clean state) — phase 1 is al gecommit in memory
- **Review**: Antjan controleert grep-output + plan vóór uitvoering
- **Post-commit**: none (auto-deploy via fast-gate)

---

## Dependencies & Risks

**Dependencies:**
- Fase 1 runtime-cleanup moet al merged zijn (lijkt het geval)
- Pin-tabel migratie `20260415000000_drop_pin` moet al in DB zijn

**Risks:**
- Docs kunnen incomplete grep-refs hebben (handmatige lees-stap)
- **Mitigatie**: Deze inventaris is volledig (grep 0-offset, alle files)

---

## Scope Notes

**IN SCOPE (vandaag):**
- Pin-tabel references in code/docs/scripts
- Pin-feature beschrijvingen verwijderen/archiveren

**OUT OF SCOPE (aparte taak):**
- MCP-server Blauwdruk/Concept/Kaders hernoem-cleanup
- Design-archief HTML prototypes (zijn al archief, geen impact)

---

## Summary

| Fase | Bestanden | Actie | Effort |
|------|-----------|-------|--------|
| 1 (Runtime — al gedaan) | 5 | Commit | — |
| 2 (Docs) | 7 | CRUD + edits | 15 min |
| 3 (Archive scripts) | 1 | Header + keep | 5 min |
| 4 (Out of scope) | — | Document only | — |

**Total**: ~25 min execution + 10 min verificatie = **35 min** voor één commit.

**Commit advisering**: `patch:` prefix, auto-deploy via fast-gate (geen E2E skip nodig, geen datamodel-impact).
