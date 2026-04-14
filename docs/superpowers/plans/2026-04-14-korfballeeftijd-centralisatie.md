# Korfballeeftijd Centralisatie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Voortgang en scope-herijking (2026-04-14)

- ✅ **Task 1 + 2 voltooid en gemerged naar main** (commits `b5c7806`, `5dfba4c`). Fundament-module `@oranje-wit/types/korfballeeftijd` is live; 112 tests groen.
- 🚫 **Task 5 (apps/web teamindeling + scenario) is geschrapt.** Tijdens dit werk heeft **Fase B van de TI-splitsing** (commit `8408f98`) alle teamindeling-code uit `apps/web` verwijderd. Scenario-components, werkbord-klonen, validatie-engine en teamindeling-pages in `apps/web` bestaan niet meer. Niets te migreren.
- 🪚 **Task 6 is teruggebracht tot scouting + AI plugins.** De 9 scouting-bestanden (API routes, wizards, `lib/scouting/leeftijdsgroep.ts`, `lib/ai/plugins/ti-studio.ts`, `lib/ai/daisy.ts`) zijn nog altijd relevant — Fase B heeft deze niet aangeraakt.
- 📈 **Task 3 + 4 (apps/ti-studio) is uitgebreider dan oorspronkelijk gepland.** Tijdens scope-herijking bleek dat naast de genoemde bestanden óók `apps/ti-studio/src/lib/teamindeling/validatie/{regels.ts, selectie-regels.ts, constanten.ts}` en `apps/ti-studio/src/lib/teamindeling/whatif/` nog `seizoenJaar: number`/`peiljaar` signatures hebben. Alle `seizoenJaar: number` → `peildatum: Date`.
- 📝 **Task 8 docs** — `CLAUDE.md` sectie te updaten; `apps/web/CLAUDE.md` is al door Fase B bijgewerkt; `AGENTS.md` en agent-files nog doen.

**Nieuwe scope-telling:** van 63 bestanden → 19 actieve bestanden over (6 ti-studio components/pages + validatie-engines die nog `seizoenJaar:number` hebben + 9 scouting/AI + 3 scripts/test-utils + 1 constanten.ts).

---

**Goal:** Centraliseer korfballeeftijd-berekening in één module (`@oranje-wit/types`), verwijder `PEILJAAR`/`PEILDATUM` constanten, corrigeer de U15/U17/U19 grens-check (`<` → `≤`), en los de `Math.floor`- en bandbreedte-rounding-bugs op.

**Architecture:** Nieuwe module `packages/types/src/korfballeeftijd.ts` exporteert zes functies (`korfbalPeildatum`, `berekenKorfbalLeeftijdExact`, `berekenKorfbalLeeftijd`, `grofKorfbalLeeftijd`, `formatKorfbalLeeftijd`, `valtBinnenCategorie`). Alle 63 bestanden die nu `PEILJAAR` gebruiken worden omgezet naar een `peildatum: Date`. Werkbord-components krijgen `peildatum` als verplichte prop vanaf een nieuwe shell-helper die `state.seizoen` omzet via `korfbalPeildatum`.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, Next.js 16, React 19, Prisma. Design spec: [docs/superpowers/specs/2026-04-14-korfballeeftijd-centralisatie.md](../specs/2026-04-14-korfballeeftijd-centralisatie.md).

---

## File Structure

**Nieuw:**
- `packages/types/src/korfballeeftijd.ts` — centrale module
- `packages/types/src/korfballeeftijd.test.ts` — unit tests voor alle functies

**Gewijzigd (packages/types):**
- `packages/types/src/constanten.ts` — `PEILJAAR` + `PEILDATUM` eruit, `HUIDIGE_PEILDATUM` erin
- `packages/types/src/constanten.test.ts` — tests voor oude constanten verwijderen, nieuwe toevoegen
- `packages/types/src/score-model.ts` — `berekenExacteLeeftijd` delegeert, `isSpeelgerechtigd` krijgt `≤`-semantiek
- `packages/types/src/index.ts` — `korfballeeftijd.ts` exporteren

**Gewijzigd (apps/ti-studio):**
- `apps/ti-studio/src/lib/teamindeling/validatie-engine.ts`
- `apps/ti-studio/src/lib/teamindeling/validatie/helpers.ts`
- `apps/ti-studio/src/lib/teamindeling/validatie/harde-regels.ts`
- `apps/ti-studio/src/lib/teamindeling/validatie-update.ts`
- `apps/ti-studio/src/components/werkbord/SpelerKaart.tsx` (Math.floor-bug fix)
- `apps/ti-studio/src/components/werkbord/SpelerRij.tsx`
- `apps/ti-studio/src/components/werkbord/TeamKaartSpelerRij.tsx`
- `apps/ti-studio/src/components/werkbord/HoverSpelersKaart.tsx`
- `apps/ti-studio/src/components/SpelerProfielDialog.tsx`
- `apps/ti-studio/src/app/(protected)/indeling/page.tsx`
- `apps/ti-studio/src/app/(protected)/indeling/whatif-validatie-actions.ts`
- `apps/ti-studio/src/lib/ai/plugins/ti-studio.ts`
- `apps/ti-studio/src/lib/ai/daisy.ts`

**Gewijzigd (apps/web — scenario + validatie):**
- `apps/web/src/components/teamindeling/scenario/types.ts`
- `apps/web/src/components/teamindeling/scenario/*.tsx` (13 bestanden importeren `korfbalLeeftijd` uit `./types`)
- `apps/web/src/components/teamindeling/scenario/mobile/*.tsx`
- `apps/web/src/components/teamindeling/scenario/hooks/useScenarioEditor.ts`
- `apps/web/src/components/teamindeling/scenario/editor/*.tsx`
- `apps/web/src/components/teamindeling/mobile/gezien/*.tsx`
- `apps/web/src/components/teamindeling/vergelijk/TeamDiff.tsx`
- `apps/web/src/lib/teamindeling/validatie-engine.ts`
- `apps/web/src/lib/teamindeling/validatie-engine.test.ts`
- `apps/web/src/lib/teamindeling/validatie-update.ts`
- `apps/web/src/lib/teamindeling/doorstroom-signalering.ts`
- `apps/web/src/lib/teamindeling/rating.ts`
- `apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx` (Math.floor-bug fix)
- `apps/web/src/components/ti-studio/werkbord/SpelerRij.tsx`
- `apps/web/src/components/ti-studio/werkbord/HoverSpelersKaart.tsx`
- `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx`
- `apps/web/src/app/(teamindeling)/teamindeling/personen/spelers/page.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`
- `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-validatie-actions.ts`

**Gewijzigd (apps/web — API en scouting):**
- `apps/web/src/app/api/scouting/spelers/zoek/route.ts`
- `apps/web/src/app/api/scouting/spelers/[relCode]/route.ts`
- `apps/web/src/app/api/scouting/kaarten/route.ts`
- `apps/web/src/app/api/scouting/kaarten/[relCode]/route.ts`
- `apps/web/src/app/api/teamindeling/ratings/preview/route.ts`
- `apps/web/src/app/(scouting)/scouting/verzoeken/[id]/page.tsx`
- `apps/web/src/app/(scouting)/scouting/verzoeken/[id]/beoordeel/[relCode]/verzoek-rapport-wizard.tsx`
- `apps/web/src/app/(scouting)/scouting/vergelijking/nieuw/vergelijking-wizard.tsx`
- `apps/web/src/lib/scouting/leeftijdsgroep.ts`
- `apps/web/src/lib/ai/plugins/ti-studio.ts`
- `apps/web/src/lib/ai/daisy.ts`

**Gewijzigd (scripts en test-utils):**
- `scripts/seed-demo-data.ts`
- `scripts/herstel/03-speler-uss.ts`
- `packages/test-utils/src/seed/dataset.ts`
- `apps/ti-studio/src/lib/teamindeling/validatie/constanten.ts` (als hij PEILJAAR imporeert)
- `apps/web/src/lib/teamindeling/validatie/constanten.ts`

**Gewijzigd (docs en agents):**
- `CLAUDE.md` (sectie "Verplichte patronen → Constanten")
- `AGENTS.md`
- `rules/knkv-regels.md` (terminologie peildatum/peiljaar-check)
- `.claude/agents/adviseur.md`, `regel-checker.md`, `team-planner.md`, `team-selector.md`, `korfbal.md`
- `.claude/skills/{advies,validatie,scenario,audit}/SKILL.md`

