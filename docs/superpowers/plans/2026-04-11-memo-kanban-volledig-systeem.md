# Memo-kanban volledig systeem — implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Het memo-systeem volledig afronden: Ribbon-navigatie, ▲ indicatoren, kader-pagina memo's, en kanban detail-drawer met chat-tijdlijn.

**Architecture:** Bestaand kanban bord (`/ti-studio/memo/`) bereikbaar maken via Ribbon. Schema uitbreiden met `WerkitemToelichting` + `WerkitemLog`. Drawer component voor detail/bewerken. Kader-pagina krijgt TC-algemeen + per-doelgroep WerkitemPanel-secties.

**Tech Stack:** Next.js 16, Prisma (PostgreSQL), React, Vitest, TypeScript. Alle server actions gebruiken `requireTC()` uit `@oranje-wit/auth/checks`. Pattern: `ok()`/`fail()` voor API routes, `ActionResult<T>` voor server actions.

---

## Bestandskaart

### Nieuw aan te maken

| Bestand | Verantwoordelijkheid |
|---|---|
| `apps/web/src/components/ti-studio/MemoDrawer.tsx` | Slide-in detail-drawer voor één werkitem |
| `apps/web/src/components/ti-studio/WerkitemTijdlijn.tsx` | Chat-tijdlijn (toelichtingen + log) binnen MemoDrawer |
| `apps/web/src/components/ti-studio/DoelgroepMemoSectie.tsx` | Accordeon-sectie per doelgroep in KaderView |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/toelichting-actions.ts` | `createToelichting` server action |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/log-actions.ts` | `registreerLog` interne helper |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/memo-count-actions.ts` | `getOpenMemoCount` server action |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/kanban-filter.ts` | Pure filter-logica (testbaar) |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/kanban-filter.test.ts` | Unit tests voor filter-logica |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils.ts` | Pure merge-logica tijdlijn (testbaar) |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils.test.ts` | Unit tests voor tijdlijn-merge |

### Te wijzigen

| Bestand | Wijziging |
|---|---|
| `packages/database/prisma/schema.prisma` | Toevoegen `WerkitemToelichting`, `WerkitemLog`, `LogActie` enum; back-relations op `Werkitem` |
| `apps/web/src/components/ti-studio/werkbord/Ribbon.tsx` | Nieuw clipboard-icoon + badge + `onNaarMemo`/`openMemoCount` props |
| `apps/web/src/components/ti-studio/werkbord/TiStudioPageShell.tsx` | `onNaarMemo` callback + `openMemoCount` ophalen |
| `apps/web/src/components/ti-studio/werkbord/types.ts` | `openMemoCount?: number` op `WerkbordTeam` en `WerkbordSpeler` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx` | Memo-count queries + invullen in `initieleState` |
| `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx` | `openMemoCount?: number` prop + ▲ in header |
| `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx` | `openMemoCount?: number` prop + ▲ rechts in rij |
| `apps/web/src/components/ti-studio/WerkitemPanel.tsx` | `doelgroep?: string` prop doorgeven aan `createWerkitem` |
| `apps/web/src/components/ti-studio/kader/KaderView.tsx` | TC-algemeen sectie + `DoelgroepMemoSectie` onderaan |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/kader/actions.ts` | `getKaderMemos` laden |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkitem-actions.ts` | `registreerLog` aanroepen bij create/updateStatus/verwijder |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/KanbanBord.tsx` | Filter-chips + `onClick` → drawer + tijdlijn data; `KanbanWerkitem` type uitbreiden |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/page.tsx` | Include `toelichtingen` + `activiteiten` + `doelgroep` in query |

---

## Task 1: Prisma schema — WerkitemToelichting + WerkitemLog

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Stap 1: Voeg modellen + enum toe aan schema.prisma**

Zoek het blok dat eindigt op `}` na `model Werkitem` (rond regel 1098–1185). Voeg direct na het `Werkitem` model toe:

```prisma
model WerkitemToelichting {
  id          String   @id @default(cuid())
  werkitem    Werkitem @relation(fields: [werkitemId], references: [id], onDelete: Cascade)
  werkitemId  String
  auteurNaam  String
  auteurEmail String
  tekst       String   @db.Text
  timestamp   DateTime @default(now())

  @@index([werkitemId])
}

model WerkitemLog {
  id          String   @id @default(cuid())
  werkitem    Werkitem @relation(fields: [werkitemId], references: [id], onDelete: Cascade)
  werkitemId  String
  auteurNaam  String
  auteurEmail String
  actie       LogActie
  detail      String?
  timestamp   DateTime @default(now())

  @@index([werkitemId])
}

enum LogActie {
  AANGEMAAKT
  BEWERKT
  STATUS_GEWIJZIGD
  VERWIJDERD
}
```

- [ ] **Stap 2: Voeg back-relations toe aan Werkitem model**

In `model Werkitem`, zoek de bestaande `activiteiten`-achtige relaties (rond regel 1165). Voeg toe na de bestaande relaties:

```prisma
  toelichtingen WerkitemToelichting[]
  activiteiten  WerkitemLog[]
```

- [ ] **Stap 3: Migratie aanmaken en draaien**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm db:migrate
```

Geef de migratie de naam: `werkitem-toelichting-en-log`

Verwacht: migratie wordt aangemaakt in `packages/database/prisma/migrations/` en uitgevoerd.

- [ ] **Stap 4: Prisma client regenereren**

```bash
pnpm db:generate
```

Verwacht: geen errors. `WerkitemToelichting`, `WerkitemLog`, `LogActie` zijn nu beschikbaar in `@oranje-wit/database`.

- [ ] **Stap 5: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations/
git commit -m "feat(db): WerkitemToelichting + WerkitemLog modellen voor memo-tijdlijn"
```

---

## Task 2: Log helper + toelichting server action

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/log-actions.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/toelichting-actions.ts`

- [ ] **Stap 1: Schrijf log-actions.ts**

```typescript
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/log-actions.ts
import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { LogActie } from "@oranje-wit/database";

export async function registreerLog(
  werkitemId: string,
  auteurNaam: string,
  auteurEmail: string,
  actie: LogActie,
  detail?: string
): Promise<void> {
  try {
    await prisma.werkitemLog.create({
      data: { werkitemId, auteurNaam, auteurEmail, actie, detail: detail ?? null },
    });
  } catch (error) {
    logger.warn("registreerLog mislukt (niet-kritisch):", error);
  }
}
```

- [ ] **Stap 2: Schrijf toelichting-actions.ts**

```typescript
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/toelichting-actions.ts
"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";

export type ToelichtingData = {
  id: string;
  auteurNaam: string;
  auteurEmail: string;
  tekst: string;
  timestamp: string; // ISO string
};

