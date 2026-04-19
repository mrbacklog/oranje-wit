# Sportlink Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een 3-lagen Sportlink sync-architectuur bouwen die leden synct (Laag 1), teamsamenstelling vastlegt (Laag 2), en wijzigingen detecteert voor de TC-werkindeling (Laag 3).

**Architecture:** Shared `@oranje-wit/sportlink` package met Keycloak PKCE login en Navajo API client. Laag 1 synct SearchMembers → Lid-tabel + Notifications → wijzigingslog. Laag 2 synct SearchTeams → CompetitieSpeler snapshots via een 4-staps TC-flow. Laag 3 vergelijkt Laag 1+2 met de Speler-tabel en signaleert wijzigingen.

**Tech Stack:** TypeScript, Prisma 7, Next.js 16 server actions, Zod, SSE streaming, pnpm workspaces

**Spec:** `docs/superpowers/specs/2026-04-19-sportlink-sync-design.md`

---

## Migratie-overzicht: bestaand → nieuw

Onderstaande tabel documenteert exact wat er met elk bestaand onderdeel gebeurt.
Niets mag dubbel bestaan na implementatie.

### Bestanden die VERHUIZEN naar `packages/sportlink/`

| Bestaand bestand | Wat erin zit | Wordt | Actie op origineel |
|---|---|---|---|
| `apps/ti-studio/src/lib/sportlink/client.ts` regels 1-35 | `extractCookies`, `cookieString`, constanten | `packages/sportlink/src/auth.ts` | **Verwijder** functie-bodies, vervang door re-export |
| `apps/ti-studio/src/lib/sportlink/client.ts` regels 36-140 | `sportlinkLogin()` | `packages/sportlink/src/auth.ts` | **Verwijder**, vervang door `export { sportlinkLogin } from "@oranje-wit/sportlink"` |
| `apps/ti-studio/src/lib/sportlink/client.ts` regels 142-150 | `navajoHeaders()` | `packages/sportlink/src/navajo.ts` | **Verwijder** |
| `apps/ti-studio/src/lib/sportlink/client.ts` regels 159-237 | `sportlinkZoekLeden()` (gefilterd) | Verdwijnt — Laag 1 haalt ALLES op, Laag 3 (diff) doet de filtering | **Verwijder** |
| `apps/ti-studio/src/lib/sportlink/client.ts` regels 239-249 | `selecteerOpties()` | `packages/sportlink/src/endpoints/search-members.ts` | **Verwijder** |
| `apps/ti-studio/src/lib/sportlink/types.ts` | `SportlinkLid`, `SyncDiff`, `LidType`, `AfmeldReden`, etc. | `packages/sportlink/src/types.ts` (uitgebreid) | **Verwijder** bestand volledig |

### Bestanden die VERANDEREN

| Bestaand bestand | Huidige functie | Wat verandert |
|---|---|---|
| `apps/ti-studio/src/lib/sportlink/diff.ts` | `berekenDiff()` — Sportlink ↔ Speler vergelijking | Wordt **Laag 3**: importeert types uit `@oranje-wit/sportlink`, gebruikt `zoekLeden()` uit shared package. Diff-logica (LidType, AfmeldReden, bepaalLidType) blijft hier — het is TI-specifiek |
| `apps/ti-studio/src/app/api/sportlink/sync/route.ts` | SSE streaming sync (login → zoek → diff) | **Refactor**: gebruikt `sportlinkLogin` en `zoekLeden` uit `@oranje-wit/sportlink` |
| `apps/ti-studio/src/app/api/sportlink/apply/route.ts` | Nieuwe spelers aanmaken, afmeldingen doorvoeren | **Blijft** — dit is TI-werkindeling logica (Speler upsert), niet sync |
| `apps/ti-studio/src/components/sportlink/SportlinkSync.tsx` | Volledige sync UI (login, diff, apply) | **Refactor**: split in tabs — Leden-sync tab + Team-sync tab + bestaande Speler-sync |
| `apps/ti-studio/package.json` | Dependencies | **Toevoegen**: `"@oranje-wit/sportlink": "workspace:*"` |
| `apps/web/src/app/(beheer)/beheer/teams/sync/page.tsx` | CSV-import sync pagina | **Refactor**: verwijst naar `@oranje-wit/sportlink` voor leden-sync i.p.v. CSV upload |

### Bestanden die VERDWIJNEN

| Bestand | Reden |
|---|---|
| `apps/ti-studio/src/lib/sportlink/client.ts` | Volledig verhuisd naar `packages/sportlink/` |
| `apps/ti-studio/src/lib/sportlink/types.ts` | Volledig verhuisd naar `packages/sportlink/src/types.ts` |
| `scripts/import/sync-leden-csv.ts` | Vervangen door API-sync — deprecated markeren in Fase 5, verwijderen in Fase 7 |

### Bestanden die NIEUW zijn

| Bestand | Doel |
|---|---|
| `packages/sportlink/` (hele package) | Shared Sportlink client + sync functies |
| `packages/database/prisma/migrations/20260419100000_*/migration.sql` | Lid-tabel uitbreiding + SportlinkNotificatie model |
| `apps/ti-studio/src/app/api/sportlink/leden-sync/route.ts` | Laag 1 API: leden-sync + notificaties |
| `apps/ti-studio/src/app/api/sportlink/team-sync/route.ts` | Laag 2 API: team-sync dry run + apply |

### Wat de diff engine wordt (Laag 3)

De huidige `diff.ts` (`berekenDiff`) doet Sportlink ↔ Speler vergelijking voor de TI-werkindeling. Dit IS Laag 3 — de wijzigingsdetectie. Het verschil met het huidige gedrag:

| Nu | Straks |
|---|---|
| Haalt zelf leden op via `sportlinkZoekLeden()` (gefilterd) | Krijgt leden van Laag 1 (Lid-tabel, al gesynchroniseerd) |
| Vergelijkt direct met Speler-tabel | Vergelijkt Lid-tabel ↔ Speler-tabel + team-sync delta's |
| Draait bij elke sync-actie | Kan ook draaien zonder Sportlink login (data staat al in Lid-tabel) |

De `diff.ts` blijft in `apps/ti-studio/src/lib/sportlink/` maar importeert types uit `@oranje-wit/sportlink` en leest uit de Lid-tabel i.p.v. direct uit de Sportlink API.

---

## Bestandsstructuur

### Nieuw package: `packages/sportlink/`

```
packages/sportlink/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts                    # Publieke exports
    ├── auth.ts                     # Keycloak PKCE login → Navajo token
    ├── navajo.ts                   # Navajo API helper (headers, GET/POST)
    ├── endpoints/
    │   ├── search-members.ts       # SearchMembers: alle leden ophalen
    │   ├── search-teams.ts         # SearchTeams: teamsamenstelling ophalen
    │   ├── notifications.ts        # Notifications: wijzigingslog ophalen
    │   └── union-teams.ts          # UnionTeams: teamlijst ophalen
    ├── sync/
    │   ├── leden-sync.ts           # Laag 1: SearchMembers → Lid upsert
    │   ├── notificatie-sync.ts     # Laag 1: Notifications → opslaan
    │   └── team-sync.ts            # Laag 2: SearchTeams → CompetitieSpeler
    ├── types.ts                    # Sportlink API response types
    └── __tests__/
        ├── auth.test.ts
        ├── search-members.test.ts
        ├── leden-sync.test.ts
        └── team-sync.test.ts
```

### Database wijzigingen: `packages/database/`

```
packages/database/prisma/
└── migrations/
    └── 20260419000000_sportlink_sync_velden/
        └── migration.sql           # Lid-tabel uitbreiding + SportlinkNotificatie
```

### TI Studio wijzigingen: `apps/ti-studio/`

```
apps/ti-studio/src/
├── app/
│   └── (protected)/
│       └── sportlink/
│           ├── page.tsx            # Bestaand — wordt uitgebreid
│           └── team-sync/
│               └── page.tsx        # Nieuw — Laag 2 team-sync UI
├── components/
│   └── sportlink/
│       ├── SportlinkSync.tsx       # Bestaand — refactor naar @oranje-wit/sportlink
│       ├── LedenSync.tsx           # Nieuw — Laag 1 leden-sync UI
│       ├── TeamSync.tsx            # Nieuw — Laag 2 team-sync 4-staps flow
│       └── WijzigingsSignalen.tsx  # Nieuw — Laag 3 signalen-overzicht
└── app/
    └── api/
        └── sportlink/
            ├── sync/route.ts       # Bestaand — refactor
            ├── apply/route.ts      # Bestaand — refactor
            ├── leden-sync/route.ts # Nieuw — Laag 1 API
            └── team-sync/route.ts  # Nieuw — Laag 2 API
```