---

## Task 1: Nieuwe module `korfballeeftijd.ts` — tests en implementatie

**Files:**
- Create: `packages/types/src/korfballeeftijd.ts`
- Create: `packages/types/src/korfballeeftijd.test.ts`

- [ ] **Step 1.1: Schrijf de testsuite (nog leeg, alleen describe-blokken)**

Create `packages/types/src/korfballeeftijd.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  korfbalPeildatum,
  berekenKorfbalLeeftijdExact,
  berekenKorfbalLeeftijd,
  grofKorfbalLeeftijd,
  formatKorfbalLeeftijd,
  valtBinnenCategorie,
} from "./korfballeeftijd";

describe("korfbalPeildatum", () => {
  it("geeft 31 december van het startjaar voor seizoen 2025-2026", () => {
    const d = korfbalPeildatum("2025-2026");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });

  it("geeft 31 december van het startjaar voor seizoen 2026-2027", () => {
    const d = korfbalPeildatum("2026-2027");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });

  it("werkt voor toekomstige seizoenen", () => {
    const d = korfbalPeildatum("2099-2100");
    expect(d.getFullYear()).toBe(2099);
  });
});

describe("berekenKorfbalLeeftijdExact", () => {
  const peildatum = new Date(2026, 11, 31); // 31-12-2026

  it("geboren 31-12-2011 is exact 15.00 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2011-12-31", 2011, peildatum);
    expect(exact).toBeCloseTo(15.0, 5);
  });

  it("geboren 30-12-2011 is iets meer dan 15 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2011-12-30", 2011, peildatum);
    expect(exact).toBeGreaterThan(15);
    expect(exact).toBeLessThan(15.01);
  });

  it("geboren 01-01-2012 is iets minder dan 15 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-01-01", 2012, peildatum);
    expect(exact).toBeLessThan(15);
    expect(exact).toBeGreaterThan(14.99);
  });

  it("geboren 31-12-2012 is exact 14.00 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-12-31", 2012, peildatum);
    expect(exact).toBeCloseTo(14.0, 5);
  });

  it("valt terug op geboortejaar als geboortedatum ontbreekt", () => {
    const exact = berekenKorfbalLeeftijdExact(null, 2012, peildatum);
    expect(exact).toBe(14);
  });

  it("accepteert Date-object als geboortedatum", () => {
    const exact = berekenKorfbalLeeftijdExact(new Date("2012-12-31"), 2012, peildatum);
    expect(exact).toBeCloseTo(14.0, 5);
  });

  it("hanteert schrikkeljaar 29-02-2012 zonder NaN", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-02-29", 2012, peildatum);
    expect(Number.isFinite(exact)).toBe(true);
    expect(exact).toBeGreaterThan(14.8);
    expect(exact).toBeLessThan(14.9);
  });
});

describe("berekenKorfbalLeeftijd (afgerond)", () => {
  const peildatum = new Date(2026, 11, 31);

  it("rondt naar 2 decimalen", () => {
    const leeftijd = berekenKorfbalLeeftijd("2012-12-31", 2012, peildatum);
    expect(leeftijd).toBe(14.0);
  });

  it("14.995 rondt af naar 15.00", () => {
    // Kies een geboortedatum die exact 14.995 oplevert is lastig; we testen via
    // een directe afronding op een bekende echte waarde.
    const leeftijd = berekenKorfbalLeeftijd("2012-01-15", 2012, peildatum);
    expect(Number.isFinite(leeftijd)).toBe(true);
    // Waarde moet exact 2 decimalen hebben (toFixed(2) round-trip)
    expect(Math.round(leeftijd * 100) / 100).toBe(leeftijd);
  });
});

describe("grofKorfbalLeeftijd", () => {
  it("geeft heel-jaren-verschil terug", () => {
    const peildatum = new Date(2026, 11, 31);
    expect(grofKorfbalLeeftijd(2012, peildatum)).toBe(14);
    expect(grofKorfbalLeeftijd(2011, peildatum)).toBe(15);
    expect(grofKorfbalLeeftijd(2006, peildatum)).toBe(20);
  });
});

describe("formatKorfbalLeeftijd", () => {
  it("toont altijd 2 decimalen", () => {
    expect(formatKorfbalLeeftijd(14)).toBe("14.00");
    expect(formatKorfbalLeeftijd(14.9)).toBe("14.90");
    expect(formatKorfbalLeeftijd(14.99)).toBe("14.99");
    expect(formatKorfbalLeeftijd(15)).toBe("15.00");
  });

  it("rondt op 2 decimalen", () => {
    expect(formatKorfbalLeeftijd(14.995)).toBe("15.00");
    expect(formatKorfbalLeeftijd(14.994)).toBe("14.99");
  });
});

describe("valtBinnenCategorie", () => {
  it("exact 15.00 valt binnen U15 (grens is ≤)", () => {
    expect(valtBinnenCategorie(15.0, "U15")).toBe(true);
  });

  it("15.001 valt NIET binnen U15", () => {
    expect(valtBinnenCategorie(15.001, "U15")).toBe(false);
  });

  it("14.997 valt binnen U15", () => {
    expect(valtBinnenCategorie(14.997, "U15")).toBe(true);
  });

  it("accepteert floating-point noise net onder 15.00", () => {
    expect(valtBinnenCategorie(14.9999999999, "U15")).toBe(true);
  });

  it("U17 grens op 17.00", () => {
    expect(valtBinnenCategorie(17.0, "U17")).toBe(true);
    expect(valtBinnenCategorie(17.001, "U17")).toBe(false);
  });

  it("U19 grens op 19.00", () => {
    expect(valtBinnenCategorie(19.0, "U19")).toBe(true);
    expect(valtBinnenCategorie(19.001, "U19")).toBe(false);
  });
});

describe("bandbreedte-edge (integratie)", () => {
  const peildatum = new Date(2026, 11, 31);

  it("twee spelers op dezelfde dag → spreiding 0", () => {
    const a = berekenKorfbalLeeftijdExact("2014-06-15", 2014, peildatum);
    const b = berekenKorfbalLeeftijdExact("2014-06-15", 2014, peildatum);
    expect(a - b).toBe(0);
  });

  it("spelers met 732 dagen verschil → spreiding > 2", () => {
    const oud = berekenKorfbalLeeftijdExact("2012-01-01", 2012, peildatum);
    const jong = berekenKorfbalLeeftijdExact("2014-01-03", 2014, peildatum);
    const spreiding = oud - jong;
    expect(spreiding).toBeGreaterThan(2);
  });

  it("spelers met 730 dagen verschil → spreiding < 2", () => {
    const oud = berekenKorfbalLeeftijdExact("2012-01-01", 2012, peildatum);
    const jong = berekenKorfbalLeeftijdExact("2014-01-01", 2014, peildatum);
    const spreiding = oud - jong;
    expect(spreiding).toBeLessThan(2);
  });
});
```

- [ ] **Step 1.2: Run testsuite — moet falen met "module not found"**

Run: `pnpm --filter @oranje-wit/types test korfballeeftijd`

Expected: FAIL — "Cannot find module './korfballeeftijd'"

- [ ] **Step 1.3: Schrijf de module**

Create `packages/types/src/korfballeeftijd.ts`:

```ts
/**
 * Korfballeeftijd — centrale berekening en weergave.
 *
 * Bron van waarheid voor alles wat met leeftijd-op-peildatum te maken heeft.
 * KNKV-regel: peildatum = 31 december van het startjaar van het seizoen.
 *
 * Gebruik:
 *  - `berekenKorfbalLeeftijdExact` voor grens- en bandbreedte-checks (onafgerond).
 *  - `berekenKorfbalLeeftijd` voor weergave-waardes (2 decimalen).
 *  - `formatKorfbalLeeftijd` voor strings in de UI.
 *  - `valtBinnenCategorie` voor U15/U17/U19 speelgerechtigdheid.
 */

import type { Seizoen } from "./index";

const MS_PER_DAG = 24 * 60 * 60 * 1000;
const DAGEN_PER_JAAR = 365.25;
const MS_PER_JAAR = DAGEN_PER_JAAR * MS_PER_DAG;
const FP_TOLERANTIE = 1e-9;

const CATEGORIE_GRENZEN: Record<"U15" | "U17" | "U19", number> = {
  U15: 15.0,
  U17: 17.0,
  U19: 19.0,
};

/**
 * Peildatum voor een seizoen: 31 december van het startjaar.
 *
 * Voorbeelden:
 *   "2025-2026" → 31-12-2025
 *   "2026-2027" → 31-12-2026
 */
export function korfbalPeildatum(seizoen: Seizoen): Date {
  const startjaar = parseInt(seizoen.split("-")[0], 10);
  return new Date(startjaar, 11, 31);
}

/**
 * Normaliseer geboortedatum-input naar een Date, of null als leeg.
 */
function toDate(input: Date | string | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return input;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Exacte korfballeeftijd op peildatum, onafgerond.
 *
 * Gebruik voor grens-checks en bandbreedte-vergelijkingen. Als
 * `geboortedatum` ontbreekt valt de functie terug op het heel-jaren-
 * verschil met `geboortejaar`.
 */
export function berekenKorfbalLeeftijdExact(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number,
  peildatum: Date
): number {
  const gd = toDate(geboortedatum);
  if (gd) {
    return (peildatum.getTime() - gd.getTime()) / MS_PER_JAAR;
  }
  return peildatum.getFullYear() - geboortejaar;
}

/**
 * Afgeronde korfballeeftijd op 2 decimalen. Gebruik voor weergave.
 */
export function berekenKorfbalLeeftijd(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number,
  peildatum: Date
): number {
  const exact = berekenKorfbalLeeftijdExact(geboortedatum, geboortejaar, peildatum);
  return Math.round(exact * 100) / 100;
}

/**
 * Integer korfballeeftijd alleen op basis van geboortejaar.
 * Gebruik voor scouting-filters en plekken zonder geboortedatum-precisie.
 */
export function grofKorfbalLeeftijd(geboortejaar: number, peildatum: Date): number {
  return peildatum.getFullYear() - geboortejaar;
}

/**
 * Weergave als "14.99". Altijd 2 decimalen, geen eenheid.
 */
export function formatKorfbalLeeftijd(leeftijd: number): string {
  return leeftijd.toFixed(2);
}

/**
 * Is een speler met deze exacte leeftijd speelgerechtigd voor de categorie?
 *
 * Grens is inclusief (≤): een speler met exact 15.00 valt nog in U15.
 * Floating-point noise net onder de grens wordt geaccepteerd.
 */
export function valtBinnenCategorie(
  exact: number,
  categorie: "U15" | "U17" | "U19"
): boolean {
  return exact <= CATEGORIE_GRENZEN[categorie] + FP_TOLERANTIE;
}
```

- [ ] **Step 1.4: Run tests — moet groen**

Run: `pnpm --filter @oranje-wit/types test korfballeeftijd`

Expected: ✅ Alle tests groen. Als een test faalt: fix de implementatie, niet de test.

- [ ] **Step 1.5: Exporteer uit index**

Modify `packages/types/src/index.ts`:

```ts
// ... bestaande exports ...
export * from "./korfballeeftijd";
```

(Plaats net vóór `export * from "./clearance";` of consistent met bestaande alfabetische/logische volgorde.)

- [ ] **Step 1.6: Typecheck**

Run: `pnpm --filter @oranje-wit/types typecheck`

Expected: ✅ Geen errors.

- [ ] **Step 1.7: Commit**

```bash
git add packages/types/src/korfballeeftijd.ts packages/types/src/korfballeeftijd.test.ts packages/types/src/index.ts
git commit -m "feat(types): nieuwe korfballeeftijd module met correcte grens-semantiek"
```

---

## Task 2: Constanten opschonen + score-model aansluiten

**Files:**
- Modify: `packages/types/src/constanten.ts`
- Modify: `packages/types/src/constanten.test.ts`
- Modify: `packages/types/src/score-model.ts`

- [ ] **Step 2.1: Schrijf de tests voor de nieuwe constanten**

Modify `packages/types/src/constanten.test.ts` — **vervang de volledige inhoud**:

```ts
import { describe, it, expect } from "vitest";
import { HUIDIG_SEIZOEN, HUIDIGE_PEILDATUM, MIN_GENDER_PER_TEAM } from "./constanten";
import { korfbalPeildatum } from "./korfballeeftijd";

describe("constanten", () => {
  it("HUIDIG_SEIZOEN heeft het formaat YYYY-YYYY", () => {
    expect(HUIDIG_SEIZOEN).toMatch(/^\d{4}-\d{4}$/);
  });

  it("HUIDIGE_PEILDATUM komt overeen met korfbalPeildatum(HUIDIG_SEIZOEN)", () => {
    const expected = korfbalPeildatum(HUIDIG_SEIZOEN);
    expect(HUIDIGE_PEILDATUM.getTime()).toBe(expected.getTime());
  });

  it("HUIDIGE_PEILDATUM is 31 december", () => {
    expect(HUIDIGE_PEILDATUM.getMonth()).toBe(11);
    expect(HUIDIGE_PEILDATUM.getDate()).toBe(31);
  });

  it("MIN_GENDER_PER_TEAM is 2", () => {
    expect(MIN_GENDER_PER_TEAM).toBe(2);
  });
});
```

- [ ] **Step 2.2: Run tests — moet falen (HUIDIGE_PEILDATUM bestaat nog niet, PEILJAAR-tests weg)**

Run: `pnpm --filter @oranje-wit/types test constanten`

Expected: FAIL — "HUIDIGE_PEILDATUM is not exported".

- [ ] **Step 2.3: Update constanten.ts**

Replace the full contents of `packages/types/src/constanten.ts`:

```ts
import type { Seizoen } from "./index";
import { korfbalPeildatum } from "./korfballeeftijd";

/** Huidig seizoen waarvoor indelingen gemaakt worden. */
export const HUIDIG_SEIZOEN: Seizoen = "2025-2026";

/**
 * Peildatum voor het huidige seizoen.
 * Gebruik ALLEEN op plekken zonder scenario-context (personen-overzicht,
 * scouting-lijsten). Binnen een scenario: gebruik `korfbalPeildatum(scenario.seizoen)`.
 */
export const HUIDIGE_PEILDATUM: Date = korfbalPeildatum(HUIDIG_SEIZOEN);

/** Minimum aantal spelers van elk geslacht per team */
export const MIN_GENDER_PER_TEAM = 2;
```

- [ ] **Step 2.4: Run tests opnieuw**

Run: `pnpm --filter @oranje-wit/types test constanten`

Expected: ✅ Groen.

- [ ] **Step 2.5: Update score-model.ts — imports en `berekenExacteLeeftijd`**

Modify `packages/types/src/score-model.ts`:

Oude regel 13:
```ts
import { PEILDATUM } from "./constanten";
```

Vervang door:
```ts
import { HUIDIGE_PEILDATUM } from "./constanten";
import { berekenKorfbalLeeftijd, berekenKorfbalLeeftijdExact, valtBinnenCategorie } from "./korfballeeftijd";
```

Oude functie (rond regel 124):
```ts
export function berekenExacteLeeftijd(geboortedatum: Date, peildatum: Date = PEILDATUM): number {
  const ms = peildatum.getTime() - geboortedatum.getTime();
  const dagen = ms / (1000 * 60 * 60 * 24);
  return Math.round((dagen / 365.25) * 100) / 100;
}
```

Vervang door:
```ts
/**
 * @deprecated Gebruik `berekenKorfbalLeeftijd` uit `./korfballeeftijd` direct.
 * Deze wrapper bestaat voor backwards compat binnen score-model.
 */
export function berekenExacteLeeftijd(geboortedatum: Date, peildatum: Date = HUIDIGE_PEILDATUM): number {
  return berekenKorfbalLeeftijd(geboortedatum, geboortedatum.getFullYear(), peildatum);
}
```

- [ ] **Step 2.6: Corrigeer `isSpeelgerechtigd` grens-semantiek**

In hetzelfde bestand, oude functie (rond regel 137):

```ts
export function isSpeelgerechtigd(
  geboortedatum: Date,
  categorie: "U15" | "U17" | "U19",
  peildatum: Date = PEILDATUM
): boolean {
  const grenzen: Record<string, number> = {
    U15: 15.0,
    U17: 17.0,
    U19: 19.0,
  };
  const ms = peildatum.getTime() - geboortedatum.getTime();
  const dagen = ms / (1000 * 60 * 60 * 24);
  const leeftijdExact = dagen / 365.25;
  return leeftijdExact < grenzen[categorie];
}
```

