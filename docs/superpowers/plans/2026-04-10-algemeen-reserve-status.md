# Algemeen Reserve (AR) status in werkindeling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AR-spelers krijgen een eigen sectie in de SpelersPoolDrawer, tellen niet mee in de "in te delen" denominator, en zijn vergrendeld (niet draggable).

**Architecture:** Minimale wijziging over 6 bestanden. Geen DB-migratie nodig — `ALGEMEEN_RESERVE` bestaat al als Prisma-enum. Wijzigingen lopen van type → data → logica → UI.

**Tech Stack:** Next.js 16, React, TypeScript, Prisma

---

## Bestandsoverzicht

| Bestand | Wijziging |
|---|---|
| `apps/web/src/components/ti-studio/werkbord/types.ts` | `SpelerStatus` uitbreiden met `ALGEMEEN_RESERVE` |
| `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx` | DB-status mappen i.p.v. hardcoded `"BESCHIKBAAR"` |
| `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx` | `arCount` berekenen, `inTeDelenTotaal` doorgeven aan Toolbar |
| `apps/web/src/components/ti-studio/werkbord/Toolbar.tsx` | `arCount` prop toevoegen, tonen naast counter |
| `apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx` | AR-badge + drag uitschakelen voor AR-spelers |
| `apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx` | AR-spelers uit hoofdlijst filteren, vaste AR-sectie onderaan |

---

## Task 1: `SpelerStatus` type uitbreiden

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/types.ts:5`

- [ ] **Stap 1: Voeg `ALGEMEEN_RESERVE` toe aan de union**

Vervang regel 5 in `types.ts`:

```ts
export type SpelerStatus = "BESCHIKBAAR" | "TWIJFELT" | "GAAT_STOPPEN" | "GESTOPT" | "AFGEMELD" | "ALGEMEEN_RESERVE";
```

- [ ] **Stap 2: TypeScript check**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: geen nieuwe errors gerelateerd aan `SpelerStatus`.

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/types.ts
git commit -m "feat(ti-studio): voeg ALGEMEEN_RESERVE toe aan SpelerStatus type"
```

---

## Task 2: DB-status doorgeven vanuit `page.tsx`

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`

De status van spelers wordt nu hardcoded als `"BESCHIKBAAR"` op twee plekken: bij `alleSpelers` (regel ~91) en in de fallback-objecten voor spelers in teams/selectiegroepen (regels ~123, ~151, ~253).

- [ ] **Stap 1: Voeg status-mapper toe bovenaan `page.tsx` (na de KLEUR_MAP)**

Voeg toe na regel 32 (na `const KLEUR_MAP`):

```ts
const TOEGESTANE_STATUSSEN = new Set([
  "BESCHIKBAAR",
  "TWIJFELT",
  "GAAT_STOPPEN",
  "GESTOPT",
  "AFGEMELD",
  "ALGEMEEN_RESERVE",
]);

function mapStatus(s: string | null | undefined): WerkbordSpeler["status"] {
  if (s && TOEGESTANE_STATUSSEN.has(s)) return s as WerkbordSpeler["status"];
  return "BESCHIKBAAR";
}
```

- [ ] **Stap 2: Gebruik `mapStatus` bij `alleSpelers`**

Zoek op `status: "BESCHIKBAAR" as const,` in het blok `prismaSpelers.map` (rond regel 91) en vervang door:

```ts
status: mapStatus(sp.status),
```

- [ ] **Stap 3: Gebruik `mapStatus` in de team-fallback objecten**

Er zijn twee gelijksoortige fallback-objecten (voor dames en heren in versie.teams). Zoek op `status: "BESCHIKBAAR" as const,` binnen de `map`-blokken voor `dames` en `heren` (rond regels 123 en 151) en vervang beide door:

```ts
status: mapStatus(ts.speler?.status),
```

- [ ] **Stap 4: Gebruik `mapStatus` in de selectiegroep-fallback**

Zoek op `status: "BESCHIKBAAR" as const,` in het `selectieGroep.spelers`-blok (rond regel 253) en vervang door:

```ts
status: mapStatus(sp.speler?.status),
```

- [ ] **Stap 5: TypeScript check**

```bash
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: geen errors.

- [ ] **Stap 6: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/page.tsx
git commit -m "feat(ti-studio): geef echte DB-status door i.p.v. hardcoded BESCHIKBAAR"
```

---

## Task 3: Teller-logica in `TiStudioShell`

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx:90-92`

- [ ] **Stap 1: Bereken `arCount` en `inTeDelenTotaal`**

Vervang de bestaande `ingeplandSpelers`-berekening (rond regel 90-92):

```ts
const arCount = alleSpelers.filter((s) => s.status === "ALGEMEEN_RESERVE").length;
const inTeDelenTotaal = initieleState.totalSpelers - arCount;
const ingeplandSpelers = alleSpelers.filter(
  (s) => s.teamId !== null || s.selectieGroepId !== null
).length;
```

