# OW Scout — Component Library Specificatie

Uitgebreide specificatie van alle UI-componenten voor OW Scout. Elk component is beschreven met TypeScript props, visuele states, concrete Tailwind CSS classes, responsive gedrag, accessibility en animaties.

## Hergebruik uit @oranje-wit/ui

De volgende componenten uit `packages/ui/` worden direct hergebruikt in OW Scout:

| Component | Package pad | Gebruik in Scout |
|---|---|---|
| `Badge` | `primitives/badge.tsx` | Basis voor LeeftijdsgroepBadge (wrappen met gradient) |
| `Button` | `primitives/button.tsx` | Alle knoppen (primair, secundair, ghost) |
| `Card`, `CardBody` | `primitives/card.tsx` | Basis-kaartlayout (BadgeCard, stat-secties) |
| `Dialog` | `primitives/dialog.tsx` | Bevestigingsdialogen, rapport-preview |
| `Input` | `primitives/input.tsx` | Zoekveld-basis (SpelerZoek) |
| `BandPill` | `data-display/band-pill.tsx` | Leeftijdsgroep-kleuren (Blauw/Groen/Geel/Oranje/Rood) |
| `StatCard` | `data-display/stat-card.tsx` | XP-overzicht, spelerprofiel-stats |

Bestaande evaluatie-referentie: `ScoreVeld` uit `apps/evaluatie/` (grid van nummer-knoppen) dient als inspiratie voor de score-inputs, maar OW Scout vervangt dit met drie leeftijdsspecifieke varianten (smiley, sterren, slider).

---

## Design tokens

OW Scout breidt de bestaande tokens uit `packages/ui/src/tokens/globals.css` uit met scouting-specifieke kleuren:

```css
@theme inline {
  /* Bestaande OW-tokens (hergebruik) */
  --color-ow-oranje: #ff6b00;
  --color-ow-oranje-light: #ff8c33;
  --color-ow-oranje-bg: #fff3e8;
  --color-band-blauw: #4a90d9;
  --color-band-groen: #52b788;
  --color-band-geel: #f4d35e;
  --color-band-oranje: #f28c28;
  --color-band-rood: #d62828;

  /* Scouting-specifiek: tier-kleuren */
  --color-tier-brons: #cd7f32;
  --color-tier-brons-light: #d4a574;
  --color-tier-zilver: #c0c0c0;
  --color-tier-zilver-light: #e8e8e8;
  --color-tier-goud: #ffd700;
  --color-tier-goud-light: #ffe44d;

  /* Scouting-specifiek: XP */
  --color-xp-bar: #6366f1;
  --color-xp-bar-glow: #818cf8;

  /* Scouting-specifiek: leeftijdsgroep-gradients */
  --color-lg-paars-start: #7c3aed;
  --color-lg-paars-end: #a78bfa;
  --color-lg-blauw-start: #2563eb;
  --color-lg-blauw-end: #60a5fa;
  --color-lg-groen-start: #16a34a;
  --color-lg-groen-end: #4ade80;
  --color-lg-geel-start: #ca8a04;
  --color-lg-geel-end: #facc15;
  --color-lg-oranje-start: #ea580c;
  --color-lg-oranje-end: #fb923c;
  --color-lg-rood-start: #dc2626;
  --color-lg-rood-end: #f87171;
}
```

---

## 1. SpelersKaart

De FIFA-stijl spelerskaart. Het meest complexe component van OW Scout.

### Props interface

```typescript
interface SpelersKaartProps {
  /** Speler ID (rel_code) */
  spelerId: string;
  /** Roepnaam van de speler */
  roepnaam: string;
  /** Achternaam (incl. tussenvoegsel) */
  achternaam: string;
  /** Leeftijd in jaren */
  leeftijd: number;
  /** Huidig team (bijv. "D1", "E2") */
  team: string;
  /** Overall score 1-99 */
  overall: number;
  /** Zes pijler-scores */
  stats: {
    aanval: number;
    verdediging: number;
    schieten: number;
    passen: number;
    bewegen: number;
    inzet: number;
  };
  /** Kaart-tier bepaalt de visuele stijl */
  tier: "brons" | "zilver" | "goud";
  /** Optionele foto-URL */
  fotoUrl?: string;
  /** Relatieve sterren (1-5) t.o.v. leeftijdgenoten */
  sterren: 1 | 2 | 3 | 4 | 5;
  /** Kaartgrootte */
  size?: "mini" | "small" | "medium" | "large";
  /** Visuele state */
  state?: "default" | "loading" | "selected" | "disabled";
  /** Click handler */
  onClick?: () => void;
  /** Leeftijdsgroep-kleur voor gradient */
  leeftijdsgroepKleur: LeeftijdsgroepKleur;
}

type LeeftijdsgroepKleur = "paars" | "blauw" | "groen" | "geel" | "oranje" | "rood";
```

### Sizes

| Size | Afmetingen | Inhoud | Use case |
|---|---|---|---|
| `mini` | `w-[60px] h-[84px]` | Alleen overall + initialen | Lijsten, search results |
| `small` | `w-[120px] h-[168px]` | Foto, naam, overall, sterren | Team-overzicht grid |
| `medium` | `w-[180px] h-[252px]` | Alles behalve stats | Kaart-collectie |
| `large` | `w-[280px] h-[392px]` | Alles incl. stats en radar-mini | Detail-view, modal |

### Visuele states

**Default**
```
Buitenste container:
  rounded-2xl overflow-hidden shadow-lg
  transition-all duration-300 ease-out

Tier-afhankelijke border:
  brons:  border-2 border-tier-brons bg-gradient-to-b from-tier-brons/20 to-tier-brons/5
  zilver: border-2 border-tier-zilver bg-gradient-to-b from-tier-zilver/20 to-tier-zilver/5
  goud:   border-2 border-tier-goud bg-gradient-to-b from-tier-goud/20 to-tier-goud/5
```

**Loading (skeleton)**
```
Container:
  rounded-2xl overflow-hidden animate-pulse

Skeleton elementen:
  Foto:    rounded-full bg-gray-200
  Naam:    h-3 w-3/4 rounded bg-gray-200
  Overall: h-8 w-8 rounded-full bg-gray-200
  Stats:   h-2 w-full rounded bg-gray-100 (6x)
```

**Hover (3D tilt)**
```
Container (bij hover):
  hover:shadow-xl
  transform: perspective(800px) rotateY(var(--mouse-x)) rotateX(var(--mouse-y))
  transition-transform duration-150 ease-out

Shine-effect overlay:
  absolute inset-0 pointer-events-none
  bg-gradient-to-br from-white/30 via-transparent to-transparent
  opacity-0 group-hover:opacity-100 transition-opacity duration-300
```
De 3D tilt wordt via een `onMouseMove` handler berekend: de muispositie relatief tot het midden van de kaart bepaalt `--mouse-x` (max 8deg) en `--mouse-y` (max 8deg). Op touch-devices wordt dit uitgeschakeld.

**Selected**
```
Container:
  ring-2 ring-ow-oranje ring-offset-2
  scale-[1.02] shadow-xl
  border-ow-oranje

Vinkje-indicator (rechtsonder):
  absolute bottom-2 right-2
  h-6 w-6 rounded-full bg-ow-oranje text-white
  flex items-center justify-center
  (check-icon SVG)
```

**Disabled**
```
Container:
  opacity-50 grayscale pointer-events-none
  cursor-not-allowed
```

