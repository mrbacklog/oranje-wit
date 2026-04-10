# Spec: Algemeen Reserve (AR) status in werkindeling

**Datum:** 2026-04-10  
**Status:** Goedgekeurd

---

## Probleemstelling

De TC kan spelers aanmerken als "Algemeen Reserve" (AR): ze zijn lid, maar worden niet ingedeeld in een specifiek team. Momenteel heeft de werkindeling geen ondersteuning voor dit concept:

- AR-spelers staan al als `ALGEMEEN_RESERVE` in het Prisma-schema, maar de lokale SpelerStatus-type in de werkbord-types mist deze waarde.
- De status wordt in `page.tsx` hardcoded als `"BESCHIKBAAR"` — de echte DB-status wordt nooit doorgegeven.
- De Toolbar-teller (`ingeplandSpelers / totalSpelers`) gebruikt AR-spelers onterecht als "in te delen".
- De SpelersPoolDrawer heeft geen aparte weergave voor AR-spelers.

---

## Beslissingen

- AR-spelers zijn **vergrendeld** in de pool — niet draggable naar teams.
- AR-spelers verschijnen in een **eigen vaste sectie onderaan** de SpelersPoolDrawer, los van de normale dames/heren-lijsten.
- AR-spelers tellen **niet** mee als "In te delen" (ze worden uit de denominator gehaald).
- AR-spelers tellen **niet** mee als "Ingedeeld" (geen teamId, dat is al zo).
- Geen database-migratie nodig — `ALGEMEEN_RESERVE` bestaat al als `SpelerStatus` enum in Prisma.

---

## Scope

### 1. Types (`apps/web/src/components/ti-studio/werkbord/types.ts`)

Voeg `"ALGEMEEN_RESERVE"` toe aan de lokale `SpelerStatus` union:

```ts
export type SpelerStatus =
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GAAT_STOPPEN"
  | "GESTOPT"
  | "AFGEMELD"
  | "ALGEMEEN_RESERVE";
```

### 2. Status doorgeven vanuit DB (`apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`)

De status wordt nu hardcoded als `"BESCHIKBAAR"`. Vervang dit door een mapping van de DB-waarde naar de lokale type, met `"BESCHIKBAAR"` als fallback voor onbekende waarden:

```ts
const ALLOWED_STATUSSEN = new Set([
  "BESCHIKBAAR", "TWIJFELT", "GAAT_STOPPEN", "GESTOPT",
  "AFGEMELD", "ALGEMEEN_RESERVE",
]);

function mapStatus(s: string): SpelerStatus {
  return ALLOWED_STATUSSEN.has(s) ? (s as SpelerStatus) : "BESCHIKBAAR";
}
```

Gebruik `mapStatus(sp.status)` bij het aanmaken van `WerkbordSpeler` objecten in `page.tsx`.

### 3. Teller-logica (`apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`)

```ts
const arCount = alleSpelers.filter(s => s.status === "ALGEMEEN_RESERVE").length;
const inTeDelenTotaal = initieleState.totalSpelers - arCount;
const ingeplandSpelers = alleSpelers.filter(
  s => s.teamId !== null || s.selectieGroepId !== null
).length;
```

Geef `inTeDelenTotaal` door aan `Toolbar` als de denominator (i.p.v. `totalSpelers`). De Toolbar-prop `totalSpelers` kan hernoemd worden naar `inTeDelenTotaal`, of er komt een aparte `arCount`-prop bij voor optionele weergave.

### 4. SpelersPoolDrawer (`apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx`)

**AR-sectie:**
- Filter AR-spelers (`status === "ALGEMEEN_RESERVE"`) altijd uit de normale dames/heren-lijsten — ongeacht de actieve `SpelerFilter`.
- Toon een aparte sectie onderaan de pool, gescheiden door een divider:

```
──────────────────────
ALGEMEEN RESERVE  (3)
  [SpelerKaart]  [AR-badge]
  [SpelerKaart]  [AR-badge]
```

- De sectie is altijd zichtbaar als er ≥ 1 AR-speler is, ongeacht filter-selectie.
- AR-spelers staan als aparte categorie, geen dames/heren-splitsing (optioneel: wel opsplitsen als er veel zijn).

**Drag-lock:**
- AR-SpelerKaarten krijgen `draggable={false}` en geen `onDragStart`-handler.
- Visueel: cursor `default` i.p.v. `grab`.

**Filter-chips:**
- "Zonder team" en "Ingedeeld" en "Alle" werken ongewijzigd op de normale lijst — AR-sectie staat er altijd los van.

### 5. SpelerKaart — AR badge

Kleine "AR" badge op de kaart zodat AR-spelers herkenbaar zijn. Zelfde stijl als andere status-badges.

---

## Buiten scope

- Mogelijkheid om AR-status te wijzigen vanuit de werkindeling (dit gaat via Personen).
- Drag van AR naar team (bewust vergrendeld — zie beslissingen).
- AR opnemen in validatie-engine (geen teamvalidatie van toepassing).

---

## Betrokken bestanden

| Bestand | Wijziging |
|---|---|
| `apps/web/src/components/ti-studio/werkbord/types.ts` | `SpelerStatus` uitbreiden |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx` | Status mappen vanuit DB |
| `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx` | AR-teller, denominator aanpassen |
| `apps/web/src/components/ti-studio/werkbord/Toolbar.tsx` | Prop `inTeDelenTotaal` gebruiken |
| `apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx` | AR-sectie + drag-lock |
| `apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx` | AR-badge + drag-lock |
