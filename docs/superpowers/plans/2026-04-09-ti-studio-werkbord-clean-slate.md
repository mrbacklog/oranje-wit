# TI Studio Werkbord — Clean Slate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Herbouw de `/ti-studio/indeling` pagina exact naar het prototype `docs/design/werkindeling-v4.html`, in een nieuwe geïsoleerde componentenmap zonder afhankelijkheid van de bestaande `components/teamindeling/scenario/` map.

**Architecture:** Nieuwe map `apps/web/src/components/ti-studio/werkbord/` met 9 components, 2 hooks en 1 CSS-tokenbestand. De bestaande `indeling/page.tsx` (server component) haalt data op en geeft deze door aan `TiStudioShell` (client component). Geen enkel component uit `components/teamindeling/scenario/` wordt gebruikt.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS (alleen layout utilities), CSS custom properties (tokens), `@dnd-kit/core` voor drag-and-drop.

**Referentiebestanden (bindend):**
- `docs/design/werkindeling-v4/tokens.css` — design tokens
- `docs/design/werkindeling-v4/ribbon.html` — ribbon referentie
- `docs/design/werkindeling-v4/toolbar.html` — toolbar referentie
- `docs/design/werkindeling-v4/pool-drawer.html` — spelerspool referentie
- `docs/design/werkindeling-v4/canvas.html` — canvas referentie
- `docs/design/werkindeling-v4/team-kaart.html` — teamkaart referentie
- `docs/design/werkindeling-v4/validatie-drawer.html` — validatie referentie
- `docs/design/werkindeling-v4/daisy-panel.html` — Daisy referentie
- `docs/design/werkindeling-v4/script.js` — JS gedrag als referentie

---

## Bestandsmap (compleet overzicht)

```
apps/web/src/components/ti-studio/werkbord/
├── tokens.css                  ← NIEUW: OW design tokens
├── types.ts                    ← NIEUW: lokale types (hergebruikt van scenario/types.ts)
├── TiStudioShell.tsx           ← NIEUW: root shell, state, grid
├── Ribbon.tsx                  ← NIEUW: linker icoonbalk
├── Toolbar.tsx                 ← NIEUW: bovenste toolbar
├── SpelersPoolDrawer.tsx       ← NIEUW: linker spelerspool drawer
├── WerkbordCanvas.tsx          ← NIEUW: canvas met teamkaarten
├── TeamKaart.tsx               ← NIEUW: teamkaart (3 formaten)
├── TeamKaartSpelerRij.tsx      ← NIEUW: spelerrij in kaart
├── ValidatieDrawer.tsx         ← NIEUW: rechter validatiedrawer
├── DaisyPanel.tsx              ← NIEUW: floating Daisy chat
└── hooks/
    ├── useZoom.ts              ← NIEUW: zoom state + breakpoints
    └── useDrag.ts              ← NIEUW: drag state

apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/
└── page.tsx                    ← WIJZIG: verwijzing van ScenarioEditorFullscreen → TiStudioShell
```

---

## Task 1: Design tokens + lokale types

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/tokens.css`
- Create: `apps/web/src/components/ti-studio/werkbord/types.ts`

- [ ] **Stap 1: Maak de tokens.css aan**

Kopieer letterlijk uit `docs/design/werkindeling-v4/tokens.css`. Geen aanpassingen.

```css
/* apps/web/src/components/ti-studio/werkbord/tokens.css */
/* OW Design Tokens — 1-op-1 uit werkindeling-v4.html */

:root {
  --bg-0: #0a0a0a;
  --bg-1: #141414;
  --bg-2: #1e1e1e;
  --bg-3: #262626;
  --accent:     #FF6B00;
  --accent-h:   #FF8533;
  --accent-dim: rgba(255,107,0,.12);
  --accent-glow: 0 0 0 1px rgba(255,107,0,.4), 0 0 16px rgba(255,107,0,.2);
  --text-1: #FAFAFA;
  --text-2: #A3A3A3;
  --text-3: #666666;
  --border-0: #262626;
  --border-1: #3a3a3a;
  --ok:   #22C55E;
  --warn: #EAB308;
  --err:  #EF4444;
  --info: #3B82F6;
  --pink: #EC4899;
  --blue: #60A5FA;

  --cat-blauw:  #3B82F6;
  --cat-groen:  #22C55E;
  --cat-geel:   #EAB308;
  --cat-oranje: #F97316;
  --cat-rood:   #EF4444;
  --cat-senior: #9CA3AF;

  --ribbon: 48px;
  --toolbar: 52px;
  --pool-w: 224px;
  --val-w: 280px;
  --daisy-w: 320px;
  --card-radius: 14px;
  --sh-card: 0 2px 4px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.35);
  --sh-raise: 0 4px 12px rgba(0,0,0,.5), 0 16px 40px rgba(0,0,0,.4);
}
```

- [ ] **Stap 2: Maak types.ts aan**

```typescript
// apps/web/src/components/ti-studio/werkbord/types.ts
// Lokale types voor het werkbord — gebaseerd op bestaande types in components/teamindeling/scenario/types.ts

export type Geslacht = "V" | "M";
export type SpelerStatus =
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GAAT_STOPPEN"
  | "GESTOPT"
  | "AFGEMELD";

export type ZoomLevel = "compact" | "normaal" | "detail";
export type KaartFormaat = "viertal" | "achtal" | "selectie";
export type KnkvCategorie = "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior";

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
  teamId: string | null; // null = niet ingedeeld
  gepind: boolean;
  isNieuw: boolean; // eerste seizoen
}

export interface WerkbordSpelerInTeam {
  id: string; // TeamSpeler.id
  spelerId: string;
  speler: WerkbordSpeler;
  notitie: string | null;
}

export interface WerkbordTeam {
  id: string;
  naam: string;
  categorie: string; // "U14", "Sen 1", etc.
  kleur: KnkvCategorie;
  formaat: KaartFormaat;
  volgorde: number;
  // Canvas positie
  canvasX: number;
  canvasY: number;
  // Spelers gesplitst op geslacht
  dames: WerkbordSpelerInTeam[];
  heren: WerkbordSpelerInTeam[];
  notitie: string | null;
  ussScore: number | null;
  gemiddeldeLeeftijd: number | null;
  validatieStatus: "ok" | "warn" | "err";
  validatieCount: number; // aantal waarschuwingen
}

