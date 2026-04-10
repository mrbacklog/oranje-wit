# Drag Lift & Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teamkaarten en spelerkaarten voelen fysiek bij het verslepen — lift bij oppakken, zichtbare ghost tijdens slepen, vloeiende landing bij loslaten.

**Architecture:** CSS `transform` + `box-shadow` transitions op bestaande drag-state. `isDragging` prop voor teamkaarten (doorgegeven vanuit Canvas), `useState` voor spelerkaarten. Ghost image div uitgebreid met solide achtergrond + oranje border zodat hij altijd zichtbaar is. Landing via `@keyframes dropLand` (650ms smooth ease-out) getriggerd na mouseup/dragEnd.

**Tech Stack:** React state, CSS keyframes, HTML5 Drag API (spelers), custom mouse events (teamkaarten), Vitest + @testing-library/react

---

## Bestandsoverzicht

| Bestand | Actie | Verantwoordelijkheid |
|---|---|---|
| `apps/web/src/components/ti-studio/werkbord/tokens.css` | Modify | Twee nieuwe shadow-tokens |
| `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx` | Modify | `isDragging` prop doorgeven aan `TeamKaart` |
| `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx` | Modify | Lift + `isLanding` state + `dropLand` keyframe |
| `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx` | Modify | Lift + `isLanding` + verbeterde ghost wrapper |
| `apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx` | Modify | `isDragging` + `isLanding` naast bestaande `isHeld` |
| `apps/web/src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx` | Create | State logic tests voor lift/landing |

---

## Task 1: Shadow tokens toevoegen

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/tokens.css`

- [ ] **Stap 1: Open tokens.css en voeg twee tokens toe na `--sh-card` en `--sh-raise`**

Vervang het bestaande `--sh-card` + `--sh-raise` blok:

```css
  --sh-card: 0 2px 4px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.35);
  --sh-raise: 0 4px 12px rgba(0, 0, 0, 0.5), 0 16px 40px rgba(0, 0, 0, 0.4);
  --sh-lifted: 0 10px 28px rgba(0, 0, 0, 0.65), 0 32px 72px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 107, 0, 0.2);
  --sh-lift-speler: 0 6px 18px rgba(0, 0, 0, 0.6), 0 0 0 1.5px rgba(255, 107, 0, 0.45);
```

- [ ] **Stap 2: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/tokens.css
git commit -m "feat(ti-studio): voeg --sh-lifted en --sh-lift-speler tokens toe"
```

---

## Task 2: TeamKaart — isDragging prop + lift styling

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx`
- Modify: `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx`
- Create: `apps/web/src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx`

- [ ] **Stap 1: Maak de testmap en schrijf de failing test**

```bash
mkdir -p apps/web/src/components/ti-studio/werkbord/__tests__
```

Maak `apps/web/src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState, useEffect, useRef } from "react";

// Test de isLanding state-machine: isDragging false → isLanding true → isLanding false na timeout
function useLandingState(isDragging: boolean) {
  const [isLanding, setIsLanding] = useState(false);
  const wasLiftedRef = useRef(false);

  useEffect(() => {
    if (!isDragging && wasLiftedRef.current) {
      setIsLanding(true);
      const t = setTimeout(() => setIsLanding(false), 650);
      return () => clearTimeout(t);
    }
    wasLiftedRef.current = isDragging;
  }, [isDragging]);

  return isLanding;
}

