# Zoomable Grid met Semantic Zoom — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Het Werkgebied van de scenario-editor uitbreiden met zoom/pan (d3-zoom), herschikbare teamkaarten (dnd-kit sortable), en 4 semantische zoomniveaus.

**Architecture:** d3-zoom beheert zoom/pan en levert een `{x, y, k}` transform. CSS `transform: translate(x,y) scale(k)` schaalt de grid-container. dnd-kit sortable (al geinstalleerd) regelt team-herordening via geneste DnD-contexten. De zoom-scale `k` stuurt een `detailLevel` prop ("overzicht"|"compact"|"detail"|"focus") naar TeamKaart/SelectieBlok.

**Tech Stack:** d3-zoom + d3-selection (~15 kB gzip), @dnd-kit/sortable (al aanwezig), React 19, Next.js 16, Tailwind CSS 4

**Design doc:** `docs/plans/2026-03-03-zoomable-grid-design.md`

---

## Task 1: Installeer d3-zoom + d3-selection

**Files:**
- Modify: `apps/team-indeling/package.json`

**Step 1: Installeer packages**

```bash
cd apps/team-indeling && pnpm add d3-zoom d3-selection
```

**Step 2: Installeer TypeScript types**

```bash
cd apps/team-indeling && pnpm add -D @types/d3-zoom @types/d3-selection
```

**Step 3: Verifieer installatie**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit`
Expected: PASS (geen errors)

**Step 4: Commit**

```bash
git add apps/team-indeling/package.json pnpm-lock.yaml
git commit -m "chore: add d3-zoom + d3-selection for zoomable canvas"
```

---

## Task 2: DetailLevel type + helper

**Files:**
- Modify: `apps/team-indeling/src/components/scenario/types.ts` (na regel 92)

**Step 1: Voeg DetailLevel type en helper toe**

Voeg onderaan het bestand toe (na de bestaande exports):

```ts
// Zoom detail-niveaus (semantic zoom)
export type DetailLevel = "overzicht" | "compact" | "detail" | "focus";

export function getDetailLevel(zoomScale: number): DetailLevel {
  if (zoomScale < 0.4) return "overzicht";
  if (zoomScale < 0.7) return "compact";
  if (zoomScale < 1.0) return "detail";
  return "focus";
}
```

**Step 2: Schrijf test**

Voeg toe aan `apps/team-indeling/src/components/scenario/types.test.ts`:

```ts
import { getDetailLevel } from "./types";

describe("getDetailLevel", () => {
  it("returns overzicht below 0.4", () => {
    expect(getDetailLevel(0.25)).toBe("overzicht");
    expect(getDetailLevel(0.39)).toBe("overzicht");
  });
  it("returns compact between 0.4 and 0.7", () => {
    expect(getDetailLevel(0.4)).toBe("compact");
    expect(getDetailLevel(0.69)).toBe("compact");
  });
  it("returns detail between 0.7 and 1.0", () => {
    expect(getDetailLevel(0.7)).toBe("detail");
    expect(getDetailLevel(0.99)).toBe("detail");
  });
  it("returns focus at 1.0 and above", () => {
    expect(getDetailLevel(1.0)).toBe("focus");
    expect(getDetailLevel(1.5)).toBe("focus");
  });
});
```

**Step 3: Run tests**

Run: `cd /c/oranje-wit && pnpm test:ti`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/team-indeling/src/components/scenario/types.ts apps/team-indeling/src/components/scenario/types.test.ts
git commit -m "feat: add DetailLevel type and getDetailLevel helper"
```

---

## Task 3: useCanvasZoom hook

**Files:**
- Create: `apps/team-indeling/src/components/scenario/hooks/useCanvasZoom.ts`

**Step 1: Schrijf de hook**

