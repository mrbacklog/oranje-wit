# c.k.v. Oranje Wit — Monorepo

Monorepo voor alle digitale tools van c.k.v. Oranje Wit: Verenigingsmonitor, Team-Indeling, en gedeelde data/database.

---

## Structuur

```
oranje-wit/
├── apps/
│   ├── monitor/          # Verenigingsmonitor (Next.js 16 dashboards)
│   ├── team-indeling/    # Team-Indeling tool (Next.js 16, Tailwind CSS 4, NextAuth v5, dnd-kit)
│   └── mcp/              # MCP servers (database, Railway)
├── packages/
│   ├── database/         # @oranje-wit/database — Prisma schema + client
│   └── types/            # @oranje-wit/types — Gedeelde TypeScript types
├── agents/               # AI agent-definities (8 agents)
├── skills/               # AI skills per domein
│   ├── monitor/          #   Verenigingsmonitor skills (9)
│   ├── team-indeling/    #   Team-Indeling skills (9)
│   └── shared/           #   Gedeelde skills (1)
├── rules/                # Contextregels (5 bestanden) — Single Source of Truth
├── scripts/              # Data-pipeline en import scripts
│   ├── js/               #   JavaScript (verloop, cohorten, signalering)
│   ├── python/           #   Python (analyses, streefboog)
│   └── import/           #   TypeScript (data import, evaluatie import)
├── data/                 # Alle data (16 seizoenen, evaluaties, exports)
├── model/                # Statistisch jeugdmodel (YAML)
└── docs/                 # Documentatie + databronnen
    ├── teamindelingen/A2/ # A2-formulieren (.xlsm, 2018-2024)
    └── Telling spelers per seizoen.xlsx
```

## Workspace

- **Tool**: pnpm workspaces
- **Packages**: `packages/*`, `apps/*`, `apps/mcp/*`
- **Database**: Prisma in `packages/database/` is de **source of truth**

### Commando's

| Commando | Wat |
|---|---|
| `pnpm dev:ti` | Start Team-Indeling (Next.js) op poort **4100** |
| `pnpm dev:monitor` | Start Verenigingsmonitor op poort **4102** |
| `pnpm db:generate` | Genereer Prisma client |
| `pnpm db:push` | Push schema naar database |
| `pnpm import` | Importeer Verenigingsmonitor data |
| `pnpm import:evaluaties` | Importeer evaluaties uit Lovable |

## Database

### Gedeelde PostgreSQL op Railway
- **Host**: `shinkansen.proxy.rlwy.net:18957`
- **Database**: `oranjewit`
- **Schema eigenaarschap**: `packages/database/prisma/schema.prisma`

### Tabelverdeling (29 modellen)

**Competitie-data**:
CompetitieSpeler (`competitie_spelers`), CompetitieRonde (`competitie_rondes`)
VIEW `speler_seizoenen` — afgeleid uit `competitie_spelers` (DISTINCT ON rel_code, seizoen)

**Verenigingsmonitor** (snake_case via `@@map`):
Lid, LidFoto, Seizoen, OWTeam, TeamPeriode, Ledenverloop, CohortSeizoen, Signalering, Streefmodel, PoolStand, PoolStandRegel

**Team-Indeling** (PascalCase):
User, Speler, Staf, Blauwdruk, Pin, Concept, Scenario, Versie, Team, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam

### Competitie-datamodel

```
CompetitieSpeler (primaire tabel: 1 per speler × seizoen × competitie)
  └── VIEW speler_seizoenen (afgeleid: 1 per speler × seizoen)
```

- **~4933 records** in `competitie_spelers` — primaire bron, met `rel_code`, `seizoen`, `geslacht` direct
- VIEW `speler_seizoenen` leidt hieruit af via `DISTINCT ON (rel_code, seizoen)`
- Competitie-volgorde: veld_najaar → zaal → veld_voorjaar
- Excel-import (`sync-telling.ts`) is verwijderd — data staat definitief in de database

### Lees/schrijf
- **Team-Indeling schrijft**: blauwdruk, concepten, scenario's, teams, pins, log, evaluaties
- **Team-Indeling leest**: leden, speler_seizoenen, competitie_spelers, retentie
- **Monitor schrijft**: leden, teams, verloop, cohorten, signalering, competitie_spelers
- **Monitor leest**: alles (dashboards, signalering, MCP tools)

---

## Agents

| Agent | Domein | Rol |
|---|---|---|
| `korfbal` | Monitor (hoofd) | Technisch expert, seizoensplanning |
| `data-analist` | Monitor (sub) | Data-pipeline, dashboards |
| `speler-scout` | Monitor (sub) | Individuele spelersanalyse |
| `team-selector` | Brug | Teamindeling (monitor → TI) |
| `team-planner` | TI (hoofd) | Workflow blauwdruk → definitief |
| `regel-checker` | TI (sub) | KNKV + OW regelvalidatie |
| `adviseur` | TI (sub) | Spelersadvies, what-if, Oranje Draad |
| `ontwikkelaar` | TI (dev) | Next.js app bouwen en uitbreiden |

