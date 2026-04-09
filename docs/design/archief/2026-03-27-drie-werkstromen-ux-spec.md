# UX Specificatie: Drie Werkstromen

**Auteur**: UX-designer (lead)
**Datum**: 2026-03-27
**Status**: Design-specificatie voor handoff naar dev

---

## UX-1: Blauwdruk 2.0 -- Dashboard + Sectie-navigatie

### 1. Huidige staat

De blauwdruk-pagina (`apps/web/src/app/(teamindeling)/teamindeling/blauwdruk/page.tsx`) is een server component die 12 parallelle data-queries uitvoert en alles doorgeeft aan `BlauwdrukTabs`, een client component.

**BlauwdrukTabs** heeft 8 vlakke tabs:
```
Categorieen | Gezien | Besluiten | Uitgangspositie | Leden | Toelichting | Werkbord | Pins
```

Problemen:
- **8 tabs op gelijk niveau** -- geen hierarchie, geen overzicht
- Tab-balk gebruikt **lichte kleuren** (`border-gray-200`, `text-gray-500`, `hover:text-gray-700`) -- dark-first schending
- Badge-kleuren in tabs zijn licht-thema (`bg-red-100 text-red-700`, `bg-amber-100 text-amber-700`) -- dark-first schending
- Pagina-header gebruikt `text-gray-900` en `text-gray-500` -- dark-first schending
- Geen voortgangsindicatie: een TC-lid weet niet waar te beginnen
- Pins en Uitgangspositie zijn losstaande tabs die beter bij Teams horen

**4 input-componenten bestaan al** in `packages/ui/src/data-input/`:
- `GetalInput` -- stepper met +/- knoppen, dark-first, werkt correct
- `JaNeeToggle` -- wraps `Toggle`, dark-first, werkt correct
- `KeuzeRadio` -- horizontale radio-buttons met oranje glow, dark-first, werkt correct
- `BezettingsRange` -- 3x GetalInput (M/V/afwijking), dark-first, werkt correct

Alle vier zijn **gebouwd maar ongebruikt**. Ze staan klaar voor Kaders-sectie.

### 2. Design-beslissingen

#### 2.1 Twee-laags architectuur

Vervang de 8 vlakke tabs door:

**Laag 1: Voortgangsdashboard (sticky, altijd zichtbaar)**
Vier klikbare KPI-kaarten met ProgressBar:

| KPI | Bron | Kleur-accent |
|---|---|---|
| Kaders | besluitStats.definitief / totaal | Blauw `#3B82F6` |
| Spelers | gezienVoortgang.gezien / totaal | Groen `#22C55E` |
| Staf | stafVoortgang.bevestigd / totaal | Oranje `#FF6B00` |
| Totaal | gewogen gemiddelde (30/40/30) | Neutraal wit |

**Laag 2: Sectie-navigatie (6 tabs)**
```
Kaders | Spelers | Staf | Teams | Scenario's | Werkbord
```

#### 2.2 Hergroepering

| Oud | Nieuw | Reden |
|---|---|---|
| Categorieen | Teams | Categorie-instellingen horen bij teams |
| Besluiten | Kaders | Besluiten zijn antwoorden op kadervragen |
| Gezien | Spelers | Duidelijkere benaming |
| Uitgangspositie | Teams | Referentieteams zijn context voor teams |
| Leden | (collapsible in Spelers) | Niet prominent genoeg voor eigen tab |
| Toelichting | Werkbord | Notitie-achtig, past bij werkbord |
| Pins | Teams | Pins zijn per team, niet los |

#### 2.3 Dark-first fix

De hele tab-balk en pagina-header moeten over naar design tokens:
- `border-gray-200` wordt `var(--border-default)`
- `text-gray-500` wordt `var(--text-secondary)`
- `text-gray-900` wordt `var(--text-primary)`
- Badge-kleuren: `bg-red-100 text-red-700` wordt `bg-red-900/30 text-red-400` (al bestaand patroon in evaluatie)
- Actieve tab: `border-ow-oranje text-ow-oranje` (dit is al correct)

### 3. Componentenlijst

#### Hergebruik uit packages/ui/ (11 componenten)