- [ ] **Stap 2: Geef `inTeDelenTotaal` en `arCount` door aan Toolbar**

Zoek de `<Toolbar ... />` aanroep en vervang de `totalSpelers`-prop:

```tsx
<Toolbar
  naam={initieleState.naam}
  versieNaam={initieleState.versieNaam}
  versieNummer={initieleState.versieNummer}
  totalSpelers={inTeDelenTotaal}
  arCount={arCount}
  ingeplandSpelers={ingeplandSpelers}
  panelLinks={panelLinks}
  panelRechts={panelRechts}
  onTogglePanelLinks={togglePanelLinks}
  onTogglePanelRechts={togglePanelRechts}
  onVersiesOpen={() => togglePanelRechts("versies")}
/>
```

- [ ] **Stap 3: TypeScript check**

```bash
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: TypeScript klaagt dat `arCount` niet bestaat als prop op Toolbar — dat lossen we op in Task 4.

- [ ] **Stap 4: Commit na Task 4** *(sla commit op tot na Task 4)*

---

## Task 4: Toolbar — `arCount` prop + weergave

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/Toolbar.tsx`

- [ ] **Stap 1: Voeg `arCount` toe aan `ToolbarProps`**

Voeg toe aan het `interface ToolbarProps`-blok (na `ingeplandSpelers: number;`):

```ts
arCount?: number;
```

- [ ] **Stap 2: Destructureer `arCount` in de functie-signatuur**

Voeg `arCount = 0,` toe aan de destructurering in `export function Toolbar({`:

```ts
export function Toolbar({
  naam,
  versieNaam,
  versieNummer,
  isWhatIf = false,
  totalSpelers,
  ingeplandSpelers,
  arCount = 0,
  panelLinks,
  panelRechts,
  onTogglePanelLinks,
  onTogglePanelRechts,
  onVersiesOpen,
}: ToolbarProps) {
```

- [ ] **Stap 3: Toon AR-count naast de teller**

Zoek het blok met `<div style={{ fontSize: 10, color: "var(--text-3)" }}>Ingedeeld</div>` en de cijfer-rij eronder. Voeg onder de `/ {totalSpelers}` span een AR-label toe:

```tsx
<div>
  <div style={{ fontSize: 10, color: "var(--text-3)" }}>Ingedeeld</div>
  <div>
    <span style={{ fontWeight: 700, fontSize: 13 }}>{ingeplandSpelers}</span>
    <span style={{ color: "var(--text-3)", fontSize: 10 }}> / {totalSpelers}</span>
    {arCount > 0 && (
      <span style={{ color: "var(--text-3)", fontSize: 9, marginLeft: 4 }}>
        (+{arCount} AR)
      </span>
    )}
  </div>
</div>
```

- [ ] **Stap 4: TypeScript check**

```bash
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: geen errors.

- [ ] **Stap 5: Commit Tasks 3 + 4 samen**

```bash
git add apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
git add apps/web/src/components/ti-studio/werkbord/Toolbar.tsx
git commit -m "feat(ti-studio): AR telt niet mee in denominator, toon AR-count in toolbar"
```

---

## Task 5: SpelerKaart — AR-badge en drag-lock

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx`

- [ ] **Stap 1: Voeg `isAR` variabele toe**

Voeg toe na `const stopGezet = speler.status === "GAAT_STOPPEN";` (rond regel 57):

```ts
const isAR = speler.status === "ALGEMEEN_RESERVE";
```

- [ ] **Stap 2: Schakel drag uit voor AR**

Vervang `draggable={!asGhost}` door:

```tsx
draggable={!asGhost && !isAR}
```

- [ ] **Stap 3: Schakel pointer-events uit voor AR**

De `onPointerDown`, `onPointerUp`, `onPointerCancel`, `onDragStart`, `onDragEnd` handlers gebruiken al de `asGhost`-guard. Voeg `isAR` toe als extra guard:

- `onPointerDown`: wijzig `asGhost ? undefined :` naar `asGhost || isAR ? undefined :`
- `onPointerUp`: wijzig `asGhost ? undefined :` naar `asGhost || isAR ? undefined :`
- `onPointerCancel`: wijzig `asGhost ? undefined :` naar `asGhost || isAR ? undefined :`
- `onDragStart`: wijzig `asGhost ? undefined :` naar `asGhost || isAR ? undefined :`
- `onDragEnd`: wijzig `asGhost ? undefined :` naar `asGhost || isAR ? undefined :`

- [ ] **Stap 4: Pas cursor aan voor AR**

Vervang `cursor: isHeld ? "grabbing" : "grab",` in de `style`-prop:

```ts
cursor: isAR ? "default" : isHeld ? "grabbing" : "grab",
```

- [ ] **Stap 5: Voeg AR-badge toe — normaal variant**

Zoek het badges-blok (`{!smal && ( <div ... badges ...>)}`) en voeg vóór de `isNieuw`-badge:

```tsx
{isAR && (
  <span
    style={{
      fontSize: 9,
      fontWeight: 700,
      color: "var(--text-2)",
      background: "var(--bg-2)",
      border: "1px solid var(--border-1)",
      borderRadius: 3,
      padding: "1px 4px",
    }}
  >
    AR
  </span>
)}
```

- [ ] **Stap 6: Voeg AR-badge toe — smal variant**

Zoek in het `smal`-blok de status-badges rij (`{speler.isNieuw && ...}`) en voeg vóór `isNieuw`:

```tsx
{isAR && (
  <span style={{ fontSize: 7, fontWeight: 700, color: "var(--text-3)" }}>AR</span>
)}
```

- [ ] **Stap 7: TypeScript check**

```bash
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: geen errors.

- [ ] **Stap 8: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx
git commit -m "feat(ti-studio): AR-badge en drag-lock op SpelerKaart"
```

---

## Task 6: SpelersPoolDrawer — AR-sectie

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx`

- [ ] **Stap 1: Filter AR uit de hoofdlijst**

Zoek de `gefilterd`-berekening (rond regel 21). Voeg bovenaan de filter-keten een AR-exclusie toe:

```ts
const arSpelers = spelers.filter((sp) => sp.status === "ALGEMEEN_RESERVE");

const gefilterd = spelers.filter((sp) => {
  if (sp.status === "ALGEMEEN_RESERVE") return false; // altijd uit hoofdlijst
  if (sp.selectieGroepId !== null) return false;
  const naam = `${sp.roepnaam} ${sp.achternaam}`.toLowerCase();
  if (zoek && !naam.includes(zoek.toLowerCase())) return false;
  if (geslachtFilter !== "alle" && sp.geslacht.toLowerCase() !== geslachtFilter) return false;
  if (
    filter === "zonder_team" &&
    (sp.teamId !== null || sp.status === "GAAT_STOPPEN" || sp.status === "GESTOPT")
  )
    return false;
  if (filter === "ingedeeld" && sp.teamId === null) return false;
  return true;
});
```

- [ ] **Stap 2: Voeg AR-sectie toe onderaan de spelerslijst**

Zoek het einde van de spelerslijst `<div>` (na het `heren`-blok, vóór het sluitende `</div>` van de scrollable lijst). Voeg toe:

```tsx
{arSpelers.length > 0 && (
  <>
    <div
      style={{
        margin: "8px 10px 0",
        borderTop: "1px solid var(--border-0)",
      }}
    />
    <div
      style={{
        padding: "8px 10px 4px",
        fontSize: 9,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: ".6px",
        color: "var(--text-3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span>Algemeen Reserve</span>
      <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{arSpelers.length}</span>
    </div>
    {arSpelers.map((sp) => (
      <SpelerKaart
        key={sp.id}
        speler={sp}
        vanTeamId={null}
        seizoenEindjaar={HUIDIG_SEIZOEN_EINDJAAR}
      />
    ))}
  </>
)}
```

- [ ] **Stap 3: TypeScript check**

```bash
pnpm --filter web exec tsc --noEmit 2>&1 | head -30
```

Verwacht: geen errors.

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx
git commit -m "feat(ti-studio): AR-spelers in eigen sectie onderaan spelerspool"
```

---

## Task 7: Visuele verificatie

- [ ] **Stap 1: Start dev server**

```bash
pnpm dev
```

Open [http://localhost:3000/ti-studio/indeling](http://localhost:3000/ti-studio/indeling)

- [ ] **Stap 2: Controleer teller**

Open de Toolbar. Als er AR-spelers in de DB zitten:
- De `/ X` denominator is lager dan het totaal aantal spelers
- Naast de teller staat `(+N AR)`
- De progress-ring klopt (ingedeeld / in-te-delen)

Als er geen AR-spelers zijn in de DB, maak er één aan via Prisma Studio (`pnpm --filter database exec prisma studio`) of direct in de DB.

- [ ] **Stap 3: Controleer spelerspool**

Open de Spelerspool (link icon in toolbar). Verwacht:
- AR-spelers staan NIET in "Zonder team", "Ingedeeld" of "Alle" hoofdlijsten
- Onderaan de pool: divider + "ALGEMEEN RESERVE (N)" koptekst + AR-kaarten met AR-badge
- AR-kaarten zijn niet draggable (cursor `default`, geen drag-effect)

- [ ] **Stap 4: Controleer AR-badge**

De AR-kaarten tonen een "AR" badge rechts. Dragging naar canvas heeft geen effect.

- [ ] **Stap 5: Finale commit als alles klopt**

```bash
git add -A
git status  # controleer dat er geen onbedoelde wijzigingen bij zitten
git commit -m "chore(ti-studio): AR-status werkindeling — visuele verificatie gedaan"
```

*(Alleen committen als er nog unstaged wijzigingen zijn na de vorige commits.)*
