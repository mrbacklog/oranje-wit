# Blauwdruk 2.0 — UX Implementatieplan

**Auteur**: UX-designer
**Datum**: 2026-03-27
**Status**: Voorstel ter goedkeuring

---

## 1. Informatie-architectuur

### Het probleem met 8+ tabs

De huidige blauwdruk heeft 8 tabs op gelijk niveau: Categorieen, Gezien, Besluiten, Uitgangspositie, Leden, Toelichting, Werkbord, Pins. Met de toevoeging van Staf en Voortgang wordt dit 10+ tabs. Dat is:

- Onnavigeerbaar op desktop (scrollen in de tab-balk)
- Geen overzicht van het totaalplaatje
- Geen hierarchie: een TC-lid weet niet waar te beginnen

### De oplossing: Dashboard + Secties

Vervang de vlakke tab-structuur door een **twee-laags architectuur**:

```
/blauwdruk
|
+-- VOORTGANGSDASHBOARD (altijd zichtbaar bovenaan)
|   Vier KPI-kaarten + overall voortgangsbalk
|
+-- SECTIE-NAVIGATIE (horizontale tabs, max 6)
    |
    +-- Kaders         (was: Categorieen + Besluiten, samengevoegd)
    +-- Spelers        (was: Gezien, hernoemd)
    +-- Staf           (nieuw)
    +-- Teams          (was: Categorieen + Pins + Uitgangspositie, samengevoegd)
    +-- Scenario's     (link naar /scenarios, maar met inline validatie-samenvatting)
    +-- Werkbord       (was: Werkbord + Toelichting, samengevoegd)
```

### Waarom deze hergroepering?

| Oud | Nieuw | Reden |
|---|---|---|
| Categorieen | Teams | Categorie-instellingen horen bij teams, niet los |
| Besluiten | Kaders | Besluiten = antwoorden op kadervragen |
| Gezien | Spelers | "Spelers" is duidelijker dan "Gezien" |
| Uitgangspositie | Teams | Referentieteams zijn context voor de teamsectie |
| Leden | (verwijderd als tab) | Ledendashboard wordt een collapsible panel onder Spelers |
| Toelichting | Werkbord | Toelichting is notitie-achtig, past bij het werkbord |
| Pins | Teams | Pins zijn bevestigde feiten over teams en spelers |

### Visuele structuur van de pagina

```
+========================================================+
|  BLAUWDRUK — Seizoen 2026-2027                         |
+========================================================+
|                                                         |
|  +-----------+ +-----------+ +-----------+ +----------+ |
|  | KADERS    | | SPELERS   | | STAF      | | TOTAAL   | |
|  | 8/15 def  | | 142/180   | | 18/22     | | 62%      | |
|  | [=====  ] | | [======= ]| | [====   ] | | [=====  ]| |
|  +-----------+ +-----------+ +-----------+ +----------+ |
|                                                         |
|  [Kaders] [Spelers] [Staf] [Teams] [Scenario's] [Werk] |
|  ------                                                 |
|                                                         |
|  +----------------------------------------------------+ |
|  |                                                    | |
|  |  (Actieve sectie-inhoud)                           | |
|  |                                                    | |
|  +----------------------------------------------------+ |
+=========================================================+
```

### Component: `BlauwdrukDashboard`

Het voortgangsdashboard bovenaan is het verbindende element. Het toont vier KPI-kaarten die elk klikbaar zijn (navigeert naar de bijbehorende tab):

| KPI | Label | Waarde | Bron |
|---|---|---|---|
| Kaders | "X van Y definitief" | `besluitStats.definitief / besluitStats.totaal` | BesluitenOverzicht |
| Spelers | "X van Y gezien" | `gezienVoortgang.gezien / gezienVoortgang.totaal` | GezienOverzicht |
| Staf | "X van Y ingevuld" | `stafVoortgang.bevestigd / stafVoortgang.totaal` | StafOverzicht (nieuw) |
| Totaal | gewogen gemiddelde | berekend | alle drie |

Elke KPI-kaart gebruikt de bestaande `KpiCard` uit `packages/ui/` met een `ProgressBar` eronder.

---

## 2. Per onderdeel: componentenplan

### 2.1 Kaders (was: Besluiten + Categorieen)

**Doel**: Eenmaal beantwoorden van ~40 gestructureerde vragen die de teamindeling parametriseren.

#### Nieuwe componenten

| Component | Locatie | Beschrijving |
|---|---|---|
| `KadersOverzicht` | `blauwdruk/KadersOverzicht.tsx` | Vervangt `BesluitenOverzicht`. Toont vragengroepen met gestructureerde invoer |
| `VraagGroep` | `blauwdruk/kaders/VraagGroep.tsx` | Collapsible groep (Teamaantallen, Selectiestructuur, etc.) met voortgang |
| `KaderVraag` | `blauwdruk/kaders/KaderVraag.tsx` | Individuele vraag met antwoordtype-specifieke invoer |
| `GetalInput` | `blauwdruk/kaders/GetalInput.tsx` | Number stepper voor GETAL-vragen |
| `JaNeeToggle` | `blauwdruk/kaders/JaNeeToggle.tsx` | Wrapper rond `Toggle` uit packages/ui |
| `KeuzeRadio` | `blauwdruk/kaders/KeuzeRadio.tsx` | Radio-group met opties |
| `BezettingsRange` | `blauwdruk/kaders/BezettingsRange.tsx` | Drie-veld invoer (M / V / afwijking) |