| Component | Gebruik |
|---|---|
| `KpiCard` | Dashboard -- 4 voortgangskaarten |
| `ProgressBar` | Dashboard + elke sectie-header |
| `Card` + `CardHeader` + `CardBody` | VraagGroep, StafTeamKaart, TeamBlauwdrukKaart |
| `Badge` | Statusbadges (ONDUIDELIJK/VOORLOPIG/DEFINITIEF) |
| `Toggle` | JaNeeToggle (al gewrapped) |
| `Input` | Basis voor GetalInput (al gewrapped) |
| `Select` | Staf-persoon selectie in toewijsdialog |
| `Dialog` | StafToewijsDialog |
| `SearchInput` | Zoeken in staf-toewijsdialog |
| `EmptyState` | Lege secties |
| `GetalInput`, `JaNeeToggle`, `KeuzeRadio`, `BezettingsRange` | Kaders-invoer (bestaan al!) |

#### Nieuw te bouwen (16 componenten, 4 invoer al klaar)

**Fase 1 -- Skelet (2 componenten)**

| Component | Beschrijving | Locatie |
|---|---|---|
| `BlauwdrukVoortgang` | Sticky dashboard met 4 KPI-kaarten | `blauwdruk/BlauwdrukVoortgang.tsx` |
| `VoortgangKpi` | KpiCard + ProgressBar combinatie, klikbaar | `blauwdruk/VoortgangKpi.tsx` |

**Fase 2 -- Kaders (3 componenten, invoer al klaar)**

| Component | Beschrijving | Locatie |
|---|---|---|
| `KadersOverzicht` | Hoofdcomponent: vragengroepen met voortgang | `blauwdruk/KadersOverzicht.tsx` |
| `VraagGroep` | Collapsible groep met voortgangsindicatie | `blauwdruk/kaders/VraagGroep.tsx` |
| `KaderVraag` | Individuele vraag met type-specifieke invoer + status | `blauwdruk/kaders/KaderVraag.tsx` |
| `ConditioneleHint` | Gedimde kaart die uitlegt waarom vragen verborgen zijn | `blauwdruk/kaders/ConditioneleHint.tsx` |

**Fase 3 -- Staf (5 componenten)**

| Component | Beschrijving | Locatie |
|---|---|---|
| `StafOverzicht` | Hoofdcomponent met voortgang en filters | `blauwdruk/StafOverzicht.tsx` |
| `StafTeamKaart` | Kaart per team met posities | `blauwdruk/staf/StafTeamKaart.tsx` |
| `StafPositieRij` | Rij per positie: rol + flow-indicator + persoon | `blauwdruk/staf/StafPositieRij.tsx` |
| `StafFlowIndicator` | 5-punt horizontale flow-visualisatie | `blauwdruk/staf/StafFlowIndicator.tsx` |
| `StafToewijsDialog` | Half-screen sheet/dialog voor toewijzing | `blauwdruk/staf/StafToewijsDialog.tsx` |

**Fase 4 -- Teams (3 componenten)**

| Component | Beschrijving | Locatie |
|---|---|---|
| `TeamsOverzicht` | Teams gegroepeerd per doelgroep | `blauwdruk/TeamsOverzicht.tsx` |
| `TeamBlauwdrukKaart` | Uitgebreide teamkaart met ambitie, pins, staf | `blauwdruk/teams/TeamBlauwdrukKaart.tsx` |
| `AmbitieSelector` | Segmented control: PROMOTIE/HANDHAVING/ONTWIKKELING/PLEZIER | `blauwdruk/teams/AmbitieSelector.tsx` |

**Fase 5 -- Scenario's + Werkbord (2 componenten)**

| Component | Beschrijving | Locatie |
|---|---|---|
| `ScenariosSamenvatting` | Compact overzicht met validatie-highlights | `blauwdruk/ScenariosSamenvatting.tsx` |
| `MijlpalenTimeline` | Verticale checklist-timeline (generiek) | `blauwdruk/MijlpalenTimeline.tsx` |

#### Bestaand te behouden (5 componenten)

