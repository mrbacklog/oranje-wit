# Compact TeamKaart v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign de compact-weergave van `TeamKaart` met Venus/Mars-iconen, grotere tellers, een ruimere footer met gestapelde labels, en verhoog het compact-breakpoint naar 0.80.

**Architecture:** Twee onafhankelijke bestanden worden gewijzigd: `useZoom.ts` (breakpoint aanpassen + tests bijwerken) en `TeamKaart.tsx` (compact-tak volledig herschrijven). De taken kunnen parallel door afzonderlijke subagents worden uitgevoerd in isolatie (worktree). Na beide taken wordt samengevoegd en handmatig getest in de browser.

**Tech Stack:** React 18, Next.js 16, TypeScript, Vitest, inline styles (geen Tailwind in werkbord-componenten), SVG-iconen (geen externe library)

---

## Bestandsoverzicht

| Bestand | Actie | Wat |
|---|---|---|
| `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts` | Modify | Breakpoint compact/normaal van `0.64` naar `0.80` |
| `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.test.ts` | Modify | Tests bijwerken voor nieuw breakpoint |
| `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx` | Modify | Compact-tak volledig herschrijven |

---

## Task 1: useZoom breakpoint + tests

> **Kan parallel met Task 2 — raakt `useZoom.ts` en `useZoom.test.ts` alleen**

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.test.ts`
- Modify: `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts`

- [ ] **Stap 1: Update de bestaande tests voor het nieuwe breakpoint**

Vervang de volledige inhoud van `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useZoom } from "./useZoom";

describe("useZoom", () => {
  it("begint op 0.75 — compact (onder nieuw breakpoint 0.80)", () => {
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoom).toBe(0.75);
    expect(result.current.zoomLevel).toBe("compact");
  });

  it("zoomLevel is normaal bij zoom >= 0.80 en < 1.0", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(0.80));
    expect(result.current.zoomLevel).toBe("normaal");
    act(() => result.current.setZoom(0.99));
    expect(result.current.zoomLevel).toBe("normaal");
  });

  it("zoomLevel is compact bij zoom < 0.80", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(0.79));
    expect(result.current.zoomLevel).toBe("compact");
    act(() => result.current.setZoom(0.5));
    expect(result.current.zoomLevel).toBe("compact");
  });

  it("zoomLevel is detail bij zoom >= 1.0", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(1.0));
    expect(result.current.zoomLevel).toBe("detail");
  });

  it("clamp: zoom blijft tussen 0.4 en 1.5", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(0.1));
    expect(result.current.zoom).toBe(0.4);
    act(() => result.current.setZoom(9.9));
    expect(result.current.zoom).toBe(1.5);
  });
});
```

- [ ] **Stap 2: Draai de tests — verwacht FAIL**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm test -- --reporter=verbose hooks/useZoom
```

Verwacht: `"begint op 0.75 — compact"` faalt omdat de huidige code `0.75` als `normaal` classificeert.

- [ ] **Stap 3: Pas het breakpoint aan in useZoom.ts**

Vervang in `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts` alleen de `toZoomLevel` functie:

```ts
function toZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.80) return "compact";
  if (zoom < 1.0)  return "normaal";
  return "detail";
}
```

De rest van het bestand blijft ongewijzigd.

- [ ] **Stap 4: Draai de tests — verwacht PASS**

```bash
pnpm test -- --reporter=verbose hooks/useZoom
```

Verwacht: alle 5 tests groen.

- [ ] **Stap 5: Commit**

```bash
cd c:/Users/Antjan/oranje-wit
git add apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts \
        apps/web/src/components/ti-studio/werkbord/hooks/useZoom.test.ts
git commit -m "feat(ti-studio): compact-breakpoint naar 0.80 + tests bijgewerkt"
```

---

## Task 2: TeamKaart compact-weergave herschrijven

> **Kan parallel met Task 1 — raakt alleen `TeamKaart.tsx`**

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx`

### Achtergrond (lees dit eerst)

Het bestand staat op `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx`. Relevante variabelen:

- `team.formaat`: `"viertal"` (140px breed) | `"achtal"` (280px) | `"selectie"` (560px)
- `team.dames.length` / `team.heren.length`: aantal spelers per geslacht
- `team.ussScore`: `number | null` — null bij jeugd/viertal
- `team.gemiddeldeLeeftijd`: `number | null`
- `team.validatieStatus`: `"ok"` | `"warn"` | `"err"`
- `team.kleur`: key voor `KNKV_KLEUR` lookup
- `zoomLevel`: `"compact"` | `"normaal"` | `"detail"` — prop, bepaald door `useZoom`
- `onHeaderMouseDown`: `(e: React.MouseEvent, teamId: string) => void` — initieert card-drag in canvas

CSS tokens beschikbaar via `tokens.css`:
- `--pink`: `#ec4899` (dames)
- `--blue`: `#60a5fa` (heren)
- `--ok`: `#22c55e` | `--warn`: `#eab308` | `--err`: `#ef4444`
- `--bg-1`: `#141414` | `--border-0`: `#262626` | `--text-1`: `#fafafa` | `--text-3`: `#666666`
- `--card-radius`: `14px`