### Interne layout (medium/large)

```
┌──────────────────────────┐
│  ┌────┐                  │  ← Gradient header (leeftijdsgroep-kleur)
│  │ OVR│   ★★★★☆          │     bg-gradient-to-r from-{lg-kleur-start} to-{lg-kleur-end}
│  │ 72 │                  │     h-[40%] rounded-t-2xl
│  └────┘                  │
│       ┌──────┐           │
│       │ FOTO │           │  ← Foto container
│       │      │           │     -mt-8 relative z-10
│       └──────┘           │     rounded-full border-4 border-white shadow-md
│                          │
│   Roepnaam               │  ← text-sm font-bold text-gray-900 truncate
│   team • leeftijd        │  ← text-xs text-gray-500
│                          │
│  AAV  VER  SCH  PAS  BEW │  ← Stats grid (alleen large)
│  72   68   81   74   65  │     grid grid-cols-6 gap-1 text-center
│  INZ                     │     text-[10px] font-medium text-gray-500 (label)
│  89                      │     text-xs font-bold text-gray-900 (waarde)
└──────────────────────────┘
```

### Leeftijdsgroep-gradients (14 leeftijden, 6 groepen)

| Leeftijd | Groep | Gradient classes |
|---|---|---|
| 5-7 | Paars | `bg-gradient-to-r from-lg-paars-start to-lg-paars-end` |
| 8-9 | Blauw | `bg-gradient-to-r from-lg-blauw-start to-lg-blauw-end` |
| 10-11 | Groen | `bg-gradient-to-r from-lg-groen-start to-lg-groen-end` |
| 12-13 | Geel | `bg-gradient-to-r from-lg-geel-start to-lg-geel-end` |
| 14-15 | Oranje | `bg-gradient-to-r from-lg-oranje-start to-lg-oranje-end` |
| 16-18 | Rood | `bg-gradient-to-r from-lg-rood-start to-lg-rood-end` |

### Sterren

```typescript
// Gouden sterren, lege sterren als outline
function Sterren({ count, max = 5 }: { count: number; max?: number }) {
  // Filled: text-yellow-400 drop-shadow-sm
  // Empty:  text-gray-300
}
```

```
Filled ster:  text-yellow-400 drop-shadow-sm
Lege ster:    text-gray-300

Container:    flex gap-0.5
  mini:       hidden (niet getoond)
  small:      [sterren 10px]
  medium:     [sterren 12px]
  large:      [sterren 14px]
```

### Animaties

| Animatie | Trigger | Beschrijving | CSS |
|---|---|---|---|
| **flip** | Kaart onthullen | 3D Y-as flip van achterkant naar voorkant | `@keyframes card-flip { 0% { transform: perspective(800px) rotateY(180deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: perspective(800px) rotateY(0); } }` Duur: 600ms, easing: `cubic-bezier(0.4, 0, 0.2, 1)` |
| **reveal** | Nieuwe kaart | Scale-up met glow | `@keyframes card-reveal { 0% { transform: scale(0.8); opacity: 0; filter: brightness(2); } 100% { transform: scale(1); opacity: 1; filter: brightness(1); } }` Duur: 400ms |
| **update** | Score-wijziging | Kort pulse-effect | `@keyframes card-update { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }` Duur: 200ms |

### Responsive gedrag

- **Mobile (< 640px)**: Kaarten worden `small` in grid (2 kolommen), `medium` in detail
- **Tablet (640px-1024px)**: Kaarten `medium` in grid (3-4 kolommen)
- **Desktop (> 1024px)**: Kaarten `medium` in grid (4-6 kolommen), `large` in sidebar/modal

```
Grid container:
  grid grid-cols-2 gap-3
  sm:grid-cols-3
  md:grid-cols-4
  lg:grid-cols-5
  xl:grid-cols-6
```

### Accessibility

- `role="article"` op de kaart-container
- `aria-label="{roepnaam} {achternaam}, overall {overall}, {team}"` op de kaart
- `aria-selected="true"` wanneer state=selected
- `aria-disabled="true"` wanneer state=disabled
- `tabIndex={0}` voor keyboard-navigatie
- `onKeyDown`: Enter/Space triggert onClick
- Sterren: `aria-label="{count} van 5 sterren"`
- Foto: `alt="{roepnaam}"` of decoratief `alt=""` als naam al in tekst staat
- Kleurcontrast: overall-getal op gradient-achtergrond heeft altijd wit (`text-white`) met schaduw (`drop-shadow-md`) voor leesbaarheid op alle gradients
- `prefers-reduced-motion`: schakelt 3D tilt en flip-animaties uit, houdt enkel opacity-transitions

---

## 2. ScoreInput -- SmileyScore

3-punts invoer met smileys voor de jongste categorieen (Paars/Blauw, leeftijd 5-9).

### Props interface

```typescript
interface SmileyScoreProps {
  /** Label boven de smileys */
  label: string;
  /** Huidige waarde (null = niets geselecteerd) */
  value: number | null;
  /** Change handler */
  onChange: (value: number) => void;
  /** Optionele vraagtekst onder het label */
  vraagTekst?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Optioneel: id voor form-koppeling */
  id?: string;
}

type SmileyOption = {
  value: 1 | 2 | 3;
  emoji: string;
  label: string;       // Voor aria-label
  selectedColor: string; // Tailwind bg-class bij selectie
};
```

### Smiley-opties

| Waarde | Emoji | Aria-label | Geselecteerde kleur |
|---|---|---|---|
| 1 | Custom SVG (droevig gezicht) | "Kan beter" | `bg-red-100 ring-red-400` |
| 2 | Custom SVG (neutraal gezicht) | "Gaat wel" | `bg-yellow-100 ring-yellow-400` |
| 3 | Custom SVG (blij gezicht) | "Goed!" | `bg-green-100 ring-green-400` |

De smileys worden als SVG gerenderd (geen emoji-tekens) voor consistente weergave cross-platform.

### Visuele states

**Unselected**
```
Smiley-button:
  h-14 w-14 min-h-[56px] min-w-[56px]
  rounded-2xl
  bg-gray-50 border-2 border-gray-200
  text-gray-400
  transition-all duration-200
  hover:border-gray-300 hover:bg-gray-100 hover:scale-105
  active:scale-95

SVG icoon:
  h-8 w-8 text-gray-400

Container:
  flex gap-4 justify-center
```

**Selected (met bounce)**
```
Smiley-button (geselecteerd):
  h-14 w-14 min-h-[56px] min-w-[56px]
  rounded-2xl
  {selectedColor} (bijv. bg-green-100)
  border-2 ring-2 {ringColor} (bijv. ring-green-400)
  scale-110
  animate-[smiley-bounce_400ms_cubic-bezier(0.34,1.56,0.64,1)]

SVG icoon (geselecteerd):
  h-8 w-8
  waarde 1: text-red-500
  waarde 2: text-yellow-500
  waarde 3: text-green-500

@keyframes smiley-bounce {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1.1); }
}
```

**Disabled**
```
Smiley-button:
  opacity-50 cursor-not-allowed pointer-events-none
  bg-gray-50 border-gray-200
```

### Layout

