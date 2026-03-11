# c.k.v. Oranje Wit — Monorepo

Monorepo voor alle digitale tools van c.k.v. Oranje Wit: Verenigingsmonitor, Team-Indeling, en gedeelde data/database.

---

## Structuur

```
oranje-wit/
├── apps/
│   ├── monitor/          # Verenigingsmonitor (Next.js 16 dashboards)
│   ├── team-indeling/    # Team-Indeling tool (Next.js 16, Tailwind CSS 4, NextAuth v5, dnd-kit)
│   ├── evaluatie/        # Evaluatie-app (Next.js 16, spelerevaluaties, zelfevaluaties)
│   └── mcp/              # MCP servers (database, Railway)
├── packages/
│   ├── auth/             # @oranje-wit/auth — NextAuth v5 + Google OAuth
│   ├── database/         # @oranje-wit/database — Prisma schema + client
│   ├── types/            # @oranje-wit/types — Gedeelde TypeScript types
│   └── ui/               # @oranje-wit/ui — Gedeelde React componenten (KpiCard, SignalBadge, etc.)
├── e2e/                  # Playwright E2E tests (per app)
├── .claude/agents/       # AI agent-definities (10 agents, officiële Claude Code locatie)
├── agents/               # AI agent-definities (legacy kopie)
├── skills/               # AI skills per domein
│   ├── monitor/          #   Verenigingsmonitor skills (9)
│   ├── team-indeling/    #   Team-Indeling skills (10)
│   └── shared/           #   Gedeelde skills (4, incl. e2e-testing)
├── rules/                # Contextregels (5 bestanden) — Single Source of Truth
├── scripts/              # Data-pipeline en import scripts
│   ├── js/               #   JavaScript (verloop, cohorten, signalering)
│   ├── python/           #   Python (analyses, streefboog)
│   └── import/           #   TypeScript (data import, evaluatie import)
├── data/                 # Ledendata, seizoensdata, exports (database is primaire bron)
├── model/                # Statistisch jeugdmodel (YAML: jeugdmodel, plugin-interface, visualisatie-spec)
└── docs/                 # Documentatie, plannen, stafgegevens
    ├── plans/            #   Implementatieplannen
    └── staf/             #   Stafdata (CSV)
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
| `pnpm dev:evaluatie` | Start Evaluatie-app op poort **4104** |
| `pnpm build:evaluatie` | Build Evaluatie-app |
| `pnpm db:generate` | Genereer Prisma client |
| `pnpm db:push` | Push schema naar database |
| `pnpm import` | Importeer Verenigingsmonitor data |
| `pnpm import:evaluaties` | Importeer evaluaties (legacy Lovable import) |
| `pnpm test` | Draai alle unit tests (Vitest) |
| `pnpm test:ti` | Unit tests team-indeling |
| `pnpm test:monitor` | Unit tests monitor |
| `pnpm test:evaluatie` | Unit tests evaluatie |
| `pnpm test:e2e` | Alle E2E tests (Playwright) |
| `pnpm test:e2e:ti` | E2E tests team-indeling |
| `pnpm test:e2e:monitor` | E2E tests monitor |
| `pnpm test:e2e:evaluatie` | E2E tests evaluatie |
| `pnpm test:e2e:ui` | Playwright UI (interactief) |
| `pnpm format` | Format alles met Prettier |
| `pnpm format:check` | Check formatting (CI) |

## Code Quality

### Automatische gates
- **Pre-commit hook**: lint-staged draait ESLint + Prettier op staged bestanden
- **CI (GitHub Actions)**: typecheck + lint + format + unit tests + E2E tests op elke push/PR naar main
- **ESLint**: gedeelde regels in `eslint.config.mjs` — `no-console` (error), `no-empty` (error), `prefer-const` (error), `no-unused-vars` (warn), `max-lines` (400, warn)

### Verplichte patronen

**Logger** — gebruik altijd `logger` uit `@oranje-wit/types`, nooit `console.log`:
```ts
import { logger } from "@oranje-wit/types";
logger.info("...");   // alleen in development
logger.warn("...");   // altijd
logger.error("...");  // altijd
```

**API routes** — gebruik `ok()`/`fail()` uit `@/lib/api` met Zod validatie:
```ts
import { ok, fail, parseBody } from "@/lib/api";
import { z } from "zod";

