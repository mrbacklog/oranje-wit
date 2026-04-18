# Sportlink Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TC-leden kunnen vanuit TI Studio ledendata ophalen uit Sportlink en selectief synchroniseren met de spelerspool.

**Architecture:** Eén server-side API route doet de volledige Keycloak PKCE + Navajo auth flow via fetch (geen Playwright). Een tweede route verwerkt geselecteerde wijzigingen. De UI is een nieuwe pagina in TI Studio met een Ribbon-item, 4 states (login → laden → diff → klaar).

**Tech Stack:** Next.js 16 API routes, Prisma (Speler model), Keycloak PKCE, Sportlink Navajo API

**Spec:** `docs/superpowers/specs/2026-04-17-sportlink-sync-design.md`
**Skill:** `.claude/skills/sportlink/SKILL.md`
**Prototype:** `docs/superpowers/prototypes/sportlink-sync/sportlink-sync.html`

---

## File Structure

| Bestand | Verantwoordelijkheid |
|---|---|
| `apps/ti-studio/src/lib/sportlink/client.ts` | Keycloak login + Navajo API calls |
| `apps/ti-studio/src/lib/sportlink/diff.ts` | Vergelijk Sportlink leden ↔ DB spelers |
| `apps/ti-studio/src/lib/sportlink/types.ts` | TypeScript types voor Sportlink data |
| `apps/ti-studio/src/app/api/sportlink/sync/route.ts` | POST: credentials → diff resultaat |
| `apps/ti-studio/src/app/api/sportlink/apply/route.ts` | POST: geselecteerde wijzigingen doorvoeren |
| `apps/ti-studio/src/app/(protected)/sportlink/page.tsx` | Server component: pagina-shell |
| `apps/ti-studio/src/components/sportlink/SportlinkSync.tsx` | Client component: alle 4 states |
| `apps/ti-studio/src/components/werkbord/Ribbon.tsx` | Modify: Sportlink ribbon item toevoegen |

---

## Task 1: Types

**Files:**
- Create: `apps/ti-studio/src/lib/sportlink/types.ts`

- [ ] **Step 1: Maak types bestand**

```typescript
// apps/ti-studio/src/lib/sportlink/types.ts

/** Lid uit Sportlink SearchMembers response */
export interface SportlinkLid {
  PublicPersonId: string;
  FirstName: string;
  LastName: string;
  Infix: string | null;
  DateOfBirth: string;
  GenderCode: "Male" | "Female";
  MemberStatus: string;
  RelationStart: string;
  RelationEnd: string | null;
  AgeClassDescription: string;
  ClubTeams: string | null;
  KernelGameActivities: string | null;
  Email: string | null;
  Mobile: string | null;
}

/** Resultaat van de diff engine */
export interface SyncDiff {
  nieuwe: NieuwLid[];
  afgemeld: AfgemeldLid[];
  fuzzyMatches: FuzzyMatch[];
}

export interface NieuwLid {
  lid: SportlinkLid;
}

export interface AfgemeldLid {
  lid: SportlinkLid;
  spelerId: string;
  spelerNaam: string;
}

export interface FuzzyMatch {
  lid: SportlinkLid;
  spelerId: string;
  spelerNaam: string;
}

/** Request/response types voor de API routes */
export interface SyncRequest {
  email: string;
  password: string;
}

export interface ApplyRequest {
  nieuwe: string[];       // PublicPersonId[] van te maken spelers
  afgemeld: string[];     // spelerId[] om als afgemeld te markeren
  koppelingen: string[];  // PublicPersonId[] van te koppelen fuzzy matches
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/lib/sportlink/types.ts
git commit -m "feat(sportlink): add TypeScript types for Sportlink sync"
```

---

## Task 2: Sportlink Client

**Files:**
- Create: `apps/ti-studio/src/lib/sportlink/client.ts`

- [ ] **Step 1: Implementeer de Keycloak + Navajo auth client**

Raadpleeg `.claude/skills/sportlink/SKILL.md` voor het volledige auth-flow. De client moet:

1. Keycloak PKCE login (6 stappen: auth page → POST credentials → skip OTP → token exchange → LinkToPerson → SearchMembers)
2. Alle leden ophalen via SearchMembers