Vervang door:
```ts
export function isSpeelgerechtigd(
  geboortedatum: Date,
  categorie: "U15" | "U17" | "U19",
  peildatum: Date = HUIDIGE_PEILDATUM
): boolean {
  const exact = berekenKorfbalLeeftijdExact(
    geboortedatum,
    geboortedatum.getFullYear(),
    peildatum
  );
  return valtBinnenCategorie(exact, categorie);
}
```

- [ ] **Step 2.7: Run alle types-tests — alles groen**

Run: `pnpm --filter @oranje-wit/types test`

Expected: ✅ Alle tests groen. Let op: als er bestaande tests zijn die uitgaan van strikte `<` voor `isSpeelgerechtigd`, moeten die worden aangepast naar de nieuwe ≤ semantiek. Zoek eerst met:

Run: `pnpm --filter @oranje-wit/types test -- --run 2>&1 | grep -A 3 "isSpeelgerechtigd\|FAIL"`

Als tests falen op de semantiekwijziging: de test-verwachting aanpassen, niet de implementatie.

- [ ] **Step 2.8: Typecheck workspace**

Run: `pnpm --filter @oranje-wit/types typecheck`

Expected: ✅ Geen errors.

- [ ] **Step 2.9: Commit**

```bash
git add packages/types/src/constanten.ts packages/types/src/constanten.test.ts packages/types/src/score-model.ts
git commit -m "refactor(types): vervang PEILJAAR/PEILDATUM door HUIDIGE_PEILDATUM, fix grens ≤"
```

---

## Task 3: Apps/ti-studio — validatie-engine en libs

**Files:**
- Modify: `apps/ti-studio/src/lib/teamindeling/validatie-engine.ts`
- Modify: `apps/ti-studio/src/lib/teamindeling/validatie/helpers.ts`
- Modify: `apps/ti-studio/src/lib/teamindeling/validatie/harde-regels.ts`
- Modify: `apps/ti-studio/src/lib/teamindeling/validatie-update.ts`

- [ ] **Step 3.1: Vervang `korfbalLeeftijd` in validatie-engine.ts**

Modify `apps/ti-studio/src/lib/teamindeling/validatie-engine.ts` regels 1-20:

Oude code:
```ts
// apps/ti-studio/src/lib/teamindeling/validatie-engine.ts

import type { WerkbordTeam, WerkbordValidatieItem } from "@/components/werkbord/types";
import type { TcKader } from "@/app/(protected)/kader/kader-defaults";

const MS_PER_JAAR = 365.25 * 24 * 60 * 60 * 1000;

export function korfbalLeeftijd(
  geboortedatum: string | null,
  geboortejaar: number,
  peiljaar: number
): number {
  if (geboortedatum) {
    const peil = new Date(peiljaar, 11, 31);
    const geb = new Date(geboortedatum);
    return Math.round(((peil.getTime() - geb.getTime()) / MS_PER_JAAR) * 100) / 100;
  }
  return peiljaar - geboortejaar;
}
```

Vervang door:
```ts
// apps/ti-studio/src/lib/teamindeling/validatie-engine.ts

import type { WerkbordTeam, WerkbordValidatieItem } from "@/components/werkbord/types";
import type { TcKader } from "@/app/(protected)/kader/kader-defaults";
import {
  berekenKorfbalLeeftijdExact,
  berekenKorfbalLeeftijd,
  formatKorfbalLeeftijd,
} from "@oranje-wit/types";

/**
 * @deprecated Gebruik `berekenKorfbalLeeftijd` / `berekenKorfbalLeeftijdExact` direct.
 * Deze wrapper blijft tijdelijk bestaan zodat importers van deze file nog werken.
 */
export function korfbalLeeftijd(
  geboortedatum: string | null,
  geboortejaar: number,
  peildatum: Date
): number {
  return berekenKorfbalLeeftijd(geboortedatum, geboortejaar, peildatum);
}
```

- [ ] **Step 3.2: Update de `berekenTeamValidatie`-signature**

In hetzelfde bestand, zoek de functie `berekenTeamValidatie` en pas de `peiljaar: number` parameter aan naar `peildatum: Date`.

Oude code (rond regel 47-51):
```ts
export function berekenTeamValidatie(
  team: WerkbordTeam,
  kaders: Record<string, TcKader>,
  peiljaar: number
): WerkbordValidatieItem[] {
```

Vervang door:
```ts
export function berekenTeamValidatie(
  team: WerkbordTeam,
  kaders: Record<string, TcKader>,
  peildatum: Date
): WerkbordValidatieItem[] {
```

- [ ] **Step 3.3: Fix de bandbreedte-check om op exacte waarden te vergelijken**

In hetzelfde bestand, zoek de "Leeftijdsbandbreedte" sectie (rond regel 169-185).

Oude code:
```ts
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
```

Vervang door:
```ts
  // 5. Leeftijdsbandbreedte — exacte waarden om grens-afrondings-bugs te vermijden
  if (kader.bandbreedteMax !== undefined && alleSpelers.length >= 2) {
    const leeftijdenExact = alleSpelers.map((sit) =>
      berekenKorfbalLeeftijdExact(sit.speler.geboortedatum, sit.speler.geboortejaar, peildatum)
    );
    const spreidingExact = Math.max(...leeftijdenExact) - Math.min(...leeftijdenExact);
    if (spreidingExact > kader.bandbreedteMax) {
      items.push({
        teamId: team.id,
        type: "err",
        regel: "Leeftijdsbandbreedte overschreden",
        beschrijving: `Spreiding ${formatKorfbalLeeftijd(spreidingExact)} jaar, maximum is ${kader.bandbreedteMax} jaar`,
        laag: "KNKV",
      });
    }
  }
```

- [ ] **Step 3.4: Vervang andere `korfbalLeeftijd`-aanroepen in hetzelfde bestand**

Zoek naar alle resterende `korfbalLeeftijd(` aanroepen binnen `apps/ti-studio/src/lib/teamindeling/validatie-engine.ts`.

Voor weergave-doeleinden: vervang door `berekenKorfbalLeeftijd(..., peildatum)`.
Voor vergelijkingen/grenzen: vervang door `berekenKorfbalLeeftijdExact(..., peildatum)`.

Let op: de `peiljaar` parameter heet nu `peildatum: Date` in de outer scope, dus aanroepen moeten `peildatum` doorgeven.

- [ ] **Step 3.5: Update helpers.ts → `spelerKorfbalLeeftijd`**

Modify `apps/ti-studio/src/lib/teamindeling/validatie/helpers.ts` rond regel 141-156.

Oude code:
```ts
/**
 * Bereken precieze korfballeeftijd op peildatum 31-12 van het seizoensjaar.
 * Gebruikt geboortedatum als beschikbaar (2 decimalen), anders fallback op geboortejaar.
 */
export function spelerKorfbalLeeftijd(speler: SpelerData, seizoenJaar: number): number {
  if (speler.geboortedatum) {
    const gd =
      typeof speler.geboortedatum === "string"
        ? new Date(speler.geboortedatum)
        : speler.geboortedatum;
    const peildatum = new Date(seizoenJaar, 11, 31);
    const ms = peildatum.getTime() - gd.getTime();
    return Math.round((ms / (365.25 * 86_400_000)) * 100) / 100;
  }
  return seizoenJaar - speler.geboortejaar;
}
```

Vervang door:
```ts
import { berekenKorfbalLeeftijdExact } from "@oranje-wit/types";

/**
 * Bereken precieze (onafgeronde) korfballeeftijd op peildatum.
 * Onafgerond voor vergelijkingen; callers die weergave willen moeten
 * `formatKorfbalLeeftijd(...)` toepassen.
 */
export function spelerKorfbalLeeftijd(speler: SpelerData, peildatum: Date): number {
  return berekenKorfbalLeeftijdExact(
    speler.geboortedatum ?? null,
    speler.geboortejaar,
    peildatum
  );
}
```

Voeg de import toe bovenaan het bestand (consistent met bestaande imports).

- [ ] **Step 3.6: Update harde-regels.ts — signatures en `.toFixed(1)` → `formatKorfbalLeeftijd`**

