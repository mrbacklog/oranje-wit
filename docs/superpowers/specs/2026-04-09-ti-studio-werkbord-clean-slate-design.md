# TI Studio Werkbord — Clean Slate Design

**Datum**: 2026-04-09  
**Status**: Goedgekeurd  
**Prototype**: `docs/design/werkindeling-v4.html` (referentie, bindend)

---

## Probleemstelling

De component-map `components/teamindeling/scenario/` is door meerdere parallelle worktree-agents tegelijkertijd bewerkt voor zowel de mobile teamindeling als de desktop studio. Stijlen en componenten lopen door elkaar. De oplossing is een volledig nieuwe implementatie van het studio-werkbord in een geïsoleerde map, zonder afhankelijkheid van de bestaande scenario-componenten.

---

## Scope

**Alleen** de werkbord-pagina (`/ti-studio/indeling`) wordt herbouwd.

- Nieuwe componentenmap: `apps/web/src/components/ti-studio/werkbord/`
- Bestaande data-laag (server actions, API routes) blijft onveranderd
- Mobile `(teamindeling)` routes worden niet aangeraakt
- Overige studio-pagina's (kaders, personen, etc.) worden niet aangeraakt

---

## Architectuur

### Shell layout

CSS Grid: ribbon (48px breed, volle hoogte) × toolbar (52px hoog) × body.

```
┌──────┬───────────────────────────────────────────────┐
│      │  TOOLBAR (52px)                               │
│  R   ├──────────┬──────────────────────┬─────────────┤
│  I   │  POOL    │  CANVAS              │  VALIDATIE  │
│  B   │  DRAWER  │  (team kaarten)      │  DRAWER     │
│  B   │  (224px) │                      │  (280px)    │
│  O   │          │                      │             │
│  N   │          │  [Daisy FAB/Panel]   │             │
└──────┴──────────┴──────────────────────┴─────────────┘
```

### Componentenstructuur

```
apps/web/src/components/ti-studio/werkbord/
├── TiStudioShell.tsx          — root shell (grid layout + state management)
├── Ribbon.tsx                 — linker icoonbalk (48px)
├── Toolbar.tsx                — bovenste toolbar (52px)
├── SpelersPoolDrawer.tsx      — linker drawer, togglebaar (224px)
├── WerkbordCanvas.tsx         — infinite canvas, zoom, pan, minimap
├── TeamKaart.tsx              — teamkaart (3 formaten: viertal/achtal/selectie)
├── TeamKaartSpelerRij.tsx     — spelerrij binnen de kaart
├── ValidatieDrawer.tsx        — rechter validatiedrawer, togglebaar (280px)
├── DaisyPanel.tsx             — floating AI-chat panel (FAB + panel)
├── hooks/
│   ├── useZoom.ts             — zoom state, slider, breakpoints, inverse scaling
│   └── useDrag.ts             — drag-and-drop state (speler ↔ team)
└── tokens.css                 — OW design tokens (1-op-1 uit prototype)
```

### Pagina

```
apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/page.tsx
```

Blijft een server component. Haalt data op via bestaande actions en rendert `TiStudioShell`.

---

## Componentdetails

### TiStudioShell

- Root client component
- Beheert: welke drawers open zijn, actieve ribbon-tab, zoom-level, drag state
- Rendert alle subcomponenten

### Ribbon

- 48px breed, volle hoogte
- Iconen: Spelerspool, Validatie (met badge), Werkbord, What-If, Versies
- Footer: Instellingen, gebruikersavatar
- Actieve staat: accent-kleur + linker balk indicator
- Tooltip via CSS `::after` (geen JS)

### Toolbar

- 52px hoog
- Inhoud: terug-knop, scenario-naam/versie, status-badge (concept/definitief), separator, versie-selector, counter-pill (spelers geplaatst), progress-ring, zoom-level-badge, knoppen (opslaan, maak definitief)
- Blauwe gradient-lijn onderaan (decoratief)

### SpelersPoolDrawer

- 224px breed, togglebaar (width 0 bij gesloten)
- Zoekveld, categorie-chips (filter), spelerslijst
- Elke rij: avatar (V/M kleur), naam, leeftijd, badges (afmelding, pin, rating, nieuw)
- Drag-handle zichtbaar bij hover
- Gesorteerd: niet-geplaatst bovenaan, geplaatst onderaan (grijs)

### WerkbordCanvas

- Vrij positioneerbare kaarten (absolute positioning binnen canvas van 1400×900px)
- Dot-patroon achtergrond via CSS pseudo-element
- Zoom: slider (40%–150%), knoppen +/−, "Fit" knop
- Drie zoom-breakpoints: compact (<64%), normaal (64–100%), detail (≥100%)
- Inverse scaling op tekst in compact mode (leesbaar ondanks lage zoom)
- Minimap rechtsonder (140×96px), viewport indicator
- Pan via muis-drag op achtergrond

### TeamKaart

Drie vaste formaten (eenheid U=70px):

| Formaat   | Breedte | Hoogte | Kolommen              |
|-----------|---------|--------|-----------------------|
| viertal   | 140px   | 210px  | 1 kolom, V/M gestapeld |
| achtal    | 280px   | 210px  | 2 kolommen (V links, M rechts) |
| selectie  | 560px   | 210px  | 4 kolommen (2V + 2M)  |