### Implementatiestappen

- [ ] **Stap 1: Voeg formaat-lookup constanten toe bovenaan TeamKaart.tsx**

Voeg na de bestaande `VAL_KLEUR` constante toe (regel ~28, vóór de interface):

```tsx
const COMPACT_HEADER_HOOGTE: Record<KaartFormaat, number> = {
  viertal: 36,
  achtal:  40,
  selectie: 44,
};

const COMPACT_HEADER_FONT: Record<KaartFormaat, number> = {
  viertal: 13,
  achtal:  15,
  selectie: 17,
};

const COMPACT_ICON_SIZE: Record<KaartFormaat, number> = {
  viertal: 16,
  achtal:  20,
  selectie: 28,
};

const COMPACT_TELLER_FONT: Record<KaartFormaat, number> = {
  viertal: 28,
  achtal:  32,
  selectie: 44,
};

const COMPACT_ICON_GAP: Record<KaartFormaat, number> = {
  viertal: 12,
  achtal:  36,
  selectie: 60,
};
```

- [ ] **Stap 2: Vervang de root `onMouseDown` handler**

In de return-statement van `TeamKaart`, de root `<div>` heeft nu:
```tsx
onMouseDown={(e) => e.stopPropagation()}
```

Vervang dit door:
```tsx
onMouseDown={(e) => {
  if (isCompact) {
    // Gehele kaart is drag-handle in compact mode
    onHeaderMouseDown(e, team.id);
  } else {
    e.stopPropagation(); // blokkeer canvas-pan bij klik op kaart
  }
}}
```

Voeg ook `cursor: isCompact ? "grab" : "default"` toe aan de `style` van de root div.

- [ ] **Stap 3: Vervang de compact-tak in de JSX**

De huidige structuur heeft één `<div style={{ padding: "0 8px 0 14px", flex: 1, ... }}>` die zowel compact als normaal bedient via conditionals. Vervang de volledige inhoud van de root-div (na de kleurband-div, vóór de `<style>` tag) door:

```tsx
{/* Kleurband links — altijd */}
<div
  style={{
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 4,
    background: KNKV_KLEUR[team.kleur] ?? "var(--cat-senior)",
  }}
/>

{/* Validatie-stip rechtsbovenin — alleen in compact mode
     In normaal/detail zit de stip inline in de header-rij (zie normaal-tak hieronder) */}
{isCompact && (
  <div
    style={{
      position: "absolute",
      top: 11,
      right: 11,
      width: 9,
      height: 9,
      borderRadius: "50%",
      background: VAL_KLEUR[team.validatieStatus],
      boxShadow: `0 0 0 2px ${
        team.validatieStatus === "ok"
          ? "rgba(34,197,94,.2)"
          : team.validatieStatus === "warn"
            ? "rgba(234,179,8,.2)"
            : "rgba(239,68,68,.2)"
      }`,
      pointerEvents: "none",
    }}
  />
)}

{isCompact ? (
  /* ─── COMPACT MODE ─────────────────────────────────────────── */
  <>
    {/* Header: teamnaam vult volledige breedte */}
    <div
      style={{
        height: COMPACT_HEADER_HOOGTE[team.formaat],
        display: "flex",
        alignItems: "center",
        padding: "0 28px 0 14px",
        borderBottom: "1px solid var(--border-0)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: COMPACT_HEADER_FONT[team.formaat],
          fontWeight: 800,
          color: "var(--text-1)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {team.naam}
      </span>
    </div>

    {/* Midden: Venus/Mars iconen + tellers */}
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: COMPACT_ICON_GAP[team.formaat],
      }}
    >
      {/* Dames */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {/* Venus-icoon */}
        <svg
          width={COMPACT_ICON_SIZE[team.formaat]}
          height={COMPACT_ICON_SIZE[team.formaat]}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--pink)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="8" r="6" />
          <line x1="12" y1="14" x2="12" y2="22" />
          <line x1="9" y1="19" x2="15" y2="19" />
        </svg>
        <span
          style={{
            fontSize: COMPACT_TELLER_FONT[team.formaat],
            fontWeight: 900,
            color: "var(--pink)",
            lineHeight: 1,
          }}
        >
          {team.dames.length}
        </span>
      </div>

      {/* Scheidingslijn */}
      <div
        style={{
          width: 1,
          height: COMPACT_TELLER_FONT[team.formaat] + COMPACT_ICON_SIZE[team.formaat] + 6,
          background: "var(--border-0)",
        }}
      />

      {/* Heren */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {/* Mars-icoon */}
        <svg
          width={COMPACT_ICON_SIZE[team.formaat]}
          height={COMPACT_ICON_SIZE[team.formaat]}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="10" cy="14" r="6" />
          <line x1="21" y1="3" x2="15" y2="9" />
          <polyline points="16 3 21 3 21 8" />
        </svg>
        <span
          style={{
            fontSize: COMPACT_TELLER_FONT[team.formaat],
            fontWeight: 900,
            color: "var(--blue)",
            lineHeight: 1,
          }}
        >
          {team.heren.length}
        </span>
      </div>
    </div>

    {/* Footer: score links, leeftijd rechts — gestapeld label+waarde */}
    <div
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        borderTop: "1px solid var(--border-0)",
        flexShrink: 0,
      }}
    >
      {/* USS Score — alleen tonen als niet null */}
      {team.ussScore !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".5px",
              color: "var(--text-3)",
            }}
          >
            Score
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
            {team.ussScore.toFixed(2)}
          </span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Gemiddelde leeftijd — altijd rechts */}
      {team.gemiddeldeLeeftijd !== null && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".5px",
              color: "var(--text-3)",
            }}
          >
            Gem. leeftijd
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
            {team.gemiddeldeLeeftijd.toFixed(1)}j
          </span>
        </div>
      )}
    </div>
  </>
) : (
  /* ─── NORMAAL / DETAIL MODE (ongewijzigd) ───────────────────── */
  <div
    style={{
      padding: "0 8px 0 14px",
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      overflow: "hidden",
    }}
  >
    {/* Header met drag-handle, edit-knop, validatie-dot */}
    <div
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        onHeaderMouseDown(e, team.id);
      }}
      style={{
        height: 36,
        display: "flex",
        alignItems: "center",
        gap: 6,
        borderBottom: "1px solid var(--border-0)",
        flexShrink: 0,
        cursor: "grab",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {team.naam}
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        <span
          style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 10, fontWeight: 600,
            padding: "2px 5px", borderRadius: 4,
            background: "rgba(236,72,153,.12)", color: "var(--pink)",
          }}
        >
          ♀ {team.dames.length}
        </span>
        <span
          style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 10, fontWeight: 600,
            padding: "2px 5px", borderRadius: 4,
            background: "rgba(96,165,250,.12)", color: "var(--blue)",
          }}
        >
          ♂ {team.heren.length}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBewerken(team.id);
        }}
        style={{
          width: 22, height: 22, borderRadius: 5,
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text-3)", fontSize: 11, flexShrink: 0,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>

    {/* Spelers kolommen */}
    <div
      style={{
        display: "flex",
        flexDirection: team.formaat === "viertal" ? "column" : "row",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Dames kolom */}
      <div
        onDragOver={(e) => handleDragOver(e, "V")}
        onDragLeave={() => setDropOverGeslacht(null)}
        onDrop={(e) => handleDrop(e, "V")}
        style={{
          flex: 1, display: "flex", flexDirection: "column",
          minHeight: 0, overflow: "hidden",
          borderRight: team.formaat === "viertal" ? "none" : "1px solid var(--border-0)",
          borderBottom: team.formaat === "viertal" ? "1px solid var(--border-0)" : "none",
          background: dropOverGeslacht === "V" ? "rgba(236,72,153,.07)" : "transparent",
          transition: "background 120ms ease",
        }}
      >
        <div
          style={{
            fontSize: 9, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: ".5px", color: "var(--text-3)",
            padding: "2px 6px 0",
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="var(--pink)" />
          </svg>
          Dames
        </div>
        {team.dames.map((sp) => (
          <TeamKaartSpelerRij
            key={sp.id}
            spelerInTeam={sp}
            teamId={team.id}
            showRating={isDetail}
            showLeeftijd={isDetail}
            showIcons={isDetail}
            showScore={showScores && isDetail}
            huidigeJaar={huidigeJaar}
          />
        ))}
      </div>

      {/* Heren kolom */}
      <div
        onDragOver={(e) => handleDragOver(e, "M")}
        onDragLeave={() => setDropOverGeslacht(null)}
        onDrop={(e) => handleDrop(e, "M")}
        style={{
          flex: 1, display: "flex", flexDirection: "column",
          minHeight: 0, overflow: "hidden",
          background: dropOverGeslacht === "M" ? "rgba(96,165,250,.07)" : "transparent",
          transition: "background 120ms ease",
        }}
      >
        <div
          style={{
            fontSize: 9, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: ".5px", color: "var(--text-3)",
            padding: "2px 6px 0",
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill="var(--blue)" />
          </svg>
          Heren
        </div>
        {team.heren.map((sp) => (
          <TeamKaartSpelerRij
            key={sp.id}
            spelerInTeam={sp}
            teamId={team.id}
            showRating={isDetail}
            showLeeftijd={isDetail}
            showIcons={isDetail}
            showScore={showScores && isDetail}
            huidigeJaar={huidigeJaar}
          />
        ))}
      </div>
    </div>

    {/* Footer */}
    <div
      style={{
        height: 28,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px",
        borderTop: "1px solid var(--border-0)",
        flexShrink: 0,
      }}
    >
      {team.gemiddeldeLeeftijd && (
        <div style={{ fontSize: 10, color: "var(--text-3)" }}>
          Gem.{" "}
          <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
            {team.gemiddeldeLeeftijd.toFixed(1)}j
          </span>
        </div>
      )}
      {team.validatieCount > 0 && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 10, color: "var(--warn)",
            background: "rgba(234,179,8,.08)",
            padding: "2px 6px", borderRadius: 4,
          }}
        >
          ⚠ {team.validatieCount}
        </div>
      )}
      <div style={{ flex: 1 }} />
      {team.ussScore && (
        <div style={{ fontSize: 10, color: "var(--text-3)" }}>
          USS{" "}
          <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
            {team.ussScore.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Stap 4: Verwijder nu overbodige variabelen uit TeamKaart**

Na de herschrijving zijn deze variabelen niet meer nodig — verwijder ze uit de body van de `TeamKaart` functie:

```tsx
// Verwijder deze regels:
const showLeeftijd = isDetail;
const showRating = isDetail;
const showIcons = isDetail;
const showKolommen = !isCompact;
const showFooter = !isCompact;
```

De normaal/detail-tak in stap 3 gebruikt `isDetail` direct. Controleer dat `isDetail` nog gedeclareerd is:
```tsx
const isDetail = zoomLevel === "detail"; // bewaren
```

- [ ] **Stap 5: Typecheck + run unit tests**

```bash
cd c:/Users/Antjan/oranje-wit
pnpm --filter web tsc --noEmit
pnpm test -- --reporter=verbose
```

Verwacht: geen TypeScript errors, alle tests groen.

- [ ] **Stap 6: Handmatige visuele check in de browser**

Start de dev-server als die nog niet draait:
```bash
pnpm dev
```

Open `http://localhost:3000/ti-studio/indeling` in de browser.