---

## Fase 1: Shared Sportlink Client

### Task 1: Package scaffolding

**Files:**
- Create: `packages/sportlink/package.json`
- Create: `packages/sportlink/tsconfig.json`
- Create: `packages/sportlink/vitest.config.ts`
- Create: `packages/sportlink/src/index.ts`

- [ ] **Step 1: Maak package.json**

```json
{
  "name": "@oranje-wit/sportlink",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/auth.ts",
    "./endpoints/*": "./src/endpoints/*.ts",
    "./sync/*": "./src/sync/*.ts",
    "./types": "./src/types.ts"
  },
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "@oranje-wit/database": "workspace:*",
    "@oranje-wit/types": "workspace:*"
  },
  "devDependencies": {
    "vitest": "^4.1.1"
  }
}
```

- [ ] **Step 2: Maak tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Maak vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 4: Maak src/index.ts met lege exports**

```typescript
export { sportlinkLogin } from "./auth";
export type { SportlinkToken } from "./auth";
export { zoekLeden } from "./endpoints/search-members";
export { zoekTeams } from "./endpoints/search-teams";
export { haalNotificatiesOp } from "./endpoints/notifications";
export { haalBondsteamsOp } from "./endpoints/union-teams";
export { syncLeden } from "./sync/leden-sync";
export { syncNotificaties } from "./sync/notificatie-sync";
export { syncTeams } from "./sync/team-sync";
export type * from "./types";
```

- [ ] **Step 5: Draai pnpm install**

Run: `pnpm install`
Expected: Package wordt gelinkt in workspace

- [ ] **Step 6: Commit**

```bash
git add packages/sportlink/
git commit -m "feat: scaffold @oranje-wit/sportlink package"
```

---

### Task 2: Types

**Files:**
- Create: `packages/sportlink/src/types.ts`

- [ ] **Step 1: Schrijf alle Sportlink API types**

```typescript
/** Lid uit Sportlink SearchMembers response */
export interface SportlinkLid {
  PublicPersonId: string;
  FullName: string | null;
  LastName: string | null;
  Infix: string | null;
  Initials: string | null;
  FirstName: string | null;
  NickName: string | null;
  DateOfBirth: string;
  GenderCode: "Male" | "Female";
  GenderDescription: string;
  MemberStatus: string;
  MemberStatusDescription: string;
  TypeOfMember: string;
  TypeOfMemberDescription: string;
  RelationStart: string;
  RelationEnd: string | null;
  MemberSince: string;
  Email: string | null;
  AgeClassDescription: string | null;
  ClubTeams: string | null;
  ClubGameActivities: string | null;
  KernelGameActivities: string | null;
  LastUpdate: string;
  Age: number;
  PersonImageDate: string | null;
}

/** Team uit UnionTeams response */
export interface SportlinkTeam {
  PublicTeamId: string;
  TeamCode: string;
  TeamName: string;
  GameActivityId: string;
  GameActivityIdTag: string;
  GameActivityDescription: string;
  GenderCode: string;
  Gender: string;
  TeamMemberCount: number;
  PlayerCount: number;
  IsClassified: boolean;
  IsUnionTeam: boolean;
}

/** Teamlid uit SearchTeams response */
export interface SportlinkTeamLid {
  PublicPersonId: string;
  FullName: string;
  FirstName: string;
  LastName: string;
  Infix: string | null;
  DateOfBirth: string;
  GenderCode: "Male" | "Female";
  MemberStatus: string;
  TypeOfTeam: string;
  TypeOfTeamDescription: string;
  TeamId: string;
  TeamName: string;
  TeamRoleDescription: string;
  TeamFunctionDescription: string | null;
  TeamPersonStartDate: string;
  TeamPersonEndDate: string | null;
  IsPlayer: boolean;
  IsOnMatchForm: boolean;
  GameTypeDescription: string;
  GameDayDescription: string;
  TeamAgeClassDescription: string | null;
  KernelGameActivities: string | null;
  ClubGameActivities: string | null;
  Status: string;
}

/** Notificatie uit Notifications response */
export interface SportlinkNotificatie {
  ReadStatus: string;
  TypeOfAction: "insert" | "update" | "delete";
  TypeOfActionDescription: string;
  Entity: "member" | "membership" | "player" | "clubfunction";
  Category: string;
  Description: string;
  ChangeVector: string | null;
  PublicActionId: string;
  ChangedBy: string;
  DateOfChange: string;
  PublicPersonId: string;
  PersonFullName: string;
  IsPhotoChange: boolean;
  IsClickAllowed: boolean;
}

/** Login resultaat */
export interface SportlinkToken {
  navajoToken: string;
  clubId: string;
  userName: string;
}

/** Sync resultaat voor leden */
export interface LedenSyncResultaat {
  bijgewerkt: number;
  nieuw: number;
  totaalVergeleken: number;
}

/** Team-sync dry run resultaat */
export interface TeamSyncDryRun {
  spelvorm: "Veld" | "Zaal";
  periode: string;
  teams: TeamSyncTeam[];
  nieuwInTeam: TeamSyncWijziging[];
  uitTeam: TeamSyncWijziging[];
  teamWissels: TeamSyncWijziging[];
  stafWijzigingen: TeamSyncWijziging[];
}

export interface TeamSyncTeam {
  teamCode: string;
  teamNaam: string;
  aantalSpelers: number;
  aantalStaf: number;
}

export interface TeamSyncWijziging {
  relCode: string;
  naam: string;
  vanTeam: string | null;
  naarTeam: string | null;
  rol: string;
  functie: string | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/sportlink/src/types.ts
git commit -m "feat(sportlink): add Sportlink API types"
```

---

### Task 3: Auth module — Keycloak PKCE login

**Files:**
- Create: `packages/sportlink/src/auth.ts`
- Create: `packages/sportlink/src/navajo.ts`
- Modify: `apps/ti-studio/src/lib/sportlink/client.ts` (later, bij refactor)

- [ ] **Step 1: Schrijf navajo.ts — API helper**

```typescript
import type { SportlinkToken } from "./types";

const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";

export function navajoHeaders(entity: string, token: string, instance = "KNKV") {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": instance,
    "X-Navajo-Locale": "nl",
  };
}

export async function navajoGet<T>(entity: string, token: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const res = await fetch(`${NAVAJO_BASE}/${entity}${qs}`, {
    headers: navajoHeaders(entity, token),
  });
  const data = await res.json();
  if (data.Error) throw new Error(`Sportlink API fout (${entity}): ${data.Message}`);
  return data as T;
}

export async function navajoPost<T>(entity: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(`${NAVAJO_BASE}/${entity}`, {
    method: "POST",
    headers: navajoHeaders(entity, token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.Error) throw new Error(`Sportlink API fout (${entity}): ${data.Message}`);
  return data as T;
}
```

- [ ] **Step 2: Schrijf auth.ts — verplaats login uit ti-studio**

De volledige login-functie verhuizen uit `apps/ti-studio/src/lib/sportlink/client.ts`.
Belangrijk: de login-logica (PKCE, OTP skip, LinkToPerson) is complex en bewezen werkend.
Kopieer de bestaande implementatie 1:1 en exporteer als `sportlinkLogin()`.

```typescript
import crypto from "crypto";
import { logger } from "@oranje-wit/types";
import type { SportlinkToken } from "./types";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";
const CLUB_ID = "NCX19J3";

// extractCookies en cookieString — exact kopiëren uit huidige client.ts

export async function sportlinkLogin(email: string, password: string): Promise<SportlinkToken> {
  // Volledige implementatie kopiëren uit apps/ti-studio/src/lib/sportlink/client.ts
  // Regels 36-140: PKCE → credentials → OTP skip → token exchange → LinkToPerson
  // Alleen de return type aanpassen naar SportlinkToken
}
```

De exacte implementatie staat in `apps/ti-studio/src/lib/sportlink/client.ts:36-140`.
Kopieer die regels 1:1, verander alleen de import van `logger` en het return type.