```ts
"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RefCallback } from "react";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import type { ZoomBehavior, ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";

export interface CanvasZoomResult {
  /** Huidige d3 ZoomTransform */
  transform: ZoomTransform;
  /** Callback ref voor de container div */
  containerRef: RefCallback<HTMLDivElement>;
  /** Zoom in (×1.4, animated) */
  zoomIn: () => void;
  /** Zoom uit (÷1.4, animated) */
  zoomOut: () => void;
  /** Zoom zodat alle content past */
  zoomToFit: (contentWidth: number, contentHeight: number) => void;
  /** Reset naar 100% */
  resetZoom: () => void;
}

const TRANSITION_MS = 300;
const SCALE_STEP = 1.4;
const SCALE_EXTENT: [number, number] = [0.25, 1.5];

export function useCanvasZoom(): CanvasZoomResult {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  // Space-toets tracking voor space+drag pan
  const spaceHeld = useRef(false);

  useLayoutEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        spaceHeld.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeld.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Stabiele zoom-behavior instance
  const behavior = useMemo<ZoomBehavior<HTMLDivElement, unknown>>(() => {
    return d3Zoom<HTMLDivElement, unknown>()
      .scaleExtent(SCALE_EXTENT)
      .filter((event: Event) => {
        const e = event as MouseEvent & WheelEvent;
        // Scroll wheel = zoom
        if (e.type === "wheel") return true;
        // Middle mouse = pan
        if (e.type === "mousedown" && (e as MouseEvent).button === 1)
          return true;
        // Space + left drag = pan
        if (
          e.type === "mousedown" &&
          (e as MouseEvent).button === 0 &&
          spaceHeld.current
        )
          return true;
        // Alles overig geblokkeerd (left click → dnd-kit)
        return false;
      })
      .on("zoom", ({ transform: t }: { transform: ZoomTransform }) => {
        setTransform(t);
      });
  }, []);

  // Attach d3-zoom aan container
  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const sel = select<HTMLDivElement, unknown>(el);
    sel.call(behavior);
    // Cleanup voor React Strict Mode
    return () => {
      sel.on(".zoom", null);
    };
  }, [behavior]);

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el;
  }, []);

  const getSelection = useCallback(() => {
    return elRef.current
      ? select<HTMLDivElement, unknown>(elRef.current)
      : null;
  }, []);

  const zoomIn = useCallback(() => {
    getSelection()
      ?.transition()
      .duration(TRANSITION_MS)
      .call(behavior.scaleBy, SCALE_STEP);
  }, [behavior, getSelection]);

  const zoomOut = useCallback(() => {
    getSelection()
      ?.transition()
      .duration(TRANSITION_MS)
      .call(behavior.scaleBy, 1 / SCALE_STEP);
  }, [behavior, getSelection]);

  const resetZoom = useCallback(() => {
    getSelection()
      ?.transition()
      .duration(TRANSITION_MS)
      .call(behavior.transform, zoomIdentity);
  }, [behavior, getSelection]);

  const zoomToFit = useCallback(
    (contentWidth: number, contentHeight: number) => {
      const el = elRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const scale =
        Math.min(width / contentWidth, height / contentHeight, SCALE_EXTENT[1]) *
        0.9;
      const clampedScale = Math.max(SCALE_EXTENT[0], scale);
      const tx = (width - contentWidth * clampedScale) / 2;
      const ty = (height - contentHeight * clampedScale) / 2;
      getSelection()
        ?.transition()
        .duration(TRANSITION_MS)
        .call(
          behavior.transform,
          zoomIdentity.translate(tx, ty).scale(clampedScale),
        );
    },
    [behavior, getSelection],
  );

  return { transform, containerRef, zoomIn, zoomOut, zoomToFit, resetZoom };
}
```

**Step 2: Typecheck**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/team-indeling/src/components/scenario/hooks/useCanvasZoom.ts
git commit -m "feat: add useCanvasZoom hook (d3-zoom integration)"
```

---

## Task 4: ZoomCanvas container component

**Files:**
- Create: `apps/team-indeling/src/components/scenario/editor/ZoomCanvas.tsx`

**Step 1: Schrijf het component**

```tsx
"use client";

import { useMemo } from "react";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { getDetailLevel } from "../types";
import type { DetailLevel } from "../types";

interface ZoomCanvasProps {
  children: (detailLevel: DetailLevel) => React.ReactNode;
}

