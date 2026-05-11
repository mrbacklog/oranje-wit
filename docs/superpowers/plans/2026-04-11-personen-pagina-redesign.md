# Personen-pagina Redesign — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De personen-pagina (spelers + staf tabs) ombouwen tot een rijke beheertabel die het verlengstuk is van de werkbord-drawers, inclusief nieuw Reserveringsspeler-entiteit.

**Architecture:** Nieuw `Reserveringsspeler` Prisma-model + migratie. Server actions uitbreiden voor pin-toggle, handmatig aanmaken (speler/reservering/staf). `SpelersOverzichtStudio` herontwerpen met uitgebreide filters en inline pin-toggle. Nieuwe `StafOverzicht` en `ReserveringenOverzicht` componenten. `SpelersPoolDrawer` uitgebreid met Reservering-sectie.

**Tech Stack:** Next.js 16 Server Components/Actions, Prisma, TypeScript, CSS variabelen (dark mode)

---

## File Map

**Aanmaken:**
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/NieuweSpelerDialog.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/NieuweReserveringDialog.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/NieuweStafDialog.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/StafOverzicht.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/ReserveringenOverzicht.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/reserveringen-actions.ts`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/staf-actions.ts`

**Aanpassen:**
- `packages/database/prisma/schema.prisma` — nieuw Reserveringsspeler model
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/actions.ts` — uitbreiden
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/SpelersOverzichtStudio.tsx` — redesign
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/SpelersOverzichtStudioWrapper.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/spelers/page.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/staf/page.tsx`
- `apps/web/src/components/ti-studio/werkbord/types.ts`
- `apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx`
- `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`

---

### Task 1: Prisma — Reserveringsspeler model + SPELER_GEPIND PinType

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] Lees het schema eerst om de juiste positie te vinden

```bash
grep -n "^model\|^enum" packages/database/prisma/schema.prisma | head -40
```

- [ ] Voeg `SPELER_GEPIND` toe aan het `PinType` enum (na de bestaande waarden)

Het huidige enum staat rond regel 711:

```prisma
enum PinType {
  SPELER_STATUS
  SPELER_POSITIE
  STAF_POSITIE
  SPELER_GEPIND   // ← nieuw: speler is gepind als favoriet in de drawers
}
```

- [ ] Voeg `Reserveringsspeler` model toe na het `Staf` model

```prisma
model Reserveringsspeler {
  id       String   @id @default(cuid())
  titel    String
  geslacht Geslacht
  teamId   String?

  team      Team?    @relation(fields: [teamId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("reserveringsspelers")
}
```

- [ ] Voeg de inverse relatie toe aan het `Team` model (zoek de `Team` model relaties-sectie)

```prisma
// Voeg toe aan model Team relaties:
reserveringen  Reserveringsspeler[]
```

- [ ] Draai de migratie

```bash
pnpm db:migrate
# Geef migratie naam: reserveringsspeler_en_speler_gepind
pnpm db:generate
```

- [ ] Commit

```bash
git add packages/database/prisma/
git commit -m "feat(db): voeg Reserveringsspeler model + SPELER_GEPIND PinType toe"
```

---

### Task 2: Actions — getSpelersVoorStudio uitbreiden

Voeg `gepind` en `heeftActiefMemo` toe aan `StudioSpeler`.

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/actions.ts`

- [ ] Lees het bestand

```bash
cat -n apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/actions.ts
```

- [ ] Voeg twee extra queries toe aan de bestaande `Promise.all` in `getSpelersVoorStudio`

De huidige Promise.all heeft 3 queries. Voeg toe als 4e en 5e:

```typescript
// 4e: gepinde spelers voor dit kaders
prisma.pin.findMany({
  where: { kadersId: kaders.id, spelerId: { not: null }, type: "SPELER_GEPIND" },
  select: { spelerId: true },
}),

// 5e: actieve werkitems op spelers
prisma.werkitem.findMany({
  where: {
    spelerId: { not: null },
    status: { notIn: ["GEARCHIVEERD"] },
  },
  select: { spelerId: true },
}),
```

Verander destructuring naar:

```typescript
const [kadersSpelers, spelers, werkindeling, pins, actieveWerkitems] = await Promise.all([...]);
```

- [ ] Voeg na `const gezienMap` toe:

```typescript
const gepindSet = new Set(pins.map((p) => p.spelerId).filter(Boolean) as string[]);
const memoSet = new Set(actieveWerkitems.map((w) => w.spelerId).filter(Boolean) as string[]);
```

- [ ] Voeg toe aan de return mapping (na `huidigIndelingTeam`):

```typescript
gepind: gepindSet.has(s.id),
heeftActiefMemo: memoSet.has(s.id),
```

- [ ] Draai typecheck

```bash
pnpm typecheck 2>&1 | grep "personen/actions" | head -10
```

- [ ] Commit

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/actions.ts
git commit -m "feat(personen): voeg gepind + heeftActiefMemo toe aan StudioSpeler"
```

---

### Task 3: Actions — togglePinSpeler + maakHandmatigeSpelerAan

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/actions.ts`

- [ ] Voeg imports toe bovenaan (na bestaande imports):

```typescript
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";
```

- [ ] Voeg `togglePinSpeler` toe onderaan `actions.ts`

```typescript
export async function togglePinSpeler(
  spelerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireTC();
    const kaders = await prisma.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: { id: true },
    });
    if (!kaders) return { ok: false, error: "Geen actief werkseizoen" };

    const bestaandePin = await prisma.pin.findFirst({
      where: { kadersId: kaders.id, spelerId, type: "SPELER_GEPIND" },
    });

    if (bestaandePin) {
      await prisma.pin.delete({ where: { id: bestaandePin.id } });
    } else {
      const email = session.user!.email!;
      const naam = session.user!.name ?? email;
      const user = await prisma.user.upsert({
        where: { email },
        create: { email, naam, rol: "EDITOR" },
        update: { naam },
        select: { id: true },
      });
      await prisma.pin.create({
        data: {
          kadersId: kaders.id,
          spelerId,
          type: "SPELER_GEPIND",
          waarde: {},
          gepindDoorId: user.id,
        },
      });
    }

    revalidatePath("/ti-studio/personen/spelers");
    revalidatePath("/ti-studio/indeling");
    return { ok: true };
  } catch (err) {
    logger.warn("togglePinSpeler mislukt:", err);
    return { ok: false, error: "Kon pin niet togglen" };
  }
}
```

- [ ] Voeg `maakHandmatigeSpelerAan` toe onderaan `actions.ts`

```typescript
export async function maakHandmatigeSpelerAan(data: {
  roepnaam: string;
  achternaam: string;
  geslacht: "M" | "V";
  geboortedatum: string; // "YYYY-MM-DD"
  status?: string;
  notitie?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    const kaders = await prisma.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: { id: true },
    });
    if (!kaders) return { ok: false, error: "Geen actief werkseizoen" };

    const handmatigeId = `HANDMATIG-${crypto.randomUUID().replace(/-/g, "")}`;
    const geboortejaar = new Date(data.geboortedatum).getFullYear();

    await prisma.$transaction([
      prisma.speler.create({
        data: {
          id: handmatigeId,
          roepnaam: data.roepnaam,
          achternaam: data.achternaam,
          geslacht: data.geslacht,
          geboortedatum: new Date(data.geboortedatum),
          geboortejaar,
          status: (data.status as "NIEUW_POTENTIEEL") ?? "NIEUW_POTENTIEEL",
        },
      }),
      prisma.kadersSpeler.create({
        data: {
          kadersId: kaders.id,
          spelerId: handmatigeId,
          notitie: data.notitie ?? null,
        },
      }),
    ]);

    revalidatePath("/ti-studio/personen/spelers");
    return { ok: true };
  } catch (err) {
    logger.warn("maakHandmatigeSpelerAan mislukt:", err);
    return { ok: false, error: "Kon speler niet aanmaken" };
  }
}
```

- [ ] Commit

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/actions.ts
git commit -m "feat(personen): togglePinSpeler + maakHandmatigeSpelerAan actions"
```

---

### Task 4: Actions — reserveringen-actions.ts

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/reserveringen-actions.ts`

- [ ] Maak het bestand aan

```typescript
"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";

export async function getReserveringenVoorStudio() {
  await requireTC();
  return prisma.reserveringsspeler.findMany({
    select: {
      id: true,
      titel: true,
      geslacht: true,
      teamId: true,
      team: { select: { naam: true, kleur: true } },
    },
    orderBy: { titel: "asc" },
  });
}

export type StudioReservering = Awaited<ReturnType<typeof getReserveringenVoorStudio>>[number];

export async function maakReserveringAan(data: {
  titel: string;
  geslacht: "M" | "V";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    await prisma.reserveringsspeler.create({
      data: { titel: data.titel, geslacht: data.geslacht },
    });
    revalidatePath("/ti-studio/personen/spelers");
    return { ok: true };
  } catch (err) {
    logger.warn("maakReserveringAan mislukt:", err);
    return { ok: false, error: "Kon reservering niet aanmaken" };
  }
}
```

- [ ] Commit

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/reserveringen-actions.ts
git commit -m "feat(personen): reserveringen server actions"
```

---

### Task 5: Actions — staf-actions.ts

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/staf-actions.ts`

- [ ] Maak het bestand aan

```typescript
"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@oranje-wit/auth/checks";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";

export async function getStafVoorStudio() {
  await requireTC();

  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });

  const [stafLeden, teamStafKoppelingen, pins] = await Promise.all([
    prisma.staf.findMany({
      select: { id: true, naam: true, rollen: true, geboortejaar: true },
      orderBy: { naam: "asc" },
    }),
    prisma.teamStaf.findMany({
      select: {
        stafId: true,
        rol: true,
        team: { select: { id: true, naam: true, kleur: true } },
      },
    }),
    kaders
      ? prisma.pin.findMany({
          where: { kadersId: kaders.id, stafId: { not: null } },
          select: { stafId: true },
        })
      : Promise.resolve([]),
  ]);

  const gepindSet = new Set(pins.map((p) => p.stafId).filter(Boolean) as string[]);

  const teamMap = new Map<
    string,
    { teamId: string; teamNaam: string; kleur: string; rol: string }[]
  >();
  for (const k of teamStafKoppelingen) {
    const bestaande = teamMap.get(k.stafId) ?? [];
    bestaande.push({
      teamId: k.team.id,
      teamNaam: k.team.naam,
      kleur: k.team.kleur ?? "senior",
      rol: k.rol,
    });
    teamMap.set(k.stafId, bestaande);
  }

  return stafLeden.map((s) => ({
    id: s.id,
    naam: s.naam,
    rollen: s.rollen as string[],
    geboortejaar: s.geboortejaar as number | null,
    gepind: gepindSet.has(s.id),
    teams: teamMap.get(s.id) ?? [],
  }));
}

export type StudioStaf = Awaited<ReturnType<typeof getStafVoorStudio>>[number];

export async function maakStafAan(data: {
  naam: string;
  rollen?: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireTC();
    const stafId = `STAF-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    await prisma.staf.create({
      data: { id: stafId, naam: data.naam, rollen: data.rollen ?? [] },
    });
    revalidatePath("/ti-studio/personen/staf");
    return { ok: true };
  } catch (err) {
    logger.warn("maakStafAan mislukt:", err);
    return { ok: false, error: "Kon staflid niet aanmaken" };
  }
}
```

- [ ] Commit

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/staf-actions.ts
git commit -m "feat(personen): staf server actions"
```

