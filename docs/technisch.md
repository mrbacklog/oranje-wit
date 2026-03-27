# Technische Documentatie — c.k.v. Oranje Wit Platform

> **Versie:** 1.0 | **Datum:** 2026-03-27
> **Doelgroep:** Ontwikkelaars en AI-agents die aan de codebase werken

---

## 1. Architectuuroverzicht

Het c.k.v. Oranje Wit platform is een **pnpm monorepo** met een **geconsolideerde Next.js 16 app** (`apps/web/`) die alle domeinen bedient onder een enkel domein: `ckvoranjewit.app`.

### Tech stack

| Laag | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion, dnd-kit |
| Data | Prisma ORM 7, PostgreSQL 16 (Railway) |
| Auth | NextAuth v5 (Google OAuth, smartlinks, credentials) |
| Charts | Recharts |
| Testing | Vitest (unit), Playwright (E2E) |
| Infra | Railway (hosting + DB), Cloudflare (DNS + proxy) |
| Package manager | pnpm 9.15.0, Node 22 |

### Route-groepen

De app gebruikt Next.js route groups om 5 domeinen te scheiden:

| Route group | Route prefix | Domein |
|---|---|---|
| `(beheer)` | `/beheer/*` | TC Beheer (9 subdomeinen) |
| `(evaluatie)` | `/evaluatie/*` | Spelerevaluaties |
| `(monitor)` | `/monitor/*` | Verenigingsmonitor |
| `(scouting)` | `/scouting/*` | Scouting-app |
| `(teamindeling)` | `/teamindeling/*` | Team-Indeling |
| -- | `/` | Hub/portaal (app-launcher) |
| -- | `/login` | Authenticatie |

Elke route group heeft een eigen `layout.tsx` in `apps/web/src/app/(<groep>)/layout.tsx`.

---

## 2. Monorepo-structuur

```
oranje-wit/
├── apps/
│   ├── web/              # Geconsolideerde Next.js 16 app (alle domeinen)
│   └── mcp/              # MCP servers (database, Railway)
├── packages/
│   ├── auth/             # @oranje-wit/auth — NextAuth v5 + Google OAuth
│   ├── database/         # @oranje-wit/database — Prisma schema + client
│   ├── types/            # @oranje-wit/types — Gedeelde TypeScript types
│   └── ui/               # @oranje-wit/ui — Gedeelde React componenten
├── e2e/                  # Playwright E2E tests
├── .claude/
│   ├── agents/           # 19 AI agent-definities
│   └── skills/           # 39 skills (flat structuur)
├── rules/                # 8 domeinregels (Single Source of Truth)
├── scripts/              # Data-pipeline en import
│   ├── js/               #   JavaScript (verloop, cohorten, signalering)
│   ├── python/           #   Python (analyses, streefboog)
│   └── import/           #   TypeScript (data import, evaluatie import)
├── data/                 # Ledendata, seizoensdata, exports
├── model/                # Statistisch jeugdmodel (YAML)
└── docs/                 # Documentatie, plannen, stafgegevens
```

### Packages

| Package | Naam | Doel |
|---|---|---|
| `packages/auth` | `@oranje-wit/auth` | NextAuth v5 config, capabilities, guards, smartlinks |
| `packages/database` | `@oranje-wit/database` | Prisma schema, client, migraties, views |
| `packages/types` | `@oranje-wit/types` | Gedeelde types, constanten, score-model, logger |
| `packages/ui` | `@oranje-wit/ui` | 71 React componenten, design tokens, motion variants |

---

## 3. Database

### PostgreSQL op Railway

- **Host**: `shinkansen.proxy.rlwy.net:18957`
- **Database**: `oranjewit`
- **Schema eigenaarschap**: `packages/database/prisma/schema.prisma`

### 53+ modellen in 7 groepen

| Groep | Aantal | Modellen |
|---|---|---|
| Competitie-data | 2 | CompetitieSpeler, CompetitieRonde |
| Verenigingsmonitor | 12 | Lid, LidFoto, Seizoen, OWTeam, TeamAlias, TeamPeriode, Ledenverloop, CohortSeizoen, Signalering, Streefmodel, PoolStand, PoolStandRegel |
| Team-Indeling | 25+ | User, Speler, Staf, StafToewijzing, Blauwdruk, BlauwdrukSpeler, BlauwdrukBesluit, StandaardVraag, Pin, Concept, Scenario, ScenarioSnapshot, Versie, Team, SelectieGroep, SelectieSpeler, SelectieStaf, TeamSpeler, TeamStaf, Evaluatie, LogEntry, Import, ReferentieTeam, Werkitem, Actiepunt, Activiteit |
| Evaluatie | 6 | EvaluatieRonde, Coordinator, CoordinatorTeam, EvaluatieUitnodiging, SpelerZelfEvaluatie, EmailTemplate |
| Scouting | 10+ | Scout, ScoutingRapport, TeamScoutingSessie, ScoutBadge, ScoutChallenge, ScoutingVerzoek, ScoutToewijzing, SpelersKaart, ScoutingVergelijking, ScoutingVergelijkingPositie, FysiekProfiel, SpelerUSS |
| Jeugdontwikkeling | 4 | RaamwerkVersie, Leeftijdsgroep, Pijler, OntwikkelItem |
| Systeem | 5 | Gebruiker, GebruikerRol, VerificatieToken, ToegangsToken, Mijlpaal, Aanmelding |

### rel_code als universele sleutel (KRITIEK)

De `rel_code` (Sportlink relatienummer, bijv. `NJH39X4`) is de **enige stabiele identifier** voor leden en spelers in het hele systeem.

```
leden.rel_code → competitie_spelers.rel_code → Speler.id
```

**Regels:**
1. Zoek spelers **altijd** op via `rel_code`, **nooit** via naam-matching
2. Een nieuw `Speler`-record krijgt `id = rel_code` uit de `leden`-tabel
3. De volledige achternaam: `leden.tussenvoegsel + " " + leden.achternaam`
4. Niet gevonden via `rel_code` = **fout**, niet stilzwijgend oplossen met fuzzy matching
5. Alle actieve leden (huidig seizoen in `competitie_spelers`) horen een `Speler`-record te hebben