#### Hergebruik uit `packages/ui/`

- `Toggle` — voor JA_NEE vragen (al gebouwd, iOS-style met oranje glow)
- `Input` — als basis voor GetalInput (met type="number")
- `Card`, `CardHeader`, `CardBody` — voor VraagGroep containers
- `Badge` — voor besluitstatus (ONDUIDELIJK / VOORLOPIG / DEFINITIEF)
- `ProgressBar` — per vraaggroep voortgang

#### Layout

```
KADERS
+-- Voortgangsbalk: "8 van 15 definitief" [ProgressBar]
|
+-- [Groep 1: Teamaantallen]  (collapsible, 5/5 ingevuld)
|   |
|   +-- Hoeveel A-categorie seniorenteams?  [GetalInput: 5] [DEFINITIEF]
|   +-- Hoeveel B-categorie seniorenteams?  [GetalInput: 3] [VOORLOPIG]
|   +-- Hoeveel U19 teams?                  [GetalInput: 2] [DEFINITIEF]
|   +-- ...
|
+-- [Groep 2: Selectiestructuur]  (collapsible, 3/15 ingevuld)
|   |
|   +-- 2A. Senioren 1e selectie  (verschijnt als A >= 3)
|   |   +-- Is er een 1e selectie?          [JaNeeToggle: Ja] [DEFINITIEF]
|   |   +-- Samenstelling bekendgemaakt?     [KeuzeRadio: Vooraf] [VOORLOPIG]
|   |   +-- Afvallers verwacht?              [JaNeeToggle: Nee] [ONDUIDELIJK]
|   |
|   +-- 2B. Senioren 2e selectie  (verborgen: A < 4)
|   +-- ...
|
+-- [Groep 3: Bezettingsgraad]  (collapsible)
|   |
|   +-- A-cat senioren selectie  [BezettingsRange: 12M / 12V / +/-3] [DEFINITIEF]
|   +-- ...
|
+-- [Groep 4: Doorstroom]  (collapsible, 0/3 ingevuld)
    |
    +-- Vervroegd doorstromen?  [JaNeeToggle: --] [ONDUIDELIJK]
    +-- ...
```

#### Conditionele logica

Conditionele vragen krijgen een `toonAls`-veld dat client-side wordt geevalueerd:

```typescript
type ToonAls = {
  code: string;        // referentie naar andere vraag
  operator: ">=" | "==" | ">" | "!=" | "true";
  waarde: number | boolean;
};
```

Verborgen vragen worden niet gerenderd maar hun container toont een subtiele melding:

```
  2B. Senioren 2e selectie
  ┌──────────────────────────────────────────────┐
  │  Verschijnt als er >= 4 A-seniorenteams zijn │
  │  (momenteel: 3)                              │
  └──────────────────────────────────────────────┘
```

Dit wordt een `ConditioneleHint` component: een subtiel gedimde kaart (`--ow-bg-tertiary` met `opacity: 0.5`) die uitlegt waarom de vragen niet zichtbaar zijn. Wanneer de conditie verandert, animeert de vraaggroep naar binnen met een Framer Motion `AnimatePresence`.

---

### 2.2 Spelers (was: Gezien)

**Doel**: Elke speler beoordelen op beschikbaarheid. Al grotendeels gebouwd.

#### Aanpassingen

| Wat | Beschrijving |
|---|---|
| Hernaam tab | "Gezien" wordt "Spelers" |
| Ledendashboard integratie | Collapsible panel bovenaan met kernstatistieken uit het huidige `LedenDashboard` |
| Batch-acties | "Alle ongeziene als GROEN markeren" knop (al deels in code) |
| Koppeling met kaders | Als TEAMS_U15 = 0, markeer U15-spelers automatisch als signalering |

#### Bestaande componenten (behouden)

- `GezienOverzicht` — hoofdcomponent, werkt goed
- `GezienStatusBadge` / `GezienStatusDot` — dark-first status indicators

#### Nieuwe componenten

| Component | Beschrijving |
|---|---|
| `SpelersHeader` | Samenvattende stats boven de tabel: totaal, per geslacht, per leeftijdsgroep |
| `SpelersFilter` | Uitgebreidere filtering: op team, op leeftijdsgroep, op signalering-type |

---

### 2.3 Staf (nieuw)

**Doel**: Elke teamfunctie (trainer, assistent, manager) invullen via een flow.

#### Nieuwe componenten

| Component | Locatie | Beschrijving |
|---|---|---|
| `StafOverzicht` | `blauwdruk/StafOverzicht.tsx` | Hoofdcomponent met voortgang en teamlijst |
| `StafTeamKaart` | `blauwdruk/staf/StafTeamKaart.tsx` | Kaart per team met posities |
| `StafPositieRij` | `blauwdruk/staf/StafPositieRij.tsx` | Eenmaal per positie: rol + status + persoon |
| `StafFlowIndicator` | `blauwdruk/staf/StafFlowIndicator.tsx` | 5-staps flow visualisatie |
| `StafToewijsDialog` | `blauwdruk/staf/StafToewijsDialog.tsx` | Dialog voor kandidaat selecteren of versneld toewijzen |