export interface WerkbordValidatieItem {
  teamId: string;
  type: "ok" | "warn" | "err";
  regel: string;
  beschrijving: string;
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
```

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/tokens.css apps/web/src/components/ti-studio/werkbord/types.ts
git commit -m "feat(ti-studio): tokens + types voor werkbord clean-slate"
```

---

## Task 2: useZoom hook

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts`
- Test: `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.test.ts`

De hook beheert zoomniveau, slaat het op in localStorage, en berekent welk `ZoomLevel` actief is.

Breakpoints (uit prototype script.js):
- `< 0.64` → "compact"
- `0.64 – 1.0` → "normaal"
- `>= 1.0` → "detail"

- [ ] **Stap 1: Schrijf de failing test**

```typescript
// apps/web/src/components/ti-studio/werkbord/hooks/useZoom.test.ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useZoom } from "./useZoom";

describe("useZoom", () => {
  it("begint op 0.75 (normaal)", () => {
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoom).toBe(0.75);
    expect(result.current.zoomLevel).toBe("normaal");
  });

  it("zoomLevel is compact bij zoom < 0.64", () => {
    const { result } = renderHook(() => useZoom());
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

- [ ] **Stap 2: Run test — verwacht FAIL**

```bash
cd apps/web && pnpm vitest run src/components/ti-studio/werkbord/hooks/useZoom.test.ts
```

Verwacht: `Cannot find module './useZoom'`

- [ ] **Stap 3: Implementeer useZoom.ts**

```typescript
// apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts
"use client";
import { useState, useCallback } from "react";
import type { ZoomLevel } from "../types";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const DEFAULT_ZOOM = 0.75;

function toZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.64) return "compact";
  if (zoom < 1.0) return "normaal";
  return "detail";
}

export function useZoom() {
  const [zoom, setZoomRaw] = useState<number>(DEFAULT_ZOOM);

  const setZoom = useCallback((value: number) => {
    setZoomRaw(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)));
  }, []);

  const zoomIn = useCallback(() => setZoom(zoom + 0.1), [zoom, setZoom]);
  const zoomOut = useCallback(() => setZoom(zoom - 0.1), [zoom, setZoom]);
  const resetZoom = useCallback(() => setZoom(DEFAULT_ZOOM), [setZoom]);

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomLevel: toZoomLevel(zoom),
    zoomPercent: Math.round(zoom * 100),
  };
}
```

- [ ] **Stap 4: Run test — verwacht PASS**

```bash
cd apps/web && pnpm vitest run src/components/ti-studio/werkbord/hooks/useZoom.test.ts
```

Verwacht: 4 tests passed

- [ ] **Stap 5: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/hooks/
git commit -m "feat(ti-studio): useZoom hook met breakpoints compact/normaal/detail"
```

---

## Task 3: useDrag hook

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/hooks/useDrag.ts`

De hook beheert welke speler gesleept wordt en van/naar welk team/pool. Bouwt op `@dnd-kit/core` events.

- [ ] **Stap 1: Implementeer useDrag.ts**

```typescript
// apps/web/src/components/ti-studio/werkbord/hooks/useDrag.ts
"use client";
import { useState, useCallback } from "react";

export interface DragItem {
  spelerId: string;
  spelerNaam: string;
  vanTeamId: string | null; // null = vanuit pool
}

export interface DragState {
  actief: boolean;
  item: DragItem | null;
  overTeamId: string | null;
}

export function useDrag() {
  const [dragState, setDragState] = useState<DragState>({
    actief: false,
    item: null,
    overTeamId: null,
  });

  const startDrag = useCallback((item: DragItem) => {
    setDragState({ actief: true, item, overTeamId: null });
  }, []);

  const updateOver = useCallback((teamId: string | null) => {
    setDragState((prev) => ({ ...prev, overTeamId: teamId }));
  }, []);

  const endDrag = useCallback(() => {
    setDragState({ actief: false, item: null, overTeamId: null });
  }, []);

  return { dragState, startDrag, updateOver, endDrag };
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/hooks/useDrag.ts
git commit -m "feat(ti-studio): useDrag hook voor speler drag-and-drop state"
```

---

## Task 4: Ribbon component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/Ribbon.tsx`

Referentie: `docs/design/werkindeling-v4/ribbon.html`

- [ ] **Stap 1: Implementeer Ribbon.tsx**

```tsx
// apps/web/src/components/ti-studio/werkbord/Ribbon.tsx
"use client";
import "./tokens.css";

type ActivePanel = "pool" | "validatie" | "werkbord" | null;

interface RibbonProps {
  activePanel: ActivePanel;
  onTogglePanel: (panel: "pool" | "validatie" | "werkbord") => void;
  onToggleWhatIf: () => void;
  validatieHasErrors: boolean;
  gebruikerInitialen: string;
}

export function Ribbon({
  activePanel,
  onTogglePanel,
  onToggleWhatIf,
  validatieHasErrors,
  gebruikerInitialen,
}: RibbonProps) {
  return (
    <nav style={{
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
    }}>
      {/* Logo */}
      <div style={{
        width: 30, height: 30,
        background: "linear-gradient(135deg, #FF6B00, #FF8533)",
        borderRadius: 9,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 900, color: "#fff",
        marginBottom: 12, flexShrink: 0,
        boxShadow: "0 2px 8px rgba(255,107,0,.35)",
        letterSpacing: "-0.5px",
      }}>OW</div>

      {/* Hoofd-groep */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <RibbonBtn
          icon="pool"
          tip="Spelerspool"
          active={activePanel === "pool"}
          onClick={() => onTogglePanel("pool")}
        />
        <RibbonBtn
          icon="validatie"
          tip="Validatie"
          active={activePanel === "validatie"}
          onClick={() => onTogglePanel("validatie")}
          badge={validatieHasErrors}
        />
        <RibbonBtn
          icon="werkbord"
          tip="Werkbord"
          active={activePanel === "werkbord"}
          onClick={() => onTogglePanel("werkbord")}
        />
      </div>

      <div style={{ width: 22, height: 1, background: "var(--border-0)", margin: "6px 0" }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <RibbonBtn icon="whatif" tip="What-If" active={false} onClick={onToggleWhatIf} />
        <RibbonBtn icon="versies" tip="Versies" active={false} onClick={() => {}} />
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ width: 22, height: 1, background: "var(--border-0)", margin: "6px 0" }} />
        <RibbonBtn icon="instellingen" tip="Instellingen" active={false} onClick={() => {}} />
        <div
          title={gebruikerInitialen}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "#2a1a0a", border: "2px solid rgba(255,107,0,.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "var(--accent)",
            cursor: "pointer",
          }}
        >{gebruikerInitialen}</div>
      </div>
    </nav>
  );
}

/* ── Interne hulpcomponent ── */
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
        width: 36, height: 36, borderRadius: 9,
        display: "flex", alignItems: "center", justifyContent: "center",
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
        <span style={{
          position: "absolute", left: -1, top: 7, bottom: 7,
          width: 3, background: "var(--accent)",
          borderRadius: "0 2px 2px 0",
        }} />
      )}
      <RibbonIcon name={icon} />
      {badge && (
        <span style={{
          position: "absolute", top: 4, right: 4,
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--err)", border: "2px solid var(--bg-1)",
        }} />
      )}
    </button>
  );
}

function RibbonIcon({ name }: { name: string }) {
  const props = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "pool": return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "validatie": return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "werkbord": return <svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
    case "whatif": return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case "versies": return <svg {...props}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>;
    case "instellingen": return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
    default: return null;
  }
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/Ribbon.tsx
git commit -m "feat(ti-studio): Ribbon component — icoonbalk links"
```

---

## Task 5: Toolbar component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/Toolbar.tsx`

Referentie: `docs/design/werkindeling-v4/toolbar.html`

- [ ] **Stap 1: Implementeer Toolbar.tsx**

```tsx
// apps/web/src/components/ti-studio/werkbord/Toolbar.tsx
"use client";
import "./tokens.css";
import type { ZoomLevel } from "./types";

interface ToolbarProps {
  naam: string;
  versieNaam: string | null;
  versieNummer: number;
  status: "concept" | "definitief";
  totalSpelers: number;
  ingeplandSpelers: number;
  zoomLevel: ZoomLevel;
  zoomPercent: number;
  showScores: boolean;
  whatIfActief: boolean;
  onToggleWhatIf: () => void;
  onToggleScores: () => void;
  onNieuwTeam: () => void;
  onPreview: () => void;
  onTerug: () => void;
}

export function Toolbar({
  naam, versieNaam, versieNummer, status,
  totalSpelers, ingeplandSpelers,
  zoomLevel, zoomPercent,
  showScores, whatIfActief,
  onToggleWhatIf, onToggleScores, onNieuwTeam, onPreview, onTerug,
}: ToolbarProps) {
  const pct = totalSpelers > 0 ? Math.round((ingeplandSpelers / totalSpelers) * 100) : 0;
  const circumference = 75.4;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <header style={{
      gridColumn: "2",
      gridRow: "1",
      height: "var(--toolbar)",
      background: "var(--bg-1)",
      borderBottom: "1px solid var(--border-0)",
      display: "flex", alignItems: "center", gap: 8,
      padding: "0 14px",
      position: "relative", zIndex: 30,
      flexShrink: 0,
    }}>
      {/* Blauwe gradient-lijn onderaan */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 2,
        background: "linear-gradient(90deg, var(--info) 0%, transparent 40%)",
        opacity: 0.6,
        pointerEvents: "none",
      }} />

      {/* Terug knop */}
      <button onClick={onTerug} style={{
        display: "flex", alignItems: "center", gap: 5,
        background: "none", border: "none", color: "var(--text-3)",
        fontSize: 12, fontFamily: "inherit", cursor: "pointer",
        padding: "4px 6px", borderRadius: 6,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        TI Studio
      </button>

      <div style={{ width: 1, height: 20, background: "var(--border-0)", flexShrink: 0 }} />

      {/* Scenario naam */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{naam}</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
          v{versieNummer}{versieNaam ? ` — ${versieNaam}` : ""}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600,
        background: status === "concept" ? "rgba(234,179,8,.12)" : "rgba(34,197,94,.12)",
        color: status === "concept" ? "var(--warn)" : "var(--ok)",
        border: `1px solid ${status === "concept" ? "rgba(234,179,8,.2)" : "rgba(34,197,94,.2)"}`,
      }}>
        <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
        {status === "concept" ? "Concept" : "Definitief"}
      </div>

      <div style={{ width: 1, height: 20, background: "var(--border-0)", flexShrink: 0 }} />

      <div style={{ flex: 1 }} />

      {/* Progress counter */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 12px", background: "var(--bg-2)", border: "1px solid var(--border-1)",
        borderRadius: 9, fontSize: 12,
      }}>
        {/* Progress ring */}
        <div style={{ position: "relative", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="32" height="32" viewBox="0 0 32 32" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
            <circle cx="16" cy="16" r="12" fill="none" stroke="var(--border-1)" strokeWidth="2.5"/>
            <circle cx="16" cy="16" r="12" fill="none" stroke="var(--accent)" strokeWidth="2.5"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"/>
          </svg>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-1)", zIndex: 1 }}>{pct}%</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>Ingedeeld</div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{ingeplandSpelers}</span>
            <span style={{ color: "var(--text-3)", fontSize: 11 }}> / {totalSpelers}</span>
          </div>
        </div>
      </div>

      <div style={{ width: 1, height: 20, background: "var(--border-0)", flexShrink: 0 }} />

      {/* Zoom level badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
        background: "var(--bg-2)", border: "1px solid var(--border-1)",
        color: "var(--text-2)", whiteSpace: "nowrap",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        {zoomPercent}% · {zoomLevel.charAt(0).toUpperCase() + zoomLevel.slice(1)}
      </div>

      {/* What-If knop */}
      <TbBtn onClick={onToggleWhatIf} variant={whatIfActief ? "pri" : "ghost"}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        What-If
      </TbBtn>

      {/* Score toggle */}
      <TbBtn onClick={onToggleScores} variant={showScores ? "sec-active" : "sec"}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Score
      </TbBtn>

      {/* Nieuw team */}
      <TbBtn onClick={onNieuwTeam} variant="sec">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Team
      </TbBtn>

      {/* Preview */}
      <TbBtn onClick={onPreview} variant="pri">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Preview
      </TbBtn>
    </header>
  );
}

function TbBtn({ onClick, variant, children }: {
  onClick: () => void;
  variant: "pri" | "sec" | "sec-active" | "ghost";
  children: React.ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    pri: { background: "var(--accent)", color: "#fff", border: "none" },
    sec: { background: "var(--bg-2)", color: "var(--text-1)", border: "1px solid var(--border-1)" },
    "sec-active": { background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(255,107,0,.3)" },
    ghost: { background: "transparent", color: "var(--text-2)", border: "1px solid var(--border-0)" },
  };
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
      ...styles[variant],
    }}>
      {children}
    </button>
  );
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/Toolbar.tsx
git commit -m "feat(ti-studio): Toolbar component"
```

---

## Task 6: TeamKaartSpelerRij component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx`

Referentie: `.tc-sp` sectie in `docs/design/werkindeling-v4/team-kaart.html`

- [ ] **Stap 1: Implementeer TeamKaartSpelerRij.tsx**

```tsx
// apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx
"use client";
import "./tokens.css";
import type { WerkbordSpelerInTeam } from "./types";

interface TeamKaartSpelerRijProps {
  spelerInTeam: WerkbordSpelerInTeam;
  showRating: boolean;
  showLeeftijd: boolean;
  showIcons: boolean;
  showScore: boolean;
  huidigeJaar: number;
}

export function TeamKaartSpelerRij({
  spelerInTeam,
  showRating,
  showLeeftijd,
  showIcons,
  showScore,
  huidigeJaar,
}: TeamKaartSpelerRijProps) {
  const { speler } = spelerInTeam;
  const leeftijd = huidigeJaar - speler.geboortejaar;
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();

  const ratingKleur = speler.rating && speler.rating >= 7.5 ? "hi"
    : speler.rating && speler.rating >= 6.5 ? "md" : "lo";

  const ratingColors = {
    hi: { bg: "rgba(34,197,94,.15)", color: "var(--ok)" },
    md: { bg: "rgba(234,179,8,.1)", color: "var(--warn)" },
    lo: { bg: "rgba(239,68,68,.1)", color: "var(--err)" },
  };

  const ussKlasse = speler.rating && speler.rating >= 8 ? "score-top"
    : speler.rating && speler.rating >= 7 ? "score-goed"
    : speler.rating && speler.rating >= 6 ? "score-gem" : "score-att";

  const ussColors = {
    "score-top": { bg: "#22C55E", color: "#000" },
    "score-goed": { bg: "#3B82F6", color: "#fff" },
    "score-gem": { bg: "#EAB308", color: "#000" },
    "score-att": { bg: "#EF4444", color: "#fff" },
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "0 8px", borderRadius: 6,
      flex: 1, minHeight: 0,
      cursor: "grab",
    }}>
      {/* Avatar */}
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 8, fontWeight: 700, flexShrink: 0,
        background: geslacht === "v" ? "rgba(236,72,153,.15)" : "rgba(96,165,250,.15)",
        color: geslacht === "v" ? "var(--pink)" : "var(--blue)",
      }}>
        {initialen}
      </div>

      {/* Naam */}
      <div style={{
        fontSize: 11, flex: 1,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        fontWeight: 500,
        opacity: speler.status === "GAAT_STOPPEN" ? 0.5 : 1,
        textDecoration: speler.status === "GAAT_STOPPEN" ? "line-through" : "none",
      }}>
        {speler.roepnaam} {speler.achternaam.charAt(0)}.
      </div>

      {/* Leeftijd */}
      {showLeeftijd && (
        <div style={{ fontSize: 10, color: "var(--text-2)", flexShrink: 0 }}>
          {leeftijd}
        </div>
      )}

      {/* Status iconen */}
      {showIcons && (
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          {speler.gepind && <span style={{ fontSize: 9, color: "var(--accent)" }}>📌</span>}
          {speler.status === "AFGEMELD" && <span style={{ fontSize: 9, color: "var(--err)" }}>⚠</span>}
          {speler.status === "TWIJFELT" && <span style={{ fontSize: 9, color: "var(--warn)" }}>?</span>}
          {speler.isNieuw && <span style={{ fontSize: 9, color: "var(--ok)", background: "rgba(34,197,94,.1)", borderRadius: 3, padding: "1px 4px", fontWeight: 700 }}>N</span>}
        </div>
      )}

      {/* Rating */}
      {showRating && speler.rating !== null && (
        <div style={{
          width: 18, height: 14, borderRadius: 3,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, flexShrink: 0,
          ...ratingColors[ratingKleur],
        }}>
          {speler.rating.toFixed(1)}
        </div>
      )}

      {/* USS Score octagon */}
      {showScore && speler.rating !== null && (
        <div style={{
          clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, flexShrink: 0,
          width: 24, height: 24, fontSize: 8,
          ...ussColors[ussKlasse],
        }}>
          {Math.round(speler.rating)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx
git commit -m "feat(ti-studio): TeamKaartSpelerRij component"
```

---

## Task 7: TeamKaart component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx`

Referentie: `docs/design/werkindeling-v4/team-kaart.html`

De kaart heeft drie formaten en drie zoomniveaus. De zoomniveaus worden gestuurd via `data-zoom-level` attribuut van het canvas (niet per kaart).

- [ ] **Stap 1: Implementeer TeamKaart.tsx**

```tsx
// apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
"use client";
import "./tokens.css";
import { TeamKaartSpelerRij } from "./TeamKaartSpelerRij";
import type { WerkbordTeam, KaartFormaat, ZoomLevel } from "./types";

const KAART_BREEDTE: Record<KaartFormaat, number> = {
  viertal: 140,
  achtal: 280,
  selectie: 560,
};
const KAART_HOOGTE = 210;

const KNKV_KLEUR: Record<string, string> = {
  blauw: "var(--cat-blauw)",
  groen: "var(--cat-groen)",
  geel: "var(--cat-geel)",
  oranje: "var(--cat-oranje)",
  rood: "var(--cat-rood)",
  senior: "var(--cat-senior)",
};

const VAL_KLEUR: Record<string, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  err: "var(--err)",
};

interface TeamKaartProps {
  team: WerkbordTeam;
  zoomLevel: ZoomLevel;
  showScores: boolean;
  huidigeJaar: number;
  onBewerken: (teamId: string) => void;
  onDragMove: (e: React.MouseEvent, teamId: string) => void;
}

export function TeamKaart({
  team, zoomLevel, showScores, huidigeJaar, onBewerken, onDragMove,
}: TeamKaartProps) {
  const breedte = KAART_BREEDTE[team.formaat];
  const isCompact = zoomLevel === "compact";
  const isDetail = zoomLevel === "detail";

  const showLeeftijd = isDetail;
  const showRating = isDetail;
  const showIcons = isDetail;
  const showKolommen = !isCompact;
  const showFooter = !isCompact;

  return (
    <div
      onMouseDown={(e) => onDragMove(e, team.id)}
      style={{
        position: "absolute",
        left: team.canvasX,
        top: team.canvasY,
        width: breedte,
        height: KAART_HOOGTE,
        background: "var(--bg-1)",
        border: "1px solid var(--border-0)",
        borderRadius: "var(--card-radius)",
        boxShadow: "var(--sh-card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "default",
        animation: "fadeUp 250ms ease both",
      }}
    >
      {/* Kleurband links */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        background: KNKV_KLEUR[team.kleur] ?? "var(--cat-senior)",
      }} />

      <div style={{ padding: "0 8px 0 14px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          height: 36, display: "flex", alignItems: "center", gap: 6,
          borderBottom: isCompact ? "none" : "1px solid var(--border-0)",
          flexShrink: 0, cursor: "grab",
        }}>
          <div style={{
            fontSize: isCompact ? 18 : 13,
            fontWeight: isCompact ? 900 : 700,
            flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {team.naam}
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: isCompact ? 14 : 10, fontWeight: 600,
              padding: isCompact ? "2px 5px" : "2px 5px", borderRadius: 4,
              background: "rgba(236,72,153,.12)", color: "var(--pink)",
            }}>♀ {team.dames.length}</span>
            <span style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: isCompact ? 14 : 10, fontWeight: 600,
              padding: "2px 5px", borderRadius: 4,
              background: "rgba(96,165,250,.12)", color: "var(--blue)",
            }}>♂ {team.heren.length}</span>
          </div>
          {!isCompact && (
            <div style={{
              width: isCompact ? 14 : 8, height: isCompact ? 14 : 8, borderRadius: "50%", flexShrink: 0,
              background: VAL_KLEUR[team.validatieStatus],
            }} />
          )}
          {!isCompact && (
            <button
              onClick={(e) => { e.stopPropagation(); onBewerken(team.id); }}
              style={{
                width: 22, height: 22, borderRadius: 5,
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-3)", fontSize: 11, flexShrink: 0,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
        </div>

        {/* Compact stats */}
        {isCompact && (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
            {team.gemiddeldeLeeftijd && (
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                Gem. <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{team.gemiddeldeLeeftijd.toFixed(1)}j</span>
              </div>
            )}
            {team.ussScore && (
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                USS <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{team.ussScore.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Spelers kolommen */}
        {showKolommen && (
          <div style={{
            display: "flex",
            flexDirection: team.formaat === "viertal" ? "column" : "row",
            flex: 1, minHeight: 0, overflow: "hidden",
          }}>
            {/* Dames kolom */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderRight: team.formaat === "viertal" ? "none" : "1px solid var(--border-0)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-3)", padding: "2px 6px 0", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="var(--pink)"/></svg>
                Dames
              </div>
              {team.dames.map((sp) => (
                <TeamKaartSpelerRij
                  key={sp.id}
                  spelerInTeam={sp}
                  showRating={showRating}
                  showLeeftijd={showLeeftijd}
                  showIcons={showIcons}
                  showScore={showScores && isDetail}
                  huidigeJaar={huidigeJaar}
                />
              ))}
            </div>

            {/* Heren kolom */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-3)", padding: "2px 6px 0", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="var(--blue)"/></svg>
                Heren
              </div>
              {team.heren.map((sp) => (
                <TeamKaartSpelerRij
                  key={sp.id}
                  spelerInTeam={sp}
                  showRating={showRating}
                  showLeeftijd={showLeeftijd}
                  showIcons={showIcons}
                  showScore={showScores && isDetail}
                  huidigeJaar={huidigeJaar}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {showFooter && (
          <div style={{
            height: 28, display: "flex", alignItems: "center", gap: 6,
            padding: "0 8px", borderTop: "1px solid var(--border-0)", flexShrink: 0,
          }}>
            {team.gemiddeldeLeeftijd && (
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                Gem. <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{team.gemiddeldeLeeftijd.toFixed(1)}j</span>
              </div>
            )}
            {team.validatieCount > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 3,
                fontSize: 10, color: "var(--warn)",
                background: "rgba(234,179,8,.08)", padding: "2px 6px", borderRadius: 4,
              }}>
                ⚠ {team.validatieCount}
              </div>
            )}
            <div style={{ flex: 1 }} />
            {team.ussScore && (
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                USS <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{team.ussScore.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fade-up animatie in CSS */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
git commit -m "feat(ti-studio): TeamKaart component — 3 formaten, 3 zoomniveaus"
```

---

## Task 8: SpelersPoolDrawer component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx`

Referentie: `docs/design/werkindeling-v4/pool-drawer.html`

- [ ] **Stap 1: Implementeer SpelersPoolDrawer.tsx**

```tsx
// apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx
"use client";
import { useState } from "react";
import "./tokens.css";
import type { WerkbordSpeler, SpelerFilter } from "./types";

interface SpelersPoolDrawerProps {
  open: boolean;
  spelers: WerkbordSpeler[];
  onClose: () => void;
}

export function SpelersPoolDrawer({ open, spelers, onClose }: SpelersPoolDrawerProps) {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<SpelerFilter>("zonder_team");
  const [geslachtFilter, setGeslachtFilter] = useState<"alle" | "v" | "m">("alle");

  const gefilterd = spelers.filter((sp) => {
    const naam = `${sp.roepnaam} ${sp.achternaam}`.toLowerCase();
    if (zoek && !naam.includes(zoek.toLowerCase())) return false;
    if (geslachtFilter !== "alle" && sp.geslacht.toLowerCase() !== geslachtFilter) return false;
    if (filter === "zonder_team") return sp.teamId === null && sp.status !== "GAAT_STOPPEN" && sp.status !== "GESTOPT";
    if (filter === "ingedeeld") return sp.teamId !== null;
    return true;
  });

  const dames = gefilterd.filter((sp) => sp.geslacht === "V");
  const heren = gefilterd.filter((sp) => sp.geslacht === "M");

  return (
    <aside style={{
      width: open ? "var(--pool-w)" : 0,
      background: "var(--bg-1)",
      borderRight: "1px solid var(--border-0)",
      display: "flex", flexDirection: "column",
      flexShrink: 0,
      transition: "width 200ms ease, opacity 200ms ease",
      overflow: "hidden",
      opacity: open ? 1 : 0,
      pointerEvents: open ? "auto" : "none",
      position: "relative", zIndex: 20,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 12px 8px",
        borderBottom: "1px solid var(--border-0)",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "var(--text-3)" }}>
          Spelerspool
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <IconBtn onClick={() => setGeslachtFilter(geslachtFilter === "v" ? "alle" : "v")} active={geslachtFilter === "v"} title="Alleen dames">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M12 14v6M9 17h6"/></svg>
          </IconBtn>
          <IconBtn onClick={() => setGeslachtFilter(geslachtFilter === "m" ? "alle" : "m")} active={geslachtFilter === "m"} title="Alleen heren">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10" cy="14" r="6"/><path d="M20 4l-6 6M14 4h6v6"/></svg>
          </IconBtn>
          <IconBtn onClick={onClose} title="Sluiten">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </IconBtn>
        </div>
      </div>

      {/* Zoekbalk */}
      <div style={{ padding: "8px 10px", position: "relative", borderBottom: "1px solid var(--border-0)", flexShrink: 0 }}>
        <svg style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Zoek speler..."
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          style={{
            width: "100%", background: "var(--bg-0)", border: "1px solid var(--border-1)",
            borderRadius: 7, color: "var(--text-1)", fontSize: 12,
            fontFamily: "inherit", padding: "6px 10px 6px 28px", outline: "none",
          }}
        />
      </div>

      {/* Filter chips */}
      <div style={{ padding: "7px 10px 6px", display: "flex", flexWrap: "wrap", gap: 4, borderBottom: "1px solid var(--border-0)", flexShrink: 0 }}>
        {(["zonder_team", "ingedeeld", "alle"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            background: filter === f ? "var(--accent-dim)" : "var(--bg-2)",
            color: filter === f ? "var(--accent)" : "var(--text-3)",
            border: `1px solid ${filter === f ? "rgba(255,107,0,.3)" : "var(--border-1)"}`,
          }}>
            {{ zonder_team: "Zonder team", ingedeeld: "Ingedeeld", alle: "Alle" }[f]}
          </button>
        ))}
      </div>

      {/* Spelerslijst */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {dames.length > 0 && (
          <>
            <div style={{
              padding: "10px 10px 4px",
              fontSize: 9, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: ".6px", color: "var(--text-3)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>Dames</span>
              <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{dames.length}</span>
            </div>
            {dames.map((sp) => <PoolRij key={sp.id} speler={sp} />)}
          </>
        )}
        {heren.length > 0 && (
          <>
            <div style={{
              padding: "10px 10px 4px",
              fontSize: 9, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: ".6px", color: "var(--text-3)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>Heren</span>
              <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{heren.length}</span>
            </div>
            {heren.map((sp) => <PoolRij key={sp.id} speler={sp} />)}
          </>
        )}
        {gefilterd.length === 0 && (
          <div style={{ padding: "20px 12px", fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
            Geen spelers gevonden
          </div>
        )}
      </div>
    </aside>
  );
}

function PoolRij({ speler }: { speler: WerkbordSpeler }) {
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();
  const rating = speler.rating;
  const ratingKleur = rating && rating >= 7.5 ? { bg: "rgba(34,197,94,.15)", color: "var(--ok)" }
    : rating && rating >= 6.5 ? { bg: "rgba(234,179,8,.12)", color: "var(--warn)" }
    : { bg: "rgba(239,68,68,.12)", color: "var(--err)" };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      padding: "5px 10px",
      borderLeft: `2px solid ${geslacht === "v" ? "var(--pink)" : "var(--blue)"}`,
      opacity: speler.status === "GAAT_STOPPEN" ? 0.5 : 1,
      cursor: "grab",
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700,
        background: geslacht === "v" ? "rgba(236,72,153,.2)" : "rgba(96,165,250,.2)",
        color: geslacht === "v" ? "var(--pink)" : "var(--blue)",
      }}>
        {initialen}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 500,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          textDecoration: speler.status === "GAAT_STOPPEN" ? "line-through" : "none",
        }}>
          {speler.roepnaam} {speler.achternaam}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {new Date().getFullYear() - speler.geboortejaar}j
          {speler.teamId ? " · ingedeeld" : ""}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
        {speler.isNieuw && <span style={{ fontSize: 9, color: "var(--ok)", background: "rgba(34,197,94,.1)", borderRadius: 3, padding: "1px 4px", fontWeight: 700 }}>N</span>}
        {speler.gepind && <span style={{ fontSize: 10, color: "var(--accent)" }}>📌</span>}
        {speler.status === "AFGEMELD" && <span style={{ fontSize: 10, color: "var(--err)" }}>⚠</span>}
        {rating !== null && (
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 16, borderRadius: 4, fontSize: 10, fontWeight: 700, ...ratingKleur }}>
            {rating.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({ onClick, children, title, active = false }: { onClick: () => void; children: React.ReactNode; title: string; active?: boolean }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 26, height: 26, borderRadius: 6,
      background: active ? "var(--accent-dim)" : "none", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: active ? "var(--accent)" : "var(--text-3)",
    }}>
      {children}
    </button>
  );
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx
git commit -m "feat(ti-studio): SpelersPoolDrawer — zoeken, filteren, V/M"
```

---

## Task 9: ValidatieDrawer component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/ValidatieDrawer.tsx`

Referentie: `docs/design/werkindeling-v4/validatie-drawer.html`

- [ ] **Stap 1: Implementeer ValidatieDrawer.tsx**

```tsx
// apps/web/src/components/ti-studio/werkbord/ValidatieDrawer.tsx
"use client";
import { useState } from "react";
import "./tokens.css";
import type { WerkbordTeam, WerkbordValidatieItem } from "./types";

interface ValidatieDrawerProps {
  open: boolean;
  teams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  onClose: () => void;
}

export function ValidatieDrawer({ open, teams, validatie, onClose }: ValidatieDrawerProps) {
  const [actieveTab, setActieveTab] = useState(teams[0]?.id ?? "");

  const teamValidatie = validatie.filter((v) => v.teamId === actieveTab);
  const actieveTeam = teams.find((t) => t.id === actieveTab);

  const ICOON = { ok: "✓", warn: "⚠", err: "✕" };
  const VAL_KLEUR = {
    ok: { bg: "rgba(34,197,94,.06)", border: "rgba(34,197,94,.1)", icon: "var(--ok)" },
    warn: { bg: "rgba(234,179,8,.06)", border: "rgba(234,179,8,.1)", icon: "var(--warn)" },
    err: { bg: "rgba(239,68,68,.06)", border: "rgba(239,68,68,.1)", icon: "var(--err)" },
  };

  return (
    <aside style={{
      width: open ? "var(--val-w)" : 0,
      background: "var(--bg-1)",
      borderLeft: "1px solid var(--border-0)",
      display: "flex", flexDirection: "column",
      flexShrink: 0,
      transition: "width 200ms ease, opacity 200ms ease",
      overflow: "hidden",
      opacity: open ? 1 : 0,
      pointerEvents: open ? "auto" : "none",
      position: "relative", zIndex: 20,
    }}>
      {/* Team tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid var(--border-0)",
        overflowX: "auto", flexShrink: 0, padding: "0 12px",
      }}>
        {teams.map((team) => (
          <button key={team.id} onClick={() => setActieveTab(team.id)} style={{
            padding: "9px 10px 8px", fontSize: 11, fontWeight: 600,
            cursor: "pointer", border: "none", background: "none",
            color: actieveTab === team.id ? "var(--text-1)" : "var(--text-3)",
            borderBottom: `2px solid ${actieveTab === team.id ? "var(--accent)" : "transparent"}`,
            whiteSpace: "nowrap", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {team.naam}
            {team.validatieStatus !== "ok" && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: team.validatieStatus === "err" ? "var(--err)" : "var(--warn)", flexShrink: 0, display: "inline-block" }} />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
        {/* Stats grid */}
        {actieveTeam && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
            <StatCard label="Dames" value={actieveTeam.dames.length.toString()} />
            <StatCard label="Heren" value={actieveTeam.heren.length.toString()} />
            <StatCard label="Gem. leeftijd" value={actieveTeam.gemiddeldeLeeftijd ? `${actieveTeam.gemiddeldeLeeftijd.toFixed(1)}j` : "—"} />
            <StatCard label="USS score" value={actieveTeam.ussScore ? actieveTeam.ussScore.toFixed(2) : "—"} />
          </div>
        )}

        {/* Validatie items */}
        {teamValidatie.length === 0 ? (
          <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.1)" }}>
            <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 600 }}>✓ Voldoet aan alle regels</div>
          </div>
        ) : (
          teamValidatie.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "8px 10px", borderRadius: 8, marginBottom: 4,
              background: VAL_KLEUR[item.type].bg,
              border: `1px solid ${VAL_KLEUR[item.type].border}`,
            }}>
              <div style={{ fontSize: 14, flexShrink: 0, color: VAL_KLEUR[item.type].icon, marginTop: 1 }}>
                {ICOON[item.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{item.regel}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.4 }}>{item.beschrijving}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-0)", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/ValidatieDrawer.tsx
git commit -m "feat(ti-studio): ValidatieDrawer — tabs per team, statistieken"
```

---

## Task 10: DaisyPanel component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/DaisyPanel.tsx`

Referentie: `docs/design/werkindeling-v4/daisy-panel.html`

- [ ] **Stap 1: Implementeer DaisyPanel.tsx**

```tsx
// apps/web/src/components/ti-studio/werkbord/DaisyPanel.tsx
"use client";
import { useState } from "react";
import "./tokens.css";

export function DaisyPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "absolute", bottom: 20, right: 20,
          width: 48, height: 48, borderRadius: "50%",
          background: "var(--accent)", color: "#fff",
          display: open ? "none" : "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 20, cursor: "pointer", border: "none",
          boxShadow: "0 4px 16px rgba(255,107,0,.45)",
          zIndex: 30, fontFamily: "inherit",
        }}
      >✦</button>

      {/* Panel */}
      <div style={{
        position: "absolute", bottom: 16, right: 16,
        width: "var(--daisy-w)", height: 420,
        background: "var(--bg-1)", border: "1px solid var(--border-1)",
        borderRadius: 16,
        display: "flex", flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.15)",
        zIndex: 30, overflow: "hidden",
        transform: open ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
        transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        transformOrigin: "bottom right",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 14px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
          background: "linear-gradient(90deg, rgba(255,107,0,.08) 0%, transparent 60%)",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), #FF8533)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, flexShrink: 0,
            boxShadow: "0 0 10px rgba(255,107,0,.3)",
            position: "relative",
          }}>
            ✦
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--ok)", position: "absolute",
              bottom: 0, right: 0, border: "2px solid var(--bg-1)",
            }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Daisy</div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>AI-assistent · Teamindeling</div>
          </div>
          <button onClick={() => setOpen(false)} style={{
            marginLeft: "auto", width: 26, height: 26, borderRadius: 6,
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-3)", fontSize: 14,
          }}>✕</button>
        </div>

        {/* Berichten */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, var(--accent), #FF8533)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✦</div>
            <div>
              <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, background: "var(--bg-2)", border: "1px solid var(--border-1)", borderBottomLeftRadius: 4, fontSize: 12, lineHeight: 1.5 }}>
                Hoi! Ik ben Daisy. Ik help je met de teamindeling. Wat wil je weten?
              </div>
              <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 4 }}>Nu</div>
            </div>
          </div>
        </div>

        {/* Quick prompts */}
        <div style={{ display: "flex", gap: 4, padding: "6px 12px 0", overflowX: "auto", flexShrink: 0 }}>
          {["Welk team heeft ruimte?", "Leeftijdsbalans?", "Validatiefouten?"].map((p) => (
            <button key={p} style={{
              padding: "4px 9px", borderRadius: 6, whiteSpace: "nowrap",
              fontSize: 10, fontWeight: 600, cursor: "pointer",
              background: "var(--accent-dim)", color: "var(--accent)",
              border: "1px solid rgba(255,107,0,.2)", fontFamily: "inherit",
            }}>{p}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border-0)", display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
          <textarea
            placeholder="Vraag Daisy iets..."
            rows={1}
            style={{
              flex: 1, background: "var(--bg-2)", border: "1px solid var(--border-1)",
              borderRadius: 10, color: "var(--text-1)", fontSize: 12,
              fontFamily: "inherit", padding: "8px 12px", outline: "none",
              resize: "none", minHeight: 36, maxHeight: 80, lineHeight: 1.4,
            }}
          />
          <button style={{
            width: 34, height: 34, borderRadius: 9,
            background: "var(--accent)", color: "#fff", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, flexShrink: 0,
          }}>→</button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/DaisyPanel.tsx
git commit -m "feat(ti-studio): DaisyPanel — FAB + chat panel met spring-animatie"
```

---

## Task 11: WerkbordCanvas component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx`

Referentie: `docs/design/werkindeling-v4/canvas.html` en `script.js`

- [ ] **Stap 1: Implementeer WerkbordCanvas.tsx**

```tsx
// apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx
"use client";
import { useRef } from "react";
import "./tokens.css";
import { TeamKaart } from "./TeamKaart";
import { DaisyPanel } from "./DaisyPanel";
import type { WerkbordTeam, ZoomLevel } from "./types";

interface WerkbordCanvasProps {
  teams: WerkbordTeam[];
  zoomLevel: ZoomLevel;
  zoom: number;
  zoomPercent: number;
  showScores: boolean;
  whatIfActief: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomChange: (value: number) => void;
  onBewerkenTeam: (teamId: string) => void;
}

const CANVAS_W = 1400;
const CANVAS_H = 900;
const HUIDIGE_JAAR = new Date().getFullYear();

export function WerkbordCanvas({
  teams, zoomLevel, zoom, zoomPercent, showScores, whatIfActief,
  onZoomIn, onZoomOut, onZoomReset, onZoomChange, onBewerkenTeam,
}: WerkbordCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{
      flex: 1, position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 50%, rgba(255,107,0,.02) 0%, transparent 60%), var(--bg-0)",
    }}>
      {/* Dot-patroon achtergrond */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      {/* What-If indicator */}
      {whatIfActief && (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          background: "rgba(59,130,246,.15)", border: "1px solid rgba(59,130,246,.3)",
          borderRadius: 20, padding: "5px 14px", zIndex: 20,
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 12, color: "var(--info)",
          boxShadow: "0 2px 12px rgba(59,130,246,.2)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          What-If modus actief — wijzigingen worden niet opgeslagen
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        data-zoom-level={zoomLevel}
        style={{
          position: "absolute",
          width: CANVAS_W,
          height: CANVAS_H,
          transformOrigin: "0 0",
          transform: `scale(${zoom})`,
          transition: "transform 80ms ease-out",
        }}
      >
        {teams.map((team) => (
          <TeamKaart
            key={team.id}
            team={team}
            zoomLevel={zoomLevel}
            showScores={showScores}
            huidigeJaar={HUIDIGE_JAAR}
            onBewerken={onBewerkenTeam}
            onDragMove={() => {}}
          />
        ))}
      </div>

      {/* Zoom controls */}
      <div style={{
        position: "absolute", bottom: 16, left: 16,
        display: "flex", alignItems: "center", gap: 6,
        background: "var(--bg-2)", border: "1px solid var(--border-1)",
        borderRadius: 10, padding: "6px 10px",
        boxShadow: "var(--sh-card)", zIndex: 10,
      }}>
        <button onClick={onZoomOut} style={zoomBtnStyle}>−</button>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", minWidth: 36, textAlign: "center" }}>
          {zoomPercent}%
        </span>
        <button onClick={onZoomIn} style={zoomBtnStyle}>+</button>
        <div style={{ width: 1, height: 16, background: "var(--border-0)" }} />
        <input
          type="range"
          min={40} max={150} value={zoomPercent}
          onChange={(e) => onZoomChange(parseInt(e.target.value, 10) / 100)}
          style={{ width: 90, height: 4, accentColor: "var(--accent)", cursor: "pointer" }}
        />
        <div style={{ width: 1, height: 16, background: "var(--border-0)" }} />
        <button onClick={onZoomReset} style={{
          padding: "4px 8px", background: "none", border: "1px solid var(--border-1)",
          borderRadius: 6, color: "var(--text-2)", fontSize: 10, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>Fit</button>
      </div>

      {/* Minimap */}
      <div style={{
        position: "absolute", bottom: 16, right: 16,
        width: 140, height: 96,
        background: "var(--bg-2)", border: "1px solid var(--border-1)",
        borderRadius: 8, overflow: "hidden",
        boxShadow: "var(--sh-card)", zIndex: 10,
      }}>
        <div style={{
          position: "absolute", top: 8, left: 12,
          width: 60, height: 45,
          border: "1px solid rgba(255,107,0,.4)",
          background: "rgba(255,107,0,.06)",
          borderRadius: 3,
        }} />
        <div style={{
          position: "absolute", bottom: 4, right: 6,
          fontSize: 9, color: "var(--text-3)", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: ".4px",
        }}>Minimap</div>
      </div>

      {/* Daisy Panel */}
      <DaisyPanel />
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 6,
  background: "none", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--text-2)", fontSize: 14, fontWeight: 700,
};
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx
git commit -m "feat(ti-studio): WerkbordCanvas — teamkaarten, zoom, minimap, Daisy FAB"
```

---

## Task 12: TiStudioShell — root component

**Files:**
- Create: `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`

- [ ] **Stap 1: Implementeer TiStudioShell.tsx**

```tsx
// apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./tokens.css";
import { Ribbon } from "./Ribbon";
import { Toolbar } from "./Toolbar";
import { SpelersPoolDrawer } from "./SpelersPoolDrawer";
import { WerkbordCanvas } from "./WerkbordCanvas";
import { ValidatieDrawer } from "./ValidatieDrawer";
import { useZoom } from "./hooks/useZoom";
import type { TiStudioShellProps } from "./types";

type ActivePanel = "pool" | "validatie" | "werkbord" | null;

export function TiStudioShell({ initieleState, gebruikerEmail }: TiStudioShellProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<ActivePanel>("validatie");
  const [showScores, setShowScores] = useState(true);
  const [whatIfActief, setWhatIfActief] = useState(false);
  const { zoom, setZoom, zoomIn, zoomOut, resetZoom, zoomLevel, zoomPercent } = useZoom();

  const gebruikerInitialen = gebruikerEmail
    .split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  function togglePanel(panel: "pool" | "validatie" | "werkbord") {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  const hasErrors = initieleState.validatie.some((v) => v.type === "err");

  return (
    <div style={{
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
    }}>
      {/* Ribbon */}
      <Ribbon
        activePanel={activePanel}
        onTogglePanel={togglePanel}
        onToggleWhatIf={() => setWhatIfActief((v) => !v)}
        validatieHasErrors={hasErrors}
        gebruikerInitialen={gebruikerInitialen}
      />

      {/* Toolbar */}
      <Toolbar
        naam={initieleState.naam}
        versieNaam={initieleState.versieNaam}
        versieNummer={initieleState.versieNummer}
        status={initieleState.status}
        totalSpelers={initieleState.totalSpelers}
        ingeplandSpelers={initieleState.ingeplandSpelers}
        zoomLevel={zoomLevel}
        zoomPercent={zoomPercent}
        showScores={showScores}
        whatIfActief={whatIfActief}
        onToggleWhatIf={() => setWhatIfActief((v) => !v)}
        onToggleScores={() => setShowScores((v) => !v)}
        onNieuwTeam={() => {}}
        onPreview={() => {}}
        onTerug={() => router.push("/ti-studio")}
      />

      {/* Body */}
      <div style={{ gridColumn: 2, gridRow: 2, display: "flex", overflow: "hidden" }}>
        <SpelersPoolDrawer
          open={activePanel === "pool"}
          spelers={initieleState.alleSpelers}
          onClose={() => setActivePanel(null)}
        />
        <WerkbordCanvas
          teams={initieleState.teams}
          zoomLevel={zoomLevel}
          zoom={zoom}
          zoomPercent={zoomPercent}
          showScores={showScores}
          whatIfActief={whatIfActief}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={resetZoom}
          onZoomChange={setZoom}
          onBewerkenTeam={() => {}}
        />
        <ValidatieDrawer
          open={activePanel === "validatie"}
          teams={initieleState.teams}
          validatie={initieleState.validatie}
          onClose={() => setActivePanel(null)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
git commit -m "feat(ti-studio): TiStudioShell — root shell, state, grid layout"
```

---

## Task 13: Data-adapter in page.tsx

**Files:**
- Modify: `apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx`

Vertaal de bestaande Prisma-data naar `WerkbordState` en geef door aan `TiStudioShell`.

- [ ] **Stap 1: Lees de bestaande page.tsx**

```bash
cat apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/page.tsx
```

- [ ] **Stap 2: Schrijf de adapter-functie en vervang de pagina**

```typescript
// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx
export const dynamic = "force-dynamic";

import { auth } from "@oranje-wit/auth";
import { getOfMaakWerkindelingVoorSeizoen } from "./actions";
import { getWerkindelingVoorEditor, getAlleSpelers } from "./werkindeling-actions";
import { TiStudioShell } from "@/components/ti-studio/werkbord/TiStudioShell";
import type { WerkbordState, WerkbordSpeler, WerkbordTeam, WerkbordValidatieItem } from "@/components/ti-studio/werkbord/types";

export default async function IndelingPage() {
  const session = await auth();
  const gebruikerEmail = session?.user?.email ?? "systeem";

  const werkindeling = await getOfMaakWerkindelingVoorSeizoen(gebruikerEmail);
  if (!werkindeling) {
    return (
      <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 14, color: "var(--text-3)" }}>
          Geen actief seizoen gevonden. Maak eerst een seizoen aan via Beheer.
        </p>
      </div>
    );
  }

  const volledig = await getWerkindelingVoorEditor(werkindeling.id);
  if (!volledig) return null;

  const prismaSpelers = await getAlleSpelers();
  const huidigeJaar = new Date().getFullYear();
  const versie = volledig.versies[0];

  // Bouw teamId-lookup: spelerId → teamId
  const spelerTeamMap = new Map<string, string>();
  if (versie) {
    for (const team of versie.teams) {
      for (const ts of team.spelers) {
        spelerTeamMap.set(ts.spelerId, team.id);
      }
    }
  }

  // Alle spelers als WerkbordSpeler
  const alleSpelers: WerkbordSpeler[] = (prismaSpelers as any[]).map((sp) => ({
    id: sp.id,
    roepnaam: sp.roepnaam ?? sp.naam ?? "Onbekend",
    achternaam: sp.achternaam ?? "",
    geboortejaar: sp.geboortejaar ?? huidigeJaar - 20,
    geslacht: sp.geslacht === "V" ? "V" : "M",
    status: (sp.status ?? "BESCHIKBAAR") as WerkbordSpeler["status"],
    rating: sp.rating ?? null,
    notitie: sp.notitie ?? null,
    afmelddatum: sp.afmelddatum ?? null,
    teamId: spelerTeamMap.get(sp.id) ?? null,
    gepind: false,
    isNieuw: false,
  }));

  // Teams als WerkbordTeam
  const teams: WerkbordTeam[] = (versie?.teams ?? []).map((team, i) => {
    const dames = team.spelers
      .filter((ts: any) => ts.speler?.geslacht === "V")
      .map((ts: any) => ({
        id: ts.id,
        spelerId: ts.spelerId,
        speler: alleSpelers.find((s) => s.id === ts.spelerId) ?? {
          id: ts.spelerId,
          roepnaam: ts.speler?.roepnaam ?? "?",
          achternaam: ts.speler?.achternaam ?? "",
          geboortejaar: ts.speler?.geboortejaar ?? huidigeJaar - 15,
          geslacht: "V" as const,
          status: "BESCHIKBAAR" as const,
          rating: ts.speler?.rating ?? null,
          notitie: null, afmelddatum: null, teamId: team.id, gepind: false, isNieuw: false,
        },
        notitie: ts.notitie ?? null,
      }));

    const heren = team.spelers
      .filter((ts: any) => ts.speler?.geslacht === "M")
      .map((ts: any) => ({
        id: ts.id,
        spelerId: ts.spelerId,
        speler: alleSpelers.find((s) => s.id === ts.spelerId) ?? {
          id: ts.spelerId,
          roepnaam: ts.speler?.roepnaam ?? "?",
          achternaam: ts.speler?.achternaam ?? "",
          geboortejaar: ts.speler?.geboortejaar ?? huidigeJaar - 15,
          geslacht: "M" as const,
          status: "BESCHIKBAAR" as const,
          rating: ts.speler?.rating ?? null,
          notitie: null, afmelddatum: null, teamId: team.id, gepind: false, isNieuw: false,
        },
        notitie: ts.notitie ?? null,
      }));

    const totaalSpelers = team.spelers.length;
    const gemLeeftijd = team.spelers.reduce((acc: number, ts: any) => {
      return acc + (huidigeJaar - (ts.speler?.geboortejaar ?? huidigeJaar - 15));
    }, 0) / (totaalSpelers || 1);

    // Formaat bepalen op basis van aantal spelers + type
    const formaat = dames.length <= 2 && heren.length <= 2 ? "viertal"
      : dames.length <= 4 && heren.length <= 4 ? "achtal" : "selectie";

    // Kleur mapping
    const kleurMap: Record<string, string> = {
      BLAUW: "blauw", GROEN: "groen", GEEL: "geel",
      ORANJE: "oranje", ROOD: "rood", SENIOR: "senior",
    };

    // Grid-positie: 3 kolommen, 380px stapeling
    const col = i % 3;
    const rij = Math.floor(i / 3);

    return {
      id: team.id,
      naam: team.naam,
      categorie: team.categorie ?? "Senior",
      kleur: (kleurMap[team.kleur ?? ""] ?? "senior") as WerkbordTeam["kleur"],
      formaat: formaat as WerkbordTeam["formaat"],
      volgorde: team.volgorde,
      canvasX: 40 + col * 320,
      canvasY: 60 + rij * 240,
      dames,
      heren,
      notitie: null,
      ussScore: null,
      gemiddeldeLeeftijd: Math.round(gemLeeftijd * 10) / 10,
      validatieStatus: "ok" as const,
      validatieCount: 0,
    };
  });

  const ingeplandSpelers = alleSpelers.filter((s) => s.teamId !== null).length;

  const initieleState: WerkbordState = {
    teams,
    alleSpelers,
    validatie: [] as WerkbordValidatieItem[],
    werkindelingId: volledig.id,
    versieId: versie?.id ?? "",
    seizoen: volledig.kaders.seizoen,
    naam: volledig.naam,
    status: (volledig.status === "DEFINITIEF" ? "definitief" : "concept"),
    versieNummer: versie?.nummer ?? 1,
    versieNaam: versie?.naam ?? null,
    totalSpelers: alleSpelers.length,
    ingeplandSpelers,
  };

  return <TiStudioShell initieleState={initieleState} gebruikerEmail={gebruikerEmail} />;
}
```

- [ ] **Stap 3: Run typecheck**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm --filter web tsc --noEmit 2>&1 | head -30
```

Los eventuele typefouten op voor je commit.

- [ ] **Stap 4: Commit**

```bash
git add apps/web/src/app/\(teamindeling-studio\)/ti-studio/indeling/page.tsx
git commit -m "feat(ti-studio): page.tsx gebruikt TiStudioShell — clean-slate compleet"
```

---

## Task 14: Smoke test — visueel controleren

- [ ] **Stap 1: Start de dev server**

```bash
cd c:/Users/Antjan/oranje-wit && pnpm dev
```

- [ ] **Stap 2: Open de pagina**

Ga naar: `http://localhost:3000/ti-studio/indeling`

Controleer visueel:
- [ ] Shell grid zichtbaar: ribbon links, toolbar boven, body met kaarten
- [ ] Ribbon: OW logo, iconen, actieve staat met oranje balk
- [ ] Toolbar: scenario naam, status badge, progress ring, zoom badge, knoppen
- [ ] Canvas: teamkaarten zichtbaar op dot-patroon achtergrond
- [ ] Teamkaarten: kleurband, naam, V/M tellers, spelerrijen
- [ ] Validatie drawer rechts: tabs per team
- [ ] Zoom slider werkt: compact/normaal/detail wisselt

- [ ] **Stap 3: TypeScript check**

```bash
pnpm --filter web tsc --noEmit 2>&1 | head -20
```

Verwacht: geen fouten.

- [ ] **Stap 4: Format**

```bash
pnpm format
```

- [ ] **Stap 5: Commit**

```bash
git add -A
git commit -m "fix(ti-studio): smoke test fixes — format + typefouten"
```

---

## Zelf-review checklist

**Spec coverage:**
- ✓ Shell grid layout (ribbon + toolbar + body)
- ✓ Ribbon met 5 iconen, actieve staat, validatie-badge
- ✓ Toolbar met alle elementen uit prototype
- ✓ SpelersPoolDrawer: zoeken, filteren, V/M secties
- ✓ WerkbordCanvas: dot-patroon, zoom slider, minimap, what-if indicator
- ✓ TeamKaart: 3 formaten, 3 zoomniveaus, kleurband, header/body/footer
- ✓ TeamKaartSpelerRij: avatar, naam, leeftijd, rating, USS score, iconen
- ✓ ValidatieDrawer: tabs per team, stats grid, validatie items
- ✓ DaisyPanel: FAB, spring-animatie, berichten, quick prompts, input
- ✓ Design tokens: 1-op-1 uit prototype
- ✓ Geen gebruik van `components/teamindeling/scenario/` in nieuwe code

**Buiten scope (bewust weggelaten, te implementeren in volgende stap):**
- Drag-and-drop speler verplaatsen (useDrag.ts aanwezig, nog niet gekoppeld aan dnd-kit)
- Validatie-berekening (werkt met lege array voor nu)
- Speler-profielkaart (popup bij click)
- Canvas pan (muissleuren)
- Versie-selector in toolbar
- Nieuw team aanmaken dialog
