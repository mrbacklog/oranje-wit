# Team-drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vervang de ValidatieDrawer door een vollwaardige TeamDrawer met platte teamkaarten, een sliding configuratiepaneel (beslisboom), live validatielijst (KNKV + TC laag) en selectie-koppeling.

**Architecture:** `ValidatieDrawer.tsx` wordt verwijderd en vervangen door `TeamDrawer.tsx`. De `ActivePanel` enum verandert "validatie" → "teams". In `TiStudioShell` komt `geselecteerdTeamId` state en een `openTeamDrawer(teamId)` functie. De validatieknop op `TeamKaart` roept die functie aan.

**Tech Stack:** React 18 client components, inline styles (geen Tailwind in werkbord), Prisma server actions, `@oranje-wit/types` ActionResult, tokens.css CSS-variabelen.

---

## Bestandsoverzicht

| Bestand | Actie |
|---|---|
| `apps/web/src/components/ti-studio/werkbord/types.ts` | Wijzigen — voeg `TeamConfigUpdate`, `teamCategorie`, `niveau`, `selectieGroepId` toe |
| `apps/web/src/components/ti-studio/werkbord/TeamDrawer.tsx` | Aanmaken — vervangt ValidatieDrawer |
| `apps/web/src/components/ti-studio/werkbord/ValidatieDrawer.tsx` | Verwijderen |
| `apps/web/src/components/ti-studio/werkbord/Ribbon.tsx` | Wijzigen — "teams" icoon + "kader" icoon |
| `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx` | Wijzigen — TeamDrawer, state, openTeamDrawer |
| `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx` | Wijzigen — `onBewerkenTeam` → `onOpenTeamDrawer` |
| `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx` | Wijzigen — edit-knop → validatie/team-knop |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx` | Wijzigen — `teamCategorie`, `niveau`, `selectieGroepId` mappen |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.ts` | Aanmaken — `updateTeamConfig`, `koppelSelectie`, `ontkoppelSelectie` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.test.ts` | Aanmaken — unit tests voor actions |

---

## Task 1: Types uitbreiden

**Bestanden:**
- Wijzigen: `apps/web/src/components/ti-studio/werkbord/types.ts`

> **Parallel-tip:** Tasks 1, 2 en 3 raken verschillende bestanden — dispatch ze tegelijk.

- [ ] **Stap 1: Voeg `TeamConfigUpdate` type en uitbreidingen toe**

Vervang de huidige `types.ts` inhoud met:

```ts
// apps/web/src/components/ti-studio/werkbord/types.ts
// Lokale types voor het werkbord — gebaseerd op bestaande types in components/teamindeling/scenario/types.ts

export type Geslacht = "V" | "M";
export type SpelerStatus = "BESCHIKBAAR" | "TWIJFELT" | "GAAT_STOPPEN" | "GESTOPT" | "AFGEMELD";

export type ZoomLevel = "compact" | "normaal" | "detail";
export type KaartFormaat = "viertal" | "achtal" | "selectie";
export type KnkvCategorie = "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior";

export type SpelerFilter = "zonder_team" | "ingedeeld" | "alle";

// Team-configuratie beslisboom
export type TeamHoofdCategorie = "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE";
export type TeamLeeftijdsCat = "U15" | "U17" | "U19";

export interface TeamConfigUpdate {
  hoofdCategorie: TeamHoofdCategorie;
  kleur: KnkvCategorie | null;      // alleen voor B_CATEGORIE
  niveau: TeamLeeftijdsCat | null;  // alleen voor A_CATEGORIE
  teamType: "viertal" | "achtal" | null; // alleen voor B_CATEGORIE GEEL
}

export interface WerkbordSpeler {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geslacht: Geslacht;
  status: SpelerStatus;
  rating: number | null;
  notitie: string | null;
  afmelddatum: string | null;
  teamId: string | null;
  gepind: boolean;
  isNieuw: boolean;
}

export interface WerkbordSpelerInTeam {
  id: string;
  spelerId: string;
  speler: WerkbordSpeler;
  notitie: string | null;
}

export interface WerkbordTeam {
  id: string;
  naam: string;
  categorie: string;
  kleur: KnkvCategorie;
  formaat: KaartFormaat;
  volgorde: number;
  canvasX: number;
  canvasY: number;
  dames: WerkbordSpelerInTeam[];
  heren: WerkbordSpelerInTeam[];
  notitie: string | null;
  ussScore: number | null;
  gemiddeldeLeeftijd: number | null;
  validatieStatus: "ok" | "warn" | "err";
  validatieCount: number;
  // Team-configuratie velden (uit DB)
  teamCategorie: TeamHoofdCategorie;
  niveau: TeamLeeftijdsCat | null;
  selectieGroepId: string | null;
}

export interface WerkbordValidatieItem {
  teamId: string;
  type: "ok" | "warn" | "err";
  regel: string;
  beschrijving: string;
  laag?: "KNKV" | "TC"; // optioneel — ontbreekt = onbekend
}

export interface WerkbordState {
  teams: WerkbordTeam[];
  alleSpelers: WerkbordSpeler[];
  validatie: WerkbordValidatieItem[];
  werkindelingId: string;
  versieId: string;
  seizoen: string;
  naam: string;
  status: "concept" | "definitief";
  versieNummer: number;
  versieNaam: string | null;
  totalSpelers: number;
  ingeplandSpelers: number;
}

export interface TiStudioShellProps {
  initieleState: WerkbordState;
  gebruikerEmail: string;
}

export type VersiesDrawerConfirm =
  | {
      type: "promoveer-whatif";
      whatIfId: string;
      vraag: string;
      basisVersieNummer: number;
    }
  | {
      type: "herstel-versie";
      versieId: string;
      nummer: number;
      naam: string | null;
    }
  | { type: "verwijder-versie"; versieId: string; nummer: number }
  | { type: "archiveer-whatif"; whatIfId: string; vraag: string };
```

- [ ] **Stap 2: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Verwacht: enkel fouten in bestanden die `WerkbordTeam` gebruiken zonder de nieuwe velden — die worden in latere taken opgelost.

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/types.ts
git commit -m "feat(ti-studio): types uitbreiden — TeamConfigUpdate, teamCategorie, niveau, selectieGroepId"
```