```typescript
// apps/ti-studio/src/lib/sportlink/client.ts
import crypto from "crypto";
import { logger } from "@oranje-wit/types";
import type { SportlinkLid } from "./types";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";

interface LoginResult {
  navajoToken: string;
  clubId: string;
  userName: string;
}

/**
 * Volledige Keycloak PKCE → Navajo token flow.
 * Gooit bij fouten een Error met een gebruikersvriendelijke melding.
 */
export async function sportlinkLogin(
  email: string,
  password: string
): Promise<LoginResult> {
  // Stap 1: PKCE parameters
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const state = crypto.randomBytes(16).toString("hex");

  // Stap 2: Keycloak auth page ophalen
  const authUrl =
    `${KEYCLOAK_BASE}/protocol/openid-connect/auth?` +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

  const authRes = await fetch(authUrl, { redirect: "manual" });
  const authHtml = await authRes.text();
  const cookies = authRes.headers.getSetCookie?.() ?? [];
  const cookieStr = cookies.map((c) => c.split(";")[0]).join("; ");

  const actionMatch = authHtml.match(/action="([^"]+)"/);
  if (!actionMatch) throw new Error("Kan Sportlink login-pagina niet laden");
  const formAction = actionMatch[1].replace(/&amp;/g, "&");

  // Stap 3: POST credentials
  const loginRes = await fetch(formAction, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieStr,
    },
    body: new URLSearchParams({ username: email, password }),
    redirect: "manual",
  });

  // Check of login direct een redirect geeft (geen OTP)
  let redirectUrl = loginRes.headers.get("location");

  if (!redirectUrl) {
    // Stap 4: OTP pagina — skip door leeg formulier te posten
    const loginHtml = await loginRes.text();

    // Check voor foutmelding
    if (loginHtml.includes("kc-feedback-text")) {
      const errorMatch = loginHtml.match(/kc-feedback-text">\s*([^<]+)/);
      throw new Error(errorMatch?.[1]?.trim() ?? "Onjuiste inloggegevens");
    }

    const otpMatch = loginHtml.match(/action="([^"]+)"/);
    if (!otpMatch) throw new Error("Onverwachte Sportlink-pagina na login");
    const otpAction = otpMatch[1].replace(/&amp;/g, "&");

    const allCookies = [
      ...cookies,
      ...(loginRes.headers.getSetCookie?.() ?? []),
    ]
      .map((c) => c.split(";")[0])
      .join("; ");

    const otpRes = await fetch(otpAction, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: allCookies,
      },
      body: new URLSearchParams({}),
      redirect: "manual",
    });

    redirectUrl = otpRes.headers.get("location");
  }

  if (!redirectUrl?.includes("code=")) {
    throw new Error("Sportlink login mislukt — geen autorisatiecode ontvangen");
  }

  // Stap 5: Token exchange
  const authCode = new URL(redirectUrl).searchParams.get("code")!;

  const tokenRes = await fetch(
    `${KEYCLOAK_BASE}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        code: authCode,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    }
  );

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error("Kan geen Keycloak-token verkrijgen");
  }

  // Stap 6: LinkToPerson → Navajo token
  const linkRes = await fetch(`${NAVAJO_BASE}/user/LinkToPerson`, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "X-Navajo-Entity": "user/LinkToPerson",
      "X-Navajo-Instance": "KNKV",
      "X-Navajo-Locale": "nl",
    },
  });

  const linkData = await linkRes.json();
  if (!linkData.TokenObject?.accessToken) {
    throw new Error("Kan geen Sportlink-sessie starten");
  }

  logger.info("[sportlink] Login geslaagd voor", email);

  return {
    navajoToken: linkData.TokenObject.accessToken,
    clubId: linkData.ClubId,
    userName: email,
  };
}

/**
 * Haal alle actieve + afgemelde leden op via SearchMembers.
 */