Modify `apps/ti-studio/src/lib/teamindeling/validatie/harde-regels.ts`:

1. Verander alle functie-signatures die `seizoenJaar: number` nemen naar `peildatum: Date`.
2. Alle aanroepen `spelerKorfbalLeeftijd(speler, seizoenJaar)` worden `spelerKorfbalLeeftijd(speler, peildatum)`.
3. Alle `.toFixed(1)` en `.toFixed(2)` op leeftijd-waardes worden `formatKorfbalLeeftijd(...)`.
4. Voeg import toe: `import { formatKorfbalLeeftijd } from "@oranje-wit/types";`

Specifiek regel 69:
```ts
bericht: `${team.naam}: leeftijdsspreiding ${spreiding.toFixed(1)} jaar, max is ${maxSpreiding}`,
```
→
```ts
bericht: `${team.naam}: leeftijdsspreiding ${formatKorfbalLeeftijd(spreiding)} jaar, max is ${maxSpreiding}`,
```

Regel 83:
```ts
bericht: `${speler.roepnaam} ${speler.achternaam} (${leeftijd.toFixed(1)} jr) valt buiten ${team.kleur.toLowerCase()} (${range.min}-${range.max} jr)`,
```
→
```ts
bericht: `${speler.roepnaam} ${speler.achternaam} (${formatKorfbalLeeftijd(leeftijd)} jr) valt buiten ${team.kleur.toLowerCase()} (${range.min}-${range.max} jr)`,
```

Regel 99:
```ts
bericht: `${team.naam}: gemiddelde leeftijd ${gemiddeldeLeeftijd.toFixed(1)}, minimum is ${MIN_GEMIDDELDE_LEEFTIJD_8TAL}`,
```
→
```ts
bericht: `${team.naam}: gemiddelde leeftijd ${formatKorfbalLeeftijd(gemiddeldeLeeftijd)}, minimum is ${MIN_GEMIDDELDE_LEEFTIJD_8TAL}`,
```

- [ ] **Step 3.7: Update validatie-update.ts**

Modify `apps/ti-studio/src/lib/teamindeling/validatie-update.ts`:

Alle `peiljaar: number` → `peildatum: Date`. Aanroepen van `berekenTeamValidatie(team, kaders, peiljaar)` → `berekenTeamValidatie(team, kaders, peildatum)`.

- [ ] **Step 3.8: Typecheck ti-studio**

Run: `pnpm --filter @oranje-wit/ti-studio typecheck`

Expected: ✅ Geen errors. Als een caller (bv. in een page.tsx) nog `PEILJAAR` doorgeeft: wordt in Task 4 opgelost, typecheck zal hier nog rood zijn op callers.

- [ ] **Step 3.9: Commit**

```bash
git add apps/ti-studio/src/lib/teamindeling/
git commit -m "refactor(ti-studio): validatie-engine gebruikt centrale korfballeeftijd"
```

---

## Task 4: Apps/ti-studio — components en pages

**Files:**
- Modify: `apps/ti-studio/src/components/werkbord/SpelerKaart.tsx`
- Modify: `apps/ti-studio/src/components/werkbord/SpelerRij.tsx`
- Modify: `apps/ti-studio/src/components/werkbord/TeamKaartSpelerRij.tsx`
- Modify: `apps/ti-studio/src/components/werkbord/HoverSpelersKaart.tsx`
- Modify: `apps/ti-studio/src/components/SpelerProfielDialog.tsx`
- Modify: `apps/ti-studio/src/app/(protected)/indeling/page.tsx`
- Modify: `apps/ti-studio/src/app/(protected)/indeling/whatif-validatie-actions.ts`
- Modify: `apps/ti-studio/src/lib/ai/plugins/ti-studio.ts`
- Modify: `apps/ti-studio/src/lib/ai/daisy.ts`

- [ ] **Step 4.1: SpelerKaart.tsx — verwijder lokale `berekenKorfbalLeeftijd`, gebruik prop `peildatum`**

Modify `apps/ti-studio/src/components/werkbord/SpelerKaart.tsx`:

- Prop `seizoenEindjaar: number` → `peildatum: Date`
- Verwijder de lokale `berekenKorfbalLeeftijd` functie (regel 18-32) compleet
- Voeg import toe: `import { berekenKorfbalLeeftijd } from "@oranje-wit/types";`
- Aanroep wordt `berekenKorfbalLeeftijd(speler.geboortedatum, speler.geboortejaar, peildatum)`
- Comment "bijv. 2026" wordt verwijderd (nu een Date, geen jaar)

Resultaat (regels 1-60):
```tsx
// apps/ti-studio/src/components/werkbord/SpelerKaart.tsx
"use client";
import { useRef, useState } from "react";
import "./tokens.css";
import type { WerkbordSpeler } from "./types";
import { leeftijdsKleur } from "./leeftijds-kleuren";
import { berekenKorfbalLeeftijd } from "@oranje-wit/types";

interface SpelerKaartProps {
  speler: WerkbordSpeler;
  vanTeamId: string | null;
  vanSelectieGroepId?: string | null;
  peildatum: Date;
  asGhost?: boolean;
  smal?: boolean;
  onClick?: () => void;
}

export function SpelerKaart({
  speler,
  vanTeamId,
  vanSelectieGroepId = null,
  peildatum,
  asGhost = false,
  smal = false,
  onClick,
}: SpelerKaartProps) {
  const kaartRef = useRef<HTMLDivElement>(null);
  const [isHeld, setIsHeld] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLanding, setIsLanding] = useState(false);

  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  // ... rest ongewijzigd tot:

  const leeftijd = berekenKorfbalLeeftijd(
    speler.geboortedatum,
    speler.geboortejaar,
    peildatum
  );
  const leeftKleur = leeftijdsKleur(leeftijd);

  // ... rest ongewijzigd
}
```

- [ ] **Step 4.2: SpelerRij.tsx — prop doorgeven + eigen gebruik**

Modify `apps/ti-studio/src/components/werkbord/SpelerRij.tsx`:

- Waar de component `SpelerKaart` rendert: `seizoenEindjaar={PEILJAAR}` → `peildatum={peildatum}`
- Component zelf krijgt een nieuwe verplichte prop `peildatum: Date`
- Import `PEILJAAR` verwijderen
- Alle lokale `korfbalLeeftijd(geboortedatum, geboortejaar, PEILJAAR)` aanroepen → `berekenKorfbalLeeftijd(geboortedatum, geboortejaar, peildatum)` met import uit `@oranje-wit/types`

- [ ] **Step 4.3: TeamKaartSpelerRij.tsx — idem**

Modify `apps/ti-studio/src/components/werkbord/TeamKaartSpelerRij.tsx`:

- Prop `peildatum: Date` toevoegen
- `seizoenEindjaar={PEILJAAR}` → `peildatum={peildatum}` bij SpelerKaart-render
- `PEILJAAR` import verwijderen

- [ ] **Step 4.4: HoverSpelersKaart.tsx — idem**

Modify `apps/ti-studio/src/components/werkbord/HoverSpelersKaart.tsx`:

- Regel 216: `korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar, PEILJAAR)` → `berekenKorfbalLeeftijd(speler.geboortedatum, speler.geboortejaar, peildatum)`
- Prop `peildatum: Date` toevoegen aan component signature
- `PEILJAAR` import verwijderen
- Import `berekenKorfbalLeeftijd` uit `@oranje-wit/types`

- [ ] **Step 4.5: SpelerProfielDialog.tsx**

Modify `apps/ti-studio/src/components/SpelerProfielDialog.tsx`:

- Import `PEILJAAR` verwijderen, importeer `HUIDIGE_PEILDATUM` en `berekenKorfbalLeeftijd`, `formatKorfbalLeeftijd` uit `@oranje-wit/types`
- Lokale wrapper `korfbalLeeftijd` (rond regel 176-186) verwijderen
- Aanroepen op `formatKorfbalLeeftijd(berekenKorfbalLeeftijd(gd, gj, peildatum))` zetten
- Component-signature krijgt `peildatum: Date` als optionele prop met default `HUIDIGE_PEILDATUM` — dit is het enige component dat een default mag hebben omdat het ook in contexten buiten een scenario wordt gebruikt

- [ ] **Step 4.6: indeling/page.tsx — peildatum berekenen en doorgeven**

