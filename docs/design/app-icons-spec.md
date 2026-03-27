# App Icons — Design Specificatie

## Overzicht

5 iconische SVG app-iconen voor het c.k.v. Oranje Wit ecosysteem. Elk icoon is uniek herkenbaar, consistent in visueel gewicht, en schaalt van 24px tot 96px.

## Stijlrichtlijnen

| Eigenschap | Waarde |
|---|---|
| Techniek | Stroke-based SVG, niet filled |
| Stroke-width | 1.5 (sm), 2 (md), 2.5 (lg) |
| Stroke caps | Round (linecap + linejoin) |
| Kleurmodus | Monochroom (currentColor) of accent |
| Detail progressie | Meer detail bij grotere maten |

## De 5 iconen

### Monitor — Pulse

**Concept**: ECG-hartslaglijn door een monitor-scherm. De hartslaglijn symboliseert "live data", "vinger aan de pols". Het scherm refereert aan dashboards.

**Visuele elementen**:
- Afgerond scherm-frame (rect met border-radius)
- Stand/voet (verticale lijn + horizontale basis)
- ECG-lijn met 2 pieken (zig-zag patroon)
- *lg*: subtiele achtergrond-gridlijnen, glow-dot op piek

**Accent**: `#22c55e` (groen) — gezond, actief, live

---

### Team-Indeling — Diamant-formatie

**Concept**: 4 knooppunten in een ruitformatie (diamant) met verbindingslijnen. Refereert aan korfbalformatie (2 aanvallers, 2 verdedigers), teamverband en strategische plaatsing.

**Visuele elementen**:
- 4 cirkels in diamant-layout (top, links, rechts, onder)
- Semi-transparante verbindingslijnen (alle 5 edges van de diamant)
- *lg*: subtiel speelveld (grote cirkel), gevulde inner dots

**Accent**: `#3b82f6` (blauw) — strategie, vertrouwen, structuur

---

### Evaluatie — Ster op klembord

**Concept**: Klembord met clipboard-clip bovenaan en een prominente vijfpuntige ster als centraal element. Combineert "gestructureerde beoordeling" (klembord) met "waardering/kwaliteit" (ster).

**Visuele elementen**:
- Klembord-body (afgeronde rechthoek met open bovenzijde)
- Clipboard-clip (kleine rect bovenaan)
- Vijfpuntige ster centraal op het klembord
- *lg*: subtiele tekstlijnen onderaan, glow-center in ster

**Accent**: `#eab308` (geel/goud) — waardering, kwaliteit, groei

---

### Scouting — Vergrootglas met crosshair

**Concept**: Vergrootglas (ontdekken) met een crosshair/vizier binnenin (scherp kijken, talent spotten). Het crosshair onderscheidt dit icoon van een generiek zoek-icoon.

**Visuele elementen**:
- Cirkel (vergrootglas-lens)
- Handvat (diagonale lijn naar rechtsonder)
- Crosshair (verticale + horizontale lijn door centrum, lage opacity)
- Center-dot (bullseye)
- *lg*: binnenste ring (gestippeld), extra detail op handvat

**Accent**: `#ff6b00` (OW oranje) — ontdekking, energie, focus

---

### Beheer — Tandwiel

**Concept**: Precisie-tandwiel met concentrische cirkels in het centrum. Geometrisch strak, refereert aan "configuratie", "onder de motorkap", "machinerie van de TC".

**Visuele elementen**:
- 8-tands tandwiel (smooth path met afgeronde tanden)
- Centrale cirkel (as/kern)
- *lg*: binnenste detail-ring, center-dot

**Accent**: `#9ca3af` (grijs) — neutraal, professioneel, technisch

## Maten

| Maat | ViewBox | Default class | Stroke | Gebruik |
|---|---|---|---|---|
| sm | 0 0 24 24 | `h-6 w-6` | 1.5 | Sidebar, app-switcher items |
| md | 0 0 48 48 | `h-12 w-12` | 2 | App-switcher overlay, cards |
| lg | 0 0 96 96 | `h-24 w-24` | 2.5 | Portaal app-launcher |

## Detail progressie

Bij grotere maten worden extra visuele elementen toegevoegd:

- **sm**: Minimaal, alleen de kern-vorm. Moet herkenbaar zijn op 24px.
- **md**: Standaard detailniveau. Alle primaire elementen zichtbaar.
- **lg**: Extra detail: achtergrond-elementen (gridlijnen, veldcirkel), inner details (dots, ringen), subtiele opacity-lagen.

## API

```tsx
interface AppIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  accent?: boolean;
}
```

**`accent`**: Wanneer `true`, gebruikt het icoon de app-specifieke accentkleur. Wanneer `false` of undefined, gebruikt het `currentColor` (erft de tekstkleur van de parent).

**`APP_ICONS`**: Record voor programmatisch gebruik: `APP_ICONS["monitor"]`
**`APP_ACCENTS`**: Record met kleurcodes: `APP_ACCENTS["scouting"]` = `"#ff6b00"`
**`APP_META`**: Volledige metadata per app (naam, beschrijving, URL, accent)
**`APP_IDS`**: Array van alle app-IDs in volgorde

## Bestandslocaties

| Bestand | Wat |
|---|---|
| `packages/ui/src/navigation/app-icons.tsx` | React componenten (source of truth) |
| `docs/design/app-icons-preview.html` | Standalone visuele preview |
| `docs/design/app-icons-spec.md` | Dit document |