- [ ] **Step 3: Commit**

```bash
git add packages/sportlink/src/auth.ts packages/sportlink/src/navajo.ts
git commit -m "feat(sportlink): add auth module and navajo API helper"
```

---

### Task 4: SearchMembers endpoint

**Files:**
- Create: `packages/sportlink/src/endpoints/search-members.ts`

- [ ] **Step 1: Schrijf search-members.ts**

De zoeklogica verhuizen uit `apps/ti-studio/src/lib/sportlink/client.ts:159-224`.
Belangrijk: het filter-patroon (FilterMembersExtended/Simple → SearchMembers) behouden.

```typescript
import { logger } from "@oranje-wit/types";
import { navajoGet, navajoPost } from "../navajo";
import type { SportlinkLid } from "../types";

/**
 * Haal alle leden op uit Sportlink.
 *
 * Haalt ALLE leden op (bondsleden, actief + inactief + afmelding in toekomst).
 * Geen filtering — dat is de verantwoordelijkheid van de sync-laag.
 */
export async function zoekLeden(token: string): Promise<SportlinkLid[]> {
  // Stap 1: Haal filter-definities op
  const [inputExtended, inputSimple] = await Promise.all([
    navajoGet<Record<string, unknown>>("member/search/FilterMembersExtended", token),
    navajoGet<Record<string, unknown>>("member/search/FilterMembersSimple", token),
  ]);

  // Stap 2: Selecteer alle bondsleden, alle statussen
  selecteerOpties(inputExtended.TypeOfMember, ["KERNELMEMBER"]);
  selecteerOpties(inputExtended.MemberStatus, ["ACTIVE", "INACTIVE", "ELIGABLE_FOR_REMOVE"]);

  // Stap 3: Zoek met het volledige filterobject
  const data = await navajoPost<{ Members: SportlinkLid[] }>(
    "member/search/SearchMembers",
    token,
    { Filters: { InputExtended: inputExtended, InputSimple: inputSimple } }
  );

  const leden = data.Members ?? [];
  logger.info(`[sportlink] ${leden.length} leden opgehaald`);
  return leden;
}

function selecteerOpties(
  filter: { Options?: { Id: string; IsSelected: boolean }[] } | undefined,
  ids: string[]
) {
  if (!filter?.Options) return;
  const selectSet = new Set(ids);
  for (const opt of filter.Options) {
    opt.IsSelected = selectSet.has(opt.Id);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/sportlink/src/endpoints/search-members.ts
git commit -m "feat(sportlink): add SearchMembers endpoint"
```

---

### Task 5: Notifications endpoint

**Files:**
- Create: `packages/sportlink/src/endpoints/notifications.ts`

- [ ] **Step 1: Schrijf notifications.ts**

```typescript
import { logger } from "@oranje-wit/types";
import { navajoGet } from "../navajo";
import type { SportlinkNotificatie } from "../types";

/**
 * Haal notificaties op uit Sportlink vanaf een bepaalde datum.
 *
 * Maximaal terug tot 2015-01-01 (eerder geeft server error).
 */
export async function haalNotificatiesOp(
  token: string,
  datumVanaf: string
): Promise<SportlinkNotificatie[]> {
  const data = await navajoGet<{ Items: SportlinkNotificatie[] }>(
    "member/notifications/Notifications",
    token,
    { DateFrom: datumVanaf }
  );

  const items = data.Items ?? [];
  logger.info(`[sportlink] ${items.length} notificaties opgehaald sinds ${datumVanaf}`);
  return items;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/sportlink/src/endpoints/notifications.ts
git commit -m "feat(sportlink): add Notifications endpoint"
```

---

### Task 6: SearchTeams + UnionTeams endpoints

**Files:**
- Create: `packages/sportlink/src/endpoints/search-teams.ts`
- Create: `packages/sportlink/src/endpoints/union-teams.ts`

- [ ] **Step 1: Schrijf union-teams.ts**

```typescript
import { logger } from "@oranje-wit/types";
import { navajoGet } from "../navajo";
import type { SportlinkTeam } from "../types";

/**
 * Haal alle bondsteams op (Veld + Zaal).
 */
export async function haalBondsteamsOp(token: string): Promise<SportlinkTeam[]> {
  const data = await navajoGet<{ Team: SportlinkTeam[] }>("team/UnionTeams", token);
  const teams = data.Team ?? [];
  logger.info(`[sportlink] ${teams.length} bondsteams opgehaald`);
  return teams;
}
```

- [ ] **Step 2: Schrijf search-teams.ts**

```typescript
import { logger } from "@oranje-wit/types";
import { navajoGet, navajoPost } from "../navajo";
import type { SportlinkTeamLid } from "../types";

/**
 * Haal de volledige teamsamenstelling op voor Veld of Zaal.
 *
 * Selecteert alle teams in de filter en filtert op spelactiviteit.
 * Retourneert spelers + staf + coaches met functies in één call.
 */
export async function zoekTeams(
  token: string,
  spelvorm: "Veld" | "Zaal"
): Promise<SportlinkTeamLid[]> {
  // Stap 1: Haal filters op
  const [inputExtended, inputSimple] = await Promise.all([
    navajoGet<Record<string, unknown>>("member/search/FilterTeamsExtended", token),
    navajoGet<Record<string, unknown>>("member/search/FilterTeamsSimple", token),
  ]);

  // Stap 2: Selecteer alle teams
  const unionTeamFilter = inputSimple.UnionTeam as {
    Options?: { Id: string; IsSelected: boolean }[];
  };
  if (unionTeamFilter?.Options) {
    for (const opt of unionTeamFilter.Options) {
      opt.IsSelected = true;
    }
  }

  // Stap 3: Filter op spelactiviteit (Veld of Zaal)
  const activityFilter = inputExtended.Activity as {
    Options?: { Id: string; IsSelected: boolean }[];
  };
  const spelvormId = spelvorm === "Veld" ? "KORFBALL-VE-WK/STANDARD" : "KORFBALL-ZA-WK/STANDARD";
  if (activityFilter?.Options) {
    for (const opt of activityFilter.Options) {
      opt.IsSelected = opt.Id === spelvormId;
    }
  }

  // Stap 4: Zoek
  const data = await navajoPost<{ Members: SportlinkTeamLid[] }>(
    "member/search/SearchTeams",
    token,
    { Filters: { InputExtended: inputExtended, InputSimple: inputSimple } }
  );

  const leden = data.Members ?? [];
  logger.info(`[sportlink] ${leden.length} teamleden opgehaald voor ${spelvorm}`);
  return leden;
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/sportlink/src/endpoints/
git commit -m "feat(sportlink): add SearchTeams and UnionTeams endpoints"
```

---

## Fase 2: Leden-spiegel (Laag 1)

### Task 7: Database migratie — Lid-tabel uitbreiden + SportlinkNotificatie

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/20260419100000_sportlink_sync_velden/migration.sql`

- [ ] **Step 1: Voeg velden toe aan Lid model in schema.prisma**

Na regel 28 (`email String?`), voeg toe:

```prisma
  lidStatus        String?   @map("lid_status")
  spelactiviteiten String?
  clubTeams        String?   @map("club_teams")
  leeftijdscategorie String? @map("leeftijdscategorie")
  laatstGesyncOp   DateTime? @map("laatst_gesynct_op") @db.Timestamptz(6)
```

- [ ] **Step 2: Voeg SportlinkNotificatie model toe**

Na het Lid model (na regel 39), voeg toe:

```prisma
model SportlinkNotificatie {
  id            Int      @id @default(autoincrement())
  relCode       String   @map("rel_code")
  datum         DateTime @db.Timestamptz(6)
  actie         String   // insert | update | delete
  entiteit      String   // member | membership | player | clubfunction
  beschrijving  String
  categorie     String
  gewijzigdDoor String   @map("gewijzigd_door")
  gesyncOp      DateTime @default(now()) @map("gesynct_op") @db.Timestamptz(6)

  @@index([relCode])
  @@index([datum])
  @@index([entiteit])
  @@map("sportlink_notificaties")
}
```

- [ ] **Step 3: Maak migratie SQL**

```sql
-- Lid-tabel uitbreiden
ALTER TABLE "leden" ADD COLUMN "lid_status" TEXT;
ALTER TABLE "leden" ADD COLUMN "spelactiviteiten" TEXT;
ALTER TABLE "leden" ADD COLUMN "club_teams" TEXT;
ALTER TABLE "leden" ADD COLUMN "leeftijdscategorie" TEXT;
ALTER TABLE "leden" ADD COLUMN "laatst_gesynct_op" TIMESTAMPTZ;

