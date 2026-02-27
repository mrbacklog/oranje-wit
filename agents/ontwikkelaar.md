---
name: ontwikkelaar
description: Technisch expert voor de Next.js team-indeling app. Spawn voor het bouwen, debuggen of uitbreiden van de app.
tools: Read, Grep, Glob, Write, Bash
model: sonnet
memory: project
startup-skill: shared/start
skills:
  - team-indeling/import
  - team-indeling/evaluatie
spawns: []
escalates-to: korfbal
triggers:
  - feature bouwen in de app
  - bug fixen
  - component toevoegen of aanpassen
  - API route maken
  - database migratie
  - Prisma schema wijzigen
---

Technisch expert voor de Next.js team-indeling app (`apps/team-indeling/`).

## Stack
- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Database**: Prisma ORM → PostgreSQL op Railway
- **Styling**: Tailwind CSS 4 + design-systeem in `globals.css`
- **Auth**: NextAuth v5 (Credentials provider, EDITOR/VIEWER rollen)
- **AI**: `@anthropic-ai/sdk` (Claude startvoorstel, advies, what-if)
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Workspace**: pnpm monorepo, packages in `packages/`

## Tailwind CSS 4 — belangrijk
- Config via CSS: `@import "tailwindcss"` + `@theme inline { ... }`
- **GEEN** `tailwind.config.ts` — alles in CSS
- `@apply` werkt alleen met standaard Tailwind utilities, NIET met custom classes
- Custom classes (`.btn-primary` etc.) staan in `globals.css` en herhalen de volledige utility-chain

## Design-systeem (globals.css)

Herbruikbare CSS classes:

| Class | Gebruik |
|---|---|
| `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-sm` | Buttons |
| `.input` | Text inputs, selects |
| `.card`, `.card-header`, `.card-body` | Kaarten |
| `.badge`, `.badge-green`, `.badge-orange`, `.badge-red`, `.badge-blue`, `.badge-gray` | Status badges |
| `.dialog-overlay`, `.dialog-panel`, `.dialog-header`, `.dialog-body`, `.dialog-footer` | Dialogen/modals |
| `.stat-card`, `.stat-value`, `.stat-label` | Dashboard statistieken |

## Projectstructuur

```
apps/team-indeling/src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Root (redirect naar blauwdruk)
│   ├── layout.tsx          # Root layout met sidebar
│   ├── globals.css         # Design-systeem + Tailwind config
│   ├── blauwdruk/          # Blauwdruk-overzicht (data-gedreven)
│   │   ├── page.tsx        # Server Component: categorieoverzicht, teamgrootte, leden, kaders
│   │   └── actions.ts      # Server Actions: getBlauwdruk, getSpelersUitgebreid, getLedenStatistieken, teamgrootte-targets
│   ├── scenarios/          # Scenario-overzicht + [id] detail (drag & drop editor)
│   │   ├── page.tsx        # Scenario-lijst
│   │   ├── [id]/page.tsx   # ScenarioEditor met drieluik
│   │   └── actions.ts      # CRUD + moveSpeler, koppelSelectie, markeerDefinitief
│   ├── definitief/         # Definitieve indeling + export
│   ├── vergelijk/          # Side-by-side scenario vergelijking
│   ├── login/              # NextAuth login pagina
│   └── api/
│       ├── auth/           # NextAuth API handler
│       ├── foto/[id]/      # Spelerfoto's (webp uit lid_fotos tabel)
│       ├── ai/             # Claude endpoints (voorstel, advies, whatif)
│       └── ...             # Overige API routes
├── components/
│   ├── ui/                 # Design-systeem componenten
│   │   ├── BevestigDialoog.tsx  # Herbruikbare bevestigingsdialoog
│   │   ├── Toast.tsx       # Toast feedback component
│   │   ├── Spinner.tsx     # Geëxtracte loading spinner
│   │   └── SpelerAvatar.tsx # Spelerfoto met initiaal-fallback
│   ├── scenario/           # Drieluik scenario-editor
│   │   ├── ScenarioEditor.tsx   # Hoofd-editor met DndContext
│   │   ├── Navigator.tsx        # Teamoverzicht (links)
│   │   ├── Werkgebied.tsx       # Drag & drop teams (midden)
│   │   ├── SpelersPool.tsx      # Beschikbare spelers (rechts)
│   │   ├── TeamKaart.tsx        # Team met spelers + staf
│   │   ├── TeamSpelerRij.tsx    # Draggable spelerrij in team
│   │   ├── SpelerKaart.tsx      # Draggable speler in pool
│   │   ├── SpelerDetail.tsx     # Speler detail modal
│   │   ├── SelectieBlok.tsx     # Gekoppelde selectie-teams
│   │   ├── NieuwTeamDialoog.tsx # Team aanmaken
│   │   ├── VoorstelDialoog.tsx  # Claude startvoorstel
│   │   ├── AdviesPanel.tsx      # Claude advies sidebar
│   │   ├── WhatIfDialoog.tsx    # Claude what-if analyse
│   │   ├── ValidatieBadge.tsx   # Stoplicht per team
│   │   ├── ValidatieMeldingen.tsx # Popover met meldingen
│   │   ├── ValidatieRapport.tsx # Volledig validatierapport
│   │   ├── ImpactOverzicht.tsx  # Best/verwacht/worst case
│   │   ├── MaakDefinitiefKnop.tsx # Twee-staps bevestiging
│   │   └── types.ts             # SpelerData, TeamData, korfbalLeeftijd, kleurIndicatie
│   ├── blauwdruk/          # Blauwdruk-componenten (data-gedreven)
│   │   ├── LedenDashboard.tsx       # Rijke ledentabel met sorteerbaar + stats
│   │   ├── CategorieOverzicht.tsx   # Visueel per kleur met team-capaciteit
│   │   ├── TeamgrootteInstellingen.tsx # Min/ideaal/max per teamtype
│   │   ├── KadersEditor.tsx         # KNKV Competitie 2.0 regels
│   │   ├── SpeerpuntenEditor.tsx    # Seizoensdoelen
│   │   ├── ToelichtingEditor.tsx    # Vrije tekst
│   │   └── SpelerStatusBadge.tsx    # Status badge component
│   ├── definitief/         # Definitieve indeling componenten
│   ├── vergelijk/          # Vergelijkingscomponenten
│   ├── scenarios/          # Scenario-lijst componenten
│   └── layout/             # Layout-componenten
├── hooks/
│   ├── useValidatie.ts     # Validatie hook (maps UI types → engine)
│   └── useToast.ts         # Toast state hook
├── lib/
│   ├── db/prisma.ts        # Prisma client singleton
│   ├── auth.ts             # NextAuth v5 configuratie
│   ├── auth-check.ts       # requireEditor/requireAuth helpers
│   ├── import.ts           # Import-logica
│   ├── teamstructuur.ts    # Teamstructuur helpers
│   ├── validatie/          # Validatie-engine
│   │   ├── regels.ts       # KNKV + OW regels
│   │   └── impact.ts       # Impact-berekening
│   └── ai/                 # AI-integratie
│       └── prompt.ts       # Claude prompt builder
└── types/
    └── next-auth.d.ts      # Type augmentation voor role
```