### VIEW speler_seizoenen

```sql
-- Afgeleid uit competitie_spelers via DISTINCT ON (rel_code, seizoen)
-- Competitie-volgorde: veld_najaar → zaal → veld_voorjaar
```

**Waarom `db:push` verboden is:** Prisma `db:push` dropt en herstelt tabellen, maar kan geen VIEWs beheren. De VIEW `speler_seizoenen` wordt niet door Prisma onderhouden en wordt daardoor verwijderd zonder herstel.

### Competitie-datamodel

```
CompetitieSpeler (primaire tabel: ~4933 records, 1 per speler x seizoen x competitie)
  └── VIEW speler_seizoenen (afgeleid: 1 per speler x seizoen, DISTINCT ON)
```

### Lees/schrijf-verdeling per domein

| Domein | Schrijft | Leest |
|---|---|---|
| Monitor | leden, teams, verloop, cohorten, signalering, competitie_spelers | Alles (dashboards, signalering) |
| Team-Indeling | blauwdruk, concepten, scenario's, teams, selectiegroepen, pins, log, evaluaties, actiepunten | leden, speler_seizoenen, competitie_spelers, cohort_seizoenen |
| Evaluatie | evaluatierondes, coordinatoren, uitnodigingen, evaluaties, zelfevaluaties, email templates | leden, competitie_spelers, teams, spelers, staf |
| Scouting | scouts, rapporten, sessies, verzoeken, toewijzingen, kaarten, vergelijkingen, fysiek profielen, USS | leden, spelers, teams |

### Migratie-commando's

| Commando | Wat | Wanneer |
|---|---|---|
| `pnpm db:generate` | Genereer Prisma client | Na schema-wijziging |
| `pnpm db:migrate` | Maak nieuwe migratie (development) | Nieuwe kolom/tabel |
| `pnpm db:migrate:deploy` | Draai pending migraties + herstel VIEW | Productie |
| `pnpm db:migrate:status` | Toon migratiestatus | Diagnose |
| `pnpm db:ensure-views` | Controleer/herstel VIEW speler_seizoenen | Na deploy |
| ~~`pnpm db:push`~~ | **GEBLOKKEERD** | Nooit |

---

## 4. Authenticatie & Autorisatie

### NextAuth v5 met capabilities-based model

De authenticatie draait via `@oranje-wit/auth` met drie providers:

| Provider | Gebruik | Omgeving |
|---|---|---|
| Google OAuth | Primaire login voor TC-leden | Productie + development |
| Smartlink (credentials) | Token-based login voor trainers, scouts, coordinatoren | Altijd (ook productie) |
| Dev Login (credentials) | Lokale ontwikkeling zonder Google | Development + E2E |

### Capabilities in JWT

Bij login worden capabilities opgeslagen in de JWT. Geen database-queries nodig bij route-checks.

| Capability | Type | Beschrijving |
|---|---|---|
| `isTC` | `boolean` | TC-lid, volledige toegang |
| `isScout` | `boolean` | Scout, scouting-app toegang |
| `doelgroepen` | `string[]` | Trainer/coordinator, teamindeling-toegang |
| `clearance` | `0-3` | Spelersdata zichtbaarheid (zie sectie Clearance) |

### Clearance-niveaus

| Niveau | Label | Zichtbaar |
|---|---|---|
| 0 | Geen scores | Naam, leeftijd, team |
| 1 | Verhouding | + relatieve positie binnen team |
| 2 | Rating | + USS-getal + trend |
| 3 | Spelerskaart | + pijlerscores, radar, rapporten, historie |

Definitie: `packages/types/src/clearance.ts`

### Middleware route-bescherming

Bestand: `apps/web/src/middleware.ts`

| Route | Vereiste |
|---|---|
| `/beheer/*` | `isTC === true` |
| `/monitor/*` | `isTC === true` |
| `/scouting/*` | `isScout === true` OF `isTC === true` |
| `/teamindeling/*` | `isTC === true` OF `doelgroepen.length > 0` |
| `/evaluatie/*` | Geauthenticeerd (elke geldige sessie) |
| `/` | Publiek (pagina handelt auth-state zelf af) |
| `/login`, `/api/auth`, `/_next` | Publiek |

In development (`NODE_ENV === "development"`) worden alle routes doorgelaten.

### Auth guards

Bestand: `packages/auth/src/checks.ts`

**Twee patronen:**

```typescript
// 1. require*() — throw-based, voor Server Actions
import { requireTC } from "@oranje-wit/auth/checks";
export async function mijnAction() {
  const session = await requireTC(); // throws als niet-TC
}

// 2. guard*() — result-based, voor API routes
import { guardTC } from "@oranje-wit/auth/checks";
export async function POST(request: Request) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;
  const { session } = auth;
  // session.user.email, session.user.isTC, session.user.clearance
}
```

**Beschikbare guards:**

| Functie | Throw | Controle |
|---|---|---|
| `requireAuth()` / `guardAuth()` | Ja / Nee | Geldige sessie |
| `requireTC()` / `guardTC()` | Ja / Nee | TC-lid (isTC) |
| `requireScout()` / `guardScout()` | Ja / Nee | Scout of TC-lid |
| `requireCoordinator()` / `guardCoordinator()` | Ja / Nee | TC-lid of coordinator (doelgroepen) |
| -- / `guardClearance(level)` | -- / Nee | Minimum clearance-niveau |

---

## 5. Packages

### 5a. @oranje-wit/auth

**Pad:** `packages/auth/src/`

| Bestand | Doel |
|---|---|
| `index.ts` | NextAuth configuratie, providers, JWT callbacks, session callbacks |
| `checks.ts` | Auth guards (`require*`/`guard*`) |
| `allowlist.ts` | `getCapabilities(email)` — haalt capabilities uit `Gebruiker`-tabel |
| `adapter.ts` | Prisma adapter voor verificatie-tokens |
| `clearance.ts` | `bepaalClearance()`, `filterSpelersData()` |
| `tokens.ts` | Token-generatie en -validatie |
| `email.ts` | Nodemailer provider (lazy loaded, niet op Edge) |
| `email-template.ts` | HTML email templates |
| `smartlink-email.ts` | Smartlink email opmaak |