---

## Task 2: Server actions voor team-config

**Bestanden:**
- Aanmaken: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.ts`
- Aanmaken: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.test.ts`

> **Parallel-tip:** Kan parallel met Task 1 en Task 3.

- [ ] **Stap 1: Schrijf de test (fail verwacht)**

Maak `team-config-actions.test.ts`:

```ts
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@oranje-wit/auth/checks", () => ({
  requireTC: vi.fn().mockResolvedValue({ user: { email: "tc@ow.nl" } }),
}));

const mockUpdate = vi.fn().mockResolvedValue({ id: "team-1" });
const mockCreate = vi.fn().mockResolvedValue({ id: "groep-1" });
const mockDelete = vi.fn().mockResolvedValue({ id: "groep-1" });

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    team: { update: mockUpdate },
    selectieGroep: { create: mockCreate, delete: mockDelete },
  },
}));

describe("updateTeamConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("slaat SENIOREN A op als SENIOREN + A_CATEGORIE", async () => {
    const { updateTeamConfig } = await import("./team-config-actions");
    const result = await updateTeamConfig("team-1", {
      hoofdCategorie: "SENIOREN",
      kleur: null,
      niveau: null,
      teamType: null,
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        categorie: "SENIOREN",
        kleur: null,
        niveau: null,
        teamType: null,
      },
    });
  });

  it("slaat Jeugd B Geel 4-tal op", async () => {
    const { updateTeamConfig } = await import("./team-config-actions");
    const result = await updateTeamConfig("team-1", {
      hoofdCategorie: "B_CATEGORIE",
      kleur: "geel",
      niveau: null,
      teamType: "viertal",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        categorie: "B_CATEGORIE",
        kleur: "GEEL",
        niveau: null,
        teamType: "VIERTAL",
      },
    });
  });

  it("slaat Jeugd A U17 op", async () => {
    const { updateTeamConfig } = await import("./team-config-actions");
    const result = await updateTeamConfig("team-1", {
      hoofdCategorie: "A_CATEGORIE",
      kleur: null,
      niveau: "U17",
      teamType: null,
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        categorie: "A_CATEGORIE",
        kleur: null,
        niveau: "U17",
        teamType: null,
      },
    });
  });
});

describe("koppelSelectie", () => {
  it("maakt een SelectieGroep aan en koppelt twee teams", async () => {
    const { koppelSelectie } = await import("./team-config-actions");
    const result = await koppelSelectie("versie-1", "team-1", "team-2");
    expect(result.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        versieId: "versie-1",
        teams: { connect: [{ id: "team-1" }, { id: "team-2" }] },
      },
    });
  });
});

describe("ontkoppelSelectie", () => {
  it("verwijdert de SelectieGroep", async () => {
    const { ontkoppelSelectie } = await import("./team-config-actions");
    const result = await ontkoppelSelectie("groep-1");
    expect(result.ok).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "groep-1" } });
  });
});
```

- [ ] **Stap 2: Draai test — verwacht FAIL**

```bash
cd apps/web && pnpm test team-config-actions 2>&1 | tail -20
```

Verwacht: "Cannot find module './team-config-actions'"

- [ ] **Stap 3: Implementeer de actions**

Maak `team-config-actions.ts`:

```ts
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.ts
"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/teamindeling/db/prisma";
import type { ActionResult } from "@oranje-wit/types";
import type { TeamConfigUpdate } from "@/components/ti-studio/werkbord/types";

const KLEUR_MAP: Record<string, string> = {
  blauw: "BLAUW",
  groen: "GROEN",
  geel: "GEEL",
  oranje: "ORANJE",
  rood: "ROOD",
};

const TEAM_TYPE_MAP: Record<string, string> = {
  viertal: "VIERTAL",
  achtal: "ACHTTAL",
};

export async function updateTeamConfig(
  teamId: string,
  config: TeamConfigUpdate
): Promise<ActionResult<void>> {
  await requireTC();
  try {
    await prisma.team.update({
      where: { id: teamId },
      data: {
        categorie: config.hoofdCategorie as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
        kleur: config.kleur ? (KLEUR_MAP[config.kleur] as "BLAUW" | "GROEN" | "GEEL" | "ORANJE" | "ROOD") : null,
        niveau: config.niveau ?? null,
        teamType: config.teamType ? (TEAM_TYPE_MAP[config.teamType] as "VIERTAL" | "ACHTTAL") : null,
      },
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function koppelSelectie(
  versieId: string,
  teamId1: string,
  teamId2: string
): Promise<ActionResult<{ groepId: string }>> {
  await requireTC();
  try {
    const groep = await prisma.selectieGroep.create({
      data: {
        versieId,
        teams: { connect: [{ id: teamId1 }, { id: teamId2 }] },
      },
    });
    return { ok: true, data: { groepId: groep.id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function ontkoppelSelectie(
  groepId: string
): Promise<ActionResult<void>> {
  await requireTC();
  try {
    await prisma.selectieGroep.delete({ where: { id: groepId } });
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
```

- [ ] **Stap 4: Draai test — verwacht PASS**

```bash
cd apps/web && pnpm test team-config-actions 2>&1 | tail -20
```

Verwacht: alle tests groen.

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/team-config-actions.ts \
        apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/team-config-actions.test.ts
git commit -m "feat(ti-studio): team-config server actions — updateTeamConfig, koppelSelectie, ontkoppelSelectie"
```

---

## Task 3: Ribbon aanpassen

**Bestanden:**
- Wijzigen: `apps/web/src/components/ti-studio/werkbord/Ribbon.tsx`

> **Parallel-tip:** Kan parallel met Tasks 1 en 2.

- [ ] **Stap 1: Verander `ActivePanel` type en voeg iconen toe**

Vervang de volledige inhoud van `Ribbon.tsx`:

```tsx
// apps/web/src/components/ti-studio/werkbord/Ribbon.tsx
"use client";
import "./tokens.css";

type ActivePanel = "pool" | "teams" | "werkbord" | "versies" | "kader" | null;

