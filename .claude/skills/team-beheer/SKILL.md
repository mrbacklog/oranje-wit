---
name: team-beheer
description: Start een Agent Team voor het bouwen van de beheer-app backend. Bouwt server actions, data-modellen, API's en contracttypes voor alle 9 TC-domeinen. Levert een handshake af voor team-ux (frontend/PWA). Gebruik voor backend-development, domein-fundament, cross-app integratie en interactietests.
disable-model-invocation: true
argument-hint: "<domein of taak, bijv. 'jaarplanning fundament' of 'systeem gebruikersbeheer' of 'alle domeinen inventarisatie'>"
---

# Agent Team: Beheer (Backend)

Start een agent team voor het bouwen van de **backend** van het TC beheer-paneel (`apps/web/src/app/(beheer)/beheer/`, poort 4108). Dit team bouwt server actions, data-modellen, Prisma migraties, validatieregels en contracttypes. Het team levert een heldere **handshake** af voor `/team-ux` dat de frontend/PWA bouwt.

## Scope: Backend + Data + Integratie

Dit team doet **WEL**:
- Prisma schema-wijzigingen en migraties
- Server actions (CRUD, validatie, lifecycle)
- Contracttypes in `@oranje-wit/types` (interface tussen beheer en andere apps)
- Cross-app integratiecode (bijv. `getScoutingConfig()` in scouting-app)
- Interactietests (beheer-actie → effect in andere app)
- Seed-scripts voor testdata
- Auth guards en middleware
- Documentatie van API's en data-modellen

Dit team doet **NIET**:
- Visueel design, componenten, styling → dat doet `/team-ux`
- Dark theme, animaties, PWA → dat doet `/team-ux`
- Pixel-perfect implementatie → dat doet `/team-ux`

## Handshake met team-ux

Per domein levert team-beheer op:

```
Handshake-bestand: apps/web/src/app/(beheer)/beheer/src/app/<domein>/HANDSHAKE.md

Inhoud:
  1. Server actions: functienaam, parameters, return type
  2. Data types: TypeScript interfaces voor de UI
  3. Validatieregels: welke errors/warnings de UI moet tonen
  4. Autorisatie: welke rol nodig is
  5. Synergie: welke andere domeinen data leveren/consumeren
```

Team-ux leest de HANDSHAKE.md en bouwt de visuele laag erop.

## Referentiedocumenten

**VERPLICHT lezen bij start:**
- `docs/beheer/domeinmodel.md` — 9 TC-domeinen, verantwoordelijkheden, synergie
- `rules/beheer.md` — Ubiquitous language, domein-afbakening, temporeel model
- `docs/beheer/portaal-visie.md` — Portaal-concept, autorisatie per rol

## Team samenstelling

### Lead: ontwikkelaar
- **Rol**: Technisch architect + backend builder
- **Verantwoordelijkheden**:
  - Bewaakt dat de 9 domeinen technisch samenhangen
  - Bouwt gedeelde patronen (CRUD actions, auth guards, validatie)
  - Schrijft Prisma migraties en seed-scripts
  - Zorgt voor consistentie in server actions en Prisma queries
  - Schrijft HANDSHAKE.md per domein voor team-ux
  - Escaleert domein-vragen naar korfbal

### Teammate 1: regel-checker
- **Rol**: Domein-validatie en regelhandhaving
- **Verantwoordelijkheden**:
  - Valideert dat elk domein de juiste data-grenzen respecteert
  - Checkt ubiquitous language (rules/beheer.md)
  - Bewaakt het temporeel model (frozen seizoenen, schrijfrechten)
  - Valideert dat raamwerk-items alleen in Jeugdontwikkeling worden beheerd
  - Reviewt contracttypes op backward compatibility

### Teammate 2: e2e-tester
- **Rol**: Interactietests + kwaliteitsborging
- **Verantwoordelijkheden**:
  - Schrijft unit tests voor cross-app interactie (CT-*, SZ-*, GB-*)
  - Test dat beheer-acties correct doorwerken in andere apps
  - Verifieert dat de build groen blijft na elke domein-toevoeging
  - Schrijft seed-data helpers voor testomgevingen

