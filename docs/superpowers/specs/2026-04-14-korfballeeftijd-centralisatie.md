# Korfballeeftijd — centralisatie en correctheid

**Datum:** 2026-04-14
**Status:** Ontwerp ter review
**Scope:** Hele repo (`packages/types`, `apps/ti-studio`, `apps/web`, docs, agents)

## Probleem

Korfballeeftijd wordt op minstens **zes plekken** afzonderlijk berekend, met onderling afwijkende implementaties en semantiek. Dit veroorzaakt drie concrete bugs:

1. **`Math.floor` in werkbord-kaarten.** [apps/ti-studio/src/components/werkbord/SpelerKaart.tsx:18](../../../apps/ti-studio/src/components/werkbord/SpelerKaart.tsx#L18) en [apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx:17](../../../apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx#L17) gebruiken `Math.floor((ms / jaarMs) * 100) / 100` in plaats van `Math.round`. Gevolg: spelerskaarten in het werkbord tonen een systematisch té lage leeftijd (tot 0.01 jaar afwijking).

2. **Bandbreedte-overschrijdingen glippen door de validatie.** [apps/ti-studio/src/lib/teamindeling/validatie-engine.ts:176](../../../apps/ti-studio/src/lib/teamindeling/validatie-engine.ts#L176) berekent de spreiding op **afgeronde** leeftijden (`Math.round((maxL - minL) * 100) / 100`). Als de echte spreiding 2.004 jaar is, kan de dubbele afronding dit tot 2.00 terugbrengen, waarna de check `spreiding > 2` ten onrechte fout retourneert.

3. **U15/U17/U19 grens-check is strikt `<` in score-model.** [packages/types/src/score-model.ts:151](../../../packages/types/src/score-model.ts#L151) gebruikt `leeftijdExact < grenzen[categorie]`. Per KNKV-regel en TC-wens is de grens "≤ 15.00" — een speler met exact 15.00 (geboren 31-12 vijftien jaar vóór peildatum) moet nog U15 mogen spelen. De huidige code sluit hem uit.

Daarnaast is er **conceptuele verwarring**:

- `packages/types/src/constanten.ts` definieert zowel `PEILJAAR = 2026` als `HUIDIG_SEIZOEN = "2025-2026"`. De peildatum voor het huidige seizoen 2025-2026 is volgens KNKV 31‑12‑**2025**, dus `PEILJAAR` loopt één jaar voor — blijkbaar omdat TI Studio al indelingen voor 2026‑2027 maakt.
- [apps/ti-studio/src/components/werkbord/SpelerKaart.tsx:12](../../../apps/ti-studio/src/components/werkbord/SpelerKaart.tsx#L12) heet de prop `seizoenEindjaar` (met comment "bijv. 2026"), maar per definitie is 2026 het **startjaar** van seizoen 2026‑2027. De variabelenaam is dus misleidend.

De term "peiljaar" is ongelukkig: KNKV kent alleen een **peildatum** (31 december van het startjaar van het seizoen). Een jaartal laat zich makkelijk verkeerd interpreteren; een `Date` niet.

## Doelen

1. Eén bron van waarheid voor korfballeeftijd-berekening en peildatum-bepaling.
2. Correcte grens- en bandbreedte-semantiek op **onafgeronde** waarden.
3. Consistente weergave als `"14.99"` (2 decimalen) via één format-functie.
4. `PEILJAAR` verdwijnt uit de codebase; wordt vervangen door `peildatum: Date`, afgeleid uit een seizoen-string.
5. `seizoenEindjaar` als propnaam verdwijnt; wordt `peildatum`.
6. Alle bestaande validatie-tests blijven groen; nieuwe tests dekken de eerder vermelde bugs.

## Non-doelen

- De `HUIDIG_SEIZOEN` constante wordt niet aangepast — dat is onderdeel van de seizoens-rollover en valt buiten deze refactor.
- Historische plan- en spec-documenten in `docs/superpowers/plans/2026-04-*` en `docs/design/archief/*` worden niet aangepast — die beschrijven het werk zoals het toen was.
- De bestaande `berekenExacteLeeftijd` in `score-model.ts` blijft tijdelijk bestaan als thin wrapper (deprecated) om de diff klein te houden waar score-model intern de functie aanroept; een volgende pass kan hem verwijderen.

## Architectuur

### Nieuwe module: `packages/types/src/korfballeeftijd.ts`

```ts
import type { Seizoen } from "./index";

/**
 * Peildatum voor een seizoen: 31 december van het startjaar.
 * Voorbeelden:
 *   "2025-2026" → 31-12-2025
 *   "2026-2027" → 31-12-2026
 *
 * Dit volgt de KNKV-regel "peildatum = 31 december van het seizoensjaar",
 * waar "seizoensjaar" wordt geïnterpreteerd als het kalenderjaar waarin
 * het seizoen start.
 */
export function korfbalPeildatum(seizoen: Seizoen): Date;

/**
 * Exacte korfballeeftijd op de peildatum, onafgerond.
 *
 * GEBRUIK VOOR:
 *  - Grens-checks (U15/U17/U19 speelgerechtigdheid)
 *  - Bandbreedte-spreiding (max spreiding binnen een team)
 *  - Elke vergelijking waar precisie boven weergave gaat
 *
 * Als `geboortedatum` ontbreekt valt de functie terug op
 * `peildatum.getFullYear() - geboortejaar` (heel-jaren-leeftijd).
 * Deze fallback is onvermijdelijk minder precies en mag in de UI
 * alleen worden getoond met `formatKorfbalLeeftijd`.
 */
export function berekenKorfbalLeeftijdExact(
  geboortedatum: Date | string | null,
  geboortejaar: number,
  peildatum: Date
): number;

/**
 * Afgeronde korfballeeftijd op 2 decimalen.
 *
 * GEBRUIK VOOR:
 *  - Weergave in componenten waar een numerieke waarde nodig is
 *    voordat hij wordt geformat (bv. sortering op de afgeronde waarde).
 *
 * Voor grens- en bandbreedte-validatie ALTIJD
 * `berekenKorfbalLeeftijdExact` gebruiken.
 */
export function berekenKorfbalLeeftijd(
  geboortedatum: Date | string | null,
  geboortejaar: number,
  peildatum: Date
): number;

/**
 * Integer korfballeeftijd alleen op basis van geboortejaar.
 * Gebruik voor API-filters, scouting-range-queries en overige
 * plekken waar de oude `PEILJAAR - geboortejaar` werd gebruikt.
 */
export function grofKorfbalLeeftijd(geboortejaar: number, peildatum: Date): number;

/**
 * Weergave als "14.99" — altijd 2 decimalen, geen afkapping, geen eenheid.
 * De enige toegestane weergave-helper; `.toFixed(1)` en `.toFixed(2)`
 * aanroepen op leeftijd-waardes is na deze refactor een anti-pattern.
 */
export function formatKorfbalLeeftijd(leeftijd: number): string;

/**
 * Grens-check: is `exact` ≤ de categoriegrens, rekening houdend met
 * floating-point noise? Accepteert afwijkingen < 1e-9 als gelijk.
 *
 * Voorbeelden (peildatum 31-12-2026):
 *   geboren 31-12-2011 → exact ≈ 15.000  → valtBinnen("U15") === true
 *   geboren 30-12-2011 → exact ≈ 15.0027 → valtBinnen("U15") === false
 */
export function valtBinnenCategorie(
  exact: number,
  categorie: "U15" | "U17" | "U19"
): boolean;
```

### Constanten: `packages/types/src/constanten.ts`

**Verwijderen:**
- `PEILJAAR`
- `PEILDATUM`

**Behouden:**
- `HUIDIG_SEIZOEN` — blijft de enige bron van "welk seizoen is nu actief".

**Toevoegen:**
- `HUIDIGE_PEILDATUM: Date` — afgeleid van `korfbalPeildatum(HUIDIG_SEIZOEN)`. Alleen gebruiken op plekken zonder scenario-context (personen-overzichten, scouting-lijsten).

### Deprecatie: `packages/types/src/score-model.ts`

- `berekenExacteLeeftijd` wordt een thin re-export/wrapper rond `berekenKorfbalLeeftijd`.
- `isSpeelgerechtigd` wordt geherimplementeerd via `berekenKorfbalLeeftijdExact` + `valtBinnenCategorie`. De bestaande strikte `<` vergelijking wordt `≤` — dit is een gedragswijziging die tests zal raken.

## Semantiek

### Grens-check (U15/U17/U19)

```ts
const exact = berekenKorfbalLeeftijdExact(gd, gj, peildatum);
if (valtBinnenCategorie(exact, "U15")) { /* speelgerechtigd */ }
```

Waar `valtBinnenCategorie(exact, "U15")` ≡ `exact <= 15.00 + 1e-9`.

De FP-tolerantie 1e-9 is ruim kleiner dan het kleinste echte verschil (1 dag ≈ 0.00274 jaar), dus hij verstoort geen echte grens-cases, maar vangt wel `14.9999999...` artefacten van floating-point deling.

**Wat de gebruiker bedoelde:** een speler met `exact ≤ 15.00` mag U15, een speler met `exact ≥ 15.001` niet. Omdat het kleinste bereikbare verschil 1 dag is (≈ 0.00274 jaar), valt elke speler in de praktijk óf op exact 15.00 (toegestaan) óf op ≥ 15.00274 (niet toegestaan). Er bestaan geen tussengelegen waarden om ons zorgen over te maken.

### Bandbreedte-check

```ts
const leeftijden = spelers.map((s) =>
  berekenKorfbalLeeftijdExact(s.geboortedatum, s.geboortejaar, peildatum)
);
const spreidingExact = Math.max(...leeftijden) - Math.min(...leeftijden);

if (spreidingExact > kader.bandbreedteMax) {
  // Overschreden. Gebruik afgerond voor het bericht:
  const spreidingWeergave = formatKorfbalLeeftijd(spreidingExact);
  melding.push({
    regel: "bandbreedte",
    bericht: `${team.naam}: spreiding ${spreidingWeergave} jaar, max ${kader.bandbreedteMax}`,
    ernst: "kritiek",
  });
}
```

De vergelijking gebeurt op `spreidingExact` (onafgerond). Pas wanneer de melding wordt samengesteld, gaat de waarde door `formatKorfbalLeeftijd`.

### Weergave

Één regel: **elke getoonde leeftijd loopt door `formatKorfbalLeeftijd`**. `.toFixed(1)` en `.toFixed(2)` in components/engines worden verwijderd. ESLint-regel hiervoor is niet strikt nodig; code-review en de centralisatie voorkomen regressies vanzelf.

## Data-flow

Peildatum wordt één keer bovenaan afgeleid uit de scenario-context en via props doorgegeven:

```
apps/ti-studio/src/app/(protected)/indeling/page.tsx
   │  state.seizoen = "2026-2027"
   │  peildatum = korfbalPeildatum(state.seizoen)
   ▼
WerkbordShell                            props: peildatum
   ▼
Werkbord / TeamKaart / SpelersPool       props: peildatum
   ▼
SpelerKaart / SpelerRij / Hover          props: peildatum
   ▼
berekenKorfbalLeeftijd(gd, gj, peildatum)
```

**Regels:**

1. `WerkbordState.seizoen` is de enige bron van de peildatum binnen het werkbord. De shell berekent hem één keer met `korfbalPeildatum(state.seizoen)`.
2. Leaf-components krijgen `peildatum: Date` als **verplichte** prop. Geen default, geen fallback op `HUIDIGE_PEILDATUM`.
3. Plekken buiten de teamindeling (personen-overzicht, scouting-zoekfilters, Daisy-plugins) die "nu" bedoelen, gebruiken `HUIDIGE_PEILDATUM` expliciet.

## Migratie per patroon

63 bestanden raken `PEILJAAR`. Ze vallen in drie patronen:

### Patroon 1: `PEILJAAR - geboortejaar`

Voorbeelden:
- [apps/web/src/lib/scouting/leeftijdsgroep.ts](../../../apps/web/src/lib/scouting/leeftijdsgroep.ts)
- [apps/web/src/lib/teamindeling/doorstroom-signalering.ts](../../../apps/web/src/lib/teamindeling/doorstroom-signalering.ts)
- [apps/ti-studio/src/lib/ai/plugins/ti-studio.ts:156](../../../apps/ti-studio/src/lib/ai/plugins/ti-studio.ts#L156)
- diverse `app/api/scouting/**` routes

**Vervangen door:**
```ts
import { grofKorfbalLeeftijd, HUIDIGE_PEILDATUM } from "@oranje-wit/types";
const leeftijd = grofKorfbalLeeftijd(speler.geboortejaar, HUIDIGE_PEILDATUM);
```

Of — waar de context een scenario-seizoen heeft:
```ts
const leeftijd = grofKorfbalLeeftijd(speler.geboortejaar, korfbalPeildatum(state.seizoen));
```

### Patroon 2: `korfbalLeeftijd(gd, gj, PEILJAAR)` in validatie-engines

Voorbeelden:
- [apps/ti-studio/src/lib/teamindeling/validatie-engine.ts](../../../apps/ti-studio/src/lib/teamindeling/validatie-engine.ts) (signature vervalt, herbruikt centrale functie)
- [apps/web/src/lib/teamindeling/validatie-engine.ts](../../../apps/web/src/lib/teamindeling/validatie-engine.ts)
- [apps/ti-studio/src/lib/teamindeling/validatie/helpers.ts:145](../../../apps/ti-studio/src/lib/teamindeling/validatie/helpers.ts#L145)

**Stappen:**
1. Verwijder de lokale `korfbalLeeftijd` / `spelerKorfbalLeeftijd` functie.
2. Importeer `berekenKorfbalLeeftijdExact` uit `@oranje-wit/types`.
3. Vervang `peiljaar: number` signatures door `peildatum: Date`.
4. Bandbreedte- en grens-checks: werk op `exact`, niet op afgerond.

### Patroon 3: `seizoenEindjaar: number` prop in React components

Voorbeelden:
- [apps/ti-studio/src/components/werkbord/SpelerKaart.tsx](../../../apps/ti-studio/src/components/werkbord/SpelerKaart.tsx)
- [apps/ti-studio/src/components/werkbord/SpelerRij.tsx](../../../apps/ti-studio/src/components/werkbord/SpelerRij.tsx)
- [apps/ti-studio/src/components/werkbord/TeamKaartSpelerRij.tsx](../../../apps/ti-studio/src/components/werkbord/TeamKaartSpelerRij.tsx)
- [apps/ti-studio/src/components/werkbord/HoverSpelersKaart.tsx](../../../apps/ti-studio/src/components/werkbord/HoverSpelersKaart.tsx)
- dezelfde bestanden onder `apps/web/src/components/ti-studio/werkbord/*`
- `apps/web/src/components/teamindeling/scenario/**`

**Stappen per component:**
1. `seizoenEindjaar: number` prop → `peildatum: Date` prop.
2. Lokale `berekenKorfbalLeeftijd(...)` helper verwijderen.
3. Import uit `@oranje-wit/types`.
4. `Math.floor` → verdwijnt (zit alleen in de lokale helpers).
5. Parent-component (Werkbord-shell) berekent peildatum één keer en geeft door.

### Documentatie en agent-regels

- [CLAUDE.md](../../../CLAUDE.md) — sectie "Verplichte patronen → Constanten": `PEILJAAR` verwijderen, `HUIDIGE_PEILDATUM` toevoegen.
- [AGENTS.md](../../../AGENTS.md) — idem.
- [rules/knkv-regels.md](../../../rules/knkv-regels.md) — regel al correct, terminologie controleren op "peildatum" vs "peiljaar".
- `.claude/agents/*.md` — de agents die leeftijd noemen (`adviseur`, `regel-checker`, `team-planner`, `team-selector`) updaten.
- `.claude/skills/{advies,validatie,scenario,audit}/SKILL.md` — terminologie synchroniseren.

Historische documenten (specs/plans onder `docs/superpowers/` met datum < 2026-04-14, `docs/design/archief/*`, `docs/plans/2026-03-*`) blijven ongewijzigd.

## Testdekking

Nieuwe testsuite `packages/types/src/korfballeeftijd.test.ts`:

1. **`korfbalPeildatum` — seizoen naar datum**
   - `korfbalPeildatum("2025-2026")` → 31-12-2025
   - `korfbalPeildatum("2026-2027")` → 31-12-2026
   - `korfbalPeildatum("2099-2100")` → 31-12-2099

2. **`berekenKorfbalLeeftijdExact` — grens-semantiek**
   - Geboren 31-12-2011, peildatum 31-12-2026 → exact 15.00 → `valtBinnenCategorie("U15") === true`
   - Geboren 30-12-2011, peildatum 31-12-2026 → exact ≈ 15.003 → `valtBinnenCategorie("U15") === false`
   - Geboren 01-01-2012, peildatum 31-12-2026 → exact ≈ 14.997 → `valtBinnenCategorie("U15") === true`

3. **`berekenKorfbalLeeftijd` — weergave-afronding**
   - 14.995 → 15.00
   - 14.994 → 14.99
   - 14.00 exact → 14.00

4. **Bandbreedte-edge**
   - Twee spelers geboren op dezelfde dag (bv. beide 15-06-2014) → spreidingExact === 0 → toegestaan bij elke `bandbreedteMax ≥ 0`.
   - Twee spelers 730 dagen uit elkaar (bv. 01-01-2012 en 01-01-2014) → spreidingExact ≈ 1.9986 < 2 → toegestaan bij `bandbreedteMax = 2`.
   - Twee spelers 732 dagen uit elkaar → spreidingExact ≈ 2.0041 > 2 → overschreden bij `bandbreedteMax = 2`.
   - **Boundary-bewust**: de test fixeert de exact verwachte waarde (geen "ongeveer") zodat een regressie direct zichtbaar is.

5. **Fallback op geboortejaar**
   - `berekenKorfbalLeeftijdExact(null, 2012, new Date(2026, 11, 31))` → 14 (integer, fallback).
   - `grofKorfbalLeeftijd(2012, new Date(2026, 11, 31))` → 14.

6. **Schrikkeljaar**
   - Geboren 29-02-2012, peildatum 31-12-2026 → correct 2-decimaal-resultaat (geen NaN, geen off-by-one).

7. **`formatKorfbalLeeftijd`**
   - `formatKorfbalLeeftijd(14)` → `"14.00"`
   - `formatKorfbalLeeftijd(14.9)` → `"14.90"`
   - `formatKorfbalLeeftijd(14.995)` → `"15.00"` (standaard `.toFixed(2)` rounding)

**Regressie:**
- Bestaande `apps/web/src/lib/teamindeling/validatie-engine.test.ts` en `apps/ti-studio/src/lib/teamindeling/validatie/*.test.ts` blijven bestaan; ze worden alleen aangepast op de plekken waar ze `peiljaar: number` doorgaven.
- `constanten.test.ts` — tests voor `PEILJAAR`/`PEILDATUM` verwijderen; nieuwe tests voor `HUIDIGE_PEILDATUM`.

## Risico's en mitigatie

| Risico | Impact | Mitigatie |
|---|---|---|
| Gedragswijziging grens-check (`<` → `≤`) raakt bestaande speelgerechtigdheid-tests | Middel — tests falen initieel | Bestaande tests uitlezen, borderline-cases expliciet bevestigen, dan bijwerken |
| 63 bestanden in één refactor → grote diff, moeilijk te reviewen | Hoog | Opgesplitst in logische deelcommits: (1) nieuwe module + tests, (2) `packages/types` + score-model, (3) `apps/ti-studio`, (4) `apps/web`, (5) docs/agents |
| Scenario's in apps/web gebruiken nog het oude `korfbalLeeftijd` in scenario/types.ts | Laag — dezelfde logica, andere plek | Zelfde patroon als ti-studio, meegenomen in stap 4 |
| Worktree-werk verplicht (zie memory) | n.v.t. | Werk gebeurt in isolated worktree, PO regisseert merge |
| Daisy AI-plugins gebruiken `PEILJAAR` in tool-beschrijvingen | Middel — LLM ziet veranderde prompt | Tool-beschrijvingen updaten naar "peildatum" terminologie, functioneel gedrag blijft identiek |

## Uitvoeringsvolgorde

1. **Fundament** — nieuwe module + tests in `packages/types`. Alles groen hier voordat iets anders begint.
2. **Score-model aansluiten** — `berekenExacteLeeftijd` + `isSpeelgerechtigd` delegeren, constanten opschonen.
3. **TI Studio validatie-engines** — `apps/ti-studio/src/lib/teamindeling/**` (validatie-engine, harde-regels, helpers).
4. **TI Studio components** — werkbord, spelerkaart, spelerrij, hover, profile-dialog.
5. **apps/web validatie + components** — `scenario/**`, `validatie-engine.ts`, `doorstroom-signalering.ts`, `rating.ts`.
6. **API routes en libs** — scouting-routes, rating-preview, lib/ai/plugins.
7. **Documentatie** — `CLAUDE.md`, `AGENTS.md`, rules, actieve agents/skills.
8. **Verificatie** — `pnpm format`, `pnpm lint`, `pnpm test`, `pnpm build`, relevante E2E-spots.

Stappen 3+4 en 5+6 kunnen parallel door sub-agents als hun bestandsverzamelingen niet overlappen.

## Open vragen

Geen. Alle semantische keuzes zijn bevestigd door Antjan in de brainstorm-sessie van 2026-04-14.