#### Hergebruik uit `packages/ui/`

- `Card`, `CardHeader`, `CardBody` — voor StafTeamKaart
- `Badge` — voor flow-status badges
- `ProgressBar` — "18 van 22 posities ingevuld"
- `Select` — voor staf-persoon selectie
- `Toggle` — voor "versneld toewijzen" optie
- `Dialog` — voor toewijzing modal

#### Layout

De staf-sectie gebruikt GEEN kanban-kolommen. De reden: kanban werkt goed bij gelijkwaardige items die door stappen gaan, maar bij staf heb je een hierarchie (team > positie) die belangrijker is. In plaats daarvan: **een gegroepeerde lijst per team met inline flow-indicators**.

```
STAF
+-- Voortgangsbalk: "18 van 22 posities ingevuld" [ProgressBar]
+-- Filter: [Alle teams] [Alleen vacatures] [Zonder hoofdtrainer]
|
+-- [Senioren 1] ────────────────────────────────────
|   | Hoofdtrainer   [====>] BEVESTIGD   Jan de Vries    [Pin-icoon]
|   | Assistent      [==>  ] IN_GESPREK  Karin Smit      [Bewerk]
|   | Manager        [>    ] VACANT      —               [+ Toewijzen]
|
+-- [Senioren 2] ────────────────────────────────────
|   | Hoofdtrainer   [===> ] TOEGEWEZEN  Peter Jansen    [Bewerk]
|   | Assistent      [>    ] VACANT      —               [+ Toewijzen]
|
+-- [U19-1] ────────────────────────────────────────
|   | Hoofdtrainer   [>    ] VACANT      —               [+ Toewijzen]  (!)
|   ...
```

#### Flow-indicator design

De `StafFlowIndicator` is een horizontale 5-punt indicator die visueel toont waar een positie zich bevindt:

```
VACANT          KANDIDAAT       IN_GESPREK      TOEGEWEZEN      BEVESTIGD
  o────────────────o────────────────o────────────────o────────────────o
  (grijs)         (grijs)         (oranje,actief)  (grijs)         (grijs)
```

- Voltooide stappen: oranje gevulde bolletjes met oranje lijn
- Actieve stap: oranje bol met glow-effect
- Toekomstige stappen: grijze lege bolletjes met grijze lijn
- Lijn-animatie: de oranje kleur vloeit van links naar rechts bij stap-overgang

Technisch: Framer Motion `layoutId` voor de glow die mee-animeert bij statuswijziging.

#### "Versneld toewijzen"

Een secundaire knop op VACANT-posities: "Direct toewijzen". Dit opent de `StafToewijsDialog` met:

1. Zoekveld voor stafleden (uit `Staf`-tabel)
2. Toggle "Direct bevestigen" (skipt KANDIDAAT, IN_GESPREK, TOEGEWEZEN)
3. Bij bevestiging: status springt naar BEVESTIGD, er wordt automatisch een Pin aangemaakt

---

### 2.4 Teams (samenvoeging Categorieen + Pins + Uitgangspositie)

**Doel**: Overzicht van alle teams met hun parameters, ambitie, pins en referentiedata.

#### Nieuwe componenten

| Component | Locatie | Beschrijving |
|---|---|---|
| `TeamsOverzicht` | `blauwdruk/TeamsOverzicht.tsx` | Hoofdcomponent: teams gegroepeerd per categorie |
| `TeamBlauwdrukKaart` | `blauwdruk/teams/TeamBlauwdrukKaart.tsx` | Uitgebreide teamkaart met ambitie, bezetting, pins, staf |
| `AmbitieSelector` | `blauwdruk/teams/AmbitieSelector.tsx` | Visuele ambitie-keuze (4 opties met iconen) |
| `TeamPinsLijst` | `blauwdruk/teams/TeamPinsLijst.tsx` | Inline pins die bij dit team horen |
| `ReferentieTeamBadge` | `blauwdruk/teams/ReferentieTeamBadge.tsx` | Verwijzing naar vorig-seizoen team |

#### Hergebruik uit `packages/ui/`

- `Card` — voor TeamBlauwdrukKaart
- `Badge` — voor ambitie-label, categorie-kleur
- `StatCard` — voor bezettingscijfers per team

#### Layout

Teams worden gegroepeerd per doelgroep (Senioren, Junioren, Aspiranten, etc.), met de categorie-kleuren als visuele scheiding.

