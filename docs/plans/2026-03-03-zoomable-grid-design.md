# Zoomable Grid met Semantic Zoom — Design Document

**Datum:** 2026-03-03
**Status:** Goedgekeurd
**Scope:** Team-Indeling scenario editor — Werkgebied

## Samenvatting

Het Werkgebied van de scenario-editor krijgt zoom/pan functionaliteit (d3-zoom) en herschikbare teamkaarten (dnd-kit sortable). Teamkaarten passen hun detailniveau automatisch aan op basis van het zoomniveau (semantic zoom met 4 LOD-niveaus).

## Beslissingen

| Keuze | Besluit | Reden |
|-------|---------|-------|
| Zoom/pan library | d3-zoom + d3-selection | Bewezen combo met dnd-kit, smooth animaties, cursor-centered zoom, ~15 kB gzipped |
| Kaart-herordening | @dnd-kit/sortable (al geinstalleerd) | Geen extra dependency, integreert met bestaand DnD-systeem |
| Grid-type | Smart grid met snap-to-position | Teams herschikken automatisch bij invoegen. Geen overlap, gegarandeerde afstand |
| Positionering | Persistent (database) | Team-volgorde opgeslagen via bestaande `volgorde` kolom in Team-model |
| Zoom-level | Sessie-only (niet persistent) | Bij herladen start op 100% |
| Detail-niveaus | 4 niveaus (overzicht, compact, detail, focus) | Optimale balans tussen overzicht en detail |

## Technische aanpak: d3-zoom + dnd-kit

### Event-model

- **Scroll wheel** → d3-zoom: zoom in/uit (gecentreerd op cursor)
- **Left click drag op kaart** → dnd-kit: sleep kaart of speler
- **Middle mouse drag** → d3-zoom: pan canvas
- **Space + left drag** → d3-zoom: pan canvas
- **Pinch-to-zoom** → d3-zoom: trackpad zoom (standaard ondersteund)

### Event-conflicten opgelost

d3-zoom en dnd-kit delen dezelfde DOM-container via een callback ref. Conflicten worden voorkomen door:

1. `zoom.filter()` blokkeert left-click events (die gaan naar dnd-kit)
2. `stopPropagation()` in draggable `onPointerDown` voorkomt dat d3-zoom card-drags als pan interpreteert
3. Geneste DndContexten scheiden kaart-herordening van speler-DnD

### Zoom-bereik

| Grens | Waarde |
|-------|--------|
| Minimum | 25% (0.25) |
| Maximum | 150% (1.50) |
| Default | 100% (1.00) |
| Stap (+/- knoppen) | ×1.4 |
| Animatieduur | 300ms |

## Architectuur

### Nieuwe bestanden

```
scenario/
  hooks/
    useCanvasZoom.ts              ← d3-zoom integratie hook
  editor/
    ZoomCanvas.tsx                ← zoom/pan container
    ZoomControls.tsx              ← zwevende +/- knoppen, fit, reset
    SortableTeamKaart.tsx         ← useSortable wrapper rond TeamKaart
    SortableSelectieBlok.tsx      ← useSortable wrapper rond SelectieBlok
```

### Gewijzigde bestanden

```
scenario/
  TeamKaart.tsx                   ← + detailLevel prop
  SelectieBlok.tsx                ← + detailLevel prop
  TeamSpelerRij.tsx               ← conditionele rendering per level
  Werkgebied.tsx                  ← grid → ZoomCanvas + SortableContext
  DndContext.tsx                  ← adjustScale modifier
  hooks/useScenarioEditor.ts      ← + team-volgorde handlers
```

### Component-hierarchie

```
<DndContext>                           ← Buitenste: kaart-herordening
  <ZoomCanvas ref={sharedRef}>
    <SortableContext items={teamIds}>
      <DndContext>                      ← Binnenste: speler-DnD (bestaand)
        <SortableTeamKaart>
          <TeamKaart detailLevel={...}>
            <TeamSpelerRij />
          </TeamKaart>
        </SortableTeamKaart>
      </DndContext>
    </SortableContext>
  </ZoomCanvas>
</DndContext>
```

### Dataflow

```
useCanvasZoom (d3-zoom)
    │
    ├── transform {x, y, k}  →  ZoomCanvas  →  CSS transform op inner div
    │
    └── k (scale)  →  getDetailLevel(k)  →  detailLevel prop
                                                  │
                                                  ├── "overzicht"  (k < 0.40)
                                                  ├── "compact"    (k 0.40–0.70)
                                                  ├── "detail"     (k 0.70–1.00)
                                                  └── "focus"      (k > 1.00)
```

