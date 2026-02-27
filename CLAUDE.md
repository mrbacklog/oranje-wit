# c.k.v. Oranje Wit — Monorepo

Monorepo voor alle digitale tools van c.k.v. Oranje Wit: Verenigingsmonitor, Team-Indeling, en gedeelde data/database.

---

## Structuur

```
oranje-wit/
├── apps/
│   ├── monitor/          # Verenigingsmonitor (Express + HTML dashboards)
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
| `pnpm dev:ti` | Start Team-Indeling (Next.js) |
| `pnpm dev:monitor` | Start Verenigingsmonitor (Express) |
| `pnpm db:generate` | Genereer Prisma client |
| `pnpm db:push` | Push schema naar database |
| `pnpm import` | Importeer Verenigingsmonitor data |
| `pnpm import:evaluaties` | Importeer evaluaties uit Lovable |

## Database

### Gedeelde PostgreSQL op Railway
- **Host**: `shinkansen.proxy.rlwy.net:18957`
- **Database**: `oranjewit`
- **Schema eigenaarschap**: `packages/database/prisma/schema.prisma`

### Tabelverdeling (33 modellen)

**Competitie-data** (nieuw, vervangt SpelersPad):
SpelerSeizoen (`speler_seizoenen`), CompetitieSpeler (`competitie_spelers`), CompetitieRonde (`competitie_rondes`)

**Verenigingsmonitor** (snake_case via `@@map`):
Lid, Seizoen, Snapshot, LidSnapshot, OWTeam, TeamPeriode, ~~SpelersPad~~ (deprecated), Ledenverloop, CohortSeizoen, Signalering, Streefmodel

**Team-Indeling** (PascalCase):
User, Speler, Staf, Blauwdruk, Pin, Concept, Scenario, Versie, Team, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam

### Competitie-datamodel

```
SpelerSeizoen (1 per speler per seizoen)
  └── CompetitieSpeler (1 per competitieperiode: veld_najaar, zaal, veld_voorjaar)
```

- **9375 records** uit 5 bronnen: telling, snapshot, a2, sportlink, afgeleid
- **Dekking**: veld_najaar (16 seizoenen), zaal (7), veld_voorjaar (8)
- Elke record heeft een `bron` veld voor traceerbaarheid

### Lees/schrijf
- **Team-Indeling schrijft**: blauwdruk, concepten, scenario's, teams, pins, log, evaluaties
- **Team-Indeling leest**: leden, speler_seizoenen, competitie_spelers, retentie
- **Monitor schrijft**: leden, snapshots, teams, verloop, cohorten, signalering, speler_seizoenen, competitie_spelers
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

## Skills

### Monitor (`skills/monitor/`)
database, exporteer, jeugdmodel, knkv-api, ledenverloop, lid-monitor, railway, scenario-analyse, teamsamenstelling

### Team-Indeling (`skills/team-indeling/`)
advies, blauwdruk, concept, evaluatie, import, pin, scenario, validatie, vergelijk

### Gedeeld (`skills/shared/`)
oranje-draad

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
| Sportlink | Ledendata, stamgegevens | CSV/JSON export → snapshots |
| Sportlink | Teamindelingen (zaal) | CSV export → competitie_spelers |
| KNKV API | Teamdata, indelingen | API calls (knkv-api skill) |
| KNKV A2-formulieren | Teamindelingen per periode | .xlsm → competitie_spelers |
| Telling-bestand | 16 seizoenen spelersdata | Excel → sync-telling.ts |
| Evaluatie-app (Lovable) | Spelerevaluaties | JSON export → `pnpm import:evaluaties` |

## Data Flow

```
=== Competitie-data (speler × seizoen × competitie) ===

Telling Excel (16 seizoenen)
    ↓ (scripts/import/sync-telling.ts)
speler_seizoenen + competitie_spelers (veld_najaar)

A2-formulieren (docs/teamindelingen/A2/*.xlsm, 2018-2024)
    ↓ (inline import)
competitie_spelers (zaal)

Sportlink snapshots (data/leden/snapshots/YYYY-06-01.json)
    ↓ (scripts/import/import-veld-voorjaar.js)
competitie_spelers (veld_voorjaar)

=== Overige data ===

Sportlink CSV/JSON → data/leden/snapshots/
    ↓ (scripts/js/ pipeline)
data/aggregaties/ + data/ledenverloop/ + signalering
    ↓ (MCP sync tools)
Railway PostgreSQL ← Prisma schema (packages/database/)
    ↓
apps/monitor/ (dashboards) + apps/team-indeling/ (Next.js)

Lovable evaluatie-app → data/evaluaties/ (JSON export)
    ↓ (scripts/import/import-evaluaties.ts)
Railway PostgreSQL → Evaluatie tabel
```

## Communicatie
- **Taal**: altijd Nederlands
- **Toon**: informeel en direct
- **Verenigingsnaam**: "c.k.v. Oranje Wit"

## De Oranje Draad
```
PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID
```
Elke teamindeling wordt getoetst aan deze drie pijlers.