```
TEAMS
|
+-- SENIOREN ──────────────────────────────────────
|   +--[ Senioren 1 ]──────────────────────────+
|   |  Ambitie: [PROMOTIE v]                    |
|   |  Bezetting: 12M / 12V (ideaal: 12/12 +-3)|
|   |  Staf: Jan de Vries (bevestigd)           |
|   |  Pins: 3 spelers gepind                   |
|   |  Ref: Senioren 1 (2025-2026, niveau 2A)  |
|   +-------------------------------------------+
|
|   +--[ Senioren 2 ]──────────────────────────+
|   |  ...                                      |
|   +-------------------------------------------+
|
+-- U19 (Rood) ────────────────────────────────────
|   +--[ U19-1 ]──────────────────────────────+
|   |  Ambitie: [HANDHAVING v]                  |
|   |  ...                                      |
|   +-------------------------------------------+
```

#### Ambitie-selector design

Vier opties als horizontale segmented control (niet een dropdown):

```
[  PROMOTIE  ] [  HANDHAVING  ] [  ONTWIKKELING  ] [  PLEZIER  ]
     actief        -                  -                 -
```

- Actieve optie: oranje achtergrond met glow
- Inactieve opties: `--ow-bg-tertiary` achtergrond
- Iconen per ambitie: pijl-omhoog, horizontale-lijn, zaailing, hart
- Framer Motion layout-animatie bij wisselen

---

### 2.5 Scenario's (link + validatie-samenvatting)

**Doel**: Bestaande scenario-functionaliteit, verrijkt met validatie uit kaders/spelers/staf.

#### Aanpassingen (geen nieuwe grote componenten)

De Scenario's-tab in de blauwdruk wordt een **gateway** naar `/scenarios`, niet een duplicaat:

| Component | Beschrijving |
|---|---|
| `ScenariosSamenvatting` | Compact overzicht van bestaande scenario's met validatie-highlights |
| `ScenarioValidatieBadge` | Badge per scenario: "3 ongeziene spelers, 1 team zonder trainer" |

#### Validatie-integratie

De bestaande validatie-engine (`src/lib/validatie/regels.ts`) wordt uitgebreid met checks die data uit de blauwdruk gebruiken:

1. **Ongeziene spelers** — spelers in een team die status ONGEZIEN hebben
2. **Teams zonder trainer** — teams waarvan de hoofdtrainer-positie niet BEVESTIGD is
3. **Bezettingsgraad** — team-grootte buiten de range uit kaders
4. **Ambitie-mismatch** — spelers met lage rating in PROMOTIE-team (zacht signaal)

---

### 2.6 Werkbord (was: Werkbord + Toelichting)

**Doel**: Centraal punt voor acties, besluiten en notities.

#### Aanpassingen

| Wat | Beschrijving |
|---|---|
| Toelichting integratie | `ToelichtingEditor` wordt een collapsible sectie bovenaan het werkbord |
| Voortgangssectie | Toon de 14 mijlpalen als een checklist met status |

#### Nieuwe componenten

| Component | Beschrijving |
|---|---|
| `MijlpalenTimeline` | Verticale timeline met 14 processtappen, visuele status per stap |
| `MijlpaalStap` | Individuele stap: naam, status (TODO/ACTIEF/AFGEROND), deadline, eigenaar |

De `MijlpalenTimeline` wordt generiek opgezet (niet blauwdruk-specifiek) zodat het later naar de coordinatielaag kan verhuizen.

---

## 3. Gestructureerde invoer — Ontwerp per antwoordtype

### 3.1 GETAL — `GetalInput`

Een compacte number input met stepper-knoppen, dark-first.

```
Hoeveel A-categorie seniorenteams?
+---+  [ 5 ]  +---+    [DEFINITIEF]
| - |          | + |
+---+          +---+
```

**Specs:**
- Wrapper: `--ow-bg-secondary` achtergrond, `--ow-border` rand, 10px radius
- Waarde: 24px font-weight 700, `--ow-text-primary`
- Stepper-knoppen: 36x36px, `--ow-bg-tertiary`, oranje border bij hover
- Min/max validatie: rood rand bij ongeldige waarde
- Gebruik `Input` uit packages/ui als basis, uitgebreid met stepper-knoppen

### 3.2 JA_NEE — `JaNeeToggle`

Direct de bestaande `Toggle` uit packages/ui wrappen met een label.

```
Is er een 1e senioren selectie?
                               [Toggle: AAN]    [DEFINITIEF]
```

**Specs:**
- Gebruik `Toggle` uit packages/ui (al gebouwd: iOS-style, oranje glow, spring animatie)
- Label links, toggle rechts, status-badge uiterst rechts
- Bij onbeantwoord: toggle in neutrale/uit-staat, status = ONDUIDELIJK

### 3.3 KEUZE — `KeuzeRadio`

Horizontale radio-group met visuele knoppen (geen native radio buttons).

```
Samenstelling bekendgemaakt of selectie gedurende seizoen?
  [ Vooraf bekendgemaakt ]  [ Selectie gedurende seizoen ]    [VOORLOPIG]
         (actief)                    (inactief)
```

**Specs:**
- Knoppen: `--ow-bg-tertiary` achtergrond, 12px radius, 44px hoogte (touch target)
- Actieve knop: oranje border (`--ow-accent`), subtle oranje glow, `--ow-text-primary` tekst
- Inactieve knop: `--ow-border` rand, `--ow-text-secondary` tekst
- Framer Motion `layoutId` voor de actieve indicator die mee-animeert

### 3.4 GETAL_RANGE — `BezettingsRange`

