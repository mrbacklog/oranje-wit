# OW Scout — Design Token Systeem

Design tokens voor de OW Scout scouting app van c.k.v. Oranje Wit (Dordrecht).

Alle tokens staan in `tokens.css` als CSS custom properties. Ze zijn direct bruikbaar in Tailwind CSS 4 via `@theme inline { ... }` en in gewone CSS via `var(--token-naam)`.

---

## Inhoudsopgave

1. [Club-identiteit](#1-club-identiteit)
2. [KNKV Competitie 2.0 kleuren](#2-knkv-competitie-20-kleuren)
3. [Gradient-systeem per korfballeeftijd](#3-gradient-systeem-per-korfballeeftijd)
4. [Tiers (brons/zilver/goud)](#4-tiers-bronszilvergoud)
5. [Semantische kleuren](#5-semantische-kleuren)
6. [Typografie](#6-typografie)
7. [Spacing](#7-spacing)
8. [Border-radius](#8-border-radius)
9. [Schaduwen](#9-schaduwen)
10. [Touch targets & sizing](#10-touch-targets--sizing)
11. [Animaties & transitions](#11-animaties--transitions)
12. [Dark mode](#12-dark-mode)
13. [Gebruik in Tailwind CSS 4](#13-gebruik-in-tailwind-css-4)

---

## 1. Club-identiteit

c.k.v. Oranje Wit speelt in oranje en wit, met zwart als accent.

| Token | Waarde | Gebruik |
|---|---|---|
| `--ow-oranje-500` | `#FF6B00` | Primaire merkkleur, buttons, links |
| `--ow-oranje-600` | `#E05E00` | Hover-staat van oranje |
| `--ow-wit-50` | `#FFFFFF` | Paginaachtergrond |
| `--ow-zwart-900` | `#111827` | Primaire tekst |

Elke kleur heeft een volledige schaal van 50 (lichtst) tot 950 (donkerst).

### Kleurverloop

```
50   100   200   300   400   500   600   700   800   900   950
 |     |     |     |     |     |     |     |     |     |     |
licht --------> kernkleur -------> donker
                  ^
          Dit is de 500-waarde
```

---

## 2. KNKV Competitie 2.0 kleuren

Zes kleuren, gekoppeld aan leeftijdsgroepen. Dit is het officiele KNKV Competitie 2.0 kleurensysteem.

| Kleur | Leeftijd | Kernkleur (500) | Token-prefix |
|---|---|---|---|
| Paars | 5 | `#A855F7` | `--knkv-paars-*` |
| Blauw | 6-7 | `#3B82F6` | `--knkv-blauw-*` |
| Groen | 8-9 | `#22C55E` | `--knkv-groen-*` |
| Geel | 10-12 | `#EAB308` | `--knkv-geel-*` |
| Oranje | 13-15 | `#F97316` | `--knkv-oranje-*` |
| Rood | 16-18 | `#EF4444` | `--knkv-rood-*` |

Elke KNKV-kleur heeft een volledige schaal (50-950), net als de club-kleuren.

### Visueel overzicht

```
Leeftijd:   5      6  7      8  9     10 11 12    13 14 15    16 17 18

Kleur:    PAARS   BLAUW     GROEN      GEEL       ORANJE       ROOD
           |       |  |      |  |      |  |  |     |  |  |     |  |  |
          ---     ------    ------    ---------   ---------   ---------
```

---

## 3. Gradient-systeem per korfballeeftijd

Elke korfballeeftijd (5 t/m 18) heeft een **uniek kleurverloop** dat visueel toont waar een speler in het kleurenspectrum zit. Kernjaren hebben een puur verloop (kleur-op-kleur), overgangsjaren blenden subtiel naar de volgende/vorige kleurgroep.

### Overzicht

| Leeftijd | Van | Naar | Type | Token |
|---|---|---|---|---|
| 5 | Paars | Blauw | Overgang (enige paars-jaar) | `--age-5-*` |
| 6 | Blauw | Blauw | Kern (puur) | `--age-6-*` |
| 7 | Blauw | Groen ~18% | Overgang (richting groen) | `--age-7-*` |
| 8 | Groen | Groen | Kern (puur) | `--age-8-*` |
| 9 | Groen | Geel ~18% | Overgang (richting geel) | `--age-9-*` |
| 10 | Geel | Groen ~18% | Overgang (vanuit groen) | `--age-10-*` |
| 11 | Geel | Geel | Kern (puur) | `--age-11-*` |
| 12 | Geel | Oranje ~18% | Overgang (richting oranje) | `--age-12-*` |
| 13 | Oranje | Geel ~18% | Overgang (vanuit geel) | `--age-13-*` |
| 14 | Oranje | Oranje | Kern (puur) | `--age-14-*` |
| 15 | Oranje | Rood ~18% | Overgang (richting rood) | `--age-15-*` |
| 16 | Rood | Oranje ~18% | Overgang (vanuit oranje) | `--age-16-*` |
| 17 | Rood | Rood | Kern (puur) | `--age-17-*` |
| 18 | Donkerrood | Donkerrood | Premium (laatste jaar) | `--age-18-*` |

### Tokens per leeftijd

Per leeftijd zijn er 6 tokens beschikbaar:

| Token | Doel | Voorbeeld |
|---|---|---|
| `--age-{n}-from` | Startkleur gradient | `#3B82F6` |
| `--age-{n}-to` | Eindkleur gradient | `#60A5FA` |
| `--age-{n}-solid` | Vaste kleur (zonder gradient) | `#3B82F6` |
| `--age-{n}-text` | Tekstkleur op de gradient | `#FFFFFF` |
| `--age-{n}-bg` | Lichte achtergrondkleur | `#EFF6FF` |
| `--age-{n}-gradient` | Volledig CSS gradient | `linear-gradient(...)` |

### Visueel: het kleurenspectrum

```
Leeftijd  5     6     7     8     9    10    11    12    13    14    15    16    17    18

         [P>B] [BBB] [B>G] [GGG] [G>Y] [Y<G] [YYY] [Y>O] [O<Y] [OOO] [O>R] [R<O] [RRR] [DDD]

P = Paars   B = Blauw   G = Groen   Y = Geel   O = Oranje   R = Rood   D = Donkerrood
> = overgang naar    < = echo van vorige kleur
```

### Gebruik in CSS

```css
/* Gradient als achtergrond */
.speler-kaart-leeftijd-8 {
  background: var(--age-8-gradient);
  color: var(--age-8-text);
}

/* Vaste kleur voor kleinere elementen */
.badge-leeftijd-8 {
  background-color: var(--age-8-solid);
  color: var(--age-8-text);
}

/* Lichte achtergrond voor lijstweergave */
.rij-leeftijd-8 {
  background-color: var(--age-8-bg);
}
```

### Gebruik via convenience classes

```html
<div class="age-gradient-8">Leeftijd 8 kaart</div>
<div class="age-gradient-14">Leeftijd 14 kaart</div>
```

---

## 4. Tiers (brons/zilver/goud)

Drie prestatieniveaus met visueel onderscheidende stijlen. Brons is mat en warm, zilver is koel met een subtiele glans, goud schittert.

| Tier | Randkleur | Achtergrond | Effect |
|---|---|---|---|
| Brons | `#CD7F32` (koper) | `#FDF4E7` (warm creme) | Mat kopergloed |
| Zilver | `#A8A9AD` (staalgrijs) | `#F8F9FA` (koel wit) | Subtiele sheen |
| Goud | `#D4A017` (warm goud) | `#FFFBEB` (zacht goud) | Shimmer/glitter |

### Tokens per tier

| Token | Doel |
|---|---|
| `--tier-{naam}-border` | Randkleur |
| `--tier-{naam}-bg` | Achtergrondkleur |
| `--tier-{naam}-bg-overlay` | Semi-transparante overlay |
| `--tier-{naam}-text` | Tekstkleur |
| `--tier-{naam}-icon` | Icoonkleur |
| `--tier-{naam}-shine` | CSS gradient voor glanseffect |

### Gebruik in CSS

```css
.tier-kaart {
  border: 2px solid var(--tier-goud-border);
  background-color: var(--tier-goud-bg);
  background-image: var(--tier-goud-shine);
  color: var(--tier-goud-text);
}
```

### Convenience classes

```html
<div class="tier-brons">Brons speler</div>
<div class="tier-zilver">Zilver speler</div>
<div class="tier-goud tier-goud-shimmer">Goud speler (met animatie)</div>
```

---

## 5. Semantische kleuren

Vier standaard semantische kleuren voor feedback en status.

| Naam | Kernkleur | Gebruik |
|---|---|---|
| Success | `#22C55E` | Bevestigingen, beschikbaar |
| Warning | `#F59E0B` | Waarschuwingen, twijfelstatus |
| Error | `#EF4444` | Fouten, stoppend |
| Info | `#3B82F6` | Informatie, nieuwe spelers |

Per kleur zijn er tokens op 50, 100, 500, 600, 700 — van lichte achtergrond tot donkere tekst.

---

## 6. Typografie

### Fonts

| Token | Font | Gebruik |
|---|---|---|
| `--font-heading` | Inter (system-ui fallback) | Koppen, titels |
| `--font-body` | Inter (system-ui fallback) | Doorlopende tekst |
| `--font-stat` | JetBrains Mono (monospace fallback) | Scores, statistieken, nummers |

### Groottes

Alle groottes zijn gebaseerd op rem voor schaalbaarheid:

| Token | Grootte | Pixels | Gebruik |
|---|---|---|---|
| `--text-2xs` | 0.625rem | 10px | Labels onder iconen |
| `--text-xs` | 0.75rem | 12px | Kleine labels, badges |
| `--text-sm` | 0.875rem | 14px | Secundaire tekst |
| `--text-base` | 1rem | 16px | Body tekst (minimum voor mobiel) |
| `--text-lg` | 1.125rem | 18px | Benadrukte tekst |
| `--text-xl` | 1.25rem | 20px | Subtitels |
| `--text-2xl` | 1.5rem | 24px | Sectietitels |
| `--text-3xl` | 1.875rem | 30px | Paginatitels |
| `--text-4xl` | 2.25rem | 36px | Grote statistieken |

### Gewichten

| Token | Waarde | Gebruik |
|---|---|---|
| `--weight-normal` | 400 | Body tekst |
| `--weight-medium` | 500 | Labels, navigatie |
| `--weight-semibold` | 600 | Subtitels, buttons |
| `--weight-bold` | 700 | Koppen |
| `--weight-black` | 900 | Grote stat-cijfers |

---

## 7. Spacing

8px grid systeem. Alle spacing is een veelvoud van 8px (0.5rem).

```
--space-2  =  8px  (basisunit)
--space-4  = 16px  (meest gebruikte padding)
--space-8  = 32px  (sectie-gap)
--space-16 = 64px  (grote afstanden)
```

### Semantische spacing

| Token | Default | Gebruik |
|---|---|---|
| `--spacing-page-x` | 16px | Horizontale pagina-padding (mobiel) |
| `--spacing-page-y` | 24px | Verticale pagina-padding |
| `--spacing-card-x` | 16px | Padding binnen kaarten |
| `--spacing-card-y` | 16px | Padding binnen kaarten |
| `--spacing-section-gap` | 32px | Afstand tussen secties |
| `--spacing-item-gap` | 12px | Afstand tussen items in een lijst |
| `--spacing-inline-gap` | 8px | Afstand tussen inline elementen |

---

## 8. Border-radius

| Token | Waarde | Gebruik |
|---|---|---|
| `--radius-card` | 16px | Kaarten, panels |
| `--radius-button` | 12px | Buttons |
| `--radius-input` | 8px | Input velden |
| `--radius-badge` | 9999px | Badges (pill shape) |
| `--radius-avatar` | 9999px | Avatars (cirkel) |

---

## 9. Schaduwen

Zes niveaus, van nauwelijks zichtbaar tot zware modale schaduw:

| Token | Gebruik |
|---|---|
| `--shadow-card` | Standaard kaart |
| `--shadow-card-hover` | Kaart bij hover |
| `--shadow-elevated` | Zwevende elementen, dropdowns |
| `--shadow-modal` | Modals, dialogen |
| `--shadow-button` | Subtiele knop-diepte |

### Gekleurde schaduwen

Per KNKV-kleur is er een gekleurde schaduw voor leeftijdskaarten:

```css
.speler-kaart:hover {
  box-shadow: var(--shadow-blauw);
}
```

Beschikbaar: `--shadow-paars`, `--shadow-blauw`, `--shadow-groen`, `--shadow-geel`, `--shadow-oranje`, `--shadow-rood`

---

## 10. Touch targets & sizing

WCAG-compliant touch targets voor mobiel gebruik:

| Token | Grootte | Gebruik |
|---|---|---|
| `--touch-target-min` | 44px | Minimale touch target (WCAG) |
| `--touch-target-lg` | 48px | Comfortabel tappen |
| `--touch-target-xl` | 56px | Primaire acties |

### Avatars

| Token | Grootte | Gebruik |
|---|---|---|
| `--avatar-xs` | 24px | Inline in tekst |
| `--avatar-sm` | 32px | Lijstweergave |
| `--avatar-md` | 40px | Standaard |
| `--avatar-lg` | 48px | Kaartweergave |
| `--avatar-xl` | 64px | Profiel |
| `--avatar-2xl` | 80px | Speler profielkaart |

---

## 11. Animaties & transitions

### Durations

| Token | Duur | Gebruik |
|---|---|---|
| `--duration-fast` | 100ms | Kleurveranderingen |
| `--duration-normal` | 200ms | Standaard transitions |
| `--duration-slow` | 300ms | Complexe animaties |
| `--duration-slower` | 500ms | Page transitions |

### Easings

| Token | Curve | Gebruik |
|---|---|---|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standaard |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Speelse interacties |
| `--ease-spring` | `cubic-bezier(0.22, 1.00, 0.36, 1.00)` | Drag & drop landing |

### Voorgebouwde transitions

```css
.element {
  transition: var(--transition-all);
}
```

`prefers-reduced-motion` wordt gerespecteerd: shimmer-animaties stoppen automatisch.

---

## 12. Dark mode

Alle tokens hebben een dark mode variant via `@media (prefers-color-scheme: dark)`. De aanpassingen:

| Categorie | Light | Dark |
|---|---|---|
| Oppervlaktes | Wit/lichtgrijs | Donkergrijs (#0F1115 - #22262E) |
| Tekst | Donker op licht | Licht op donker |
| Oranje (merk) | `#FF6B00` | `#FF8533` (lichter voor contrast) |
| Schaduwen | Subtiel | Sterker (hogere opacity) |
| Leeftijd-bg | Lichte pasteltint | Transparante kleuroverlays (10%) |
| Tier-bg | Lichte warme tinten | Donkere warme tinten |
| Focus ring | 15% opacity | 20% opacity (beter zichtbaar) |

---

## 13. Gebruik in Tailwind CSS 4

### Stap 1: Importeer tokens

```css
/* app/globals.css */
@import "tailwindcss";
@import "../design/tokens.css";
```

### Stap 2: Map tokens naar Tailwind theme

```css
@theme inline {
  /* Club-kleuren */
  --color-ow-oranje: var(--ow-oranje-500);
  --color-ow-wit: var(--ow-wit-50);

  /* KNKV-kleuren */
  --color-knkv-paars: var(--knkv-paars-500);
  --color-knkv-blauw: var(--knkv-blauw-500);
  --color-knkv-groen: var(--knkv-groen-500);
  --color-knkv-geel: var(--knkv-geel-500);
  --color-knkv-oranje: var(--knkv-oranje-500);
  --color-knkv-rood: var(--knkv-rood-500);

  /* Semantisch */
  --color-success: var(--color-success-500);
  --color-warning: var(--color-warning-500);
  --color-error: var(--color-error-500);
  --color-info: var(--color-info-500);

  /* Spacing */
  --spacing-page: var(--spacing-page-x);
  --spacing-card: var(--spacing-card-x);

  /* Radius */
  --radius-card: var(--radius-card);
  --radius-button: var(--radius-button);

  /* Shadows */
  --shadow-card: var(--shadow-card);
  --shadow-elevated: var(--shadow-elevated);
}
```

### Stap 3: Gebruik in componenten

```tsx
// Tailwind classes
<div className="bg-knkv-blauw text-white rounded-card shadow-card">
  Speler kaart
</div>

// CSS variables direct
<div style={{ background: `var(--age-8-gradient)` }}>
  Leeftijd 8
</div>

// Convenience classes
<div className="age-gradient-8 tier-goud tier-goud-shimmer">
  Gouden speler, leeftijd 8
</div>
```

---

## Bestandsstructuur

```
apps/scouting/design/
  tokens.css    -- Alle CSS custom properties (bron)
  README.md     -- Deze documentatie
```

Dit token-bestand is het fundament van de OW Scout app. Alle componenten bouwen hierop voort.