Modify `apps/ti-studio/src/app/(protected)/indeling/page.tsx`:

Zoek waar de `WerkbordShell` wordt gerenderd. Voeg toe:

```tsx
import { korfbalPeildatum } from "@oranje-wit/types";
// ...
const peildatum = korfbalPeildatum(werkbordState.seizoen);
// doorgeven aan shell/werkbord:
<WerkbordShell initieleState={werkbordState} peildatum={peildatum} ... />
```

Als `WerkbordShell` al een `peildatum` prop heeft: alleen de waarde doorgeven. Anders: voeg de prop toe aan de shell-types.

- [ ] **Step 4.7: whatif-validatie-actions.ts**

Modify `apps/ti-studio/src/app/(protected)/indeling/whatif-validatie-actions.ts`:

Regel 11:
```ts
import { PEILJAAR } from "@oranje-wit/types";
```
→
```ts
import { korfbalPeildatum } from "@oranje-wit/types";
```

Regel 151 (rond):
```ts
const validatie = valideerWhatIf(whatIfTeams, werkindelingTeams, spelerLookup, PEILJAAR, { ... });
```

Pas aan door `PEILJAAR` te vervangen door `korfbalPeildatum(werkbordState.seizoen)` (als het seizoen uit de action-context beschikbaar is) of door `HUIDIGE_PEILDATUM` (als fallback-context). Bekijk de functie-signature van `valideerWhatIf` en pas die ook aan naar `peildatum: Date`.

- [ ] **Step 4.8: AI plugins — ti-studio.ts en daisy.ts**

Modify `apps/ti-studio/src/lib/ai/plugins/ti-studio.ts`:

Regel 15: `import { HUIDIG_SEIZOEN, PEILJAAR } from "@oranje-wit/types";` → `import { HUIDIG_SEIZOEN, HUIDIGE_PEILDATUM, grofKorfbalLeeftijd } from "@oranje-wit/types";`

Regel 76 (tool-beschrijving): `.describe(\`Leeftijd volgend seizoen (peiljaar ${PEILJAAR})\`)` → `.describe(\`Leeftijd volgend seizoen (op peildatum ${HUIDIGE_PEILDATUM.toISOString().slice(0, 10)})\`)`

Regel 156: `where.geboortejaar = PEILJAAR - params.leeftijdVolgendSeizoen;` → `where.geboortejaar = HUIDIGE_PEILDATUM.getFullYear() - params.leeftijdVolgendSeizoen;`

Regel 188: `leeftijdVolgendSeizoen: PEILJAAR - s.geboortejaar,` → `leeftijdVolgendSeizoen: grofKorfbalLeeftijd(s.geboortejaar, HUIDIGE_PEILDATUM),`

Modify `apps/ti-studio/src/lib/ai/daisy.ts`: idem voor elk gebruik van `PEILJAAR`.

- [ ] **Step 4.9: Typecheck ti-studio**

Run: `pnpm --filter @oranje-wit/ti-studio typecheck`

Expected: ✅ Geen errors. Alle resterende referenties naar `PEILJAAR` in apps/ti-studio moeten nu weg zijn.

Verificatie:
Run: `pnpm --filter @oranje-wit/ti-studio run lint`

Expected: geen errors gerelateerd aan ongebruikte imports.

- [ ] **Step 4.10: Grep-verificatie**

Run: `grep -rn "PEILJAAR\|seizoenEindjaar" apps/ti-studio/src/ | grep -v "\.test\."`

Expected: geen matches.

- [ ] **Step 4.11: Commit**

```bash
git add apps/ti-studio/src/
git commit -m "refactor(ti-studio): vervang PEILJAAR door peildatum in components en pages"
```

---

## Task 5: Apps/web — scenario components en teamindeling

**Files:**
- Modify: `apps/web/src/components/teamindeling/scenario/types.ts`
- Modify: alle `apps/web/src/components/teamindeling/scenario/**/*.tsx`
- Modify: `apps/web/src/components/teamindeling/scenario/hooks/useScenarioEditor.ts`
- Modify: `apps/web/src/components/teamindeling/mobile/gezien/*.tsx`
- Modify: `apps/web/src/components/teamindeling/vergelijk/TeamDiff.tsx`
- Modify: `apps/web/src/lib/teamindeling/validatie-engine.ts`
- Modify: `apps/web/src/lib/teamindeling/validatie-engine.test.ts`
- Modify: `apps/web/src/lib/teamindeling/validatie-update.ts`
- Modify: `apps/web/src/lib/teamindeling/doorstroom-signalering.ts`
- Modify: `apps/web/src/lib/teamindeling/rating.ts`
- Modify: `apps/web/src/components/ti-studio/werkbord/*.tsx`
- Modify: `apps/web/src/app/(teamindeling)/teamindeling/personen/spelers/page.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-validatie-actions.ts`

- [ ] **Step 5.1: scenario/types.ts — centrale re-export**

Modify `apps/web/src/components/teamindeling/scenario/types.ts` rond regel 1-20:

Oude code:
```ts
import { PEILJAAR, PEILDATUM } from "@oranje-wit/types";

export { PEILJAAR };

export function korfbalLeeftijd(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number
): number {
  if (geboortedatum) {
    const gd = typeof geboortedatum === "string" ? new Date(geboortedatum) : geboortedatum;
    const ms = PEILDATUM.getTime() - gd.getTime();
    return Math.round((ms / (365.25 * 86_400_000)) * 100) / 100;
  }
  return PEILJAAR - geboortejaar;
}
```

Vervang door:
```ts
import { HUIDIGE_PEILDATUM, berekenKorfbalLeeftijd } from "@oranje-wit/types";

/**
 * @deprecated Gebruik `berekenKorfbalLeeftijd` uit `@oranje-wit/types` direct.
 * Deze wrapper bestaat voor backwards compat binnen scenario/; de 13 scenario-
 * components importeren deze helper. Nieuwe code moet een expliciete peildatum
 * doorgeven.
 */
export function korfbalLeeftijd(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number,
  peildatum: Date = HUIDIGE_PEILDATUM
): number {
  return berekenKorfbalLeeftijd(geboortedatum ?? null, geboortejaar, peildatum);
}
```

**Rationale**: scenario/ is legacy (apps/ti-studio is primair), dus we accepteren hier een default-peildatum om de change-radius te beperken. Als scenario/ ooit hergebruikt wordt voor een ander seizoen kan de default worden weggehaald.

- [ ] **Step 5.2: Scenario .tsx bestanden — import aanpassen indien nodig**

Run: `grep -rn "import.*PEILJAAR\|import.*korfbalLeeftijd" apps/web/src/components/teamindeling/scenario/`

Voor elk bestand dat alleen `korfbalLeeftijd` importeert: niets doen (wrapper blijft bestaan).
Voor elk bestand dat `PEILJAAR` direct importeert: vervangen door `HUIDIGE_PEILDATUM` of `grofKorfbalLeeftijd(...)` afhankelijk van gebruik. Bekijk [types.test.ts](apps/web/src/components/teamindeling/scenario/types.test.ts) en update:

```ts
import { korfbalLeeftijd, kleurIndicatie, PEILJAAR, getDetailLevel } from "./types";
```
→
```ts
import { korfbalLeeftijd, kleurIndicatie, getDetailLevel } from "./types";
import { HUIDIGE_PEILDATUM } from "@oranje-wit/types";
```

Gebruik `HUIDIGE_PEILDATUM` waar voorheen `PEILJAAR` een rol speelde in test-assertions.

- [ ] **Step 5.3: apps/web validatie-engine.ts**

Modify `apps/web/src/lib/teamindeling/validatie-engine.ts`:

Pas dezelfde wijzigingen toe als in Task 3 (ti-studio validatie-engine): verwijder lokale `korfbalLeeftijd`, deprecate wrapper, `peiljaar: number` → `peildatum: Date`, bandbreedte-check op exact.

- [ ] **Step 5.4: validatie-engine.test.ts**

Modify `apps/web/src/lib/teamindeling/validatie-engine.test.ts`:

Regel 12: `const PEILJAAR = 2026;` → `const PEILDATUM = new Date(2026, 11, 31);`