export async function createToelichting(
  werkitemId: string,
  tekst: string
): Promise<ActionResult<ToelichtingData>> {
  try {
    const session = await requireTC();
    const user = session.user as Record<string, unknown>;
    const auteurEmail = (user?.email as string) ?? "onbekend";
    const auteurNaam =
      (user?.name as string) ?? auteurEmail.split("@")[0];

    const toelichting = await prisma.werkitemToelichting.create({
      data: { werkitemId, auteurNaam, auteurEmail, tekst },
    });

    revalidatePath("/ti-studio/memo");
    return {
      ok: true,
      data: {
        id: toelichting.id,
        auteurNaam: toelichting.auteurNaam,
        auteurEmail: toelichting.auteurEmail,
        tekst: toelichting.tekst,
        timestamp: toelichting.timestamp.toISOString(),
      },
    };
  } catch (error) {
    logger.error("createToelichting mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Stap 3: Voeg logging toe aan werkitem-actions.ts**

Importeer bovenaan `werkitem-actions.ts`:

```typescript
import { registreerLog } from "./log-actions";
```

In `createWerkitem`, voeg toe direct na het succesvolle `prisma.werkitem.create`:

```typescript
    await registreerLog(werkitem.id, auteurId, auteurId, "AANGEMAAKT");
```

In `updateWerkitemStatus`, voeg toe na het succesvolle `prisma.werkitem.update` (voor de `revalidatePath`):

```typescript
    const session2 = await requireTC().catch(() => null);
    const email2 = ((session2?.user as Record<string, unknown>)?.email as string) ?? "systeem";
    await registreerLog(id, email2, email2, "STATUS_GEWIJZIGD", status);
```

In `verwijderWerkitem`, voeg toe voor `prisma.werkitem.delete`:

```typescript
    const session3 = await requireTC().catch(() => null);
    const email3 = ((session3?.user as Record<string, unknown>)?.email as string) ?? "systeem";
    await registreerLog(id, email3, email3, "VERWIJDERD");
```

- [ ] **Stap 4: Typecheck**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm --filter web tsc --noEmit
```

Verwacht: geen errors.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/log-actions.ts
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/toelichting-actions.ts
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/werkitem-actions.ts
git commit -m "feat(memo): WerkitemLog registratie + createToelichting server action"
```

---

## Task 3: Ribbon — memo-knop + badge

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/memo-count-actions.ts`
- Modify: `apps/web/src/components/ti-studio/werkbord/Ribbon.tsx`
- Modify: `apps/web/src/components/ti-studio/werkbord/TiStudioPageShell.tsx`

- [ ] **Stap 1: Schrijf memo-count-actions.ts**

```typescript
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/memo-count-actions.ts
"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";

export async function getOpenMemoCount(kadersId: string): Promise<number> {
  try {
    return await prisma.werkitem.count({
      where: {
        kadersId,
        type: "MEMO",
        status: { in: ["OPEN", "IN_BESPREKING"] },
      },
    });
  } catch (error) {
    logger.warn("getOpenMemoCount mislukt:", error);
    return 0;
  }
}
```

- [ ] **Stap 2: Pas Ribbon.tsx interface aan**

Vervang de bestaande `RibbonProps` interface:

```typescript
interface RibbonProps {
  gebruikerInitialen: string;
  activeRoute: string;
  onNaarIndeling: () => void;
  onNaarKader: () => void;
  onNaarPersonen: () => void;
  onNaarMemo: () => void;
  openMemoCount: number;
}
```

En de functiedeclaratie:

```typescript
export function Ribbon({
  gebruikerInitialen,
  activeRoute,
  onNaarIndeling,
  onNaarKader,
  onNaarPersonen,
  onNaarMemo,
  openMemoCount,
}: RibbonProps) {
```

- [ ] **Stap 3: Voeg Memo-knop toe in Ribbon.tsx**

Zoek de `{/* Hoofd-groep */}` div (regel ±58). Voeg na de Personen `RibbonBtn` een scheidingslijn + memo-knop toe:

```tsx
        {/* Scheidingslijn */}
        <div style={{ width: 22, height: 1, background: "var(--border-0)", margin: "4px 0" }} />

        {/* Memo's */}
        <div style={{ position: "relative" }}>
          <RibbonBtn
            tip="Memo's"
            active={activeRoute.includes("/memo")}
            onClick={onNaarMemo}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </RibbonBtn>
          {openMemoCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 3,
                right: 3,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 8,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                pointerEvents: "none",
              }}
            >
              {openMemoCount > 99 ? "99+" : openMemoCount}
            </span>
          )}
        </div>
```

- [ ] **Stap 4: Pas TiStudioPageShell.tsx aan**

Importeer bovenaan:

```typescript
import { getOpenMemoCount } from "@/app/(teamindeling-studio)/ti-studio/indeling/memo-count-actions";
import { useEffect, useState } from "react";
```

Voeg state toe in de component (na bestaande `const router = useRouter()`):

```typescript
  const { data: session } = useSession();
  const { seizoen, isWerkseizoen } = useSeizoen();
  const [openMemoCount, setOpenMemoCount] = useState(0);
```

Voeg useEffect toe (na de bestaande useState-declaraties):

```typescript
  useEffect(() => {
    // Laad open memo count — kadersId is niet beschikbaar in PageShell,
    // dus we halen de count op zonder kadersId filter (telt over alle kaders)
    getOpenMemoCount("").then(setOpenMemoCount).catch(() => {});
  }, []);
```

> **Noot:** `getOpenMemoCount` zonder kadersId geeft 0 terug door de where-clause. Pas de action aan zodat een lege kadersId alle werkseizoen-kaders telt:

In `memo-count-actions.ts`, vervang de implementatie:

```typescript
export async function getOpenMemoCount(kadersId?: string): Promise<number> {
  try {
    return await prisma.werkitem.count({
      where: {
        ...(kadersId ? { kadersId } : { kaders: { isWerkseizoen: true } }),
        type: "MEMO",
        status: { in: ["OPEN", "IN_BESPREKING"] },
      },
    });
  } catch (error) {
    logger.warn("getOpenMemoCount mislukt:", error);
    return 0;
  }
}
```

En de `useEffect`:

```typescript
  useEffect(() => {
    getOpenMemoCount().then(setOpenMemoCount).catch(() => {});
  }, []);
```

Pas de `<Ribbon>` aanroep aan:

```tsx
        <Ribbon
          gebruikerInitialen={gebruikerInitialen}
          activeRoute={pathname}
          onNaarIndeling={() => router.push("/ti-studio/indeling")}
          onNaarKader={() => router.push("/ti-studio/kader")}
          onNaarPersonen={() => router.push("/ti-studio/personen")}
          onNaarMemo={() => router.push("/ti-studio/memo")}
          openMemoCount={openMemoCount}
        />
```

- [ ] **Stap 5: Typecheck**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm --filter web tsc --noEmit
```

Verwacht: geen errors.

- [ ] **Stap 6: Smoke test in browser**

Start `pnpm dev`, open `http://localhost:3000/ti-studio/indeling`. Verifieer:
- Clipboard-icoon zichtbaar in Ribbon onder scheidingslijn
- Klikken navigeert naar `/ti-studio/memo`
- Active state (oranje accent-bar) verschijnt op de memo-knop

- [ ] **Stap 7: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/memo-count-actions.ts
git add apps/web/src/components/ti-studio/werkbord/Ribbon.tsx
git add apps/web/src/components/ti-studio/werkbord/TiStudioPageShell.tsx
git commit -m "feat(ribbon): memo-navigatieknop met open-count badge"
```

---

## Task 4: ▲ indicator op TeamKaart en TeamKaartSpelerRij

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/types.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`
- Modify: `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx`
- Modify: `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx`

- [ ] **Stap 1: Voeg openMemoCount toe aan types.ts**

In `WerkbordTeam` interface (na `werkitems: WerkbordWerkitem[]`):

```typescript
  openMemoCount: number;
```

In `WerkbordSpeler` interface (na `isNieuw: boolean`):

```typescript
  openMemoCount: number;
```

- [ ] **Stap 2: Laad memo-counts in indeling/page.tsx**

Voeg import toe bovenaan:

```typescript
import { prisma } from "@/lib/teamindeling/db/prisma";
```

Voeg na de validatie-berekening (voor `const initieleState`) toe:

```typescript
  // Open memo-counts per team en per speler
  const kadersId = volledig.kaders.id;

  const teamMemoCounts = await prisma.werkitem.groupBy({
    by: ["teamId"],
    where: {
      kadersId,
      type: "MEMO",
      status: { in: ["OPEN", "IN_BESPREKING"] },
      teamId: { not: null },
    },
    _count: { id: true },
  });
  const openMemoPerTeam: Record<string, number> = {};
  for (const row of teamMemoCounts) {
    if (row.teamId) openMemoPerTeam[row.teamId] = row._count.id;
  }

  const spelerMemoCounts = await prisma.werkitem.groupBy({
    by: ["spelerId"],
    where: {
      kadersId,
      type: "MEMO",
      status: { in: ["OPEN", "IN_BESPREKING"] },
      spelerId: { not: null },
    },
    _count: { id: true },
  });
  const openMemoPerSpeler: Record<string, number> = {};
  for (const row of spelerMemoCounts) {
    if (row.spelerId) openMemoPerSpeler[row.spelerId] = row._count.id;
  }
```

Pas de `teams`-mapping aan — voeg `openMemoCount` toe in het return-object van `.map()`:

```typescript
      openMemoCount: openMemoPerTeam[team.id] ?? 0,
```

Pas de `alleSpelers`-mapping aan — voeg toe in `.map()`:

```typescript
    openMemoCount: openMemoPerSpeler[sp.id] ?? 0,
```

- [ ] **Stap 3: ▲ in TeamKaart header**

In `TeamKaart.tsx`, voeg `openMemoCount` toe aan `TeamKaartProps`:

```typescript
  openMemoCount?: number;
```

En aan de destructuring:

```typescript
  openMemoCount = 0,
```

In de header-div (na de bestaande `<div style={{ display: "flex", gap: 3 }}>` met validatie-icoon, rond regel 194), voeg de ▲ toe vóór de bestaande button-row:

```tsx
        {openMemoCount > 0 && (
          <span
            style={{
              fontSize: 10,
              color: "var(--accent)",
              fontWeight: 700,
              lineHeight: 1,
              flexShrink: 0,
            }}
            title={`${openMemoCount} open memo${openMemoCount !== 1 ? "'s" : ""}`}
          >
            ▲
          </span>
        )}
```

- [ ] **Stap 4: ▲ in TeamKaartSpelerRij**

In `TeamKaartSpelerRij.tsx`, voeg `openMemoCount?: number` toe aan `TeamKaartSpelerRijProps`:

```typescript
  openMemoCount?: number;
```

En aan de destructuring in de `TeamKaartSpelerRij`-functie:

```typescript
  openMemoCount = 0,
```

In de `NormaalSpelerRij`-component (die ook een props-interface heeft), voeg hetzelfde `openMemoCount?: number` toe aan die interface en geef het door. Zoek de plek in de rij waar naam/score staat en voeg rechts toe:

```tsx
      {openMemoCount > 0 && (
        <span
          style={{
            fontSize: 9,
            color: "var(--accent)",
            fontWeight: 700,
            lineHeight: 1,
            flexShrink: 0,
          }}
          title={`${openMemoCount} open memo${openMemoCount !== 1 ? "'s" : ""}`}
        >
          ▲
        </span>
      )}
```

> **Noot:** `TeamKaartSpelerRij` heeft drie sub-renders (detail → SpelerKaart, normaal → NormaalSpelerRij, compact → CompactSpelerRij). Voeg de ▲ toe aan de `normaal`-variant; de `detail` en `compact`-varianten hoeven dit niet.

- [ ] **Stap 5: Geef openMemoCount door in TiStudioShell en WerkbordCanvas**

`TiStudioShell` geeft teams door aan `WerkbordCanvas` → `TeamKaart`. Zoek in `TiStudioShell.tsx` waar `<TeamKaart>` of `<WerkbordCanvas>` gerenderd wordt en zorg dat `openMemoCount={team.openMemoCount}` doorgegeven wordt. Doe hetzelfde voor `TeamKaartSpelerRij` via `spelerInTeam.speler.openMemoCount`.

- [ ] **Stap 6: Typecheck**

```bash
pnpm --filter web tsc --noEmit
```

Verwacht: geen errors.

- [ ] **Stap 7: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/types.ts
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/page.tsx
git add apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
git add apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx
git commit -m "feat(werkbord): open memo ▲ indicator op TeamKaart en SpelerRij"
```

---

## Task 5: Kader-pagina memo's

**Files:**
- Modify: `apps/web/src/components/ti-studio/WerkitemPanel.tsx`
- Create: `apps/web/src/components/ti-studio/DoelgroepMemoSectie.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/kader/actions.ts`
- Modify: `apps/web/src/components/ti-studio/kader/KaderView.tsx`

- [ ] **Stap 1: Voeg doelgroep prop toe aan WerkitemPanel**

In `WerkitemPanel.tsx`, voeg toe aan `WerkitemPanelProps`:

```typescript
  doelgroep?: string;
```

En aan de destructuring + `createWerkitem`-aanroep:

```typescript
  doelgroep,
```

In `handleOpslaan`, voeg `doelgroep` toe aan de `createWerkitem`-aanroep:

```typescript
      const result = await createWerkitem({
        kadersId,
        werkindelingId,
        teamId,
        spelerId,
        stafId,
        beschrijving,
        prioriteit: nieuwePrioriteit,
        doelgroep,
      });
```

- [ ] **Stap 2: Schrijf DoelgroepMemoSectie.tsx**

```tsx
// apps/web/src/components/ti-studio/DoelgroepMemoSectie.tsx
"use client";
import { useState } from "react";
import { WerkitemPanel } from "./WerkitemPanel";
import type { WerkbordWerkitem } from "./werkbord/types";

const DOELGROEP_LABEL: Record<string, string> = {
  KWEEKVIJVER: "Kweekvijver",
  ONTWIKKELHART: "Opleidingshart",
  TOP: "Topsport",
  WEDSTRIJDSPORT: "Wedstrijdsport",
  KORFBALPLEZIER: "Korfbalplezier",
};

const DOELGROEP_KLEUR: Record<string, string> = {
  KWEEKVIJVER: "#f9a8d4",
  ONTWIKKELHART: "#fbbf24",
  TOP: "#a78bfa",
  WEDSTRIJDSPORT: "#60a5fa",
  KORFBALPLEZIER: "#34d399",
};

const DOELGROEPEN = ["TOP", "WEDSTRIJDSPORT", "KORFBALPLEZIER", "ONTWIKKELHART", "KWEEKVIJVER"] as const;

interface DoelgroepMemoSectieProps {
  kadersId: string;
  werkitemsPerDoelgroep: Record<string, WerkbordWerkitem[]>;
  tcAlgemeenWerkitems: WerkbordWerkitem[];
}

export function DoelgroepMemoSectie({
  kadersId,
  werkitemsPerDoelgroep,
  tcAlgemeenWerkitems,
}: DoelgroepMemoSectieProps) {
  const [openDoelgroepen, setOpenDoelgroepen] = useState<Set<string>>(
    () =>
      new Set(
        DOELGROEPEN.filter(
          (d) => (werkitemsPerDoelgroep[d] ?? []).some((w) => w.status === "OPEN" || w.status === "IN_BESPREKING")
        )
      )
  );

  function toggleDoelgroep(d: string) {
    setOpenDoelgroepen((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  const tcOpenCount = tcAlgemeenWerkitems.filter(
    (w) => w.status === "OPEN" || w.status === "IN_BESPREKING"
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* TC — Algemeen */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>TC — Algemeen</span>
            {tcOpenCount > 0 && (
              <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(249,115,22,.15)", color: "var(--accent)", fontWeight: 700 }}>
                {tcOpenCount} open
              </span>
            )}
          </div>
        </div>
        <WerkitemPanel
          entiteitType="TEAM"
          kadersId={kadersId}
          doelgroep="ALLE"
          initieleWerkitems={tcAlgemeenWerkitems}
        />
      </div>

      {/* Scheidingslijn */}
      <div style={{ height: 1, background: "var(--border-0)" }} />

      {/* Per doelgroep */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 12 }}>
          Memo's per doelgroep
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {DOELGROEPEN.map((d) => {
            const items = werkitemsPerDoelgroep[d] ?? [];
            const openCount = items.filter((w) => w.status === "OPEN" || w.status === "IN_BESPREKING").length;
            const isOpen = openDoelgroepen.has(d);
            const kleur = DOELGROEP_KLEUR[d] ?? "#9ca3af";
            return (
              <div
                key={d}
                style={{
                  border: `1px solid ${isOpen ? `${kleur}40` : "var(--border-0)"}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => toggleDoelgroep(d)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: isOpen ? `${kleur}10` : "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: kleur }}>{DOELGROEP_LABEL[d]}</span>
                    {openCount > 0 && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "rgba(249,115,22,.15)", color: "var(--accent)", fontWeight: 700 }}>
                        ▲ {openCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: "10px 14px", borderTop: `1px solid ${kleur}20` }}>
                    <WerkitemPanel
                      entiteitType="TEAM"
                      kadersId={kadersId}
                      doelgroep={d}
                      initieleWerkitems={items}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Stap 3: Voeg getKaderMemos toe aan kader/actions.ts**

```typescript
export async function getKaderMemos(kadersId: string): Promise<{
  tcAlgemeen: WerkbordWerkitem[];
  perDoelgroep: Record<string, WerkbordWerkitem[]>;
}> {
  const werkitems = await prisma.werkitem.findMany({
    where: { kadersId, type: "MEMO", doelgroep: { not: null } },
    orderBy: { volgorde: "asc" },
    select: {
      id: true, titel: true, beschrijving: true, type: true,
      status: true, prioriteit: true, volgorde: true, resolutie: true,
      createdAt: true, doelgroep: true,
    },
  });

  const serialiseer = (w: typeof werkitems[number]): WerkbordWerkitem => ({
    id: w.id,
    titel: w.titel,
    beschrijving: w.beschrijving,
    type: String(w.type),
    status: String(w.status),
    prioriteit: String(w.prioriteit),
    volgorde: w.volgorde,
    resolutie: w.resolutie,
    createdAt: w.createdAt.toISOString(),
  });

  const tcAlgemeen = werkitems.filter((w) => String(w.doelgroep) === "ALLE").map(serialiseer);
  const perDoelgroep: Record<string, WerkbordWerkitem[]> = {};
  for (const w of werkitems.filter((w) => String(w.doelgroep) !== "ALLE")) {
    const d = String(w.doelgroep);
    perDoelgroep[d] = [...(perDoelgroep[d] ?? []), serialiseer(w)];
  }
  return { tcAlgemeen, perDoelgroep };
}
```

Voeg de import toe bovenaan `actions.ts`:
```typescript
import type { WerkbordWerkitem } from "@/components/ti-studio/werkbord/types";
```

- [ ] **Stap 4: Integreer DoelgroepMemoSectie in KaderView**

In `kader/page.tsx`, laad de memo-data:

```typescript
import { getKaderMemos } from "./actions";

export default async function KaderPage() {
  const seizoen = await getActiefSeizoen();
  const opgeslagenKaders = await getTeamtypeKaders(seizoen);
  const kaders = await prisma.kaders.findFirst({
    where: { seizoen, isWerkseizoen: true },
    select: { id: true },
  });
  const memos = kaders ? await getKaderMemos(kaders.id) : { tcAlgemeen: [], perDoelgroep: {} };

  return (
    <KaderView
      seizoen={seizoen}
      opgeslagenKaders={opgeslagenKaders}
      kadersId={kaders?.id ?? ""}
      tcAlgemeenMemos={memos.tcAlgemeen}
      memosPerDoelgroep={memos.perDoelgroep}
    />
  );
}
```

Voeg de corresponderende props toe aan `KaderView.tsx`:

```typescript
interface KaderViewProps {
  seizoen: string;
  opgeslagenKaders: unknown;
  kadersId: string;
  tcAlgemeenMemos: WerkbordWerkitem[];
  memosPerDoelgroep: Record<string, WerkbordWerkitem[]>;
}
```

Voeg onderaan in de return van `KaderView` toe (na de bestaande content):

```tsx
      {/* Scheidingslijn */}
      <div style={{ height: 1, background: "var(--border-0)", margin: "32px 0" }} />

      {/* Memo's */}
      <DoelgroepMemoSectie
        kadersId={kadersId}
        tcAlgemeenWerkitems={tcAlgemeenMemos}
        werkitemsPerDoelgroep={memosPerDoelgroep}
      />
```

- [ ] **Stap 5: Typecheck**

```bash
pnpm --filter web tsc --noEmit
```

Verwacht: geen errors.

- [ ] **Stap 6: Commit**

```bash
git add apps/web/src/components/ti-studio/WerkitemPanel.tsx
git add apps/web/src/components/ti-studio/DoelgroepMemoSectie.tsx
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/kader/actions.ts
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/kader/page.tsx
git add apps/web/src/components/ti-studio/kader/KaderView.tsx
git commit -m "feat(kader): TC-algemeen + doelgroep memo-secties in KaderView"
```

---

## Task 6: Filter-logica + tijdlijn-utils (getest)

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/kanban-filter.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/kanban-filter.test.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils.ts`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils.test.ts`

- [ ] **Stap 1: Schrijf falende tests voor kanban-filter**

```typescript
// apps/web/src/app/(teamindeling-studio)/ti-studio/memo/kanban-filter.test.ts
import { describe, it, expect } from "vitest";
import { filterWerkitems, type FilterType } from "./kanban-filter";

const basis = {
  id: "1", status: "OPEN", prioriteit: "MIDDEL",
  beschrijving: "test", volgorde: 0, createdAt: "2026-04-01T00:00:00.000Z",
  teamId: null, spelerId: null, stafId: null, doelgroep: null,
  team: null, speler: null, staf: null,
};

describe("filterWerkitems", () => {
  it("alles geeft alle items terug", () => {
    const items = [
      { ...basis, id: "1", teamId: "t1" },
      { ...basis, id: "2", spelerId: "s1" },
    ];
    expect(filterWerkitems(items, "alles")).toHaveLength(2);
  });

  it("team filtert op teamId not null", () => {
    const items = [
      { ...basis, id: "1", teamId: "t1" },
      { ...basis, id: "2", spelerId: "s1" },
    ];
    expect(filterWerkitems(items, "team")).toHaveLength(1);
    expect(filterWerkitems(items, "team")[0].id).toBe("1");
  });

  it("speler filtert op spelerId not null", () => {
    const items = [{ ...basis, id: "2", spelerId: "s1" }];
    expect(filterWerkitems(items, "speler")).toHaveLength(1);
  });

  it("doelgroep filtert op doelgroep not null en not ALLE", () => {
    const items = [
      { ...basis, id: "3", doelgroep: "TOP" },
      { ...basis, id: "4", doelgroep: "ALLE" },
    ];
    expect(filterWerkitems(items, "doelgroep")).toHaveLength(1);
    expect(filterWerkitems(items, "doelgroep")[0].id).toBe("3");
  });

  it("tc-algemeen filtert op doelgroep === ALLE", () => {
    const items = [
      { ...basis, id: "4", doelgroep: "ALLE" },
      { ...basis, id: "5", doelgroep: "TOP" },
    ];
    expect(filterWerkitems(items, "tc-algemeen")).toHaveLength(1);
    expect(filterWerkitems(items, "tc-algemeen")[0].id).toBe("4");
  });
});
```

- [ ] **Stap 2: Draai test om te verifiëren dat hij faalt**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm --filter web test -- kanban-filter --reporter=verbose
```

Verwacht: FAIL — `filterWerkitems` not found.

- [ ] **Stap 3: Schrijf kanban-filter.ts**

```typescript
// apps/web/src/app/(teamindeling-studio)/ti-studio/memo/kanban-filter.ts
export type FilterType = "alles" | "team" | "speler" | "doelgroep" | "tc-algemeen";

export interface FilterbaarWerkitem {
  teamId: string | null;
  spelerId: string | null;
  doelgroep: string | null;
}

export function filterWerkitems<T extends FilterbaarWerkitem>(
  items: T[],
  filter: FilterType
): T[] {
  switch (filter) {
    case "alles":
      return items;
    case "team":
      return items.filter((i) => i.teamId !== null);
    case "speler":
      return items.filter((i) => i.spelerId !== null);
    case "doelgroep":
      return items.filter((i) => i.doelgroep !== null && i.doelgroep !== "ALLE");
    case "tc-algemeen":
      return items.filter((i) => i.doelgroep === "ALLE");
  }
}
```

- [ ] **Stap 4: Draai test om te verifiëren dat hij slaagt**

```bash
pnpm --filter web test -- kanban-filter --reporter=verbose
```

Verwacht: PASS — 5 tests geslaagd.

- [ ] **Stap 5: Schrijf falende tests voor tijdlijn-utils**

```typescript
// apps/web/src/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils.test.ts
import { describe, it, expect } from "vitest";
import { mergeTijdlijn, type TijdlijnItem } from "./tijdlijn-utils";

describe("mergeTijdlijn", () => {
  it("combineert toelichtingen en log-items", () => {
    const toelichtingen = [
      { id: "t1", type: "toelichting" as const, auteurNaam: "Antjan", auteurEmail: "a@ow.nl", tekst: "hoi", timestamp: "2026-04-10T10:00:00.000Z" },
    ];
    const logItems = [
      { id: "l1", type: "log" as const, auteurNaam: "Thomas", auteurEmail: "t@ow.nl", actie: "STATUS_GEWIJZIGD", detail: "OPEN", timestamp: "2026-04-10T11:00:00.000Z" },
    ];
    const result = mergeTijdlijn(toelichtingen, logItems);
    expect(result).toHaveLength(2);
  });

  it("sorteert nieuwste eerst (DESC)", () => {
    const toelichtingen = [
      { id: "t1", type: "toelichting" as const, auteurNaam: "A", auteurEmail: "a@ow.nl", tekst: "oud", timestamp: "2026-04-10T08:00:00.000Z" },
      { id: "t2", type: "toelichting" as const, auteurNaam: "A", auteurEmail: "a@ow.nl", tekst: "nieuw", timestamp: "2026-04-10T12:00:00.000Z" },
    ];
    const result = mergeTijdlijn(toelichtingen, []);
    expect(result[0].id).toBe("t2");
    expect(result[1].id).toBe("t1");
  });
});
```

- [ ] **Stap 6: Draai test om te verifiëren dat hij faalt**

```bash
pnpm --filter web test -- tijdlijn-utils --reporter=verbose
```

Verwacht: FAIL — `mergeTijdlijn` not found.

- [ ] **Stap 7: Schrijf tijdlijn-utils.ts**

```typescript
// apps/web/src/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils.ts

export type TijdlijnToelichting = {
  id: string;
  type: "toelichting";
  auteurNaam: string;
  auteurEmail: string;
  tekst: string;
  timestamp: string;
};

export type TijdlijnLog = {
  id: string;
  type: "log";
  auteurNaam: string;
  auteurEmail: string;
  actie: string;
  detail: string | null | undefined;
  timestamp: string;
};

export type TijdlijnItem = TijdlijnToelichting | TijdlijnLog;

export function mergeTijdlijn(
  toelichtingen: TijdlijnToelichting[],
  logItems: TijdlijnLog[]
): TijdlijnItem[] {
  return [...toelichtingen, ...logItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
```

- [ ] **Stap 8: Draai alle tests**

```bash
pnpm --filter web test -- tijdlijn-utils kanban-filter --reporter=verbose
```

Verwacht: alle 7 tests PASS.

- [ ] **Stap 9: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/memo/kanban-filter.ts
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/memo/kanban-filter.test.ts
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/memo/tijdlijn-utils.ts
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/memo/tijdlijn-utils.test.ts
git commit -m "feat(memo): filter-logica + tijdlijn-utils met unit tests"
```

---

## Task 7: WerkitemTijdlijn component

**Files:**
- Create: `apps/web/src/components/ti-studio/WerkitemTijdlijn.tsx`

- [ ] **Stap 1: Schrijf WerkitemTijdlijn.tsx**

```tsx
// apps/web/src/components/ti-studio/WerkitemTijdlijn.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { logger } from "@oranje-wit/types";
import { createToelichting } from "@/app/(teamindeling-studio)/ti-studio/indeling/toelichting-actions";
import { mergeTijdlijn } from "@/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils";
import type { TijdlijnToelichting, TijdlijnLog } from "@/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils";

const LOG_ACTIE_LABEL: Record<string, string> = {
  AANGEMAAKT: "maakte aan",
  BEWERKT: "bewerkte",
  STATUS_GEWIJZIGD: "→",
  VERWIJDERD: "verwijderde",
};

function initials(naam: string): string {
  return naam
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

function korteTijd(iso: string): string {
  const d = new Date(iso);
  const nu = new Date();
  const diffMs = nu.getTime() - d.getTime();
  const diffUur = diffMs / 3600000;
  if (diffUur < 24 && d.getDate() === nu.getDate()) {
    return `vandaag ${d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const gisteren = new Date(nu);
  gisteren.setDate(nu.getDate() - 1);
  if (d.getDate() === gisteren.getDate()) {
    return `gisteren ${d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

interface WerkitemTijdlijnProps {
  werkitemId: string;
  initieleToelichtingen: TijdlijnToelichting[];
  initieleLog: TijdlijnLog[];
  huidigeGebruikerNaam: string;
}

export function WerkitemTijdlijn({
  werkitemId,
  initieleToelichtingen,
  initieleLog,
  huidigeGebruikerNaam,
}: WerkitemTijdlijnProps) {
  const [toelichtingen, setToelichtingen] = useState<TijdlijnToelichting[]>(initieleToelichtingen);
  const [tekst, setTekst] = useState("");
  const [bezig, setBezig] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tijdlijn = mergeTijdlijn(toelichtingen, initieleLog);

  async function verstuur() {
    const t = tekst.trim();
    if (!t || bezig) return;
    setBezig(true);

    // Optimistisch toevoegen
    const optimistisch: TijdlijnToelichting = {
      id: `optimistisch-${Date.now()}`,
      type: "toelichting",
      auteurNaam: huidigeGebruikerNaam,
      auteurEmail: "",
      tekst: t,
      timestamp: new Date().toISOString(),
    };
    setToelichtingen((prev) => [optimistisch, ...prev]);
    setTekst("");

    try {
      const result = await createToelichting(werkitemId, t);
      if (result.ok) {
        setToelichtingen((prev) =>
          prev.map((item) =>
            item.id === optimistisch.id
              ? { ...item, id: result.data!.id, auteurEmail: result.data!.auteurEmail }
              : item
          )
        );
      } else {
        // Rollback
        setToelichtingen((prev) => prev.filter((item) => item.id !== optimistisch.id));
        setTekst(t);
        logger.warn("createToelichting mislukt:", result.error);
      }
    } catch (err) {
      setToelichtingen((prev) => prev.filter((item) => item.id !== optimistisch.id));
      setTekst(t);
      logger.error("WerkitemTijdlijn verstuur fout:", err);
    } finally {
      setBezig(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      verstuur();
    }
  }

  // Auto-groei textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  }, [tekst]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Label */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-3)" }}>
        Tijdlijn
      </div>

      {/* Invoer */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%", background: "#2a1a0a",
          border: "1px solid rgba(255,107,0,.3)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 8, color: "var(--accent)", fontWeight: 700, flexShrink: 0,
        }}>
          {initials(huidigeGebruikerNaam)}
        </div>
        <div style={{
          flex: 1, background: "var(--bg-0)", border: "1px solid var(--border-0)",
          borderRadius: 8, padding: "7px 10px", display: "flex", alignItems: "flex-end", gap: 6,
        }}>
          <textarea
            ref={textareaRef}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Voeg een toelichting toe... (Enter = verzenden)"
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", color: "var(--text-1)",
              fontSize: 12, resize: "none", fontFamily: "Inter, system-ui, sans-serif",
              outline: "none", lineHeight: 1.4, maxHeight: 80, overflowY: "auto",
            }}
          />
          <button
            onClick={verstuur}
            disabled={bezig || !tekst.trim()}
            style={{
              background: bezig || !tekst.trim() ? "var(--bg-2)" : "var(--accent)",
              border: "none", borderRadius: 5, color: bezig || !tekst.trim() ? "var(--text-3)" : "#fff",
              fontSize: 11, fontWeight: 600, padding: "4px 10px", cursor: bezig || !tekst.trim() ? "not-allowed" : "pointer", flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* Tijdlijn — vaste hoogte, scrollbaar, nieuwste bovenaan */}
      <div style={{ height: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
        {tijdlijn.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", paddingTop: 24 }}>
            Nog geen berichten
          </div>
        )}
        {tijdlijn.map((item) => {
          if (item.type === "toelichting") {
            return (
              <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: "#1e2533",
                  border: "1px solid var(--border-0)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 8, color: "var(--accent)", fontWeight: 700, flexShrink: 0, marginTop: 1,
                }}>
                  {initials(item.auteurNaam)}
                </div>
                <div style={{
                  flex: 1, background: "var(--bg-2)", border: "1px solid var(--border-0)",
                  borderRadius: "0 8px 8px 8px", padding: "8px 10px",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", marginBottom: 3 }}>
                    {item.auteurNaam}{" "}
                    <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: 10 }}>· {korteTijd(item.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {item.tekst}
                  </div>
                </div>
              </div>
            );
          }
          // Log-item
          const statusKleur: Record<string, string> = {
            STATUS_GEWIJZIGD: "var(--text-2)",
            AANGEMAAKT: "var(--text-3)",
            BEWERKT: "var(--text-3)",
            VERWIJDERD: "#ef4444",
          };
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, opacity: .55 }}>
              <div style={{ height: 1, flex: 1, background: "var(--border-0)" }} />
              <span style={{ fontSize: 10, color: statusKleur[item.actie] ?? "var(--text-3)", whiteSpace: "nowrap" }}>
                {item.auteurNaam}{" "}
                {LOG_ACTIE_LABEL[item.actie] ?? item.actie}
                {item.detail ? ` ${item.detail}` : ""}
                {" · "}
                {korteTijd(item.timestamp)}
              </span>
              <div style={{ height: 1, flex: 1, background: "var(--border-0)" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Stap 2: Typecheck**

```bash
pnpm --filter web tsc --noEmit
```

Verwacht: geen errors.

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/components/ti-studio/WerkitemTijdlijn.tsx
git commit -m "feat(memo): WerkitemTijdlijn component — chat + log gecombineerd"
```

---

## Task 8: MemoDrawer component

**Files:**
- Create: `apps/web/src/components/ti-studio/MemoDrawer.tsx`

- [ ] **Stap 1: Schrijf MemoDrawer.tsx**

```tsx
// apps/web/src/components/ti-studio/MemoDrawer.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { logger } from "@oranje-wit/types";
import {
  updateWerkitemInhoud,
  updateWerkitemStatus,
  verwijderWerkitem,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/werkitem-actions";
import { WerkitemTijdlijn } from "./WerkitemTijdlijn";
import type { TijdlijnToelichting, TijdlijnLog } from "@/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_BESPREKING: "In bespreking",
  OPGELOST: "Opgelost",
  GEACCEPTEERD_RISICO: "Risico geaccepteerd",
  GEARCHIVEERD: "Gearchiveerd",
};

const PRIORITEIT_LABELS: Record<string, string> = {
  BLOCKER: "Blocker",
  HOOG: "Hoog",
  MIDDEL: "Middel",
  LAAG: "Laag",
  INFO: "Info",
};

const ENTITEIT_BADGE: Record<string, { label: string; kleur: string; bg: string }> = {
  team:      { label: "Team",       kleur: "#60a5fa", bg: "rgba(96,165,250,.15)" },
  speler:    { label: "Speler",     kleur: "#ec4899", bg: "rgba(236,72,153,.15)" },
  doelgroep: { label: "Doelgroep",  kleur: "#a78bfa", bg: "rgba(167,139,250,.15)" },
  tc:        { label: "TC-algemeen",kleur: "#9ca3af", bg: "rgba(156,163,175,.12)" },
};

export interface DrawerWerkitem {
  id: string;
  beschrijving: string;
  status: string;
  prioriteit: string;
  resolutie: string | null;
  entiteitType: "team" | "speler" | "doelgroep" | "tc";
  entiteitNaam: string;
  toelichtingen: TijdlijnToelichting[];
  activiteiten: TijdlijnLog[];
}

interface MemoDrawerProps {
  werkitem: DrawerWerkitem | null;
  onSluiten: () => void;
  onVerwijderd: (id: string) => void;
  onBijgewerkt: (id: string, wijzigingen: Partial<DrawerWerkitem>) => void;
  huidigeGebruikerNaam: string;
}

export function MemoDrawer({
  werkitem,
  onSluiten,
  onVerwijderd,
  onBijgewerkt,
  huidigeGebruikerNaam,
}: MemoDrawerProps) {
  const [beschrijving, setBeschrijving] = useState("");
  const [status, setStatus] = useState("");
  const [prioriteit, setPrioriteit] = useState("");
  const [resolutie, setResolutie] = useState("");
  const [opslaan, setOpslaan] = useState(false);
  const [verwijderen, setVerwijderen] = useState(false);

  useEffect(() => {
    if (werkitem) {
      setBeschrijving(werkitem.beschrijving);
      setStatus(werkitem.status);
      setPrioriteit(werkitem.prioriteit);
      setResolutie(werkitem.resolutie ?? "");
    }
  }, [werkitem?.id]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onSluiten();
  }, [onSluiten]);

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  if (!werkitem) return null;

  const toonResolutie = status === "OPGELOST" || status === "GEACCEPTEERD_RISICO";
  const badge = ENTITEIT_BADGE[werkitem.entiteitType] ?? ENTITEIT_BADGE.tc;

  async function handleOpslaan() {
    if (!werkitem) return;
    setOpslaan(true);
    try {
      const [r1, r2] = await Promise.all([
        updateWerkitemInhoud(werkitem.id, { beschrijving, resolutie: toonResolutie ? resolutie : null }),
        status !== werkitem.status ? updateWerkitemStatus(werkitem.id, status) : Promise.resolve({ ok: true }),
      ]);
      if (r1.ok && (r2 as { ok: boolean }).ok) {
        onBijgewerkt(werkitem.id, { beschrijving, status, resolutie: toonResolutie ? resolutie : null });
      } else {
        logger.warn("MemoDrawer opslaan mislukt");
      }
    } catch (err) {
      logger.error("MemoDrawer handleOpslaan:", err);
    } finally {
      setOpslaan(false);
    }
  }

  async function handleVerwijder() {
    if (!werkitem) return;
    setVerwijderen(true);
    try {
      const result = await verwijderWerkitem(werkitem.id);
      if (result.ok) {
        onVerwijderd(werkitem.id);
        onSluiten();
      }
    } catch (err) {
      logger.error("MemoDrawer handleVerwijder:", err);
    } finally {
      setVerwijderen(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onSluiten}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 340, background: "var(--bg-1)",
          borderLeft: "1px solid var(--border-0)",
          zIndex: 201, display: "flex", flexDirection: "column",
          fontFamily: "Inter, system-ui, sans-serif",
          boxShadow: "-8px 0 32px rgba(0,0,0,.4)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid var(--border-0)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg-2)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
              background: badge.bg, color: badge.kleur,
            }}>
              {badge.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              {werkitem.entiteitNaam}
            </span>
          </div>
          <button
            onClick={onSluiten}
            style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Scrollbaar inhoud */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {/* Beschrijving */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-0)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-3)", marginBottom: 5 }}>
              Beschrijving
            </div>
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              rows={3}
              style={{
                width: "100%", background: "var(--bg-0)", border: "1px solid var(--border-0)",
                borderRadius: 6, color: "var(--text-1)", fontSize: 12, padding: "8px 10px",
                resize: "vertical", fontFamily: "Inter, system-ui, sans-serif",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Prioriteit + Status + Opslaan */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-0)", display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-3)", marginBottom: 5 }}>
                Prioriteit
              </div>
              <select
                value={prioriteit}
                onChange={(e) => setPrioriteit(e.target.value)}
                style={{
                  width: "100%", background: "var(--bg-0)", border: "1px solid var(--border-0)",
                  borderRadius: 6, color: "var(--text-1)", fontSize: 11, padding: "5px 8px",
                }}
              >
                {Object.entries(PRIORITEIT_LABELS).map(([v, l]) => (
                  <option key={v} value={v} style={{ background: "var(--bg-1)" }}>{l}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-3)", marginBottom: 5 }}>
                Status
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%", background: "var(--bg-0)", border: "1px solid var(--border-0)",
                  borderRadius: 6, color: "var(--text-1)", fontSize: 11, padding: "5px 8px",
                }}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v} style={{ background: "var(--bg-1)" }}>{l}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleOpslaan}
              disabled={opslaan}
              style={{
                background: opslaan ? "var(--bg-2)" : "var(--accent)",
                border: "none", borderRadius: 6, color: opslaan ? "var(--text-3)" : "#fff",
                fontSize: 11, fontWeight: 600, padding: "6px 12px",
                cursor: opslaan ? "not-allowed" : "pointer", flexShrink: 0,
              }}
            >
              {opslaan ? "..." : "Opslaan"}
            </button>
          </div>

          {/* Resolutie — conditioneel */}
          {toonResolutie && (
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-0)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-3)", marginBottom: 5 }}>
                Resolutie
              </div>
              <textarea
                value={resolutie}
                onChange={(e) => setResolutie(e.target.value)}
                placeholder="Hoe is dit opgelost?"
                rows={2}
                style={{
                  width: "100%", background: "var(--bg-0)", border: "1px solid var(--border-0)",
                  borderRadius: 6, color: "var(--text-1)", fontSize: 12, padding: "8px 10px",
                  resize: "none", fontFamily: "Inter, system-ui, sans-serif",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Tijdlijn */}
          <div style={{ padding: "12px 16px", flex: 1 }}>
            <WerkitemTijdlijn
              werkitemId={werkitem.id}
              initieleToelichtingen={werkitem.toelichtingen}
              initieleLog={werkitem.activiteiten}
              huidigeGebruikerNaam={huidigeGebruikerNaam}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-0)", flexShrink: 0 }}>
          <button
            onClick={handleVerwijder}
            disabled={verwijderen}
            style={{
              background: "none", border: "none",
              color: verwijderen ? "var(--text-3)" : "#6b7280",
              fontSize: 11, cursor: verwijderen ? "not-allowed" : "pointer",
            }}
          >
            {verwijderen ? "Verwijderen..." : "🗑 Verwijderen"}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Stap 2: Typecheck**

```bash
pnpm --filter web tsc --noEmit
```

Verwacht: geen errors.

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/components/ti-studio/MemoDrawer.tsx
git commit -m "feat(memo): MemoDrawer met beschrijving, status, resolutie en tijdlijn"
```

---

## Task 9: Kanban — filter-chips + drawer + data uitbreiden

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/KanbanBord.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/memo/page.tsx`

- [ ] **Stap 1: Breid KanbanWerkitem type uit in KanbanBord.tsx**

Vervang de bestaande `KanbanWerkitem` type-definitie:

```typescript
export type KanbanWerkitem = {
  id: string;
  status: string;
  prioriteit: string;
  beschrijving: string;
  volgorde: number;
  createdAt: string;
  teamId: string | null;
  spelerId: string | null;
  stafId: string | null;
  doelgroep: string | null;
  team: { naam: string; categorie: string } | null;
  speler: { roepnaam: string; achternaam: string } | null;
  staf: { naam: string } | null;
  resolutie: string | null;
  toelichtingen: Array<{ id: string; auteurNaam: string; auteurEmail: string; tekst: string; timestamp: string }>;
  activiteiten: Array<{ id: string; auteurNaam: string; auteurEmail: string; actie: string; detail: string | null; timestamp: string }>;
};
```

- [ ] **Stap 2: Voeg imports toe aan KanbanBord.tsx**

```typescript
import { useState, useCallback } from "react";
import { filterWerkitems, type FilterType } from "./kanban-filter";
import { MemoDrawer, type DrawerWerkitem } from "@/components/ti-studio/MemoDrawer";
import { useSession } from "next-auth/react";
```

- [ ] **Stap 3: Voeg state + helpers toe aan KanbanBord component**

Voeg toe na de bestaande `useState`-declaraties:

```typescript
  const [actieveFilter, setActieveFilter] = useState<FilterType>("alles");
  const [geselecteerdId, setGeselecteerdId] = useState<string | null>(null);
  const { data: session } = useSession();
  const gebruikerNaam = (session?.user?.name ?? session?.user?.email ?? "Onbekend") as string;
```

Voeg helper toe voor entiteit-afleiding:

```typescript
  function leidEntiteitAf(item: KanbanWerkitem): DrawerWerkitem["entiteitType"] {
    if (item.teamId) return "team";
    if (item.spelerId) return "speler";
    if (item.doelgroep && item.doelgroep !== "ALLE") return "doelgroep";
    return "tc";
  }

  function leidEntiteitNaamAf(item: KanbanWerkitem): string {
    if (item.team) return item.team.naam;
    if (item.speler) return `${item.speler.roepnaam} ${item.speler.achternaam}`;
    if (item.doelgroep && item.doelgroep !== "ALLE") {
      const LABELS: Record<string, string> = { KWEEKVIJVER: "Kweekvijver", ONTWIKKELHART: "Opleidingshart", TOP: "Topsport", WEDSTRIJDSPORT: "Wedstrijdsport", KORFBALPLEZIER: "Korfbalplezier" };
      return LABELS[item.doelgroep] ?? item.doelgroep;
    }
    return "TC — Algemeen";
  }

  const geselecteerdItem = items.find((i) => i.id === geselecteerdId) ?? null;
  const drawerWerkitem: DrawerWerkitem | null = geselecteerdItem
    ? {
        id: geselecteerdItem.id,
        beschrijving: geselecteerdItem.beschrijving,
        status: geselecteerdItem.status,
        prioriteit: geselecteerdItem.prioriteit,
        resolutie: geselecteerdItem.resolutie,
        entiteitType: leidEntiteitAf(geselecteerdItem),
        entiteitNaam: leidEntiteitNaamAf(geselecteerdItem),
        toelichtingen: geselecteerdItem.toelichtingen.map((t) => ({ ...t, type: "toelichting" as const })),
        activiteiten: geselecteerdItem.activiteiten.map((a) => ({ ...a, type: "log" as const })),
      }
    : null;
```

- [ ] **Stap 4: Voeg filter-chips toe aan de header**

Vervang de bestaande `{/* Header */}` sectie:

```tsx
      {/* Header + filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>
            Memo&apos;s
          </h2>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>{totaal} werkitems</span>
        </div>
        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["alles", "team", "speler", "doelgroep", "tc-algemeen"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setActieveFilter(f)}
              style={{
                background: actieveFilter === f ? "var(--accent-dim)" : "rgba(255,255,255,.04)",
                border: `1px solid ${actieveFilter === f ? "rgba(249,115,22,.4)" : "var(--border-0)"}`,
                borderRadius: 20,
                color: actieveFilter === f ? "var(--accent)" : "var(--text-3)",
                fontSize: 11,
                fontWeight: actieveFilter === f ? 600 : 400,
                padding: "3px 10px",
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {f === "alles" ? "Alles" : f === "team" ? "Team" : f === "speler" ? "Speler" : f === "doelgroep" ? "Doelgroep" : "TC-algemeen"}
            </button>
          ))}
        </div>
      </div>
```

- [ ] **Stap 5: Pas itemsPerStatus aan om filter toe te passen**

Vervang:

```typescript
  const itemsPerStatus = (status: string) =>
    items.filter((i) => i.status === status).sort((a, b) => a.volgorde - b.volgorde);
```

Door:

```typescript
  const gefilterdeItems = filterWerkitems(items, actieveFilter);
  const itemsPerStatus = (status: string) =>
    gefilterdeItems.filter((i) => i.status === status).sort((a, b) => a.volgorde - b.volgorde);
  const totaal = gefilterdeItems.length;
```

- [ ] **Stap 6: Voeg onClick toe aan KanbanKaart en MemoDrawer toe aan return**

In de `KanbanKolom`-component, voeg `onKaartKlik` prop toe en geef het door:

```typescript
  onKaartKlik: (id: string) => void;
```

In `KanbanBord` return, voeg `onKaartKlik={(id) => setGeselecteerdId(id)}` toe aan elke `KanbanKolom`.

In `KanbanKaart`, voeg `onClick` toe aan de wrapper-div:

```tsx
      onClick={() => onKaartKlik(item.id)}
      style={{ ..., cursor: "pointer" }}
```

Voeg onderaan de `KanbanBord` return (na het bord-div) toe:

```tsx
      <MemoDrawer
        werkitem={drawerWerkitem}
        onSluiten={() => setGeselecteerdId(null)}
        onVerwijderd={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        onBijgewerkt={(id, w) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...w } : i))}
        huidigeGebruikerNaam={gebruikerNaam}
      />
```

- [ ] **Stap 7: Breid memo/page.tsx query uit**

Vervang de `include` in `prisma.werkitem.findMany`:

```typescript
    include: {
      team: { select: { naam: true, categorie: true } },
      speler: { select: { roepnaam: true, achternaam: true } },
      staf: { select: { naam: true } },
      toelichtingen: { orderBy: { timestamp: "desc" } },
      activiteiten: { orderBy: { timestamp: "desc" } },
    },
```

Breid de serialisatie uit:

```typescript
  const geserialiseerd: KanbanWerkitem[] = werkitems.map((w) => ({
    id: w.id,
    status: String(w.status),
    prioriteit: String(w.prioriteit),
    beschrijving: w.beschrijving,
    volgorde: w.volgorde,
    createdAt: w.createdAt.toISOString(),
    teamId: w.teamId,
    spelerId: w.spelerId,
    stafId: w.stafId,
    doelgroep: w.doelgroep ? String(w.doelgroep) : null,
    team: w.team ? { naam: w.team.naam, categorie: String(w.team.categorie) } : null,
    speler: w.speler ? { roepnaam: w.speler.roepnaam, achternaam: w.speler.achternaam } : null,
    staf: w.staf ? { naam: w.staf.naam } : null,
    resolutie: w.resolutie ?? null,
    toelichtingen: w.toelichtingen.map((t) => ({
      id: t.id,
      auteurNaam: t.auteurNaam,
      auteurEmail: t.auteurEmail,
      tekst: t.tekst,
      timestamp: t.timestamp.toISOString(),
    })),
    activiteiten: w.activiteiten.map((a) => ({
      id: a.id,
      auteurNaam: a.auteurNaam,
      auteurEmail: a.auteurEmail,
      actie: String(a.actie),
      detail: a.detail ?? null,
      timestamp: a.timestamp.toISOString(),
    })),
  }));
```

- [ ] **Stap 8: Typecheck**

```bash
pnpm --filter web tsc --noEmit
```

Verwacht: geen errors.

- [ ] **Stap 9: Draai alle unit tests**

```bash
pnpm --filter web test --reporter=verbose
```

Verwacht: alle tests PASS.

- [ ] **Stap 10: Smoke test in browser**

Start `pnpm dev`, ga naar `http://localhost:3000/ti-studio/memo`. Verifieer:
- Filter-chips verschijnen bovenaan
- Klikken op "Team" toont alleen team-memo's
- Klikken op een kaart opent de drawer aan de rechterkant
- Drawer sluit bij Escape en bij klik op overlay
- Beschrijving en status zijn bewerkbaar
- Toelichting invoeren en verzenden verschijnt bovenaan de tijdlijn

- [ ] **Stap 11: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/memo/KanbanBord.tsx
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/memo/page.tsx
git commit -m "feat(kanban): filter-chips + detail-drawer + uitgebreide query"
```

---

## Zelfcontrole na schrijven

### Spec-dekking

| Spec-eis | Gedekt in |
|---|---|
| Ribbon-knop + badge | Task 3 |
| ▲ indicator TeamKaart | Task 4 |
| ▲ indicator TeamKaartSpelerRij | Task 4 |
| Kader TC-algemeen memo's | Task 5 |
| Kader doelgroep accordeons | Task 5 |
| Doelgroep-mapping schema→TC-term | Task 5 (DoelgroepMemoSectie) |
| WerkitemToelichting schema | Task 1 |
| WerkitemLog schema | Task 1 |
| LogActie enum | Task 1 |
| Filter-chips kanban | Task 9 |
| Kanban detail-drawer | Task 8 + 9 |
| Chat-tijdlijn (toelichtingen) | Task 7 |
| Systeem-events in tijdlijn | Task 7 |
| Nieuwste bericht bovenaan | Task 7 (`mergeTijdlijn` DESC sort) |
| Vaste tijdlijn-hoogte + scroll | Task 7 (220px height, overflow-y auto) |
| Resolutie-veld conditioneel | Task 8 |
| Optimistisch toevoegen toelichting | Task 7 |
| Verwijderen vanuit drawer | Task 8 |