```
┌────────────────────────────────┐
│ Label tekst                    │  ← text-sm font-medium text-gray-700
│ Optionele vraagtekst           │  ← text-xs text-gray-500 mt-0.5
│                                │
│    😟      😐      😊         │  ← flex gap-4 justify-center mt-3
│  Kan beter Gaat wel  Goed!     │  ← text-[10px] text-gray-500 mt-1 text-center
└────────────────────────────────┘
```

### Responsive gedrag

- Smiley-knoppen zijn altijd minimaal 56x56px (touch-target richtlijn)
- Op grotere schermen groeien ze naar 64x64px: `sm:h-16 sm:w-16`
- Labels onder de smileys zijn optioneel en verschijnen alleen op `sm:` en groter

### Accessibility

- `role="radiogroup"` op de container
- `aria-label="{label}"` op de container
- Elke smiley-button: `role="radio"`, `aria-checked={value === optie.value}`, `aria-label="{optie.label}"`
- `tabIndex`: eerste optie `0`, rest `-1` (roving tabindex)
- Pijltjestoetsen (links/rechts) navigeren tussen opties
- `aria-disabled="true"` bij disabled state
- Focus-ring: `focus-visible:ring-2 focus-visible:ring-ow-oranje focus-visible:ring-offset-2 outline-none`

---

## 3. ScoreInput -- SterrenScore

5-sterren invoer voor de midden-categorieen (Geel/Oranje, leeftijd 10-15).

### Props interface

```typescript
interface SterrenScoreProps {
  /** Label boven de sterren */
  label: string;
  /** Huidige waarde 1-5 (null = niets geselecteerd) */
  value: number | null;
  /** Change handler */
  onChange: (value: number) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Optioneel: toon half-sterren (voor gemiddelden) */
  readOnly?: boolean;
  /** Optioneel: id voor form-koppeling */
  id?: string;
}
```

### Visuele states

**Empty (geen selectie)**
```
Ster-button:
  h-10 w-10
  text-gray-300
  transition-all duration-150
  cursor-pointer
  hover:text-yellow-300 hover:scale-110

SVG ster:
  h-7 w-7
  fill: none, stroke: currentColor, strokeWidth: 1.5
```

**Partial (hover-preview)**
Wanneer de muis over ster N staat, worden sterren 1 t/m N tijdelijk gevuld:
```
Sterren 1..N:
  text-yellow-300
  scale-105
  (ster N zelf: scale-110)

Sterren N+1..5:
  text-gray-300
```

**Full (geselecteerd)**
```
Geselecteerde sterren (1..value):
  text-yellow-400
  fill-yellow-400
  drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]
  animate-[star-fill_300ms_ease-out]

Lege sterren (value+1..5):
  text-gray-300
  fill-none

@keyframes star-fill {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
```
Sterren worden sequentieel gevuld met 50ms vertraging per ster (`animation-delay: calc(var(--star-index) * 50ms)`).

**Hover (op individuele ster)**
```
De ster onder de muis:
  scale-125 text-yellow-400
  filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6))
```

**Disabled**
```
Alle sterren:
  opacity-40 cursor-not-allowed pointer-events-none
  text-gray-300
```

### Layout

```
┌────────────────────────────────┐
│ Label tekst                    │  ← text-sm font-medium text-gray-700
│                                │
│  ★ ★ ★ ★ ☆                    │  ← flex gap-1 mt-2
│                                │
│  "4 van 5"                     │  ← text-xs text-gray-500 mt-1 (sr-only op mobile)
└────────────────────────────────┘
```

### Responsive gedrag

- Ster-grootte: `h-10 w-10` op mobile, `sm:h-8 sm:w-8` op desktop (in team-rij context iets kleiner)
- Gap: `gap-1` altijd
- Touch-target: elke ster heeft minimaal 44x44px hit-area via padding

### Accessibility

- `role="radiogroup"` op de container
- `aria-label="{label}"` op de container
- Elke ster: `role="radio"`, `aria-checked={value === sterNummer}`, `aria-label="{sterNummer} van 5 sterren"`
- Roving tabindex: actieve ster `tabIndex={0}`, overige `tabIndex={-1}`
- Pijltjestoetsen: links verlaagt, rechts verhoogt
- `aria-valuenow={value}`, `aria-valuemin={1}`, `aria-valuemax={5}` op container
- Focus-ring: `focus-visible:ring-2 focus-visible:ring-ow-oranje focus-visible:ring-offset-2 outline-none`

---

## 4. ScoreInput -- SliderScore

0-99 slider voor de oudste categorieen (Rood, leeftijd 16-18).

### Props interface

```typescript
interface SliderScoreProps {
  /** Label boven de slider */
  label: string;
  /** Huidige waarde 0-99 (null = niets geselecteerd) */
  value: number | null;
  /** Change handler */
  onChange: (value: number) => void;
  /** Preset-waarden als snelkeuze */
  snelkeuze?: SnelkeuzeOptie[];
  /** Disabled state */
  disabled?: boolean;
  /** Optioneel: id voor form-koppeling */
  id?: string;
}

interface SnelkeuzeOptie {
  label: string;
  value: number;
}

// Default snelkeuze:
const DEFAULT_SNELKEUZE: SnelkeuzeOptie[] = [
  { label: "Zwak", value: 25 },
  { label: "Gem", value: 50 },
  { label: "Goed", value: 70 },
  { label: "Top", value: 90 },
];
```

### Visuele states

**Idle**
```
Container:
  relative w-full

Waarde-label (boven slider):
  absolute -top-6 left-[calc(var(--slider-pct)*1%)]
  -translate-x-1/2
  text-sm font-bold text-gray-900
  bg-white px-2 py-0.5 rounded-md shadow-sm border border-gray-200
  transition-all duration-150

Slider track:
  w-full h-2 rounded-full bg-gray-200
  appearance-none

Filled portion:
  h-2 rounded-full
  bg-gradient-to-r from-red-400 via-yellow-400 to-green-500
  (breedte = value%)

Thumb:
  h-6 w-6 rounded-full
  bg-white border-2 border-ow-oranje
  shadow-md
  cursor-pointer
  transition-transform duration-100
```

**Dragging**
```
Thumb:
  scale-125 shadow-lg
  border-ow-oranje
  ring-4 ring-ow-oranje/20

Waarde-label:
  scale-110 font-extrabold
  shadow-md
```

**Disabled**
```
Track:
  bg-gray-100 opacity-50
Thumb:
  bg-gray-200 border-gray-300
  cursor-not-allowed pointer-events-none
Snelkeuze-chips:
  opacity-50 pointer-events-none
```

### Snelkeuze-chips

```
Chip container:
  flex gap-2 mt-3 flex-wrap

Individuele chip:
  px-3 py-1.5 rounded-full
  text-xs font-medium
  border border-gray-200 bg-white text-gray-700
  hover:border-ow-oranje hover:text-ow-oranje
  active:scale-95
  transition-all duration-150
  cursor-pointer

Actieve chip (value === chip.value, met tolerantie +/-2):
  bg-ow-oranje-bg border-ow-oranje text-ow-oranje font-semibold
```

### Layout

```
┌────────────────────────────────────────┐
│ Label tekst                            │  ← text-sm font-medium text-gray-700
│                                        │
│             ┌──┐                       │
│             │72│  ← waarde-bubble       │  ← positie volgt slider thumb
│             └──┘                       │
│ ━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━  │  ← slider (h-2, thumb h-6 w-6)
│ 0                                  99  │  ← text-[10px] text-gray-400
│                                        │
│  [Zwak]  [Gem]  [Goed]  [Top]          │  ← snelkeuze chips
└────────────────────────────────────────┘
```