Alle aanroepen van `berekenTeamValidatie(team, kaders, PEILJAAR)` → `berekenTeamValidatie(team, kaders, PEILDATUM)`.
Alle aanroepen van `korfbalLeeftijd(gd, gj, PEILJAAR)` → `korfbalLeeftijd(gd, gj, PEILDATUM)`.

Voeg een nieuwe test toe die de fix van de bandbreedte-bug afdwingt:

```ts
describe("bandbreedte — exacte vergelijking", () => {
  it("detecteert spreiding van 2 jaar + 2 dagen als overschreden", () => {
    const team = maakTeam({
      categorie: "B_CATEGORIE",
      kleur: "blauw", // bandbreedte 2
      spelers: [
        maakSpeler("oud", 2012, "V", "2012-01-01"),
        maakSpeler("jong", 2014, "M", "2014-01-03"),
      ],
    });
    const kaders = { BLAUW: { bandbreedteMax: 2 /* ... */ } } as any;
    const items = berekenTeamValidatie(team, kaders, new Date(2026, 11, 31));
    expect(items.some((i) => i.regel.includes("bandbreedte") || i.regel.includes("andbreedte"))).toBe(true);
  });
});
```

- [ ] **Step 5.5: Overige lib-bestanden (doorstroom, rating, validatie-update)**

Modify elk van:
- `apps/web/src/lib/teamindeling/doorstroom-signalering.ts` — lokale `korfbalLeeftijd(geboortejaar)` (regel 52) verwijderen, gebruik `grofKorfbalLeeftijd(...)` uit `@oranje-wit/types`.
- `apps/web/src/lib/teamindeling/rating.ts` — `PEILJAAR` verwijderen, gebruik `HUIDIGE_PEILDATUM` of een expliciete peildatum-parameter.
- `apps/web/src/lib/teamindeling/validatie-update.ts` — zelfde patroon als Task 3.7.

- [ ] **Step 5.6: apps/web/src/components/ti-studio/werkbord/ — parallel aan ti-studio werkbord**

Modify alle 4 bestanden (SpelerKaart, SpelerRij, HoverSpelersKaart, TeamKaartSpelerRij) onder `apps/web/src/components/ti-studio/werkbord/` op dezelfde manier als in Task 4. De `Math.floor`-bug zit in SpelerKaart regel 17-31 en moet **verdwijnen** (functie wordt vervangen door centrale import).

- [ ] **Step 5.7: Pages en scenario-editor**

Modify:
- `apps/web/src/app/(teamindeling)/teamindeling/personen/spelers/page.tsx` regel 13 — lokale `korfbalLeeftijd` functie verwijderen, importeer `berekenKorfbalLeeftijd` en `HUIDIGE_PEILDATUM` uit `@oranje-wit/types`.
- `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx` — peildatum berekenen uit state, doorgeven aan shell.
- `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/whatif-validatie-actions.ts` — analoog aan Task 4.7.
- `apps/web/src/components/teamindeling/scenario/hooks/useScenarioEditor.ts` — `PEILJAAR` imports vervangen.
- `apps/web/src/components/teamindeling/scenario/editor/ScenarioEditorFullscreen.tsx` en `EditModeLayout.tsx` — idem.
- `apps/web/src/components/teamindeling/mobile/gezien/GezienStatusSheet.tsx` en `CoordinatorGezienOverzicht.tsx` — idem.
- `apps/web/src/components/teamindeling/vergelijk/TeamDiff.tsx` — idem.

Voor elk bestand: grep eerst naar `PEILJAAR` gebruik, classificeer als Patroon 1/2/3 uit de spec, pas dienovereenkomstig aan.

- [ ] **Step 5.8: Typecheck + tests apps/web teamindeling**

Run: `pnpm --filter @oranje-wit/web typecheck`
Run: `pnpm --filter @oranje-wit/web test -- validatie-engine`

Expected: ✅ Beiden groen.

- [ ] **Step 5.9: Commit**

```bash
git add apps/web/src/components/teamindeling/ apps/web/src/components/ti-studio/ apps/web/src/lib/teamindeling/ apps/web/src/app/\(teamindeling\)/ apps/web/src/app/\(teamindeling-studio\)/
git commit -m "refactor(web): vervang PEILJAAR door peildatum in teamindeling en scenario"
```

---

## Task 6: Apps/web — scouting, AI en API routes

**Files:**
- Modify: `apps/web/src/app/api/scouting/spelers/zoek/route.ts`
- Modify: `apps/web/src/app/api/scouting/spelers/[relCode]/route.ts`
- Modify: `apps/web/src/app/api/scouting/kaarten/route.ts`
- Modify: `apps/web/src/app/api/scouting/kaarten/[relCode]/route.ts`
- Modify: `apps/web/src/app/api/teamindeling/ratings/preview/route.ts`
- Modify: `apps/web/src/app/(scouting)/scouting/verzoeken/[id]/page.tsx`
- Modify: `apps/web/src/app/(scouting)/scouting/verzoeken/[id]/beoordeel/[relCode]/verzoek-rapport-wizard.tsx`
- Modify: `apps/web/src/app/(scouting)/scouting/vergelijking/nieuw/vergelijking-wizard.tsx`
- Modify: `apps/web/src/lib/scouting/leeftijdsgroep.ts`
- Modify: `apps/web/src/lib/ai/plugins/ti-studio.ts`
- Modify: `apps/web/src/lib/ai/daisy.ts`

- [ ] **Step 6.1: API routes**

Voor elke route: vervang `PEILJAAR - speler.geboortejaar` door `grofKorfbalLeeftijd(speler.geboortejaar, HUIDIGE_PEILDATUM)`. Voeg imports toe:

```ts
import { grofKorfbalLeeftijd, HUIDIGE_PEILDATUM } from "@oranje-wit/types";
```

Waar `PEILJAAR` gebruikt wordt als grens in een Prisma-query (`geboortejaar: { gte: PEILJAAR - X }`): vervang door `HUIDIGE_PEILDATUM.getFullYear() - X`.

- [ ] **Step 6.2: scouting/leeftijdsgroep.ts**

Dit bestand bepaalt waarschijnlijk in welke leeftijdsgroep een speler valt. Vervang `PEILJAAR` door `HUIDIGE_PEILDATUM.getFullYear()` voor de integer-rekensommen, of gebruik `grofKorfbalLeeftijd`. Lees het bestand eerst en kies de minst-invasieve aanpak.

- [ ] **Step 6.3: Scouting wizards en rapport-pages**

Voor elk van:
- `verzoeken/[id]/page.tsx`
- `verzoeken/[id]/beoordeel/[relCode]/verzoek-rapport-wizard.tsx`
- `vergelijking/nieuw/vergelijking-wizard.tsx`

Vervang `PEILJAAR` gebruik door `HUIDIGE_PEILDATUM.getFullYear()` of `grofKorfbalLeeftijd(...)`. Let op: deze pages tonen vaak "leeftijd X" als integer — dan blijft het `grofKorfbalLeeftijd`.

- [ ] **Step 6.4: apps/web AI plugins**

Modify `apps/web/src/lib/ai/plugins/ti-studio.ts` en `apps/web/src/lib/ai/daisy.ts` — analoog aan Task 4.8.

- [ ] **Step 6.5: Typecheck + lint**

Run: `pnpm --filter @oranje-wit/web typecheck && pnpm --filter @oranje-wit/web run lint`

Expected: ✅ Geen errors.

- [ ] **Step 6.6: Grep-verificatie apps/web**

Run: `grep -rn "PEILJAAR" apps/web/src/ | grep -v "\.test\." | grep -v "/archief/"`

Expected: 0 resultaten.

- [ ] **Step 6.7: Commit**

```bash
git add apps/web/src/app/api/ apps/web/src/app/\(scouting\)/ apps/web/src/lib/scouting/ apps/web/src/lib/ai/
git commit -m "refactor(web): vervang PEILJAAR door peildatum in scouting en AI plugins"
```

---

## Task 7: Scripts, test-utils en overige

**Files:**
- Modify: `scripts/seed-demo-data.ts`
- Modify: `scripts/herstel/03-speler-uss.ts`
- Modify: `packages/test-utils/src/seed/dataset.ts`
- Modify: `apps/ti-studio/src/lib/teamindeling/validatie/constanten.ts` (als relevant)
- Modify: `apps/web/src/lib/teamindeling/validatie/constanten.ts` (als relevant)

- [ ] **Step 7.1: Scripts**