Drie number inputs naast elkaar voor M/V/afwijking.

```
A-cat senioren per team:
  Ideaal M    Ideaal V    Afwijking
  [ 6  ]      [ 6  ]     [ +/- 2 ]     [DEFINITIEF]
```

**Specs:**
- Drie `GetalInput` componenten naast elkaar in een flex-row
- Labels boven elk veld: "Ideaal M" / "Ideaal V" / "Afwijking"
- M-veld: blauwe accent-kleur, V-veld: roze/rode accent-kleur, Afwijking: neutrale kleur
- Default-waarden voorgevuld uit `rules/ow-voorkeuren.md`
- Bij afwijking van default: subtiel waarschuwingsicoon met tooltip "Afwijkend van OW-standaard"

### 3.5 Status-indicator (alle types)

Elk antwoord heeft een drievoudige status: ONDUIDELIJK, VOORLOPIG, DEFINITIEF.

```
[ ONDUIDELIJK ]  →  [ VOORLOPIG ]  →  [ DEFINITIEF ]
    (rood)            (amber)           (groen)
```

**Design:**
- Drukknop-achtige segmented control, compact (past naast het antwoord)
- Kleuren: rood/amber/groen met transparante achtergrond (zoals `GezienStatusBadge`)
- Bij klik op status: volgende status (ONDUIDELIJK > VOORLOPIG > DEFINITIEF > ONDUIDELIJK)
- Cycle-animatie: Framer Motion scale-pulse bij statuswijziging

---

## 4. Staf-flow visualisatie

### Flow-patroon: inline status met horizontale stappen

Geen kanban. De reden: het team is de primaire groupering, niet de flow-stap. Een TC-lid denkt "Wie traint Senioren 1?" niet "Welke trainers zijn IN_GESPREK?".

### `StafFlowIndicator` — het kerncomponent

```
 [1]---[2]---[3]---[4]---[5]
  V     K    IG     T     B
```

- 5 bolletjes (12px diameter) verbonden met lijnen
- Stap-labels: V(acant), K(andidaat), IG(esprek), T(oegewezen), B(evestigd)
- Voltooide stappen: gevulde oranje bol + oranje verbindingslijn
- Huidige stap: gevulde oranje bol met pulserende glow (`box-shadow: 0 0 12px rgba(255,107,0,0.5)`)
- Toekomstige stappen: lege bol met `--ow-border` rand + grijze lijn
- De hele indicator is 200px breed, past naast de persoonsnaam in een tabelrij

### Compact formaat voor kleine schermen

Op mobile wordt de flow-indicator vervangen door een enkele `Badge`:

```
[ KANDIDAAT ]  (amber badge)
[ BEVESTIGD ]  (groene badge)
[ VACANT ]     (rode badge, met waarschuwingsicoon als hoofdtrainer)
```

### Versneld toewijzen — UX flow

1. TC-lid klikt "+ Toewijzen" op een VACANT positie
2. `StafToewijsDialog` opent (half-screen sheet op mobile, dialog op desktop)
3. Zoekveld: zoek op naam in de Staf-tabel
4. Resultaten tonen: naam, huidige toewijzingen, beschikbaarheid
5. Toggle "Direct bevestigen" (default: UIT)
   - UIT: status wordt KANDIDAAT, normale flow
   - AAN: status wordt BEVESTIGD, Pin wordt aangemaakt
6. Bevestig-knop: oranje, "Toewijzen" of "Direct bevestigen"

### Signalering

- Team zonder hoofdtrainer: rode rand om de StafTeamKaart + badge "Geen trainer"
- Staf met dubbele toewijzing: amber signaal op de persoonsbadge
- Alle vacatures: filter-optie "Alleen vacatures" toont alleen onvervulde posities

---

## 5. Voortgangsdashboard

### Architectuur

Het voortgangsdashboard is een **sticky** component bovenaan de blauwdruk-pagina. Het vat de status van alle onderdelen samen in een blik.

### `BlauwdrukVoortgang` — het component

```
+-------------------------------------------------------------+
|  BLAUWDRUK 2026-2027                           [62% gereed] |
|  ========================================================== |
|                                                              |
|  +------------+  +------------+  +------------+  +--------+ |
|  | KADERS     |  | SPELERS    |  | STAF       |  | TOTAAL | |
|  |   8 / 15   |  |  142/180   |  |   18/22    |  |  62%   | |
|  | definitief |  |   gezien   |  |  ingevuld  |  | gereed | |
|  | [======  ] |  | [========] |  | [=====   ] |  | [====] | |
|  +------------+  +------------+  +------------+  +--------+ |
+-------------------------------------------------------------+
```

### Per KPI-kaart

| KPI | Formule | ProgressBar kleur | Klik-actie |
|---|---|---|---|
| Kaders | definitief / totaal vragen | auto (rood > amber > groen) | Navigeer naar Kaders-tab |
| Spelers | gezien / totaal | auto | Navigeer naar Spelers-tab |
| Staf | bevestigd / totaal posities | auto | Navigeer naar Staf-tab |
| Totaal | gewogen gemiddelde (Kaders 30%, Spelers 40%, Staf 30%) | oranje gradient | -- |