### Teammate 3: korfbal (on-demand)
- **Rol**: Domein-expert
- **Verantwoordelijkheden**:
  - Adviseert over korfbal-specifieke data-modellen
  - Valideert dat Jaarplanning de juiste competitieperiodes kent
  - Adviseert over Roostering (veld/zaal, trainingsschema's)
  - Bewaakt de Oranje Draad in alle domeinen

## De 9 domeinen

Volgorde = sidebar-volgorde = bouwvolgorde.

### 1. Jaarplanning (`/jaarplanning/`)
- **Data**: Lees bestaande `Seizoen` tabel + nieuw `SeizoenStatus` veld
- **Actions**: seizoenen-CRUD, status lifecycle (VOORBEREIDING→ACTIEF→AFGEROND)
- **Synergie**: Ruggengraat — alle andere domeinen lezen het actieve seizoen

### 2. Roostering (`/roostering/`)
- **Data**: Nieuw model nodig (later), nu leest teams
- **Actions**: Placeholder — afhankelijk van Jaarplanning en Teams
- **Synergie**: Leest teams uit Teams & Leden

### 3. Teams & Leden (`/teams/`)
- **Data**: Lees bestaande `OWTeam` + `Lid` tabellen
- **Actions**: Sportlink sync trigger, team-overzicht
- **Synergie**: Bron voor Roostering, Scouting, Evaluatie, Archivering

### 4. Jeugdontwikkeling (`/jeugd/`) — AL ACTIEF
- **Data**: `RaamwerkVersie`, `Leeftijdsgroep`, `Pijler`, `OntwikkelItem` (94 items)
- **Actions**: Raamwerk CRUD, validatie, publiceer-flow. USS-parameters nog te bouwen.
- **Synergie**: Scouting-app leest via `getScoutingConfig()`

### 5. Scouting (`/scouting/`)
- **Data**: Lees bestaande `Scout` tabel
- **Actions**: Scout-overzicht, XP/level data
- **Synergie**: Items uit Jeugdontwikkeling/Raamwerk

### 6. Evaluatie (`/evaluatie/`)
- **Data**: Bestaande evaluatie-modellen (EvaluatieRonde, Coordinator, etc.)
- **Actions**: Migreer vanuit `apps/web/src/app/(evaluatie)/evaluatie/src/app/admin/`
- **Synergie**: Items uit Jeugdontwikkeling (toekomst)

### 7. Werving (`/werving/`)
- **Data**: Nieuw `Aanmelding` model (status-enum: AANMELDING→PROEFLES→INTAKE→LID)
- **Actions**: Funnel CRUD, status-transitions, handoff-checks
- **Synergie**: Bij status=LID → koppeling naar Teams & Leden

### 8. Systeem (`/systeem/`)
- **Data**: Nieuw `Gebruiker` model (vervangt hardcoded allowlist)
- **Actions**: Gebruikers CRUD, rol-toewijzing
- **Synergie**: Autorisatie voor alle apps + portaal-tegels

### 9. Archivering (`/archief/`)
- **Data**: Lees afgeronde seizoenen uit bestaande tabellen
- **Actions**: Read-only queries, seizoen-freeze
- **Synergie**: Leest uit Teams & Leden + competitie_spelers

## Werkwijze

### Per domein:
```
1. ontwikkelaar leest docs/beheer/domeinmodel.md
2. ontwikkelaar bouwt:
   a. Prisma model (als nieuw data nodig is)
   b. Migratie draaien
   c. Server actions (CRUD + validatie)
   d. Contracttypes in @oranje-wit/types
   e. HANDSHAKE.md schrijven voor team-ux
3. regel-checker valideert domein-grenzen + ubiquitous language
4. e2e-tester schrijft interactietests
5. korfbal adviseert bij domein-vragen (on-demand)
```

### Cross-domein synergie:
```
Na elk domein:
  - Check: welke andere domeinen lezen/schrijven dezelfde data?
  - Check: zijn de contracttypes backward compatible?
  - Check: werkt de scouting-app nog? (getScoutingConfig)
  - Check: build groen? tests groen?
```

## Memory

Bij het starten MOET de lead:
1. `MEMORY.md` lezen (index)
2. `project_beheer_domeinen.md` lezen (9 domeinen, portaal, ubiquitous language)
3. `feedback_dark_design.md` lezen (weten dat frontend apart wordt gedaan)
4. Na afloop: nieuwe bevindingen opslaan als memory

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, start dan met een **inventarisatie**:
1. Lees alle 9 domein-placeholder pagina's in `apps/web/src/app/(beheer)/beheer/src/app/`
2. Inventariseer welke bestaande Prisma modellen per domein beschikbaar zijn
3. Bepaal per domein: wat is het minimale fundament (data + actions)?
4. Stel een bouwvolgorde voor op basis van synergie (welk domein moet eerst?)
5. Begin met het eerste domein en lever een HANDSHAKE.md op