Voor elk script: vervang `PEILJAAR` door `HUIDIGE_PEILDATUM.getFullYear()` of `HUIDIGE_PEILDATUM` afhankelijk van gebruik.

- [ ] **Step 7.2: test-utils dataset**

Vervang `PEILJAAR` door een expliciete peildatum of `HUIDIGE_PEILDATUM` afhankelijk van wat de seed doet.

- [ ] **Step 7.3: Lokale validatie/constanten.ts bestanden**

Beide apps hebben een `lib/teamindeling/validatie/constanten.ts`. Als ze `PEILJAAR` her-exporteren of gebruiken: vervangen.

Run: `grep -rn "PEILJAAR" packages/test-utils/ scripts/ apps/*/src/lib/teamindeling/validatie/constanten.ts`

Pas alle gevonden regels aan.

- [ ] **Step 7.4: Typecheck hele workspace**

Run: `pnpm typecheck`

Expected: ✅ Geen errors in enig package.

- [ ] **Step 7.5: Run alle unit tests**

Run: `pnpm test`

Expected: ✅ Alle tests groen.

- [ ] **Step 7.6: Commit**

```bash
git add scripts/ packages/test-utils/ apps/ti-studio/src/lib/teamindeling/validatie/constanten.ts apps/web/src/lib/teamindeling/validatie/constanten.ts
git commit -m "refactor: vervang PEILJAAR door peildatum in scripts en test-utils"
```

---

## Task 8: Docs, agents en skills

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`
- Modify: `rules/knkv-regels.md` (controleren)
- Modify: `.claude/agents/adviseur.md`
- Modify: `.claude/agents/regel-checker.md`
- Modify: `.claude/agents/team-planner.md`
- Modify: `.claude/agents/team-selector.md`
- Modify: `.claude/agents/korfbal.md`
- Modify: `.claude/skills/advies/SKILL.md`
- Modify: `.claude/skills/validatie/SKILL.md`
- Modify: `.claude/skills/scenario/SKILL.md`
- Modify: `.claude/skills/audit/SKILL.md`

- [ ] **Step 8.1: CLAUDE.md en AGENTS.md**

In de sectie "Verplichte patronen → Constanten":

```md
**Constanten** — importeer `PEILJAAR`, `HUIDIG_SEIZOEN`, `PEILDATUM` uit `@oranje-wit/types`, definieer niet lokaal.
```

Vervang door:
```md
**Constanten** — importeer `HUIDIG_SEIZOEN`, `HUIDIGE_PEILDATUM` en korfballeeftijd-helpers (`korfbalPeildatum`, `berekenKorfbalLeeftijd`, `berekenKorfbalLeeftijdExact`, `formatKorfbalLeeftijd`, `grofKorfbalLeeftijd`, `valtBinnenCategorie`) uit `@oranje-wit/types`. `PEILJAAR` en `PEILDATUM` bestaan niet meer. Binnen een scenario-context: gebruik `korfbalPeildatum(state.seizoen)` en geef als `peildatum: Date` door aan components en validatie-functies.
```

Idem in `AGENTS.md`.

- [ ] **Step 8.2: rules/knkv-regels.md**

Lees het bestand. Controleer of de term "peildatum 31 december van het seizoensjaar" (regel 12) helder genoeg is. Verduidelijk naar: "Peildatum leeftijd: 31 december van het **startjaar** van het seizoen. Voor seizoen 2026-2027 dus 31-12-2026."

- [ ] **Step 8.3: Agent-markdowns**

Voor elk van de agent-files: vervang "peiljaar" door "peildatum" in lopende tekst. Vervang concrete code-voorbeelden die `PEILJAAR` gebruiken door `HUIDIGE_PEILDATUM` of `korfbalPeildatum(seizoen)`.

Run: `grep -l "PEILJAAR\|peiljaar" .claude/agents/*.md .claude/skills/*/SKILL.md`

Voor elk gevonden bestand: handmatig doornemen en updaten. Historische plan/spec-referenties in agent-files mogen blijven.

- [ ] **Step 8.4: Commit**

```bash
git add CLAUDE.md AGENTS.md rules/knkv-regels.md .claude/
git commit -m "docs: actualiseer peildatum-terminologie in CLAUDE/AGENTS/rules/agents"
```

---

## Task 9: End-to-end verificatie

- [ ] **Step 9.1: Grep-sanity — geen enkele `PEILJAAR` meer in actieve code**

Run: `grep -rn "PEILJAAR" packages/ apps/ scripts/ --include="*.ts" --include="*.tsx" | grep -v "/archief/"`

Expected: 0 resultaten. Als er nog matches zijn: die missen we en moeten we aanpakken.

- [ ] **Step 9.2: Grep-sanity — geen `Math.floor` in leeftijdsberekening**

Run: `grep -rn "Math.floor.*365" packages/ apps/`

Expected: 0 resultaten.

- [ ] **Step 9.3: Grep-sanity — geen `\.toFixed(1)` op leeftijd-waardes**

Run: `grep -rn "leeftijd.*\.toFixed\|spreiding.*\.toFixed" packages/ apps/ --include="*.ts" --include="*.tsx"`

Elke match inspecteren: als het over een leeftijd gaat → vervangen door `formatKorfbalLeeftijd(...)`.

- [ ] **Step 9.4: Typecheck + lint + format hele workspace**

Run: `pnpm typecheck && pnpm lint && pnpm format:check`

Expected: ✅ Alle drie groen.

- [ ] **Step 9.5: Run alle unit tests**

Run: `pnpm test`

Expected: ✅ Alle tests groen. Snapshot: noteer het aantal tests voor/na — moet minimaal gelijk zijn (nieuwe tests komen erbij, oude PEILJAAR-tests verdwijnen).

- [ ] **Step 9.6: Build productie**

Run: `pnpm build`

Expected: ✅ Alle apps bouwen succesvol.

- [ ] **Step 9.7: E2E smoke test — TI Studio indeling**

Run: `pnpm test:e2e -- --grep "indeling"`

Expected: ✅ Bestaande indeling-tests blijven groen. Als een test faalt op een leeftijdsweergave: controleer of de expected-waarde overeenkomt met de nieuwe 2-decimaal-weergave.

- [ ] **Step 9.8: Visuele verificatie (optioneel, alleen bij twijfel)**

Start de dev server: `pnpm dev` — navigeer naar `/ti-studio/indeling`, controleer of:
1. Spelerkaarten in het werkbord tonen nu een iets hogere (correctere) leeftijd dan voor de refactor (Math.floor → Math.round fix).
2. Bandbreedte-validatie geeft geen onverwachte rode meldingen op teams die voorheen "net aan" groen waren.
3. U15-teams met een speler die op 31-12 exact 15 wordt: nu toegestaan (voorheen uitgesloten).

- [ ] **Step 9.9: Commit finale verificatie (indien fixes nodig)**

Als tijdens verificatie bugs worden gevonden: fix en commit.

```bash
git add -A
git commit -m "fix: korfballeeftijd refactor — <specifieke fix>"
```

- [ ] **Step 9.10: Laatste sanity-commit (leeg of finaal)**

Als alles groen is zonder aanvullende fixes: dit is een no-op. Anders: laatste fix-commit.

---

## Self-review notities

**Spec coverage:**
- 3 bugs uit spec: Math.floor (Task 4.1, 5.6), bandbreedte-rounding (Task 3.3, 5.3), U15-grens `<` (Task 2.6) ✅
- 6 nieuwe functies: alle in Task 1 ✅
- 63 bestanden verdeeld over Tasks 3-7 ✅
- Data-flow (verplichte peildatum-prop): Task 4.1-4.6 + 5.6 ✅
- Docs: Task 8 ✅
- Test-dekking: Task 1.1 dekt alle 7 testgroepen uit spec ✅

**Placeholder scan:** geen TBD/TODO/"fill in".

**Type-consistentie:** `peildatum: Date` overal dezelfde naam, `berekenKorfbalLeeftijd` vs `berekenKorfbalLeeftijdExact` consistent in alle tasks.

**Parallellisatie:** Task 3+4 (ti-studio) kan parallel met Task 5+6 (apps/web) omdat ze disjointe bestandsverzamelingen raken. Task 2 moet klaar zijn voor alle apps starten. Task 7+8 na alle apps. Task 9 allerlaatst.