### Hergebruik

- `StatCard` uit packages/ui voor de vier kaarten (maar met ProgressBar eronder)
- Of beter: een nieuw `VoortgangKpi` component dat `KpiCard` + `ProgressBar` combineert
- `ProgressBar` uit packages/ui (al gebouwd met Framer Motion animaties, glow, shimmer)

### Responsive gedrag

- Desktop: 4 kaarten naast elkaar in een grid
- Tablet: 2x2 grid
- Mobile: horizontaal scrollbare strip (swipe)

---

## 6. Visuele samenhang

### Ontwerpprincipes voor eenheid

**6.1 Gedeelde voortgangs-taal**

Elk onderdeel gebruikt dezelfde visuele patronen:
- `ProgressBar` bovenaan elke sectie
- Dezelfde kleurcodering: rood = onduidelijk/vacant, amber = voorlopig/kandidaat, groen = definitief/bevestigd
- Dezelfde "X van Y" tekst-formaat

**6.2 Consistente kaart-structuur**

Alle inhoud leeft in `Card`-componenten met dezelfde styling:
- `--surface-card` achtergrond
- `--shadow-card` schaduw
- 16px border-radius
- `--border-default` rand

**6.3 Status-badges overal hetzelfde**

Drie-kleuren status-systeem is universeel:

| Context | Rood | Amber | Groen |
|---|---|---|---|
| Kaders | ONDUIDELIJK | VOORLOPIG | DEFINITIEF |
| Spelers | ROOD/ORANJE | GEEL | GROEN |
| Staf | VACANT | KANDIDAAT/IN_GESPREK | BEVESTIGD |
| Scenario's | Ongeldig | Waarschuwing | Valide |

Gebruik `Badge` uit packages/ui met `color="red"`, `color="yellow"`, `color="green"`.

**6.4 Animatie-consistentie**

- Sectie-wisseling: Framer Motion `AnimatePresence` met fade + subtle slide (200ms)
- Status-wijziging: scale-pulse (1.0 > 1.05 > 1.0) op de badge
- ProgressBar: altijd met de bestaande glow + shimmer animatie
- Conditioneel verschijnen/verdwijnen: height + opacity transition (300ms)

**6.5 Typografie-hierarchie**

- Sectie-titel: 20px, font-weight 600, `--text-primary`
- Groep-titel: 14px, font-weight 600, `--text-secondary`
- Vraag-tekst: 14px, font-weight 400, `--text-primary`
- Waarde/antwoord: 16px, font-weight 600, `--ow-accent` (voor getallen) of `--text-primary`
- Caption/hint: 12px, font-weight 400, `--text-tertiary`

**6.6 Kleur als navigatie**

De vier KPI-kaarten in het dashboard krijgen subtiele categorie-kleuren die terugkomen in de sectie-headers:
- Kaders: blauw accent (`#3B82F6`)
- Spelers: groen accent (`#22C55E`)
- Staf: oranje accent (`#FF6B00`)
- Totaal: wit/neutraal

Dit creert een visuele "kleurenroute" door de blauwdruk.

---

## 7. Implementatievolgorde

### Fase 1: Skelet + Dashboard (1-2 dagen)

**Doel**: Nieuwe pagina-structuur zonder functionaliteitsverlies.

| Stap | Wat | Resultaat |
|---|---|---|
| 1.1 | `BlauwdrukVoortgang` component bouwen | Dashboard bovenaan de pagina |
| 1.2 | Tab-structuur hernoemen (6 tabs) | Navigatie klopt |
| 1.3 | Bestaande componenten in nieuwe tabs plaatsen | GezienOverzicht in "Spelers", BesluitenOverzicht in "Kaders" |
| 1.4 | CategoriePanel verplaatsen naar "Teams" tab | Categorie-instellingen bij teams |

**Resultaat na fase 1**: Werkende pagina met nieuwe structuur en dashboard. Alle bestaande functionaliteit intact.

### Fase 2: Kaders met gestructureerde invoer (2-3 dagen)

**Doel**: Besluiten-tab upgraden met typed invoer.

| Stap | Wat | Resultaat |
|---|---|---|
| 2.1 | Schema-uitbreiding: `antwoordType`, `toonAls`, `opties`, `groep` op StandaardVraag/BlauwdrukBesluit | Datamodel ondersteunt structured input |
| 2.2 | Seed-data: ~40 standaardvragen met types en condities | Vragenset beschikbaar |
| 2.3 | `GetalInput`, `JaNeeToggle`, `KeuzeRadio`, `BezettingsRange` componenten | Invoer-componenten klaar |
| 2.4 | `KaderVraag` en `VraagGroep` met conditionele logica | Vraagroepen renderen correct |
| 2.5 | `KadersOverzicht` als vervanging van `BesluitenOverzicht` | Volledig werkend |
| 2.6 | Koppeling: bezettingsgraad-antwoorden updaten CategorieKaders | Data stroomt door |

**Resultaat na fase 2**: TC kan alle kadervragen beantwoorden met typed invoer. Conditionele vragen werken. Antwoorden sturen de validatie-engine.