| Component | Aanpassing |
|---|---|
| `GezienOverzicht` | Hernaam tab naar "Spelers", voeg filters toe |
| `GezienStatusBadge` | Geen wijziging |
| `WerkbordOverzicht` | Voeg toelichting-sectie toe |
| `ToelichtingEditor` | Wordt ingebed in werkbord |
| `CategoriePanel` | Verplaatst naar Teams-tab |

#### Te vervangen (2 componenten)

| Component | Vervangen door |
|---|---|
| `BesluitenOverzicht` | `KadersOverzicht` (typed invoer) |
| `PinsOverzicht` (als losse tab) | Inline in `TeamBlauwdrukKaart` |

### 4. Interactie-specificatie

#### Dashboard-interactie
- Klik op een KPI-kaart: scrollt naar en activeert de bijbehorende tab
- ProgressBars animeren bij eerste render (Framer Motion, bestaande animatie)
- Dashboard is **sticky** op desktop (vast bovenaan bij scrollen), scrollt mee op mobile

#### Tab-navigatie
- Tab-wisseling: `AnimatePresence` met fade + subtle slide (200ms)
- Actieve tab: oranje underline (bestaand patroon, maar nu met `var(--ow-accent)`)
- Tabs met openstaande items tonen een count-badge in dark kleuren

#### Kaders-interactie
- Vraaggroepen zijn collapsible (klik op header toggled open/dicht)
- Eerste onbeantwoorde groep is standaard open
- Conditionele vragen: `AnimatePresence` bij verschijnen/verdwijnen (300ms height + opacity)
- Status-cycling: klik op status-badge cycled ONDUIDELIJK > VOORLOPIG > DEFINITIEF
- Status-wijziging: Framer Motion scale-pulse (1.0 > 1.05 > 1.0) op de badge

#### Staf-interactie
- Flow-indicator op desktop: 5 bolletjes met oranje voortgang
- Flow-indicator op mobile: enkele Badge met kleur per status
- "+ Toewijzen" opent BottomSheet (mobile) of Dialog (desktop)
- "Direct bevestigen" toggle in toewijsdialog skip de tussenstappen
- Bij BEVESTIGD: automatisch een Pin aanmaken

#### Teams-interactie
- AmbitieSelector: segmented control met oranje glow op actieve optie
- Framer Motion `layoutId` voor de actieve indicator
- Pins inline per team: klikbaar voor detail

### 5. Handoff naar dev

