# Compact TeamKaart v2 — Design Spec

**Datum:** 2026-04-10  
**Scope:** `TeamKaart.tsx`, `useZoom.ts`  
**Aanleiding:** De compact-kaart bevat te weinig bruikbare informatie en is visueel niet sterk genoeg voor gebruik als overzichtsmodus bij inzoomen.

---

## Doel

De compact-kaart is de primaire weergave als de indeler uitzoomt om het gehele werkbord te overzien. Hij moet op één oogopslag communiceren: wat is dit team, hoeveel dames, hoeveel heren, klopt het, en wat is de gemiddelde leeftijd.

---

## Zoom-breakpoints

Wijziging in `useZoom.ts`:

| Zoom | Mode | Was |
|---|---|---|
| ≥ 1.0 | `detail` | ongewijzigd |
| 0.80 – 0.99 | `normaal` | was 0.64–0.99 |
| < 0.80 | `compact` | was < 0.64 |

```ts
// useZoom.ts — toZoomLevel()
function toZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.80) return "compact";
  if (zoom < 1.0)  return "normaal";
  return "detail";
}
```

---

## Kaartstructuur (compact mode)

Hoogte blijft **210px** — proportioneel gelijk aan normaal/detail zodat kaarten niet springen bij in/uitzomen.

```
┌─────────────────────────────────────────┐  210px totaal
│  Teamnaam (volledig, geen knoppen)   [●] │  header: 36–44px
├─────────────────────────────────────────┤
│                                         │
│       [♀-icoon]        [♂-icoon]        │  flex: 1
│           4                4            │  grote teller
│                                         │
├─────────────────────────────────────────┤
│ Score          │         Gem. leeftijd  │  footer: 56px
│ 7.82           │               22.4j   │  gestapeld label+waarde
└─────────────────────────────────────────┘
```

### Header (36–44px)

- Teamnaam vult de volledige breedte — geen edit-knop, geen gender-badges
- Lettergrootte schaalt met formaat (zie tabel)
- Validatie-stip rechtsbovenin (`position: absolute`, 9–10px, groen/geel/rood met glow)
- Kleurband links blijft (4px, KNKV-categoriekleur)
- Gehele kaart fungeert als drag-handle in compact mode (was: alleen header)

### Midden (flex: 1)

Twee blokken naast elkaar, gescheiden door een verticale lijn:

- **Links:** Venus-icoon (SVG, stroke `var(--pink)`) + getal eronder
- **Rechts:** Mars-icoon (SVG, stroke `var(--blue)`) + getal eronder
- Teller: `font-weight: 900`, kleur passend bij geslacht

### Footer (56px, gestapeld)

Twee kolommen: links USS-score, rechts gemiddelde leeftijd.

Per kolom:
```
Label (9px, uppercase, letter-spacing, --text-3)
Waarde (15px, font-weight: 700, --text-1)
```

- USS score alleen tonen als `team.ussScore !== null`
- Als USS null is (jeugd/viertal): leeftijdsblok uitsluitend rechts uitgelijnd, linkerkolom leeg
- Separator: `flex: 1` tussen de twee kolommen (geen verticale lijn in footer)

---

## Formaat-specifieke afmetingen

| | Viertal (140px) | Achtal (280px) | Selectie (560px) |
|---|---|---|---|
| Header hoogte | 36px | 40px | 44px |
| Header font-size | 13px | 15px | 17px |
| Validatie-stip | 9px | 9px | 10px |
| Icoon SVG-grootte | 16px | 20px | 28px |
| Teller font-size | 28px | 32px | 44px |
| Gap icoon–scheiding | 12px | 36px | 60px |
| Footer hoogte | 56px | 56px | 56px |
| Footer font waarde | 15px | 15px | 15px |
| USS tonen | nee (null bij jeugd) | ja indien beschikbaar | ja indien beschikbaar |

---

## Wat verdwijnt in compact

Vergeleken met de huidige `isCompact`-tak:

| Element | Was | Nu |
|---|---|---|
| Edit-knop (potlood) | verborgen bij compact | verwijderd uit compact-tak |
| ♀/♂ badges in header | verborgen bij compact | weg |
| Gem.leeftijd + USS in body | gecentreerde tekstregel | vervangen door footer-blok |
| Dames/heren spelerlijsten | al verborgen | blijft verborgen |
| Validatie-count badge | verborgen | vervangen door stip |
| Drag-handle | alleen header | gehele kaart |

---

## Iconen

Venus en Mars als inline SVG (geen externe library):

```tsx
// Venus
<svg width={iconSize} height={iconSize} viewBox="0 0 24 24"
     fill="none" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round">
  <circle cx="12" cy="8" r="6"/>
  <line x1="12" y1="14" x2="12" y2="22"/>
  <line x1="9"  y1="19" x2="15" y2="19"/>
</svg>

// Mars
<svg width={iconSize} height={iconSize} viewBox="0 0 24 24"
     fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
  <circle cx="10" cy="14" r="6"/>
  <line x1="21" y1="3" x2="15" y2="9"/>
  <polyline points="16 3 21 3 21 8"/>
</svg>
```

`iconSize` per formaat: viertal=16, achtal=20, selectie=28.

---

## Gewijzigde bestanden

| Bestand | Wijziging |
|---|---|
| `hooks/useZoom.ts` | `toZoomLevel`: grens compact/normaal van `0.64` naar `0.80` |
| `TeamKaart.tsx` | Compact-tak volledig herschrijven per bovenstaand design |

Geen wijzigingen in: `WerkbordCanvas`, `TiStudioShell`, `types.ts`, `tokens.css`.

---

## Niet in scope

- Normaal- en detail-weergave van `TeamKaart` — ongewijzigd
- Drag & drop logica — ongewijzigd
- `SpelersPoolDrawer`, `ValidatieDrawer`, `Ribbon`, `Toolbar` — ongewijzigd
- USS-score berekening — ongewijzigd (wordt al doorgegeven als `team.ussScore`)
