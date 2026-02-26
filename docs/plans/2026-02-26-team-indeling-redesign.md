# Team-Indeling Tool — Redesign

**Datum**: 2026-02-26
**Status**: Goedgekeurd ontwerp, klaar voor implementatieplan

---

## Samenvatting

State-of-the-art drag-and-drop teamindelingstool voor de Technische Commissie van c.k.v. Oranje Wit. De tool ondersteunt het jaarlijkse proces van het indelen van alle teams voor het volgende seizoen: van strategische kaders tot concrete teamindelingen.

## Gebruikers

- **3 TC-leden** — kerngebruikers, volledige edit-rechten
- **Coördinatoren, adviseurs, trainers** — read-only/inkijk
- Alleen TC werkt in de tool; de rest krijgt het resultaat te zien

## Stack

| Component | Keuze | Reden |
|---|---|---|
| Framework | Next.js 16 + React 19 | Bestaande monorepo, SSR + Server Actions |
| Styling | Tailwind CSS 4 | Bestaande keuze, rapid prototyping |
| Drag-and-drop | dnd-kit | Beste React DnD-library: multi-container, touch, keyboard |
| Database | PostgreSQL (Railway) via Prisma | Gedeeld met Verenigingsmonitor |
| AI | Claude API (Anthropic SDK) | Startvoorstel, advies, what-if analyse |
| Auth | NextAuth.js | TC-leden als editors, rest read-only |
| Hosting | Railway | Bestaande infrastructuur |

## Hergebruik bestaande code

| Bestand | Status | Reden |
|---|---|---|
| `src/lib/validatie/regels.ts` | **BEHOUDEN** | Complete KNKV + OW validatie-engine, 329 regels |
| `src/lib/validatie/impact.ts` | **BEHOUDEN** | Best/verwacht/worst-case analyse |
| `src/lib/import.ts` | **BEHOUDEN** | Solide Sportlink import met upsert |
| `src/lib/db/prisma.ts` | **BEHOUDEN** | Gedeelde DB-koppeling |
| `src/app/api/import/route.ts` | **BEHOUDEN** | Werkende import API |
| `src/app/page.tsx` | **WEGGOOIEN** | Statische wireframe, geen data |
| `src/app/blauwdruk/page.tsx` | **WEGGOOIEN** | Prototype zonder interactiviteit |
| Lege directories | **WEGGOOIEN** | Placeholder, geen code |
| `next.config.ts` | **OPNIEUW** | Lege config, moet monorepo transpile bevatten |

---

## Procesmodel

```
① BLAUWDRUK                  ② SCENARIO'S                    ③ DEFINITIEF
────────────────             ────────────────                 ────────────────
Strategische kaders          Operationeel puzzelen            Besluit
────────────────             ────────────────                 ────────────────
• Speerpunten seizoen        • Keuzes op keuzes        • Gekozen scenario
• Spelerstatus bijwerken     • Tool berekent teamstructuur    • Besluitenlog
  (beschikbaar/twijfelt/     • Automatisch teams aangemaakt   • Export/communicatie
   stopt/nieuw)              • Claude genereert startvoorstel
• KNKV-regels als basis      • Drag-drop puzzelen
• Keuzes vastleggen   • Realtime validatie
  ("1 of 2 U15-teams?")     • Meerdere scenario's
                             • What-if analyse
```

### Keuzes

Het cruciale concept: in de blauwdruk legt de TC **keuzes** vast — strategische keuzes waarvan de impact nog niet duidelijk is. Elke twijfel wordt een keuzeknop die per scenario verschilt.

**Voorbeelden:**
- "1 of 2 U15-teams?" → Scenario A (1 team) vs Scenario B (2 teams)
- "Senioren 3: wedstrijd of breedte?" → Impact op spelerverdeling
- "Rood: 2 of 3 teams?" → Gevolgen voor teamgrootte

Per scenario kies je een waarde voor elk keuze. De tool berekent dan automatisch de teamstructuur en vult de teams.

---

## UI: Het Drieluik