### Kleur-gradient van de track

De gevulde track-kleur is een visuele indicator van de score-range:
- 0-25: rood (`from-red-400`)
- 25-50: rood naar geel
- 50-75: geel naar groen
- 75-99: groen (`to-green-500`)

### Responsive gedrag

- Slider neemt altijd volle breedte: `w-full`
- Snelkeuze-chips wrappen op smalle schermen: `flex-wrap`
- Touch: slider thumb is 48px touch-target via transparante padding
- Op desktop kan de waarde ook via het nummertoetsenbord ingevoerd worden (klik op het waarde-label opent een mini-input)

### Accessibility

- `<input type="range">` als basis-element
- `aria-label="{label}"`
- `aria-valuemin={0}`, `aria-valuemax={99}`, `aria-valuenow={value}`
- `aria-valuetext="{value} van 99"`
- Snelkeuze-chips: `role="button"`, `aria-label="Stel in op {label} ({value})"`
- Pijltjestoetsen: stap van 1 (default), shift+pijl stap van 10
- Focus-ring op thumb: `focus-visible:ring-2 focus-visible:ring-ow-oranje`
- `aria-disabled="true"` bij disabled state
- Waarde-label heeft `aria-live="polite"` zodat screen readers wijzigingen aankondigen

---

## 5. TeamSpelerRij

Een speler-rij in team-scouting modus. Compact formaat voor het scouten van een heel team tegelijk.

### Props interface

```typescript
interface TeamSpelerRijProps {
  /** Speler-data */
  speler: {
    id: string;
    roepnaam: string;
    achternaam: string;
    fotoUrl?: string;
    team: string;
  };
  /** Welk score-input type */
  scoreType: "smiley" | "ster" | "slider";
  /** Huidige score-waarde */
  value: number | null;
  /** Score change handler */
  onChange: (value: number) => void;
  /** Label voor de score (pijler-naam) */
  scoreLabel: string;
  /** Is deze rij disabled? */
  disabled?: boolean;
  /** Is het rapport voor deze speler compleet? */
  compleet?: boolean;
}
```

### Visuele states

**Default**
```
Rij-container:
  flex items-center gap-3 px-4 py-3
  border-b border-gray-100
  bg-white
  transition-colors duration-150

Foto:
  h-10 w-10 rounded-full object-cover
  bg-gray-100 (fallback)
  flex-shrink-0

Naam-kolom:
  flex-1 min-w-0
  Roepnaam: text-sm font-medium text-gray-900 truncate
  Team:     text-xs text-gray-500

Score-input (rechts):
  flex-shrink-0
  (Smiley: compacte variant, 40x40px knoppen)
  (Ster: 5 sterren, 32x32px)
  (Slider: compacte slider, w-[140px] sm:w-[200px])
```

**Completed (rapport klaar)**
```
Rij-container:
  bg-green-50/50

Compleet-indicator:
  (rechts van score)
  h-5 w-5 text-green-500
  (check-circle SVG)
```

**Disabled**
```
Rij-container:
  opacity-50 bg-gray-50

Alle interactieve elementen:
  pointer-events-none
```

**Active/Editing**
```
Rij-container:
  bg-ow-oranje-bg/30
  border-l-2 border-l-ow-oranje
```

### Foto-fallback

Als `fotoUrl` ontbreekt, toon initialen:
```
Fallback-cirkel:
  h-10 w-10 rounded-full
  bg-gray-200
  flex items-center justify-center
  text-sm font-medium text-gray-500

Initialen:
  Eerste letter roepnaam + eerste letter achternaam
  uppercase
```

### Layout

```
┌─────────────────────────────────────────────────┐
│ ┌────┐                                          │
│ │foto│  Roepnaam Achternaam     😟  😐  😊      │
│ │40px│  Team D1                                  │
│ └────┘                          (of ★★★★☆)      │
│                                 (of [slider])    │
└─────────────────────────────────────────────────┘
```

### Responsive gedrag

- Mobile (< 640px): naam truncated na ~100px, score-input neemt resterende ruimte
- Tablet/Desktop: volledige naam zichtbaar, score-input vast op rechts
- Slider-variant: `w-[140px]` mobile, `sm:w-[200px]` desktop
- Smiley-variant: knoppen `h-10 w-10` in rij-context (kleiner dan standalone)

### Accessibility

- Rij: `role="listitem"` (parent heeft `role="list"`)
- Foto: `alt="{roepnaam}"` of `alt=""` (decoratief als naam zichtbaar)
- Score-input erft accessibility van het specifieke score-type (zie secties 2-4)
- Focus-management: Tab navigeert naar de score-input van elke rij
- `aria-label="Score voor {roepnaam} {achternaam}: {scoreLabel}"`

---

## 6. RadarChart

6-assen radar (spider/pizza) chart voor de zes pijlers.

### Props interface

```typescript
interface RadarChartProps {
  /** Zes scores (0-99 elk, of 1-3/1-5 genormaliseerd naar 0-99) */
  scores: [number, number, number, number, number, number];
  /** Labels voor de zes assen */
  labels?: [string, string, string, string, string, string];
  /** Kleur van de chart-area */
  kleur?: string;
  /** Grootte van de chart */
  size?: "sm" | "md" | "lg";
  /** Variant */
  variant?: "filled" | "outline";
  /** Vergelijk-overlay (tweede dataset) */
  vergelijk?: {
    scores: [number, number, number, number, number, number];
    kleur: string;
    label: string;
  };
  /** Of labels getoond worden */
  toonLabels?: boolean;
  /** Of waarden op de punten getoond worden */
  toonWaarden?: boolean;
}
```

### Default labels

```typescript
const DEFAULT_LABELS: [string, string, string, string, string, string] = [
  "Aanval", "Verdediging", "Schieten", "Passen", "Bewegen", "Inzet"
];
```

### Sizes

| Size | Afmetingen | Use case |
|---|---|---|
| `sm` | `w-24 h-24` (96px) | In SpelersKaart (large), mini-weergave |
| `md` | `w-48 h-48` (192px) | Spelerprofiel, vergelijking |
| `lg` | `w-72 h-72` (288px) | Detail-view, fullscreen |

### Visuele opbouw (SVG)

```
Achtergrond-web:
  6 concentrische zeshoeken (20%, 40%, 60%, 80%, 100%)
  stroke: gray-200, strokeWidth: 0.5, fill: none

Assen:
  6 lijnen van centrum naar de rand
  stroke: gray-200, strokeWidth: 0.5

Data-polygon (variant: filled):
  fill: {kleur}/20 (semi-transparant)
  stroke: {kleur}
  strokeWidth: 2

Data-polygon (variant: outline):
  fill: none
  stroke: {kleur}
  strokeWidth: 2.5
  strokeDasharray: none

Datapunten:
  6 cirkels op de polygon-hoeken
  r: 3 (sm), r: 4 (md), r: 5 (lg)
  fill: {kleur}
  stroke: white, strokeWidth: 2

Labels:
  text-[10px] sm:text-xs fill-gray-600 font-medium
  Gepositioneerd buiten de buitenste zeshoek

Waarden (optioneel):
  text-[9px] font-bold fill-gray-900
  Gepositioneerd net binnen de datapunten
```

### Vergelijk-overlay