interface RibbonProps {
  activePanel: ActivePanel;
  onTogglePanel: (panel: "pool" | "teams" | "werkbord" | "versies" | "kader") => void;
  gebruikerInitialen: string;
}

export function Ribbon({ activePanel, onTogglePanel, gebruikerInitialen }: RibbonProps) {
  return (
    <nav
      style={{
        gridRow: "1 / 3",
        gridColumn: "1",
        width: "var(--ribbon)",
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 0 8px",
        gap: "2px",
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 30,
          height: 30,
          background: "linear-gradient(135deg, #FF6B00, #FF8533)",
          borderRadius: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 900,
          color: "#fff",
          marginBottom: 12,
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(255,107,0,.35)",
          letterSpacing: "-0.5px",
        }}
      >
        OW
      </div>

      {/* Hoofd-groep */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <RibbonBtn
          icon="pool"
          tip="Spelerspool"
          active={activePanel === "pool"}
          onClick={() => onTogglePanel("pool")}
        />
        <RibbonBtn
          icon="werkbord"
          tip="Werkbord"
          active={activePanel === "werkbord"}
          onClick={() => onTogglePanel("werkbord")}
        />
        <RibbonBtn
          icon="teams"
          tip="Teams"
          active={activePanel === "teams"}
          onClick={() => onTogglePanel("teams")}
        />
        <RibbonBtn
          icon="kader"
          tip="Kader"
          active={activePanel === "kader"}
          onClick={() => onTogglePanel("kader")}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{ width: 22, height: 1, background: "var(--border-0)", margin: "6px 0" }} />
        <RibbonBtn icon="instellingen" tip="Instellingen" active={false} onClick={() => {}} />
        <div
          title={gebruikerInitialen}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#2a1a0a",
            border: "2px solid rgba(255,107,0,.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--accent)",
            cursor: "pointer",
          }}
        >
          {gebruikerInitialen}
        </div>
      </div>
    </nav>
  );
}

function RibbonBtn({
  icon,
  tip,
  active,
  onClick,
  badge = false,
}: {
  icon: string;
  tip: string;
  active: boolean;
  onClick: () => void;
  badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={tip}
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: active ? "var(--accent-dim)" : "none",
        border: "none",
        color: active ? "var(--accent)" : "var(--text-3)",
        position: "relative",
        flexShrink: 0,
        transition: "background 120ms, color 120ms",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            left: -1,
            top: 7,
            bottom: 7,
            width: 3,
            background: "var(--accent)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}
      <RibbonIcon name={icon} />
      {badge && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--err)",
            border: "2px solid var(--bg-1)",
          }}
        />
      )}
    </button>
  );
}

function RibbonIcon({ name }: { name: string }) {
  const props = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "pool":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "teams":
      // Drie personen / team icoon
      return (
        <svg {...props}>
          <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" />
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case "kader":
      // Regelboek / kader icoon (shield met vinkje)
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    case "werkbord":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case "versies":
      return (
        <svg {...props}>
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "instellingen":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    default:
      return null;
  }
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/Ribbon.tsx
git commit -m "feat(ti-studio): Ribbon — teams icoon, kader icoon, validatie verwijderd"
```

---

## Task 4: page.tsx — nieuwe velden mappen

**Bestanden:**
- Wijzigen: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`
- Wijzigen: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions.ts`

> **Parallel-tip:** Kan parallel met Tasks 2 en 3.

- [ ] **Stap 1: Controleer wat `getWerkindelingVoorEditor` ophaalt**

Lees `werkindeling-actions.ts` en zoek de `teams` select-query. Voeg `teamType`, `niveau`, `selectieGroepId` toe als ze er nog niet in zitten.

Zoek het `select` blok voor teams:

```bash
grep -n "teamType\|niveau\|selectieGroep" apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/werkindeling-actions.ts
```

Als ze ontbreken, voeg ze toe aan de Prisma select:

```ts
// In de teams select sectie van getWerkindelingVoorEditor:
teams: {
  select: {
    id: true,
    naam: true,
    categorie: true,
    kleur: true,
    teamType: true,   // nieuw
    niveau: true,     // nieuw
    selectieGroepId: true, // nieuw
    volgorde: true,
    validatieStatus: true,
    // ... rest van bestaande select
  }
}
```

- [ ] **Stap 2: Update de mapping in `page.tsx`**

Voeg in de `teams.map()` functie (rond regel 82) de nieuwe velden toe aan het teruggegeven object:

```ts
// Na de bestaande velden in het return object van teams.map():
teamCategorie: (team.categorie ?? "SENIOREN") as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
niveau: (team.niveau ?? null) as "U15" | "U17" | "U19" | null,
selectieGroepId: team.selectieGroepId ?? null,
```

Zorg ook dat de `KLEUR_MAP` de mapping goed doet naar de `KnkvCategorie` tokens die de `WerkbordTeam.kleur` verwacht.

- [ ] **Stap 3: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "page.tsx"
```

Verwacht: geen fouten in `page.tsx`.

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/page.tsx \
        apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/werkindeling-actions.ts
git commit -m "feat(ti-studio): page.tsx — teamCategorie, niveau, selectieGroepId mappen"
```

---

## Task 5: TeamDrawer bouwen

**Bestanden:**
- Aanmaken: `apps/web/src/components/ti-studio/werkbord/TeamDrawer.tsx`
- Verwijderen: `apps/web/src/components/ti-studio/werkbord/ValidatieDrawer.tsx`

> **Vereist:** Task 1 (types) en Task 2 (server actions) zijn gereed.

- [ ] **Stap 1: Maak `TeamDrawer.tsx` aan**

```tsx
// apps/web/src/components/ti-studio/werkbord/TeamDrawer.tsx
"use client";
import { useState, useTransition } from "react";
import "./tokens.css";
import type {
  WerkbordTeam,
  WerkbordValidatieItem,
  TeamConfigUpdate,
  TeamHoofdCategorie,
  TeamLeeftijdsCat,
  KnkvCategorie,
} from "./types";
import {
  updateTeamConfig,
  koppelSelectie,
  ontkoppelSelectie,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions";

interface TeamDrawerProps {
  open: boolean;
  geselecteerdTeamId: string | null;
  teams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  versieId: string;
  onClose: () => void;
  onTeamSelect: (teamId: string) => void;
  onNieuwTeam: () => void;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (selectieGroepId: string) => void; // reset alle teams in de groep
}

const VAL_KLEUR: Record<string, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  err: "var(--err)",
};

const ICOON = { ok: "✓", warn: "⚠", err: "✕" };

// Venus-icoon
function VenusIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="6" />
      <line x1="12" y1="14" x2="12" y2="22" />
      <line x1="9" y1="19" x2="15" y2="19" />
    </svg>
  );
}

