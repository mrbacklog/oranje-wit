# Kader-Validatie Systeem — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Koppel de kader-instellingen uit `/kader` aan de validatie-stip op TeamKaart en de ValidatieLijst in TeamDrawer, zodat één systeem ontstaat dat live toont of teams aan de TC/KNKV-eisen voldoen.

**Architecture:** Pure validatie-engine (`validatie-engine.ts`) berekent `WerkbordValidatieItem[]` op basis van `TcKader` en team-state. Initieel berekend bij page load; na elke mutatie herberekend via API-route (spelersbewegingen) of server action (teamconfig). `useWerkbordState` beheert de validatie-state client-side.

**Tech Stack:** Next.js 15 App Router, Prisma (PostgreSQL op Railway), Vitest, TypeScript

---

## Uitvoerings-volgorde (subagent-waves)

```
Wave 1:  Task 1 (foundation)
Wave 2:  Task 2 + Task 3  (parallel — beide afhankelijk van Task 1)
Wave 3:  Task 4 + Task 5  (parallel — beide afhankelijk van Task 3)
Wave 4:  Task 6           (afhankelijk van Task 3 + Task 5)
```

---

## Betrokken bestanden

| Bestand | Actie | Verantwoordelijkheid |
|---|---|---|
| `kader/kader-defaults.ts` | **Nieuw** | TcKader type, TC_DEFAULTS, mergeMetDefaults |
| `kader/actions.ts` | Wijzig | Importeer TcKader uit kader-defaults |
| `components/ti-studio/kader/KaderView.tsx` | Wijzig | Importeer uit kader-defaults, voeg 2 UI-velden toe |
| `werkbord/types.ts` | Wijzig | Voeg ValidatieUpdate interface toe |
| `lib/teamindeling/validatie-engine.ts` | **Nieuw** | Pure validatiefuncties |
| `lib/teamindeling/validatie-engine.test.ts` | **Nieuw** | Vitest unit tests |
| `indeling/page.tsx` | Wijzig | Laad kaders, bereken initiële validatie |
| `api/ti-studio/indeling/[versieId]/route.ts` | Wijzig | Retourneer validatieUpdates na spelersmutaties |
| `werkbord/hooks/useWerkbordState.ts` | Wijzig | Beheer validatie-state, verwerk API-respons |
| `werkbord/TiStudioShell.tsx` | Wijzig | Geef validatie vanuit hook door |
| `indeling/team-config-actions.ts` | Wijzig | Retourneer validatieUpdate na config-update |
| `werkbord/TeamDrawer.tsx` | Wijzig | Verwerk validatieUpdate via nieuwe callback |

---

## Task 1: kader-defaults.ts aanmaken (Wave 1)

**Files:**
- Create: `apps/web/src/app/(teamindeling-studio)/ti-studio/kader/kader-defaults.ts`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/kader/actions.ts`

- [ ] **Stap 1: Maak kader-defaults.ts aan**

```ts
// apps/web/src/app/(teamindeling-studio)/ti-studio/kader/kader-defaults.ts

export type TcKader = {
  teamMin: number;
  teamIdeaal: number;
  teamMax: number;
  damesMin: number;
  damesIdeaal: number;
  damesMax: number;
  herenMin: number;
  herenIdeaal: number;
  herenMax: number;
  gemLeeftijdMin?: number;
  gemLeeftijdMax?: number;
  /** Max leeftijdsspreiding in het team (korfballeeftijd, jaren). Alleen B-categorieën. */
  bandbreedteMax?: number;
  /** Max korfballeeftijd per individuele speler. Alleen U-teams. */
  maxLeeftijdPerSpeler?: number;
};

export const TC_DEFAULTS: Record<string, TcKader> = {
  SEN_A: {
    teamMin: 8, teamIdeaal: 10, teamMax: 12,
    damesMin: 4, damesIdeaal: 5, damesMax: 6,
    herenMin: 4, herenIdeaal: 5, herenMax: 6,
  },
  SEN_B: {
    teamMin: 10, teamIdeaal: 12, teamMax: 14,
    damesMin: 4, damesIdeaal: 6, damesMax: 8,
    herenMin: 4, herenIdeaal: 6, herenMax: 8,
  },
  U19: {
    teamMin: 8, teamIdeaal: 10, teamMax: 12,
    damesMin: 4, damesIdeaal: 5, damesMax: 6,
    herenMin: 4, herenIdeaal: 5, herenMax: 6,
    maxLeeftijdPerSpeler: 19.00,
  },
  U17: {
    teamMin: 8, teamIdeaal: 10, teamMax: 12,
    damesMin: 4, damesIdeaal: 5, damesMax: 6,
    herenMin: 4, herenIdeaal: 5, herenMax: 6,
    maxLeeftijdPerSpeler: 17.00,
  },
  U15: {
    teamMin: 8, teamIdeaal: 10, teamMax: 12,
    damesMin: 4, damesIdeaal: 5, damesMax: 6,
    herenMin: 4, herenIdeaal: 5, herenMax: 6,
    maxLeeftijdPerSpeler: 15.00,
  },
  ROOD: {
    teamMin: 9, teamIdeaal: 11, teamMax: 13,
    damesMin: 2, damesIdeaal: 5, damesMax: 8,
    herenMin: 2, herenIdeaal: 5, herenMax: 8,
    gemLeeftijdMin: 13.4, gemLeeftijdMax: 18.5,
    bandbreedteMax: 3,
  },
  ORANJE: {
    teamMin: 9, teamIdeaal: 11, teamMax: 13,
    damesMin: 2, damesIdeaal: 5, damesMax: 8,
    herenMin: 2, herenIdeaal: 5, herenMax: 8,
    gemLeeftijdMin: 11.3, gemLeeftijdMax: 14.4,
    bandbreedteMax: 3,
  },
  GEEL8: {
    teamMin: 9, teamIdeaal: 11, teamMax: 13,
    damesMin: 2, damesIdeaal: 5, damesMax: 8,
    herenMin: 2, herenIdeaal: 5, herenMax: 8,
    gemLeeftijdMin: 9.2, gemLeeftijdMax: 12.1,
    bandbreedteMax: 3,
  },
  GEEL4: {
    teamMin: 4, teamIdeaal: 5, teamMax: 5,
    damesMin: 2, damesIdeaal: 3, damesMax: 4,
    herenMin: 2, herenIdeaal: 3, herenMax: 4,
    gemLeeftijdMin: 9.2, gemLeeftijdMax: 12.1,
    bandbreedteMax: 3,
  },
  GROEN: {
    teamMin: 4, teamIdeaal: 5, teamMax: 6,
    damesMin: 2, damesIdeaal: 3, damesMax: 4,
    herenMin: 2, herenIdeaal: 3, herenMax: 4,
    gemLeeftijdMin: 7.5, gemLeeftijdMax: 9.7,
    bandbreedteMax: 2,
  },
  BLAUW: {
    teamMin: 4, teamIdeaal: 5, teamMax: 6,
    damesMin: 2, damesIdeaal: 3, damesMax: 4,
    herenMin: 2, herenIdeaal: 3, herenMax: 4,
    gemLeeftijdMin: 5.5, gemLeeftijdMax: 8.2,
    bandbreedteMax: 2,
  },
};