**Import:**

```typescript
import { auth } from "@oranje-wit/auth";
import { guardTC, requireTC } from "@oranje-wit/auth/checks";
import { bepaalClearance, filterSpelersData } from "@oranje-wit/auth";
```

### 5b. @oranje-wit/database

**Pad:** `packages/database/`

| Onderdeel | Pad |
|---|---|
| Schema | `prisma/schema.prisma` |
| Migraties | `prisma/migrations/` |
| VIEW-definitie | `prisma/views.sql` |
| Client export | `src/index.ts` |
| Gegenereerde client | `src/generated/prisma/` |
| Migrate-deploy script | `scripts/migrate-deploy.ts` (migraties + VIEW-herstel) |
| Ensure-views script | `scripts/ensure-views.ts` |

**Import:**

```typescript
import { prisma } from "@oranje-wit/database";
```

### 5c. @oranje-wit/types

**Pad:** `packages/types/src/`

| Bestand | Exports |
|---|---|
| `constanten.ts` | `PEILJAAR` (2026), `HUIDIG_SEIZOEN` ("2025-2026"), `PEILDATUM`, `MIN_GENDER_PER_TEAM` |
| `index.ts` | Base types: `Seizoen`, `Geslacht`, `Kleur`, `Categorie`, `SpelerStatusType`, `Ernst` |
| `api.ts` | `ApiError`, `ApiResponse<T>`, `ActionResult<T>` |
| `api-response.ts` | `ok()`, `fail()`, `parseBody()` — API route helpers |
| `score-model.ts` | USS-functies: `berekenUSSBasislijn()`, `knkvNaarUSS()`, `scoutingNaarUSS()`, `coachNaarUSS()`, `berekenSpelerUSS()` |
| `score-model-v2.ts` | USS v2 (per-pijler berekeningen) |
| `evaluatie.ts` | `EvaluatieScore`, `EvaluatieData`, `TeamGemiddelde` |
| `clearance.ts` | `Clearance` type, `CLEARANCE_LABELS`, `CLEARANCE_ZICHTBAARHEID`, `SpelersKaartData` |
| `leeftijdsgroep-config.ts` | `LEEFTIJDSGROEP_CONFIG`, `PijlerCode`, `SchaalTypeV3`, helpers |
| `logger.ts` | `logger` object (debug/info/warn/error) — vervangt `console.log` |
| `raamwerk-contract.ts` | Raamwerk data-contract |
| `seizoen-contract.ts` | Seizoen data-contract |

**Import:**

```typescript
import { PEILJAAR, HUIDIG_SEIZOEN, PEILDATUM } from "@oranje-wit/types";
import { type ActionResult, logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@oranje-wit/types";
```

### 5d. @oranje-wit/ui

**Pad:** `packages/ui/src/`

71 componenten in 9 categorieen:

| Categorie | Componenten |
|---|---|
| **Primitives** | Avatar, Badge, Button, Card, Dialog, IconButton, Input, Select, Skeleton, Textarea, Toggle, Tooltip |
| **Data display** | BandPill, EmptyState, KpiCard, Metric, ProgressBar, RadarChart, SignalBadge, StatCard, SpelersKaart |
| **Data input** | BezettingsRange, Chip, GetalInput, JaNeeToggle, KeuzeRadio, SearchInput |
| **Feedback** | BottomSheet, ConfirmDialog, InfoButton, InfoDrawer, Toast |
| **Layout** | AppShell, DomainShell, PageContainer, PageHeader, Sidebar, StickyHeader |
| **Navigation** | AppIcons, AppSwitcher, BottomNav, BottomNavShell, TopBar |
| **Nav Icons** | BeheerIcon, EvaluatieIcon, MonitorIcon, ScoutingIcon, TeamIndelingIcon |
| **Overlay** | Drawer, Popover |
| **Motion** | 15+ Framer Motion variants in `packages/ui/src/motion/` |

**Design tokens:**

| Bestand | Doel |
|---|---|
| `packages/ui/src/tokens/tokens.css` | 800+ regels, 13 secties, dark-first |
| `packages/ui/src/tokens/globals.css` | Semantic Tailwind utilities |
| `packages/ui/src/tokens/colors.ts` | JS kleuren voor charts en Framer Motion |

**Dark-first principe:**
- `:root` in `tokens.css` = dark mode (default)
- `[data-theme="light"]` = light override
- Alle apps hebben `data-theme="dark"` op `<html>`
- Team-indeling desktop: legacy licht thema (bewust), mobile is dark-first

**Import:**

```typescript
import { Button, Card, KpiCard } from "@oranje-wit/ui";
```

---

## 6. De vijf app-domeinen

### 6a. Hub (root)

**Route:** `/`

De hub is de startpagina en fungeert als app-launcher. Toont rol-gebaseerde secties op basis van JWT capabilities.

**Pagina's:**

| Route | Bestand |
|---|---|
| `/` | `apps/web/src/app/page.tsx` |
| `/login` | `apps/web/src/app/login/page.tsx` |
| `/login/smartlink/[token]` | `apps/web/src/app/login/smartlink/[token]/page.tsx` |

**API routes:**

| Methode | Pad | Functie |
|---|---|---|
| GET | `/api/health` | Health check |
| * | `/api/auth/[...nextauth]` | NextAuth endpoints |

### 6b. Beheer (/beheer)

**9 subdomeinen:**

| Domein | Route | Pagina's |
|---|---|---|
| Jaarplanning | `/beheer/jaarplanning/` | kalender, mijlpalen |
| Roostering | `/beheer/roostering/` | trainingen, wedstrijden |
| Teams & Leden | `/beheer/teams/` | overzicht, sync |
| Jeugdontwikkeling | `/beheer/jeugd/` | raamwerk, progressie, USS |
| Scouting | `/beheer/scouting/` | scouts |
| Evaluatie | `/beheer/evaluatie/` | rondes, coordinatoren, templates |
| Werving | `/beheer/werving/` | aanmeldingen, funnel |
| Systeem | `/beheer/systeem/` | gebruikers, import |
| Archivering | `/beheer/archief/` | teams, resultaten |