---

### Task 6: UI — SpelersOverzichtStudio redesign

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/SpelersOverzichtStudio.tsx`

- [ ] Vervang het volledige bestand

```typescript
"use client";

import { useState, useMemo, useTransition } from "react";
import type { StudioSpeler } from "../actions";
import { togglePinSpeler } from "../actions";

type SortKey =
  | "achternaam"
  | "geboortejaar"
  | "status"
  | "gezienStatus"
  | "huidigTeam"
  | "indeling"
  | "memo"
  | "gepind";
type SortDir = "asc" | "desc";
type StatusFilter =
  | "allen"
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GAAT_STOPPEN"
  | "NIEUW"
  | "ALGEMEEN_RESERVE";

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GAAT_STOPPEN: "Gaat stoppen",
  NIEUW_POTENTIEEL: "Nieuw",
  NIEUW_DEFINITIEF: "Nieuw",
  ALGEMEEN_RESERVE: "Reserve",
};

const STATUS_DOT: Record<string, string> = {
  BESCHIKBAAR: "#22c55e",
  TWIJFELT: "#f59e0b",
  GAAT_STOPPEN: "#ef4444",
  NIEUW_POTENTIEEL: "#3b82f6",
  NIEUW_DEFINITIEF: "#3b82f6",
  ALGEMEEN_RESERVE: "#6b7280",
};