## 4 Detail-niveaus (LOD)

### Overzicht (zoom 25%–40%)

Vogelvlucht — scannen van het hele speelveld.

| Element | Zichtbaar |
|---------|-----------|
| Teamnaam (alias) | Ja |
| Categorie-rand + achtergrondkleur | Ja |
| Spelersaantal | Ja |
| Geslachtsverhouding (4♂ 4♀) | Ja |
| Validatie-stip (groen/oranje/rood) | Ja |
| Spelernamen | Nee |
| Avatars | Nee |
| Staf | Nee |
| Knoppen | Nee |

### Compact (zoom 40%–70%)

Teamsamenstelling op hoofdlijnen.

| Element | Zichtbaar |
|---------|-----------|
| Alles uit Overzicht | Ja |
| Spelernamen (volledig) | Ja |
| Status-dot per speler | Ja |
| Heren/Dames groepering | Ja |
| Gemiddelde leeftijd (footer) | Ja |
| Kleur-badge + categorie-badge | Ja |
| Avatars | Nee |
| Leeftijd per speler | Nee |
| Drag handles | Nee |
| Edit/delete knoppen | Nee |
| Staf | Nee |
| Huidig team | Nee |

### Detail (zoom 70%–100%)

De standaard werkweergave — vergelijkbaar met de huidige teamkaart.

| Element | Zichtbaar |
|---------|-----------|
| Alles uit Compact | Ja |
| Avatars | Ja |
| Leeftijd + kleurindicatie | Ja |
| Geslacht-symbool | Ja |
| Huidig team (vorig seizoen) | Ja |
| Staf | Ja |
| Drag handles | Ja |
| Edit/delete knoppen | Ja |

### Focus (zoom 100%–150%)

Ingezoomd detailwerk.

| Element | Zichtbaar |
|---------|-----------|
| Alles uit Detail | Ja |
| Validatiemeldingen direct zichtbaar | Ja |
| J-nummer badge prominent | Ja |
| Notitie-count badge | Ja |
| Extra padding | Ja |

## Zoom Controls UI

Zwevende balk rechtsonder op het werkgebied:

```
┌─────────────────────────────┐
│  [ - ]  ─── 75% ───  [ + ] │
│  [ Fit ]    [ Reset ]       │
└─────────────────────────────┘
```

- **+/-**: stapsgewijs zoomen (×1.4, smooth 300ms animatie)
- **Fit**: zoom zodat alle teams in het viewport passen
- **Reset**: terug naar 100%
- **Percentage**: toont huidige zoom

## Team-volgorde persistentie

### Database

Bestaande `volgorde: Int` kolom op het `Team`-model.

### Server action

```ts
updateTeamVolgorde(versieId: string, volgordes: { teamId: string; volgorde: number }[])
```

Bulk-update via Prisma `$transaction`.

### Optimistic update

1. Drag-end → herschik `teams` array lokaal (instant feedback)
2. `startTransition` → server action → database
3. Bij fout → rollback naar vorige volgorde

## Performance

| Optimalisatie | Toepassing |
|---------------|------------|
| Unified CSS transform | Eén `transform` op parent div, niet per kaart |
| Memoized LOD | `getDetailLevel(k)` retourneert stabiele string — React skipt re-renders als level niet wijzigt |
| CSS containment | `contain: layout style paint` op kaarten |
| Debounced LOD-switch | 150ms debounce zodat snel scrollen geen cascades veroorzaakt |
| Lazy draggable | Kaarten worden pas `useSortable` bij hover (optioneel, alleen als perf probleem) |

## Bundle impact

| Package | Gzipped |
|---------|---------|
| d3-zoom | ~5.4 kB |
| d3-selection | ~10 kB |
| **Totaal** | **~15.4 kB** |

## Bronnen

- [FreeCodeCamp — Figma/Miro Canvas met React](https://www.freecodecamp.org/news/how-to-create-a-figma-miro-style-canvas-with-react-and-typescript/)
- [FreeCodeCamp — Canvas Performance Optimalisatie](https://www.freecodecamp.org/news/how-to-optimize-a-graphical-react-codebase/)
- [React Flow — Contextual Zoom](https://reactflow.dev/examples/interaction/contextual-zoom)
- [Steve Ruiz — Creating a Zoom UI](https://www.steveruiz.me/posts/zoom-ui)
- [dnd-kit — Modifiers (adjustScale)](https://docs.dndkit.com/api-documentation/modifiers)
- [dnd-kit Issue #50 — Scaled containers](https://github.com/clauderic/dnd-kit/issues/50)
- [d3-zoom docs](https://d3js.org/d3-zoom)