export default function ZoomCanvas({ children }: ZoomCanvasProps) {
  const { transform, containerRef, zoomIn, zoomOut, zoomToFit, resetZoom } =
    useCanvasZoom();

  const detailLevel = useMemo(() => getDetailLevel(transform.k), [transform.k]);
  const percentage = Math.round(transform.k * 100);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Zoom viewport — d3-zoom luistert hier */}
      <div ref={containerRef} className="h-full w-full overflow-hidden">
        {/* Getransformeerde inner div */}
        <div
          style={{
            transformOrigin: "0 0",
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
          }}
        >
          {children(detailLevel)}
        </div>
      </div>

      {/* Zoom controls — zwevend rechtsonder */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
        <button
          onClick={zoomOut}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Zoom uit"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="min-w-[3rem] text-center text-xs text-gray-500">
          {percentage}%
        </span>
        <button
          onClick={zoomIn}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Zoom in"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="mx-1 h-4 w-px bg-gray-200" />
        <button
          onClick={() => zoomToFit(2400, 1600)}
          className="rounded p-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Pas alles in"
        >
          Fit
        </button>
        <button
          onClick={resetZoom}
          className="rounded p-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Reset naar 100%"
        >
          100%
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Typecheck**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/team-indeling/src/components/scenario/editor/ZoomCanvas.tsx
git commit -m "feat: add ZoomCanvas container with zoom controls"
```

---

## Task 5: TeamKaart LOD — conditionele rendering per detailLevel

**Files:**
- Modify: `apps/team-indeling/src/components/scenario/TeamKaart.tsx`
- Modify: `apps/team-indeling/src/components/scenario/TeamSpelerRij.tsx`
- Modify: `apps/team-indeling/src/components/scenario/SelectieBlok.tsx`

Dit is de grootste task. Alle drie de componenten krijgen een `detailLevel` prop.

**Step 1: TeamKaart — voeg detailLevel prop toe**

In `TeamKaart.tsx`:

1. Importeer `DetailLevel` (regel 1-13 area):
   ```ts
   import type { DetailLevel } from "./types";
   ```

2. Voeg `detailLevel` toe aan `TeamKaartProps` (regel 25-33):
   ```ts
   interface TeamKaartProps {
     team: TeamData;
     detailLevel?: DetailLevel;
     validatie?: TeamValidatie;
     // ... rest ongewijzigd
   }
   ```

3. Destructure in component (regel 35-43):
   ```ts
   const dl = detailLevel ?? "detail";
   ```

4. Conditionele rendering in de JSX:

   **Overzicht** — toon alleen header (teamnaam, kleur, validatie-stip) + beknopte footer:
   - Verberg staf-blok: wrap in `{dl !== "overzicht" && ( ... )}`
   - Verberg spelerlijst: wrap in `{dl !== "overzicht" && ( ... )}`
   - Bij overzicht toon beknopte body: `{dl === "overzicht" && <CompactStats />}`

   **Compact** — toon spelernamen met status-dot, maar geen avatars/leeftijden:
   - Pass `detailLevel` door naar `TeamSpelerRij`

   **Detail** — huidige weergave (geen wijziging)

   **Focus** — toon validatiemeldingen inline:
   - `{dl === "focus" && validatie && <ValidatieMeldingen ... />}` in de body

   **Header aanpassingen per level:**
   - Overzicht: verberg edit/delete knoppen, verberg notitie-badge
   - Compact: verberg edit/delete knoppen
   - Detail+Focus: alles zichtbaar (zoals nu)

   Concrete wijzigingen:
   ```tsx
   {/* Edit/delete knoppen — alleen bij detail en focus */}
   {(dl === "detail" || dl === "focus") && (
     <div className="flex items-center gap-1">
       {/* potlood + delete buttons */}
     </div>
   )}
   ```

   ```tsx
   {/* Staf — niet bij overzicht */}
   {dl !== "overzicht" && team.staf.length > 0 && (
     <div className="border-b border-gray-50 px-3 py-1">...</div>
   )}
   ```

   ```tsx
   {/* Spelers — vervang door compacte versie bij overzicht */}
   {dl === "overzicht" ? (
     <div className="px-3 py-2 text-[10px] text-gray-500">
       {aantalSpelers} spelers · {aantalM}♂ {aantalV}♀
     </div>
   ) : (
     <div className="min-h-[60px] flex-1 px-1 py-1">
       {/* bestaande heren/dames lijsten, met detailLevel doorgegeven */}
     </div>
   )}
   ```

**Step 2: TeamSpelerRij — conditionele details**

In `TeamSpelerRij.tsx`, voeg `detailLevel` prop toe:

```ts
import type { DetailLevel } from "./types";

interface TeamSpelerRijProps {
  teamSpeler: TeamSpelerData;
  teamId: string;
  detailLevel?: DetailLevel;
  onSpelerClick?: (speler: SpelerData) => void;
}
```

Conditionele rendering:
```tsx
const dl = detailLevel ?? "detail";

return (
  <div ...>
    {/* Drag handle — alleen bij detail/focus */}
    {(dl === "detail" || dl === "focus") && (
      <span ref={setActivatorNodeRef} {...attributes} {...listeners} className="cursor-grab ...">
        &#9776;
      </span>
    )}

    {/* Avatar — alleen bij detail/focus */}
    {(dl === "detail" || dl === "focus") && (
      <SpelerAvatar ... />
    )}

    {/* Status dot + naam — altijd (compact en hoger) */}
    <span className={`h-1.5 w-1.5 ...`} />
    <span className="flex-1 truncate text-xs ...">{naam}</span>

    {/* Leeftijd + geslacht + huidig team — alleen bij detail/focus */}
    {(dl === "detail" || dl === "focus") && (
      <>
        <span className="inline-flex ...">
          {kleur && <span className={`h-1 w-1 ...`} />}
          <span className="text-[10px] ...">{leeftijd.toFixed(2)}</span>
        </span>
        <span className="text-[10px]">{geslacht}</span>
        {vorigTeam && <span className="text-[9px] ...">{vorigTeam}</span>}
      </>
    )}
  </div>
);
```

**Step 3: SelectieBlok — zelfde patroon**

In `SelectieBlok.tsx`, voeg `detailLevel?: DetailLevel` prop toe en pas dezelfde conditionele patronen toe als in TeamKaart.

**Step 4: Typecheck + test**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit && pnpm test:ti`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/team-indeling/src/components/scenario/TeamKaart.tsx apps/team-indeling/src/components/scenario/TeamSpelerRij.tsx apps/team-indeling/src/components/scenario/SelectieBlok.tsx
git commit -m "feat: add detailLevel prop to TeamKaart, TeamSpelerRij, SelectieBlok"
```

---

## Task 6: Server action — updateTeamVolgorde

**Files:**
- Modify: `apps/team-indeling/src/app/scenarios/actions.ts` (na regel ~335)

**Step 1: Schrijf de server action**

Voeg toe na `deleteTeam`:

```ts
export async function updateTeamVolgorde(
  versieId: string,
  volgordes: { teamId: string; volgorde: number }[],
) {
  const session = await auth();
  if (!session) throw new Error("Niet ingelogd");

  await prisma.$transaction(
    volgordes.map(({ teamId, volgorde }) =>
      prisma.team.update({
        where: { id: teamId },
        data: { volgorde },
      }),
    ),
  );

  revalidatePath(`/scenarios`);
}
```

**Step 2: Typecheck**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/team-indeling/src/app/scenarios/actions.ts
git commit -m "feat: add updateTeamVolgorde server action"
```

---

## Task 7: useScenarioEditor — team-herordening handler

**Files:**
- Modify: `apps/team-indeling/src/components/scenario/hooks/useScenarioEditor.ts`

**Step 1: Voeg handleReorderTeams toe**

Importeer de nieuwe action en voeg de handler toe (voor het return-object):

```ts
import { updateTeamVolgorde } from "@/app/scenarios/actions";

// Voeg toe als handler (voor het return-blok):
const handleReorderTeams = useCallback(
  (vanIndex: number, naarIndex: number) => {
    if (vanIndex === naarIndex) return;
    const prev = [...teams];
    const reordered = [...teams];
    const [moved] = reordered.splice(vanIndex, 1);
    reordered.splice(naarIndex, 0, moved);
    // Update volgorde-nummers
    const updated = reordered.map((t, i) => ({ ...t, volgorde: i }));
    setTeams(updated);

    // Persist
    startTransition(async () => {
      try {
        await updateTeamVolgorde(
          versieId!,
          updated.map((t, i) => ({ teamId: t.id, volgorde: i })),
        );
      } catch {
        logger.warn("Volgorde opslaan mislukt, rollback");
        setTeams(prev);
      }
    });
  },
  [teams, versieId],
);
```

Voeg `handleReorderTeams` toe aan het return-object.

**Step 2: Typecheck**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/team-indeling/src/components/scenario/hooks/useScenarioEditor.ts
git commit -m "feat: add handleReorderTeams with optimistic update"
```

---

## Task 8: SortableTeamKaart + SortableSelectieBlok wrappers

**Files:**
- Create: `apps/team-indeling/src/components/scenario/editor/SortableTeamKaart.tsx`
- Create: `apps/team-indeling/src/components/scenario/editor/SortableSelectieBlok.tsx`

**Step 1: SortableTeamKaart**

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TeamKaart from "../TeamKaart";
import type { TeamKaartProps } from "../TeamKaart";

interface SortableTeamKaartProps extends TeamKaartProps {
  sortId: string;
}

export default function SortableTeamKaart({
  sortId,
  ...kaartProps
}: SortableTeamKaartProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortId,
    data: { type: "team-kaart", teamId: kaartProps.team.id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        // Voorkom dat d3-zoom deze pointer-event ziet
        e.stopPropagation();
        listeners?.onPointerDown?.(e);
      }}
    >
      <TeamKaart {...kaartProps} />
    </div>
  );
}
```

**Noot:** TeamKaart moet zijn props interface exporteren. Voeg `export` toe aan de `TeamKaartProps` interface in `TeamKaart.tsx`.

**Step 2: SortableSelectieBlok** — zelfde patroon met SelectieBlok.

**Step 3: Typecheck**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/team-indeling/src/components/scenario/editor/SortableTeamKaart.tsx apps/team-indeling/src/components/scenario/editor/SortableSelectieBlok.tsx apps/team-indeling/src/components/scenario/TeamKaart.tsx
git commit -m "feat: add SortableTeamKaart and SortableSelectieBlok wrappers"
```

---

## Task 9: Werkgebied refactoren — ZoomCanvas + SortableContext

**Files:**
- Modify: `apps/team-indeling/src/components/scenario/Werkgebied.tsx`

Dit is de centrale integratie-task. Het huidige Werkgebied wordt gewrapped in een ZoomCanvas, en de grid-items worden SortableTeamKaart/SortableSelectieBlok.

**Step 1: Wijzig Werkgebied**

Kernwijzigingen:

1. Importeer nieuwe componenten:
   ```ts
   import ZoomCanvas from "./editor/ZoomCanvas";
   import SortableTeamKaart from "./editor/SortableTeamKaart";
   import SortableSelectieBlok from "./editor/SortableSelectieBlok";
   import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
   import type { DetailLevel } from "./types";
   ```

2. Voeg `onReorderTeams` toe aan WerkgebiedProps:
   ```ts
   onReorderTeams?: (vanIndex: number, naarIndex: number) => void;
   ```

3. Vervang de scroll-container + grid (regels 156-200) door:
   ```tsx
   <ZoomCanvas>
     {(detailLevel) => (
       <SortableContext items={teamIds} strategy={rectSortingStrategy}>
         <div className="grid auto-rows-min grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
           {/* SelectieBlokken */}
           {selectieGroepEntries.map(([leiderId, groepTeams]) => (
             <SortableSelectieBlok
               key={leiderId}
               sortId={`selectie-${leiderId}`}
               teams={groepTeams}
               detailLevel={detailLevel}
               ...
             />
           ))}
           {/* Losse teams */}
           {losseTeams.map((team) => (
             <SortableTeamKaart
               key={team.id}
               sortId={team.id}
               team={team}
               detailLevel={detailLevel}
               ...
             />
           ))}
         </div>
       </SortableContext>
     )}
   </ZoomCanvas>
   ```

4. Bereken `teamIds` voor SortableContext:
   ```ts
   const teamIds = useMemo(() => {
     const ids: string[] = [];
     for (const [leiderId] of selectieGroepen) ids.push(`selectie-${leiderId}`);
     for (const t of losseTeams) ids.push(t.id);
     return ids;
   }, [selectieGroepen, losseTeams]);
   ```

**Step 2: Typecheck + test**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit && pnpm test:ti`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/team-indeling/src/components/scenario/Werkgebied.tsx
git commit -m "feat: integrate ZoomCanvas + SortableContext in Werkgebied"
```

---

## Task 10: DndContext aanpassen — geneste contexten + zoom modifier

**Files:**
- Modify: `apps/team-indeling/src/components/scenario/DndContext.tsx`
- Modify: `apps/team-indeling/src/components/scenario/editor/ScenarioEditorFullscreen.tsx`

**Step 1: Voeg zoom-scale prop toe aan DndProvider**

In `DndContext.tsx`, voeg een `zoomScale` prop toe en maak een adjustScale modifier:

```ts
import type { Modifier } from "@dnd-kit/core";

interface DndProviderProps {
  spelers: SpelerData[];
  zoomScale?: number;
  onPoolToTeam: (spelerId: string, teamId: string) => void;
  onTeamToTeam: (spelerId: string, van: string, naar: string) => void;
  onTeamToPool: (spelerId: string, teamId: string) => void;
  children: React.ReactNode;
}
```

Voeg modifier toe:
```ts
const adjustScaleModifier: Modifier = useMemo(
  () =>
    ({ transform, ...rest }) => ({
      ...rest,
      transform: {
        ...transform,
        x: transform.x / (zoomScale ?? 1),
        y: transform.y / (zoomScale ?? 1),
      },
    }),
  [zoomScale],
);
```

Gebruik het in de DndContext:
```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  modifiers={[adjustScaleModifier]}
>
```

**Step 2: Buitenste DndContext voor kaart-herordening in ScenarioEditorFullscreen**

In `ScenarioEditorFullscreen.tsx`, wrap het Werkgebied in een aparte DndContext voor team-reordering:

```tsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";

// In de component:
const reorderSensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
);

const handleReorderDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  // Bereken indices en roep editor.handleReorderTeams aan
  // ...
}, [editor]);
```

**Step 3: Typecheck**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/team-indeling/src/components/scenario/DndContext.tsx apps/team-indeling/src/components/scenario/editor/ScenarioEditorFullscreen.tsx
git commit -m "feat: nested DnD contexts + zoom scale modifier"
```

---

## Task 11: Integratie test — alles samenvoegen

**Files:** Geen nieuwe files, alleen testen en finetunen.

**Step 1: Typecheck hele project**

Run: `cd apps/team-indeling && pnpm exec tsc --noEmit`
Expected: PASS met 0 errors

**Step 2: Alle tests**

Run: `cd /c/oranje-wit && pnpm test:ti`
Expected: alle tests PASS

**Step 3: Format**

Run: `cd /c/oranje-wit && pnpm format`
Expected: schoon

**Step 4: Dev server + visuele test**

Run: `pnpm dev:ti`

Test scenario's:
- [ ] View mode (`/scenarios/[id]`) — geen zoom controls, read-only
- [ ] Edit mode (`/scenarios/[id]?mode=edit`) — zoom controls rechtsonder zichtbaar
- [ ] Scroll wheel zoom — in/uit, gecentreerd op cursor
- [ ] +/- knoppen — smooth animated zoom
- [ ] Fit knop — alle teams passen in viewport
- [ ] 100% knop — reset
- [ ] Space + drag — pan het canvas
- [ ] LOD overzicht (25-40%) — alleen teamnaam, kleur, aantal, m/v, validatie-stip
- [ ] LOD compact (40-70%) — + spelernamen met status-dots
- [ ] LOD detail (70-100%) — volledig (zoals nu)
- [ ] LOD focus (100-150%) — + inline validatiemeldingen
- [ ] Speler drag-and-drop werkt op elk zoom-niveau
- [ ] Team-kaart herordenen via drag werkt

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: zoomable grid with semantic zoom and team reordering"
```

---

## Samenvatting taak-volgorde

| Task | Wat | Geschatte tijd |
|------|-----|----------------|
| 1 | Installeer d3-zoom + d3-selection | 2 min |
| 2 | DetailLevel type + helper + test | 5 min |
| 3 | useCanvasZoom hook | 10 min |
| 4 | ZoomCanvas container | 10 min |
| 5 | TeamKaart/SpelerRij/SelectieBlok LOD | 20 min |
| 6 | Server action updateTeamVolgorde | 5 min |
| 7 | useScenarioEditor reorder handler | 5 min |
| 8 | SortableTeamKaart/SelectieBlok wrappers | 10 min |
| 9 | Werkgebied refactor (ZoomCanvas + SortableContext) | 15 min |
| 10 | DndContext genest + zoom modifier | 15 min |
| 11 | Integratie test + visuele verificatie | 15 min |