const GEZIEN_DOT: Record<string, string> = {
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
  ONGEZIEN: "#4b5563",
};

const KLEUR_DOT: Record<string, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};

function matchesStatusFilter(speler: StudioSpeler, filter: StatusFilter): boolean {
  if (filter === "allen") return true;
  if (filter === "NIEUW")
    return speler.status === "NIEUW_POTENTIEEL" || speler.status === "NIEUW_DEFINITIEF";
  return speler.status === filter;
}

interface Props {
  spelers: StudioSpeler[];
  onRowClick: (spelerId: string) => void;
}

export default function SpelersOverzichtStudio({ spelers, onRowClick }: Props) {
  const [zoekterm, setZoekterm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("allen");
  const [huidigTeamFilter, setHuidigTeamFilter] = useState("allen");
  const [indelingFilter, setIndelingFilter] = useState("allen");
  const [memoFilter, setMemoFilter] = useState(false);
  const [gepindFilter, setGepindFilter] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("achternaam");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [, startTransition] = useTransition();

  const huidigeTeams = useMemo(
    () =>
      [...new Set(spelers.map((s) => s.huidigTeamNaam).filter(Boolean))].sort() as string[],
    [spelers]
  );
  const indelingTeams = useMemo(
    () =>
      [
        ...new Set(spelers.map((s) => s.huidigIndelingTeam?.naam).filter(Boolean)),
      ].sort() as string[],
    [spelers]
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handlePinToggle(e: React.MouseEvent, spelerId: string) {
    e.stopPropagation();
    startTransition(async () => {
      await togglePinSpeler(spelerId);
    });
  }

  const gefilterd = useMemo(() => {
    let result = spelers;
    if (zoekterm.trim()) {
      const q = zoekterm.trim().toLowerCase();
      result = result.filter(
        (s) => s.roepnaam.toLowerCase().includes(q) || s.achternaam.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "allen") result = result.filter((s) => matchesStatusFilter(s, statusFilter));
    if (huidigTeamFilter !== "allen")
      result = result.filter((s) => s.huidigTeamNaam === huidigTeamFilter);
    if (indelingFilter !== "allen")
      result = result.filter((s) => s.huidigIndelingTeam?.naam === indelingFilter);
    if (memoFilter) result = result.filter((s) => s.heeftActiefMemo);
    if (gepindFilter) result = result.filter((s) => s.gepind);

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "achternaam":
          cmp = a.achternaam.localeCompare(b.achternaam, "nl");
          break;
        case "geboortejaar":
          cmp = (a.geboortejaar ?? 0) - (b.geboortejaar ?? 0);
          break;
        case "status":
          cmp = (a.status ?? "").localeCompare(b.status ?? "", "nl");
          break;
        case "gezienStatus": {
          const v = ["ROOD", "ORANJE", "GEEL", "GROEN", "ONGEZIEN"];
          cmp = v.indexOf(a.gezienStatus) - v.indexOf(b.gezienStatus);
          break;
        }
        case "huidigTeam":
          cmp = (a.huidigTeamNaam ?? "zzz").localeCompare(b.huidigTeamNaam ?? "zzz", "nl");
          break;
        case "indeling":
          cmp = (a.huidigIndelingTeam?.naam ?? "zzz").localeCompare(
            b.huidigIndelingTeam?.naam ?? "zzz",
            "nl"
          );
          break;
        case "memo":
          cmp = Number(b.heeftActiefMemo) - Number(a.heeftActiefMemo);
          break;
        case "gepind":
          cmp = Number(b.gepind) - Number(a.gepind);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [
    spelers,
    zoekterm,
    statusFilter,
    huidigTeamFilter,
    indelingFilter,
    memoFilter,
    gepindFilter,
    sortKey,
    sortDir,
  ]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <span style={{ opacity: 0.3, fontSize: "0.65rem" }}> ↕</span>;
    return (
      <span style={{ fontSize: "0.65rem", color: "var(--ow-oranje-500)" }}>
        {" "}
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  const chipStyle = (actief: boolean): React.CSSProperties => ({
    padding: "0.25rem 0.625rem",
    borderRadius: 99,
    border: actief ? "1px solid var(--ow-oranje-500)" : "1px solid var(--border-default)",
    background: actief ? "rgba(255,107,0,0.12)" : "var(--surface-card)",
    color: actief ? "var(--ow-oranje-500)" : "var(--text-secondary)",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  const dropdownStyle: React.CSSProperties = {
    background: "var(--surface-sunken)",
    border: "1px solid var(--border-default)",
    borderRadius: 8,
    padding: "0.375rem 0.625rem",
    color: "var(--text-primary)",
    fontSize: "0.8125rem",
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const thStyle = (sortable: boolean): React.CSSProperties => ({
    padding: "0.625rem 0.875rem",
    textAlign: "left",
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--text-secondary)",
    cursor: sortable ? "pointer" : "default",
    userSelect: "none",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Filterbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Zoek op naam..."
          value={zoekterm}
          onChange={(e) => setZoekterm(e.target.value)}
          style={{
            background: "var(--surface-sunken)",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
            padding: "0.375rem 0.75rem",
            color: "var(--text-primary)",
            fontSize: "0.875rem",
            outline: "none",
            width: 200,
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {(
            [
              { value: "allen", label: "Allen" },
              { value: "BESCHIKBAAR", label: "Beschikbaar" },
              { value: "TWIJFELT", label: "Twijfelt" },
              { value: "GAAT_STOPPEN", label: "Gaat stoppen" },
              { value: "NIEUW", label: "Nieuw" },
              { value: "ALGEMEEN_RESERVE", label: "Reserve" },
            ] as const
          ).map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)} style={chipStyle(statusFilter === value)}>
              {label}
            </button>
          ))}
        </div>
        <select value={huidigTeamFilter} onChange={(e) => setHuidigTeamFilter(e.target.value)} style={dropdownStyle}>
          <option value="allen">Huidig team: Allen</option>
          {huidigeTeams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={indelingFilter} onChange={(e) => setIndelingFilter(e.target.value)} style={dropdownStyle}>
          <option value="allen">Indeling: Allen</option>
          {indelingTeams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => setMemoFilter((v) => !v)} style={chipStyle(memoFilter)}>▲ Memo</button>
        <button onClick={() => setGepindFilter((v) => !v)} style={chipStyle(gepindFilter)}>📌 Gepind</button>
        <span style={{ marginLeft: "auto", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          {gefilterd.length} speler{gefilterd.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabel */}
      <div
        style={{
          background: "var(--surface-card)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border-default)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th onClick={() => handleSort("achternaam")} style={thStyle(true)}>Naam<SortIcon col="achternaam" /></th>
              <th onClick={() => handleSort("geboortejaar")} style={thStyle(true)}>Jaar<SortIcon col="geboortejaar" /></th>
              <th onClick={() => handleSort("status")} style={thStyle(true)}>Status<SortIcon col="status" /></th>
              <th onClick={() => handleSort("gezienStatus")} style={thStyle(true)}>Gezien<SortIcon col="gezienStatus" /></th>
              <th onClick={() => handleSort("huidigTeam")} style={thStyle(true)}>Huidig team<SortIcon col="huidigTeam" /></th>
              <th onClick={() => handleSort("indeling")} style={thStyle(true)}>Indeling<SortIcon col="indeling" /></th>
              <th onClick={() => handleSort("gepind")} style={{ ...thStyle(true), textAlign: "center" }}>📌<SortIcon col="gepind" /></th>
              <th onClick={() => handleSort("memo")} style={{ ...thStyle(true), textAlign: "center" }}>▲<SortIcon col="memo" /></th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  Geen spelers gevonden
                </td>
              </tr>
            )}
            {gefilterd.map((speler, i) => {
              const init = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();
              const geslachtKleur = speler.geslacht === "V" ? "#f9a8d4" : "#93c5fd";
              const geslachtBg = speler.geslacht === "V" ? "rgba(236,72,153,0.15)" : "rgba(59,130,246,0.15)";
              const statusDot = STATUS_DOT[speler.status] ?? "#6b7280";
              const gezienDot = GEZIEN_DOT[speler.gezienStatus] ?? "#4b5563";
              const huidigKleur = KLEUR_DOT[speler.huidigTeamKleur?.toLowerCase() ?? ""] ?? "#6b7280";
              const indelingKleur = KLEUR_DOT[speler.huidigIndelingTeam?.kleur?.toLowerCase() ?? ""] ?? "#6b7280";

              return (
                <tr
                  key={speler.id}
                  onClick={() => onRowClick(speler.id)}
                  style={{
                    borderBottom: i < gefilterd.length - 1 ? "1px solid var(--border-default)" : "none",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface-raised)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: geslachtBg, border: `1.5px solid ${geslachtKleur}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 800, color: geslachtKleur, flexShrink: 0 }}>
                        {init}
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {speler.roepnaam} {speler.achternaam}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                      {speler.geboortejaar} · {new Date().getFullYear() - speler.geboortejaar}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDot, flexShrink: 0 }} />
                      {STATUS_LABELS[speler.status] ?? speler.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: gezienDot, display: "inline-block" }} />
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    {speler.huidigTeamNaam ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "var(--surface-raised)", border: "1px solid var(--border-default)", borderRadius: 6, padding: "0.2rem 0.5rem", fontSize: "0.75rem", color: "var(--text-primary)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: huidigKleur }} />
                        {speler.huidigTeamNaam}
                      </span>
                    ) : <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>—</span>}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    {speler.huidigIndelingTeam ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, padding: "0.2rem 0.5rem", fontSize: "0.75rem", color: "#4ade80", fontWeight: 500 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: indelingKleur }} />
                        {speler.huidigIndelingTeam.naam}
                      </span>
                    ) : <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>—</span>}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", textAlign: "center" }}>
                    <button
                      onClick={(e) => handlePinToggle(e, speler.id)}
                      title={speler.gepind ? "Ontpinnen" : "Pinnen"}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", opacity: speler.gepind ? 1 : 0.2, transition: "opacity 0.15s" }}
                    >
                      📌
                    </button>
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", textAlign: "center" }}>
                    {speler.heeftActiefMemo && (
                      <span style={{ fontSize: "0.75rem", color: "var(--ow-oranje-500)", fontWeight: 700 }}>▲</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] Commit

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/_components/SpelersOverzichtStudio.tsx
git commit -m "feat(personen): SpelersOverzichtStudio redesign — uitgebreide filters + inline pin"
```

---

### Task 7: UI — Dialogen (NieuweSpelerDialog + NieuweReserveringDialog + NieuweStafDialog)

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/NieuweSpelerDialog.tsx`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/NieuweReserveringDialog.tsx`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/NieuweStafDialog.tsx`

- [ ] Maak `NieuweSpelerDialog.tsx` aan

```typescript
"use client";

import { useState, useTransition } from "react";
import { maakHandmatigeSpelerAan } from "../actions";

interface Props {
  open: boolean;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-1)",
  borderRadius: 7,
  color: "var(--text-1)",
  fontSize: 13,
  padding: "7px 10px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
  display: "block",
};

export function NieuweSpelerDialog({ open, onClose }: Props) {
  const [roepnaam, setRoepnaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [geslacht, setGeslacht] = useState<"M" | "V">("M");
  const [geboortedatum, setGeboortedatum] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setRoepnaam(""); setAchternaam(""); setGeslacht("M"); setGeboortedatum(""); setFout(null);
  }

  function handleSluiten() { reset(); onClose(); }

  function handleAanmaken() {
    if (!roepnaam.trim() || !achternaam.trim() || !geboortedatum) {
      setFout("Vul alle verplichte velden in.");
      return;
    }
    setFout(null);
    startTransition(async () => {
      const result = await maakHandmatigeSpelerAan({
        roepnaam: roepnaam.trim(),
        achternaam: achternaam.trim(),
        geslacht,
        geboortedatum,
      });
      if (result.ok) { reset(); onClose(); }
      else setFout(result.error);
    });
  }

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={handleSluiten}
    >
      <div
        style={{ background: "var(--bg-1)", border: "1px solid var(--border-0)", borderRadius: 12, padding: 24, width: 360, display: "flex", flexDirection: "column", gap: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Nieuwe speler aanmaken</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Roepnaam *</label>
            <input value={roepnaam} onChange={(e) => setRoepnaam(e.target.value)} style={inputStyle} placeholder="Jan" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Achternaam *</label>
            <input value={achternaam} onChange={(e) => setAchternaam(e.target.value)} style={inputStyle} placeholder="de Vries" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Geslacht *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["M", "V"] as const).map((g) => (
              <button key={g} onClick={() => setGeslacht(g)} style={{ flex: 1, padding: "8px", borderRadius: 7, border: geslacht === g ? "1.5px solid var(--accent)" : "1px solid var(--border-1)", background: geslacht === g ? "var(--accent-dim)" : "var(--bg-2)", color: geslacht === g ? "var(--accent)" : "var(--text-2)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {g === "M" ? "Man" : "Vrouw"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Geboortedatum *</label>
          <input type="date" value={geboortedatum} onChange={(e) => setGeboortedatum(e.target.value)} style={inputStyle} />
        </div>
        {fout && <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,.1)", borderRadius: 6, padding: "8px 12px" }}>{fout}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSluiten} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "1px solid var(--border-1)", background: "var(--bg-2)", color: "var(--text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Annuleren</button>
          <button onClick={handleAanmaken} disabled={isPending} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", background: isPending ? "var(--bg-3)" : "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: isPending ? "default" : "pointer", fontFamily: "inherit" }}>
            {isPending ? "Aanmaken..." : "Aanmaken"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] Maak `NieuweReserveringDialog.tsx` aan

```typescript
"use client";

import { useState, useTransition } from "react";
import { maakReserveringAan } from "../reserveringen-actions";

interface Props { open: boolean; onClose: () => void; }

const inputStyle: React.CSSProperties = { background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 7, color: "var(--text-1)", fontSize: 13, padding: "7px 10px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };

export function NieuweReserveringDialog({ open, onClose }: Props) {
  const [titel, setTitel] = useState("");
  const [geslacht, setGeslacht] = useState<"M" | "V">("M");
  const [fout, setFout] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() { setTitel(""); setGeslacht("M"); setFout(null); }
  function handleSluiten() { reset(); onClose(); }
  function handleAanmaken() {
    if (!titel.trim()) { setFout("Vul een titel in."); return; }
    setFout(null);
    startTransition(async () => {
      const result = await maakReserveringAan({ titel: titel.trim(), geslacht });
      if (result.ok) { reset(); onClose(); }
      else setFout(result.error);
    });
  }

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleSluiten}>
      <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-0)", borderRadius: 12, padding: 24, width: 320, display: "flex", flexDirection: "column", gap: 16 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Nieuwe reservering</div>
        <div>
          <label style={labelStyle}>Titel *</label>
          <input value={titel} onChange={(e) => setTitel(e.target.value)} style={inputStyle} placeholder="Meisje reserve" />
        </div>
        <div>
          <label style={labelStyle}>Geslacht *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["M", "V"] as const).map((g) => (
              <button key={g} onClick={() => setGeslacht(g)} style={{ flex: 1, padding: "8px", borderRadius: 7, border: geslacht === g ? "1.5px solid var(--accent)" : "1px solid var(--border-1)", background: geslacht === g ? "var(--accent-dim)" : "var(--bg-2)", color: geslacht === g ? "var(--accent)" : "var(--text-2)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {g === "M" ? "Man" : "Vrouw"}
              </button>
            ))}
          </div>
        </div>
        {fout && <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,.1)", borderRadius: 6, padding: "8px 12px" }}>{fout}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSluiten} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "1px solid var(--border-1)", background: "var(--bg-2)", color: "var(--text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Annuleren</button>
          <button onClick={handleAanmaken} disabled={isPending} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", background: isPending ? "var(--bg-3)" : "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: isPending ? "default" : "pointer", fontFamily: "inherit" }}>
            {isPending ? "Aanmaken..." : "Aanmaken"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] Maak `NieuweStafDialog.tsx` aan

```typescript
"use client";

import { useState, useTransition } from "react";
import { maakStafAan } from "../staf-actions";

interface Props { open: boolean; onClose: () => void; }

const inputStyle: React.CSSProperties = { background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 7, color: "var(--text-1)", fontSize: 13, padding: "7px 10px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };

export function NieuweStafDialog({ open, onClose }: Props) {
  const [naam, setNaam] = useState("");
  const [rollenTekst, setRollenTekst] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() { setNaam(""); setRollenTekst(""); setFout(null); }
  function handleSluiten() { reset(); onClose(); }
  function handleAanmaken() {
    if (!naam.trim()) { setFout("Vul een naam in."); return; }
    setFout(null);
    const rollen = rollenTekst.split(",").map((r) => r.trim()).filter(Boolean);
    startTransition(async () => {
      const result = await maakStafAan({ naam: naam.trim(), rollen });
      if (result.ok) { reset(); onClose(); }
      else setFout(result.error);
    });
  }

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleSluiten}>
      <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-0)", borderRadius: 12, padding: 24, width: 340, display: "flex", flexDirection: "column", gap: 16 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Nieuw staflid aanmaken</div>
        <div>
          <label style={labelStyle}>Naam *</label>
          <input value={naam} onChange={(e) => setNaam(e.target.value)} style={inputStyle} placeholder="Piet Trainer" />
        </div>
        <div>
          <label style={labelStyle}>Rollen (komma-gescheiden, optioneel)</label>
          <input value={rollenTekst} onChange={(e) => setRollenTekst(e.target.value)} style={inputStyle} placeholder="Trainer, Assistent" />
        </div>
        {fout && <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,.1)", borderRadius: 6, padding: "8px 12px" }}>{fout}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSluiten} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "1px solid var(--border-1)", background: "var(--bg-2)", color: "var(--text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Annuleren</button>
          <button onClick={handleAanmaken} disabled={isPending} style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", background: isPending ? "var(--bg-3)" : "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: isPending ? "default" : "pointer", fontFamily: "inherit" }}>
            {isPending ? "Aanmaken..." : "Aanmaken"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] Commit

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/_components/
git commit -m "feat(personen): NieuweSpelerDialog + NieuweReserveringDialog + NieuweStafDialog"
```

---

### Task 8: UI — ReserveringenOverzicht + StafOverzicht

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/ReserveringenOverzicht.tsx`
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/StafOverzicht.tsx`

- [ ] Maak `ReserveringenOverzicht.tsx` aan

```typescript
"use client";

import { useState } from "react";
import type { StudioReservering } from "../reserveringen-actions";
import { NieuweReserveringDialog } from "./NieuweReserveringDialog";

const KLEUR_DOT: Record<string, string> = {
  blauw: "#3b82f6", groen: "#22c55e", geel: "#eab308",
  oranje: "#f97316", rood: "#ef4444", senior: "#94a3b8",
};

interface Props { reserveringen: StudioReservering[]; }

export function ReserveringenOverzicht({ reserveringen }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortKey, setSortKey] = useState<"titel" | "indeling">("titel");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(key: "titel" | "indeling") {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const gesorteerd = [...reserveringen].sort((a, b) => {
    const cmp = sortKey === "titel"
      ? a.titel.localeCompare(b.titel, "nl")
      : (a.team?.naam ?? "zzz").localeCompare(b.team?.naam ?? "zzz", "nl");
    return sortDir === "asc" ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: "titel" | "indeling" }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, fontSize: "0.65rem" }}> ↕</span>;
    return <span style={{ fontSize: "0.65rem", color: "var(--ow-oranje-500)" }}> {sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const thStyle: React.CSSProperties = { padding: "0.625rem 0.875rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-secondary)" }}>
          Reserveringen ({reserveringen.length})
        </span>
        <button onClick={() => setDialogOpen(true)} style={{ padding: "0.375rem 0.75rem", borderRadius: 7, border: "none", background: "var(--accent)", color: "#fff", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Nieuwe reservering
        </button>
      </div>
      <div style={{ background: "var(--surface-card)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-default)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th onClick={() => handleSort("titel")} style={thStyle}>Titel<SortIcon col="titel" /></th>
              <th style={{ ...thStyle, cursor: "default" }}>Geslacht</th>
              <th onClick={() => handleSort("indeling")} style={thStyle}>Indeling<SortIcon col="indeling" /></th>
            </tr>
          </thead>
          <tbody>
            {gesorteerd.length === 0 && (
              <tr><td colSpan={3} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Geen reserveringen aangemaakt</td></tr>
            )}
            {gesorteerd.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: i < gesorteerd.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                <td style={{ padding: "0.625rem 0.875rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{r.titel}</td>
                <td style={{ padding: "0.625rem 0.875rem" }}>
                  <span style={{ fontSize: "0.75rem", padding: "0.1rem 0.4rem", borderRadius: 99, background: r.geslacht === "V" ? "rgba(236,72,153,0.15)" : "rgba(59,130,246,0.15)", color: r.geslacht === "V" ? "#f9a8d4" : "#93c5fd", fontWeight: 700 }}>
                    {r.geslacht === "V" ? "♀" : "♂"}
                  </span>
                </td>
                <td style={{ padding: "0.625rem 0.875rem" }}>
                  {r.team ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, padding: "0.2rem 0.5rem", fontSize: "0.75rem", color: "#4ade80", fontWeight: 500 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: KLEUR_DOT[r.team.kleur?.toLowerCase() ?? ""] ?? "#6b7280" }} />
                      {r.team.naam}
                    </span>
                  ) : <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NieuweReserveringDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
```

- [ ] Maak `StafOverzicht.tsx` aan

```typescript
"use client";

import { useState, useMemo } from "react";
import type { StudioStaf } from "../staf-actions";
import { NieuweStafDialog } from "./NieuweStafDialog";

const KLEUR_DOT: Record<string, string> = {
  blauw: "#3b82f6", groen: "#22c55e", geel: "#eab308",
  oranje: "#f97316", rood: "#ef4444", senior: "#94a3b8",
};

interface Props { stafLeden: StudioStaf[]; }

export function StafOverzicht({ stafLeden }: Props) {
  const [zoekterm, setZoekterm] = useState("");
  const [teamFilter, setTeamFilter] = useState("allen");
  const [rolFilter, setRolFilter] = useState("allen");
  const [gepindFilter, setGepindFilter] = useState(false);
  const [sortKey, setSortKey] = useState<"naam" | "teams" | "gepind">("naam");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);

  const alleTeams = useMemo(
    () => [...new Set(stafLeden.flatMap((s) => s.teams.map((t) => t.teamNaam)))].sort(),
    [stafLeden]
  );
  const alleRollen = useMemo(
    () => [...new Set(stafLeden.flatMap((s) => s.rollen))].sort(),
    [stafLeden]
  );

  function handleSort(key: "naam" | "teams" | "gepind") {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const gefilterd = useMemo(() => {
    let result = stafLeden;
    if (zoekterm.trim()) {
      const q = zoekterm.trim().toLowerCase();
      result = result.filter((s) => s.naam.toLowerCase().includes(q));
    }
    if (teamFilter !== "allen") result = result.filter((s) => s.teams.some((t) => t.teamNaam === teamFilter));
    if (rolFilter !== "allen") result = result.filter((s) => s.rollen.includes(rolFilter));
    if (gepindFilter) result = result.filter((s) => s.gepind);
    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "naam": cmp = a.naam.localeCompare(b.naam, "nl"); break;
        case "teams": cmp = (a.teams[0]?.teamNaam ?? "zzz").localeCompare(b.teams[0]?.teamNaam ?? "zzz", "nl"); break;
        case "gepind": cmp = Number(b.gepind) - Number(a.gepind); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [stafLeden, zoekterm, teamFilter, rolFilter, gepindFilter, sortKey, sortDir]);

  function SortIcon({ col }: { col: "naam" | "teams" | "gepind" }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, fontSize: "0.65rem" }}> ↕</span>;
    return <span style={{ fontSize: "0.65rem", color: "var(--ow-oranje-500)" }}> {sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const chipStyle = (actief: boolean): React.CSSProperties => ({ padding: "0.25rem 0.625rem", borderRadius: 99, border: actief ? "1px solid var(--ow-oranje-500)" : "1px solid var(--border-default)", background: actief ? "rgba(255,107,0,0.12)" : "var(--surface-card)", color: actief ? "var(--ow-oranje-500)" : "var(--text-secondary)", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" });
  const dropdownStyle: React.CSSProperties = { background: "var(--surface-sunken)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "0.375rem 0.625rem", color: "var(--text-primary)", fontSize: "0.8125rem", outline: "none", cursor: "pointer", fontFamily: "inherit" };
  const thStyle: React.CSSProperties = { padding: "0.625rem 0.875rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center" }}>
        <input type="search" placeholder="Zoek op naam..." value={zoekterm} onChange={(e) => setZoekterm(e.target.value)} style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "0.375rem 0.75rem", color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", width: 200, fontFamily: "inherit" }} />
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} style={dropdownStyle}>
          <option value="allen">Team: Allen</option>
          {alleTeams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={rolFilter} onChange={(e) => setRolFilter(e.target.value)} style={dropdownStyle}>
          <option value="allen">Rol: Allen</option>
          {alleRollen.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={() => setGepindFilter((v) => !v)} style={chipStyle(gepindFilter)}>📌 Gepind</button>
        <span style={{ marginLeft: "auto", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{gefilterd.length} staflid{gefilterd.length !== 1 ? "en" : ""}</span>
        <button onClick={() => setDialogOpen(true)} style={{ padding: "0.375rem 0.75rem", borderRadius: 7, border: "none", background: "var(--accent)", color: "#fff", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Nieuw staflid</button>
      </div>
      <div style={{ background: "var(--surface-card)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-default)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th onClick={() => handleSort("naam")} style={thStyle}>Naam<SortIcon col="naam" /></th>
              <th style={{ ...thStyle, cursor: "default" }}>Globale rollen</th>
              <th onClick={() => handleSort("teams")} style={thStyle}>Teams + rol<SortIcon col="teams" /></th>
              <th onClick={() => handleSort("gepind")} style={{ ...thStyle, textAlign: "center" }}>📌<SortIcon col="gepind" /></th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.length === 0 && (
              <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Geen stafleden gevonden</td></tr>
            )}
            {gefilterd.map((staf, i) => {
              const initialen = staf.naam.split(" ").filter((w) => w.length > 0 && w[0] === w[0].toUpperCase()).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <tr key={staf.id} style={{ borderBottom: i < gefilterd.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,107,0,.15)", border: "1.5px solid rgba(255,107,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>{initialen}</div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{staf.naam}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{staf.rollen.length > 0 ? staf.rollen.join(", ") : "—"}</td>
                  <td style={{ padding: "0.625rem 0.875rem" }}>
                    {staf.teams.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {staf.teams.map((t) => (
                          <div key={t.teamId} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: KLEUR_DOT[t.kleur] ?? "#94a3b8", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 500 }}>{t.teamNaam}</span>
                            {t.rol && <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", background: "var(--surface-raised)", border: "1px solid var(--border-default)", borderRadius: 4, padding: "1px 6px", whiteSpace: "nowrap" }}>{t.rol}</span>}
                          </div>
                        ))}
                      </div>
                    ) : <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontStyle: "italic" }}>Niet ingedeeld</span>}
                  </td>
                  <td style={{ padding: "0.625rem 0.875rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.875rem", opacity: staf.gepind ? 1 : 0.2 }}>📌</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <NieuweStafDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
```

- [ ] Commit

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/_components/
git commit -m "feat(personen): ReserveringenOverzicht + StafOverzicht componenten"
```

---

### Task 9: Pages — wiring

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/_components/SpelersOverzichtStudioWrapper.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/spelers/page.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/personen/staf/page.tsx`

- [ ] Vervang `SpelersOverzichtStudioWrapper.tsx`

```typescript
"use client";

import { useState } from "react";
import SpelersOverzichtStudio from "./SpelersOverzichtStudio";
import { ReserveringenOverzicht } from "./ReserveringenOverzicht";
import { NieuweSpelerDialog } from "./NieuweSpelerDialog";
import { SpelerProfielDialog, DaisyWidget } from "@/components/ti-studio";
import type { StudioSpeler } from "../actions";
import type { StudioReservering } from "../reserveringen-actions";

interface Props {
  spelers: StudioSpeler[];
  reserveringen: StudioReservering[];
}

export default function SpelersOverzichtStudioWrapper({ spelers, reserveringen }: Props) {
  const [profielId, setProfielId] = useState<string | null>(null);
  const [nieuwDialogOpen, setNieuwDialogOpen] = useState(false);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
        <button
          onClick={() => setNieuwDialogOpen(true)}
          style={{ padding: "0.375rem 0.875rem", borderRadius: 7, border: "none", background: "var(--accent)", color: "#fff", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Nieuwe speler
        </button>
      </div>
      <SpelersOverzichtStudio spelers={spelers} onRowClick={setProfielId} />
      <ReserveringenOverzicht reserveringen={reserveringen} />
      <NieuweSpelerDialog open={nieuwDialogOpen} onClose={() => setNieuwDialogOpen(false)} />
      <SpelerProfielDialog spelerId={profielId} open={!!profielId} onClose={() => setProfielId(null)} />
      <DaisyWidget />
    </>
  );
}
```

- [ ] Vervang `spelers/page.tsx`

```typescript
export const dynamic = "force-dynamic";

import { getSpelersVoorStudio } from "../actions";
import { getReserveringenVoorStudio } from "../reserveringen-actions";
import SpelersOverzichtStudioWrapper from "../_components/SpelersOverzichtStudioWrapper";

export default async function PersonenSpelersPage() {
  const [spelers, reserveringen] = await Promise.all([
    getSpelersVoorStudio(),
    getReserveringenVoorStudio(),
  ]);
  return <SpelersOverzichtStudioWrapper spelers={spelers} reserveringen={reserveringen} />;
}
```

- [ ] Vervang `staf/page.tsx`

```typescript
export const dynamic = "force-dynamic";

import { getStafVoorStudio } from "../staf-actions";
import { StafOverzicht } from "../_components/StafOverzicht";
import { DaisyWidget } from "@/components/ti-studio";

export default async function PersonenStafPage() {
  const stafLeden = await getStafVoorStudio();
  return (
    <>
      <StafOverzicht stafLeden={stafLeden} />
      <DaisyWidget />
    </>
  );
}
```

- [ ] Bouw en los TypeScript errors op

```bash
pnpm build 2>&1 | head -60
```

- [ ] Commit

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/personen/
git commit -m "feat(personen): pages wiring — spelers + reserveringen + staf volledig"
```

---

### Task 10: Werkbord — SpelersPoolDrawer Reservering-sectie

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/types.ts`
- Modify: `apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx`
- Modify: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`

- [ ] Voeg `WerkbordReservering` toe aan `types.ts` (na `WerkbordStaf`)

```typescript
export interface WerkbordReservering {
  id: string;
  titel: string;
  geslacht: Geslacht;
  teamId: string | null;
  ingedeeldTeamNaam: string | null;
}
```

Voeg ook toe aan `WerkbordState`:

```typescript
alleReserveringen: WerkbordReservering[];
```

- [ ] Pas `SpelersPoolDrawer.tsx` aan

Verander de interface (voeg `reserveringen` toe):

```typescript
interface SpelersPoolDrawerProps {
  open: boolean;
  spelers: WerkbordSpeler[];
  reserveringen: WerkbordReservering[];
  onClose: () => void;
}
```

Importeer het type bovenaan:

```typescript
import type { WerkbordSpeler, SpelerFilter, WerkbordReservering } from "./types";
```

Voeg in de scrolllijst toe na de AR-sectie (voor het sluitende `</div>` van de scrolllijst):

```typescript
{reserveringen.length > 0 && (
  <>
    <div style={{ margin: "8px 10px 0", borderTop: "1px solid var(--border-0)" }} />
    <div style={{ padding: "8px 10px 4px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span>Reservering</span>
      <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{reserveringen.length}</span>
    </div>
    {reserveringen.map((r) => (
      <ReserveringKaartje key={r.id} reservering={r} />
    ))}
  </>
)}
```

Voeg `ReserveringKaartje` sub-component toe voor de `IconBtn` functie:

```typescript
function ReserveringKaartje({ reservering }: { reservering: WerkbordReservering }) {
  const geslachtKleur = reservering.geslacht === "V" ? "var(--pink)" : "var(--blue)";
  const geslachtBg = reservering.geslacht === "V" ? "rgba(236,72,153,.18)" : "rgba(96,165,250,.18)";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("reservering", JSON.stringify(reservering));
        e.dataTransfer.effectAllowed = "move";
      }}
      style={{ display: "flex", alignItems: "center", height: 40, borderBottom: "1px solid var(--border-0)", cursor: "grab", padding: "0 6px", gap: 6 }}
    >
      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: geslachtBg, color: geslachtKleur, border: `1.5px solid ${geslachtKleur}`, boxSizing: "border-box" }}>
        {reservering.geslacht === "V" ? "♀" : "♂"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{reservering.titel}</div>
        <div style={{ fontSize: 9, color: "var(--text-3)" }}>Reservering</div>
      </div>
    </div>
  );
}
```

- [ ] Pas `TiStudioShell.tsx` aan — geef `alleReserveringen` door aan `SpelersPoolDrawer`

```typescript
// Destructure uit initieleState (al beschikbaar via WerkbordState):
const alleReserveringen = initieleState.alleReserveringen ?? [];

// In JSX:
<SpelersPoolDrawer
  open={panelLinks === "pool"}
  spelers={alleSpelers}
  reserveringen={alleReserveringen}
  onClose={() => setPanelLinks(null)}
/>
```

- [ ] Pas `indeling/page.tsx` aan — laad `alleReserveringen` in de WerkbordState

Zoek de plek waar de WerkbordState wordt samengesteld (vlak voor de `return`). Voeg toe:

```typescript
const alleReserveringen = await prisma.reserveringsspeler.findMany({
  select: {
    id: true,
    titel: true,
    geslacht: true,
    teamId: true,
    team: { select: { naam: true } },
  },
  orderBy: { titel: "asc" },
});
```

Voeg toe aan de return-object van WerkbordState:

```typescript
alleReserveringen: alleReserveringen.map((r) => ({
  id: r.id,
  titel: r.titel,
  geslacht: r.geslacht as "M" | "V",
  teamId: r.teamId,
  ingedeeldTeamNaam: r.team?.naam ?? null,
})),
```

- [ ] Draai typecheck en build

```bash
pnpm typecheck 2>&1 | head -30
pnpm build 2>&1 | head -40
```

- [ ] Commit

```bash
git add apps/web/src/components/ti-studio/werkbord/ apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/page.tsx
git commit -m "feat(werkbord): SpelersPoolDrawer Reservering-sectie + WerkbordState uitgebreid"
```

---

## Self-Review

| Spec-vereiste | Task |
|---|---|
| Spelers-tabel: zoek, filter status/huidig-team/indeling/memo/gepind | Task 6 |
| Sortering op alle kolommen incl. memo + gepind | Task 6 |
| Inline pin-toggle (zelfde `gepind`-veld als drawer) | Task 3 + Task 6 |
| `gepind` + `heeftActiefMemo` op `StudioSpeler` | Task 2 |
| "+ Nieuwe speler" dialoog (naam, geslacht, geboortedatum) | Task 3 + Task 7 |
| Nieuwe speler → direct in drawer (zelfde databron) | Task 3 (`revalidatePath`) |
| Reserveringsspelers: aparte sectie, titel + geslacht | Task 1 + Task 4 + Task 8 |
| Reserveringen draggable naar teams | Task 10 |
| Staf-tabel: filter team/rol/gepind, sortering | Task 8 |
| Staf met bestaande rollen en team-koppelingen | Task 5 + Task 8 |
| "+ Nieuw staflid" dialoog | Task 7 + Task 8 |
| SpelersPoolDrawer Reservering-sectie | Task 10 |

**Type consistency:**
- `StudioSpeler.gepind` + `.heeftActiefMemo` gedefinieerd Task 2, gebruikt Task 6
- `StudioReservering` gedefinieerd Task 4, gebruikt Task 8 + Task 9
- `StudioStaf` gedefinieerd Task 5, gebruikt Task 8 + Task 9
- `WerkbordReservering` gedefinieerd Task 10 types.ts, gebruikt in Shell + Drawer + indeling page

**Opgelet bij uitvoering:**
- Task 3: `PinType.SPELER_STATUS` — verificatie gedaan, bestaat in schema ✓
- Task 5: `Pin.stafId` — verificatie gedaan, bestaat in schema ✓
- Task 10: `indeling/page.tsx` is een Server Component — `prisma` direct aanroepen is correct