export function mergeMetDefaults(
  opgeslagen: Record<string, TcKader> | null
): Record<string, TcKader> {
  if (!opgeslagen) return { ...TC_DEFAULTS };
  const result: Record<string, TcKader> = { ...TC_DEFAULTS };
  for (const id of Object.keys(TC_DEFAULTS)) {
    if (opgeslagen[id]) {
      result[id] = { ...TC_DEFAULTS[id], ...opgeslagen[id] };
    }
  }
  return result;
}
```

- [ ] **Stap 2: Update actions.ts — importeer TcKader uit kader-defaults**

Vervang de lokale `TcKader` type-definitie in `actions.ts` door een import:

```ts
// apps/web/src/app/(teamindeling-studio)/ti-studio/kader/actions.ts
"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { logger, type ActionResult } from "@oranje-wit/types";
import type { Prisma } from "@oranje-wit/database";
import type { TcKader } from "./kader-defaults";

export type { TcKader };

// ... rest van het bestand ongewijzigd
```

De `TcKader` type-definitie verwijderen uit `actions.ts` (regels 12–24 in het origineel).

- [ ] **Stap 3: Typecheck draaien**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Verwacht: geen fouten gerelateerd aan TcKader.

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/kader/kader-defaults.ts \
        apps/web/src/app/\(teamindeling-studio\)/ti-studio/kader/actions.ts
git commit -m "feat(kader): kader-defaults.ts — TcKader + TC_DEFAULTS + mergeMetDefaults als single source"
```

---

## Task 2: KaderView UI uitbreiden (Wave 2 — parallel met Task 3)

**Afhankelijkheid:** Task 1 klaar  
**Files:**
- Modify: `apps/web/src/components/ti-studio/kader/KaderView.tsx`

- [ ] **Stap 1: Vervang lokale imports**

Bovenaan `KaderView.tsx`, verwijder de lokale definities van `TcKader`, `TC_DEFAULTS` en `mergeMetDefaults`. Voeg imports toe:

```ts
import { type TcKader, TC_DEFAULTS, mergeMetDefaults } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";
```

Verwijder ook de lokale `type TcKader = { ... }` definitie (regels 246–258 in het origineel), de `const TC_DEFAULTS` (regels 260–394) en de `function mergeMetDefaults` (regels 403–431).

- [ ] **Stap 2: Voeg B_CATEGORIE set en U_TEAM set toe**

Direct onder `const B_CATEGORIE_IDS`:

```ts
const B_CATEGORIE_IDS = new Set(["ROOD", "ORANJE", "GEEL8", "GEEL4", "GROEN", "BLAUW"]);
const U_TEAM_IDS = new Set(["U19", "U17", "U15"]);
```

- [ ] **Stap 3: Voeg SingleInput component toe**

Na de `LeeftijdRij` component-definitie, voeg toe:

```ts
interface SingleInputProps {
  label: string;
  value: number | undefined;
  defaultValue: number | undefined;
  onChange: (v: number) => void;
}

function SingleInput({ label, value, defaultValue, onChange }: SingleInputProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid var(--border-0)",
      }}
    >
      <span style={{ flex: 1, color: "var(--text-2)", fontSize: 12 }}>{label}</span>
      <NumInput
        value={value}
        onChange={onChange}
        gewijzigd={value !== defaultValue}
      />
    </div>
  );
}
```

- [ ] **Stap 4: Voeg nieuwe velden toe aan de TC-kolom**

In `KaderView` render, zoek de sectie `{isBCategorie && (...)}`. Voeg na die sectie toe:

```tsx
{isBCategorie && (
  <SingleInput
    label="Max leeftijdsspreiding (jaar)"
    value={huidigKader.bandbreedteMax}
    defaultValue={savedKader.bandbreedteMax}
    onChange={(v) => updateVeld(actieveTab, "bandbreedteMax", v)}
  />
)}

{U_TEAM_IDS.has(actieveTab) && (
  <SingleInput
    label="Max leeftijd per speler"
    value={huidigKader.maxLeeftijdPerSpeler}
    defaultValue={savedKader.maxLeeftijdPerSpeler}
    onChange={(v) => updateVeld(actieveTab, "maxLeeftijdPerSpeler", v)}
  />
)}
```

- [ ] **Stap 5: Typecheck + visuele controle**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

Open `/kader` in de browser, klik op ROOD (B-categorie): "Max leeftijdsspreiding" rij zichtbaar. Klik op U17: "Max leeftijd per speler" zichtbaar.

- [ ] **Stap 6: Commit**

```bash
git add apps/web/src/components/ti-studio/kader/KaderView.tsx
git commit -m "feat(kader): KaderView — bandbreedteMax + maxLeeftijdPerSpeler velden per teamtype"
```

---

## Task 3: Validatie-engine + types (Wave 2 — parallel met Task 2)

**Afhankelijkheid:** Task 1 klaar  
**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/types.ts`
- Create: `apps/web/src/lib/teamindeling/validatie-engine.ts`
- Create: `apps/web/src/lib/teamindeling/validatie-engine.test.ts`

- [ ] **Stap 1: Voeg ValidatieUpdate toe aan types.ts**

Voeg onderaan `types.ts` toe:

```ts
export interface ValidatieUpdate {
  teamId: string;
  items: WerkbordValidatieItem[];
  status: "ok" | "warn" | "err";
  count: number;
}
```

- [ ] **Stap 2: Maak validatie-engine.ts aan**

```ts
// apps/web/src/lib/teamindeling/validatie-engine.ts