**Server actions (13 bestanden):** `apps/web/src/app/(beheer)/beheer/*/actions.ts`

Autorisatie: alle routes vereisen `isTC === true`.

### 6c. Evaluatie (/evaluatie)

**Routes:**

| Route | Functie |
|---|---|
| `/evaluatie` | Dashboard |
| `/evaluatie/admin` | Beheer (rondes, templates) |
| `/evaluatie/coordinator/[rondeId]/[teamId]` | Coordinator-view per team |
| `/evaluatie/invullen` | Trainer vult evaluatie in |
| `/evaluatie/zelf` | Speler vult zelfevaluatie in |

**API routes:**

| Methode | Pad | Functie |
|---|---|---|
| GET/POST | `/api/evaluatie/rondes` | CRUD evaluatierondes |
| POST | `/api/evaluatie/rondes/[id]/uitnodigen` | Uitnodigingen versturen |
| POST | `/api/evaluatie/rondes/[id]/herinneren` | Herinneringen versturen |
| POST | `/api/evaluatie/rondes/[id]/spelers-uitnodigen` | Spelers uitnodigen voor zelfevaluatie |
| GET | `/api/evaluatie/rondes/[id]/teams` | Teams per ronde |
| GET/POST | `/api/evaluatie/coordinatoren` | CRUD coordinatoren |
| GET/POST | `/api/evaluatie/evaluaties` | CRUD evaluaties |
| PATCH | `/api/evaluatie/evaluaties/[id]/memo` | Coordinator memo |
| GET/POST | `/api/evaluatie/templates` | Email templates |
| GET/POST | `/api/evaluatie/zelf-evaluaties` | Zelfevaluaties |

### 6d. Monitor (/monitor)

**Routes:**