### Fase 3: Staf-module (2-3 dagen)

**Doel**: Staf-toewijzing als flow.

| Stap | Wat | Resultaat |
|---|---|---|
| 3.1 | Schema-uitbreiding: `StafPositie` model met flow-status enum | Datamodel klaar |
| 3.2 | Server actions: CRUD voor staf-posities, status-updates | Backend klaar |
| 3.3 | `StafFlowIndicator` component | Flow-visualisatie |
| 3.4 | `StafTeamKaart` en `StafPositieRij` | Lijst-weergave |
| 3.5 | `StafToewijsDialog` met zoek en versneld-toewijzen | Interactie compleet |
| 3.6 | `StafOverzicht` als hoofd-component + voortgang | Volledig werkend |
| 3.7 | Pin-aanmaak bij BEVESTIGD | Integratie met pin-systeem |

**Resultaat na fase 3**: TC kan alle stafposities beheren. Bevestigde staf wordt pin. Voortgang zichtbaar in dashboard.

### Fase 4: Teams-samenvoeging (1-2 dagen)

**Doel**: Teams, pins, categorieen en referentieteams in een coherent overzicht.

| Stap | Wat | Resultaat |
|---|---|---|
| 4.1 | Schema-uitbreiding: `Team.ambitie` enum veld | Ambitie opslaan |
| 4.2 | `AmbitieSelector` component | Visuele ambitie-keuze |
| 4.3 | `TeamBlauwdrukKaart` met ambitie, bezetting, pins, staf | Teamkaart |
| 4.4 | `TeamsOverzicht` met doelgroep-groepering | Hoofd-component |
| 4.5 | Pins inline tonen per team | Pins geintegreerd |
| 4.6 | Referentieteam-badge per team | Context vorig seizoen |

**Resultaat na fase 4**: Eenmaal overzicht van alle teams met alle relevante informatie.

### Fase 5: Scenario-validatie + Werkbord (1-2 dagen)

**Doel**: Validatie verrijken, werkbord uitbreiden.

| Stap | Wat | Resultaat |
|---|---|---|
| 5.1 | `ScenariosSamenvatting` component | Scenario's-tab in blauwdruk |
| 5.2 | Validatie uitbreiden met gezien/staf/bezetting checks | Rijkere validatie |
| 5.3 | `MijlpalenTimeline` component (generiek) | Voortgangs-visualisatie |
| 5.4 | Toelichting integreren in werkbord | Werkbord compleet |

**Resultaat na fase 5**: Alles verbonden. Scenario's tonen blauwdruk-validatie. Werkbord is centraal punt.

### Fase 6: Polish + animaties (1 dag)

**Doel**: Premium feel over het hele geheel.

| Stap | Wat |
|---|---|
| 6.1 | Framer Motion AnimatePresence op alle tab-wisselingen |
| 6.2 | Micro-animaties: status-pulse, flow-indicator transition, counter-animatie |
| 6.3 | Mobile responsive pass: alle componenten op 430px testen |
| 6.4 | Design system audit: alle kleuren via tokens, geen hardcoded waarden |
| 6.5 | Visual regression test updates |

---

## 8. Totaal overzicht nieuwe componenten

### Nieuw te bouwen (20 componenten)

| # | Component | Categorie | Prioriteit |
|---|---|---|---|
| 1 | `BlauwdrukVoortgang` | Dashboard | Fase 1 |
| 2 | `VoortgangKpi` | Dashboard | Fase 1 |
| 3 | `KadersOverzicht` | Kaders | Fase 2 |
| 4 | `VraagGroep` | Kaders | Fase 2 |
| 5 | `KaderVraag` | Kaders | Fase 2 |
| 6 | `GetalInput` | Kaders (invoer) | Fase 2 |
| 7 | `JaNeeToggle` | Kaders (invoer) | Fase 2 |
| 8 | `KeuzeRadio` | Kaders (invoer) | Fase 2 |
| 9 | `BezettingsRange` | Kaders (invoer) | Fase 2 |
| 10 | `ConditioneleHint` | Kaders | Fase 2 |
| 11 | `StafOverzicht` | Staf | Fase 3 |
| 12 | `StafTeamKaart` | Staf | Fase 3 |
| 13 | `StafPositieRij` | Staf | Fase 3 |
| 14 | `StafFlowIndicator` | Staf | Fase 3 |
| 15 | `StafToewijsDialog` | Staf | Fase 3 |
| 16 | `TeamsOverzicht` | Teams | Fase 4 |
| 17 | `TeamBlauwdrukKaart` | Teams | Fase 4 |
| 18 | `AmbitieSelector` | Teams | Fase 4 |
| 19 | `ScenariosSamenvatting` | Scenarios | Fase 5 |
| 20 | `MijlpalenTimeline` | Werkbord | Fase 5 |

### Hergebruik uit `packages/ui/` (11 componenten)