Het hoofdscherm (scenario-editor) bestaat uit drie panelen:

```
┌─────────────┬──────────────────────────────────┬─────────────────┐
│  NAVIGATOR  │          WERKGEBIED              │   SPELERSPOOL   │
│             │                                   │                 │
│ Jeugd B:    │  ┌─────────┐  ┌─────────┐       │ 🔍 Zoek...     │
│ □ Blauw (2) │  │ Rood-1  │  │ Rood-2  │       │                 │
│ □ Groen (3) │  │ ♀ Lisa  │  │ ♂ Tim   │       │ Filters:        │
│ ■ Rood (2)  │  │ ♂ Daan  │  │ ♀ Eva   │       │ ○ Zonder team   │
│ ■ Oranje(2) │  │ ♀ Sara  │  │ ♂ Luc   │       │ ○ Passend       │
│ □ Geel (2)  │  │ ...     │  │ ...     │       │ ○ Al ingedeeld  │
│             │  │ gem:16.2 │  │ gem:15.8│       │ ○ Alle          │
│ Jeugd A:    │  │ 5♂ 4♀   │  │ 4♂ 5♀  │       │                 │
│ □ U15  (2)  │  │ ●groen  │  │ ◐oranje │       │ ┌─────────────┐ │
│ □ U17  (2)  │  └─────────┘  └─────────┘       │ │♂ Bas (12)   │ │
│ □ U19  (2)  │                                   │ │  Rood-1 →   │ │
│             │  + Nieuw team                     │ │  ● beschikb.│ │
│ Senioren:   │                                   │ └─────────────┘ │
│ □ Sen A     │  Koppel 2 teams als selectie ↔   │ ♀ Lisa (14)    │
│ □ Sen B     │                                   │ ♂ Daan (13)    │
│ □ Recreant  │                                   │ ...             │
│ □ Midweek   │                                   │                 │
│ □ Kangaroes │                                   │                 │
└─────────────┴──────────────────────────────────┴─────────────────┘
```

### Links — Navigator
- Dynamische groepering op basis van teamdata (kleur, categorie)
- Checkboxes: selecteer welke teams zichtbaar zijn in het werkgebied
- Aantallen per groep
- Categorieën: Jeugd B, Jeugd A, Senioren (A/B flexibel), Overig (Recreanten, Midweek, Kangaroes)

### Midden — Werkgebied
- Geselecteerde teams als kaarten in responsive grid
- Per teamkaart:
  - Teamnaam (Rood-1, U17-2, etc.)
  - Staf (trainer/coach)
  - Spelerslijst (drag-and-drop)
  - Gemiddelde leeftijd (berekend op peildatum)
  - Genderverdeling
  - J-nummer indicatie (berekend, niet vastgezet)
  - Validatie-stoplicht (groen/oranje/rood)
- **Hele teamkaart = drop-zone** (geen aparte vakjes)
- Verwijderen = speler terugsleepen naar pool of naar ander team
- **Nieuw team aanmaken**: + knop met formulier (naam, kleur, format, A/B)
- **Selecties koppelen**: 2 teams in werkgebied selecteren → "Koppel als selectie" → visueel één blok, staf op selectieniveau, spelers per team
- A/B classificatie is **flexibel** — kan per team worden aangepast

### Rechts — Spelerspool
- Zoekbalk (naam)
- Filters:
  - Zonder team (niet ingedeeld)
  - Passend bij geselecteerde teams (leeftijd/geslacht match)
  - Al ingedeeld (in een team)
  - Alle leden
- Compacte spelerskaart:
  - Naam
  - Leeftijd (berekend op peildatum)
  - Geslacht-icoon
  - Vorig team
  - Status-bolletje (groen=beschikbaar, oranje=twijfelt, rood=stopt, blauw=nieuw)
- Klik op speler → **detail-dialoog**:
  - Evaluaties
  - Spelerspad (historiek)
  - Notities
  - (Toekomstig: foto)

---

## Teamnaamgeving

