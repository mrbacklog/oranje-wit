# Drag Lift & Landing — Design Spec

**Datum:** 2026-04-10
**Status:** Goedgekeurd

## Doel

Teamkaarten en spelerkaarten voelen fysiek bij het verslepen: ze komen omhoog bij het oppakken (lift), zijn duidelijk zichtbaar met border en achtergrond tijdens het slepen, en landen vloeiend terug bij het loslaten.

---

## Gekozen waarden

| Onderdeel | Waarde |
|---|---|
| Lift schaal teamkaart | `scale(1.04) translateY(-10px)` |
| Lift schaal spelerkaart | `scale(1.04) translateY(-4px)` |
| Lift timing (pickup) | 280ms · `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) |
| Shadow lifted | `--sh-lifted` — diepe schaduw + accent gloed |
| Ghost drag image | Solide `--bg-2` achtergrond, oranje border 1.5px, `--sh-lifted` |
| Landing timing | 650ms · `cubic-bezier(0.16, 1, 0.3, 1)` (smooth ease-out) |
| Landing animatie | CSS `@keyframes dropLand` — van lifted naar rust |

---

## Nieuwe CSS tokens (tokens.css)

```css
--sh-lifted:
  0 10px 28px rgba(0,0,0,.65),
  0 32px 72px rgba(0,0,0,.5),
  0 0 0 1px rgba(255,107,0,.2);

--sh-lift-speler:
  0 6px 18px rgba(0,0,0,.6),
  0 0 0 1.5px rgba(255,107,0,.45);
```

---

## Bestanden in scope

| Bestand | Wijziging |
|---|---|
| `tokens.css` | `--sh-lifted` + `--sh-lift-speler` toevoegen |
| `WerkbordCanvas.tsx` | `isDragging` prop doorgeven aan `TeamKaart` |
| `TeamKaart.tsx` | Lift + `isLanding` state + `dropLand` keyframe |
| `TeamKaartSpelerRij.tsx` | Lift + `isLanding` + verbeterde ghost wrapper |
| `SpelerKaart.tsx` | `isDragging` + `isLanding` state uitbreiden naast bestaande `isHeld` |

---

## Sectie 1 — TeamKaart

### Props

```ts
interface TeamKaartProps {
  // ... bestaand ...
  isDragging?: boolean   // nieuw — doorgegeven vanuit WerkbordCanvas
}
```

In `WerkbordCanvas.tsx`:
```tsx
<TeamKaart
  isDragging={draggingTeam?.teamId === team.id}
  // Selectie-partner: beide teams in een selectiegroep krijgen isDragging=true
  // wanneer één van hen gesleurd wordt
  ...
/>
```

Bij een selectiegroep zijn beide kaarten op dezelfde canvasX/Y — beide liften gelijktijdig.

### Lift styling (op de kaart div)

```ts
style={{
  // ... bestaand ...
  transform: isDragging ? 'scale(1.04) translateY(-10px)' : 'none',
  boxShadow: isDragging ? 'var(--sh-lifted)' : 'var(--sh-card)',
  borderColor: isDragging ? 'rgba(255,107,0,.3)' : 'var(--border-0)',
  transition: isDragging
    ? 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 280ms ease, border-color 200ms ease'
    : undefined,
  animation: isLanding ? 'dropLand 650ms cubic-bezier(0.16,1,0.3,1) both' : 'fadeUp 250ms ease both',
  zIndex: isDragging ? 100 : undefined,
}}
```

### isLanding state

```ts
const [isLanding, setIsLanding] = useState(false)

// In useEffect die isDragging bewaakt:
useEffect(() => {
  if (!isDragging && wasLiftedRef.current) {
    setIsLanding(true)
    const t = setTimeout(() => setIsLanding(false), 650)
    return () => clearTimeout(t)
  }
  wasLiftedRef.current = isDragging ?? false
}, [isDragging])
```

### Keyframe (inline style tag)

```css
@keyframes dropLand {
  from {
    transform: scale(1.04) translateY(-10px);
    box-shadow: var(--sh-lifted);
  }
  to {
    transform: scale(1) translateY(0);
    box-shadow: var(--sh-card);
  }
}
```

---

## Sectie 2 — SpelerKaart (pool + detail-modus)

`SpelerKaart.tsx` heeft al `isHeld` state. Dit wordt uitgebreid:

```ts
const [isDragging, setIsDragging] = useState(false)
const [isLanding, setIsLanding] = useState(false)
```

### onDragStart / onDragEnd

```ts
onDragStart: (e) => {
  setIsDragging(true)
  // ... bestaande data + setDragImage logica ...
}