Bij een vergelijk-dataset wordt een tweede polygon getekend:
```
Tweede polygon:
  fill: {vergelijk.kleur}/10
  stroke: {vergelijk.kleur}
  strokeWidth: 2
  strokeDasharray: 4 2 (stippellijn)

Legenda (onder de chart):
  flex gap-4 justify-center mt-2 text-xs
  Primair:  ■ {kleur} cirkel + "Huidig"
  Vergelijk: □ {vergelijk.kleur} stippel-cirkel + {vergelijk.label}
```

### Responsive gedrag

- `sm` size op mobile, `md` op tablet, `lg` als er ruimte is
- Labels verbergen op `sm` size (toonLabels default false bij sm)
- SVG is altijd `viewBox="0 0 200 200"` en schaalt met de container

### Accessibility

- `role="img"` op de SVG container
- `aria-label="Radar chart: Aanval {score}, Verdediging {score}, ..."` (alle scores in tekst)
- `<title>` element in SVG met dezelfde beschrijving
- Bij vergelijk-modus: `aria-label` bevat ook de vergelijk-scores
- Kleurcontrast: data-polygon kleur heeft minimaal 3:1 contrast met de achtergrond

### Animatie

Bij eerste render of score-update worden de datapunten geanimeerd:
```
@keyframes radar-grow {
  0% { transform: scale(0); transform-origin: center; }
  100% { transform: scale(1); transform-origin: center; }
}
```
Duur: 500ms, easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` (springend).

---

## 7. XPBar

Voortgangsbalk voor het XP-systeem (gamification).

### Props interface

```typescript
interface XPBarProps {
  /** Huidige XP in dit level */
  currentXP: number;
  /** Benodigde XP voor volgend level */
  levelXP: number;
  /** Huidig level-nummer */
  level: number;
  /** Level-naam (bijv. "Verkenner", "Speurder") */
  naam: string;
  /** Toon compacte variant (alleen bar, geen tekst) */
  compact?: boolean;
  /** Animeer een XP-gain (nieuwe XP erbij) */
  animateGain?: number;
}
```

### Visuele states

**Default (idle)**
```
Container:
  w-full

Header (niet bij compact):
  flex items-center justify-between mb-1
  Level-naam: text-sm font-semibold text-gray-900
             "Level {level}: {naam}"
  XP-tekst:  text-xs text-gray-500
             "{currentXP} / {levelXP} XP"

Bar-container:
  w-full h-3 rounded-full bg-gray-200 overflow-hidden
  (compact: h-2)

Gevulde bar:
  h-full rounded-full
  bg-gradient-to-r from-xp-bar to-xp-bar-glow
  width: calc((currentXP / levelXP) * 100%)
  transition-[width] duration-700 ease-out

Level-badge (links van de bar):
  (alleen bij niet-compact)
  h-8 w-8 rounded-full
  bg-xp-bar text-white
  flex items-center justify-center
  text-xs font-bold
  shadow-sm
  "{level}"
```

**XP-gain animatie**

Wanneer `animateGain` > 0, wordt de bar geanimeerd:
```
Fase 1 - Bar groeit (0-700ms):
  width transitie van oud naar nieuw percentage
  transition-[width] duration-700 ease-out

Fase 2 - Glow pulse (300-1000ms):
  @keyframes xp-glow {
    0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
    50% { box-shadow: 0 0 12px 4px rgba(99, 102, 241, 0.3); }
    100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
  }

Fase 3 - XP counter telt op (0-500ms):
  Het getal in de XP-tekst telt numeriek op van oud naar nieuw
  font-variant-numeric: tabular-nums (voorkomt layout shift)