const Schema = z.object({ naam: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, Schema);
    if (!parsed.ok) return parsed.response;
    const result = await prisma.model.create({ data: parsed.data });
    return ok(result);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
```

**Constanten** — importeer uit `@oranje-wit/types`, definieer niet lokaal:
```ts
import { PEILJAAR, HUIDIG_SEIZOEN, PEILDATUM } from "@oranje-wit/types";
```

**Error handling** — geen lege catch blocks, altijd loggen:
```ts
catch (error) {
  logger.warn("Context:", error);
}
```

## Database

### Gedeelde PostgreSQL op Railway
- **Host**: `shinkansen.proxy.rlwy.net:18957`
- **Database**: `oranjewit`
- **Schema eigenaarschap**: `packages/database/prisma/schema.prisma`

### Tabelverdeling (41 modellen)

**Competitie-data (2)**:
CompetitieSpeler (`competitie_spelers`), CompetitieRonde (`competitie_rondes`)
VIEW `speler_seizoenen` — afgeleid uit `competitie_spelers` (DISTINCT ON rel_code, seizoen)

**Verenigingsmonitor (12)** (snake_case via `@@map`):
Lid, LidFoto, Seizoen, OWTeam, TeamAlias, TeamPeriode, Ledenverloop, CohortSeizoen, Signalering, Streefmodel, PoolStand, PoolStandRegel

**Team-Indeling (21)** (PascalCase):
User, Speler, Staf, StafToewijzing, Blauwdruk, Pin, Concept, Scenario, Versie, Team, SelectieGroep, SelectieSpeler, SelectieStaf, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam, Notitie, Actiepunt

**Evaluatie (6)**:
EvaluatieRonde, Coordinator, CoordinatorTeam, EvaluatieUitnodiging, SpelerZelfEvaluatie, EmailTemplate

### Competitie-datamodel

```
CompetitieSpeler (primaire tabel: 1 per speler × seizoen × competitie)
  └── VIEW speler_seizoenen (afgeleid: 1 per speler × seizoen)
```

- **~4933 records** in `competitie_spelers` — primaire bron, met `rel_code`, `seizoen`, `geslacht` direct
- VIEW `speler_seizoenen` leidt hieruit af via `DISTINCT ON (rel_code, seizoen)`
- Competitie-volgorde: veld_najaar → zaal → veld_voorjaar
- Excel-import (`sync-telling.ts`) is verwijderd — data staat definitief in de database

### rel_code is de enige sleutel voor spelers/leden

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

### Lees/schrijf
- **Team-Indeling schrijft**: blauwdruk, concepten, scenario's, teams, selectiegroepen, pins, log, evaluaties, notities, actiepunten
- **Team-Indeling leest**: leden, speler_seizoenen, competitie_spelers, cohort_seizoenen (retentiePct)
- **Monitor schrijft**: leden, teams, verloop, cohorten, signalering, competitie_spelers
- **Monitor leest**: alles (dashboards, signalering, MCP tools)
- **Evaluatie schrijft**: evaluatierondes, coördinatoren, uitnodigingen, evaluaties, zelfevaluaties, email templates
- **Evaluatie leest**: leden, competitie_spelers, teams, spelers, staf

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
| `e2e-tester` | Test | Playwright E2E tests schrijven, draaien en repareren |
| `deployment` | Infra | Railway deployments, Cloudflare Worker proxy, DNS |
| `documentalist` | TI (docs) | Documentatie schrijven en onderhouden |

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
| `ontwikkelaar` | `team-indeling/import`, `team-indeling/evaluatie`, `shared/deployment` |
| `e2e-tester` | `shared/e2e-testing`, `shared/deployment` |
| `deployment` | `shared/deployment`, `monitor/railway` |
| `documentalist` | `team-indeling/blauwdruk`, `team-indeling/scenario`, `team-indeling/validatie`, `shared/oranje-draad` |

### Agent Hiërarchie

```
korfbal (hoofd monitor)
├── spawns: data-analist, speler-scout, team-selector
│
team-planner (hoofd TI) ← escalates-to: korfbal
├── spawns: regel-checker, adviseur
│
ontwikkelaar (dev) ← escalates-to: korfbal
├── spawns: e2e-tester
│
e2e-tester (test) ← escalates-to: ontwikkelaar
│
deployment (infra) ← escalates-to: korfbal
│
documentalist (docs) ← escalates-to: ontwikkelaar
├── spawns: ontwikkelaar (technische verificatie), korfbal (domeinverificatie)
```

### Agent Startup

Bij het spawnen van een agent MOET eerst de `shared/start` skill worden geladen. Dit is niet optioneel. De agent doorloopt alle 4 stappen (basiscontext, domeincontext, dynamische context, eigen agent-bestand) voordat hij aan zijn eigenlijke taak begint.

### Agent Teams (experimenteel)

Vier voorgedefinieerde agent teams voor parallelle samenwerking. Activeer met `/team-<naam>`.

| Team | Skill | Lead | Teammates | Use case |
|---|---|---|---|---|
| **Seizoensindeling** | `/team-seizoensindeling` | team-planner | adviseur, regel-checker, data-analist | Volledig indelingstraject (blauwdruk → definitief) |
| **Seizoensanalyse** | `/team-seizoensanalyse` | korfbal | data-analist, speler-scout, team-selector | Seizoensstart: totaalbeeld leden, retentie, prognoses |
| **Release** | `/team-release` | ontwikkelaar | e2e-tester, deployment | Feature bouwen + testen + deployen naar Railway |
| **E2E Testing** | `/team-e2e` | e2e-tester | ontwikkelaar, deployment | E2E testing, regressie, exploratory testing |
| **Documentatie** | `/team-documentatie` | documentalist | ontwikkelaar, korfbal | Documentatie schrijven en bijwerken |

Team-skills staan in `.claude/skills/team-*/SKILL.md`.

## Skills

### Monitor (`skills/monitor/`)
database, exporteer, jeugdmodel, knkv-api, ledenverloop, lid-monitor, railway, scenario-analyse, teamsamenstelling

### Team-Indeling (`skills/team-indeling/`)
advies, batch-plaats, blauwdruk, concept, evaluatie, import, pin, scenario, validatie, vergelijk

### Gedeeld (`skills/shared/`)
deployment, e2e-testing, oranje-draad, start

### Agent Teams (`.claude/skills/team-*/`)
team-seizoensindeling, team-seizoensanalyse, team-release, team-e2e, team-documentatie

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
| Evaluatie-app | Spelerevaluaties | Native app (`apps/evaluatie/`), direct in database |

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

apps/evaluatie/ (native Next.js) → direct in PostgreSQL (evaluaties, rondes, uitnodigingen)
```

## Deployment (Railway + Cloudflare)

Alles draait in één Railway project (`oranje-wit-db`):
- **GitHub repo**: `mrbacklog/oranje-wit` (publiek, auto-deploy op push naar main)
- **Monitor**: https://monitor.ckvoranjewit.app (via Cloudflare Worker → Railway)
- **Team-Indeling**: https://teamindeling.ckvoranjewit.app (via Cloudflare Worker → Railway)
- **Evaluatie**: https://evaluatie.ckvoranjewit.app (via Cloudflare Worker → Railway)
- **Database**: `postgres.railway.internal:5432` (intern Railway netwerk)
- **Build**: per-app Dockerfiles (`apps/*/Dockerfile`), Node 22, pnpm workspace
- **DNS**: Cloudflare (registrar + DNS + proxy), Worker `railway-proxy` als reverse proxy

## Communicatie
- **Taal**: altijd Nederlands
- **Toon**: informeel en direct
- **Verenigingsnaam**: "c.k.v. Oranje Wit"

## De Oranje Draad
```
PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID
```
Elke teamindeling wordt getoetst aan deze drie pijlers.