#### Stap 1 (direct, geen schema-wijziging)
1. Dark-first fix van BlauwdrukTabs: vervang alle Tailwind lichte klassen door tokens
2. Bouw `BlauwdrukVoortgang` en `VoortgangKpi` met bestaande `KpiCard` + `ProgressBar`
3. Hernoem tabs: 8 tabs wordt 6 tabs (Kaders, Spelers, Staf, Teams, Scenario's, Werkbord)
4. Verplaats bestaande componenten naar nieuwe tabs (geen nieuwe functionaliteit)

#### Stap 2 (schema-uitbreiding nodig)
1. Prisma schema: `AntwoordType` enum, `toonAls`/`opties`/`groep` op StandaardVraag
2. Seed-data: ~40 standaardvragen met types
3. `KadersOverzicht`, `VraagGroep`, `KaderVraag` bouwen met de 4 bestaande input-componenten
4. Conditionele logica client-side

#### Stap 3 (nieuw model)
1. Prisma schema: `StafPositie` model
2. Server actions: CRUD + status-updates
3. 5 staf-componenten bouwen

#### Stap 4-6
Zie faseringsplan in `docs/plans/2026-03-27-blauwdruk-2-ux-plan.md`

---

## UX-2: Evaluatie Landing Page

### 1. Huidige staat

De `/evaluatie/` landing page is een **lege stub**:

```tsx
export default function EvaluatieHome() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-ow-oranje text-2xl font-bold">Evaluatie</h1>
        <p className="text-text-muted mt-2">c.k.v. Oranje Wit</p>
      </div>
    </main>
  );
}
```

Alleen een gecentreerde titel. Geen navigatie, geen content, geen roldetectie.

**Wat er WEL bestaat (diepere pagina's):**

| Route | Status | Beschrijving |
|---|---|---|
| `/evaluatie/admin` | Werkend | Tabel met evaluatierondes, status, counts. Link naar "Nieuwe ronde" |
| `/evaluatie/coordinator?token=...` | Werkend | Token-gebaseerd, toont teams + ingediend/totaal, links naar per-team pagina |
| `/evaluatie/coordinator/[rondeId]/[teamId]` | Werkend | Per-team evaluatie-invulpagina voor coordinatoren |
| `/evaluatie/invullen?token=...` | Werkend | Token-gebaseerd, trainer-evaluatieformulier |
| `/evaluatie/invullen/bedankt` | Werkend | Bedankpagina |
| `/evaluatie/zelf?token=...` | Werkend | Token-gebaseerd, zelfevaluatie-formulier |
| `/evaluatie/zelf/bedankt` | Werkend | Bedankpagina |

Het probleem: de landing page biedt geen enkele routing naar deze werkende pagina's. Er zijn vier compleet verschillende gebruikersgroepen die deze pagina bereiken.

### 2. Design-beslissingen

#### Vier rollen, vier ervaringen

De landing page moet roldetectie doen en de juiste inhoud tonen.

**2.1 Trainer/Coach (via token-link in e-mail)**

Deze gebruiker komt NOOIT op `/evaluatie/` -- ze komen via een directe link (`/evaluatie/invullen?token=xxx`). De landing page hoeft hier niets voor te doen, maar als ze per ongeluk op de root landen, tonen we:

```
+---------------------------------------------------+
|  EVALUATIE                                         |
|  c.k.v. Oranje Wit                                 |
|                                                     |
|  [Oranje Wit logo/icoon]                           |
|                                                     |
|  Heb je een uitnodiging ontvangen?                 |
|  Gebruik de link in je e-mail om je evaluatie       |
|  te openen.                                         |
|                                                     |
|  Geen link ontvangen? Neem contact op met je        |
|  coordinator.                                       |
+---------------------------------------------------+
```

**2.2 Speler/Ouder (via token-link in e-mail)**

Zelfde als trainer -- komt via directe link (`/evaluatie/zelf?token=xxx`). Fallback op de root toont hetzelfde bericht.

**2.3 Coordinator (ingelogd, heeft CoordinatorTeam records)**

Na login (Google OAuth via NextAuth), tonen we een coordinator-dashboard:

```
+---------------------------------------------------+
|  EVALUATIE                          [Profielfoto]  |
|  Coordinator: Karin Smit                           |
+---------------------------------------------------+
|                                                     |
|  ACTIEVE RONDES                                     |
|                                                     |
|  +-- Ronde 2 (2025-2026) ──────────────────────+  |
|  |  Deadline: 15 april 2026                     |  |
|  |  Status: ACTIEF                              |  |
|  |                                               |  |
|  |  Aspiranten 3    [=======   ] 8/12 ingediend |  |
|  |  Aspiranten 4    [====      ] 5/10 ingediend |  |
|  |  Pupillen 1      [==========] 12/12 klaar!   |  |
|  +-----------------------------------------------+  |
|                                                     |
|  AFGERONDE RONDES                                   |
|  +-- Ronde 1 (2025-2026) ──────────────────────+  |
|  |  Alle evaluaties ingediend                   |  |
|  +-----------------------------------------------+  |
+---------------------------------------------------+
```

**2.4 TC-lid / Admin (ingelogd, heeft EDITOR rol)**

Redirect naar `/evaluatie/admin` of toon het admin-dashboard inline:

```
+---------------------------------------------------+
|  EVALUATIE                    [+ Nieuwe ronde]     |
|  Beheer                                            |
+---------------------------------------------------+
|                                                     |
|  RONDES OVERZICHT                                   |
|                                                     |
|  [StatCard: 3 rondes] [StatCard: 2 actief]         |
|  [StatCard: 47 ingediend] [StatCard: 12 openstaand]|
|                                                     |
|  +-- Ronde 2 (trainer) ── ACTIEF ──────────────+  |
|  |  Deadline: 15 apr    23/35 ingediend         |  |
|  +-----------------------------------------------+  |
|  +-- Ronde 1 (trainer) ── GESLOTEN ───────────+   |
|  |  35/35 ingediend                             |  |
|  +-----------------------------------------------+  |
+---------------------------------------------------+
```

#### Detectie-logica

```
1. Heeft de URL een ?token= parameter?
   Ja -> valideer token, redirect naar juiste flow
   Nee -> ga naar stap 2

2. Is de gebruiker ingelogd (NextAuth session)?
   Nee -> toon generieke landing (logo + uitleg + "Inloggen" knop)
   Ja -> ga naar stap 3

3. Heeft de gebruiker EDITOR rol?
   Ja -> toon admin-dashboard
   Nee -> ga naar stap 4

4. Heeft de gebruiker CoordinatorTeam records?
   Ja -> toon coordinator-dashboard
   Nee -> toon generieke landing (je hebt geen toegewezen teams)
```

### 3. Componentenlijst

#### Hergebruik uit packages/ui/

| Component | Gebruik |
|---|---|
| `Card` + `CardHeader` + `CardBody` | Rondekaarten |
| `Badge` | Status-badges (ACTIEF/GESLOTEN/CONCEPT) |
| `ProgressBar` | Voortgang per team (ingediend/totaal) |
| `KpiCard` of `StatCard` | Admin-dashboard statistieken |
| `EmptyState` | Geen rondes / geen teams |
| `Button` | "Nieuwe ronde", "Inloggen" |

#### Nieuw te bouwen (4 componenten)

| Component | Beschrijving | Locatie |
|---|---|---|
| `EvaluatieLanding` | Roldetectie + juiste view renderen | `evaluatie/EvaluatieLanding.tsx` |
| `CoordinatorDashboard` | Rondes + teams met voortgang | `evaluatie/CoordinatorDashboard.tsx` |
| `AdminDashboard` | Statistieken + rondes-overzicht | `evaluatie/AdminDashboard.tsx` |
| `EvaluatieRondeKaart` | Herbruikbare kaart per ronde | `evaluatie/EvaluatieRondeKaart.tsx` |

### 4. Interactie-specificatie

- **Token-redirect**: als `?token=` aanwezig, server-side redirect naar de juiste invul-pagina (geen flash van landing page)
- **Coordinator-dashboard**: klik op een team opent `/evaluatie/coordinator/[rondeId]/[teamId]` met het coordinator-token
- **Admin-dashboard**: klik op een ronde opent de detail-view
- **ProgressBar per team**: auto-kleur (rood < 33%, amber < 66%, groen >= 66%) -- bestaand ProgressBar gedrag
- **Lege staat**: wanneer er geen actieve rondes zijn, toon `EmptyState` met "Er zijn momenteel geen evaluatierondes actief"

### 5. Handoff naar dev

1. **Server component**: `page.tsx` doet roldetectie (session check + DB queries voor coordinator-teams)
2. **Token-redirect**: als `searchParams.token` bestaat, `redirect()` naar de juiste sub-route
3. **Session-check**: gebruik `getSession()` uit `@oranje-wit/auth`
4. **Coordinator-data**: query `CoordinatorTeam` + `EvaluatieRonde` voor de ingelogde gebruiker
5. **Admin-data**: query alle rondes + counts (bestaande `/api/rondes` endpoint of direct Prisma)
6. **Dark-first**: alle componenten gebruiken design tokens, GEEN lichte Tailwind klassen
7. **De admin-pagina** (`/evaluatie/admin`) kan blijven bestaan als aparte route, maar de landing page toont hetzelfde inline voor EDITOR-gebruikers

---

## UX-3: Beheer-dashboard

### 1. Huidige staat

Het beheer-dashboard (`apps/web/src/app/(beheer)/beheer/page.tsx`) is al redelijk goed opgezet:

**Wat werkt:**
- 9 modules als kaarten in een 3-koloms grid
- Elke kaart heeft: icoon, titel, beschrijving, status-badge ("Actief" of "Binnenkort")
- Accent-lijnen per domein (unieke kleur)
- Quick stats bovenaan (seizoen, domeinen, actief, in voorbereiding)
- Animaties (fade-in met delays)
- Dark-first: gebruikt `var(--text-primary)`, `var(--text-tertiary)` correct

**Wat er feitelijk werkend is (23 pagina's, ~10-12 werkend):**

| Domein | Status | Werkende pagina's |
|---|---|---|
| Jaarplanning | Deels | `kalender` (seizoenentabel), `mijlpalen` (stub?) |
| Roostering | Stub | `trainingen` (teamlijst, geen rooster), `wedstrijden` (stub) |
| Teams & Leden | Deels | `teams` (lijst), `sync` (Sportlink sync) |
| Jeugdontwikkeling | **Werkend** | `raamwerk` (CRUD), `raamwerk/[versieId]` (detail), `preview/[band]`, `progressie`, `uss` |
| Scouting | Stub | `scouts` (stub) |
| Evaluatie | Deels | `rondes` (lijst?), `coordinatoren` (lijst?), `templates` (lijst?) |
| Werving | Stub | `aanmeldingen` (stub), `funnel` (stub) |
| Systeem | Stub | `gebruikers` (stub?), `import` (stub?) |
| Archivering | Stub | `teams` (stub?), `resultaten` (stub?) |

Het dashboard markeert nu alleen "Jeugdontwikkeling" als "Actief" en de rest als "Binnenkort" -- dit is correct maar visueel onvoldoende gedifferentieerd.

**Probleem**: Een TC-lid ziet 9 gelijkvormige kaarten en kan niet snel onderscheiden wat werkend is, wat data toont, en wat een lege pagina is.

### 2. Design-beslissingen

#### 2.1 Drievoudige status in plaats van tweevoudig

Vervang "Actief"/"Binnenkort" door drie niveaus:

| Status | Visueel | Betekenis |
|---|---|---|
| **Actief** | Volle opacity, oranje accent-lijn links, groene status-dot | Volledig functioneel, data beschikbaar |
| **In opbouw** | 85% opacity, amber status-dot, "In opbouw" badge | Pagina's bestaan maar zijn beperkt |
| **Gepland** | 50% opacity, grijze status-dot, "Gepland" badge, niet-klikbaar | Nog niet gebouwd |

#### 2.2 Toewijzing per domein

| Domein | Status | Reden |
|---|---|---|
| Jeugdontwikkeling | **Actief** | Volledig CRUD, meerdere pagina's werkend |
| Jaarplanning | In opbouw | Seizoenentabel werkt, mijlpalen onvolledig |
| Teams & Leden | In opbouw | Teamlijst + sync werkt, geen volledige CRUD |
| Roostering | In opbouw | Teamlijst staat er, maar geen roosterfunctie |
| Evaluatie | In opbouw | Rondes-lijsten bestaan |
| Scouting | Gepland | Alleen stub |
| Werving | Gepland | Alleen stubs |
| Systeem | Gepland | Alleen stubs |
| Archivering | Gepland | Alleen stubs |

#### 2.3 Visuele differentiatie

**Actieve kaarten** (de kaarten die je WEL moet gebruiken):
- Volledige opacity
- Oranje accent-lijn links (3px, `var(--ow-accent)`)
- Groene status-dot met pulse-animatie
- Hover-effect: lift + shadow (`hoverLift` motion variant)
- Klikbaar: navigeert naar eerste werkende sub-route

**"In opbouw" kaarten**:
- `opacity: 0.85`
- Amber accent-lijn links
- Amber status-badge "In opbouw"
- Klikbaar maar met subtiele waarschuwing
- Bij hover: tooltip of kleine tekst "Beperkte functionaliteit"

**Geplande kaarten**:
- `opacity: 0.5`
- Geen accent-lijn (of grijze lijn)
- Grijze status-badge "Gepland"
- **Niet klikbaar** -- `pointer-events: none` of een overlay
- Geen hover-effect
- Subtiele tekst onder beschrijving: "Komt in een volgend seizoen"

#### 2.4 Layout-aanpassing

Sorteer het grid zodat actieve domeinen bovenaan staan:

```
Rij 1: [Jeugdontwikkeling (actief)] [Jaarplanning (opbouw)] [Teams & Leden (opbouw)]
Rij 2: [Roostering (opbouw)]        [Evaluatie (opbouw)]    [Scouting (gepland)]
Rij 3: [Werving (gepland)]          [Systeem (gepland)]     [Archivering (gepland)]
```

De `modules` array moet gesorteerd worden op status: actief eerst, dan opbouw, dan gepland.

#### 2.5 Quick stats verbeteren

De huidige 4 stat-cards zijn statisch ("9 domeinen", "1 actief", "8 in voorbereiding"). Maak ze dynamisch:

| Stat | Waarde | Bron |
|---|---|---|
| Actief seizoen | `2025-2026` | Database: actief seizoen |
| Leden | `356` | Database: count leden huidig seizoen |
| Teams | `24` | Database: count OWTeams huidig seizoen |
| Raamwerk | `v2.0 Actief` | Database: actieve raamwerk-versie |

Dit geeft een TC-lid direct zinvolle informatie in plaats van meta-info over het dashboard zelf.

### 3. Componentenlijst

#### Hergebruik uit packages/ui/

| Component | Gebruik |
|---|---|
| `StatCard` of `KpiCard` | Quick stats bovenaan |
| `Badge` | Status-badges per domein |
| `Card` | Domeinkaarten (al in gebruik via CSS classes) |

#### Aanpassing bestaand (2 componenten)

| Component | Aanpassing |
|---|---|
| `DashboardPage` | Status-logica uitbreiden, sortering, dynamische stats |
| Module-definitie (`modules` array) | `status` uitbreiden van 2 naar 3 niveaus |

#### Nieuw te bouwen (1 component)

| Component | Beschrijving | Locatie |
|---|---|---|
| `DomeinKaart` | Verbeterde module-kaart met 3 statusniveaus | `beheer/DomeinKaart.tsx` of inline |

Het beheer-dashboard is bewust lichtgewicht qua componenten. De meeste visuele verbetering zit in CSS en de status-logica.

### 4. Interactie-specificatie

#### Klikgedrag per status

| Status | Klik | Resultaat |
|---|---|---|
| Actief | Navigeert | Gaat naar de eerste sub-route |
| In opbouw | Navigeert | Gaat naar de eerste sub-route, maar met een subtiele banner bovenaan ("Dit domein is in opbouw") |
| Gepland | Geen actie | Visueel gemarkeerd als niet-klikbaar |

#### Hover-effecten

- **Actief**: achtergrond verandert naar `var(--surface-raised)`, subtle lift-animatie, shadow versterkt
- **In opbouw**: lichte achtergrondverandering, geen lift
- **Gepland**: geen hover-effect

#### Stats-animatie

- De vier stat-cards bovenaan laden met een counter-animatie (van 0 naar de werkelijke waarde)
- Gebruik `framer-motion` `useMotionValue` + `useTransform` voor de counter
- Staggered: eerste kaart 0ms delay, tweede 100ms, etc.

### 5. Handoff naar dev

1. **Module-array uitbreiden**: voeg `"in-opbouw"` toe als derde status, wijs per domein correct toe
2. **Sortering**: actief eerst, dan opbouw, dan gepland
3. **CSS aanpassingen**: opacity per status, accent-lijn conditioneel, pointer-events voor gepland
4. **Server component**: maak `page.tsx` een server component die dynamische stats ophaalt (leden-count, team-count, raamwerk-versie)
5. **DomeinKaart extractie**: de huidige inline kaart-rendering in de `modules.map()` verdient een eigen component voor de 3-status logica
6. **Badge component** uit packages/ui gebruiken in plaats van de custom `status-badge` CSS class
7. **Geplande kaarten**: render als `<div>` in plaats van `<Link>` om navigatie te voorkomen

---

## Samenvatting: prioritering

| Werkstroom | Impact | Complexiteit | Aanbevolen volgorde |
|---|---|---|---|
| UX-3: Beheer-dashboard | Hoog (eerste indruk TC) | Laag (CSS + status-logica) | **Eerst** (1 dag) |
| UX-2: Evaluatie landing | Hoog (gebruikers verdwalen) | Middel (roldetectie + 4 views) | **Tweede** (1-2 dagen) |
| UX-1: Blauwdruk 2.0 | Zeer hoog (kernfunctie) | Hoog (20 componenten, schema-uitbreiding) | **Derde** (start met fase 1, dan incrementeel) |

De reden: het beheer-dashboard is snel te verbeteren met minimale risico's. De evaluatie-landing lost een direct gebruikersprobleem op. De blauwdruk is de grootste investering maar kan gefaseerd.
