# TI Studio — Architectuur

**Datum**: april 2026  
**Status**: Geïmplementeerd

---

## Desktop/mobile scheiding

De Team-Indeling is gesplitst in twee aparte apps:

| App | Route | Doelgroep | Thema |
|---|---|---|---|
| **Teamindeling** | `/teamindeling/*` | TC op telefoon, drag & drop | Dark |
| **TI Studio** | `/ti-studio/*` | TC op desktop, volledig overzicht | Light (dark panels) |

TI Studio toont een "desktop-only" melding op mobiel (< 768px viewport).

---

## TI Studio navigatie (4 tabs)

```
/ti-studio/kaders      — KNKV-kaders, doelgroepen, uitgangspunten per team
/ti-studio/indeling    — Spelerseditor, kaarten, drag & drop desktop
/ti-studio/werkbord    — Werk-overzicht per scenario/team
/ti-studio/personen    — Spelersoverzicht met filters
```

Elk tab heeft een eigen subnavigatie via `SideTabs`.

---

## Kaartmaten v4 — DetailLevel

De spelerskaarten in de indeling passen zich automatisch aan het zoomniveau aan.

```ts
export type DetailLevel = "compact" | "normaal" | "detail";

export function getDetailLevel(zoomScale: number): DetailLevel {
  if (zoomScale < 0.64) return "compact";
  if (zoomScale < 1.0) return "normaal";
  return "detail";
}
```

| Level | Zoomschaal | Inhoud |
|---|---|---|
| `compact` | < 0.64 | Naam + badge, minimalistische weergave |
| `normaal` | 0.64 – 1.0 | Naam + score + positie |
| `detail` | ≥ 1.0 | Volledig: naam, score, positie, evaluatie-indicatoren |

Componenten die DetailLevel gebruiken: `TeamKaart`, `TeamSpelerRij`, `SelectieBlok`, `SelectieSpelerGrid`, `GestureCanvas`.

---

## Dark theme in panels

TI Studio gebruikt een light layout-shell maar alle interactieve panelen (editor, kaarten, pool, toolbar, drawer) zijn dark. Dit volgt het patroon `bg-gray-900 text-white` consistent door alle panelen.

Zie `rules/design-system.md` voor de volledige token-tabel.

---

## Drag & Drop

- Mobile: native touch DnD via `@dnd-kit/core` met haptic feedback
- Desktop (TI Studio indeling): zelfde DnD-library met delay voor selectie-interactie
- `GestureCanvas.tsx` beheert zoom + pan + DnD coördinatie