- **B-categorie**: Kleur + volgnummer → Rood-1, Rood-2, Oranje-1, Groen-3
- **A-categorie**: Leeftijdscategorie + volgnummer → U15-1, U15-2, U17-1
- **Senioren**: Senioren + nummer, met A/B differentiatie → Senioren 1 (A), Senioren 5 (B)
- **Overig**: Recreanten, Midweek, Kangaroes
- **J-nummers**: worden NIET toegekend, alleen als indicatie getoond (berekend op gemiddelde leeftijd)

---

## Validatie

### Realtime (bij elke drag-actie)
- **Rode rand** op team bij KNKV-overtreding (hard): leeftijdsspreiding te groot, teamgrootte buiten grenzen
- **Oranje rand** bij OW-voorkeur overtreding (soft): genderverdeling scheef, teamgrootte buiten ideaal
- **Stoplicht-badge** per team: groen/oranje/rood
- **J-nummer indicatie** per team: berekend op basis van gemiddelde leeftijd
- Hover op melding → korte uitleg

### On-demand (validatie-knop)
- Volledig rapport over alle teams
- Dubbele spelers detectie (over teams heen)
- Impact-analyse: best/verwacht/worst-case per team
- Overzicht van alle meldingen gesorteerd op ernst

### Validatie-engine
Bestaande `regels.ts` en `impact.ts` worden hergebruikt. Deze draaien client-side voor instant feedback.

---

## AI Integratie (Claude)

### 1. Startvoorstel bij scenario
Op basis van blauwdruk (kaders + keuzekeuzes) + beschikbare leden + KNKV-regels:
- Berekent optimale teamstructuur (hoeveel teams, welke kleuren)
- Vult alle teams met spelers
- Respecteert spelerstatus, genderverdeling, leeftijdsspreiding
- TC past aan via drag-drop

### 2. Advies bij actie
Bij verplaatsing van een speler:
- "Dit team wordt nu te jong voor Oranje"
- "Overweeg speler X als alternatief — vergelijkbaar profiel, beter passend"
- Optioneel: kan aan/uit gezet worden

### 3. What-if analyse
TC vraagt: "Wat als speler X stopt?"
- Claude berekent impact op alle teams
- Doet suggesties voor herverdeling
- Toont welke teams onder/boven grens komen

### 4. Blauwdruk-ondersteuning
Bij het invullen van de blauwdruk:
- Berekening van mogelijke teamstructuren op basis van ledenaantallen
- "Met 45 jeugdleden (7-12 jaar) en de keuze voor 2 U15-teams krijg je: 2× Blauw, 3× Groen, 2× Geel"
- Inclusief senioren, recreanten, midweek

---

## Scenario's vergelijken

- **Side-by-side dashboard**: twee scenario's naast elkaar
- Per team de verschillen highlighted
- Statistieken: gemiddelde leeftijd, genderverdeling, teamgrootte
- **Secundaire feature** — focus ligt op het puzzelen zelf

---

## Data & Opslag

- **Database**: bestaande PostgreSQL op Railway via Prisma
- **Scenario's**: direct opgeslagen in DB (auto-save bij wijziging)
- **Blauwdruk**: per seizoen, inclusief keuzes
- **Import**: Sportlink data via bestaande import-pipeline

---

## Bouwproces

**Hybride aanpak**: goed plan → stap voor stap bouwen → agents inzetten waar het zinvol is (parallel features).

### Bouwvolgorde (voorgesteld)
1. **Fundament**: layout, routing, auth, DB-koppeling
2. **Blauwdruk**: kaders, spelerstatus, keuzes
3. **Scenario-editor**: drieluik met drag-drop (de kern)
4. **Validatie**: realtime + on-demand
5. **AI**: startvoorstel, advies, what-if
6. **Vergelijken**: side-by-side dashboard
7. **Definitief**: besluitenlog, export

---

## Buiten scope (bewust)

- Foto's bij spelers (later, als bron beschikbaar is)
- Communicatie-module (brieven/mails genereren)
- Mobiele app (responsive web is voldoende)
- Multi-seizoen vergelijking