-- SportlinkNotificatie tabel
CREATE TABLE "sportlink_notificaties" (
    "id" SERIAL NOT NULL,
    "rel_code" TEXT NOT NULL,
    "datum" TIMESTAMPTZ NOT NULL,
    "actie" TEXT NOT NULL,
    "entiteit" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "gewijzigd_door" TEXT NOT NULL,
    "gesynct_op" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sportlink_notificaties_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sportlink_notificaties_rel_code_idx" ON "sportlink_notificaties"("rel_code");
CREATE INDEX "sportlink_notificaties_datum_idx" ON "sportlink_notificaties"("datum");
CREATE INDEX "sportlink_notificaties_entiteit_idx" ON "sportlink_notificaties"("entiteit");
```

- [ ] **Step 4: Genereer Prisma client**

Run: `pnpm db:generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
git add packages/database/prisma/
git commit -m "feat(db): add Sportlink sync fields to Lid + SportlinkNotificatie model"
```

---

### Task 8: Leden-sync functie

**Files:**
- Create: `packages/sportlink/src/sync/leden-sync.ts`

- [ ] **Step 1: Schrijf leden-sync.ts**

```typescript
import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import type { SportlinkLid, LedenSyncResultaat } from "../types";

/**
 * Laag 1: Sync alle Sportlink leden naar de Lid-tabel.
 *
 * Pure spiegel — geen interpretatie, geen filtering.
 * Upsert op basis van relCode (PublicPersonId).
 */
export async function syncLeden(leden: SportlinkLid[]): Promise<LedenSyncResultaat> {
  let bijgewerkt = 0;
  let nieuw = 0;
  const nu = new Date();

  for (const lid of leden) {
    const relCode = lid.PublicPersonId;

    // Alleen geldige Sportlink relCodes
    if (!relCode.match(/^[A-Z]{1,3}\w+$/)) continue;

    const geboortedatum = lid.DateOfBirth ? new Date(lid.DateOfBirth) : null;
    const geboortejaar = geboortedatum ? geboortedatum.getFullYear() : null;

    const data = {
      roepnaam: lid.FirstName ?? "",
      achternaam: lid.LastName ?? "",
      tussenvoegsel: lid.Infix || null,
      voorletters: lid.Initials || null,
      geslacht: lid.GenderCode === "Male" ? "M" : "V",
      geboortejaar,
      geboortedatum,
      email: lid.Email || null,
      lidSinds: lid.MemberSince ? new Date(lid.MemberSince) : null,
      registratieDatum: lid.RelationStart ? new Date(lid.RelationStart) : null,
      afmelddatum: lid.RelationEnd ? new Date(lid.RelationEnd) : null,
      lidsoort: lid.TypeOfMemberDescription || null,
      lidStatus: lid.MemberStatus || null,
      spelactiviteiten: lid.KernelGameActivities || null,
      clubTeams: lid.ClubTeams || null,
      leeftijdscategorie: lid.AgeClassDescription || null,
      laatstGesyncOp: nu,
      updatedAt: nu,
    };

    const bestaand = await prisma.lid.findUnique({ where: { relCode } });

    if (bestaand) {
      await prisma.lid.update({ where: { relCode }, data });
      bijgewerkt++;
    } else {
      await prisma.lid.create({ data: { relCode, ...data, createdAt: nu } });
      nieuw++;
    }
  }

  logger.info(`[sportlink] Leden-sync: ${nieuw} nieuw, ${bijgewerkt} bijgewerkt van ${leden.length} leden`);

  return { bijgewerkt, nieuw, totaalVergeleken: leden.length };
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/sportlink/src/sync/leden-sync.ts
git commit -m "feat(sportlink): add leden-sync function (Layer 1)"
```

---

### Task 9: Notificatie-sync functie

**Files:**
- Create: `packages/sportlink/src/sync/notificatie-sync.ts`

- [ ] **Step 1: Schrijf notificatie-sync.ts**

```typescript
import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import type { SportlinkNotificatie } from "../types";

/**
 * Laag 1: Sla Sportlink notificaties op als wijzigingslog.
 *
 * Filtert op relevante entiteiten (member, membership, player).
 * Slaat geen ChangeVector op (bevat gevoelige data).
 */
export async function syncNotificaties(
  notificaties: SportlinkNotificatie[]
): Promise<{ opgeslagen: number; overgeslagen: number }> {
  let opgeslagen = 0;
  let overgeslagen = 0;

  // Filter op relevante entiteiten
  const relevant = notificaties.filter((n) =>
    ["member", "membership", "player"].includes(n.Entity)
  );

  for (const notif of relevant) {
    // Alleen geldige relCodes
    if (!notif.PublicPersonId.match(/^[A-Z]{1,3}\w+$/)) {
      overgeslagen++;
      continue;
    }

    // Check of we deze notificatie al hebben (op basis van PublicActionId via datum+relCode+actie)
    const bestaat = await prisma.sportlinkNotificatie.findFirst({
      where: {
        relCode: notif.PublicPersonId,
        datum: new Date(notif.DateOfChange),
        actie: notif.TypeOfAction,
        beschrijving: notif.Description,
      },
    });

    if (bestaat) {
      overgeslagen++;
      continue;
    }

    await prisma.sportlinkNotificatie.create({
      data: {
        relCode: notif.PublicPersonId,
        datum: new Date(notif.DateOfChange),
        actie: notif.TypeOfAction,
        entiteit: notif.Entity,
        beschrijving: notif.Description,
        categorie: notif.Category,
        gewijzigdDoor: notif.ChangedBy,
      },
    });
    opgeslagen++;
  }

  logger.info(
    `[sportlink] Notificatie-sync: ${opgeslagen} opgeslagen, ${overgeslagen} overgeslagen`
  );

  return { opgeslagen, overgeslagen };
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/sportlink/src/sync/notificatie-sync.ts
git commit -m "feat(sportlink): add notificatie-sync function (Layer 1)"
```

---

## Fase 3: Team-sync (Laag 2)

### Task 10: Team-sync functie

**Files:**
- Create: `packages/sportlink/src/sync/team-sync.ts`

- [ ] **Step 1: Schrijf team-sync.ts**

```typescript
import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import type { SportlinkTeamLid, TeamSyncDryRun, TeamSyncWijziging, TeamSyncTeam } from "../types";

type Periode = "veld_najaar" | "veld_voorjaar" | "zaal" | "zaal_deel1" | "zaal_deel2";

/**
 * Laag 2, Stap 3: Dry run — vergelijk Sportlink-teamsamenstelling met opgeslagen data.
 *
 * Retourneert een overzicht van wat er zou veranderen als je de sync doorvoert.
 */
export async function teamSyncDryRun(
  teamleden: SportlinkTeamLid[],
  seizoen: string,
  periode: Periode,
  spelvorm: "Veld" | "Zaal"
): Promise<TeamSyncDryRun> {
  // Haal huidige CompetitieSpeler records op voor dit seizoen + periode
  const huidigeRecords = await prisma.competitieSpeler.findMany({
    where: { seizoen, competitie: periode },
    include: { lid: { select: { roepnaam: true, achternaam: true } } },
  });

  const huidigeMap = new Map(
    huidigeRecords.map((r) => [r.relCode, { team: r.team, bron: r.bron }])
  );

  // Groepeer Sportlink-data per team (alleen spelers, niet staf)
  const sportlinkSpelers = teamleden.filter((t) => t.IsPlayer);
  const sportlinkStaf = teamleden.filter((t) => !t.IsPlayer);

  const sportlinkMap = new Map<string, SportlinkTeamLid>();
  for (const lid of sportlinkSpelers) {
    sportlinkMap.set(lid.PublicPersonId, lid);
  }

  // Bereken wijzigingen
  const nieuwInTeam: TeamSyncWijziging[] = [];
  const uitTeam: TeamSyncWijziging[] = [];
  const teamWissels: TeamSyncWijziging[] = [];

  // Nieuwe spelers in Sportlink die niet in onze data staan
  for (const [relCode, slLid] of sportlinkMap) {
    const huidig = huidigeMap.get(relCode);
    if (!huidig) {
      nieuwInTeam.push({
        relCode,
        naam: slLid.FullName,
        vanTeam: null,
        naarTeam: slLid.TeamName,
        rol: slLid.TeamRoleDescription,
        functie: slLid.TeamFunctionDescription,
      });
    } else if (huidig.team !== slLid.TeamName) {
      teamWissels.push({
        relCode,
        naam: slLid.FullName,
        vanTeam: huidig.team,
        naarTeam: slLid.TeamName,
        rol: slLid.TeamRoleDescription,
        functie: slLid.TeamFunctionDescription,
      });
    }
  }

  // Spelers die in onze data staan maar niet meer in Sportlink
  for (const [relCode, huidig] of huidigeMap) {
    if (!sportlinkMap.has(relCode)) {
      const record = huidigeRecords.find((r) => r.relCode === relCode);
      uitTeam.push({
        relCode,
        naam: record ? `${record.lid.roepnaam} ${record.lid.achternaam}` : relCode,
        vanTeam: huidig.team,
        naarTeam: null,
        rol: "Teamspeler",
        functie: null,
      });
    }
  }

  // Staf-wijzigingen
  const stafWijzigingen: TeamSyncWijziging[] = sportlinkStaf.map((s) => ({
    relCode: s.PublicPersonId,
    naam: s.FullName,
    vanTeam: null,
    naarTeam: s.TeamName,
    rol: s.TeamRoleDescription,
    functie: s.TeamFunctionDescription,
  }));

  // Teams samenvatting
  const teamsMap = new Map<string, { spelers: number; staf: number }>();
  for (const lid of teamleden) {
    const key = lid.TeamName;
    const entry = teamsMap.get(key) ?? { spelers: 0, staf: 0 };
    if (lid.IsPlayer) entry.spelers++;
    else entry.staf++;
    teamsMap.set(key, entry);
  }

  const teams: TeamSyncTeam[] = [...teamsMap.entries()].map(([naam, counts]) => ({
    teamCode: naam,
    teamNaam: naam,
    aantalSpelers: counts.spelers,
    aantalStaf: counts.staf,
  }));

  return {
    spelvorm,
    periode,
    teams,
    nieuwInTeam,
    uitTeam,
    teamWissels,
    stafWijzigingen,
  };
}

/**
 * Laag 2, Stap 4: Voer de team-sync door.
 *
 * Schrijft de Sportlink-teamsamenstelling naar CompetitieSpeler.
 */
export async function syncTeams(
  teamleden: SportlinkTeamLid[],
  seizoen: string,
  periode: Periode
): Promise<{ aangemaakt: number; verwijderd: number }> {
  const spelers = teamleden.filter((t) => t.IsPlayer);

  // Verwijder bestaande records voor dit seizoen + periode met bron "sportlink"
  const { count: verwijderd } = await prisma.competitieSpeler.deleteMany({
    where: { seizoen, competitie: periode, bron: "sportlink" },
  });

  // Maak nieuwe records aan
  let aangemaakt = 0;
  for (const speler of spelers) {
    const relCode = speler.PublicPersonId;
    if (!relCode.match(/^[A-Z]{1,3}\w+$/)) continue;

    // Check of lid bestaat
    const lidBestaat = await prisma.lid.findUnique({ where: { relCode } });
    if (!lidBestaat) continue;

    await prisma.competitieSpeler.upsert({
      where: {
        relCode_seizoen_competitie: { relCode, seizoen, competitie: periode },
      },
      create: {
        relCode,
        seizoen,
        competitie: periode,
        team: speler.TeamName,
        geslacht: speler.GenderCode === "Male" ? "M" : "V",
        bron: "sportlink",
        betrouwbaar: true,
      },
      update: {
        team: speler.TeamName,
        geslacht: speler.GenderCode === "Male" ? "M" : "V",
        bron: "sportlink",
        betrouwbaar: true,
      },
    });
    aangemaakt++;
  }

  logger.info(
    `[sportlink] Team-sync ${seizoen} ${periode}: ${aangemaakt} aangemaakt, ${verwijderd} verwijderd`
  );

  return { aangemaakt, verwijderd };
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/sportlink/src/sync/team-sync.ts
git commit -m "feat(sportlink): add team-sync with dry-run (Layer 2)"
```

---

### Task 11: Update index.ts exports + fix type-locaties

**Files:**
- Modify: `packages/sportlink/src/index.ts`

- [ ] **Step 1: Verifieer dat alle exports kloppen**

Let op: `SportlinkToken` staat in `types.ts`, NIET in `auth.ts`. Task 1 had de verkeerde locatie.

```typescript
// Auth
export { sportlinkLogin } from "./auth";

// Endpoints
export { zoekLeden } from "./endpoints/search-members";
export { zoekTeams } from "./endpoints/search-teams";
export { haalNotificatiesOp } from "./endpoints/notifications";
export { haalBondsteamsOp } from "./endpoints/union-teams";

// Sync functies
export { syncLeden } from "./sync/leden-sync";
export { syncNotificaties } from "./sync/notificatie-sync";
export { teamSyncDryRun, syncTeams } from "./sync/team-sync";
export { detecteerWijzigingen } from "./sync/wijzigings-detectie";

// Types
export type {
  SportlinkLid,
  SportlinkTeam,
  SportlinkTeamLid,
  SportlinkNotificatie,
  SportlinkToken,
  LedenSyncResultaat,
  TeamSyncDryRun,
  TeamSyncWijziging,
  TeamSyncTeam,
} from "./types";
export type { WijzigingsSignaal } from "./sync/wijzigings-detectie";
```

- [ ] **Step 2: Voeg `@oranje-wit/sportlink` toe als dependency in BEIDE apps (vóór UI-taken)**

In `apps/ti-studio/package.json` EN `apps/web/package.json`:

```json
"@oranje-wit/sportlink": "workspace:*"
```

Run: `pnpm install`

Dit moet NU gebeuren, niet in Task 14, anders falen Tasks 12-13.

- [ ] **Step 3: Typecheck**

Run: `cd packages/sportlink && npx tsc --noEmit`
Expected: Geen fouten

- [ ] **Step 4: Commit**

```bash
git add packages/sportlink/src/index.ts apps/ti-studio/package.json apps/web/package.json
pnpm install
git commit -m "feat(sportlink): finalize exports, add dependency to both apps"
```

---

## Fase 4: TI Studio integratie — API routes + UI

> **Belangrijk:** De UI-componenten worden zo opgezet dat ze later ook in apps/web
> kunnen worden opgenomen. De logica zit in het shared package (`@oranje-wit/sportlink`),
> de UI-componenten zijn app-specifiek maar volgen dezelfde patronen.

### Task 12: Leden-sync API route

**Files:**
- Create: `apps/ti-studio/src/app/api/sportlink/leden-sync/route.ts`

- [ ] **Step 1: Schrijf SSE streaming route voor leden-sync**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { parseBody, logger } from "@oranje-wit/types";
import { z } from "zod";
import { sportlinkLogin, zoekLeden, syncLeden, haalNotificatiesOp, syncNotificaties } from "@oranje-wit/sportlink";

const SyncSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const body = await parseBody(req, SyncSchema);
  if (!body.ok) return body.response;

  const { email, password } = body.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        send({ stap: "login", tekst: "Inloggen bij Sportlink..." });
        const { navajoToken } = await sportlinkLogin(email, password);

        send({ stap: "leden", tekst: "Leden ophalen..." });
        const leden = await zoekLeden(navajoToken);
        send({ stap: "leden", tekst: `${leden.length} leden opgehaald`, aantal: leden.length });

        send({ stap: "sync", tekst: "Leden synchroniseren..." });
        const resultaat = await syncLeden(leden);
        send({
          stap: "sync",
          tekst: `${resultaat.nieuw} nieuw, ${resultaat.bijgewerkt} bijgewerkt`,
          resultaat,
        });

        send({ stap: "notificaties", tekst: "Notificaties ophalen..." });
        // Gebruik 30 dagen terug als default, of de laatst bekende sync-datum
        const dertigDagenGeleden = new Date();
        dertigDagenGeleden.setDate(dertigDagenGeleden.getDate() - 30);
        const datumVanaf = dertigDagenGeleden.toISOString().slice(0, 10);
        const notificaties = await haalNotificatiesOp(navajoToken, datumVanaf);
        const notifResultaat = await syncNotificaties(notificaties);
        send({
          stap: "notificaties",
          tekst: `${notifResultaat.opgeslagen} notificaties opgeslagen`,
          notifResultaat,
        });

        send({ stap: "klaar", tekst: "Sync voltooid", resultaat, notifResultaat });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Leden-sync mislukt";
        logger.error("[sportlink] Leden-sync fout:", message);
        send({ stap: "fout", tekst: message });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/app/api/sportlink/leden-sync/
git commit -m "feat(ti-studio): add leden-sync API route with SSE streaming"
```

---

### Task 13: Team-sync API route

**Files:**
- Create: `apps/ti-studio/src/app/api/sportlink/team-sync/route.ts`

- [ ] **Step 1: Schrijf team-sync route met dry-run en apply**

```typescript
import { NextRequest } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody, logger } from "@oranje-wit/types";
import { z } from "zod";
import { sportlinkLogin, zoekTeams, teamSyncDryRun, syncTeams } from "@oranje-wit/sportlink";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

const DryRunSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  spelvorm: z.enum(["Veld", "Zaal"]),
  periode: z.enum(["veld_najaar", "veld_voorjaar", "zaal", "zaal_deel1", "zaal_deel2"]),
});

const ApplySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  spelvorm: z.enum(["Veld", "Zaal"]),
  periode: z.enum(["veld_najaar", "veld_voorjaar", "zaal", "zaal_deel1", "zaal_deel2"]),
  seizoen: z.string().optional().default(HUIDIG_SEIZOEN),
});

/** Stap 3: Dry run */
export async function POST(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const body = await parseBody(req, DryRunSchema);
  if (!body.ok) return body.response;

  try {
    const { email, password, spelvorm, periode } = body.data;
    const { navajoToken } = await sportlinkLogin(email, password);
    const teamleden = await zoekTeams(navajoToken, spelvorm);
    const dryRun = await teamSyncDryRun(teamleden, HUIDIG_SEIZOEN, periode, spelvorm);
    return ok(dryRun);
  } catch (error) {
    logger.error("[sportlink] Team-sync dry run fout:", error);
    return fail(error instanceof Error ? error.message : "Dry run mislukt");
  }
}

/** Stap 4: Apply */
export async function PUT(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const body = await parseBody(req, ApplySchema);
  if (!body.ok) return body.response;

  try {
    const { email, password, spelvorm, periode, seizoen } = body.data;
    const { navajoToken } = await sportlinkLogin(email, password);
    const teamleden = await zoekTeams(navajoToken, spelvorm);
    const resultaat = await syncTeams(teamleden, seizoen, periode);
    return ok(resultaat);
  } catch (error) {
    logger.error("[sportlink] Team-sync apply fout:", error);
    return fail(error instanceof Error ? error.message : "Team-sync mislukt");
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/app/api/sportlink/team-sync/
git commit -m "feat(ti-studio): add team-sync API with dry-run and apply"
```

---

### Task 14: diff-types.ts — TI-specifieke types voor de Speler-sync

De huidige `types.ts` bevat zowel Sportlink API types als TI-specifieke diff-types.
De API types verhuizen naar `@oranje-wit/sportlink`. De diff-types (`SyncDiff`, `NieuwLid`,
`AfgemeldLid`, `FuzzyMatch`, `LidType`, `AfmeldReden`) zijn TI-specifiek en blijven lokaal.

**Files:**
- Create: `apps/ti-studio/src/lib/sportlink/diff-types.ts`

- [ ] **Step 1: Schrijf diff-types.ts met de TI-specifieke types**

```typescript
import type { SportlinkLid } from "@oranje-wit/sportlink";

/** Resultaat van de diff engine (Sportlink ↔ Speler vergelijking) */
export interface SyncDiff {
  nieuwe: NieuwLid[];
  afgemeld: AfgemeldLid[];
  fuzzyMatches: FuzzyMatch[];
  stats: {
    ledenVergeleken: number;
    spelersInPool: number;
    ongewijzigd: number;
  };
}

export type LidType =
  | "korfbalspeler"
  | "recreant"
  | "algemeen-reserve"
  | "niet-spelend"
  | "nieuw-lid";

export interface NieuwLid {
  lid: SportlinkLid;
  lidType: LidType;
}

export type AfmeldReden = "afmelddatum" | "niet-actief" | "niet-spelend" | "verdwenen";

export interface AfgemeldLid {
  lid: SportlinkLid;
  spelerId: string;
  spelerNaam: string;
  reden: AfmeldReden;
}

export interface FuzzyMatch {
  lid: SportlinkLid;
  spelerId: string;
  spelerNaam: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/lib/sportlink/diff-types.ts
git commit -m "feat(ti-studio): add diff-types.ts for TI-specific Sportlink types"
```

---

### Task 15: LedenSync UI-component

De Laag 1 UI: login → leden ophalen → synchroniseren → resultaat tonen.
Vervangt het login/sync deel van de bestaande `SportlinkSync.tsx`.

**Files:**
- Create: `apps/ti-studio/src/components/sportlink/LedenSync.tsx`

- [ ] **Step 1: Schrijf LedenSync component**

SSE consumer die de `/api/sportlink/leden-sync` route aanroept.
States: login → loading (SSE voortgang) → resultaat (nieuw/bijgewerkt/notificaties).

Het component hergebruikt de bestaande `LoginState` en `LoadingState` patronen
uit `SportlinkSync.tsx` maar toont een ander resultaat: leden-sync statistieken
i.p.v. de Speler-diff. Gebruik dezelfde Sportlink UI-tokens (`T.syncNieuw`, etc.).

States:
- **login**: Email/wachtwoord formulier (hergebruik patroon uit SportlinkSync)
- **syncing**: SSE voortgang (stap: login → leden → sync → notificaties → klaar)
- **resultaat**: Samenvatting: X leden vergeleken, Y nieuw, Z bijgewerkt, N notificaties

Geen selectie-UI nodig — leden-sync is altijd een volledige sync.

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/components/sportlink/LedenSync.tsx
git commit -m "feat(ti-studio): add LedenSync UI component"
```

---

### Task 16: TeamSync UI-component — 4-staps flow

De Laag 2 UI: spelvorm kiezen → periode kiezen → dry run → accept.

**Files:**
- Create: `apps/ti-studio/src/components/sportlink/TeamSync.tsx`

- [ ] **Step 1: Schrijf TeamSync component**

States:
1. **keuze**: Twee knoppen (Veld / Zaal). Onder de knoppen een voorstel op basis van
   seizoensperiode: "Het is april — Veld voorjaar aanbevolen".
2. **periode**: Dropdown met periodes voor de gekozen spelvorm:
   - Veld → "Veld najaar" / "Veld voorjaar"
   - Zaal → "Zaal" / "Zaal deel 1" / "Zaal deel 2"
3. **dry-run**: Login formulier + "Vergelijken" knop. Na login: POST naar
   `/api/sportlink/team-sync`. Toont resultaat:
   - Samenvatting per team (aantal spelers + staf)
   - Nieuwe spelers in teams (groen)
   - Spelers uit teams (rood)
   - Teamwissels (oranje)
   - Staf-wijzigingen (blauw)
4. **apply**: "Doorvoeren" knop → PUT naar `/api/sportlink/team-sync`.
   Na succes: resultaat tonen (X aangemaakt, Y verwijderd).

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/components/sportlink/TeamSync.tsx
git commit -m "feat(ti-studio): add TeamSync UI component with 4-step flow"
```

---

### Task 17: WijzigingsSignalen UI-component

De Laag 3 UI: signalen voor de TC op basis van leden-sync + team-sync data.

**Files:**
- Create: `apps/ti-studio/src/components/sportlink/WijzigingsSignalen.tsx`

- [ ] **Step 1: Schrijf WijzigingsSignalen component**

Haalt signalen op via een server action die `detecteerWijzigingen()` uit
`@oranje-wit/sportlink` aanroept. Geen Sportlink login nodig — leest uit
de al gesynchroniseerde Lid-tabel en notificaties.

Toont:
- Aantal signalen per type (nieuw-lid, afmelding, status-wijziging, etc.)
- Per signaal: naam, beschrijving, oud/nieuw, bron (leden-sync/notificatie/team-sync)
- Acties per signaal: "Accepteren" / "Negeren" (TC beslist)

Bij "Accepteren" van een nieuw-lid → doorsturen naar bestaande Speler-aanmaak flow.
Bij "Accepteren" van een afmelding → status wijzigen naar GAAT_STOPPEN.

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/components/sportlink/WijzigingsSignalen.tsx
git commit -m "feat(ti-studio): add WijzigingsSignalen UI component"
```

---

### Task 18: Sportlink pagina refactor — tabs voor 3 lagen

De bestaande `/sportlink` pagina wordt uitgebreid met tabs voor alle 3 lagen.
De bestaande Speler-sync (diff → apply) blijft als tab beschikbaar.

**Files:**
- Modify: `apps/ti-studio/src/app/(protected)/sportlink/page.tsx`
- Modify: `apps/ti-studio/src/components/sportlink/SportlinkSync.tsx` (rename naar SpelerSync)

- [ ] **Step 1: Refactor SportlinkSync.tsx → SpelerSync.tsx**

Rename het bestand en de component. Dit is de bestaande Sportlink ↔ Speler sync
(nieuwe spelers toevoegen, afmeldingen doorvoeren, fuzzy koppelingen).
Imports aanpassen naar `@oranje-wit/sportlink` en `./diff-types`.

- [ ] **Step 2: Update page.tsx — 4 tabs**

```
Sportlink Sync
├── Leden          → <LedenSync />      (Laag 1: Sportlink → Lid-tabel)
├── Teams          → <TeamSync />       (Laag 2: Sportlink → CompetitieSpeler)
├── Wijzigingen    → <WijzigingsSignalen /> (Laag 3: signalen voor werkindeling)
└── Spelers        → <SpelerSync />     (bestaand: Lid → Speler doorvoeren)
```

Gebruik een simpele tab-navigatie met state. Geen router-tabs nodig.

- [ ] **Step 3: Typecheck**

Run: `cd apps/ti-studio && npx tsc --noEmit`
Expected: Geen fouten

- [ ] **Step 4: Commit**

```bash
git add apps/ti-studio/src/app/(protected)/sportlink/ apps/ti-studio/src/components/sportlink/
git commit -m "feat(ti-studio): refactor Sportlink page with 4 tabs (leden/teams/wijzigingen/spelers)"
```

---

## Fase 5: Opruimen — verwijder dubbele code

### Task 19: TI Studio — verwijder oude Sportlink bestanden

Dit is de cruciale opruim-taak. Na deze taak mag er GEEN dubbele Sportlink-logica meer bestaan.

**Files:**
- Delete: `apps/ti-studio/src/lib/sportlink/client.ts` (volledig)
- Delete: `apps/ti-studio/src/lib/sportlink/types.ts` (volledig)
- Modify: `apps/ti-studio/src/lib/sportlink/diff.ts` (imports aanpassen)
- Modify: `apps/ti-studio/src/app/api/sportlink/sync/route.ts` (imports aanpassen)
- Modify: `apps/ti-studio/src/app/api/sportlink/apply/route.ts` (imports aanpassen)
- Modify: `apps/ti-studio/src/components/sportlink/SportlinkSync.tsx` (imports aanpassen)
- Modify: `apps/ti-studio/package.json` (dependency toevoegen)

- [ ] **Step 1: Voeg @oranje-wit/sportlink toe als dependency**

In `apps/ti-studio/package.json`, voeg toe bij dependencies:

```json
"@oranje-wit/sportlink": "workspace:*"
```

Run: `pnpm install`

- [ ] **Step 2: Verwijder `apps/ti-studio/src/lib/sportlink/types.ts`**

Dit bestand wordt volledig vervangen door `@oranje-wit/sportlink/types`.
De types `SportlinkLid`, `SyncDiff`, `NieuwLid`, `AfgemeldLid`, `FuzzyMatch`, `LidType`, `AfmeldReden` moeten allemaal in het shared package staan.

Run: `rm apps/ti-studio/src/lib/sportlink/types.ts`

- [ ] **Step 3: Verwijder `apps/ti-studio/src/lib/sportlink/client.ts`**

Login, zoekLeden, navajoHeaders, selecteerOpties — allemaal verhuisd naar `packages/sportlink/`.

Run: `rm apps/ti-studio/src/lib/sportlink/client.ts`

- [ ] **Step 4: Update `diff.ts` — imports uit shared package**

In `apps/ti-studio/src/lib/sportlink/diff.ts`, vervang:

```typescript
// OUD:
import type { SportlinkLid, SyncDiff, NieuwLid, AfgemeldLid, FuzzyMatch, LidType } from "./types";

// NIEUW:
import type { SportlinkLid } from "@oranje-wit/sportlink";
```

De `SyncDiff`, `NieuwLid`, `AfgemeldLid`, `FuzzyMatch`, `LidType`, `AfmeldReden` types zijn TI-specifiek (ze beschrijven de diff-output, niet de Sportlink API). Deze verhuizen naar `diff.ts` zelf als lokale types, of naar een nieuw bestand `apps/ti-studio/src/lib/sportlink/diff-types.ts`.

De functies `bepaalLidType()` en `normaliseer()` blijven in `diff.ts` — ze zijn TI-specifiek.

- [ ] **Step 5: Update `sync/route.ts` — imports uit shared package**

In `apps/ti-studio/src/app/api/sportlink/sync/route.ts`, vervang:

```typescript
// OUD:
import { sportlinkLogin, sportlinkZoekLeden } from "@/lib/sportlink/client";
import { berekenDiff } from "@/lib/sportlink/diff";

// NIEUW:
import { sportlinkLogin, zoekLeden } from "@oranje-wit/sportlink";
import { berekenDiff } from "@/lib/sportlink/diff";
```

Let op: de bestaande sync route haalt gefilterde leden op (`sportlinkZoekLeden` met korfbalspelers-filter). De shared `zoekLeden` haalt ALLES op. De `berekenDiff` in diff.ts moet de filtering overnemen, of de route filtert zelf na het ophalen.

- [ ] **Step 6: Update `apply/route.ts` — imports uit shared package**

```typescript
// OUD:
import type { SpelerStatus } from "@oranje-wit/database";

// Dit bestand importeert NIET uit de sportlink client, dus geen wijziging nodig.
// Verifieer dat het geen imports heeft uit ./client of ./types.
```

- [ ] **Step 7: Update `SportlinkSync.tsx` — imports uit shared package**

```typescript
// OUD:
import type { SyncDiff, NieuwLid, AfgemeldLid, FuzzyMatch, LidType } from "@/lib/sportlink/types";

// NIEUW:
import type { SportlinkLid } from "@oranje-wit/sportlink";
import type { SyncDiff, NieuwLid, AfgemeldLid, FuzzyMatch, LidType } from "@/lib/sportlink/diff-types";
```

- [ ] **Step 8: Typecheck — verifieer geen dubbele code**

Run: `cd apps/ti-studio && npx tsc --noEmit`
Expected: Geen fouten

Run: `grep -r "sportlinkLogin\|sportlinkZoekLeden\|navajoHeaders" apps/ti-studio/src/lib/sportlink/`
Expected: Geen resultaten (alles verwijderd)

- [ ] **Step 9: Commit**

```bash
git add apps/ti-studio/
git commit -m "refactor(ti-studio): remove duplicate Sportlink code, use @oranje-wit/sportlink"
```

---

### Task 20: apps/web sync — verwijst naar shared package

De bestaande CSV-sync pagina in apps/web moet ook de shared sync gebruiken.

**Files:**
- Modify: `apps/web/src/app/(beheer)/beheer/teams/sync/page.tsx`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Voeg @oranje-wit/sportlink toe als dependency**

In `apps/web/package.json`, voeg toe bij dependencies:

```json
"@oranje-wit/sportlink": "workspace:*"
```

Run: `pnpm install`

- [ ] **Step 2: Update sync pagina — verwijder CSV-verwijzing, gebruik API-sync**

De pagina toont nu "Synchroniseer leden en teams vanuit Sportlink CSV-exports".
Verander naar: "Synchroniseer leden vanuit Sportlink".
De `laatsteImport` query blijft — maar checkt nu `laatstGesyncOp` op de Lid-tabel.

```typescript
// Vervang de import-check door een sync-check
const laatsteSync = await prisma.lid.aggregate({
  _max: { laatstGesyncOp: true },
});
```

- [ ] **Step 3: Markeer CSV-import als deprecated**

In `scripts/import/sync-leden-csv.ts`, voeg bovenaan toe:

```typescript
/**
 * @deprecated Vervangen door @oranje-wit/sportlink leden-sync via API.
 * Zie docs/superpowers/specs/2026-04-19-sportlink-sync-design.md
 * Dit script wordt verwijderd in een toekomstige release.
 */
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/ scripts/import/sync-leden-csv.ts
git commit -m "refactor(web): use @oranje-wit/sportlink, deprecate CSV import"
```

---

## Fase 6: Wijzigingsdetectie (Laag 3)

### Task 21: Wijzigingsdetectie functie

**Files:**
- Create: `packages/sportlink/src/sync/wijzigings-detectie.ts`

- [ ] **Step 1: Schrijf wijzigings-detectie.ts**

```typescript
import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

export interface WijzigingsSignaal {
  type: "nieuw-lid" | "afmelding" | "status-wijziging" | "activiteit-wijziging" | "team-wijziging" | "geboortedatum-correctie" | "geslacht-correctie";
  relCode: string;
  naam: string;
  beschrijving: string;
  oud: string | null;
  nieuw: string | null;
  bron: "leden-sync" | "notificatie" | "team-sync";
}

/**
 * Laag 3: Detecteer wijzigingen die gevolgen kunnen hebben voor de teamindeling.
 *
 * Vergelijkt de Lid-tabel (Laag 1) en CompetitieSpeler (Laag 2) met de Speler-tabel
 * en signaleert wijzigingen aan de TC.
 */
export async function detecteerWijzigingen(): Promise<WijzigingsSignaal[]> {
  const signalen: WijzigingsSignaal[] = [];

  // 1. Leden die wel in Lid staan maar niet in Speler
  const ledenZonderSpeler = await prisma.$queryRaw<
    { rel_code: string; roepnaam: string; achternaam: string; lid_status: string; spelactiviteiten: string | null }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.lid_status, l.spelactiviteiten
    FROM leden l
    LEFT JOIN "Speler" s ON l.rel_code = s.id
    WHERE s.id IS NULL
      AND l.lid_status = 'ACTIVE'
      AND l.rel_code ~ '^[A-Z]{1,3}'
  `;

  for (const lid of ledenZonderSpeler) {
    signalen.push({
      type: "nieuw-lid",
      relCode: lid.rel_code,
      naam: `${lid.roepnaam} ${lid.achternaam}`,
      beschrijving: `Actief lid zonder speler-record. Activiteit: ${lid.spelactiviteiten || "geen"}`,
      oud: null,
      nieuw: lid.lid_status,
      bron: "leden-sync",
    });
  }

  // 2. Spelers waarvan de Lid-status is veranderd (ACTIVE → INACTIVE)
  const statusWijzigingen = await prisma.$queryRaw<
    { rel_code: string; roepnaam: string; achternaam: string; lid_status: string; speler_status: string }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.lid_status, s.status as speler_status
    FROM leden l
    JOIN "Speler" s ON l.rel_code = s.id
    WHERE l.lid_status != 'ACTIVE'
      AND s.status NOT IN ('GAAT_STOPPEN', 'NIET_SPELEND')
  `;

  for (const lid of statusWijzigingen) {
    signalen.push({
      type: "status-wijziging",
      relCode: lid.rel_code,
      naam: `${lid.roepnaam} ${lid.achternaam}`,
      beschrijving: `Lid-status in Sportlink: ${lid.lid_status}, speler-status: ${lid.speler_status}`,
      oud: lid.speler_status,
      nieuw: lid.lid_status,
      bron: "leden-sync",
    });
  }

  // 3. Spelers met afmelddatum die nog niet GAAT_STOPPEN zijn
  const afmeldingen = await prisma.$queryRaw<
    { rel_code: string; roepnaam: string; achternaam: string; afmelddatum: Date; speler_status: string }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.afmelddatum, s.status as speler_status
    FROM leden l
    JOIN "Speler" s ON l.rel_code = s.id
    WHERE l.afmelddatum IS NOT NULL
      AND s.status NOT IN ('GAAT_STOPPEN')
  `;

  for (const lid of afmeldingen) {
    signalen.push({
      type: "afmelding",
      relCode: lid.rel_code,
      naam: `${lid.roepnaam} ${lid.achternaam}`,
      beschrijving: `Afmelddatum: ${lid.afmelddatum.toISOString().slice(0, 10)}`,
      oud: lid.speler_status,
      nieuw: "GAAT_STOPPEN",
      bron: "leden-sync",
    });
  }

  // 4. Recente relevante notificaties (membership + player events)
  const recenteNotificaties = await prisma.sportlinkNotificatie.findMany({
    where: {
      entiteit: { in: ["membership", "player"] },
      gesyncOp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { datum: "desc" },
    take: 50,
  });

  for (const notif of recenteNotificaties) {
    if (notif.beschrijving.includes("Lid geworden van Oranje Wit")) {
      signalen.push({
        type: "nieuw-lid",
        relCode: notif.relCode,
        naam: notif.relCode,
        beschrijving: `${notif.beschrijving} op ${notif.datum.toISOString().slice(0, 10)}`,
        oud: null,
        nieuw: "Nieuw lid",
        bron: "notificatie",
      });
    } else if (notif.beschrijving.includes("Afgemeld bij") || notif.beschrijving.includes("Veld Week") || notif.beschrijving.includes("Zaal Week")) {
      signalen.push({
        type: "activiteit-wijziging",
        relCode: notif.relCode,
        naam: notif.relCode,
        beschrijving: `${notif.beschrijving} (${notif.actie}) op ${notif.datum.toISOString().slice(0, 10)}`,
        oud: null,
        nieuw: notif.actie,
        bron: "notificatie",
      });
    }
  }

  logger.info(`[sportlink] Wijzigingsdetectie: ${signalen.length} signalen gevonden`);

  return signalen;
}
```

- [ ] **Step 2: Voeg export toe aan index.ts**

Voeg toe aan `packages/sportlink/src/index.ts`:

```typescript
export { detecteerWijzigingen } from "./sync/wijzigings-detectie";
export type { WijzigingsSignaal } from "./sync/wijzigings-detectie";
```

- [ ] **Step 3: Commit**

```bash
git add packages/sportlink/src/sync/wijzigings-detectie.ts packages/sportlink/src/index.ts
git commit -m "feat(sportlink): add wijzigingsdetectie function (Layer 3)"
```

---

## Fase 7: Deploy en validatie

### Task 22: Typecheck en build

**Files:** Geen wijzigingen, alleen verificatie

- [ ] **Step 1: Typecheck alle packages**

Run: `cd apps/ti-studio && npx tsc --noEmit`
Expected: Geen fouten

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: Geen fouten

- [ ] **Step 3: Draai unit tests**

Run: `pnpm test`
Expected: Alle tests slagen

---

### Task 23: Migratie draaien op productie

**Files:** Geen wijzigingen

- [ ] **Step 1: Commit alle openstaande wijzigingen**

- [ ] **Step 2: Push naar main**

Run: `git push`
Expected: CI start, migratie draait automatisch bij deploy

- [ ] **Step 3: Verifieer migratie**

Check: Lid-tabel heeft nieuwe velden (`lid_status`, `spelactiviteiten`, `club_teams`, `leeftijdscategorie`, `laatst_gesynct_op`)
Check: `sportlink_notificaties` tabel bestaat

---

### Task 24: Eerste leden-sync draaien

**Files:** Geen wijzigingen

- [ ] **Step 1: Open TI Studio Sportlink pagina**
- [ ] **Step 2: Draai leden-sync**
- [ ] **Step 3: Verifieer dat Lid-tabel is bijgewerkt**
- [ ] **Step 4: Verifieer dat notificaties zijn opgeslagen**

---

### Task 25: Eerste team-sync draaien (Zaal 2025-2026 definitief)

**Files:** Geen wijzigingen

- [ ] **Step 1: Open team-sync pagina**
- [ ] **Step 2: Selecteer Zaal, periode Zaal**
- [ ] **Step 3: Review dry run**
- [ ] **Step 4: Accept — sla op als definitief**
- [ ] **Step 5: Verifieer CompetitieSpeler records met bron "sportlink"**