| Component | Wordt gebruikt in |
|---|---|
| `KpiCard` | BlauwdrukVoortgang |
| `StatCard` | VoortgangKpi |
| `ProgressBar` | Alle secties |
| `Toggle` | JaNeeToggle, StafToewijsDialog |
| `Input` | GetalInput |
| `Select` | StafToewijsDialog |
| `Card` + `CardHeader` + `CardBody` | VraagGroep, StafTeamKaart, TeamBlauwdrukKaart |
| `Badge` | Status-badges overal |
| `Dialog` | StafToewijsDialog |
| `SearchInput` | StafToewijsDialog |
| `EmptyState` | Lege secties |

### Bestaand te behouden (5 componenten)

| Component | Aanpassing |
|---|---|
| `GezienOverzicht` | Minimaal: hernaam tab, voeg filter opties toe |
| `GezienStatusBadge` | Geen wijziging |
| `WerkbordOverzicht` | Voeg toelichting-sectie toe |
| `ToelichtingEditor` | Wordt ingebed in werkbord |
| `CategoriePanel` | Verplaatst naar Teams-tab |

### Te verwijderen / vervangen (2 componenten)

| Component | Reden |
|---|---|
| `BesluitenOverzicht` | Vervangen door `KadersOverzicht` met typed invoer |
| `PinsOverzicht` (als tab) | Pins worden inline getoond in Teams-tab |

---

## 9. Schema-uitbreidingen samenvatting

| Model | Veld | Type | Doel |
|---|---|---|---|
| `StandaardVraag` | `antwoordType` | `AntwoordType` enum | GETAL, JA_NEE, KEUZE, GETAL_RANGE |
| `StandaardVraag` | `toonAls` | `Json?` | Conditionele logica |
| `StandaardVraag` | `opties` | `String[]` | Keuze-opties |
| `StandaardVraag` | `groep` | `String` | Vraaggroep-naam |
| `StandaardVraag` | `doelgroep` | `Doelgroep?` | Doelgroep-context |
| `StandaardVraag` | `defaultWaarde` | `Json?` | Default antwoord (voor bezettingsgraad) |
| `BlauwdrukBesluit` | `antwoordType` | `AntwoordType?` | Overgenomen van StandaardVraag |
| `BlauwdrukBesluit` | `gestructureerdAntwoord` | `Json?` | Typed antwoord (naast vrije tekst) |
| Nieuw: `StafPositie` | (geheel model) | | Team-positie met flow-status |
| `Team` | `ambitie` | `TeamAmbitie?` enum | PROMOTIE/HANDHAVING/ONTWIKKELING/PLEZIER |

---

## 10. Risico's en afwegingen

### Risico 1: Te veel tegelijk

**Mitigatie**: Fasering. Fase 1 levert direct waarde (dashboard + herstructurering) zonder iets kapot te maken. Elke volgende fase is zelfstandig deploybaar.

### Risico 2: Kaders-conditionele logica wordt complex

**Mitigatie**: Begin eenvoudig. Fase 2 implementeert alleen de directe condities uit `standaardvragen-blauwdruk.md`. Geen geneste condities, geen OR-logica. Elke `toonAls` verwijst naar precies een andere vraag.

### Risico 3: Desktop TI-layout verstoord

**Mitigatie**: De blauwdruk-pagina is al dark-themed (zie GezienOverzicht, BesluitenOverzicht). De herstructurering verandert geen styling, alleen layout en groepering. De TI desktop-layout blijft intact conform de `feedback_ti_variant` memory.

### Risico 4: Staf-module raakt bestaande StafToewijzing

**Mitigatie**: Het nieuwe `StafPositie` model is een apart model dat de flow-status bijhoudt. De bestaande `StafToewijzing` (historische import-data) blijft onaangeraakt. `StafPositie` verwijst via `stafId` naar dezelfde `Staf`-tabel.

---

## Bijlage: Mermaid — Blauwdruk 2.0 navigatieflow

```mermaid
graph TD
    A[/blauwdruk] --> D[BlauwdrukVoortgang Dashboard]
    D --> |klik KPI| T1[Kaders tab]
    D --> |klik KPI| T2[Spelers tab]
    D --> |klik KPI| T3[Staf tab]
    D --> T4[Teams tab]
    D --> T5[Scenario's tab]
    D --> T6[Werkbord tab]

    T1 --> G1[VraagGroep: Teamaantallen]
    T1 --> G2[VraagGroep: Selectiestructuur]
    T1 --> G3[VraagGroep: Bezettingsgraad]
    T1 --> G4[VraagGroep: Doorstroom]

    G2 -.-> |conditie| G1
    G3 -.-> |conditie| G2

    T2 --> GZ[GezienOverzicht bestaand]

    T3 --> ST[StafTeamKaart per team]
    ST --> SP[StafPositieRij per positie]
    SP --> |+ Toewijzen| SD[StafToewijsDialog]
    SP --> |BEVESTIGD| PIN[Pin aanmaken]

    T4 --> TK[TeamBlauwdrukKaart per team]
    TK --> AM[AmbitieSelector]
    TK --> PI[Inline Pins]
    TK --> RF[ReferentieTeamBadge]

    T5 --> |link| SC[/scenarios pagina]
    SC --> VAL[Validatie met blauwdruk-data]

    T6 --> WB[WerkbordOverzicht]
    T6 --> TL[ToelichtingEditor]
    T6 --> ML[MijlpalenTimeline]
```