onDragEnd: () => {
  setIsDragging(false)
  setIsLanding(true)
  document.body.style.cursor = ''
  setTimeout(() => setIsLanding(false), 650)
}
```

### Lift styling

```ts
style={{
  transform: isDragging ? 'scale(1.04) translateY(-4px)' : 'none',
  background: isDragging ? 'rgba(255,107,0,.10)' : isHeld ? 'rgba(255,107,0,.10)' : 'transparent',
  outline: isDragging ? '1.5px solid rgba(255,107,0,.5)' : isHeld ? '1.5px solid var(--accent)' : 'none',
  boxShadow: isDragging ? 'var(--sh-lift-speler)' : 'none',
  transition: isDragging
    ? 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease'
    : undefined,
  animation: isLanding ? 'dropLandSpeler 650ms cubic-bezier(0.16,1,0.3,1) both' : undefined,
}}
```

### Verbeterde ghost wrapper

De `ghostRef` div (nu: `position: fixed; left: -9999`) krijgt een wrapper met lifted styling:

```tsx
<div
  ref={ghostRef}
  style={{
    position: 'fixed',
    left: -9999,
    top: 0,
    width: 220,
    pointerEvents: 'none',
    zIndex: -1,
    background: 'var(--bg-2)',
    border: '1.5px solid rgba(255,107,0,.6)',
    borderRadius: 'var(--card-radius)',
    boxShadow: 'var(--sh-lifted)',
    padding: 4,
  }}
>
  <SpelerKaart speler={speler} vanTeamId={teamId} seizoenEindjaar={PEILJAAR} asGhost />
</div>
```

`setDragImage(ghostRef.current, 24, 28)` — offset aangepast aan de 4px padding.

---

## Sectie 3 — SpelerRij (compact & normaal in teamkaart)

`CompactSpelerRij` en `NormaalSpelerRij` in `TeamKaartSpelerRij.tsx` volgen hetzelfde patroon als SpelerKaart:

```ts
const [isDragging, setIsDragging] = useState(false)
const [isLanding, setIsLanding] = useState(false)
```

Lift styling op de rij `div`:
```ts
transform: isDragging ? 'scale(1.04) translateY(-4px)' : 'none',
background: isDragging ? 'rgba(255,107,0,.10)' : 'transparent',
outline: isDragging ? '1.5px solid rgba(255,107,0,.5)' : 'none',
boxShadow: isDragging ? 'var(--sh-lift-speler)' : 'none',
zIndex: isDragging ? 50 : undefined,
animation: isLanding ? 'dropLandSpeler 650ms cubic-bezier(0.16,1,0.3,1) both' : undefined,
```

Ghost wrapper: identiek aan SpelerKaart (de hidden `SpelerKaart asGhost` wordt gewrapped).

### Detail-modus (zoomLevel === "detail")

In detail-modus rendert `TeamKaartSpelerRij` de `SpelerKaart` direct. Die component krijgt de lift/landing behandeling via zijn eigen state — geen extra code nodig.

---

## Sectie 4 — Keyframes

Twee keyframes worden toegevoegd (inline `<style>` tags per component):

```css
/* Teamkaart landing */
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

/* Spelerkaart/-rij landing */
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
```

---

## Randgevallen

- **Selectie-partner:** beide kaarten in een groep krijgen `isDragging=true` — liften gelijktijdig op
- **Snap bij loslaten buiten dropzone:** `onDragEnd` triggert altijd `isLanding` ongeacht of de drop geslaagd is
- **Animatie interruptie:** als een nieuwe drag start terwijl `isLanding` nog actief is, wordt de landing-animatie direct gestopt (`isLanding = false` bij `onDragStart`)
- **`fadeUp` initiële animatie:** mag niet gelijktijdig met `dropLand` lopen — `animation` prop schakelt expliciet tussen de twee

---

## Niet gewijzigd

- Dropzone highlight (`dropActief` achtergrond) — werkt al
- Minimap kaartjes — geen drag interactie
- Cursor styling — al geregeld via `document.body.style.cursor`
- Pool-layout en scroll — geen invloed