import type { WerkbordTeam, WerkbordValidatieItem } from "@/components/ti-studio/werkbord/types";
import type { TcKader } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";

const MS_PER_JAAR = 365.25 * 24 * 60 * 60 * 1000;

export function korfbalLeeftijd(
  geboortedatum: string | null,
  geboortejaar: number,
  peiljaar: number
): number {
  if (geboortedatum) {
    const peil = new Date(peiljaar, 11, 31); // 31 dec van peiljaar
    const geb = new Date(geboortedatum);
    return Math.round(((peil.getTime() - geb.getTime()) / MS_PER_JAAR) * 100) / 100;
  }
  return peiljaar - geboortejaar;
}

export function bepaalKaderSleutel(team: Pick<WerkbordTeam, "teamCategorie" | "niveau" | "kleur" | "formaat">): string | null {
  const { teamCategorie, niveau, kleur, formaat } = team;
  if (teamCategorie === "SENIOREN") {
    if (niveau === "A") return "SEN_A";
    if (niveau === "B") return "SEN_B";
    return null;
  }
  if (teamCategorie === "A_CATEGORIE") {
    if (niveau === "U19") return "U19";
    if (niveau === "U17") return "U17";
    if (niveau === "U15") return "U15";
    return null;
  }
  if (teamCategorie === "B_CATEGORIE") {
    if (kleur === "rood") return "ROOD";
    if (kleur === "oranje") return "ORANJE";
    if (kleur === "geel") return formaat === "viertal" ? "GEEL4" : "GEEL8";
    if (kleur === "groen") return "GROEN";
    if (kleur === "blauw") return "BLAUW";
    return null;
  }
  return null;
}

export function berekenTeamValidatie(
  team: WerkbordTeam,
  kaders: Record<string, TcKader>,
  peiljaar: number
): WerkbordValidatieItem[] {
  const sleutel = bepaalKaderSleutel(team);

  if (!sleutel || !kaders[sleutel]) {
    return [{
      teamId: team.id,
      type: "warn",
      regel: "Teamtype niet ingesteld",
      beschrijving: "Stel categorie en niveau/kleur in voor kadervereisten",
    }];
  }

  const kader = kaders[sleutel];
  const items: WerkbordValidatieItem[] = [];
  const alleSpelers = [...team.dames, ...team.heren];
  const totaal = alleSpelers.length;
  const dames = team.dames.length;
  const heren = team.heren.length;

  // 1. Teamgrootte
  if (totaal < kader.teamMin) {
    items.push({
      teamId: team.id,
      type: "err",
      regel: "Te weinig spelers",
      beschrijving: `${totaal} spelers, minimum is ${kader.teamMin}`,
      laag: "TC",
    });
  } else if (totaal < kader.teamIdeaal) {
    items.push({
      teamId: team.id,
      type: "warn",
      regel: "Onder ideaalgrootte",
      beschrijving: `${totaal} spelers, ideaal is ${kader.teamIdeaal}`,
      laag: "TC",
    });
  }
  if (totaal > kader.teamMax) {
    items.push({
      teamId: team.id,
      type: "warn",
      regel: "Te veel spelers",
      beschrijving: `${totaal} spelers, maximum is ${kader.teamMax}`,
      laag: "TC",
    });
  }

  // 2. Dames
  if (dames < kader.damesMin) {
    items.push({
      teamId: team.id,
      type: "err",
      regel: "Te weinig dames",
      beschrijving: `${dames} dames, minimum is ${kader.damesMin}`,
      laag: "TC",
    });
  } else if (dames > kader.damesMax) {
    items.push({
      teamId: team.id,
      type: "warn",
      regel: "Te veel dames",
      beschrijving: `${dames} dames, maximum is ${kader.damesMax}`,
      laag: "TC",
    });
  }

  // 3. Heren
  if (heren < kader.herenMin) {
    items.push({
      teamId: team.id,
      type: "err",
      regel: "Te weinig heren",
      beschrijving: `${heren} heren, minimum is ${kader.herenMin}`,
      laag: "TC",
    });
  } else if (heren > kader.herenMax) {
    items.push({
      teamId: team.id,
      type: "warn",
      regel: "Te veel heren",
      beschrijving: `${heren} heren, maximum is ${kader.herenMax}`,
      laag: "TC",
    });
  }

  // 4. Gemiddelde leeftijd
  if (
    kader.gemLeeftijdMin !== undefined &&
    kader.gemLeeftijdMax !== undefined &&
    team.gemiddeldeLeeftijd !== null
  ) {
    if (team.gemiddeldeLeeftijd < kader.gemLeeftijdMin) {
      items.push({
        teamId: team.id,
        type: "warn",
        regel: "Gem. leeftijd te laag",
        beschrijving: `${team.gemiddeldeLeeftijd.toFixed(2)} jaar, minimum is ${kader.gemLeeftijdMin}`,
        laag: "TC",
      });
    } else if (team.gemiddeldeLeeftijd > kader.gemLeeftijdMax) {
      items.push({
        teamId: team.id,
        type: "warn",
        regel: "Gem. leeftijd te hoog",
        beschrijving: `${team.gemiddeldeLeeftijd.toFixed(2)} jaar, maximum is ${kader.gemLeeftijdMax}`,
        laag: "TC",
      });
    }
  }

  // 5. Leeftijdsbandbreedte
  if (kader.bandbreedteMax !== undefined && alleSpelers.length >= 2) {
    const leeftijden = alleSpelers.map((sit) =>
      korfbalLeeftijd(sit.speler.geboortedatum, sit.speler.geboortejaar, peiljaar)
    );
    const minL = Math.min(...leeftijden);
    const maxL = Math.max(...leeftijden);
    const spreiding = Math.round((maxL - minL) * 100) / 100;
    if (spreiding > kader.bandbreedteMax) {
      items.push({
        teamId: team.id,
        type: "err",
        regel: "Leeftijdsbandbreedte overschreden",
        beschrijving: `Spreiding ${spreiding.toFixed(2)} jaar, maximum is ${kader.bandbreedteMax} jaar`,
        laag: "KNKV",
      });
    }
  }

  // 6. Max leeftijd per speler
  if (kader.maxLeeftijdPerSpeler !== undefined) {
    for (const sit of alleSpelers) {
      const leeftijd = korfbalLeeftijd(
        sit.speler.geboortedatum,
        sit.speler.geboortejaar,
        peiljaar
      );
      if (leeftijd > kader.maxLeeftijdPerSpeler) {
        items.push({
          teamId: team.id,
          type: "err",
          regel: `${sit.speler.roepnaam} ${sit.speler.achternaam} te oud`,
          beschrijving: `${leeftijd.toFixed(2)} jaar, maximum is ${kader.maxLeeftijdPerSpeler.toFixed(2)} jaar`,
          laag: "KNKV",
        });
      }
    }
  }

  return items;
}

