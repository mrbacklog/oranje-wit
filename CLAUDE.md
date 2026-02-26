# c.k.v. Oranje Wit — Monorepo

Monorepo voor alle digitale tools van c.k.v. Oranje Wit: Verenigingsmonitor, Team-Indeling, en gedeelde data/database.

---

## Structuur

```
oranje-wit/
├── apps/
│   ├── monitor/          # Verenigingsmonitor (Express + HTML dashboards)
│   ├── team-indeling/    # Team-Indeling tool (Next.js)
│   └── mcp/              # MCP servers (database, Railway)
├── packages/
│   ├── database/         # @oranje-wit/database — Prisma schema + client
│   └── types/            # @oranje-wit/types — Gedeelde TypeScript types
├── agents/               # AI agent-definities (7 agents)
├── skills/               # AI skills per domein
│   ├── monitor/          #   Verenigingsmonitor skills (10)
│   ├── team-indeling/    #   Team-Indeling skills (7)
│   └── shared/           #   Gedeelde skills (2)
├── rules/                # Contextregels (6 bestanden)
├── scripts/              # Data-pipeline en import scripts
│   ├── js/               #   JavaScript (verloop, cohorten, signalering)
│   ├── python/           #   Python (analyses, streefboog)
│   └── import/           #   TypeScript (data import, evaluatie import)
├── data/                 # Alle data (16 seizoenen, evaluaties, exports)
├── model/                # Statistisch jeugdmodel (YAML)
└── docs/                 # Documentatie
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

### Tabelverdeling (30 modellen)

**Verenigingsmonitor** (snake_case via `@@map`):
Lid, Seizoen, Snapshot, LidSnapshot, OWTeam, TeamPeriode, SpelersPad, Ledenverloop, CohortSeizoen, Signalering, Streefmodel

**Team-Indeling** (PascalCase):
User, Speler, Staf, Blauwdruk, Pin, Concept, Scenario, Versie, Team, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam

### Lees/schrijf
- **Team-Indeling schrijft**: blauwdruk, concepten, scenario's, teams, pins, log, evaluaties
- **Team-Indeling leest**: leden, spelerspaden, retentie
- **Monitor schrijft**: leden, snapshots, teams, verloop, cohorten, signalering (via MCP sync)
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

### Agent Fencing

Elke agent heeft een `skills:` lijst in zijn frontmatter die bepaalt wat hij mag gebruiken:

| Agent | Mag gebruiken |
|---|---|
| `korfbal` | `monitor/*`, `shared/*` |
| `data-analist` | `monitor/database`, `monitor/lid-monitor`, `monitor/ledenverloop`, `shared/oranje-draad` |
| `speler-scout` | `monitor/ledenverloop`, `shared/oranje-draad` |
| `team-selector` | `monitor/teamsamenstelling`, `team-indeling/blauwdruk`, `shared/oranje-draad` |
| `team-planner` | `team-indeling/*`, `shared/*` |
| `regel-checker` | `team-indeling/validatie`, `shared/oranje-draad` |
| `adviseur` | `team-indeling/advies`, `shared/oranje-draad` |

## Skills

### Monitor (`skills/monitor/`)
database, exporteer, jeugdmodel, knkv-api, ledenverloop, lid-monitor, railway, scenario-analyse, seizoen-blauwdruk, team-indeling, teamsamenstelling

### Team-Indeling (`skills/team-indeling/`)
advies, blauwdruk, concept, pin, scenario, validatie, vergelijk

### Gedeeld (`skills/shared/`)
oranje-draad, strategie

## Rules

| Bestand | Onderwerp |
|---|---|
| `algemeen.md` | Taal, toon, naamgeving |
| `data.md` | Privacy, bestandsnaamgeving, formaten |
| `technisch-beleid.md` | Oranje Draad operationeel |
| `knkv-regels.md` | KNKV competitieregels |
| `ow-voorkeuren.md` | OW-specifieke teamvoorkeuren |
| `oranje-draad.md` | Drie pijlers: Plezier + Ontwikkeling + Prestatie → Duurzaamheid |

## Externe koppelingen

| Bron | Wat | Hoe |
|---|---|---|
| Sportlink | Ledendata, stamgegevens | CSV/JSON export → snapshots |
| KNKV API | Teamdata, indelingen | API calls (knkv-api skill) |
| Evaluatie-app (Lovable) | Spelerevaluaties | JSON export → `pnpm import:evaluaties` |

## Data Flow

```
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