// Mars-icoon
function MarsIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
      <circle cx="10" cy="14" r="6" />
      <line x1="21" y1="3" x2="15" y2="9" />
      <polyline points="16 3 21 3 21 8" />
    </svg>
  );
}

// ── Platte teamkaart (lijstitem) ────────────────────────────────────────────

function PlatteTeamKaart({
  team,
  geselecteerd,
  showScores,
  onClick,
}: {
  team: WerkbordTeam;
  geselecteerd: boolean;
  showScores: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        borderLeft: `3px solid ${geselecteerd ? "var(--accent)" : "transparent"}`,
        background: geselecteerd ? "rgba(255,107,0,.06)" : "transparent",
        borderBottom: "1px solid var(--border-0)",
        padding: "0",
        cursor: "pointer",
        transition: "background 120ms",
      }}
    >
      <div style={{ padding: "8px 12px 8px 10px" }}>
        {/* Rij 1: naam + badge + stip */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{team.naam}</span>
            {team.selectieGroepId && (
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: "var(--accent)",
                background: "var(--accent-dim)",
                borderRadius: 4,
                padding: "1px 5px",
                letterSpacing: ".3px",
              }}>SEL</span>
            )}
          </div>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: VAL_KLEUR[team.validatieStatus],
            boxShadow: `0 0 4px 1px ${VAL_KLEUR[team.validatieStatus]}40`,
            flexShrink: 0,
          }} />
        </div>
        {/* Rij 2: Venus/Mars + stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <VenusIcon size={11} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--pink)" }}>{team.dames.length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MarsIcon size={11} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>{team.heren.length}</span>
          </div>
          <div style={{ width: 1, height: 12, background: "var(--border-0)" }} />
          {showScores && team.ussScore !== null && (
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>
              USS <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{team.ussScore.toFixed(2)}</span>
            </span>
          )}
          {team.gemiddeldeLeeftijd !== null && (
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>
              Gem. <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{team.gemiddeldeLeeftijd.toFixed(1)}j</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Configuratie form (beslisboom) ─────────────────────────────────────────

function ConfiguratieForm({
  team,
  onConfigUpdated,
}: {
  team: WerkbordTeam;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<TeamConfigUpdate>({
    hoofdCategorie: team.teamCategorie,
    kleur: team.kleur === "senior" ? null : team.kleur,
    niveau: team.niveau,
    teamType: team.formaat === "viertal" ? "viertal" : team.formaat === "achtal" ? "achtal" : null,
  });

  function sla(update: Partial<TeamConfigUpdate>) {
    const nieuw = { ...config, ...update };
    setConfig(nieuw);
    startTransition(async () => {
      const result = await updateTeamConfig(team.id, nieuw);
      if (result.ok) {
        // Bereken nieuw formaat voor optimistische update
        let nieuwFormaat = team.formaat;
        if (nieuw.hoofdCategorie === "B_CATEGORIE") {
          if (nieuw.kleur === "blauw" || nieuw.kleur === "groen") nieuwFormaat = "viertal";
          else if (nieuw.kleur === "geel" && nieuw.teamType === "viertal") nieuwFormaat = "viertal";
          else nieuwFormaat = "achtal";
        } else {
          nieuwFormaat = "achtal";
        }
        onConfigUpdated(team.id, {
          teamCategorie: nieuw.hoofdCategorie,
          niveau: nieuw.niveau,
          formaat: nieuwFormaat,
        });
      }
    });
  }

  const isSenioren = config.hoofdCategorie === "SENIOREN";
  const isJeugdA = config.hoofdCategorie === "A_CATEGORIE";
  const isJeugdB = config.hoofdCategorie === "B_CATEGORIE";
  const isGeel = config.kleur === "geel";

  const btnStyle = (active: boolean) => ({
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 6,
    border: `1px solid ${active ? "var(--accent)" : "var(--border-0)"}`,
    background: active ? "var(--accent-dim)" : "var(--bg-2)",
    color: active ? "var(--accent)" : "var(--text-2)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 80ms",
    opacity: isPending ? 0.6 : 1,
  });

  const label = {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: ".4px",
    color: "var(--text-3)",
    marginBottom: 6,
    display: "block",
  };

  const rij = { display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 12 };

  return (
    <div style={{ padding: "10px 14px" }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-3)", marginBottom: 10 }}>
        Inrichting
      </div>

      {/* Hoofdcategorie */}
      <span style={label}>Categorie</span>
      <div style={rij}>
        {(["SENIOREN", "A_CATEGORIE", "B_CATEGORIE"] as TeamHoofdCategorie[]).map((cat) => (
          <button key={cat} style={btnStyle(config.hoofdCategorie === cat)} onClick={() => sla({ hoofdCategorie: cat, kleur: null, niveau: null, teamType: null })}>
            {cat === "SENIOREN" ? "Senioren" : cat === "A_CATEGORIE" ? "Jeugd A" : "Jeugd B"}
          </button>
        ))}
      </div>

      {/* Senioren: geen extra opties (A/B categorie niet apart in config) */}
      {isSenioren && (
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>
          8-tal · 4 dames + 4 heren (KNKV Senioren A)
        </div>
      )}

      {/* Jeugd A: leeftijdscategorie */}
      {isJeugdA && (
        <>
          <span style={label}>Leeftijdscategorie</span>
          <div style={rij}>
            {(["U15", "U17", "U19"] as TeamLeeftijdsCat[]).map((niv) => (
              <button key={niv} style={btnStyle(config.niveau === niv)} onClick={() => sla({ niveau: niv })}>
                {niv}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>8-tal</div>
        </>
      )}

      {/* Jeugd B: kleur */}
      {isJeugdB && (
        <>
          <span style={label}>Kleur</span>
          <div style={rij}>
            {(["geel", "oranje", "rood", "blauw", "groen"] as KnkvCategorie[]).map((k) => (
              <button key={k} style={btnStyle(config.kleur === k)} onClick={() => sla({ kleur: k, teamType: k === "blauw" || k === "groen" ? "viertal" : config.teamType })}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>

          {/* Geel: formaat keuze */}
          {isGeel && (
            <>
              <span style={label}>Formaat</span>
              <div style={rij}>
                <button style={btnStyle(config.teamType === "achtal")} onClick={() => sla({ teamType: "achtal" })}>8-tal</button>
                <button style={btnStyle(config.teamType === "viertal")} onClick={() => sla({ teamType: "viertal" })}>4-tal</button>
              </div>
            </>
          )}

          {/* Blauw/Groen: vast 4-tal */}
          {(config.kleur === "blauw" || config.kleur === "groen") && (
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>4-tal (vast)</div>
          )}

          {/* Oranje/Rood: vast 8-tal */}
          {(config.kleur === "oranje" || config.kleur === "rood") && (
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>8-tal (vast)</div>
          )}
        </>
      )}
    </div>
  );
}

// ── Validatie lijst ────────────────────────────────────────────────────────

function ValidatieLijst({ items }: { items: WerkbordValidatieItem[] }) {
  const VAL_BG: Record<string, string> = {
    ok: "rgba(34,197,94,.06)",
    warn: "rgba(234,179,8,.06)",
    err: "rgba(239,68,68,.06)",
  };
  const VAL_BORDER: Record<string, string> = {
    ok: "rgba(34,197,94,.1)",
    warn: "rgba(234,179,8,.1)",
    err: "rgba(239,68,68,.1)",
  };

  return (
    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-0)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-3)", marginBottom: 8 }}>
        Validatie
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>
          Geen kaderregels geconfigureerd
        </div>
      ) : (
        items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "7px 9px",
              borderRadius: 7,
              marginBottom: 4,
              background: VAL_BG[item.type],
              border: `1px solid ${VAL_BORDER[item.type]}`,
            }}
          >
            <span style={{ fontSize: 13, color: VAL_KLEUR[item.type], flexShrink: 0, marginTop: 1 }}>
              {ICOON[item.type]}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                {item.regel}
                {item.laag && (
                  <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: "var(--text-3)", opacity: 0.8 }}>
                    [{item.laag}]
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.4 }}>{item.beschrijving}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Selectie-koppeling ─────────────────────────────────────────────────────