export function berekenValidatieStatus(items: WerkbordValidatieItem[]): "ok" | "warn" | "err" {
  if (items.some((i) => i.type === "err")) return "err";
  if (items.some((i) => i.type === "warn")) return "warn";
  return "ok";
}
```

- [ ] **Stap 3: Schrijf de failing test**

```ts
// apps/web/src/lib/teamindeling/validatie-engine.test.ts
import { describe, it, expect } from "vitest";
import {
  berekenTeamValidatie,
  berekenValidatieStatus,
  korfbalLeeftijd,
  bepaalKaderSleutel,
} from "./validatie-engine";
import { TC_DEFAULTS } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";
import type { WerkbordTeam, WerkbordSpelerInTeam } from "@/components/ti-studio/werkbord/types";

const PEILJAAR = 2026;

function maakSpeler(
  id: string,
  geboortejaar: number,
  geslacht: "V" | "M",
  geboortedatum?: string
): WerkbordSpelerInTeam {
  return {
    id,
    spelerId: id,
    speler: {
      id,
      roepnaam: "Test",
      achternaam: id,
      geboortejaar,
      geboortedatum: geboortedatum ?? null,
      geslacht,
      status: "BESCHIKBAAR",
      rating: null,
      notitie: null,
      afmelddatum: null,
      teamId: "team-1",
      gepind: false,
      isNieuw: false,
      huidigTeam: null,
      ingedeeldTeamNaam: null,
      selectieGroepId: null,
    },
    notitie: null,
  };
}

function maakTeam(overrides: Partial<WerkbordTeam>): WerkbordTeam {
  return {
    id: "team-1",
    naam: "Test",
    categorie: "SENIOREN",
    kleur: "senior",
    formaat: "achtal",
    volgorde: 0,
    canvasX: 0,
    canvasY: 0,
    dames: [],
    heren: [],
    staf: [],
    notitie: null,
    ussScore: null,
    gemiddeldeLeeftijd: null,
    validatieStatus: "ok",
    validatieCount: 0,
    teamCategorie: "SENIOREN",
    niveau: null,
    selectieGroepId: null,
    selectieNaam: null,
    selectieDames: [],
    selectieHeren: [],
    gebundeld: false,
    memoStatus: null,
    besluit: null,
    ...overrides,
  };
}

describe("korfbalLeeftijd", () => {
  it("berekent exact met geboortedatum", () => {
    const leeftijd = korfbalLeeftijd("2009-01-15", 2009, 2026);
    expect(leeftijd).toBeGreaterThan(16.9);
    expect(leeftijd).toBeLessThan(17.1);
  });

  it("valt terug op geboortejaar als datum ontbreekt", () => {
    expect(korfbalLeeftijd(null, 2009, 2026)).toBe(17);
  });
});

describe("bepaalKaderSleutel", () => {
  it("SEN_A voor SENIOREN niveau A", () => {
    expect(bepaalKaderSleutel({ teamCategorie: "SENIOREN", niveau: "A", kleur: "senior", formaat: "achtal" })).toBe("SEN_A");
  });
  it("GEEL4 voor geel viertal", () => {
    expect(bepaalKaderSleutel({ teamCategorie: "B_CATEGORIE", niveau: null, kleur: "geel", formaat: "viertal" })).toBe("GEEL4");
  });
  it("GEEL8 voor geel achtal", () => {
    expect(bepaalKaderSleutel({ teamCategorie: "B_CATEGORIE", niveau: null, kleur: "geel", formaat: "achtal" })).toBe("GEEL8");
  });
  it("null als niveau ontbreekt bij SENIOREN", () => {
    expect(bepaalKaderSleutel({ teamCategorie: "SENIOREN", niveau: null, kleur: "senior", formaat: "achtal" })).toBeNull();
  });
});