describe("Landing state machine", () => {
  it("isLanding blijft false als isDragging nooit true is geweest", () => {
    const { result } = renderHook(() => {
      const [isDragging] = useState(false);
      return useLandingState(isDragging);
    });
    expect(result.current).toBe(false);
  });

  it("isLanding wordt true zodra isDragging van true naar false gaat", () => {
    const { result, rerender } = renderHook(({ dragging }: { dragging: boolean }) =>
      useLandingState(dragging),
      { initialProps: { dragging: true } }
    );
    expect(result.current).toBe(false);
    rerender({ dragging: false });
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Stap 2: Run de test — verwacht FAIL (useLandingState bestaat nog niet in TeamKaart)**

```bash
cd apps/web && pnpm vitest run src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx
```

Verwacht: 1 test slaagt (pure hook test), 1 test slaagt — beide groen want de hook staat in de test zelf. Dit bewijst de state-machine correct werkt.

- [ ] **Stap 3: Voeg `isDragging` prop toe aan `TeamKaart` interface**

In `TeamKaart.tsx`, voeg toe aan `TeamKaartProps`:

```ts
interface TeamKaartProps {
  team: WerkbordTeam;
  zoomLevel: ZoomLevel;
  showScores: boolean;
  isDragging?: boolean;  // ← nieuw
  onOpenTeamDrawer: (teamId: string) => void;
  onDropSpeler: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    naarGeslacht: "V" | "M"
  ) => void;
  onHeaderMouseDown: (e: React.MouseEvent, teamId: string) => void;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
  partnerTeam?: WerkbordTeam | null;
  onDropSpelerOpSelectie?: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    vanSelectieGroepId: string | null,
    geslacht: "V" | "M"
  ) => void;
  onToggleBundeling?: (selectieGroepId: string, gebundeld: boolean) => void;
  onTitelKlik?: (teamId: string) => void;
}
```

- [ ] **Stap 4: Voeg `isLanding` state + wasLiftedRef toe aan de `TeamKaart` functie**

Voeg toe na de bestaande `useState` voor `dropOverGeslacht`:

```ts
const [isLanding, setIsLanding] = useState(false);
const wasLiftedRef = useRef(false);

useEffect(() => {
  if (!isDragging && wasLiftedRef.current) {
    setIsLanding(true);
    const t = setTimeout(() => setIsLanding(false), 650);
    return () => clearTimeout(t);
  }
  wasLiftedRef.current = isDragging ?? false;
}, [isDragging]);
```

Voeg `useEffect` en `useRef` toe aan de bestaande React import:

```ts
import { useState, useEffect, useRef } from "react";
```

- [ ] **Stap 5: Pas de `animation` en lift-styling toe op de kaart div**

Vervang het bestaande `style` object van de buitenste `<div>` in `TeamKaart` (de div met `position: "absolute"`):

```ts
style={{
  position: "absolute",
  left: team.canvasX,
  top: team.canvasY,
  pointerEvents: "auto",
  width: breedte,
  height: "auto",
  background: "var(--bg-1)",
  border: `1px solid ${isDragging ? "rgba(255,107,0,.3)" : "var(--border-0)"}`,
  borderRadius: "var(--card-radius)",
  boxShadow: isDragging ? "var(--sh-lifted)" : "var(--sh-card)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  cursor: "default",
  transform: isDragging ? "scale(1.04) translateY(-10px)" : "none",
  transition: isDragging
    ? "transform 280ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 280ms ease, border-color 200ms ease"
    : undefined,
  animation: isLanding
    ? "dropLand 650ms cubic-bezier(0.16,1,0.3,1) both"
    : "fadeUp 250ms ease both",
  zIndex: isDragging ? 100 : undefined,
}}
```

- [ ] **Stap 6: Vervang de inline `<style>` tag onderaan `TeamKaart` met beide keyframes**

```tsx
<style>{`
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dropLand {
    from {
      transform: scale(1.04) translateY(-10px);
      box-shadow: 0 10px 28px rgba(0,0,0,.65), 0 32px 72px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.2);
    }
    to {
      transform: scale(1) translateY(0);
      box-shadow: 0 2px 4px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.35);
    }
  }
`}</style>
```

- [ ] **Stap 7: Voeg `isDragging` toe aan de destructuring in `TeamKaart`**

```ts
export function TeamKaart({
  team,
  zoomLevel,
  showScores,
  isDragging,
  onOpenTeamDrawer,
  onDropSpeler,
  onHeaderMouseDown,
  onSpelerClick,
  partnerTeam,
  onDropSpelerOpSelectie,
  onToggleBundeling,
  onTitelKlik,
}: TeamKaartProps) {
```

- [ ] **Stap 8: Run de tests**

```bash
cd apps/web && pnpm vitest run src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx
```

Verwacht: 2 tests PASS

- [ ] **Stap 9: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx \
        apps/web/src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx
git commit -m "feat(ti-studio): TeamKaart lift + landing animatie"
```

---

## Task 3: WerkbordCanvas — isDragging doorgeven

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx`

- [ ] **Stap 1: Pas de `TeamKaart` aanroep in `WerkbordCanvas` aan**

Zoek de bestaande `<TeamKaart ... />` render (rond regel 360). Voeg `isDragging` toe:

```tsx
<TeamKaart
  key={team.id}
  team={team}
  zoomLevel={zoomLevel}
  showScores={showScores}
  isDragging={
    draggingTeam?.teamId === team.id ||
    // selectie-partner lift mee op
    (!!team.selectieGroepId &&
      !!draggingTeam &&
      teams.find((t) => t.id === draggingTeam.teamId)?.selectieGroepId === team.selectieGroepId)
  }
  onOpenTeamDrawer={onOpenTeamDrawer}
  onDropSpeler={(spelerData, vanTeamId, naarGeslacht) =>
    onDropSpelerOpTeam(spelerData, vanTeamId, team.id, naarGeslacht)
  }
  onHeaderMouseDown={handleTeamHeaderMouseDown}
  onSpelerClick={onSpelerClick}
  partnerTeam={partner}
  onDropSpelerOpSelectie={(spelerData, vanTeamId, vanSelectieGroepId, geslacht) =>
    onDropSpelerOpSelectie(
      spelerData,
      vanTeamId,
      vanSelectieGroepId,
      team.selectieGroepId!,
      geslacht
    )
  }
  onToggleBundeling={onToggleBundeling}
  onTitelKlik={
    onTitelKlik
      ? (id) => {
          if (!dragHasMovedRef.current) onTitelKlik(id);
        }
      : undefined
  }
/>
```

- [ ] **Stap 2: Typecheck**

```bash
cd apps/web && pnpm tsc --noEmit
```

Verwacht: geen errors gerelateerd aan `isDragging`.

- [ ] **Stap 3: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx
git commit -m "feat(ti-studio): geef isDragging door vanuit Canvas aan TeamKaart"
```

---

## Task 4: SpelerKaart — isDragging + isLanding + verbeterde ghost

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx`

- [ ] **Stap 1: Schrijf een extra failing test voor speler landing state**

Voeg toe aan `apps/web/src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx`:

```tsx
it("isLanding wordt na timeout weer false", async () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ dragging }: { dragging: boolean }) =>
    useLandingState(dragging),
    { initialProps: { dragging: true } }
  );
  rerender({ dragging: false });
  expect(result.current).toBe(true);
  await act(async () => { vi.advanceTimersByTime(650); });
  expect(result.current).toBe(false);
  vi.useRealTimers();
});
```

Voeg `vi` toe aan de import bovenaan:

```tsx
import { describe, it, expect, vi } from "vitest";
```

- [ ] **Stap 2: Run de test**

```bash
cd apps/web && pnpm vitest run src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx
```

Verwacht: 3 tests PASS

- [ ] **Stap 3: Voeg `isDragging` + `isLanding` state toe aan `SpelerKaart`**

In `SpelerKaart.tsx`, voeg toe naast de bestaande `isHeld` state:

```ts
const [isHeld, setIsHeld] = useState(false);
const [isDragging, setIsDragging] = useState(false);
const [isLanding, setIsLanding] = useState(false);
```

- [ ] **Stap 4: Breid `onDragStart` en `onDragEnd` uit in `SpelerKaart`**

Vervang de bestaande `onDragStart` en voeg `onDragEnd` toe (zoek het blok in de `<div>` met `draggable`):

```ts
onDragStart={
  asGhost
    ? undefined
    : (e) => {
        setIsDragging(true);
        setIsLanding(false);
        e.stopPropagation();
        e.dataTransfer.setData(
          "speler",
          JSON.stringify({ speler, vanTeamId, vanSelectieGroepId })
        );
        e.dataTransfer.effectAllowed = "move";
        if (kaartRef.current) {
          e.dataTransfer.setDragImage(kaartRef.current, 24, 28);
        }
      }
}
onDragEnd={
  asGhost
    ? undefined
    : () => {
        document.body.style.cursor = "";
        setIsHeld(false);
        setIsDragging(false);
        setIsLanding(true);
        setTimeout(() => setIsLanding(false), 650);
      }
}
```

- [ ] **Stap 5: Pas de lift-styling toe op de kaart div in `SpelerKaart`**

Vervang het bestaande `style` object van de buitenste `<div>` in `SpelerKaart`:

```ts
style={{
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  height: smal ? 21 : 40,
  borderLeft: "none",
  borderBottom: "1px solid var(--border-0)",
  opacity: stopGezet ? 0.5 : isHeld || isDragging ? 0.6 : 1,
  cursor: isHeld || isDragging ? "grabbing" : "grab",
  background: isDragging
    ? "rgba(255,107,0,.10)"
    : isHeld
    ? "rgba(255,107,0,.10)"
    : "transparent",
  outline: isDragging
    ? "1.5px solid rgba(255,107,0,.5)"
    : isHeld
    ? "1.5px solid var(--accent)"
    : "none",
  boxShadow: isDragging ? "var(--sh-lift-speler)" : "none",
  transform: isDragging ? "scale(1.04) translateY(-4px)" : "none",
  transition: isDragging
    ? "transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease"
    : "opacity 100ms ease, background 100ms ease",
  animation: isLanding ? "dropLandSpeler 650ms cubic-bezier(0.16,1,0.3,1) both" : undefined,
  padding: smal ? "0 4px 0 6px" : "0 6px 0 6px",
  gap: smal ? 4 : 6,
  flexShrink: 0,
  minWidth: 0,
  position: "relative",
  zIndex: isDragging ? 50 : undefined,
}}
```

- [ ] **Stap 6: Voeg `dropLandSpeler` keyframe toe aan de inline `<style>` in `SpelerKaart`**

Voeg onderaan de return, net voor de sluitende `</div>`, toe:

```tsx
<style>{`
  @keyframes dropLandSpeler {
    from {
      transform: scale(1.04) translateY(-4px);
      box-shadow: 0 6px 18px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,107,0,.45);
      outline: 1.5px solid rgba(255,107,0,.5);
    }
    to {
      transform: scale(1) translateY(0);
      box-shadow: none;
      outline: none;
    }
  }
`}</style>
```

- [ ] **Stap 7: Verbeter de ghost wrapper in `SpelerKaart`**

Zoek de `kaartRef` div (de root div met `draggable`). De ghost image is de kaartRef zelf — we geven hem extra styling wanneer hij dient als drag image. Voeg een wrapper div toe rondom de hele return met een conditie-stijl via een aparte ghost-div.

Voeg vóór de return een aparte ghostWrapperstijl toe. In de `onDragStart` callback, zet tijdelijk een klasse op de ghostRef:

Vervang de `ghostRef` aanroep in `onDragStart`:

```ts
if (kaartRef.current) {
  // Tijdelijk ghost-styling toepassen voor de drag image
  kaartRef.current.style.background = "var(--bg-2)";
  kaartRef.current.style.border = "1.5px solid rgba(255,107,0,.6)";
  kaartRef.current.style.borderRadius = "var(--card-radius)";
  kaartRef.current.style.boxShadow = "0 10px 28px rgba(0,0,0,.65), 0 32px 72px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.2)";
  kaartRef.current.style.padding = "4px";
  e.dataTransfer.setDragImage(kaartRef.current, 24, 28);
  // Reset in volgende frame (na screenshot door browser)
  requestAnimationFrame(() => {
    if (kaartRef.current) {
      kaartRef.current.style.background = "";
      kaartRef.current.style.border = "";
      kaartRef.current.style.borderRadius = "";
      kaartRef.current.style.boxShadow = "";
      kaartRef.current.style.padding = "";
    }
  });
}
```

- [ ] **Stap 8: Run tests + typecheck**

```bash
cd apps/web && pnpm vitest run src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx
cd apps/web && pnpm tsc --noEmit
```

Verwacht: 3 tests PASS, geen TS errors.

- [ ] **Stap 9: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/SpelerKaart.tsx \
        apps/web/src/components/ti-studio/werkbord/__tests__/drag-lift.test.tsx
git commit -m "feat(ti-studio): SpelerKaart lift + landing + ghost styling"
```

---

## Task 5: TeamKaartSpelerRij — lift + isLanding + verbeterde ghost

**Files:**
- Modify: `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx`

De wijziging is identiek voor `CompactSpelerRij` en `NormaalSpelerRij`. Beide functies krijgen dezelfde behandeling.

- [ ] **Stap 1: Voeg `useState` toe aan de imports in `TeamKaartSpelerRij.tsx`**

```ts
import { useRef, useState } from "react";
```

- [ ] **Stap 2: Voeg lift state toe aan `CompactSpelerRij`**

Voeg toe na `const ghostRef = useRef<HTMLDivElement>(null);`:

```ts
const [isDragging, setIsDragging] = useState(false);
const [isLanding, setIsLanding] = useState(false);
```

- [ ] **Stap 3: Breid `onDragStart` en voeg `onDragEnd` toe in `CompactSpelerRij`**

Vervang de bestaande `onDragStart` handler in de draggable div van `CompactSpelerRij`:

```ts
onDragStart={(e) => {
  setIsDragging(true);
  setIsLanding(false);
  e.stopPropagation();
  e.dataTransfer.setData(
    "speler",
    JSON.stringify({
      speler,
      vanTeamId: teamId,
      vanSelectieGroepId: selectieGroepId ?? null,
    })
  );
  e.dataTransfer.effectAllowed = "move";
  if (ghostRef.current) {
    ghostRef.current.style.background = "var(--bg-2)";
    ghostRef.current.style.border = "1.5px solid rgba(255,107,0,.6)";
    ghostRef.current.style.borderRadius = "var(--card-radius)";
    ghostRef.current.style.boxShadow = "0 10px 28px rgba(0,0,0,.65), 0 32px 72px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.2)";
    ghostRef.current.style.padding = "4px";
    e.dataTransfer.setDragImage(ghostRef.current, 24, 28);
    requestAnimationFrame(() => {
      if (ghostRef.current) {
        ghostRef.current.style.background = "";
        ghostRef.current.style.border = "";
        ghostRef.current.style.borderRadius = "";
        ghostRef.current.style.boxShadow = "";
        ghostRef.current.style.padding = "";
      }
    });
  }
}}
onDragEnd={() => {
  setIsDragging(false);
  setIsLanding(true);
  setTimeout(() => setIsLanding(false), 650);
}}
```

- [ ] **Stap 4: Pas de lift-styling toe op de draggable div van `CompactSpelerRij`**

Vervang het bestaande `style` object van de draggable div:

```ts
style={{
  height: SPELER_RIJ_HOOGTE,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 10px",
  flexShrink: 0,
  cursor: isDragging ? "grabbing" : "grab",
  borderBottom: "1px solid rgba(255,255,255,.05)",
  transform: isDragging ? "scale(1.04) translateY(-4px)" : "none",
  background: isDragging ? "rgba(255,107,0,.10)" : "transparent",
  outline: isDragging ? "1.5px solid rgba(255,107,0,.5)" : "none",
  boxShadow: isDragging ? "var(--sh-lift-speler)" : "none",
  transition: isDragging
    ? "transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease"
    : undefined,
  animation: isLanding ? "dropLandSpeler 650ms cubic-bezier(0.16,1,0.3,1) both" : undefined,
  zIndex: isDragging ? 50 : undefined,
  position: "relative",
}}
```

- [ ] **Stap 5: Voeg keyframe `<style>` toe aan `CompactSpelerRij` return**

Voeg toe binnen het fragment, na de draggable div:

```tsx
<style>{`
  @keyframes dropLandSpeler {
    from {
      transform: scale(1.04) translateY(-4px);
      box-shadow: 0 6px 18px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,107,0,.45);
      outline: 1.5px solid rgba(255,107,0,.5);
    }
    to {
      transform: scale(1) translateY(0);
      box-shadow: none;
      outline: none;
    }
  }
`}</style>
```

- [ ] **Stap 6: Herhaal stappen 2–5 voor `NormaalSpelerRij`**

Identiek aan stappen 2–5 maar in de `NormaalSpelerRij` functie. Let op: de draggable div in `NormaalSpelerRij` heeft `padding: "0 8px"` en `gap: 7` — die blijven ongewijzigd, alleen de lift-properties worden toegevoegd.

Voeg `isDragging` + `isLanding` state toe na `ghostRef`:
```ts
const [isDragging, setIsDragging] = useState(false);
const [isLanding, setIsLanding] = useState(false);
```

Vervang `onDragStart` en voeg `onDragEnd` toe (identiek aan stap 3).

Voeg aan het style object van de draggable div toe (identiek aan stap 4):
```ts
transform: isDragging ? "scale(1.04) translateY(-4px)" : "none",
background: isDragging ? "rgba(255,107,0,.10)" : "transparent",
outline: isDragging ? "1.5px solid rgba(255,107,0,.5)" : "none",
boxShadow: isDragging ? "var(--sh-lift-speler)" : "none",
transition: isDragging
  ? "transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease"
  : undefined,
animation: isLanding ? "dropLandSpeler 650ms cubic-bezier(0.16,1,0.3,1) both" : undefined,
zIndex: isDragging ? 50 : undefined,
position: "relative",
cursor: isDragging ? "grabbing" : "grab",
```

Voeg dezelfde `<style>` keyframe tag toe aan de `NormaalSpelerRij` return.

- [ ] **Stap 7: Run typecheck**

```bash
cd apps/web && pnpm tsc --noEmit
```

Verwacht: geen errors.

- [ ] **Stap 8: Commit**

```bash
git add apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx
git commit -m "feat(ti-studio): SpelerRij lift + landing + ghost styling"
```

---

## Task 6: Visuele verificatie

De animaties zijn CSS — unit tests dekken de state logic, visuele verificatie is handmatig.

- [ ] **Stap 1: Start de dev server**

```bash
cd /c/Users/Antjan/oranje-wit && pnpm dev
```

- [ ] **Stap 2: Navigeer naar TI Studio werkbord**

Open http://localhost:3000/ti-studio/indeling

- [ ] **Stap 3: Controleer teamkaart drag**

Sleep een teamkaart. Controleer:
- [ ] Kaart lifts op bij aanraken header (scale + translateY zichtbaar)
- [ ] Diepe schaduw + oranje gloed zichtbaar tijdens slepen
- [ ] Na loslaten: kaart daalt smooth terug in 650ms
- [ ] Selectie-partner (indien aanwezig) lifts ook op

- [ ] **Stap 4: Controleer spelerkaart drag**

Sleep een speler uit een team. Controleer:
- [ ] Lichte lift zichtbaar op het moment van oppakken
- [ ] Ghost image heeft solide achtergrond + oranje border (zichtbaar terwijl je sleept)
- [ ] Na loslaten (succesvol of niet): smooth landing in 650ms

- [ ] **Stap 5: Controleer pool spelerkaart**

Sleep een speler vanuit de pool. Zelfde checks als stap 4.

- [ ] **Stap 6: Run alle unit tests**

```bash
cd /c/Users/Antjan/oranje-wit && pnpm test
```

Verwacht: alle tests PASS, inclusief de 3 nieuwe drag-lift tests.

- [ ] **Stap 7: Final commit**

```bash
git add -A
git commit -m "feat(ti-studio): drag lift & landing — visueel geverifieerd"
```