Fase 4 - "+{gain} XP" floating text (200-1200ms):
  @keyframes xp-float {
    0% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
  text-sm font-bold text-xp-bar
  absolute, begint boven de bar
```

### Layout

```
Normaal:
┌────────────────────────────────────────┐
│ ┌──┐  Level 3: Speurder    420/800 XP │
│ │ 3│  ━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░ │
│ └──┘                     +25 XP ↑      │
└────────────────────────────────────────┘

Compact:
━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░
```

### Responsive gedrag

- Neemt altijd volle breedte van parent: `w-full`
- Compact variant voor smalle contexten (sidebar, bottom nav)
- Bij heel smalle schermen (< 320px): XP-tekst verborgen, alleen bar + level-badge

### Accessibility

- `role="progressbar"` op de bar
- `aria-valuenow={currentXP}`, `aria-valuemin={0}`, `aria-valuemax={levelXP}`
- `aria-label="Level {level}: {naam}, {currentXP} van {levelXP} XP"`
- `aria-live="polite"` op XP-tekst voor screen reader updates bij gain
- `prefers-reduced-motion`: schakelt glow en float-animaties uit, houdt width-transitie met kortere duur (200ms)

---

## 8. BadgeCard

Enkele badge in de verzamelcollectie.

### Props interface

```typescript
interface BadgeCardProps {
  /** Badge-data */
  badge: {
    id: string;
    naam: string;
    icoon: string;         // Emoji of SVG-path
    beschrijving: string;
    categorie: "scout" | "streak" | "sociaal" | "speciaal";
  };
  /** Is de badge ontgrendeld? */
  unlocked: boolean;
  /** Datum van ontgrendeling */
  unlockedAt?: Date;
  /** Click handler voor detail-view */
  onClick?: () => void;
  /** Grootte */
  size?: "sm" | "md";
}
```

### Visuele states

**Locked (niet ontgrendeld)**
```
Container:
  w-full aspect-square
  rounded-2xl
  bg-gray-100 border-2 border-gray-200 border-dashed
  flex flex-col items-center justify-center
  cursor-default

Icoon:
  h-10 w-10 (sm: h-8 w-8)
  text-gray-300
  filter: grayscale(100%) brightness(0.8)
  (voor emoji: opacity-30)
  (voor SVG: fill-gray-300)

Naam:
  text-xs text-gray-400 font-medium mt-2 text-center
  truncate max-w-[90%]

Vraagteken overlay:
  absolute inset-0 flex items-center justify-center
  text-2xl text-gray-300 font-bold
  "?"
```

**Unlocked (ontgrendeld)**
```
Container:
  w-full aspect-square
  rounded-2xl
  bg-white border-2 border-gray-200
  shadow-sm hover:shadow-md
  flex flex-col items-center justify-center
  cursor-pointer
  transition-all duration-200
  hover:scale-[1.03]

Icoon:
  h-10 w-10 (sm: h-8 w-8)
  (originele kleur, geen filter)

Naam:
  text-xs text-gray-900 font-semibold mt-2 text-center

Datum:
  text-[10px] text-gray-400 mt-0.5
  (relatieve datum: "3 dagen geleden")

Glans-effect (subtiel):
  Pseudo-element ::after
  absolute inset-0 rounded-2xl
  bg-gradient-to-br from-white/60 via-transparent to-transparent
  pointer-events-none
```

**Nieuw ontgrendeld (met animatie)**
```
Container (eerste keer getoond):
  animate-[badge-unlock_600ms_cubic-bezier(0.34,1.56,0.64,1)]

@keyframes badge-unlock {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

Shimmer-effect na unlock:
  @keyframes badge-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  Toegepast als gradient overlay, eenmalig (animation-iteration-count: 1)
```

### Categorie-accenten

| Categorie | Accent-kleur (border bij unlocked) |
|---|---|
| `scout` | `border-ow-oranje` |
| `streak` | `border-purple-400` |
| `sociaal` | `border-blue-400` |
| `speciaal` | `border-yellow-400` |

### Sizes

| Size | Afmetingen | Use case |
|---|---|---|
| `sm` | Icoon `h-8 w-8`, naam `text-[10px]` | Grid van 4+ kolommen |
| `md` | Icoon `h-10 w-10`, naam `text-xs` | Grid van 2-3 kolommen |

### Layout

```
┌──────────────┐
│              │
│     🏆       │  ← Icoon (gecentreerd)
│              │
│  Topscout    │  ← Naam
│  3 dgn gel.  │  ← Datum (unlocked)
└──────────────┘
```

### Responsive gedrag

- Grid: `grid grid-cols-3 gap-3` mobile, `sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6` desktop
- `size="sm"` automatisch in grid met > 4 kolommen

### Accessibility

- `role="listitem"` (parent grid heeft `role="list"`)
- `aria-label="{badge.naam} badge, {unlocked ? 'ontgrendeld' : 'vergrendeld'}"`
- `aria-disabled={!unlocked}` op locked badges
- Bij unlocked + onClick: `tabIndex={0}`, Enter/Space triggert onClick
- Bij locked: `tabIndex={-1}` (niet focusbaar)
- `title="{badge.beschrijving}"` op hover (tooltip)
- Categorie als visueel label: niet alleen met kleur, ook met tekst-indicatie in de aria-label

---

## 9. BottomNav

Mobiele bottom navigation (tabbar). Alleen zichtbaar op mobiel, vervangt de sidebar.

### Props interface

```typescript
interface BottomNavProps {
  /** Welke tab is actief */
  activeTab: TabId;
  /** Tab-configuratie */
  tabs?: TabConfig[];
}

type TabId = "home" | "scout" | "kaarten" | "profiel";

interface TabConfig {
  id: TabId;
  label: string;
  href: string;
  icon: {
    active: React.ReactNode;    // Filled SVG
    inactive: React.ReactNode;  // Outline SVG
  };
  badge?: number;  // Notificatie-teller
}
```

### Default tabs

```typescript
const DEFAULT_TABS: TabConfig[] = [
  { id: "home", label: "Home", href: "/", icon: { active: HomeFilledIcon, inactive: HomeOutlineIcon } },
  { id: "scout", label: "Scout", href: "/scout", icon: { active: SearchFilledIcon, inactive: SearchOutlineIcon } },
  { id: "kaarten", label: "Kaarten", href: "/kaarten", icon: { active: CardFilledIcon, inactive: CardOutlineIcon } },
  { id: "profiel", label: "Profiel", href: "/profiel", icon: { active: UserFilledIcon, inactive: UserOutlineIcon } },
];
```

### Visuele stijl

```
Nav-container:
  fixed bottom-0 inset-x-0 z-50
  bg-white
  border-t border-gray-200
  pb-[env(safe-area-inset-bottom)]
  md:hidden

Inner container:
  flex items-center justify-around
  h-14 px-2
  max-w-lg mx-auto

Tab-item (inactief):
  flex flex-col items-center justify-center
  w-full h-full
  gap-0.5
  text-gray-400

  Icoon: h-6 w-6
  Label: text-[10px] font-medium

Tab-item (actief):
  flex flex-col items-center justify-center
  w-full h-full
  gap-0.5
  text-ow-oranje

  Icoon: h-6 w-6 text-ow-oranje
  Label: text-[10px] font-semibold text-ow-oranje

Tab-item (met badge):
  Badge (rechts-boven op icoon):
    absolute -top-1 -right-1
    min-w-[16px] h-4
    rounded-full bg-red-500 text-white
    text-[9px] font-bold
    flex items-center justify-center
    px-1
```

### Actieve tab indicator

```
Onder het actieve tab-icoon:
  h-0.5 w-8 rounded-full bg-ow-oranje
  mt-0.5
  transition-all duration-200

Of: dot-variant
  h-1 w-1 rounded-full bg-ow-oranje
```

### Safe area

```
iOS home indicator padding:
  pb-[env(safe-area-inset-bottom)]

Als env() niet ondersteund wordt:
  pb-4 (fallback)

Content padding-bottom (op <main>):
  pb-20 md:pb-0
  (voorkomt dat content achter de nav verdwijnt)
```

### Responsive gedrag

- `md:hidden` — verborgen op desktop (daar is een sidebar/top-nav)
- Altijd 4 tabs, gelijke breedte
- Max-breedte: `max-w-lg mx-auto` zodat tabs niet te ver uit elkaar staan op brede mobiele schermen
- Landscape: hoogte blijft `h-14`, labels verborgen op zeer kleine hoogte (`@media (max-height: 500px)`)

### Accessibility

- `<nav>` element met `aria-label="Hoofdnavigatie"`
- Actieve tab: `aria-current="page"`
- Tab-links: `<a>` elementen (Next.js `<Link>`)
- Badge: `aria-label="{badge} nieuwe {notifications}"` (screen reader leest het getal)
- Icoon-wisseling (filled/outline): puur visueel, geen impact op accessibility
- Focus-ring: `focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ow-oranje outline-none`

---

## 10. CelebrationOverlay

Fullscreen overlay die verschijnt na het indienen van een scoutingrapport. Viert de bijdrage met XP, een kaart-onthulling en optioneel een badge.

### Props interface

```typescript
interface CelebrationOverlayProps {
  /** Hoeveel XP verdiend */
  xpGained: number;
  /** Optioneel: badge die net ontgrendeld is */
  badgeUnlocked?: {
    id: string;
    naam: string;
    icoon: string;
    beschrijving: string;
  };
  /** Data voor de kaart die getoond/bijgewerkt wordt */
  kaartData: {
    roepnaam: string;
    achternaam: string;
    team: string;
    overall: number;
    tier: "brons" | "zilver" | "goud";
    leeftijdsgroepKleur: LeeftijdsgroepKleur;
    stats: SpelersKaartProps["stats"];
    sterren: 1 | 2 | 3 | 4 | 5;
  };
  /** Dismiss handler */
  onDismiss: () => void;
  /** Auto-dismiss na N seconden (default: geen) */
  autoDismissMs?: number;
}
```

### Animatie-sequentie

De overlay speelt een reeks animaties af in vaste volgorde:

| Fase | Timing | Wat gebeurt er |
|---|---|---|
| 1. Achtergrond fade-in | 0-300ms | Overlay-achtergrond verschijnt |
| 2. Confetti | 300-2000ms | Confetti-deeltjes vallen van bovenaf |
| 3. Kaart-reveal | 500-1100ms | SpelersKaart draait in (flip-animatie) |
| 4. XP counter | 1200-2000ms | "+{xpGained} XP!" telt op met glow |
| 5. Badge (optioneel) | 2000-2600ms | Badge draait in met unlock-animatie |
| 6. Dismiss-knop | 2500ms+ | "Verder" knop wordt zichtbaar |

### Visuele opbouw

```
Overlay achtergrond:
  fixed inset-0 z-[100]
  bg-black/70 backdrop-blur-sm
  flex flex-col items-center justify-center
  p-6
  animate-[overlay-fade_300ms_ease-out]

  @keyframes overlay-fade {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

Confetti-laag:
  absolute inset-0 pointer-events-none overflow-hidden z-[101]
  (Canvas of CSS-gebaseerde confetti-deeltjes)
  Kleuren: ow-oranje, geel, groen, blauw, rood
  50-80 deeltjes, zwaartekracht-simulatie
  Duration: 2s, daarna uitfaden

SpelersKaart (centered):
  z-[102] relative
  animate-[card-flip_600ms_cubic-bezier(0.4,0,0.2,1)_500ms_both]
  size="medium"

XP counter:
  mt-6 text-center z-[102]
  text-2xl font-bold text-white
  animate-[xp-counter-pop_400ms_cubic-bezier(0.34,1.56,0.64,1)_1200ms_both]

  @keyframes xp-counter-pop {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  Numeriek optellen:
    "+{xpGained} XP!" telt van 0 naar xpGained over 800ms
    font-variant-numeric: tabular-nums

  Glow:
    text-shadow: 0 0 20px rgba(99, 102, 241, 0.5)

Badge-sectie (optioneel):
  mt-4 text-center z-[102]
  animate-[badge-unlock_600ms_cubic-bezier(0.34,1.56,0.64,1)_2000ms_both]

  Badge icoon: h-16 w-16
  Badge naam:  text-lg font-bold text-white mt-2
  Badge tekst: text-sm text-gray-300 mt-1
               "Nieuwe badge ontgrendeld!"

Dismiss-knop:
  mt-8 z-[102]
  opacity-0 animate-[overlay-fade_300ms_ease-out_2500ms_both]

  px-8 py-3 rounded-full
  bg-white text-gray-900
  text-base font-semibold
  shadow-lg
  hover:bg-gray-100 active:scale-95
  transition-all duration-150
  "Verder"
```

### Layout

```
┌──────────────────────────────────┐
│                                  │
│    🎊  confetti  🎊              │
│                                  │
│         ┌────────┐               │
│         │ SPELER │               │
│         │  KAART │               │
│         │ (flip) │               │
│         └────────┘               │
│                                  │
│        +25 XP!                   │
│                                  │
│          🏆                       │
│    Nieuwe badge:                 │
│    "Eerste Scout"                │
│                                  │
│       [ Verder ]                 │
│                                  │
└──────────────────────────────────┘
```

### Responsive gedrag

- Overlay neemt altijd het volledige scherm: `fixed inset-0`
- SpelersKaart: `size="medium"` op mobile, `size="large"` op desktop met `md:` prefix
- XP-tekst schaalt: `text-2xl md:text-3xl`
- Confetti: minder deeltjes op mobile (30) vs desktop (60) voor performance
- Safe area: `pb-[env(safe-area-inset-bottom)]` op de dismiss-knop

### Accessibility

- `role="dialog"` op de overlay, `aria-modal="true"`
- `aria-label="Felicitatie: {xpGained} XP verdiend voor {kaartData.roepnaam}"`
- Focus wordt getrapt in de overlay (focus trap)
- Dismiss-knop krijgt focus zodra hij verschijnt
- Escape-toets sluit de overlay
- `prefers-reduced-motion`: alle animaties worden vervangen door een eenvoudige fade-in (300ms) van de gehele content, geen sequentie
- `aria-live="assertive"` op de XP-counter zodat screen readers het resultaat aankondigen
- Confetti is puur decoratief: `aria-hidden="true"`

---

## 11. SpelerZoek

Zoekbalk met live resultaten voor het opzoeken van spelers.

### Props interface

```typescript
interface SpelerZoekProps {
  /** Handler wanneer een speler geselecteerd wordt */
  onSelect: (speler: ZoekResultaat) => void;
  /** Placeholder-tekst */
  placeholder?: string;
  /** Optioneel: filter op leeftijdsgroep */
  leeftijdsgroepFilter?: LeeftijdsgroepKleur;
  /** Optioneel: spelers die al geselecteerd zijn (grayed out) */
  excludeIds?: string[];
  /** Auto-focus bij mount */
  autoFocus?: boolean;
}

interface ZoekResultaat {
  id: string;          // rel_code
  roepnaam: string;
  achternaam: string;
  team: string;
  leeftijd: number;
  leeftijdsgroepKleur: LeeftijdsgroepKleur;
  fotoUrl?: string;
}
```

### Visuele states

**Empty (geen input)**
```
Zoek-container:
  relative w-full

Input:
  w-full h-12
  rounded-xl
  bg-white border border-gray-200
  pl-10 pr-4
  text-sm text-gray-900
  placeholder:text-gray-400
  shadow-sm
  focus:border-ow-oranje focus:ring-2 focus:ring-ow-oranje/20
  transition-all duration-150

Zoek-icoon (links in input):
  absolute left-3 top-1/2 -translate-y-1/2
  h-5 w-5 text-gray-400
  pointer-events-none
```

**Searching (laden)**
```
Input:
  (zelfde als empty, maar met spinner)

Spinner (rechts in input):
  absolute right-3 top-1/2 -translate-y-1/2
  h-4 w-4 text-gray-400
  animate-spin

Resultaten-dropdown:
  (niet zichtbaar tijdens zoeken, of toont "Zoeken..." tekst)
```

**Results (resultaten gevonden)**
```
Resultaten-dropdown:
  absolute top-full left-0 right-0 mt-1 z-50
  bg-white
  rounded-xl
  border border-gray-200
  shadow-lg
  max-h-[320px] overflow-y-auto
  divide-y divide-gray-100
  animate-[dropdown-in_150ms_ease-out]

  @keyframes dropdown-in {
    0% { opacity: 0; transform: translateY(-4px); }
    100% { opacity: 1; transform: translateY(0); }
  }

Resultaat-item:
  flex items-center gap-3 px-4 py-3
  cursor-pointer
  transition-colors duration-100
  hover:bg-gray-50
  focus:bg-gray-50 focus:outline-none

  Foto:
    h-9 w-9 rounded-full object-cover bg-gray-100 flex-shrink-0
    (fallback: initialen, zelfde als TeamSpelerRij)

  Naam + team:
    flex-1 min-w-0
    Naam:    text-sm font-medium text-gray-900 truncate
    Team:    text-xs text-gray-500

  Leeftijdsgroep-badge:
    (LeeftijdsgroepBadge component, zie sectie 12)
    flex-shrink-0

Resultaat-item (excluded / al geselecteerd):
  opacity-40 pointer-events-none
  Na de naam: text-[10px] text-gray-400 "Al geselecteerd"
```

**No results**
```
Resultaten-dropdown:
  (zelfde container als results)

Lege-state:
  px-4 py-8 text-center
  Icoon: h-10 w-10 text-gray-300 mx-auto (zoek-icoon met kruis)
  Tekst: text-sm text-gray-500 mt-2
         "Geen spelers gevonden voor '{zoekterm}'"
```

**Error**
```
Resultaten-dropdown:
  (zelfde container)

Error-state:
  px-4 py-6 text-center
  Tekst:     text-sm text-red-500
             "Er ging iets mis. Probeer opnieuw."
  Retry-knop: text-xs text-ow-oranje font-medium mt-2
              cursor-pointer hover:underline
              "Opnieuw proberen"
```

### Debounce

- Debounce-interval: 300ms na laatste toetsaanslag
- Minimale zoeklengte: 2 karakters (bij < 2 wordt de dropdown gesloten)
- Bij wissen van input: dropdown sluit onmiddellijk (geen debounce)

### Layout

```
┌────────────────────────────────────────┐
│ 🔍 Zoek een speler...            ⟳    │  ← Input met icoon + spinner
├────────────────────────────────────────┤
│ ┌────┐                                │
│ │foto│ Sophie de Vries     [Groen]     │  ← Resultaat-item
│ └────┘ Team E1                         │
├────────────────────────────────────────┤
│ ┌────┐                                │
│ │foto│ Thomas van Dijk     [Geel]      │
│ └────┘ Team D2                         │
├────────────────────────────────────────┤
│ ...                                    │
└────────────────────────────────────────┘
```

### Responsive gedrag

- Input neemt volle breedte: `w-full`
- Dropdown: `w-full` (zelfde breedte als input)
- Op mobile: dropdown kan het hele scherm vullen (max-h-[60vh])
- Op desktop: max-h-[320px] met scroll
- Touch: resultaat-items hebben minimaal 48px hoogte

### Accessibility

- Input: `role="combobox"`, `aria-expanded={open}`, `aria-autocomplete="list"`
- `aria-controls="zoek-resultaten"` op de input
- Dropdown: `role="listbox"`, `id="zoek-resultaten"`
- Resultaat-items: `role="option"`, `aria-selected={focused}`
- Keyboard:
  - ArrowDown/ArrowUp: navigeer door resultaten
  - Enter: selecteer gefocust resultaat
  - Escape: sluit dropdown
  - Home/End: spring naar eerste/laatste resultaat
- `aria-activedescendant` op input verwijst naar het gefocuste resultaat
- `aria-busy="true"` op de dropdown tijdens laden
- `aria-label="{placeholder || 'Zoek een speler'}"` op de input
- Live region: `aria-live="polite"` op een verborgen element dat het aantal resultaten aankondigt ("{n} resultaten gevonden")

---

## 12. LeeftijdsgroepBadge

Kleine kleur-badge die de leeftijdsgroep aangeeft. Bouwt voort op de bestaande `BandPill` uit `@oranje-wit/ui` maar met gradient-styling en leeftijdsinformatie.

### Props interface

```typescript
interface LeeftijdsgroepBadgeProps {
  /** Leeftijdsgroep-kleur */
  kleur: LeeftijdsgroepKleur;
  /** Leeftijd van de speler (optioneel, voor label) */
  leeftijd?: number;
  /** Badge grootte */
  size?: "sm" | "md" | "lg";
  /** Optioneel: custom tekst (override van default label) */
  label?: string;
}

type LeeftijdsgroepKleur = "paars" | "blauw" | "groen" | "geel" | "oranje" | "rood";
```

### Kleur-mapping

| Kleur | Leeftijdsrange | Label (default) | Gradient | Tekst-kleur |
|---|---|---|---|---|
| `paars` | 5-7 | "5-7" | `bg-gradient-to-r from-lg-paars-start to-lg-paars-end` | `text-white` |
| `blauw` | 8-9 | "8-9" | `bg-gradient-to-r from-lg-blauw-start to-lg-blauw-end` | `text-white` |
| `groen` | 10-11 | "10-11" | `bg-gradient-to-r from-lg-groen-start to-lg-groen-end` | `text-white` |
| `geel` | 12-13 | "12-13" | `bg-gradient-to-r from-lg-geel-start to-lg-geel-end` | `text-gray-900` |
| `oranje` | 14-15 | "14-15" | `bg-gradient-to-r from-lg-oranje-start to-lg-oranje-end` | `text-white` |
| `rood` | 16-18 | "16-18" | `bg-gradient-to-r from-lg-rood-start to-lg-rood-end` | `text-white` |

### Sizes

| Size | Classes | Use case |
|---|---|---|
| `sm` | `px-1.5 py-0.5 text-[9px] rounded-md` | In zoekresultaten, compacte lijsten |
| `md` | `px-2.5 py-0.5 text-xs rounded-full` | Standaard gebruik, naast spelernaam |
| `lg` | `px-3 py-1 text-sm rounded-full` | Headers, uitgelichte weergaven |

### Visuele opbouw

```
Badge:
  inline-flex items-center
  font-semibold
  {gradient} {textColor}
  {sizeClasses}
  shadow-sm

Met leeftijd:
  "{leeftijd}j" (bijv. "12j")

Zonder leeftijd:
  Default label (bijv. "10-11")

Met custom label:
  Gegeven label-tekst
```

### Responsive gedrag

- Inline element, past zich aan aan de context
- Geen responsive size-switch nodig (wordt door parent bepaald)

### Accessibility

- `role="status"` (informatief element)
- `aria-label="Leeftijdsgroep {kleur}, {leeftijd || range} jaar"`
- Kleur is niet het enige middel: de tekst (leeftijd of range) geeft altijd de informatie
- Voldoende contrast: wit op alle gradients behalve geel (daar `text-gray-900`)

---

## Overzicht hergebruik en afhankelijkheden

```
CelebrationOverlay
  ├── SpelersKaart (kaart-reveal)
  ├── XPBar (animateGain)
  └── BadgeCard (unlock-animatie)

SpelersKaart
  ├── RadarChart (size="sm", in large variant)
  ├── LeeftijdsgroepBadge (niet als badge, maar gradient als achtergrond)
  └── Sterren (intern sub-component)

SpelerZoek
  └── LeeftijdsgroepBadge (in resultaat-items)

TeamSpelerRij
  ├── SmileyScore | SterrenScore | SliderScore (afhankelijk van scoreType)
  └── LeeftijdsgroepBadge (optioneel)

BottomNav
  └── Badge (uit @oranje-wit/ui, voor notificatie-teller)
```

## Componenten uit @oranje-wit/ui die NIET hergebruikt worden

| Component | Reden |
|---|---|
| `AppShell` | OW Scout is mobile-first met BottomNav, niet sidebar-driven |
| `Sidebar` | Vervangen door BottomNav op mobile, eventueel later desktop |
| `PageHeader` | Scout heeft een eigen compactere header |
| `KpiCard` | Dashboard-component, niet relevant voor scouting |
| `SignalBadge` | Monitor-specifiek (kritiek/aandacht/opkoers) |
| `InfoDrawer` | Te desktop-gericht, Scout gebruikt modals/sheets |

## Animatie-registry

Alle custom keyframes op een rij. Deze worden gedefinieerd in de scouting globals.css.

```css
/* Kaart-animaties */
@keyframes card-flip {
  0% { transform: perspective(800px) rotateY(180deg); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: perspective(800px) rotateY(0); }
}

@keyframes card-reveal {
  0% { transform: scale(0.8); opacity: 0; filter: brightness(2); }
  100% { transform: scale(1); opacity: 1; filter: brightness(1); }
}

@keyframes card-update {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

/* Score-input animaties */
@keyframes smiley-bounce {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1.1); }
}

@keyframes star-fill {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

/* XP animaties */
@keyframes xp-glow {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 12px 4px rgba(99, 102, 241, 0.3); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}

@keyframes xp-float {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}

/* Badge animaties */
@keyframes badge-unlock {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes badge-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Radar chart */
@keyframes radar-grow {
  0% { transform: scale(0); transform-origin: center; }
  100% { transform: scale(1); transform-origin: center; }
}

/* Overlay */
@keyframes overlay-fade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes dropdown-in {
  0% { opacity: 0; transform: translateY(-4px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes xp-counter-pop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Reduced motion: vervang alle animaties door simpele fade */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.2s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.2s !important;
  }
}
```