| Route | Functie |
|---|---|
| `/monitor` | Dashboard (KPI's, signalering) |
| `/monitor/retentie` | Retentie-analyse per seizoen |
| `/monitor/retentie/[seizoen]` | Detail per seizoen |
| `/monitor/samenstelling` | Ledensamenstelling per geboortejaar |
| `/monitor/samenstelling/[geboortejaar]` | Detail per geboortejaar |
| `/monitor/signalering` | Actieve signaleringen |
| `/monitor/projecties` | Ledenprognoges en streefmodel |
| `/monitor/spelers` | Spelersoverzicht |
| `/monitor/spelers/[relCode]` | Spelersprofiel |
| `/monitor/teams` | Teamoverzicht |

**API routes:**

| Methode | Pad | Functie |
|---|---|---|
| GET | `/api/monitor/foto/[id]` | Lidfoto ophalen |
| PATCH | `/api/monitor/teams/[id]/naam` | Teamnaam wijzigen |
| PUT | `/api/monitor/teams/sort-order` | Team sorteervolgorde |

### 6e. Scouting (/scouting)

**Routes:**

| Route | Functie |
|---|---|
| `/scouting` | Dashboard |
| `/scouting/admin` | Beheer (items, raamwerk) |
| `/scouting/admin/raamwerk/[band]` | Raamwerk per leeftijdsgroep |
| `/scouting/rapport/nieuw/[relCode]` | Nieuw scoutingrapport |
| `/scouting/speler/[relCode]` | Spelersprofiel |
| `/scouting/team/[owTeamId]` | Teamoverzicht |
| `/scouting/vergelijking/nieuw` | Nieuwe vergelijking starten |
| `/scouting/verzoeken` | Verzoekenoverzicht |
| `/scouting/verzoeken/[id]` | Verzoekdetail |
| `/scouting/verzoeken/nieuw` | Nieuw verzoek |
| `/scouting/scouts` | Scoutsoverzicht |
| `/scouting/profiel` | Eigen scoutprofiel |
| `/scouting/kaarten` | Spelerskaarten |
| `/scouting/zoek` | Spelers zoeken |

**API routes (20+):** `apps/web/src/app/api/scouting/`

Inclusief rapport CRUD, verzoeken, toewijzingen, team-/spelersdata, kaarten, vergelijkingen, profiel, leaderboard, challenges, admin (items, raamwerk, validatie).

### 6f. Team-Indeling (/teamindeling)

**Routes:**

| Route | Functie |
|---|---|
| `/teamindeling` | Dashboard (overzicht blauwdruk + scenario's) |
| `/teamindeling/blauwdruk` | Blauwdruk beheer (kaders, besluiten, speerpunten) |
| `/teamindeling/scenarios` | Scenario-overzicht |
| `/teamindeling/scenarios/[id]` | Scenario-editor (drag-and-drop teamsamenstelling) |
| `/teamindeling/vergelijk` | Scenario's vergelijken |
| `/teamindeling/werkbord` | Werkitems en actiepunten |
| `/teamindeling/instellingen` | Import, gebruikers, referentieteams |
| `/teamindeling/over` | Over de app |
| `/teamindeling/design-system` | Design system catalog |

**API routes:**

| Methode | Pad | Functie |
|---|---|---|
| POST | `/api/teamindeling/import` | Spelersdata importeren |
| POST | `/api/teamindeling/cleanup` | Data opschonen |
| GET | `/api/teamindeling/foto/[id]` | Spelerfoto |
| POST | `/api/teamindeling/leden-sync/preview` | Preview leden-synchronisatie |
| POST | `/api/teamindeling/leden-sync/verwerk` | Verwerk leden-synchronisatie |
| POST | `/api/teamindeling/ratings/batch` | Batch rating-update |
| POST | `/api/teamindeling/ratings/herbereken` | Herbereken alle ratings |
| GET | `/api/teamindeling/ratings/preview` | Preview rating-wijzigingen |
| GET/POST | `/api/teamindeling/referentie-teams` | Referentieteams CRUD |
| POST | `/api/teamindeling/referentie-teams/ververs` | Ververs referentieteams |
| POST | `/api/teamindeling/scenarios/[id]/batch-plaats` | Batch spelers plaatsen |
| GET | `/api/teamindeling/scenarios/[id]/teams` | Teams in scenario |
| POST | `/api/teamindeling/scenarios/[id]/teamscore-sync` | Teamscores synchroniseren |
| GET | `/api/teamindeling/spelers/[id]/evaluaties` | Spelerevaluaties |
| GET/PUT | `/api/teamindeling/spelers/[id]/rating` | Spelerrating |

**Server actions (7 bestanden):**

| Bestand | Functies |
|---|---|
| `blauwdruk/actions.ts` | Blauwdruk CRUD, besluiten, speerpunten, gezien-status |
| `dashboard/actions.ts` | Dashboard data loading |
| `instellingen/actions.ts` | Instellingen, gebruikersbeheer |
| `pins/actions.ts` | Pin CRUD |
| `rating/actions.ts` | Rating-berekeningen |
| `scenarios/actions.ts` | Scenario CRUD, versies, teams, spelers, staf, snapshots |
| `werkbord/actions.ts` | Werkitems, actiepunten, activiteiten |

**Lib modules:**

| Bestand | Doel |
|---|---|
| `lib/teamindeling/auth.ts` | TI-specifieke auth helpers |
| `lib/teamindeling/auth-check.ts` | Auth checks voor TI routes |
| `lib/teamindeling/import.ts` | Data import logica |
| `lib/teamindeling/leden-csv.ts` | CSV parsing voor leden |
| `lib/teamindeling/leden-diff.ts` | Diff-berekening bij leden-sync |
| `lib/teamindeling/rating.ts` | Rating-berekeningen |
| `lib/teamindeling/seizoen.ts` | Seizoen helpers |
| `lib/teamindeling/teamstructuur.ts` | Teamstructuur helpers |
| `lib/teamindeling/doorstroom-signalering.ts` | Doorstroom-signalering |
| `lib/teamindeling/besluit-routing.ts` | Besluit-routing logica |
| `lib/teamindeling/teamKaartStijl.ts` | Visuele stijl per team |
| `lib/teamindeling/db/prisma.ts` | Database client voor TI |
| `lib/teamindeling/db/scenario-snapshot.ts` | Scenario snapshot logica |
| `lib/teamindeling/db/speler-guard.ts` | Speler-bewaking |
| `lib/teamindeling/api/index.ts` | API helpers |
| `lib/teamindeling/api/response.ts` | Response helpers |
| `lib/teamindeling/api/validate.ts` | Validatie helpers |
| `lib/teamindeling/validatie/` | Validatie-engine (zie sectie 7) |

---

## 7. Validatie-engine (teamindeling)

### Architectuur

De validatie-engine controleert teamindelingen op KNKV-regels en OW-voorkeuren. Bestanden in `apps/web/src/lib/teamindeling/validatie/`:

| Bestand | Verantwoordelijkheid |
|---|---|
| `regels.ts` | Publieke API, re-exporteert types en `valideerTeam()` |
| `types.ts` | Type-definities (`TeamData`, `SpelerData`, `ValidatieMelding`, etc.) |
| `harde-regels.ts` | KNKV-regels (teamgrootte, bandbreedte, leeftijd) |
| `zachte-regels.ts` | OW-voorkeuren (gender, duplicaten) |
| `selectie-regels.ts` | Selectie-specifieke regels |
| `constanten.ts` | Constanten (kleur-ranges, formats, volgorde) |
| `helpers.ts` | Helper-functies (leeftijdsberekening, categorie-detectie) |
| `impact.ts` | Impact-analyse (best/verwacht/worst case) |

### Stoplicht-systeem

| Status | Kleur | Betekenis |
|---|---|---|
| `ROOD` | Kritiek | KNKV-regel geschonden (speelverbod risico) |
| `ORANJE` | Aandacht | OW-voorkeur geschonden of risicosituatie |
| `GROEN` | OK | Alle regels voldaan |

### Harde regels (kritiek/ROOD)

Schending = ROOD stoplicht. Gebaseerd op KNKV Competitie 2.0.

| Regel | Ernst | Wat wordt gecontroleerd |
|---|---|---|
| `teamgrootte` | kritiek | Onder minimum of boven maximum spelers |
| `bandbreedte` | kritiek | Leeftijdsspreiding > max (2 jr voor 4-tal, 3 jr voor 8-tal) |
| `bandbreedte` (A-cat) | kritiek | Speler buiten geboortejaren-bandbreedte U15/U17/U19 |
| `gemiddelde_leeftijd` | kritiek | Gemiddelde leeftijd 8-tal < 9.0 jaar |
| `gender_verplicht` | kritiek | Onder verplicht minimum V of M (uit blauwdruk) |
| `gender_alleen` | kritiek | 1 kind alleen van een geslacht |
| `gender_balans` (A-cat) | kritiek | Verhouding M/V < 0.75 in A-categorie |
| `duplicaat` | kritiek | Speler staat dubbel in team |
| `dubbele_plaatsing` | kritiek | Speler in meerdere teams (cross-team check) |

### Zachte regels (aandacht/ORANJE)

| Regel | Ernst | Wat wordt gecontroleerd |
|---|---|---|
| `teamgrootte` | aandacht | Buiten ideale range maar binnen min-max |
| `leeftijd_kleur` | aandacht | Speler valt buiten leeftijdsrange van kleur |
| `kleur_grens` | aandacht | Gemiddelde leeftijd te dicht bij kleur-grens (herindelingsrisico) |
| `gender_balans` (B-cat) | aandacht | Verhouding M/V < 0.5 |
| `gender_gewenst` | aandacht | Onder gewenst minimum V of M |

Detail: `rules/knkv-regels.md` (KNKV) en `rules/ow-voorkeuren.md` (OW-voorkeuren)

### Impact-analyse

Bestand: `apps/web/src/lib/teamindeling/validatie/impact.ts`

Berekent drie scenario's op basis van spelerstatus:

| Scenario | Logica |
|---|---|
| **Best case** | Beschikbare + twijfelaars (stoppers weg) |
| **Verwacht** | Beschikbare + 50% twijfelaars |
| **Worst case** | Alleen beschikbare spelers |

Spelers met status `ALGEMEEN_RESERVE` worden uitgesloten uit alle berekeningen.

### Teamgrootte-targets uit blauwdruk

De validatie-engine accepteert optionele `BlauwdrukKaders` die per categorie de teamgrootte-grenzen en gender-eisen definiëren. Defaults uit `rules/ow-voorkeuren.md`:

| Type | Min | Ideaal | Max |
|---|---|---|---|
| 4-tal (Blauw, Groen) | 5 | 6 | 6 |
| Breedte 8-tal (Geel, Oranje, Rood) | 9 | 10 | 11 |
| A-categorie team | 8 | 10 | 11 |

---

## 8. Score-model (USS)

### Geunificeerde Score Schaal (0-200)

De USS plaatst teams en spelers op dezelfde schaal. Drie bronnen voeden de USS:

| Bron | Functie | Input |
|---|---|---|
| KNKV B-rating | `knkvNaarUSS(rating)` | KNKV-teamrating (directe mapping) |
| Scouting | `scoutingNaarUSS(score, groep)` | Pijlerscores + leeftijdsgroep |
| Coach-evaluatie | `coachNaarUSS(ussTeam, niveau)` | Team-USS + niveau 1-5 |

**Gecombineerde speler-USS:**

```
USS_speler = w_scout * USS_scouting + w_coach * USS_coach
```

Gewichten schalen met aantal scouting-rapporten (0 rapporten: 100% coach, 10+: 90% scout).

**Basislijnfunctie:**

```
S(leeftijd) = 180 / (1 + e^(-0.35 * (leeftijd - 12.5)))
```

Implementatie: `packages/types/src/score-model.ts`
Detail: `rules/score-model.md`

---

## 9. Data-pipeline

### Overzicht

```
=== Import ===
Sportlink CSV/JSON → leden tabel (via scripts/import/)

=== Competitie-data ===
competitie_spelers (primaire tabel, ~4933 records)
    → VIEW speler_seizoenen (DISTINCT ON rel_code + seizoen)

=== Verloop-pipeline ===
competitie_spelers + leden
    ↓ bereken-verloop.js
ledenverloop tabel
    ↓ bereken-cohorten.js
cohort_seizoenen tabel
    ↓ genereer-signalering.js
signalering tabel

=== KNKV sync ===
KNKV API → pool_standen, pool_stand_regels
    ↓ sync-standen-knkv.js

=== TI export ===
leden + competitie_spelers + cohort_seizoenen
    ↓ export-voor-teamindeling.js
→ JSON voor team-indeling
```

### Pipeline-commando's

| Commando | Script | Doel |
|---|---|---|
| `pnpm pipeline:verloop` | `scripts/js/bereken-verloop.js` | Berekent individueel verloop |
| `pnpm pipeline:cohorten` | `scripts/js/bereken-cohorten.js` | Aggregeert naar cohorten |
| `pnpm pipeline:signalering` | `scripts/js/genereer-signalering.js` | Genereert alerts |
| `pnpm pipeline:export` | `scripts/js/export-voor-teamindeling.js` | Export voor TI |
| `pnpm sync:standen` | `scripts/js/sync-standen-knkv.js` | KNKV poolstanden sync |
| `pnpm import` | `scripts/import/import-data.ts` | Monitor data import |
| `pnpm import:evaluaties` | `scripts/import/import-evaluaties.ts` | Evaluatie import |

---

## 10. Design System

### Token-architectuur

| Bestand | Doel |
|---|---|
| `packages/ui/src/tokens/tokens.css` | Foundation: 800+ regels, 13 secties, dark-first |
| `packages/ui/src/tokens/globals.css` | Tailwind bridge: semantic utilities |
| `packages/ui/src/tokens/colors.ts` | JS kleuren voor charts en Framer Motion |

### Kerntokens

| Token | Gebruik |
|---|---|
| `--surface-page` | Pagina-achtergrond |
| `--surface-card` | Kaarten, panels |
| `--surface-raised` | Modals, drawers |
| `--surface-sunken` | Input achtergrond |
| `--text-primary` | Primaire tekst |
| `--text-secondary` | Secundaire tekst |
| `--text-tertiary` | Gedempte tekst |
| `--border-default` | Standaard borders |
| `--ow-oranje-500` | Primaire accent (oranje) |

### Component-hierarchie

1. **Primitives** — Button, Card, Input, etc.
2. **Data display** — KpiCard, SignalBadge, RadarChart
3. **Data input** — SearchInput, Chip, GetalInput
4. **Feedback** — Toast, ConfirmDialog, InfoDrawer
5. **Layout** — AppShell, DomainShell, PageContainer
6. **Navigation** — TopBar, BottomNav, AppSwitcher
7. **Overlay** — Drawer, Popover

### Design gate (verplicht)

1. Gebruik componenten uit `packages/ui/` -- niet zelf bouwen
2. Gebruik design tokens -- nooit hardcoded kleuren (`bg-white`, `text-gray-*`)
3. Escaleer naar `ux-designer` bij visuele beslissingen
4. Draai `pnpm test:e2e:design-system` na frontend-wijzigingen

### Mobile navigatie-patroon

- **TopBar** (fixed, boven): paginatitel + acties
- **BottomNav** (fixed, onder): 4 in-app knoppen + 1 Apps-knop
- **AppSwitcher**: bottom sheet met 3x2 grid van alle apps
- Touch targets minimaal 44px
- Desktop: Sidebar vervangt BottomNav

---

## 11. Agent-ecosysteem

### 19 agents

| Agent | Rol | Skills |
|---|---|---|
| `product-owner` | Cross-app samenhang, prioritering | oranje-draad, score-model, audit |
| `korfbal` | Technisch expert, seizoensplanning | monitor/*, shared/* |
| `data-analist` | Data-pipeline, dashboards | database, lid-monitor, ledenverloop, jeugdmodel, teamsamenstelling |
| `speler-scout` | Individuele spelersanalyse | ledenverloop, jeugdmodel, oranje-draad, score-model |
| `team-selector` | Brug monitor --> TI | teamsamenstelling, jeugdmodel, blauwdruk, oranje-draad, score-model |
| `team-planner` | Workflow blauwdruk --> definitief | team-indeling/*, shared/* |
| `regel-checker` | KNKV + OW regelvalidatie | validatie, oranje-draad |
| `adviseur` | Spelersadvies, what-if | advies, vergelijk, oranje-draad, score-model |
| `ontwikkelaar` | Next.js app bouwen/uitbreiden | import, evaluatie, deployment, audit |
| `e2e-tester` | Playwright E2E tests | e2e-testing, deployment |
| `devops` | DevOps/DX lead | deployment, e2e-testing, health-check, ci-status, audit |
| `deployment` | Railway deployments, DNS | deployment, railway |
| `documentalist` | Documentatie schrijven | blauwdruk, scenario, validatie, oranje-draad |
| `jeugd-architect` | Jeugdontwikkelingsbeleid | oranje-draad, score-model, jeugdmodel, teamsamenstelling |
| `sportwetenschap` | ASM, bewegingskunde | oranje-draad, score-model, jeugdmodel |
| `mentaal-coach` | Mentale/sociale ontwikkeling | oranje-draad, jeugdmodel |
| `communicatie` | Presentaties, toelichtingen | oranje-draad |
| `ux-designer` | Design system, prototypes | oranje-draad, score-model, audit |
| `frontend` | React componenten, Tailwind | oranje-draad, deployment, e2e-testing, audit |

### Agent-hierarchie

```
product-owner (platform)
├── spawns: korfbal, ontwikkelaar, ux-designer, data-analist, communicatie, regel-checker

korfbal (monitor) ← escalates-to: product-owner
├── spawns: data-analist, speler-scout, team-selector

team-planner (TI) ← escalates-to: korfbal
├── spawns: regel-checker, adviseur

ontwikkelaar (dev) ← escalates-to: korfbal
├── spawns: e2e-tester, devops

devops (infra) ← escalates-to: ontwikkelaar
├── spawns: deployment, e2e-tester

documentalist (docs) ← escalates-to: ontwikkelaar
├── spawns: ontwikkelaar, korfbal

jeugd-architect (jeugd) ← escalates-to: korfbal
├── spawns: sportwetenschap, mentaal-coach, communicatie, korfbal, speler-scout

ux-designer (UX) ← escalates-to: ontwikkelaar
├── spawns: frontend, ontwikkelaar
```

### 39 skills

| Categorie | Skills |
|---|---|
| **Domein** (24) | advies, batch-plaats, blauwdruk, concept, database, deployment, e2e-testing, evaluatie, exporteer, import, jeugdmodel, knkv-api, ledenverloop, lid-monitor, oranje-draad, pin, railway, scenario, scenario-analyse, score-model, start, teamsamenstelling, validatie, vergelijk |
| **Infra** (4) | audit, ci-status, health-check, deploy |
| **Agent Teams** (11) | team-seizoensindeling, team-seizoensanalyse, team-release, team-e2e, team-documentatie, team-kwaliteit, team-devops, team-jeugdontwikkeling, team-ux, team-beheer, team-product |

### 11 agent teams

| Team | Lead | Teammates | Use case |
|---|---|---|---|
| Seizoensindeling | team-planner | adviseur, regel-checker, data-analist | Blauwdruk --> definitief |
| Seizoensanalyse | korfbal | data-analist, speler-scout, team-selector | Totaalbeeld leden, retentie |
| Release | ontwikkelaar | e2e-tester, deployment | Feature + test + deploy |
| E2E Testing | e2e-tester | ontwikkelaar, deployment | Regressie, exploratory |
| Documentatie | documentalist | ontwikkelaar, korfbal | Docs schrijven/bijwerken |
| Kwaliteit | ontwikkelaar | e2e-tester, regel-checker, deployment | Code quality review |
| DevOps | devops | deployment, e2e-tester, ontwikkelaar | CI, health, DX |
| Jeugdontwikkeling | jeugd-architect | sportwetenschap, mentaal-coach, communicatie, korfbal, speler-scout | Raamwerk, jeugdbeleid |
| UX | ux-designer | frontend, ontwikkelaar | Design system, dark theme |
| Beheer | ontwikkelaar | regel-checker, e2e-tester, korfbal | 9 TC-domeinen backend |
| Product | product-owner | korfbal, ontwikkelaar, ux-designer | Cross-app samenhang |

### Startup-protocol

Elke agent MOET eerst de `start` skill laden (`.claude/skills/start/SKILL.md`) en alle stappen doorlopen voordat hij aan zijn eigenlijke taak begint:

1. Basiscontext (vereniging, structuur, database)
2. Domeincontext (op basis van skills)
3. Dynamische context (git log, git status)
4. Eigen agent-bestand (`.claude/agents/{naam}.md`)

---

## 12. Deployment

### Architectuur

```
GitHub (mrbacklog/oranje-wit)
  ↓ push naar main
GitHub Actions CI
  ↓ quality + build + e2e -> deploy
Railway
  ├── web service (apps/web/Dockerfile)
  └── PostgreSQL database
Cloudflare
  └── DNS + proxy → ckvoranjewit.app
```

### Railway

- **1 app** (`@oranje-wit/web`), **1 database** (PostgreSQL 16)
- **Build**: Multi-stage Dockerfile (Node 22, pnpm 9.15.0)
  - Stage 1: Install dependencies
  - Stage 2: Build (Prisma generate + Next.js build met webpack voor PWA)
  - Stage 3: Production runtime (standalone output)
- **Domein**: `ckvoranjewit.app` (geen subdomeinen)
- **Database intern**: `postgres.railway.internal:5432`
- **Database extern**: `shinkansen.proxy.rlwy.net:18957`

### GitHub Actions CI/CD

Bestand: `.github/workflows/ci.yml`

4 jobs:

| Job | Draait op | Wat |
|---|---|---|
| `quality` | Push/PR naar main | Typecheck, lint, format, unit tests |
| `build` | Parallel met quality | Next.js build |
| `e2e` | Na build | Playwright E2E met PostgreSQL service container |
| `deploy` | Na quality + build + e2e groen | Railway deployment via GraphQL API |

De deploy-job triggert alleen op push naar main (niet op PR's).

---

## 13. Testing

### Unit tests (Vitest)

```bash
pnpm test          # Alle unit tests (recursief)
pnpm test:web      # Alleen web app tests
pnpm test:ui       # Alleen UI package tests
```

Configuratie: Vitest per package (`vitest.config.ts`).

### E2E tests (Playwright)

```bash
pnpm test:e2e      # Alle E2E tests
pnpm test:e2e:ui   # Playwright UI (interactief)
```

**Structuur:** `e2e/`

| Pad | Doel |
|---|---|
| `e2e/tests/` | Test specs |
| `e2e/fixtures/` | Seed data en cleanup scripts |

### Design system tests

```bash
pnpm test:e2e:design-system                          # Visual regression tests
pnpm test:e2e:design-system -- --update-snapshots    # Baselines updaten
```

Bestand: `e2e/tests/design-system.spec.ts`

### Auth bypass voor E2E

In CI/E2E omgeving (`E2E_TEST=true`):
- Credentials provider `dev-login` is actief
- Middleware laat development-omgeving door
- Test-database wordt geseeded via `e2e/fixtures/seed.ts`

---

## 14. Code-conventies

### Logger

Gebruik altijd `logger` uit `@oranje-wit/types`, nooit `console.log`:

```typescript
import { logger } from "@oranje-wit/types";
logger.info("Context geladen");    // alleen in development
logger.warn("Fallback gebruikt");  // altijd
logger.error("Fout:", error);      // altijd
```

Productie: alleen `warn` en `error`. Development: alles.

### Auth guards

```typescript
// Server action (throws, Next.js vangt)
import { requireTC } from "@oranje-wit/auth/checks";
const session = await requireTC();

// API route (returns Result, geen throw)
import { guardTC } from "@oranje-wit/auth/checks";
const auth = await guardTC();
if (!auth.ok) return auth.response;
```

### API response helpers

```typescript
import { ok, fail, parseBody } from "@oranje-wit/types";
import { z } from "zod";

const Schema = z.object({ naam: z.string().min(1) });

export async function POST(request: Request) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;
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

### ActionResult<T>

```typescript
import { type ActionResult } from "@oranje-wit/types";

export async function mijnAction(): Promise<ActionResult<{ id: string }>> {
  return { ok: true, data: { id: "abc" } };
  // of: { ok: false, error: "Foutmelding" }
}
```

### Server action vs API route

| Kies | Wanneer |
|---|---|
| Server action | Interne UI-interactie, formulier-submit, revalidation |
| API route | Externe clients, smartlink-gebruikers, file uploads, CORS |

### Constanten

Importeer uit `@oranje-wit/types`, definieer niet lokaal:

```typescript
import { PEILJAAR, HUIDIG_SEIZOEN, PEILDATUM } from "@oranje-wit/types";
```

### Error handling

Geen lege catch blocks, altijd loggen:

```typescript
catch (error) {
  logger.warn("Context:", error);
}
```

### ESLint regels

| Regel | Ernst |
|---|---|
| `no-console` | error |
| `no-empty` | error |
| `prefer-const` | error |
| `no-unused-vars` | warn |
| `max-lines` (400) | warn |

### Pre-commit hooks

Husky + lint-staged draait ESLint + Prettier op staged bestanden bij elke commit:

```json
{
  "*.{ts,tsx,mjs}": ["eslint --fix --max-warnings 0 --no-warn-ignored", "prettier --write"],
  "*.{json,css}": ["prettier --write"]
}
```

---

## 15. Commando-referentie

### Ontwikkeling

| Commando | Wat |
|---|---|
| `pnpm dev` | Start web app op poort 3000 |
| `pnpm build` | Build web app |
| `pnpm test` | Alle unit tests (Vitest, recursief) |
| `pnpm test:web` | Unit tests web app |
| `pnpm test:ui` | Unit tests UI package |
| `pnpm format` | Format alles met Prettier |
| `pnpm format:check` | Check formatting |

### Database

| Commando | Wat |
|---|---|
| `pnpm db:generate` | Genereer Prisma client |
| `pnpm db:migrate` | Maak nieuwe migratie (development) |
| `pnpm db:migrate:deploy` | Draai pending migraties + VIEW-herstel (productie) |
| `pnpm db:migrate:status` | Toon migratiestatus |
| `pnpm db:ensure-views` | Controleer/herstel VIEW speler_seizoenen |
| ~~`pnpm db:push`~~ | **GEBLOKKEERD** -- dropt VIEW |

### Data-pipeline

| Commando | Wat |
|---|---|
| `pnpm import` | Importeer Verenigingsmonitor data |
| `pnpm import:evaluaties` | Importeer evaluaties (legacy) |
| `pnpm import:check` | Controleer import-data |
| `pnpm pipeline:verloop` | Bereken ledenverloop |
| `pnpm pipeline:cohorten` | Bereken cohorten |
| `pnpm pipeline:signalering` | Genereer signaleringen |
| `pnpm pipeline:export` | Export voor teamindeling |
| `pnpm sync:standen` | Sync KNKV poolstanden |

### Testing

| Commando | Wat |
|---|---|
| `pnpm test:e2e` | Alle E2E tests (Playwright) |
| `pnpm test:e2e:ui` | Playwright UI (interactief) |
| `pnpm test:e2e:design-system` | Visual regression tests |
| `pnpm seed` | Seed test database |
| `pnpm seed:clean` | Cleanup test data |
| `pnpm test:db` | Test database connectie |

---

## Referenties

| Document | Pad | Onderwerp |
|---|---|---|
| KNKV-regels | `rules/knkv-regels.md` | Competitie 2.0 teamregels |
| OW-voorkeuren | `rules/ow-voorkeuren.md` | Teamgrootte, gender, indelingsprioriteiten |
| Score-model | `rules/score-model.md` | USS formules en kalibratie |
| Design system | `rules/design-system.md` | Dark-first tokens, design gate |
| Beheer-regels | `rules/beheer.md` | Ubiquitous language, 9 domeinen |
| Data-regels | `rules/data.md` | Privacy, formaten, KNKV API |
| Oranje Draad | `rules/oranje-draad.md` | Drie pijlers, POP-ratio's |
| Prisma schema | `packages/database/prisma/schema.prisma` | Volledige database-definitie |
