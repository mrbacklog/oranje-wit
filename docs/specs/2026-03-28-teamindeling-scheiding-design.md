# Design: Team-Indeling — Desktop/Mobile scheiding

**Datum**: 2026-03-28
**Status**: Goedgekeurd design, klaar voor implementatieplan
**Auteur**: Product-team (brainstorm sessie)

---

## Samenvatting

De Team-Indeling app wordt gesplitst in twee functioneel gescheiden versies die dezelfde database delen:

| | Desktop (Studio) | Mobile |
|---|---|---|
| **Route group** | `(teamindeling-studio)` | `(teamindeling)` |
| **URL** | `ckvoranjewit.app/ti-studio/*` | `ckvoranjewit.app/teamindeling/*` |
| **Thema nu** | Light (legacy) | Dark |
| **Thema straks** | Dark (zelfde look & feel als rest) | Dark |
| **Focus** | Maken, bewerken, drag & drop | Bekijken, reviewen, communiceren |
| **Doelgroep** | TC-leden aan het bureau | TC-leden, coordinatoren, trainers onderweg |

De scheiding is **functioneel**, niet cosmetisch. Desktop is de werkplaats waar scenario's worden gemaakt. Mobile is het veldkantoor waar je teams bekijkt, scenario's reviewt en opmerkingen plaatst. Beide draaien op hetzelfde domein als gewone routes — geen subdomeinen.

---

## 1. Routing

### Mapstructuur

```
apps/web/src/app/
├── (teamindeling)/                    # NIEUW: mobile versie
│   ├── layout.tsx                     # dark theme, mobile shell, bottom nav
│   └── teamindeling/
│       ├── page.tsx                   # Dashboard
│       ├── teams/page.tsx             # Teams overzicht (carousel)
│       ├── teams/[id]/page.tsx        # Team detail
│       ├── spelers/page.tsx           # Spelerslijst
│       ├── spelers/[id]/page.tsx      # Speler detail
│       ├── scenarios/page.tsx         # Gedeelde scenario's
│       ├── scenarios/[id]/page.tsx    # Scenario review (read-only)
│       └── staf/page.tsx              # Staf overzicht
│
├── (teamindeling-studio)/             # HERNOEM van huidige (teamindeling)
│   ├── layout.tsx                     # light theme nu, dark straks (desktop shell)
│   ├── teamindeling.css               # bestaande styling
│   └── ti-studio/
│       ├── page.tsx                   # Dashboard (bestaand)
│       ├── blauwdruk/page.tsx         # Blauwdruk workspace (bestaand)
│       ├── scenarios/page.tsx         # Scenario's overzicht (bestaand)
│       ├── scenarios/[id]/page.tsx    # Scenario editor met drag & drop (bestaand)
│       ├── vergelijk/page.tsx         # Scenario vergelijking (bestaand)
│       ├── werkbord/page.tsx          # Werkbord (bestaand)
│       ├── instellingen/page.tsx      # Instellingen (bestaand)
│       ├── over/page.tsx              # Over (bestaand)
│       └── design-system/             # Component showcase (bestaand)
```

### URL-schema

Geen subdomeinen, gewoon twee route groups met eigen URL-prefix op hetzelfde domein:

```
ckvoranjewit.app/teamindeling/*   → (teamindeling)         [mobile]
ckvoranjewit.app/ti-studio/*      → (teamindeling-studio)   [desktop]
```

Geen middleware-rewriting nodig. Next.js resolved de routes direct op basis van de mapstructuur. De portaal-pagina (`/`) linkt naar `/teamindeling/*`. Vanuit de mobile app is er geen directe link naar `/ti-studio/*` — dat is een aparte werkplek.

### Gedeelde data-laag

```
src/lib/teamindeling/
├── queries/           # Prisma queries (spelers, teams, scenario's, staf)
├── actions/           # Server actions (opmerkingen, scenario delen)
├── scope.ts           # Autorisatie scope-filtering
├── types.ts           # Gedeelde TypeScript types
└── validatie.ts       # Validatie-logica
```