export async function sportlinkZoekLeden(
  navajoToken: string
): Promise<SportlinkLid[]> {
  const res = await fetch(`${NAVAJO_BASE}/member/search/SearchMembers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${navajoToken}`,
      "Content-Type": "text/plain;charset=UTF-8",
      "X-Navajo-Entity": "member/search/SearchMembers",
      "X-Navajo-Instance": "KNKV",
      "X-Navajo-Locale": "nl",
    },
    body: JSON.stringify({
      Filters: {
        InputExtended: {
          TypeOfMember: {
            Type: "MULTISELECT",
            Options: [
              { Id: "KERNELMEMBER", IsSelected: true },
              { Id: "CLUBMEMBER", IsSelected: true },
              { Id: "CLUBRELATION", IsSelected: true },
            ],
          },
          MemberStatus: {
            Type: "MULTISELECT",
            Options: [
              { Id: "ACTIVE", IsSelected: true },
              { Id: "INACTIVE", IsSelected: true },
              { Id: "ELIGABLE_FOR_REMOVE", IsSelected: true },
            ],
          },
        },
        InputSimple: {
          SearchValue: {
            Type: "INPUT",
            Options: [{ Name: "SEARCHVALUE", Type: "TEXT", Value: "" }],
          },
        },
      },
    }),
  });

  const data = await res.json();
  if (data.Error) {
    throw new Error(`Sportlink zoekfout: ${data.Message}`);
  }

  logger.info(`[sportlink] ${data.Members?.length ?? 0} leden opgehaald`);
  return data.Members ?? [];
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/lib/sportlink/client.ts
git commit -m "feat(sportlink): Keycloak PKCE + Navajo client (pure fetch)"
```

---

## Task 3: Diff Engine

**Files:**
- Create: `apps/ti-studio/src/lib/sportlink/diff.ts`

- [ ] **Step 1: Implementeer diff logica**

```typescript
// apps/ti-studio/src/lib/sportlink/diff.ts
import { prisma } from "@oranje-wit/database";
import type { SportlinkLid, SyncDiff, NieuwLid, AfgemeldLid, FuzzyMatch } from "./types";

/**
 * Vergelijk Sportlink-leden met de spelers in de database.
 *
 * 1. Match op id (= rel_code = PublicPersonId)
 *    → actief in Sportlink maar RelationEnd gevuld → afgemeld
 * 2. Geen match → fuzzy match op voornaam + achternaam + geboortedatum
 *    → gevonden → koppeling voorstel
 *    → niet gevonden → nieuw lid
 */
export async function berekenDiff(leden: SportlinkLid[]): Promise<SyncDiff> {
  // Haal alle spelers op (alleen velden die we nodig hebben)
  const spelers = await prisma.speler.findMany({
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortedatum: true,
    },
  });

  const spelerById = new Map(spelers.map((s) => [s.id, s]));
  const spelersZonderRelCode: typeof spelers = []; // niet van toepassing — id IS rel_code

  // Spelers zonder bekende rel_code zijn spelers die handmatig zijn aangemaakt
  // met een niet-Sportlink id (bijv. "handmatig-xxx")
  const handmatigeSpelers = spelers.filter(
    (s) => !s.id.match(/^[A-Z]{1,3}\w+$/) // Sportlink IDs matchen dit patroon (bijv. NFW92M3)
  );

  const nieuwe: NieuwLid[] = [];
  const afgemeld: AfgemeldLid[] = [];
  const fuzzyMatches: FuzzyMatch[] = [];
  const bekendeIds = new Set(spelers.map((s) => s.id));

  for (const lid of leden) {
    const relCode = lid.PublicPersonId;

    if (bekendeIds.has(relCode)) {
      // Bekend lid — check of afgemeld
      const isAfgemeld =
        lid.RelationEnd !== null || lid.MemberStatus !== "ACTIVE";
      if (isAfgemeld) {
        const speler = spelerById.get(relCode)!;
        afgemeld.push({
          lid,
          spelerId: speler.id,
          spelerNaam: `${speler.roepnaam} ${speler.achternaam}`,
        });
      }
      continue;
    }

    // Niet bekend op rel_code — probeer fuzzy match
    const fuzzyHit = handmatigeSpelers.find((s) => {
      const naamMatch =
        normaliseer(s.roepnaam) === normaliseer(lid.FirstName) &&
        normaliseer(s.achternaam) === normaliseer(lid.LastName);
      const datumMatch =
        s.geboortedatum &&
        s.geboortedatum.toISOString().slice(0, 10) === lid.DateOfBirth;
      return naamMatch && datumMatch;
    });

    if (fuzzyHit) {
      fuzzyMatches.push({
        lid,
        spelerId: fuzzyHit.id,
        spelerNaam: `${fuzzyHit.roepnaam} ${fuzzyHit.achternaam}`,
      });
    } else {
      nieuwe.push({ lid });
    }
  }

  return { nieuwe, afgemeld, fuzzyMatches };
}

function normaliseer(naam: string): string {
  return naam.toLowerCase().trim().replace(/\s+/g, " ");
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/lib/sportlink/diff.ts
git commit -m "feat(sportlink): diff engine — rel_code match + fuzzy naam match"
```

---

## Task 4: API Route — Sync

**Files:**
- Create: `apps/ti-studio/src/app/api/sportlink/sync/route.ts`

- [ ] **Step 1: Implementeer sync endpoint**

```typescript
// apps/ti-studio/src/app/api/sportlink/sync/route.ts
import { NextRequest } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody } from "@/lib/api";
import { z } from "zod";
import { sportlinkLogin, sportlinkZoekLeden } from "@/lib/sportlink/client";
import { berekenDiff } from "@/lib/sportlink/diff";

const SyncSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return fail(guard.error, 401);

  const body = await parseBody(req, SyncSchema);
  if (!body.ok) return fail(body.error);

  try {
    const { navajoToken } = await sportlinkLogin(body.data.email, body.data.password);
    const leden = await sportlinkZoekLeden(navajoToken);
    const diff = await berekenDiff(leden);
    return ok(diff);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sportlink sync mislukt";
    return fail(message);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/app/api/sportlink/sync/route.ts
git commit -m "feat(sportlink): POST /api/sportlink/sync endpoint"
```

---

## Task 5: API Route — Apply

**Files:**
- Create: `apps/ti-studio/src/app/api/sportlink/apply/route.ts`

- [ ] **Step 1: Implementeer apply endpoint**

Dit endpoint verwerkt de geselecteerde wijzigingen:
- **Nieuwe spelers:** Maak Speler-records aan met Sportlink-data
- **Afmeldingen:** Markeer als STOPT
- **Koppelingen:** Verplaats data naar nieuwe Speler met correcte rel_code

```typescript
// apps/ti-studio/src/app/api/sportlink/apply/route.ts
import { NextRequest } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody } from "@/lib/api";
import { z } from "zod";
import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import type { SportlinkLid } from "@/lib/sportlink/types";

const ApplySchema = z.object({
  nieuwe: z.array(
    z.object({
      relCode: z.string(),
      roepnaam: z.string(),
      achternaam: z.string(),
      geboortejaar: z.number(),
      geboortedatum: z.string(),
      geslacht: z.enum(["M", "V"]),
    })
  ),
  afgemeld: z.array(z.string()), // speler IDs
  koppelingen: z.array(
    z.object({
      oudSpelerId: z.string(),
      nieuweRelCode: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return fail(guard.error, 401);

  const body = await parseBody(req, ApplySchema);
  if (!body.ok) return fail(body.error);

  try {
    const { nieuwe, afgemeld, koppelingen } = body.data;
    let aangemaakt = 0;
    let afgemeldCount = 0;
    let gekoppeld = 0;

    // Nieuwe spelers aanmaken
    for (const speler of nieuwe) {
      await prisma.speler.create({
        data: {
          id: speler.relCode,
          roepnaam: speler.roepnaam,
          achternaam: speler.achternaam,
          geboortejaar: speler.geboortejaar,
          geboortedatum: new Date(speler.geboortedatum),
          geslacht: speler.geslacht === "M" ? "MAN" : "VROUW",
          status: "BESCHIKBAAR",
        },
      });
      aangemaakt++;
    }

    // Afmeldingen markeren
    for (const spelerId of afgemeld) {
      await prisma.speler.update({
        where: { id: spelerId },
        data: { status: "STOPT" },
      });
      afgemeldCount++;
    }

    // Fuzzy matches koppelen: verplaats relaties naar nieuwe ID
    for (const { oudSpelerId, nieuweRelCode } of koppelingen) {
      // Haal bestaande speler op
      const bestaand = await prisma.speler.findUnique({
        where: { id: oudSpelerId },
      });
      if (!bestaand) continue;

      // Maak nieuwe speler met correcte rel_code en kopieer data
      await prisma.speler.create({
        data: {
          ...bestaand,
          id: nieuweRelCode,
        },
      });

      // Verplaats relaties (TeamSpeler, SelectieSpeler, Evaluatie)
      await prisma.teamSpeler.updateMany({
        where: { spelerId: oudSpelerId },
        data: { spelerId: nieuweRelCode },
      });
      await prisma.selectieSpeler.updateMany({
        where: { spelerId: oudSpelerId },
        data: { spelerId: nieuweRelCode },
      });
      await prisma.evaluatie.updateMany({
        where: { spelerId: oudSpelerId },
        data: { spelerId: nieuweRelCode },
      });

      // Verwijder oude speler
      await prisma.speler.delete({ where: { id: oudSpelerId } });

      gekoppeld++;
    }

    logger.info(
      `[sportlink] Apply: ${aangemaakt} aangemaakt, ${afgemeldCount} afgemeld, ${gekoppeld} gekoppeld`
    );

    return ok({ aangemaakt, afgemeld: afgemeldCount, gekoppeld });
  } catch (error) {
    logger.error("[sportlink] Apply fout:", error);
    const message =
      error instanceof Error ? error.message : "Doorvoeren mislukt";
    return fail(message);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/app/api/sportlink/apply/route.ts
git commit -m "feat(sportlink): POST /api/sportlink/apply endpoint"
```

---

## Task 6: UI — Client Component

**Files:**
- Create: `apps/ti-studio/src/components/sportlink/SportlinkSync.tsx`

- [ ] **Step 1: Implementeer de 4-state UI**

Volg het prototype in `docs/superpowers/prototypes/sportlink-sync/sportlink-sync.html`. De component beheert 4 states: `login` → `loading` → `diff` → `done`.

Gebruik de bestaande TI Studio styling-patronen:
- `var(--surface-sunken)` voor inputs
- `var(--border-default)` voor borders
- `var(--accent)` voor primaire knoppen
- `var(--text-secondary)` voor labels

De component moet:
1. Login-formulier tonen (email + wachtwoord)
2. Bij submit: POST naar `/api/sportlink/sync` met credentials
3. Diff-resultaten tonen in 3 categorieën met checkboxes per speler
4. Bij "Doorvoeren": POST naar `/api/sportlink/apply` met geselecteerde items
5. Bevestiging tonen met samenvatting

**Belangrijk:** Vertaal `GenderCode` "Male"/"Female" naar "M"/"V", en bereken `geboortejaar` uit `DateOfBirth`. Gebruik de korfballeeftijd-helpers uit `@oranje-wit/types` voor leeftijdweergave.

- [ ] **Step 2: Commit**

```bash
git add apps/ti-studio/src/components/sportlink/SportlinkSync.tsx
git commit -m "feat(sportlink): SportlinkSync UI component (4 states)"
```

---

## Task 7: Page + Ribbon

**Files:**
- Create: `apps/ti-studio/src/app/(protected)/sportlink/page.tsx`
- Modify: `apps/ti-studio/src/components/werkbord/Ribbon.tsx`

- [ ] **Step 1: Maak de pagina**

```typescript
// apps/ti-studio/src/app/(protected)/sportlink/page.tsx
import { SportlinkSync } from "@/components/sportlink/SportlinkSync";

export const dynamic = "force-dynamic";

export default function SportlinkPage() {
  return <SportlinkSync />;
}
```

- [ ] **Step 2: Voeg Sportlink toe aan de Ribbon**

In `Ribbon.tsx`:
- Voeg een `onNaarSportlink` callback toe aan `RibbonProps`
- Voeg een nieuw `RibbonBtn` toe na de divider (vóór Instellingen) met een sync/refresh icoon
- `active` wanneer `activeRoute === "sportlink"`

- [ ] **Step 3: Verbind de Ribbon callback in de page shell**

In `TiStudioPageShell.tsx` (of waar de Ribbon wordt gerenderd):
- Voeg `onNaarSportlink` handler toe die navigeert naar `/sportlink`
- Geef `activeRoute="sportlink"` door wanneer op de sportlink-pagina

- [ ] **Step 4: Commit**

```bash
git add apps/ti-studio/src/app/(protected)/sportlink/page.tsx
git add apps/ti-studio/src/components/werkbord/Ribbon.tsx
git add apps/ti-studio/src/components/werkbord/TiStudioPageShell.tsx
git commit -m "feat(sportlink): pagina + Ribbon navigatie"
```

---

## Task 8: Handmatige test

- [ ] **Step 1: Start de TI Studio dev server**

```bash
cd apps/ti-studio && pnpm dev
```

- [ ] **Step 2: Test de volledige flow**

1. Open `http://localhost:3001/sportlink`
2. Controleer dat het Sportlink-icoon in de Ribbon actief is
3. Vul Sportlink credentials in en klik "Ophalen"
4. Verifieer dat de diff-resultaten verschijnen
5. Selecteer items en klik "Doorvoeren"
6. Controleer de bevestiging

- [ ] **Step 3: Typecheck**

```bash
cd apps/ti-studio && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit eventuele fixes**

---

## Task 9: Build verificatie

- [ ] **Step 1: Draai de build**

```bash
pnpm build --filter ti-studio
```

- [ ] **Step 2: Fix eventuele build-fouten**

- [ ] **Step 3: Final commit**

```bash
git commit -m "fix(sportlink): build fixes"
```