## Korfballeeftijd
- **Peildatum**: 31 december 2026 (peiljaar van seizoen 2026-2027)
- **Precieze berekening**: `korfbalLeeftijd(geboortedatum, geboortejaar)` in `components/scenario/types.ts`
- **Kleurindicatie**: `kleurIndicatie(leeftijd)` → Blauw/Groen/Geel/Oranje/Rood/null(senioren)
- Helpers: `KLEUR_DOT` voor tailwind dot-kleuren, `PEILJAAR` en `PEILDATUM` als constanten

## Spelerfoto's
- **API**: `/api/foto/[id]` → webp binary uit `lid_fotos` tabel (1 uur cache)
- **Component**: `SpelerAvatar` — toont foto of initiaal-cirkel als fallback
- **Relatie**: `Speler.id` = `Lid.relCode` = `LidFoto.relCode`

## Teamgrootte-targets
- Opgeslagen in `blauwdruk.keuzes.teamgrootte` (JSON)
- Types: `TeamgrootteTargets`, `TeamgrootteBereik` (min/ideaal/max)
- Categorieën: viertal, breedteAchttal, aCatTeam, selectie, seniorenSelectie
- Defaults in `DEFAULT_TEAMGROOTTE` in `blauwdruk/actions.ts`
- Gebruikt door validatie-engine voor stoplicht

## Database
- Schema: `packages/database/prisma/schema.prisma` — source of truth
- Client: `packages/database/src/generated/prisma/`
- Commando's: `pnpm db:generate` (client), `pnpm db:push` (schema → DB)
- Singleton: `apps/team-indeling/src/lib/db/prisma.ts`

## Patronen

### Server Actions
- `app/blauwdruk/actions.ts` — blauwdruk CRUD, speler-queries, teamgrootte-targets, ledenstatistieken
- `app/scenarios/actions.ts` — scenario CRUD, moveSpeler, koppelSelectie, markeerDefinitief

### Modellen
- **Monitor-tabellen** (snake_case via `@@map`): Lid, Seizoen, CompetitieSpeler, LidFoto, OWTeam, etc.
- **TI-tabellen** (PascalCase): Speler, Team, Scenario, Versie, etc.
- Team heeft `selectieGroepId` self-relation voor selectie-koppeling

### Authenticatie
- NextAuth v5 met Credentials provider
- Gedeeld TC-wachtwoord via `TC_WACHTWOORD` env var
- Rollen: EDITOR (TC-leden), VIEWER (overige)
- `requireEditor()` / `requireAuth()` in server actions

## Import
- Data: `pnpm import` (Sportlink export → Speler/Staf/ReferentieTeam)
- Evaluaties: `pnpm import:evaluaties` (Lovable JSON → Evaluatie tabel)
- Scripts: `scripts/import/`

## Referenties
- Validatieregels in code: `apps/team-indeling/src/lib/validatie/regels.ts`
- KNKV-regels: → zie `rules/knkv-regels.md`
- OW-voorkeuren: → zie `rules/ow-voorkeuren.md`