Controleer:
1. Zoom uit naar < 80% → compact mode actief (Venus/Mars iconen zichtbaar, grote tellers)
2. Zoom in naar ≥ 80% → normaal mode (spelerlijsten zichtbaar)
3. Zoom in naar ≥ 100% → detail mode
4. In compact: klik en sleep een teamkaart → kaart beweegt mee (drag werkt over heel kaart)
5. In compact: footer toont "Score" + waarde links en "Gem. leeftijd" + waarde rechts (gestapeld)
6. In compact: als `ussScore === null` → alleen leeftijd rechts, linker footer leeg
7. Validatie-stip rechtsboven zichtbaar in compact mode (groen/geel/rood)
8. Viertal-kaart (140px), achtal (280px) en selectie (560px) zien er proportioneel goed uit

- [ ] **Stap 7: Commit**

```bash
cd c:/Users/Antjan/oranje-wit
git add apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
git commit -m "feat(ti-studio): compact TeamKaart v2 — Venus/Mars iconen, gestapelde footer"
```

---

## Afrondingsstap (na beide tasks)

- [ ] **Merge en definitieve check**

Als Task 1 en Task 2 in aparte worktrees zijn uitgevoerd: merge beide branches naar main. Run daarna:

```bash
pnpm test
pnpm --filter web tsc --noEmit
```

Verwacht: alle tests groen, geen TS-errors.