### Agent Fencing

Elke agent heeft een `skills:` lijst in zijn frontmatter die bepaalt wat hij mag gebruiken:

| Agent | Mag gebruiken |
|---|---|
| `korfbal` | `monitor/*`, `shared/*` |
| `data-analist` | `monitor/database`, `monitor/lid-monitor`, `monitor/ledenverloop`, `monitor/jeugdmodel`, `monitor/teamsamenstelling`, `shared/oranje-draad` |
| `speler-scout` | `monitor/ledenverloop`, `monitor/jeugdmodel`, `shared/oranje-draad` |
| `team-selector` | `monitor/teamsamenstelling`, `monitor/jeugdmodel`, `team-indeling/blauwdruk`, `shared/oranje-draad` |
| `team-planner` | `team-indeling/*`, `shared/*` |
| `regel-checker` | `team-indeling/validatie`, `shared/oranje-draad` |
| `adviseur` | `team-indeling/advies`, `team-indeling/vergelijk`, `shared/oranje-draad` |
| `ontwikkelaar` | `team-indeling/import`, `team-indeling/evaluatie` |

### Agent Hiërarchie

```
korfbal (hoofd monitor)
├── spawns: data-analist, speler-scout, team-selector
│
team-planner (hoofd TI) ← escalates-to: korfbal
├── spawns: regel-checker, adviseur
│
ontwikkelaar (dev) ← escalates-to: korfbal
```

### Agent Startup

Bij het spawnen van een agent via de Task tool MOET eerst de `shared/start` skill worden geladen. Dit is niet optioneel. De agent leest `skills/shared/start/SKILL.md` als eerste actie en doorloopt alle 4 stappen (basiscontext, domeincontext, dynamische context, eigen agent-bestand) voordat hij aan zijn eigenlijke taak begint.

## Skills

### Monitor (`skills/monitor/`)
database, exporteer, jeugdmodel, knkv-api, ledenverloop, lid-monitor, railway, scenario-analyse, teamsamenstelling

### Team-Indeling (`skills/team-indeling/`)
advies, blauwdruk, concept, evaluatie, import, pin, scenario, validatie, vergelijk

### Gedeeld (`skills/shared/`)
oranje-draad, start

## Rules

Rules zijn de **Single Source of Truth** voor domeinkennis. Agents en skills verwijzen naar rules, kopiëren nooit.

| Bestand | Onderwerp |
|---|---|
| `algemeen.md` | Taal, toon, naamgeving |
| `data.md` | Privacy, bestandsnaamgeving, formaten |
| `knkv-regels.md` | KNKV competitieregels (Competitie 2.0) |
| `ow-voorkeuren.md` | OW-specifieke teamvoorkeuren en indelingsfilosofie |
| `oranje-draad.md` | Drie pijlers, POP-ratio's, seizoenscyclus, toetsingsvragen |

## Externe koppelingen

| Bron | Wat | Hoe |
|---|---|---|
| Sportlink | Ledendata, stamgegevens | CSV/JSON export → leden tabel |
| KNKV API | Teamdata, indelingen | API calls (knkv-api skill) |
| Telling-bestand | 16 seizoenen spelersdata | Historische import, data staat definitief in PostgreSQL |
| Evaluatie-app (Lovable) | Spelerevaluaties | JSON export → `pnpm import:evaluaties` |

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
apps/monitor/ (dashboards) + apps/team-indeling/ (Next.js)

Lovable evaluatie-app → data/evaluaties/ (JSON export)
    ↓ (scripts/import/import-evaluaties.ts)
Railway PostgreSQL → Evaluatie tabel
```

## Deployment (Railway)

Alles draait in één Railway project (`oranje-wit-db`):
- **GitHub repo**: `mrbacklog/oranje-wit` (publiek, auto-deploy op push naar master)
- **Monitor**: https://monitor-production-b2b1.up.railway.app
- **Team-Indeling**: https://team-indeling-production.up.railway.app
- **Database**: `postgres.railway.internal:5432` (intern Railway netwerk)
- **Build**: per-app Dockerfiles (`apps/*/Dockerfile`), Node 22, pnpm workspace

## Communicatie
- **Taal**: altijd Nederlands
- **Toon**: informeel en direct
- **Verenigingsnaam**: "c.k.v. Oranje Wit"

## De Oranje Draad
```
PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID
```
Elke teamindeling wordt getoetst aan deze drie pijlers.