Alle data-logica zit op deze ene plek. Beide versies (mobile en studio) importeren hieruit. Er wordt nooit Prisma-logica in pagina-bestanden geschreven.

---

## 2. Features

### Mobile `(teamindeling)` — het veldkantoor

#### Dashboard (`/teamindeling`)
- Welkom met naam en rol-indicatie
- "Mijn teams" — snelle toegang tot teams in jouw scope
- Recente activiteit (opmerkingen, gedeelde scenario's)
- Snelkoppelingen naar spelers en scenario's

#### Teams (`/teamindeling/teams`)
- Carousel/kaart-overzicht van teams
- Gefilterd op jouw scope (autorisatie)
- Per team: naam, categorie, kleurband, aantal spelers, trainer

#### Team detail (`/teamindeling/teams/[id]`)
- Spelerslijst met foto, korfballeeftijd, kleur-indicator
- Staftoewijzing (trainer, coach)
- Opmerkingen en actiepunten bij dit team

#### Spelers (`/teamindeling/spelers`)
- Zoekbalk + filters (categorie, geslacht, team)
- Compacte spelerskaarten
- Gefilterd op scope

#### Speler detail (`/teamindeling/spelers/[id]`)
- Profiel: foto, naam, korfballeeftijd, categorie, huidig team
- Evaluatie-samenvatting (als beschikbaar)
- Opmerkingen en actiepunten bij deze speler
- Seizoenshistorie

#### Scenario review (`/teamindeling/scenarios`)
- Lijst van scenario's die met jou gedeeld zijn
- Status-badge (concept, voorlopig, definitief)

#### Scenario detail (`/teamindeling/scenarios/[id]`)
- Read-only teamindeling: teams als swipeable carousel
- Per team de spelers bekijken
- Opmerking kunnen plaatsen bij het scenario
- Geen editing, geen drag & drop

#### Staf (`/teamindeling/staf`)
- Overzicht stafleden en hun teamtoewijzingen
- Rol (trainer/coach/begeleider)

### Desktop `(teamindeling-studio)` — de werkplaats

Alle bestaande functionaliteit blijft ongewijzigd:
- Blauwdruk (categorieen, targets, genderregels)
- Scenario's maken en bewerken (drag & drop)
- Scenario's vergelijken
- Werkbord
- Instellingen
- **Nieuw**: scenario's delen met mobile-gebruikers via ScenarioDeling

---

## 3. Autorisatie & Scope-model

### Concept

Elke gebruiker krijgt via Beheer een scope toegewezen die bepaalt welke data zichtbaar is in de mobile app. TC-leden zien alles; anderen zien alleen wat binnen hun scope valt.

### Datamodel (nieuw, Prisma)

```prisma
model TIScope {
  id            String              @id @default(cuid())
  naam          String              // "Coordinator Jeugd 8-12"
  beschrijving  String?
  regels        TIScopeRegel[]
  toewijzingen  TIScopeToewijzing[]
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@map("ti_scopes")
}

model TIScopeRegel {
  id      String   @id @default(cuid())
  scopeId String
  scope   TIScope  @relation(fields: [scopeId], references: [id], onDelete: Cascade)
  type    String   // "TEAM" | "CATEGORIE" | "LEEFTIJD"
  waarde  String   // "U13-1" | "U13" | "8-12"

  @@map("ti_scope_regels")
}

model TIScopeToewijzing {
  id           String   @id @default(cuid())
  scopeId      String
  scope        TIScope  @relation(fields: [scopeId], references: [id], onDelete: Cascade)
  gebruikerId  String
  rol          String   // "TC_LID" | "COORDINATOR" | "TRAINER" | "VIEWER"
  createdAt    DateTime @default(now())

  @@unique([scopeId, gebruikerId])
  @@map("ti_scope_toewijzingen")
}

model ScenarioDeling {
  id              String   @id @default(cuid())
  scenarioId      String
  scenario        Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  gedeeldMetEmail String
  gedeeldDoor     String
  createdAt       DateTime @default(now())

  @@unique([scenarioId, gedeeldMetEmail])
  @@map("scenario_delingen")
}
```

### Rolhierarchie

| Rol | Ziet | Mag |
|---|---|---|
| TC_LID | Alles (geen scope-beperking) | Alles bekijken + opmerkingen |
| COORDINATOR | Teams/spelers/staf binnen scope | Bekijken + opmerkingen |
| TRAINER | Eigen team(s) en spelers daarin | Bekijken + opmerkingen |
| VIEWER | Alleen expliciet gedeelde scenario's | Alleen bekijken |

### Scenario-toegang

Scenario's zijn altijd via expliciet delen. Een TC-lid deelt een scenario met specifieke personen via ScenarioDeling. De ontvanger ziet het scenario in de mobile app.

### Scope-filtering

```ts
// src/lib/teamindeling/scope.ts

export async function scopeFilter(gebruikerId: string): Promise<PrismaWhereClause> {
  // 1. Haal TIScopeToewijzing op voor deze gebruiker
  // 2. TC_LID → geen filter (return {})
  // 3. Anders → bouw Prisma where-clause op basis van scope-regels
  //    - type TEAM → filter op team-id
  //    - type CATEGORIE → filter op categorie
  //    - type LEEFTIJD → filter op geboortejaar-range
  // 4. Return samengestelde where-clause
}

export async function magScenarioZien(gebruikerId: string, scenarioId: string): Promise<boolean> {
  // 1. TC_LID → true
  // 2. Check ScenarioDeling voor deze gebruiker + scenario
  // 3. Return true/false
}
```

### Beheer-inrichting

In het Beheer-domein (`/beheer/teamindeling/`) komt een pagina waar TC-leden:
- Scopes aanmaken en benoemen
- Regels toevoegen (team, categorie, of leeftijdsbereik)
- Gebruikers toewijzen aan een scope met een rol
- Scenario's delen met specifieke personen

### Wat we niet nu bouwen

- Complexe samengestelde regels (AND/OR combinaties)
- Automatische scope-toewijzing op basis van staf-koppelingen
- Tijdgebonden scopes (seizoen-afhankelijk)

---

## 4. Componenten

### Hergebruik (al gebouwd)

| Component | Locatie | Gebruik in mobile |
|---|---|---|
| `MobileSpelerKaart` | `components/teamindeling/scenario/mobile/` | Spelerslijsten |
| `TeamCarousel` | `components/teamindeling/scenario/mobile/` | Teams overzicht |
| `TeamSlide` | `components/teamindeling/scenario/mobile/` | Team carousel slides |
| `useIsMobile` | `components/teamindeling/scenario/mobile/` | Breakpoint detectie |
| `packages/ui/*` | `packages/ui/src/` | KpiCard, Badge, Card, etc. |

### Nieuw te bouwen

| Component | Doel |
|---|---|
| `MobileShell` | Layout: dark theme, top bar, bottom navigation |
| `MobileDashboard` | Landing page met scope-gebonden content |
| `TeamDetailMobile` | Team bekijken met spelers en staf |
| `SpelerDetailMobile` | Spelerprofiel met evaluatie en opmerkingen |
| `ScenarioReviewCard` | Read-only scenario weergave met carousel |
| `OpmerkingFeed` | Opmerkingen/actiepunten feed (bij speler, team of scenario) |
| `ScopeFilter` | Autorisatie-aware filtering component |
| `ScenarioDeelDialog` | Dialog in studio om scenario te delen (nieuw in desktop) |

### Componentstructuur

```
src/components/teamindeling/
├── mobile/                    # Mobile-only componenten
│   ├── MobileShell.tsx
│   ├── MobileDashboard.tsx
│   ├── TeamDetailMobile.tsx
│   ├── SpelerDetailMobile.tsx
│   ├── ScenarioReviewCard.tsx
│   ├── OpmerkingFeed.tsx
│   └── ScopeFilter.tsx
├── studio/                    # Desktop-only componenten (huidige code verplaatst)
│   ├── ... (bestaande componenten)
│   └── ScenarioDeelDialog.tsx
└── shared/                    # Gedeeld tussen mobile en studio
    ├── SpelerBadge.tsx
    ├── TeamKleurIndicator.tsx
    └── ... (componenten die in beide versies bruikbaar zijn)
```

---

## 5. UX-vereisten

De mobile versie moet voldoen aan het bestaande design system en UX-standaarden:

### Design System compliance
- Alle componenten gebruiken tokens uit `packages/ui/src/tokens/tokens.css`
- Dark-first: `:root` = dark (geen hardcoded kleuren)
- Componenten uit `packages/ui/` hergebruiken waar mogelijk
- Design gate: `pnpm test:e2e:design-system` moet slagen

### Mobile UX-patronen
- Touch targets minimaal 44px
- Swipe-interacties voor navigatie (carousel, kaarten)
- Bottom navigation voor hoofdnavigatie
- Pull-to-refresh waar van toepassing
- Geen hover-states, alleen tap/press
- Skeleton loading states

### Bestaand prototype als basis
- `docs/design/prototypes/ti-mobile-carousel.html` (2553 regels) is het visuele uitgangspunt
- Dark theme, swipeable carousel, spelerskaarten met kleur-indicatoren
- UX-team moet dit prototype reviewen en bijwerken voordat implementatie start

### Handshake met UX-team
Voordat implementatie begint:
1. UX-designer reviewt dit design doc
2. UX-designer maakt wireframes voor alle 8 mobile pagina's
3. Frontend-implementatie volgt pas na UX-goedkeuring per pagina
4. Visual regression tests worden toegevoegd per component

---

## 6. Agent-scheiding

### Mapstructuur als waarheid

```
src/app/(teamindeling)/          # mobile versie
src/app/(teamindeling-studio)/   # desktop versie
src/lib/teamindeling/            # gedeelde data-laag
src/components/teamindeling/
    ├── mobile/                  # mobile-only
    ├── studio/                  # desktop-only
    └── shared/                  # gedeeld
```

### Agent-toewijzing

| Agent | Mobile | Studio | Gedeeld |
|---|---|---|---|
| `ux-designer` | Design, prototypes | Bestaande UI bewaken | Design system |
| `frontend` | Bouwt mobile componenten | Onderhoudt studio UI | Shared components |
| `ontwikkelaar` | Server actions, API | Bestaande backend | `src/lib/teamindeling/` |
| `team-planner` | - | Workflow expert | - |
| `regel-checker` | Scope-validatie | Scenario-validatie | Gedeelde regels |

### Documentatie-updates nodig

1. **CLAUDE.md** — route-tabel, structuurbeschrijving, agent-skills bijwerken
2. **`rules/teamindeling-scheiding.md`** — nieuw bestand met scheiding-regels
3. **Agent frontmatter** — skills-lijsten bijwerken waar nodig
4. **Start skill** — domeincontext uitbreiden met mobile/studio onderscheid

### Vuistregels voor agents

- Werk je in `(teamindeling)` of `components/teamindeling/mobile/` → je werkt aan de **mobile versie**
- Werk je in `(teamindeling-studio)` of `components/teamindeling/studio/` → je werkt aan de **desktop versie**
- Werk je in `src/lib/teamindeling/` of `components/teamindeling/shared/` → je werkt aan de **gedeelde laag**
- Mobile bevat **nooit** drag & drop of scenario-editing
- Studio bevat **nooit** mobile-specifieke componenten
- Alle Prisma queries en server actions staan in `src/lib/teamindeling/`, nooit in pagina-bestanden

---

## 7. Migratiestrategie

### Stap 1: Hernoemen (geen functionaliteitswijziging)
- `(teamindeling)` → `(teamindeling-studio)` (route group mapnaam)
- `teamindeling/` subfolder → `ti-studio/` (URL-pad)
- Alle imports en verwijzingen bijwerken
- Portaal-links en navigatie bijwerken naar `/ti-studio/*`
- Testen dat studio identiek werkt op het nieuwe pad

### Stap 2: Gedeelde laag extraheren
- Prisma queries uit pagina's naar `src/lib/teamindeling/queries/`
- Server actions naar `src/lib/teamindeling/actions/`
- Types en validatie naar `src/lib/teamindeling/`

### Stap 3: Autorisatiemodel
- Prisma migratie voor TIScope, TIScopeRegel, TIScopeToewijzing, ScenarioDeling
- `scopeFilter()` en `magScenarioZien()` implementeren
- Beheer-pagina voor scope-inrichting

### Stap 4: Mobile app bouwen
- UX-wireframes per pagina (handshake met UX-team)
- MobileShell layout
- Pagina voor pagina implementeren, steeds met UX-review
- E2E tests per pagina

### Stap 5: Documentatie & agents
- CLAUDE.md, rules, agent-definities bijwerken
- Start skill uitbreiden
- Alle agents testen op correcte scheiding

---

## 8. Signaal- en actiesysteem (nog uit te werken)

Dit wordt de kern van de mobile app en mogelijk het belangrijkste onderdeel van het hele indelingsproces. Nog niet concreet genoeg voor implementatie — krijgt een eigen design-ronde.

### Wat we weten

**Het basisprincipe:**
- De default-status van elke speler en coach is **stabiel**: gaat door en zit op het juiste niveau
- Alles wat afwijkt van stabiel is een **signaal**: stopt, twijfelt, verkeerd niveau, coach vertrekt, etc.
- Elk signaal vereist een **actie**: gesprek voeren, alternatief zoeken, team aanpassen
- Elke actie heeft een **gevolg**: het resultaat van de actie (besluit, nieuwe situatie)

**Domino-effecten:**
- Acties kunnen doelgroep-overstijgend doorwerken
- Voorbeeld: speler X (U13) stopt → team U13-1 heeft tekort → speler Y (U11) wordt opgetrokken → team U11-2 heeft tekort → werving nodig
- De volgorde van acties is belangrijk — sommige acties moeten eerst afgerond zijn voordat andere zinvol zijn
- Het systeem moet deze ketens zichtbaar maken

**Speler-indicatoren:**
- Pinnen van spelers (markeren voor aandacht)
- Statussen die de workflow weergeven (niet besproken → gezien → besproken → besluit)
- Notities en actiepunten bij spelers

**Uitvragen:**
- TC kan coördinatoren/trainers vragen om input over specifieke spelers
- Vergelijkbaar met evaluatie-uitnodigingen, maar dan gericht op indelingsvragen
- "Wat is jouw beeld van speler X?" → reactie/beoordeling

### Wat nog uitgezocht moet worden

- Exacte statusmodel (welke statussen, welke overgangen)
- Hoe domino-ketens worden gemodelleerd (graaf, lijst, handmatig?)
- Hoe uitvragen werken (push-notificatie? email? in-app?)
- Verhouding tot bestaande Signalering-tabel in de Monitor (retentierisico)
- Verhouding tot bestaande Werkitem/Actiepunt-modellen in Team-Indeling
- Wie mag signalen aanmaken (alleen TC, of ook coördinatoren?)

### Impact op de mobile app

Dit systeem wordt de primaire reden dat mensen de mobile app openen. De features uit sectie 2 (teams bekijken, scenario review) zijn nuttig maar ondersteunend. Het signaal- en actiesysteem is waar de dagelijkse TC-workflow in leeft.

De eerste implementatiefasen (stap 1-3) kunnen zonder dit systeem door. Het signaal/actie-systeem komt in een latere fase met een eigen design-ronde.

---

## Besluitenlog

| Besluit | Reden |
|---|---|
| Twee route groups i.p.v. een | Maximale duidelijkheid voor agents en ontwikkelaars |
| `(teamindeling)` = mobile, `(teamindeling-studio)` = desktop | "teamindeling" is wat iedereen kent, mobile is de default |
| Geen subdomein, gewoon `/ti-studio/*` | Simpeler, geen middleware nodig, studio krijgt straks dezelfde dark look & feel |
| Scope-model met regels i.p.v. harde rollen | TC wil flexibel inrichten wie wat ziet, exacte regels nog niet concreet |
| Scenario-deling als apart model | Scenario-toegang is altijd expliciet, niet via scope |
| UX-handshake verplicht voor mobile | Design quality is een harde eis |
| Signaal/actie-systeem apart uitwerken | Te belangrijk en te complex om nu mee te nemen, krijgt eigen design-ronde |
