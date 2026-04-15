---
paths:
  - "packages/database/**"
  - "**/*.prisma"
  - "apps/web/src/lib/db/**"
  - "scripts/**"
---

# Database

## Database verbinding

### Gedeelde PostgreSQL op Railway
- **Host**: `shinkansen.proxy.rlwy.net:18957`
- **Database**: `oranjewit`
- **Schema eigenaarschap**: `packages/database/prisma/schema.prisma`
- **Migraties**: Prisma Migrate (`packages/database/prisma/migrations/`)
- **VIEW-definitie**: `packages/database/prisma/views.sql` (buiten Prisma-beheer)
- **NOOIT** `db:push` gebruiken — gebruik `db:migrate` (zie `packages/database/MIGRATIE.md`)

### Commando's

| Commando | Wat |
|---|---|
| `pnpm db:generate` | Genereer Prisma client |
| `pnpm db:migrate` | Maak nieuwe migratie (development) |
| `pnpm db:migrate:deploy` | Draai pending migraties + herstel VIEW (productie) |
| `pnpm db:migrate:status` | Toon migratiestatus |
| `pnpm db:ensure-views` | Controleer/herstel VIEW speler_seizoenen |
| ~~`pnpm db:push`~~ | **GEBLOKKEERD** — dropt VIEW speler_seizoenen |

---

## rel_code als enige sleutel (KRITIEK)

**KRITIEK**: De `rel_code` (Sportlink relatienummer, bijv. `NJH39X4`) is de **enige stabiele identifier** voor leden en spelers. Alle koppelingen tussen tabellen verlopen via `rel_code`:

- `leden.rel_code` — stamgegevens (naam, geboortedatum, tussenvoegsel)
- `competitie_spelers.rel_code` — competitiedata per seizoen
- `Speler.id` = `rel_code` — teamindeling (Speler.id IS de rel_code)

**Regels**:
1. Bij het opzoeken of aanmaken van een Speler: gebruik **altijd** `rel_code` als lookup-sleutel, **nooit** naam-matching
2. Een nieuw Speler-record krijgt `id = rel_code` uit de `leden`-tabel
3. De volledige achternaam (incl. tussenvoegsel) komt uit `leden`: `tussenvoegsel + " " + achternaam`
4. Als een speler niet gevonden kan worden via `rel_code`, is dat een **fout** die gemeld moet worden — niet stilzwijgend oplossen met fuzzy naam-matching
5. Alle actieve leden (seizoen 2025-2026 in `competitie_spelers`) horen een `Speler`-record te hebben

---

## Tabelverdeling (61 modellen)

**Competitie-data (2)**:
CompetitieSpeler (`competitie_spelers`), CompetitieRonde (`competitie_rondes`)
VIEW `speler_seizoenen` — afgeleid uit `competitie_spelers` (DISTINCT ON rel_code, seizoen)

**Verenigingsmonitor (12)** (snake_case via `@@map`):
Lid, LidFoto, Seizoen, OWTeam, TeamAlias, TeamPeriode, Ledenverloop, CohortSeizoen, Signalering, Streefmodel, PoolStand, PoolStandRegel

**Team-Indeling (25)** (PascalCase):
User, Speler, Staf, StafToewijzing, Blauwdruk, BlauwdrukBesluit, BlauwdrukSpeler, StandaardVraag, Concept, Scenario, ScenarioSnapshot, Versie, Team, SelectieGroep, SelectieSpeler, SelectieStaf, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam, Werkitem, Actiepunt, Mijlpaal

**Evaluatie (6)**:
EvaluatieRonde, Coordinator, CoordinatorTeam, EvaluatieUitnodiging, SpelerZelfEvaluatie, EmailTemplate

**Scouting (9)** (snake_case via `@@map`):
ScoutingVerzoek, ScoutToewijzing, ScoutingRapport, Scout, TeamScoutingSessie, ScoutBadge, ScoutChallenge, ScoutingVergelijking, ScoutingVergelijkingPositie

**Jeugdontwikkeling (4)** (raamwerk, was: catalogus):
RaamwerkVersie (`raamwerk_versies`), Leeftijdsgroep (`leeftijdsgroepen`), Pijler (`pijlers`), OntwikkelItem (`ontwikkel_items`)

**Systeem (5)**:
Gebruiker, VerificatieToken, ToegangsToken, Activiteit, Aanmelding

**Speler-extensies (3)**:
FysiekProfiel, SpelerUSS, SpelersKaart

---

## Competitie-datamodel

```
CompetitieSpeler (primaire tabel: 1 per speler × seizoen × competitie)
  └── VIEW speler_seizoenen (afgeleid: 1 per speler × seizoen)
```

- **~4933 records** in `competitie_spelers` — primaire bron, met `rel_code`, `seizoen`, `geslacht` direct
- VIEW `speler_seizoenen` leidt hieruit af via `DISTINCT ON (rel_code, seizoen)`
- Competitie-volgorde: veld_najaar → zaal → veld_voorjaar
- Excel-import (`sync-telling.ts`) is verwijderd — data staat definitief in de database

---

## Lees/schrijf-verdeling

- **Team-Indeling schrijft**: blauwdruk, concepten, scenario's, teams, selectiegroepen, log, evaluaties, notities, actiepunten
- **Team-Indeling leest**: leden, speler_seizoenen, competitie_spelers, cohort_seizoenen (retentiePct)
- **Monitor schrijft**: leden, teams, verloop, cohorten, signalering, competitie_spelers
- **Monitor leest**: alles (dashboards, signalering, MCP tools)
- **Evaluatie schrijft**: evaluatierondes, coördinatoren, uitnodigingen, evaluaties, zelfevaluaties, email templates
- **Evaluatie leest**: leden, competitie_spelers, teams, spelers, staf

---

## Data Flow

```
=== Competitie-data (primair in database) ===

competitie_spelers (primaire tabel, ~4933 records)
    → VIEW speler_seizoenen (afgeleid, DISTINCT ON rel_code+seizoen)

=== Verloop-pipeline (database-based) ===

competitie_spelers + leden
    ↓ (scripts/js/bereken-verloop.js)
ledenverloop tabel
    ↓ (scripts/js/bereken-cohorten.js)
cohort_seizoenen tabel
    ↓ (scripts/js/genereer-signalering.js)
signalering tabel

=== Overige data ===

Sportlink CSV/JSON → leden tabel (via MCP sync)
Railway PostgreSQL ← Prisma schema (packages/database/)
    ↓
apps/web/ (geconsolideerde app: alle domeinen)
```