describe("berekenTeamValidatie", () => {
  it("warn als teamtype niet ingesteld", () => {
    const team = maakTeam({ teamCategorie: "SENIOREN", niveau: null });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("warn");
    expect(items[0].regel).toBe("Teamtype niet ingesteld");
  });

  it("geen items als SEN_A ideaal bezet (5V + 5M = 10)", () => {
    const dames = [1, 2, 3, 4, 5].map((i) => maakSpeler(`v${i}`, 2000, "V"));
    const heren = [1, 2, 3, 4, 5].map((i) => maakSpeler(`m${i}`, 2000, "M"));
    const team = maakTeam({
      teamCategorie: "SENIOREN", niveau: "A",
      dames, heren, gemiddeldeLeeftijd: 26,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(items).toHaveLength(0);
  });

  it("err te weinig spelers + err te weinig dames + err te weinig heren (SEN_A, 3V+3M)", () => {
    const team = maakTeam({
      teamCategorie: "SENIOREN", niveau: "A",
      dames: [1, 2, 3].map((i) => maakSpeler(`v${i}`, 2000, "V")),
      heren: [1, 2, 3].map((i) => maakSpeler(`m${i}`, 2000, "M")),
      gemiddeldeLeeftijd: 26,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    const regels = items.map((i) => i.regel);
    expect(regels).toContain("Te weinig spelers");
    expect(regels).toContain("Te weinig dames");
    expect(regels).toContain("Te weinig heren");
    expect(items.every((i) => i.type === "err")).toBe(true);
  });

  it("warn onder ideaal voor SEN_A met 4V+4M=8", () => {
    const team = maakTeam({
      teamCategorie: "SENIOREN", niveau: "A",
      dames: [1, 2, 3, 4].map((i) => maakSpeler(`v${i}`, 2000, "V")),
      heren: [1, 2, 3, 4].map((i) => maakSpeler(`m${i}`, 2000, "M")),
      gemiddeldeLeeftijd: 26,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(items.some((i) => i.regel === "Onder ideaalgrootte")).toBe(true);
    expect(items.every((i) => i.type !== "err")).toBe(true);
  });

  it("err speler te oud voor U17 (geboortedatum 2007-01-15 → ~19 jaar in 2026)", () => {
    const teOud = maakSpeler("v1", 2007, "V", "2007-01-15");
    const team = maakTeam({
      teamCategorie: "A_CATEGORIE", niveau: "U17",
      dames: [teOud, ...[ 2009, 2010, 2010, 2011].map((y, i) => maakSpeler(`v${i+2}`, y, "V"))],
      heren: [2009, 2010, 2010, 2011].map((y, i) => maakSpeler(`m${i}`, y, "M")),
      gemiddeldeLeeftijd: 16,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(items.some((i) => i.type === "err" && i.laag === "KNKV" && i.regel.includes("te oud"))).toBe(true);
  });

  it("err bandbreedte overschreden voor ROOD (spreiding > 3 jaar)", () => {
    const spelersV = [
      maakSpeler("v1", 2010, "V", "2010-06-01"), // 16.6 jaar
      maakSpeler("v2", 2014, "V", "2014-01-01"), // 12.0 jaar → spread 4.6 > 3
    ];
    const spelersM = [2010, 2011, 2012, 2013].map((y, i) => maakSpeler(`m${i}`, y, "M"));
    const team = maakTeam({
      teamCategorie: "B_CATEGORIE", kleur: "rood",
      dames: spelersV, heren: spelersM,
      gemiddeldeLeeftijd: 14,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(items.some((i) => i.regel === "Leeftijdsbandbreedte overschreden" && i.laag === "KNKV")).toBe(true);
  });
});

describe("berekenValidatieStatus", () => {
  it("err als er een err item is", () => {
    expect(berekenValidatieStatus([
      { teamId: "t1", type: "warn", regel: "x", beschrijving: "y" },
      { teamId: "t1", type: "err", regel: "a", beschrijving: "b" },
    ])).toBe("err");
  });
  it("warn als alleen warn items", () => {
    expect(berekenValidatieStatus([
      { teamId: "t1", type: "warn", regel: "x", beschrijving: "y" },
    ])).toBe("warn");
  });
  it("ok als lege array", () => {
    expect(berekenValidatieStatus([])).toBe("ok");
  });
});
```

- [ ] **Stap 4: Draai tests — verwacht FAIL**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm test --filter=web -- validatie-engine 2>&1 | tail -20
```

Verwacht: tests falen omdat `validatie-engine.ts` nog niet bestaat (of de test-file al aangemaakt maar imports nog niet kloppen).

- [ ] **Stap 5: Draai tests na aanmaken engine — verwacht PASS**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm test --filter=web -- validatie-engine 2>&1 | tail -20
```

Verwacht: alle tests slagen.

- [ ] **Stap 6: Check op MemoStatus in maakTeam helper**

Als `WerkbordTeam` een `memoStatus` of `besluit` veld heeft dat niet in de helper staat, voeg die toe. Draai:

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep validatie-engine
```

Verwacht: geen fouten.

- [ ] **Stap 7: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/types.ts \
        apps/web/src/lib/teamindeling/validatie-engine.ts \
        apps/web/src/lib/teamindeling/validatie-engine.test.ts
git commit -m "feat(validatie): validatie-engine — berekenTeamValidatie + ValidatieUpdate type + tests"
```

---

## Task 4: page.tsx — initiële validatie (Wave 3 — parallel met Task 5)

**Afhankelijkheid:** Task 1 + Task 3 klaar  
**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`

- [ ] **Stap 1: Voeg imports toe**

Bovenaan `page.tsx`, voeg toe:

```ts
import { getTeamtypeKaders } from "@/app/(teamindeling-studio)/ti-studio/kader/actions";
import { mergeMetDefaults } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";
import { berekenTeamValidatie, berekenValidatieStatus } from "@/lib/teamindeling/validatie-engine";
```

- [ ] **Stap 2: Laad kaders na het laden van de werkindeling**

In `IndelingPage()`, na `const versie = volledig.versies[0];`, voeg toe:

```ts
const seizoen = volledig.kaders.seizoen; // "2025-2026"
const peiljaar = parseInt(seizoen.split("-")[1], 10);
const opgeslagenKaders = await getTeamtypeKaders(seizoen);
const tcKaders = mergeMetDefaults(opgeslagenKaders);
```

- [ ] **Stap 3: Verwijder hardcoded validatieStatus**

In de `teams` mapping (rond regel 193), vervang:

```ts
validatieStatus: "ok" as const,
validatieCount: 0,
```

Door:

```ts
validatieStatus: "ok" as const,  // tijdelijk — wordt hieronder overschreven
validatieCount: 0,
```

(We overschrijven ze in de post-processing stap.)

- [ ] **Stap 4: Bereken validatie in post-processing**

Na de `teams` array is opgebouwd (na de `// Post-processing: vul selectieDames...` sectie), voeg toe:

```ts
// Validatie berekenen op basis van kaders
const validatie: WerkbordValidatieItem[] = [];
for (const team of teams) {
  const items = berekenTeamValidatie(team, tcKaders, peiljaar);
  validatie.push(...items);
  team.validatieStatus = berekenValidatieStatus(items);
  team.validatieCount = items.filter((i) => i.type !== "ok").length;
}
```

- [ ] **Stap 5: Vul validatie in de WerkbordState**

Zoek de `initieleState: WerkbordState = { ... }` object. Vervang `validatie: []` door:

```ts
validatie,
```

- [ ] **Stap 6: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep page
```

Verwacht: geen fouten.

- [ ] **Stap 7: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/page.tsx
git commit -m "feat(indeling): initiële validatie berekend vanuit TcKader bij page load"
```

---

## Task 5: API route + useWerkbordState (Wave 3 — parallel met Task 4)

**Afhankelijkheid:** Task 3 klaar  
**Files:**
- Modify: `apps/web/src/app/api/ti-studio/indeling/[versieId]/route.ts`
- Modify: `apps/web/src/components/ti-studio/werkbord/hooks/useWerkbordState.ts`
- Modify: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`

### Deel A: API route

- [ ] **Stap 1: Voeg helper-functie toe aan route.ts**

Voeg bovenaan `route.ts` toe (na de imports):

```ts
import { getTeamtypeKaders } from "@/app/(teamindeling-studio)/ti-studio/kader/actions";
import { mergeMetDefaults } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";
import { berekenTeamValidatie, berekenValidatieStatus, korfbalLeeftijd } from "@/lib/teamindeling/validatie-engine";
import type { ValidatieUpdate } from "@/components/ti-studio/werkbord/types";

const DB_KLEUR_MAP: Record<string, string> = {
  BLAUW: "blauw", GROEN: "groen", GEEL: "geel",
  ORANJE: "oranje", ROOD: "rood", PAARS: "blauw",
};

async function haalValidatieUpdate(teamId: string): Promise<ValidatieUpdate> {
  const teamData = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    select: {
      id: true,
      categorie: true,
      kleur: true,
      teamType: true,
      niveau: true,
      versie: {
        select: {
          werkindeling: {
            select: { kaders: { select: { seizoen: true } } },
          },
        },
      },
      spelers: {
        select: {
          speler: {
            select: {
              id: true,
              geslacht: true,
              geboortejaar: true,
              geboortedatum: true,
              roepnaam: true,
              achternaam: true,
            },
          },
        },
      },
    },
  });

  const seizoen = teamData.versie.werkindeling.kaders.seizoen;
  const peiljaar = parseInt(seizoen.split("-")[1], 10);
  const opgeslagenKaders = await getTeamtypeKaders(seizoen);
  const tcKaders = mergeMetDefaults(opgeslagenKaders);

  const dames = teamData.spelers
    .filter((ts) => ts.speler.geslacht === "V")
    .map((ts) => ({
      id: ts.speler.id,
      spelerId: ts.speler.id,
      speler: {
        ...ts.speler,
        geboortedatum: ts.speler.geboortedatum
          ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
          : null,
        geslacht: "V" as const,
        status: "BESCHIKBAAR" as const,
        rating: null,
        notitie: null,
        afmelddatum: null,
        teamId: teamId,
        gepind: false,
        isNieuw: false,
        huidigTeam: null,
        ingedeeldTeamNaam: null,
        selectieGroepId: null,
      },
      notitie: null,
    }));

  const heren = teamData.spelers
    .filter((ts) => ts.speler.geslacht === "M")
    .map((ts) => ({
      id: ts.speler.id,
      spelerId: ts.speler.id,
      speler: {
        ...ts.speler,
        geboortedatum: ts.speler.geboortedatum
          ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
          : null,
        geslacht: "M" as const,
        status: "BESCHIKBAAR" as const,
        rating: null,
        notitie: null,
        afmelddatum: null,
        teamId: teamId,
        gepind: false,
        isNieuw: false,
        huidigTeam: null,
        ingedeeldTeamNaam: null,
        selectieGroepId: null,
      },
      notitie: null,
    }));

  const totaalSpelers = teamData.spelers.length;
  const gemLeeftijd =
    totaalSpelers > 0
      ? teamData.spelers.reduce((acc, ts) => {
          const gbd = ts.speler.geboortedatum
            ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
            : null;
          return acc + korfbalLeeftijd(gbd, ts.speler.geboortejaar ?? peiljaar - 15, peiljaar);
        }, 0) / totaalSpelers
      : null;

  const teamVoorValidatie = {
    id: teamId,
    naam: "",
    categorie: String(teamData.categorie),
    kleur: (DB_KLEUR_MAP[teamData.kleur ?? ""] ?? "senior") as "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior",
    formaat: (teamData.teamType === "VIERTAL" ? "viertal" : "achtal") as "viertal" | "achtal" | "selectie",
    volgorde: 0,
    canvasX: 0, canvasY: 0,
    dames,
    heren,
    staf: [],
    notitie: null,
    ussScore: null,
    gemiddeldeLeeftijd: gemLeeftijd !== null ? Math.round(gemLeeftijd * 10) / 10 : null,
    validatieStatus: "ok" as const,
    validatieCount: 0,
    teamCategorie: (teamData.categorie ?? "SENIOREN") as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
    niveau: (teamData.niveau ?? null) as "A" | "B" | "U15" | "U17" | "U19" | null,
    selectieGroepId: null,
    selectieNaam: null,
    selectieDames: [],
    selectieHeren: [],
    gebundeld: false,
    memoStatus: null,
    besluit: null,
  };

  const items = berekenTeamValidatie(teamVoorValidatie, tcKaders, peiljaar);
  return {
    teamId,
    items,
    status: berekenValidatieStatus(items),
    count: items.filter((i) => i.type !== "ok").length,
  };
}
```

- [ ] **Stap 2: Retourneer validatieUpdates in de POST handler**

In de `try` block van de `POST` handler, vervang `return ok({ opgeslagen: true });` door:

```ts
// Validatie herberekenen voor betrokken teams
const validatieUpdates: ValidatieUpdate[] = [];
if (event.type === "speler_verplaatst") {
  validatieUpdates.push(await haalValidatieUpdate(event.naarTeamId));
  if (event.vanTeamId) {
    validatieUpdates.push(await haalValidatieUpdate(event.vanTeamId));
  }
} else if (event.type === "speler_naar_pool") {
  validatieUpdates.push(await haalValidatieUpdate(event.vanTeamId));
}

return ok({ opgeslagen: true, validatieUpdates });
```

Voor `team_positie` events: geen validatie nodig, stuur lege array terug.

### Deel B: useWerkbordState

- [ ] **Stap 3: Voeg initieleValidatie parameter + validatie state toe**

In `useWerkbordState`, voeg `initieleValidatie` toe als derde parameter en maak er state van:

```ts
export function useWerkbordState(
  versieId: string,
  initieleTeams: WerkbordTeam[],
  initieleSpelers: WerkbordSpeler[],
  initieleValidatie: WerkbordValidatieItem[]   // NIEUW
) {
  const [teams, setTeams] = useState<WerkbordTeam[]>(initieleTeams);
  const [alleSpelers, setAlleSpelers] = useState<WerkbordSpeler[]>(initieleSpelers);
  const [validatie, setValidatie] = useState<WerkbordValidatieItem[]>(initieleValidatie); // NIEUW
  // ... rest ongewijzigd
```

Voeg ook toe (bovenaan imports in useWerkbordState.ts):

```ts
import type { WerkbordValidatieItem, ValidatieUpdate } from "../types";
```

- [ ] **Stap 4: Voeg updateValidatieLokaal toe**

Na de bestaande lokale mutatiefuncties:

```ts
const updateValidatieLokaal = useCallback((updates: ValidatieUpdate[]) => {
  setValidatie((prev) => {
    let nieuw = [...prev];
    for (const update of updates) {
      nieuw = nieuw.filter((v) => v.teamId !== update.teamId);
      nieuw.push(...update.items);
    }
    return nieuw;
  });
  setTeams((prev) =>
    prev.map((t) => {
      const update = updates.find((u) => u.teamId === t.id);
      if (!update) return t;
      return { ...t, validatieStatus: update.status, validatieCount: update.count };
    })
  );
}, []);
```

- [ ] **Stap 5: Maak stuurMutatie reactief op validatieUpdates**

Vervang de huidige `stuurMutatie` implementatie:

```ts
async function stuurMutatie(body: Record<string, unknown>) {
  try {
    const resp = await fetch(`/api/ti-studio/indeling/${versieId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, sessionId: sessionId.current }),
    });
    if (resp.ok) {
      const data = (await resp.json()) as { validatieUpdates?: ValidatieUpdate[] };
      if (data.validatieUpdates?.length) {
        updateValidatieLokaal(data.validatieUpdates);
      }
    }
  } catch {
    // Stil falen — optimistic update blijft
  }
}
```

- [ ] **Stap 6: Exporteer validatie en updateValidatieLokaal vanuit de hook**

In de `return` statement van `useWerkbordState`, voeg toe:

```ts
return {
  // ... bestaande returns
  validatie,               // NIEUW
  updateValidatieLokaal,   // NIEUW
};
```

### Deel C: TiStudioShell

- [ ] **Stap 7: Geef initieleValidatie door aan de hook**

In `TiStudioShell.tsx`, zoek de `useWerkbordState` aanroep en voeg de vierde parameter toe:

```ts
const {
  teams,
  alleSpelers,
  validatie,               // NIEUW — destructureer uit hook
  updateValidatieLokaal,   // NIEUW
  // ... rest ongewijzigd
} = useWerkbordState(versieId, initieleState.teams, initieleState.alleSpelers, initieleState.validatie);
```

- [ ] **Stap 8: Gebruik validatie uit de hook (niet meer uit initieleState)**

Vervang in TiStudioShell alle instanties van `initieleState.validatie` door `validatie`:

```tsx
// TeamDrawer:
validatie={validatie}

// TeamDialog:
validatie={validatie}
```

- [ ] **Stap 9: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "useWerkbordState|TiStudioShell|route" | head -20
```

Verwacht: geen fouten.

- [ ] **Stap 10: Commit**

```bash
git add apps/web/src/app/api/ti-studio/indeling/\[versieId\]/route.ts \
        apps/web/src/components/ti-studio/werkbord/hooks/useWerkbordState.ts \
        apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
git commit -m "feat(indeling): validatieUpdates via API-route na spelersmutaties + hook state"
```

---

## Task 6: updateTeamConfig validatieUpdate (Wave 4)

**Afhankelijkheid:** Task 3 + Task 5 klaar  
**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.ts`
- Modify: `apps/web/src/components/ti-studio/werkbord/TeamDrawer.tsx`
- Modify: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`

- [ ] **Stap 1: Breid updateTeamConfig uit om validatieUpdate te retourneren**

In `team-config-actions.ts`, voeg toe aan de imports:

```ts
import { getTeamtypeKaders } from "@/app/(teamindeling-studio)/ti-studio/kader/actions";
import { mergeMetDefaults } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";
import { berekenTeamValidatie, berekenValidatieStatus, korfbalLeeftijd } from "@/lib/teamindeling/validatie-engine";
import type { ValidatieUpdate } from "@/components/ti-studio/werkbord/types";
```

Verander het return type van `updateTeamConfig`:

```ts
export async function updateTeamConfig(
  teamId: string,
  config: TeamConfigUpdate
): Promise<ActionResult<{ validatieUpdate: ValidatieUpdate }>> {
```

Na de `prisma.team.update(...)` aanroep, voeg toe vóór de return:

```ts
// Herbereken validatie na config-wijziging
const teamData = await prisma.team.findUniqueOrThrow({
  where: { id: teamId },
  select: {
    id: true, categorie: true, kleur: true, teamType: true, niveau: true,
    versie: {
      select: { werkindeling: { select: { kaders: { select: { seizoen: true } } } } },
    },
    spelers: {
      select: {
        speler: {
          select: { id: true, geslacht: true, geboortejaar: true, geboortedatum: true, roepnaam: true, achternaam: true },
        },
      },
    },
  },
});

const seizoen = teamData.versie.werkindeling.kaders.seizoen;
const peiljaar = parseInt(seizoen.split("-")[1], 10);
const tcKaders = mergeMetDefaults(await getTeamtypeKaders(seizoen));

const DB_KLEUR_MAP: Record<string, string> = {
  BLAUW: "blauw", GROEN: "groen", GEEL: "geel", ORANJE: "oranje", ROOD: "rood", PAARS: "blauw",
};

const dames = teamData.spelers
  .filter((ts) => ts.speler.geslacht === "V")
  .map((ts) => ({
    id: ts.speler.id, spelerId: ts.speler.id,
    speler: {
      ...ts.speler,
      geboortedatum: ts.speler.geboortedatum ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0] : null,
      geslacht: "V" as const, status: "BESCHIKBAAR" as const,
      rating: null, notitie: null, afmelddatum: null, teamId,
      gepind: false, isNieuw: false, huidigTeam: null, ingedeeldTeamNaam: null, selectieGroepId: null,
    },
    notitie: null,
  }));

const heren = teamData.spelers
  .filter((ts) => ts.speler.geslacht === "M")
  .map((ts) => ({
    id: ts.speler.id, spelerId: ts.speler.id,
    speler: {
      ...ts.speler,
      geboortedatum: ts.speler.geboortedatum ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0] : null,
      geslacht: "M" as const, status: "BESCHIKBAAR" as const,
      rating: null, notitie: null, afmelddatum: null, teamId,
      gepind: false, isNieuw: false, huidigTeam: null, ingedeeldTeamNaam: null, selectieGroepId: null,
    },
    notitie: null,
  }));

const teamVoorValidatie = {
  id: teamId, naam: "",
  categorie: String(teamData.categorie),
  kleur: (DB_KLEUR_MAP[teamData.kleur ?? ""] ?? "senior") as "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior",
  formaat: (teamData.teamType === "VIERTAL" ? "viertal" : "achtal") as "viertal" | "achtal" | "selectie",
  volgorde: 0, canvasX: 0, canvasY: 0,
  dames, heren, staf: [],
  notitie: null, ussScore: null,
  gemiddeldeLeeftijd: teamData.spelers.length > 0
    ? Math.round(teamData.spelers.reduce((acc, ts) => {
        const gbd = ts.speler.geboortedatum ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0] : null;
        return acc + korfbalLeeftijd(gbd, ts.speler.geboortejaar ?? peiljaar - 15, peiljaar);
      }, 0) / teamData.spelers.length * 10) / 10
    : null,
  validatieStatus: "ok" as const, validatieCount: 0,
  teamCategorie: (teamData.categorie ?? "SENIOREN") as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
  niveau: (teamData.niveau ?? null) as "A" | "B" | "U15" | "U17" | "U19" | null,
  selectieGroepId: null, selectieNaam: null,
  selectieDames: [], selectieHeren: [],
  gebundeld: false, memoStatus: null, besluit: null,
};

const items = berekenTeamValidatie(teamVoorValidatie, tcKaders, peiljaar);
const validatieUpdate: ValidatieUpdate = {
  teamId,
  items,
  status: berekenValidatieStatus(items),
  count: items.filter((i) => i.type !== "ok").length,
};

return { ok: true, data: { validatieUpdate } };
```

Verwijder de oude `return { ok: true, data: undefined };`.

- [ ] **Stap 2: Update ConfiguratieForm in TeamDrawer**

In `TeamDrawer.tsx`, voeg `onValidatieUpdated` toe aan de `TeamDrawerProps` interface:

```ts
interface TeamDrawerProps {
  // ... bestaande props
  onValidatieUpdated: (update: ValidatieUpdate) => void; // NIEUW
}
```

En aan `TeamDetailPanel`:

```ts
interface TeamDetailPanelProps {
  // ... bestaande props
  onValidatieUpdated: (update: ValidatieUpdate) => void; // NIEUW
}
```

Voeg de import toe:

```ts
import type { ValidatieUpdate } from "./types";
```

- [ ] **Stap 3: Roep onValidatieUpdated aan in ConfiguratieForm.sla()**

In `ConfiguratieForm`, voeg de prop toe:

```ts
function ConfiguratieForm({
  team,
  onConfigUpdated,
  onValidatieUpdated,
}: {
  team: WerkbordTeam;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
  onValidatieUpdated: (update: ValidatieUpdate) => void; // NIEUW
}) {
```

In de `sla` functie, na `if (result.ok) { ... onConfigUpdated(...) ... }`, voeg toe:

```ts
if (result.ok && result.data.validatieUpdate) {
  onValidatieUpdated(result.data.validatieUpdate);
}
```

- [ ] **Stap 4: Druk de prop door van TeamDetailPanel naar ConfiguratieForm**

In `TeamDetailPanel`, druk `onValidatieUpdated` door naar `ConfiguratieForm`:

```tsx
<ConfiguratieForm
  team={team}
  onConfigUpdated={onConfigUpdated}
  onValidatieUpdated={onValidatieUpdated}  // NIEUW
/>
```

En in `TeamDrawer`, druk door naar `TeamDetailPanel`:

```tsx
<TeamDetailPanel
  // ... bestaande props
  onValidatieUpdated={onValidatieUpdated}  // NIEUW
/>
```

- [ ] **Stap 5: Update TiStudioShell**

In `TiStudioShell.tsx`, geef `updateValidatieLokaal` door aan `TeamDrawer`:

```tsx
<TeamDrawer
  // ... bestaande props
  onValidatieUpdated={(update) => updateValidatieLokaal([update])}  // NIEUW
/>
```

- [ ] **Stap 6: Typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "TeamDrawer|team-config" | head -20
```

Verwacht: geen fouten.

- [ ] **Stap 7: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/team-config-actions.ts \
        apps/web/src/components/ti-studio/werkbord/TeamDrawer.tsx \
        apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
git commit -m "feat(indeling): updateTeamConfig retourneert validatieUpdate — stip + drawer live na config-wijziging"
```

---

## Definitieve verificatie

- [ ] **Draai alle unit tests**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm test --filter=web 2>&1 | tail -20
```

Verwacht: alle tests slagen.

- [ ] **Typecheck volledig project**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm build 2>&1 | tail -30
```

Verwacht: build slaagt.

- [ ] **Handmatige controle**

1. Open `/ti-studio/indeling`
2. Verplaats een speler naar een team — stip update zichtbaar na ~500ms
3. Open TeamDrawer voor een team — validatielijst toont regels met laag-badge
4. Verander teamtype via configuratieform — stip update direct
5. Open `/kader`, verander een waarde en sla op — herlaad `/indeling`, stip reflecteert nieuwe kaders

---

## Self-review notities

- **DB_KLEUR_MAP** staat dubbel (route.ts en team-config-actions.ts). Acceptabel voor nu — extractie naar een gedeeld lib-bestand kan later.
- **`haalValidatieUpdate` helper** staat dubbel. Zelfde oordeel — verplaatsing naar een shared helper is een losstaande refactor.
- **SSE-stream** broadcast validatieUpdates **niet** naar andere sessies. Dit is bewust out-of-scope: andere sessies zien de spelersbewegingen via SSE maar de stip-kleur volgt pas bij hun volgende interactie of reload.
- **`memoStatus` / `besluit`** velden moeten in de `maakTeam` test-helper aanwezig zijn — check dit in Task 3 Stap 6 en pas aan als nodig.