function SelectieKoppeling({
  team,
  alleTeams,
  versieId,
  onSelectieGekoppeld,
  onSelectieOntkoppeld,
}: {
  team: WerkbordTeam;
  alleTeams: WerkbordTeam[];
  versieId: string;
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (teamId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [gekozenTeamId, setGekozenTeamId] = useState("");

  const beschikbaar = alleTeams.filter(
    (t) => t.id !== team.id && !t.selectieGroepId
  );

  function koppel() {
    if (!gekozenTeamId) return;
    startTransition(async () => {
      const result = await koppelSelectie(versieId, team.id, gekozenTeamId);
      if (result.ok) {
        onSelectieGekoppeld(team.id, result.data.groepId);
        onSelectieGekoppeld(gekozenTeamId, result.data.groepId);
        setGekozenTeamId("");
      }
    });
  }

  function ontkoppel() {
    if (!team.selectieGroepId) return;
    startTransition(async () => {
      const groepId = team.selectieGroepId!;
      const result = await ontkoppelSelectie(groepId);
      if (result.ok) {
        onSelectieOntkoppeld(groepId); // reset alle teams in de groep
      }
    });
  }

  const gekoppeldAan = alleTeams.find(
    (t) => t.selectieGroepId === team.selectieGroepId && t.id !== team.id
  );

  return (
    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-0)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-3)", marginBottom: 8 }}>
        Selectie-koppeling
      </div>
      {team.selectieGroepId ? (
        <div>
          <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 8 }}>
            Gekoppeld aan: <strong>{gekoppeldAan?.naam ?? "—"}</strong>
          </div>
          <button
            onClick={ontkoppel}
            disabled={isPending}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid var(--border-0)",
              background: "var(--bg-2)",
              color: "var(--err)",
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            Koppeling verwijderen
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            value={gekozenTeamId}
            onChange={(e) => setGekozenTeamId(e.target.value)}
            style={{
              flex: 1,
              padding: "5px 8px",
              fontSize: 11,
              borderRadius: 6,
              border: "1px solid var(--border-0)",
              background: "var(--bg-2)",
              color: "var(--text-1)",
              fontFamily: "inherit",
            }}
          >
            <option value="">Kies team…</option>
            {beschikbaar.map((t) => (
              <option key={t.id} value={t.id}>{t.naam}</option>
            ))}
          </select>
          <button
            onClick={koppel}
            disabled={!gekozenTeamId || isPending}
            style={{
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid var(--accent)",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              cursor: gekozenTeamId ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              opacity: !gekozenTeamId || isPending ? 0.5 : 1,
            }}
          >
            Koppel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail paneel ──────────────────────────────────────────────────────────

function TeamDetailPanel({
  team,
  alleTeams,
  validatie,
  versieId,
  onConfigUpdated,
  onSelectieGekoppeld,
  onSelectieOntkoppeld,
}: {
  team: WerkbordTeam;
  alleTeams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  versieId: string;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (teamId: string) => void;
}) {
  const teamValidatie = validatie.filter((v) => v.teamId === team.id);

  return (
    <div style={{
      width: "var(--val-w)",
      background: "var(--bg-2)",
      borderLeft: "1px solid var(--border-0)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      overflowY: "auto",
    }}>
      {/* Paneel header */}
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border-0)",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", marginBottom: 2 }}>{team.naam}</div>
        <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".5px" }}>
          Inrichting · Validatie
        </div>
      </div>

      <ConfiguratieForm team={team} onConfigUpdated={onConfigUpdated} />
      <ValidatieLijst items={teamValidatie} />
      <SelectieKoppeling
        team={team}
        alleTeams={alleTeams}
        versieId={versieId}
        onSelectieGekoppeld={onSelectieGekoppeld}
        onSelectieOntkoppeld={onSelectieOntkoppeld}
      />
    </div>
  );
}