Kaartstructuur: header (36px) + body (flex:1 ≈146px) + footer (28px).

- Header: kleurband (4px, KNKV categorie), teamnaam, categorie-badge, V/M tellers, validatie-dot, bewerk-knop
- Body: kolomlabels + spelerrijen (flex:1, eerlijk verdeeld)
- Footer: gem. leeftijd, USS score, waarschuwingsteller, notitie-knop
- Hover: accent border + glow shadow
- Draggable: verplaatsbaar op canvas

**Zoom-gedrag per level**:

| Zoom level | Toont | Verbergt |
|------------|-------|----------|
| compact | teamnaam, V/M tellers, validatie-dot | spelerslijst, footer |
| normaal | teamnaam, spelersnamen | leeftijd, rating, status-iconen |
| detail | alles | — |

### TeamKaartSpelerRij

- Avatar (V=roze, M=blauw), naam, leeftijd, rating, status-iconen (pin, afmelding, twijfelt, nieuw)
- Drop zone zichtbaar tijdens drag
- `flex:1` zodat rijen beschikbare hoogte eerlijk verdelen

### ValidatieDrawer

- 280px breed, togglebaar
- Tabs per team (scrollbaar)
- Per team: statistieken grid (2 kolommen), validatieitems (ok/warn/err)
- Elk item: icoon, regel, beschrijving, optioneel "Fix"-knop

### DaisyPanel

- FAB (48px, oranje) rechtsonder op canvas
- Panel (320×420px): spring-animatie bij openen, vanuit rechtsonder
- Header: Daisy avatar, naam, status-dot, sluit-knop
- Berichtenlijst + input

### Hooks

**useZoom**:
- State: `zoomValue` (0.4–1.5), `zoomLevel` ('compact'|'normaal'|'detail')
- `zoomLevel` wordt gezet op canvas via `data-zoom-level` attribuut
- Inverse scaling berekening voor compact mode
- Breakpoints: <0.64 → compact, 0.64–1.0 → normaal, ≥1.0 → detail

**useDrag**:
- Beheer van welke speler gesleept wordt, van/naar welk team/pool
- Drop-zone activatie tijdens drag

---

## Design tokens

Tokens worden gedefinieerd in `tokens.css` en geïmporteerd in de component of in `globals.css`. Ze zijn 1-op-1 overgenomen uit het prototype:

- `--bg-0` t/m `--bg-3`: achtergrondniveaus
- `--accent`, `--accent-h`, `--accent-dim`, `--accent-glow`: oranje accent
- `--text-1` t/m `--text-3`: tekstniveaus
- `--border-0`, `--border-1`: randkleuren
- `--ok`, `--warn`, `--err`, `--info`: statuskleuren
- `--cat-blauw` t/m `--cat-senior`: KNKV categoriekleuren
- `--ribbon`, `--toolbar`, `--pool-w`, `--val-w`, `--daisy-w`: maatconstanten
- `--card-radius`, `--sh-card`, `--sh-raise`: kaartopmaak

---

## Styling

- Tailwind **alleen** voor layout-utilities (flex, grid, overflow, position)
- Kleuren en maten **altijd** via CSS tokens (`var(--...)`)
- Geen hardcoded hex-waarden in componenten
- Geen inline styles

---

## Data

Data-fetching blijft in `page.tsx` via bestaande server actions:
- `getOfMaakWerkindelingVoorSeizoen` — ophalen/aanmaken werkindeling
- `getWerkindelingVoorEditor` — volledig scenario met teams en spelers
- `getAlleSpelers` — alle spelers voor de pool
- `getPosities` — teamposities per versie

Props-structuur van `TiStudioShell`:
```ts
interface TiStudioShellProps {
  scenario: WerkindelingVolledig;
  alleSpelers: SpelerMetData[];
  initialPosities: PositieMap | null;
  gebruikerEmail: string;
}
```
(Types worden gehergebruikt uit de bestaande type-definities)

---

## Referentiebestanden

Het prototype is gesplitst in afzonderlijke secties onder `docs/design/werkindeling-v4/`:
- `tokens.css` — design tokens
- `ribbon.html` — ribbon HTML + CSS
- `toolbar.html` — toolbar HTML + CSS
- `pool-drawer.html` — spelerspool drawer
- `canvas.html` — canvas + zoom controls + minimap
- `team-kaart.html` — teamkaarten (alle 3 formaten + zoom levels)
- `validatie-drawer.html` — validatiedrawer
- `daisy-panel.html` — Daisy chat panel
- `script.js` — JavaScript (interactie-referentie)

---

## Wat NIET in scope is

- Worktree-cleanup (aparte taak)
- Refactor van bestaande `scenario/` componenten
- Mobile `(teamindeling)` routes
- Overige studio-pagina's

---

## Succescriteria

1. `/ti-studio/indeling` ziet er identiek uit aan het prototype
2. Geen enkel component uit `components/teamindeling/scenario/` wordt gebruikt op die pagina
3. Geen hardcoded kleuren — alles via tokens
4. Elke component heeft één duidelijke verantwoordelijkheid
5. Drag-and-drop werkt: speler van pool naar team, speler tussen teams
6. Zoom (compact/normaal/detail) werkt zoals in het prototype
