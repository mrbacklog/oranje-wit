# OW Scout -- Technische documentatie

Versie: 0.1.0 | Laatst bijgewerkt: 2026-03-26

---

## Inhoudsopgave

1. [Architectuur-overzicht](#1-architectuur-overzicht)
2. [Database-modellen](#2-database-modellen)
3. [API-referentie](#3-api-referentie)
4. [Authenticatie en autorisatie](#4-authenticatie-en-autorisatie)
5. [Score-berekening](#5-score-berekening)
6. [Gamification-engine](#6-gamification-engine)
7. [PWA-configuratie](#7-pwa-configuratie)
8. [Componenten-overzicht](#8-componenten-overzicht)
9. [Development guide](#9-development-guide)
10. [Bekende beperkingen en TODO's](#10-bekende-beperkingen-en-todos)

---

## 1. Architectuur-overzicht

### Plek in de monorepo

OW Scout is de vierde app in de `oranje-wit` monorepo, naast Monitor, Team-Indeling en Evaluatie. De app draait op poort **4106** in development en is bedoeld als mobiel-eerst scouting-tool voor trainers, coaches en andere vrijwilligers van c.k.v. Oranje Wit.

```
oranje-wit/
├── apps/
│   ├── scouting/          <-- deze app
│   ├── team-indeling/
│   ├── monitor/
│   ├── evaluatie/
│   └── mcp/
├── packages/
│   ├── auth/              @oranje-wit/auth (NextAuth v5 + Google OAuth)
│   ├── database/          @oranje-wit/database (Prisma schema + client)
│   ├── types/             @oranje-wit/types (constanten, logger, types)
│   └── ui/                @oranje-wit/ui (gedeelde componenten)
└── ...
```

### Tech stack

| Laag | Technologie | Versie |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| React | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| Animatie | Framer Motion | 12.7.3 |
| Grafieken | Recharts | 2.15.3 |
| Validatie | Zod | 3.24.0 |
| Auth | NextAuth (via `@oranje-wit/auth`) | 5.0.0-beta.28 |
| Database | Prisma (via `@oranje-wit/database`) | -- |
| PWA | @ducanh2912/next-pwa | 10.2.9 |
| Testing | Vitest + Testing Library + jsdom | 4.0.18 / 16.3.2 / 28.1.0 |

### Package dependencies

| Package | Gebruik |
|---|---|
| `@oranje-wit/auth` | Authenticatie (Google OAuth), `auth()` helper, session management |
| `@oranje-wit/database` | Prisma client, alle database-queries |
| `@oranje-wit/types` | `logger`, `PEILJAAR`, `HUIDIG_SEIZOEN`, `ApiResponse` type |
| `@oranje-wit/ui` | Gedeeld design system (niet direct gebruikt in componenten, wel via design tokens) |

### Directory-structuur

```
apps/scouting/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (Geist font, viewport, PWA manifest)
│   │   ├── page.tsx                 # Landing/login pagina
│   │   ├── globals.css              # Tailwind + design tokens (dark-first)
│   │   ├── (scout)/                 # Route group: auth-protected pagina's
│   │   │   ├── layout.tsx           # Scout layout (BottomNav, session check)
│   │   │   ├── page.tsx             # Dashboard (begroeting, gamification, acties)
│   │   │   ├── dashboard-gamification.tsx
│   │   │   ├── zoek/page.tsx        # Speler zoeken + recent bekeken
│   │   │   ├── team/
│   │   │   │   ├── page.tsx         # Team kiezen (grid per leeftijdsgroep)
│   │   │   │   ├── team-grid.tsx
│   │   │   │   └── [owTeamId]/      # Team-scouting wizard
│   │   │   │       ├── page.tsx
│   │   │   │       ├── team-scout-wizard.tsx
│   │   │   │       ├── speler-initiaal.tsx
│   │   │   │       └── stappen/     # Wizard-stappen (context, beoordeling, etc.)
│   │   │   ├── kaarten/page.tsx     # Kaarten-collectie (filter, sort, grid)
│   │   │   ├── speler/[relCode]/page.tsx  # Spelerprofiel (tabs: profiel/rapporten/kaart)
│   │   │   ├── rapport/nieuw/[relCode]/
│   │   │   │   ├── page.tsx         # Nieuw rapport voor individuele speler
│   │   │   │   └── rapport-wizard.tsx
│   │   │   └── profiel/page.tsx     # Scout-profiel (XP, badges, leaderboard)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── health/route.ts
│   │       ├── spelers/
│   │       │   ├── zoek/route.ts
│   │       │   └── [relCode]/
│   │       │       ├── route.ts     # Spelerprofiel API
│   │       │       └── foto/route.ts
│   │       ├── teams/
│   │       │   ├── route.ts         # Alle jeugdteams
│   │       │   └── [owTeamId]/spelers/route.ts
│   │       ├── kaarten/
│   │       │   ├── route.ts         # Alle spelerskaarten
│   │       │   └── [relCode]/route.ts
│   │       ├── scouting/
│   │       │   ├── rapport/route.ts # POST individueel rapport
│   │       │   └── team/route.ts    # POST team-scouting sessie
│   │       └── scout/
│   │           ├── profiel/route.ts
│   │           ├── leaderboard/route.ts
│   │           └── challenges/route.ts
│   ├── components/
│   │   ├── bottom-nav.tsx           # Vaste navigatiebalk onderaan
│   │   ├── speler-zoek.tsx          # Zoekcomponent met debounce + avatar
│   │   ├── leeftijdsgroep-badge.tsx # KNKV kleur-pill
│   │   ├── score-input/
│   │   │   ├── smiley-score.tsx     # 3-waarde invoer (1-3)
│   │   │   ├── sterren-score.tsx    # 5-sterren invoer
│   │   │   ├── slider-score.tsx     # 0-99 slider met snelkeuze
│   │   │   └── index.ts            # Barrel export
│   │   ├── spelers-kaart.tsx        # FIFA-achtige spelerskaart (voorkant)
│   │   ├── kaart-achterkant.tsx     # Achterkant (radar, bio, rapporten)
│   │   ├── kaart-effecten.tsx       # Tier-effecten (sheen, shimmer, shield)
│   │   ├── radar-chart.tsx          # SVG radar chart (6 assen)
│   │   ├── celebration-overlay.tsx  # Confetti + XP animatie na indienen
│   │   ├── xp-bar.tsx              # XP-voortgangsbalk met animatie
│   │   ├── badge-grid.tsx           # Badge-overzicht (3x3 grid + detail modal)
│   │   ├── leaderboard.tsx          # Ranglijst (podium + lijst)
│   │   ├── challenges.tsx           # Actieve challenges met voortgang
│   │   └── profiel-tabs.tsx         # Speler profiel-tabs (Profiel, Rapporten, Kaart)
│   ├── lib/
│   │   ├── api/
│   │   │   ├── response.ts         # ok() / fail() response helpers
│   │   │   ├── validate.ts         # parseBody() met Zod
│   │   │   └── index.ts
│   │   ├── db/
│   │   │   └── prisma.ts           # Re-export van @oranje-wit/database
│   │   └── scouting/
│   │       ├── leeftijdsgroep.ts    # Leeftijdsbepaling + schaaltype
│   │       ├── vragen.ts            # Beoordelingsvragen per leeftijdsgroep
│   │       ├── rating.ts            # Score-berekening, EWMA, tier
│   │       └── gamification.ts      # XP, levels, badges, checks
│   └── middleware.ts                # Auth guard voor /scout/* routes
├── public/
│   ├── manifest.json                # PWA manifest
│   └── icons/                       # App-iconen (192px, 512px)
├── design/
│   └── tokens.css                   # Design tokens (gedeeld met andere apps)
├── Dockerfile                       # Multi-stage Docker build
├── package.json
├── next.config.ts                   # PWA + standalone + transpile packages
└── docs/
    └── technisch.md                 # Dit document
```

---

## 2. Database-modellen

OW Scout introduceert 6 nieuwe Prisma-modellen plus 1 enum. Ze staan in `packages/database/prisma/schema.prisma`.

### Model-overzicht

| Model | Tabel | Beschrijving |
|---|---|---|
| `Scout` | `scouts` | Scout-profiel (XP, level, koppeling aan User/Staf) |
| `ScoutingRapport` | `scouting_rapporten` | Individueel beoordelingsrapport per speler |
| `TeamScoutingSessie` | `team_scouting_sessies` | Team-brede scouting sessie |
| `SpelersKaart` | `spelers_kaarten` | Geaggregeerde spelerscore (EWMA) per seizoen |
| `ScoutBadge` | `scout_badges` | Behaalde badges per scout |
| `ScoutChallenge` | `scout_challenges` | Tijdgebonden challenges |
| `ScoutingContext` | -- | Enum: `WEDSTRIJD`, `TRAINING`, `OVERIG` |

### Velden per model

#### Scout

| Veld | Type | Constraint | Beschrijving |
|---|---|---|---|
| `id` | String | PK, cuid | Uniek ID |
| `naam` | String | | Display-naam |
| `email` | String | unique | Google email |
| `userId` | String? | unique, FK -> User | Koppeling aan TI User |
| `stafId` | String? | unique, FK -> Staf | Koppeling aan TI Staf |
| `xp` | Int | default(0) | Totale experience points |
| `level` | Int | default(1) | Huidig level (1-10) |
| `createdAt` | DateTime | default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |

Relaties: `rapporten` -> ScoutingRapport[], `badges` -> ScoutBadge[], `teamSessies` -> TeamScoutingSessie[]

#### ScoutingRapport

| Veld | Type | Constraint | Beschrijving |
|---|---|---|---|
| `id` | String | PK, cuid | |
| `scoutId` | String | FK -> Scout | Wie heeft gescout |
| `spelerId` | String | FK -> Speler | Welke speler (= rel_code) |
| `seizoen` | String | | Bijv. "2025-2026" |
| `datum` | DateTime | default(now()) | |
| `context` | ScoutingContext | | WEDSTRIJD / TRAINING / OVERIG |
| `contextDetail` | String? | | Tegenstander of locatie |
| `scores` | Json | | Ruwe scores per vraag-id |
| `opmerking` | String? | @db.Text | Vrije tekst |
| `overallScore` | Int? | | Berekende overall score |
| `teamSessieId` | String? | FK -> TeamScoutingSessie | Optioneel, als onderdeel van team-sessie |
| `createdAt` | DateTime | | |
| `updatedAt` | DateTime | | |

Indexen: `[spelerId, seizoen]`, `[scoutId, datum]`, `[teamSessieId]`

#### TeamScoutingSessie

| Veld | Type | Constraint | Beschrijving |
|---|---|---|---|
| `id` | String | PK, cuid | |
| `scoutId` | String | FK -> Scout | |
| `owTeamId` | Int | FK -> OWTeam | Welk team |
| `seizoen` | String | | |
| `datum` | DateTime | default(now()) | |
| `context` | ScoutingContext | | |
| `contextDetail` | String? | | |
| `rankings` | Json? | | Optionele rankings per pijler |
| `createdAt` | DateTime | | |

Relaties: `rapporten` -> ScoutingRapport[], `scout` -> Scout, `owTeam` -> OWTeam

Index: `[owTeamId, seizoen]`

#### SpelersKaart

| Veld | Type | Constraint | Beschrijving |
|---|---|---|---|
| `id` | String | PK, cuid | |
| `spelerId` | String | FK -> Speler | |
| `seizoen` | String | | |
| `overall` | Int | | Gewogen gemiddelde (0-99) |
| `schot` | Int | | Pijler SCH |
| `aanval` | Int | | Pijler AAN |
| `passing` | Int | | Pijler PAS |
| `verdediging` | Int | | Pijler VER |
| `fysiek` | Int | | Pijler FYS |
| `mentaal` | Int | | Pijler MEN |
| `aantalRapporten` | Int | default(0) | |
| `betrouwbaarheid` | String | default("concept") | concept/basis/betrouwbaar/bevestigd |
| `laatsteUpdate` | DateTime | default(now()) | |
| `trendOverall` | Int? | default(0) | Verschil t.o.v. vorige overall |

Constraint: `@@unique([spelerId, seizoen])` -- 1 kaart per speler per seizoen

#### ScoutBadge

| Veld | Type | Constraint | Beschrijving |
|---|---|---|---|
| `id` | String | PK, cuid | |
| `scoutId` | String | FK -> Scout | |
| `badge` | String | | Badge-identifier (bijv. "eerste_rapport") |
| `unlockedAt` | DateTime | default(now()) | |

Constraint: `@@unique([scoutId, badge])` -- elke badge maximaal 1x per scout

#### ScoutChallenge

| Veld | Type | Constraint | Beschrijving |
|---|---|---|---|
| `id` | String | PK, cuid | |
| `naam` | String | | |
| `beschrijving` | String | | |
| `xpBeloning` | Int | | XP bij voltooiing |
| `startDatum` | DateTime | | |
| `eindDatum` | DateTime | | |
| `seizoen` | String | | |
| `voorwaarde` | Json | | `{ type, aantal }` |
| `createdAt` | DateTime | | |

### ER-diagram

```
 ┌──────────┐     ┌──────────────────┐     ┌──────────────┐
 │   User   │     │      Scout       │     │     Staf     │
 │──────────│     │──────────────────│     │──────────────│
 │ id    PK │◄────│ userId?    FK    │     │ id        PK │
 └──────────┘     │ stafId?    FK    │────►│              │
                  │ email   unique   │     └──────────────┘
                  │ xp, level        │
                  └───────┬──────────┘
                          │ 1:N
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
  ┌──────────────┐ ┌───────────┐ ┌──────────────────┐
  │ScoutingRapport│ │ScoutBadge │ │TeamScoutingSessie│
  │──────────────│ │───────────│ │──────────────────│
  │ scoutId   FK │ │ scoutId FK│ │ scoutId    FK    │
  │ spelerId  FK │ │ badge     │ │ owTeamId   FK    │────►┌────────┐
  │ seizoen      │ └───────────┘ │ seizoen          │     │ OWTeam │
  │ context      │               │ rankings?   Json │     └────────┘
  │ scores  Json │               └────────┬─────────┘
  │ overallScore │                        │ 1:N
  │ teamSessieId?│◄───────────────────────┘
  └──────┬───────┘
         │ FK
         ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────┐
  │   Speler     │     │ SpelersKaart │     │  Lid │
  │──────────────│     │──────────────│     │──────│
  │ id (=rel_code)│◄───│ spelerId  FK │     │relCode│
  │ roepnaam     │     │ seizoen      │     │ ...  │
  │ achternaam   │     │ overall, ... │     └──────┘
  │ geboortejaar │     │ betrouwbaarh.│
  │ huidig  Json │     └──────────────┘
  └──────────────┘
         ▲
         │ (rel_code = Speler.id = Lid.relCode)
  ┌──────────────┐
  │   LidFoto    │
  │──────────────│
  │ relCode   FK │
  │ imageWebp    │
  └──────────────┘
```

### Relaties met bestaande modellen

- **Speler** (`id` = `rel_code`): ScoutingRapport.spelerId en SpelersKaart.spelerId verwijzen naar Speler.id
- **User**: Scout.userId verwijst optioneel naar User.id (TI-gebruiker)
- **Staf**: Scout.stafId verwijst optioneel naar Staf.id (TI-stafrecord)
- **OWTeam**: TeamScoutingSessie.owTeamId verwijst naar OWTeam.id
- **Lid**: Gebruikt voor tussenvoegsel en lidSinds (lookup via relCode)
- **LidFoto**: Gebruikt voor spelerfoto's (lookup via relCode)
- **CompetitieSpeler**: Gebruikt om spelers per team te vinden (seizoen + teamnaam)
- **TeamAlias**: Gebruikt om alternatieve teamnamen te resolven

---

## 3. API-referentie

Alle API-routes gebruiken het `ok()`/`fail()` response-patroon uit `src/lib/api/`. Standaard response-formaat:

```json
// Succes
{ "ok": true, "data": { ... } }

// Fout
{ "ok": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

### Health

| | |
|---|---|
| **Route** | `GET /api/health` |
| **Auth** | Geen |
| **Response** | `{ status: "ok", app: "scouting", timestamp: "..." }` |

### Spelers

#### Zoeken

| | |
|---|---|
| **Route** | `GET /api/spelers/zoek?q={zoekterm}` |
| **Auth** | Geen (impliciet via session) |
| **Query params** | `q` (string, min 1, max 100) -- zoekt op roepnaam, achternaam, rel_code |
| **Response** | Array van max 20 spelers |

Response-velden per speler:

| Veld | Type | Beschrijving |
|---|---|---|
| `relCode` | string | Speler.id (= rel_code) |
| `roepnaam` | string | |
| `achternaam` | string | |
| `geslacht` | string | M/V |
| `geboortejaar` | number | |
| `leeftijd` | number | PEILJAAR - geboortejaar |
| `kleur` | string | KNKV leeftijdsgroep (paars/blauw/groen/geel/oranje/rood/senior) |
| `team` | string \| null | Huidige teamnaam uit `huidig` JSON |
| `heeftFoto` | boolean | Of er een LidFoto record bestaat |

Error codes: `422 VALIDATION_ERROR`

#### Spelerprofiel

| | |
|---|---|
| **Route** | `GET /api/spelers/{relCode}` |
| **Auth** | Geen (impliciet) |
| **Pad-parameter** | `relCode` (string, min 2) |
| **Response** | Volledig spelerprofiel inclusief scouting-data |

Response bevat: basisgegevens, `huidig` (team/categorie/kleur), `spelerspad` (teamhistorie), `heeftFoto`, `fotoUrl`, `scoutingRapporten` (max 10), `spelersKaart` (indien beschikbaar), `evaluaties` (max 5).

Error codes: `400 BAD_REQUEST`, `404 NOT_FOUND`

#### Spelerfoto

| | |
|---|---|
| **Route** | `GET /api/spelers/{relCode}/foto` |
| **Auth** | Geen |
| **Response** | Binary webp image |
| **Headers** | `Content-Type: image/webp`, `Cache-Control: public, max-age=86400` |

Retourneert `404` zonder body als er geen foto is.

### Teams

#### Alle jeugdteams

| | |
|---|---|
| **Route** | `GET /api/teams?seizoen={seizoen}` |
| **Auth** | Vereist (session check) |
| **Query params** | `seizoen` (optioneel, default: `HUIDIG_SEIZOEN`) |
| **Response** | Array van OWTeam-records met `aantalSpelers` |

Filtert op jeugdteams (leeftijdsgroep != null). Per team wordt het aantal spelers geteld via CompetitieSpeler + TeamAlias.

Error codes: `401 UNAUTHORIZED`

#### Teamspelers

| | |
|---|---|
| **Route** | `GET /api/teams/{owTeamId}/spelers` |
| **Auth** | Vereist |
| **Pad-parameter** | `owTeamId` (integer) |
| **Response** | `{ team: {...}, spelers: [{...heeftFoto}] }` |

Zoekt spelers via CompetitieSpeler (seizoen + teamnaam/aliases), haalt Speler-records op, checked foto-beschikbaarheid.

Error codes: `400 BAD_REQUEST`, `401 UNAUTHORIZED`, `404 NOT_FOUND`

### Kaarten

#### Alle spelerskaarten

| | |
|---|---|
| **Route** | `GET /api/kaarten` |
| **Auth** | Geen (impliciet) |
| **Response** | Array van kaarten gesorteerd op overall desc |

Per kaart: `spelerId`, naam, `leeftijd`, `team`, `overall`, `stats` (6 pijlers), `tier` (brons/zilver/goud), `sterren` (1-5), `fotoUrl`, `laatsteUpdate`, `achterkant` (bio, rapporten, trend, radarScores).

#### Individuele kaart

| | |
|---|---|
| **Route** | `GET /api/kaarten/{relCode}` |
| **Auth** | Geen |
| **Pad-parameter** | `relCode` (string, min 2) |
| **Response** | SpelersKaart met berekende tier, sterren en achterkant-data |

Inclusief laatste 3 rapporten voor de achterkant.

Error codes: `400 BAD_REQUEST`, `404 NOT_FOUND`

### Scouting

#### Individueel rapport indienen

| | |
|---|---|
| **Route** | `POST /api/scouting/rapport` |
| **Auth** | Vereist |
| **Content-Type** | `application/json` |

Request body (Zod-gevalideerd):

```typescript
{
  spelerId: string,           // rel_code
  context: "WEDSTRIJD" | "TRAINING" | "OVERIG",
  contextDetail?: string,     // bijv. "Deetos D1"
  scores: Record<string, number>,  // vraag-id -> waarde
  opmerking?: string
}
```

Response:

```json
{
  "rapport": { "id": "...", "overall": 65, "pijlerScores": { "SCH": 70, ... } },
  "xpGained": 15,
  "totalXp": 165,
  "levelInfo": { "level": 3, "naam": "Verkenner", ... },
  "badgeUnlocked": ["eerste_rapport"]
}
```

**Side effects:**
1. Maakt ScoutingRapport aan
2. Upsert SpelersKaart (EWMA-update)
3. Increment scout XP
4. Update scout level indien nodig
5. Check en sla nieuwe badges op

Error codes: `401 UNAUTHORIZED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`

#### Team-scouting sessie indienen

| | |
|---|---|
| **Route** | `POST /api/scouting/team` |
| **Auth** | Vereist |
| **Content-Type** | `application/json` |

Request body:

```typescript
{
  owTeamId: number,
  context: "WEDSTRIJD" | "TRAINING" | "OVERIG",
  contextDetail?: string,
  rapporten: Array<{
    spelerId: string,
    scores: Record<string, number>,
    opmerking?: string
  }>,
  rankings?: Record<string, string[]>  // pijler -> spelerId[] volgorde
}
```

Response:

```json
{
  "sessie": { "id": "...", "teamNaam": "OW D1" },
  "rapportenCount": 8,
  "rapporten": [{ "spelerId": "...", "overall": 65 }],
  "xpGained": 170,
  "totalXp": 335,
  "levelInfo": { ... },
  "badgeUnlocked": { "badge": "...", "naam": "..." },
  "badges": ["..."]
}
```

**XP-berekening team**: 15 XP per speler (+ 25 bonus als eerste rapport voor die speler) + 50 bonus voor team-complete.

Error codes: `401 UNAUTHORIZED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`

### Scout-profiel

#### Profiel ophalen

| | |
|---|---|
| **Route** | `GET /api/scout/profiel` |
| **Auth** | Vereist |
| **Response** | Scout-profiel met XP, level, badges, stats |

Stats bevat: `totaalRapporten`, `dezeMaand`, `gemiddeldPerWeek`, `uniekeSpelers`, `streak` (weken achtereen).

Als de scout nog niet bestaat, retourneert een lege staat met `scout: null`.

#### Leaderboard

| | |
|---|---|
| **Route** | `GET /api/scout/leaderboard` |
| **Auth** | Vereist |
| **Response** | Top 10 scouts + eigen positie |

Namen worden geanonimiseerd (alleen voornaam) voor privacy. Eigen positie wordt apart berekend als die niet in de top 10 zit.

#### Challenges

| | |
|---|---|
| **Route** | `GET /api/scout/challenges` |
| **Auth** | Vereist |
| **Response** | Actieve challenges met voortgang per scout |

Challenge-voorwaarden:

| Type | Telt |
|---|---|
| `rapporten` | ScoutingRapport.count in periode |
| `unieke_spelers` | ScoutingRapport.groupBy(spelerId) in periode |
| `team_sessies` | TeamScoutingSessie.count in periode |

---

## 4. Authenticatie en autorisatie

### NextAuth v5 setup

De app gebruikt het gedeelde `@oranje-wit/auth` package. De NextAuth route handler staat in `src/app/api/auth/[...nextauth]/route.ts` en exporteert de `GET` en `POST` handlers.

```
src/app/api/auth/[...nextauth]/route.ts
  -> importeert { handlers } from "@oranje-wit/auth"
```

Google OAuth is de enige login-methode. Na succesvolle login wordt een session aangemaakt.

### Rollen

De scouting-app heeft **geen** eigen rollenmodel. Er zijn drie niveaus van toegang:

| Niveau | Wie | Hoe |
|---|---|---|
| Publiek | Iedereen | Landing page (`/`), health check |
| Ingelogd | Elke Google-gebruiker met OW-account | Alle `/scout/*` routes, alle API's behalve health |
| Scout | Automatisch na eerste rapport | Scout-profiel wordt aangemaakt bij het indienen van het eerste rapport |

Er is geen SCOUT/EDITOR/VIEWER rolsysteem zoals in Team-Indeling. Elke ingelogde gebruiker kan scouten.

### Middleware

`src/middleware.ts` beschermt alle routes onder `/scout/*`:

```typescript
export const config = {
  matcher: ["/scout/:path*"],
};
```

Als er geen session is, redirected de middleware naar de root URL.

**Let op**: De `(scout)` route group in Next.js App Router matched op de root `/` na inloggen. Het `(scout)/layout.tsx` doet een extra server-side session check en redirect naar `/api/auth/signin` als er geen session is.

### Token-based access

Er is geen apart token-systeem. De app gebruikt uitsluitend NextAuth sessions (HTTP-only cookies). Elke API route die auth nodig heeft, roept `auth()` aan en checkt `session?.user?.email`.

---

## 5. Score-berekening

Bronbestanden: `src/lib/scouting/rating.ts`, `src/lib/scouting/leeftijdsgroep.ts`, `src/lib/scouting/vragen.ts`

### Leeftijdsgroepen

Op basis van korfballeeftijd (`PEILJAAR - geboortejaar`):

| Groep | Leeftijd | Schaaltype | Max invoer | Aantal vragen |
|---|---|---|---|---|
| Paars | 5 | Smiley (1-3) | 3 | 6 |
| Blauw | 6-7 | Smiley (1-3) | 3 | 6 |
| Groen | 8-9 | Smiley (1-3) | 3 | 10 |
| Geel | 10-12 | Sterren (1-5) | 5 | 18 (3 per pijler) |
| Oranje | 13-15 | Sterren (1-5) | 5 | 24 (4 per pijler) |
| Rood | 16-18 | Slider (0-99) | 99 | 36 (6 per pijler) |

### Score-ranges per leeftijdsgroep

Elke groep heeft een overlappende range op de 0-99 schaal:

| Groep | Min | Max |
|---|---|---|
| Paars | 0 | 40 |
| Blauw | 0 | 40 |
| Groen | 5 | 55 |
| Geel | 15 | 70 |
| Oranje | 25 | 85 |
| Rood | 35 | 99 |

De ranges overlappen bewust, zodat een sterke groen-speler een vergelijkbare score kan krijgen als een gemiddelde geel-speler.

### Conversie invoer naar range-score

```
converteerNaarRange(invoer, maxInvoer, groep):
  - Voor rood (slider): directe mapping, capped op [min, max]
  - Voor overige: ratio = (invoer - 1) / (maxInvoer - 1)
                  score = round(min + ratio * (max - min))
```

Voorbeelden:
- Smiley 3 (max 3) voor blauw (0-40) = `round(0 + 1.0 * 40)` = **40**
- Sterren 4 (max 5) voor geel (15-70) = `round(15 + 0.75 * 55)` = **56**
- Slider 72 voor rood (35-99) = `max(35, min(99, 72))` = **72**

### Overall rating berekening

`berekenOverall(scores, groep)`:

1. Groepeer de ruwe scores per pijler (SCH, AAN, PAS, VER, FYS, MEN)
2. Per pijler: bereken het gemiddelde van de invoerwaarden
3. Per pijler: converteer naar de range van de leeftijdsgroep
4. Overall = gemiddelde van alle pijler-scores (gelijk gewogen)

Pijlers zonder ingevulde scores worden overgeslagen (waarde 0).

### EWMA (Exponentially Weighted Moving Average)

Bij elke update van de SpelersKaart wordt EWMA toegepast:

```
alpha = 0.3

berekenEWMA(nieuweScore, huidigeKaart):
  als huidigeKaart is null: return round(nieuweScore)
  return round(0.3 * nieuweScore + 0.7 * huidigeKaart)
```

Dit zorgt ervoor dat een nieuw rapport 30% invloed heeft op de kaart. Oudere rapporten "vervagen" geleidelijk. Bij het allereerste rapport wordt de score direct overgenomen.

EWMA wordt apart berekend voor overall en elke pijler (schot, aanval, passing, verdediging, fysiek, mentaal).

### Tier-bepaling

Op basis van percentiel binnen de score-range van de leeftijdsgroep:

| Tier | Conditie | Percentiel |
|---|---|---|
| Brons | score < mediaan (50%) | Onderste 50% |
| Zilver | score >= mediaan, < 80% | 50-80% |
| Goud | score >= 80e percentiel | Top 20% |

De drempels worden berekend uit de score-range:
- `zilverDrempel = min + (max - min) * 0.5`
- `goudDrempel = min + (max - min) * 0.8`

### Betrouwbaarheid

| Niveau | Rapporten | Betekenis |
|---|---|---|
| `concept` | 0-1 | Nog onvoldoende data |
| `basis` | 2-4 | Eerste indicatie |
| `betrouwbaar` | 5-9 | Goede betrouwbaarheid |
| `bevestigd` | 10+ | Hoge betrouwbaarheid |

### Sterren

Sterren (1-5) worden berekend als relatief percentage binnen de score-range:

```
relatiefPct = (overall - range.min) / (range.max - range.min)
sterren = max(1, min(5, ceil(relatiefPct * 5)))
```

---

## 6. Gamification-engine

Bronbestand: `src/lib/scouting/gamification.ts`

### XP-systeem

| Actie | XP |
|---|---|
| Rapport indienen | 15 |
| Eerste rapport voor een speler (bonus) | +25 |
| Team-complete bonus | +50 |

Bij team-scouting: per speler 15 XP (+ 25 als eerste rapport) + 50 team-bonus.

Voorbeeld: Team van 8 spelers, 3 zijn nieuw = `(5 * 15) + (3 * 40) + 50 = 245 XP`.

### Level-tabel

| Level | Naam | XP nodig |
|---|---|---|
| 1 | Beginner | 0 |
| 2 | Starter | 50 |
| 3 | Verkenner | 150 |
| 4 | Scout | 300 |
| 5 | Ervaren Scout | 500 |
| 6 | Senior Scout | 800 |
| 7 | Expert Scout | 1200 |
| 8 | Meester Scout | 1800 |
| 9 | Legende | 2500 |
| 10 | GOAT | 3500 |

`bepaalLevel(xp)` retourneert: level, naam, xpVoorVolgend, voortgang (0-1 fractie).

### Badges

| Badge ID | Naam | Voorwaarde |
|---|---|---|
| `eerste_rapport` | Eerste Rapport | 1+ rapport |
| `vijf_rapporten` | Vijf in de pocket | 5+ rapporten |
| `tien_rapporten` | Dubbele cijfers | 10+ rapporten |
| `vijfentwintig_rapporten` | Kwart eeuw | 25+ rapporten |
| `vijftig_rapporten` | Halve Eeuw | 50+ rapporten |
| `vijf_unieke_spelers` | Breed kijker | 5+ unieke spelers |
| `tien_unieke_spelers` | Talentenjager | 10+ unieke spelers |
| `drie_contexten` | Veelzijdig | Alle 3 contexten gebruikt |
| `wedstrijd_specialist` | Wedstrijd-specialist | 10+ wedstrijdrapporten |

Badges worden gecheckt na elk ingediend rapport. Alleen nog-niet-behaalde badges worden gecontroleerd. Nieuwe badges worden opgeslagen in `ScoutBadge` en meegestuurd in de API-response.

### Challenges

Challenges zijn tijdgebonden (start- en einddatum). Ze worden aangemaakt in de database (`ScoutChallenge`). De voorwaarde is een JSON-object:

```json
{
  "type": "rapporten" | "unieke_spelers" | "team_sessies",
  "aantal": 5
}
```

Voortgang wordt real-time berekend door de relevante records te tellen binnen de challenge-periode.

### Streak-berekening

De streak telt het aantal opeenvolgende weken (inclusief de huidige) waarin minimaal 1 rapport is ingediend. De berekening:

1. Haal alle rapport-datums op voor de scout
2. Groepeer per ISO-weeknummer
3. Loop vanaf de huidige week achteruit
4. De huidige week mag gemist worden (die is nog bezig)
5. Stop bij de eerste gemiste week (na week 0)

---

## 7. PWA-configuratie

### Manifest

`public/manifest.json`:

| Eigenschap | Waarde |
|---|---|
| name | OW Scout |
| short_name | Scout |
| display | standalone |
| orientation | portrait |
| theme_color | #FF6B00 |
| background_color | #1A1A2E |
| categories | ["sports"] |
| icons | 192x192 + 512x512 (PNG, any maskable) |

### Service worker

Geconfigureerd via `@ducanh2912/next-pwa` in `next.config.ts`:

- **Destination**: `public/` (service worker wordt gegenereerd bij build)
- **Disabled in development**: `process.env.NODE_ENV === "development"`
- **Auto-register**: `true`

### Offline-strategie

De PWA plugin genereert een standaard service worker met caching. In development is de service worker uitgeschakeld om conflicten te voorkomen. In productie worden statische assets gecached.

Er is geen custom offline-pagina of offline-data-sync geimplementeerd.

### Install prompt

De app is installeerbaar via de standaard browser-prompt (Chrome "Add to Home Screen"). Er is geen custom install-prompt geimplementeerd.

De root layout bevat Apple Web App meta-tags:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="OW Scout">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

Viewport is vergrendeld: `maximumScale: 1, userScalable: false` om pinch-to-zoom te voorkomen.

---

## 8. Componenten-overzicht

### BottomNav

| | |
|---|---|
| **Bestand** | `src/components/bottom-nav.tsx` |
| **Type** | Client component |
| **Props** | Geen |
| **Gebruik** | In `(scout)/layout.tsx` |

Vaste navigatie onderaan met 4 tabs: Home, Zoeken, Kaarten, Profiel. Highlighted actieve route met `usePathname()`.

### SpelerZoek

| | |
|---|---|
| **Bestand** | `src/components/speler-zoek.tsx` |
| **Type** | Client component |
| **Props** | `onSelect: (speler) => void`, `placeholder?: string`, `autoFocus?: boolean` |
| **Afhankelijkheden** | `LeeftijdsgroepBadge`, `SpelerAvatar` (geexporteerd) |

Debounced zoekveld (300ms) dat `/api/spelers/zoek` aanroept. Toont skeleton loaders, resultaten met foto/initialen, en lege staat.

Exporteert ook `SpelerAvatar` (foto of initialen-cirkel) en `SpelerZoekResultaat` interface.

### LeeftijdsgroepBadge

| | |
|---|---|
| **Bestand** | `src/components/leeftijdsgroep-badge.tsx` |
| **Type** | Server/client component (stateless) |
| **Props** | `kleur: string`, `leeftijd?: number`, `size?: "sm" \| "md"` |

KNKV kleur-pill met gradient. 7 kleuren: paars, blauw, groen, geel, oranje, rood, senior.

### Score-input componenten

Drie invoercomponenten in `src/components/score-input/`:

#### SmileyScore

| | |
|---|---|
| **Props** | `label`, `value: number \| null`, `onChange`, `vraagTekst?`, `disabled?` |
| **Schaal** | 1 (kan beter), 2 (gaat wel), 3 (goed) |
| **Kenmerken** | SVG smileys, radiogroup, keyboard navigatie, bounce-animatie |

#### SterrenScore

| | |
|---|---|
| **Props** | `label`, `value: number \| null`, `onChange`, `disabled?`, `readOnly?` |
| **Schaal** | 1-5 sterren |
| **Kenmerken** | Hover-preview, cascading fill-animatie, keyboard navigatie |

#### SliderScore

| | |
|---|---|
| **Props** | `label`, `value: number \| null`, `onChange`, `snelkeuze?`, `disabled?` |
| **Schaal** | 0-99 |
| **Kenmerken** | Native range input, kleurcodering (rood-geel-groen), floating waarde-bubble, 4 snelkeuze-chips (Zwak/Gem/Goed/Top) |

### SpelersKaart

| | |
|---|---|
| **Bestand** | `src/components/spelers-kaart.tsx` |
| **Type** | Client component |
| **Props** | Zie `SpelersKaartProps` (spelerId, naam, leeftijd, overall, stats, tier, sterren, size, flipbaar, ...) |
| **Afhankelijkheden** | `kaart-achterkant.tsx`, `kaart-effecten.tsx`, Framer Motion |

FIFA-achtige spelerskaart. Kenmerken:
- 4 formaten: mini (60x90), small (120x180), medium (180x270), large (280x420)
- Gradient per korfballeeftijd (14 unieke gradients, leeftijd 5-18)
- Tier-styling: brons (mat), zilver (sheen-animatie), goud (shimmer-animatie)
- Shield-clipPath voor foto met initialen-fallback
- 3D tilt bij hover (alleen medium/large)
- Flip naar achterkant (Framer Motion rotateY)
- States: default, loading (skeleton), selected (ring), disabled (grayscale)

### KaartAchterkant

| | |
|---|---|
| **Bestand** | `src/components/kaart-achterkant.tsx` |
| **Props** | `roepnaam`, `achternaam`, `data: AchterkantData`, `leeftijd`, `gradientStyle`, `tierBorderColor`, `radarSize?` |

Donkere variant van de voorkant met: RadarChart, bio-sectie, laatste 3 rapporten met mini-bars, trend-indicator.

### RadarChart

| | |
|---|---|
| **Bestand** | `src/components/radar-chart.tsx` |
| **Props** | `scores: number[]` (6 waarden), `labels?`, `kleur?`, `vergelijkScores?`, `size?`, `toonLabels?` |

Pure SVG radar chart met 6 assen. Grid-ringen op 25/50/75/100%. Optionele vergelijking-overlay met stippellijn.

### CelebrationOverlay

| | |
|---|---|
| **Bestand** | `src/components/celebration-overlay.tsx` |
| **Props** | `xpGained`, `badgeUnlocked?`, `kaartData?`, `teamModus?`, `aantalRapporten?`, `onDismiss` |

Fullscreen overlay na het indienen van een rapport. Gefaseerde animatie-sequentie:
1. (300ms) Confetti-regen start
2. (800ms) Succes-icoon verschijnt
3. (1500ms) Overall-score counter animeert
4. (2200ms) XP floating omhoog
5. (2800ms) Badge-unlock (indien van toepassing)
6. (3400ms) Actie-knoppen verschijnen

### XPBar

| | |
|---|---|
| **Bestand** | `src/components/xp-bar.tsx` |
| **Props** | `currentXP`, `levelXP`, `level`, `levelNaam`, `voortgang`, `compact?`, `animateGain?` |

XP-voortgangsbalk. Compact-modus (alleen bar) voor dashboard, volledige versie met level-badge, XP-teller en floating "+XP" animatie.

### BadgeGrid

| | |
|---|---|
| **Bestand** | `src/components/badge-grid.tsx` |
| **Props** | `unlockedBadges: UnlockedBadge[]` |

3x3 grid van alle 9 badges. Ontgrendelde badges tonen icoon en datum, vergrendelde tonen "???". Tik opent detail-modal met beschrijving of hint.

### Leaderboard

| | |
|---|---|
| **Bestand** | `src/components/leaderboard.tsx` |
| **Props** | `compact?: boolean` |

Fetcht `/api/scout/leaderboard`. Compact-modus toont top 3 als lijst. Volledige modus toont podium (top 3 met medaille-kleuren) + rest als lijst + eigen positie als die niet in de top 10 zit.

### Challenges

| | |
|---|---|
| **Bestand** | `src/components/challenges.tsx` |
| **Props** | `maxItems?: number` |

Fetcht `/api/scout/challenges`. Per challenge: naam, beschrijving, XP-beloning, voortgangsbalk, resterende tijd. Voltooide challenges krijgen groene styling.

### ProfielTabs

| | |
|---|---|
| **Bestand** | `src/components/profiel-tabs.tsx` |
| **Exports** | `ProfielTab`, `RapportenTab`, `KaartTab`, `SpelerProfielData` |

Drie tab-componenten voor de spelerprofiel-pagina:
- **ProfielTab**: Basisgegevens, notitie, spelerspad (teamhistorie), evaluaties
- **RapportenTab**: Lijst van scouting-rapporten met context, datum, score, opmerking
- **KaartTab**: Interactieve SpelersKaart (large, flipbaar) + stats detail + betrouwbaarheid

---

## 9. Development guide

### Lokaal opzetten

```bash
# Vanuit de monorepo root
pnpm install
pnpm db:generate

# Start de scouting app
pnpm --filter @oranje-wit/scouting dev
# Of via workspace shortcut (als die er is):
# pnpm dev:scouting
```

De app start op http://localhost:4106.

### Environment variables

| Variabele | Vereist | Beschrijving |
|---|---|---|
| `DATABASE_URL` | Ja | PostgreSQL connection string |
| `NEXTAUTH_URL` | Ja | App URL (bijv. `http://localhost:4106`) |
| `NEXTAUTH_SECRET` | Ja | NextAuth secret |
| `AUTH_GOOGLE_ID` | Ja | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Ja | Google OAuth client secret |

Deze worden gedeeld met de andere apps via het monorepo `.env` bestand.

### Commando's

| Commando | Beschrijving |
|---|---|
| `pnpm --filter @oranje-wit/scouting dev` | Start dev server (poort 4106) |
| `pnpm --filter @oranje-wit/scouting build` | Productie-build (standalone) |
| `pnpm --filter @oranje-wit/scouting start` | Start productie-server |
| `pnpm --filter @oranje-wit/scouting lint` | ESLint |
| `pnpm --filter @oranje-wit/scouting test` | Vitest unit tests |
| `pnpm --filter @oranje-wit/scouting test:watch` | Vitest in watch mode |
| `pnpm db:generate` | Prisma client genereren (monorepo root) |
| `pnpm db:push` | Schema naar database pushen |

### Deployment naar Railway

De app heeft een multi-stage Dockerfile (`apps/scouting/Dockerfile`):

1. **deps**: Node 22-slim, pnpm 9.15.0, install dependencies
2. **builder**: Kopieer broncode, `pnpm db:generate`, `pnpm --filter @oranje-wit/scouting build`
3. **runner**: Node 22-slim, kopieer standalone + static + public, `node apps/scouting/server.js`

De standalone output (`next.config.ts: output: "standalone"`) minimaliseert de Docker image.

Railway-specifiek:
- Poort: 3000 (intern), geproxied via Cloudflare Worker
- URL: (nog niet geconfigureerd, zie TODO's)

---

## 10. Bekende beperkingen en TODO's

### Wat werkt

- Speler zoeken en profiel bekijken
- Individueel rapport indienen (smiley/sterren/slider per leeftijdsgroep)
- Team-scouting sessie (alle spelers tegelijk)
- SpelersKaart berekening met EWMA
- Kaarten-collectie met filter en sort
- Gamification: XP, levels, badges, streak
- Leaderboard
- Challenges (als er records in de database staan)
- Celebration-animatie na indienen
- PWA manifest en service worker (productie)

### Wat nog niet werkt / gebouwd moet worden

- **Deployment**: Geen Railway service aangemaakt, geen Cloudflare Worker proxy, geen custom domein
- **Offline sync**: De PWA heeft geen offline-data-opslag. Rapporten kunnen alleen online ingediend worden
- **Push notifications**: Geen web push geimplementeerd (bijv. voor challenges, streak-reminders)
- **Install prompt**: Geen custom "Installeer de app" UI
- **E2E tests**: Geen Playwright tests voor de scouting app
- **Rapport bewerken/verwijderen**: Eenmaal ingediend kan een rapport niet gewijzigd worden
- **Foto uploaden**: Scouts kunnen geen foto's uploaden, alleen bestaande LidFoto's bekijken
- **Admin-dashboard**: Geen beheerinterface voor challenges aanmaken/beheren
- **Data-export**: Geen export van scouting-data (CSV, PDF)
- **Seizoensovergang**: Geen mechanisme om kaarten te archiveren bij nieuw seizoen

### Bekende workarounds

- **Prisma 7 type recursion**: Door circulaire relaties in het Prisma schema (Speler heeft veel relaties) faalt TypeScript bij `prisma.speler.findUnique()`. Workaround: type assertions (`prisma.speler as unknown as { findUnique: ... }`) of `prisma as any` cast. Zie de API routes voor voorbeelden.
- **Score-input barrel export**: `src/components/score-input/index.ts` exporteert alle drie de componenten. De RapportWizard importeert hiervan maar noemt het import-pad als `@/components/score-input`.
- **Team-spelers via CompetitieSpeler**: Om spelers van een team te vinden gaat de app via `CompetitieSpeler` (seizoen + teamnaam), niet via directe relaties. Dit is nodig omdat de teamkoppeling in de competitiedata zit, niet in het Speler-model.
- **Leeftijdsgroep uit `huidig` JSON**: De leeftijdsgroep wordt eerst uit het `huidig` JSON-veld van Speler geprobeerd (kleur), met fallback op geboortejaar-berekening.