// ── Hoofd-component TeamDrawer ─────────────────────────────────────────────

export function TeamDrawer({
  open,
  geselecteerdTeamId,
  teams,
  validatie,
  versieId,
  onClose,
  onTeamSelect,
  onNieuwTeam,
  onConfigUpdated,
  onSelectieGekoppeld,
  onSelectieOntkoppeld,
}: TeamDrawerProps) {
  const geselecteerdTeam = teams.find((t) => t.id === geselecteerdTeamId) ?? null;
  const detailOpen = geselecteerdTeam !== null;

  // Sortering op volgorde
  const gesorteerdeTeams = [...teams].sort((a, b) => a.volgorde - b.volgorde);

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      width: open ? (detailOpen ? "calc(var(--val-w) * 2)" : "var(--val-w)") : 0,
      transition: "width 200ms ease",
      overflow: "hidden",
      opacity: open ? 1 : 0,
      pointerEvents: open ? "auto" : "none",
      flexShrink: 0,
      position: "relative",
      zIndex: 20,
    }}>
      {/* ── Lijst ── */}
      <aside style={{
        width: "var(--val-w)",
        flexShrink: 0,
        background: "var(--bg-1)",
        borderLeft: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".5px" }}>
            Teams
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={onNieuwTeam}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "var(--accent-dim)",
                border: "1px solid rgba(255,107,0,.25)",
                color: "var(--accent)",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 9px",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nieuw
            </button>
            <button
              onClick={onClose}
              title="Sluiten"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-3)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Lijst */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {gesorteerdeTeams.map((team) => (
            <PlatteTeamKaart
              key={team.id}
              team={team}
              geselecteerd={team.id === geselecteerdTeamId}
              showScores={true}
              onClick={() => onTeamSelect(team.id === geselecteerdTeamId ? "" : team.id)}
            />
          ))}
        </div>
      </aside>

      {/* ── Detail paneel ── */}
      {detailOpen && geselecteerdTeam && (
        <TeamDetailPanel
          team={geselecteerdTeam}
          alleTeams={teams}
          validatie={validatie}
          versieId={versieId}
          onConfigUpdated={onConfigUpdated}
          onSelectieGekoppeld={onSelectieGekoppeld}
          onSelectieOntkoppeld={onSelectieOntkoppeld}
        />
      )}
    </div>
  );
}
```

- [ ] **Stap 2: Verwijder `ValidatieDrawer.tsx`**

```bash
git rm apps/web/src/components/ti-studio/werkbord/ValidatieDrawer.tsx
```

- [ ] **Stap 3: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "TeamDrawer\|ValidatieDrawer" | head -20
```

Verwacht: geen fouten in `TeamDrawer.tsx`.

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TeamDrawer.tsx
git commit -m "feat(ti-studio): TeamDrawer — platte lijst, sliding detailpaneel, configuratieboom, validatielijst, selectie-koppeling"
```

---

## Task 6: TiStudioShell, WerkbordCanvas en TeamKaart wiring

**Bestanden:**
- Wijzigen: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`
- Wijzigen: `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx`
- Wijzigen: `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx`
- Wijzigen: `apps/web/src/components/ti-studio/werkbord/Toolbar.tsx`

> **Vereist:** Tasks 1, 3, 4, 5 zijn gereed.

- [ ] **Stap 1: Update `Toolbar.tsx` — verander `ActivePanel` type**

In `Toolbar.tsx`, verander op regels 5 en 18:

```ts
// Oud:
type ActivePanel = "pool" | "validatie" | "werkbord" | "versies" | null;
// interface: onTogglePanel: (panel: "pool" | "validatie" | "werkbord" | "versies") => void;

// Nieuw:
type ActivePanel = "pool" | "teams" | "werkbord" | "versies" | "kader" | null;
// interface: onTogglePanel: (panel: "pool" | "teams" | "werkbord" | "versies" | "kader") => void;
```

Verwijder ook de `validatieHasErrors` prop als die niet meer gebruikt wordt in de Toolbar UI (controleer dit eerst met grep).

- [ ] **Stap 2: Update `WerkbordCanvas.tsx` — `onBewerkenTeam` → `onOpenTeamDrawer`**

Hernoem in de interface en implementatie:

```tsx
// Interface (regel ~19):
onOpenTeamDrawer: (teamId: string) => void;  // was: onBewerkenTeam

// In de component parameters (regel ~65):
onOpenTeamDrawer,  // was: onBewerkenTeam

// In de TeamKaart render (regel ~286):
onOpenTeamDrawer={onOpenTeamDrawer}  // was: onBewerken={onBewerkenTeam}
```

- [ ] **Stap 3: Update `TeamKaart.tsx` — edit-knop → validatie/team-knop**

In de props interface, hernoem `onBewerken` → `onOpenTeamDrawer`:

```tsx
// Interface:
onOpenTeamDrawer: (teamId: string) => void;  // was: onBewerken

// De bestaande edit-knop in normaal/detail mode (rond regel 438-469):
// Verander de onClick handler:
onClick={(e) => {
  e.stopPropagation();
  onOpenTeamDrawer(team.id);
}}
// Verander ook het icoon naar een schild/team icoon:
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
</svg>
```

- [ ] **Stap 4: Update `TiStudioShell.tsx` — volledige wiring**

Vervang de inhoud van `TiStudioShell.tsx` met de bijgewerkte versie:

```tsx
// apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./tokens.css";
import { Ribbon } from "./Ribbon";
import { Toolbar } from "./Toolbar";
import { SpelersPoolDrawer } from "./SpelersPoolDrawer";
import { WerkbordCanvas } from "./WerkbordCanvas";
import { TeamDrawer } from "./TeamDrawer";
import { VersiesDrawer } from "./VersiesDrawer";
import { useZoom } from "./hooks/useZoom";
import type {
  TiStudioShellProps,
  WerkbordTeam,
  WerkbordSpeler,
  WerkbordSpelerInTeam,
} from "./types";
import type { DrawerData } from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";
import { getVersiesVoorDrawer } from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";

type ActivePanel = "pool" | "teams" | "werkbord" | "versies" | "kader" | null;

export function TiStudioShell({ initieleState, gebruikerEmail }: TiStudioShellProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<ActivePanel>("teams");
  const [geselecteerdTeamId, setGeselecteerdTeamId] = useState<string | null>(null);
  const [showScores, setShowScores] = useState(true);
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null);
  const { zoom, setZoom, zoomIn, zoomOut, resetZoom, zoomLevel, zoomPercent } = useZoom();

  const [teams, setTeams] = useState<WerkbordTeam[]>(initieleState.teams);
  const [alleSpelers, setAlleSpelers] = useState<WerkbordSpeler[]>(initieleState.alleSpelers);

  const alleSpelersRef = useRef(alleSpelers);
  useEffect(() => { alleSpelersRef.current = alleSpelers; }, [alleSpelers]);

  const sessionId = useRef<string>(crypto.randomUUID());
  const versieId = initieleState.versieId;

  const gebruikerInitialen = gebruikerEmail
    .split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  useEffect(() => {
    if (activePanel !== "versies") return;
    getVersiesVoorDrawer(initieleState.werkindelingId).then(setDrawerData).catch(() => {});
  }, [activePanel, initieleState.werkindelingId]);

  function togglePanel(panel: "pool" | "teams" | "werkbord" | "versies" | "kader") {
    setActivePanel((prev) => (prev === panel ? null : panel));
    if (panel !== "teams") setGeselecteerdTeamId(null);
  }

  // Open team-drawer + selecteer specifiek team (vanuit validatieknop op kaart)
  function openTeamDrawer(teamId: string) {
    setActivePanel("teams");
    setGeselecteerdTeamId(teamId);
  }

  // ─── Lokale state-mutaties ───────────────────────────────────────────────

  const verplaatsSpelerLokaal = useCallback(
    (spelerData: WerkbordSpeler, vanTeamId: string | null, naarTeamId: string, naarGeslacht: "V" | "M") => {
      setTeams((prev) =>
        prev.map((team) => {
          let updated = { ...team };
          if (vanTeamId && team.id === vanTeamId) {
            updated = {
              ...updated,
              dames: updated.dames.filter((s) => s.spelerId !== spelerData.id),
              heren: updated.heren.filter((s) => s.spelerId !== spelerData.id),
            };
          }
          if (team.id === naarTeamId) {
            const spelerInTeam: WerkbordSpelerInTeam = {
              id: `sit-${spelerData.id}-${naarTeamId}-${Date.now()}`,
              spelerId: spelerData.id,
              speler: { ...spelerData, teamId: naarTeamId },
              notitie: null,
            };
            if (naarGeslacht === "V") {
              updated = { ...updated, dames: [...updated.dames.filter((s) => s.spelerId !== spelerData.id), spelerInTeam] };
            } else {
              updated = { ...updated, heren: [...updated.heren.filter((s) => s.spelerId !== spelerData.id), spelerInTeam] };
            }
          }
          return updated;
        })
      );
      setAlleSpelers((prev) => prev.map((s) => (s.id === spelerData.id ? { ...s, teamId: naarTeamId } : s)));
    },
    []
  );

  const verwijderSpelerUitTeamLokaal = useCallback((spelerId: string, vanTeamId: string) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id !== vanTeamId) return team;
        return {
          ...team,
          dames: team.dames.filter((s) => s.spelerId !== spelerId),
          heren: team.heren.filter((s) => s.spelerId !== spelerId),
        };
      })
    );
    setAlleSpelers((prev) => prev.map((s) => (s.id === spelerId ? { ...s, teamId: null } : s)));
  }, []);

  const verplaatsTeamKaartLokaal = useCallback((teamId: string, x: number, y: number) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, canvasX: Math.max(0, x), canvasY: Math.max(0, y) } : t))
    );
  }, []);

  // Team-config optimistische update (vanuit TeamDrawer)
  const updateTeamLokaal = useCallback((teamId: string, update: Partial<WerkbordTeam>) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...update } : t)));
  }, []);

  // Selectie-koppeling optimistische update
  const koppelSelectieLokaal = useCallback((teamId: string, selectieGroepId: string) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, selectieGroepId, formaat: "selectie" } : t)));
  }, []);

  const ontkoppelSelectieLokaal = useCallback((selectieGroepId: string) => {
    // Reset alle teams die bij deze selectiegroep horen
    setTeams((prev) => prev.map((t) =>
      t.selectieGroepId === selectieGroepId ? { ...t, selectieGroepId: null, formaat: "achtal" } : t
    ));
  }, []);

  // ─── API-calls ───────────────────────────────────────────────────────────

  async function stuurMutatie(body: Record<string, unknown>) {
    try {
      await fetch(`/api/ti-studio/indeling/${versieId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, sessionId: sessionId.current }),
      });
    } catch {
      // Stil falen — optimistic update blijft
    }
  }

  const verplaatsSpeler = useCallback(
    (spelerData: WerkbordSpeler, vanTeamId: string | null, naarTeamId: string, naarGeslacht: "V" | "M") => {
      verplaatsSpelerLokaal(spelerData, vanTeamId, naarTeamId, naarGeslacht);
      stuurMutatie({ type: "speler_verplaatst", spelerId: spelerData.id, vanTeamId, naarTeamId, naarGeslacht });
    },
    [verplaatsSpelerLokaal] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const verwijderSpelerUitTeam = useCallback(
    (spelerId: string, vanTeamId: string) => {
      verwijderSpelerUitTeamLokaal(spelerId, vanTeamId);
      stuurMutatie({ type: "speler_naar_pool", spelerId, vanTeamId });
    },
    [verwijderSpelerUitTeamLokaal] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const verplaatsTeamKaart = useCallback(
    (teamId: string, x: number, y: number) => { verplaatsTeamKaartLokaal(teamId, x, y); },
    [verplaatsTeamKaartLokaal]
  );

  const slaTeamPositieOp = useCallback(
    (teamId: string, x: number, y: number) => {
      stuurMutatie({ type: "team_positie", teamId, x: Math.round(x), y: Math.round(y) });
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ─── SSE ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!versieId) return;
    const es = new EventSource(`/api/ti-studio/indeling/${versieId}/stream`);
    es.onmessage = (e) => {
      let event: Record<string, unknown>;
      try { event = JSON.parse(e.data as string); } catch { return; }
      if (event.type === "ping") return;
      if (event.sessionId === sessionId.current) return;
      if (event.type === "speler_verplaatst") {
        const sp = alleSpelersRef.current.find((s) => s.id === event.spelerId);
        if (sp) verplaatsSpelerLokaal(sp, event.vanTeamId as string | null, event.naarTeamId as string, event.naarGeslacht as "V" | "M");
      } else if (event.type === "speler_naar_pool") {
        verwijderSpelerUitTeamLokaal(event.spelerId as string, event.vanTeamId as string);
      } else if (event.type === "team_positie") {
        verplaatsTeamKaartLokaal(event.teamId as string, event.x as number, event.y as number);
      }
    };
    return () => es.close();
  }, [versieId, verplaatsSpelerLokaal, verwijderSpelerUitTeamLokaal, verplaatsTeamKaartLokaal]);

  // ─── Render ──────────────────────────────────────────────────────────────

  const ingeplandSpelers = alleSpelers.filter((s) => s.teamId !== null).length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "var(--ribbon) 1fr",
        gridTemplateRows: "var(--toolbar) 1fr",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.5,
        background: "var(--bg-0)",
        color: "var(--text-1)",
        userSelect: "none",
      }}
    >
      <Ribbon
        activePanel={activePanel}
        onTogglePanel={togglePanel}
        gebruikerInitialen={gebruikerInitialen}
      />
      <Toolbar
        naam={initieleState.naam}
        versieNaam={initieleState.versieNaam}
        versieNummer={initieleState.versieNummer}
        status={initieleState.status}
        totalSpelers={initieleState.totalSpelers}
        ingeplandSpelers={ingeplandSpelers}
        showScores={showScores}
        onToggleScores={() => setShowScores((v) => !v)}
        onNieuwTeam={() => openTeamDrawer("")}
        activePanel={activePanel}
        onTerug={() => router.push("/ti-studio")}
        onTogglePanel={togglePanel}
      />
      <div style={{ gridColumn: 2, gridRow: 2, display: "flex", overflow: "hidden" }}>
        <SpelersPoolDrawer
          open={activePanel === "pool"}
          spelers={alleSpelers}
          onClose={() => setActivePanel(null)}
          onVerwijderUitTeam={verwijderSpelerUitTeam}
        />
        <WerkbordCanvas
          teams={teams}
          zoomLevel={zoomLevel}
          zoom={zoom}
          zoomPercent={zoomPercent}
          showScores={showScores}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={resetZoom}
          onZoomChange={setZoom}
          onOpenTeamDrawer={openTeamDrawer}
          onDropSpelerOpTeam={verplaatsSpeler}
          onTeamPositionChange={verplaatsTeamKaart}
          onTeamDragEnd={slaTeamPositieOp}
        />
        <TeamDrawer
          open={activePanel === "teams"}
          geselecteerdTeamId={geselecteerdTeamId}
          teams={teams}
          validatie={initieleState.validatie}
          versieId={versieId}
          onClose={() => setActivePanel(null)}
          onTeamSelect={setGeselecteerdTeamId}
          onNieuwTeam={() => {}}
          onConfigUpdated={updateTeamLokaal}
          onSelectieGekoppeld={koppelSelectieLokaal}
          onSelectieOntkoppeld={ontkoppelSelectieLokaal} // (selectieGroepId: string) => void
        />
        <VersiesDrawer
          open={activePanel === "versies"}
          data={drawerData}
          werkindelingId={initieleState.werkindelingId}
          gebruikerEmail={gebruikerEmail}
          onClose={() => setActivePanel(null)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Stap 5: Update `Toolbar.tsx` — verwijder `validatieHasErrors` prop**

In `Toolbar.tsx`:
1. Hernoem `ActivePanel` type: "validatie" → "teams", voeg "kader" toe
2. Verwijder `validatieHasErrors` uit de interface en component parameters
3. Verwijder alle gebruik van `validatieHasErrors` in de JSX

- [ ] **Stap 6: Typecheck volledig project**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -40
```

Verwacht: geen fouten.

- [ ] **Stap 7: Draai unit tests**

```bash
pnpm test 2>&1 | tail -30
```

Verwacht: alle tests groen.

- [ ] **Stap 8: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx \
        apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx \
        apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx \
        apps/web/src/components/ti-studio/werkbord/Toolbar.tsx
git commit -m "feat(ti-studio): TiStudioShell — TeamDrawer wiring, openTeamDrawer, selectie-state"
```

---

## Visuele verificatie

Open http://localhost:3000/ti-studio/indeling en controleer:

- [ ] Ribbon toont team-icoon en kader-icoon (geen validatie-icoon meer)
- [ ] Klikken op team-icoon opent TeamDrawer rechts
- [ ] TeamDrawer toont alle teams als platte 2-regelkaarten gesorteerd op volgorde
- [ ] Klikken op een teamkaart toont het detailpaneel rechts ernaast (sliding)
- [ ] Detailpaneel toont configuratieboom (Senioren / Jeugd A / Jeugd B)
- [ ] Knoppen in de configuratieboom reageren (highlight wisselt)
- [ ] Validatielijst toont "Geen kaderregels geconfigureerd"
- [ ] Selectie-koppeling dropdown toont beschikbare teams
- [ ] Validatieknop op de werkbord-teamkaart opent de drawer + selecteert dat team
- [ ] Klikken op team-icoon in ribbon sluit de drawer (toggle)
- [ ] Geselecteerde kaart heeft oranje linkerbalk

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat(ti-studio): team-drawer volledig — lijst, config, validatie, selectie-koppeling"
```
