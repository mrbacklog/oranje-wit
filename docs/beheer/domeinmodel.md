# Beheer-app — Domeinmodel

> **App**: `apps/beheer/` (poort 4108, beheer.ckvoranjewit.app)
> **Eigenaar**: Technische Commissie (TC)
> **Status**: Sprint 1 af (Jeugdontwikkeling/Raamwerk actief), overige domeinen placeholder

---

## Kernprincipe

Het beheer-paneel is het **TC-domein** — het bureau van de technische commissie. De 9 domeinen zijn de verantwoordelijkheden van de TC. Andere apps (monitor, evaluatie, scouting, team-indeling) zijn voor iedereen; beheer is exclusief TC.

De beheer-app is georganiseerd per **verenigingsdomein**, niet per app. Elk domein is een sidebar-sectie. Nieuw domein toevoegen = nieuwe sectie, geen herstructurering.

---

## De 9 domeinen

De volgorde is de sidebar-volgorde: eerst het seizoen plannen, dan de operatie, dan het inhoudelijke beleid, dan groei, dan techniek, dan terugkijken.

### 1. Jaarplanning

| | |
|---|---|
| **Wat** | Het korfbaljaar vastleggen, mijlpalen, checklists |
| **Routes** | `/jaarplanning/kalender`, `/jaarplanning/mijlpalen` |
| **Status** | Placeholder |
| **Gebruikt door** | Alle domeinen (ruggengraat van het seizoen) |

De jaarkalender is de centrale planning waarop alle andere domeinen inhaken:
- Competitieperiodes (veld najaar, zaal, veld voorjaar)
- Evaluatiemomenten
- Scouting-rondes
- Teamindeling deadlines
- Key dates (seizoensstart, wedstrijdprogramma, etc.)

Mijlpalen en checklists worden per fase gedefinieerd. Wordt gemigreerd vanuit de team-indeling instellingen (`Mijlpaal` model).

### 2. Roostering

| | |
|---|---|
| **Wat** | Operationele training- en wedstrijdplanning |
| **Routes** | `/roostering/trainingen`, `/roostering/wedstrijden` |
| **Status** | Placeholder |
| **Gebruikt door** | (toekomstige roostering-app of module) |

Welk team traint wanneer, op welk veld of in welke zaal. Wedstrijdschema's voor veld- en zaalcompetitie. Later: oefenwedstrijden, veld-/zaalbeheer, tijdslots.

**Scheiding met Jaarplanning**: Jaarplanning is strategisch (wanneer begint de competitie?), Roostering is operationeel (welk team speelt waar om hoe laat?).

### 3. Teams & Leden

| | |
|---|---|
| **Wat** | Centraal: Sportlink-sync, altijd actuele waarheid |
| **Routes** | `/teams`, `/teams/sync` |
| **Status** | Placeholder |
| **Gebruikt door** | Alle apps (monitor, team-indeling, evaluatie, scouting) |

In Sportlink staat altijd de actuele teamindeling en ledenadministratie. Het kan wenselijk zijn om gedurende een seizoen een paar keer een sync uit te voeren om recente wijzigingen door te voeren: nieuwe leden, nieuwe teams, andere staf.

Teams & Leden is **altijd op basis van het NU** — het is de actuele waarheid die door alle andere domeinen wordt gelezen.

### 4. Jeugdontwikkeling

| | |
|---|---|
| **Wat** | Vaardigheidsraamwerk, progressie, Inside Out, USS-parameters |
| **Routes** | `/jeugd/raamwerk`, `/jeugd/progressie`, `/jeugd/uss` |
| **Status** | **Actief** (raamwerk met 94 items geseeded) |
| **Gebruikt door** | Scouting-app, evaluatie-app, spelerskaart |

Het vaardigheidsraamwerk is het jeugdontwikkelingsbeleid in de praktijk. Het definieert:
- **Pijlers** per leeftijdsgroep (Inside Out: van 3 pijlers bij Blauw tot 7 bij Rood)
- **Ontwikkelitems** (de vragen/beoordelingscriteria)
- **Schalen** per band (duim, smiley, sterren, slider)
- **USS-parameters** (Geunificeerde Score Schaal, 0-200)

Scouting en evaluatie zijn **instrumenten** die het raamwerk toepassen. Het raamwerk zelf hoort bij Jeugdontwikkeling.

**Database-modellen**: `RaamwerkVersie`, `Leeftijdsgroep`, `Pijler`, `OntwikkelItem` (tabellen: `raamwerk_versies`, `leeftijdsgroepen`, `pijlers`, `ontwikkel_items`).

### 5. Scouting

| | |
|---|---|
| **Wat** | Scout-accounts beheren |
| **Routes** | `/scouting/scouts` |
| **Status** | Placeholder |
| **Gebruikt door** | Scouting-app |

Beheer van scout-accounts, rollen (SCOUT/TC), XP en voortgang. De scouting-items (vragen) worden beheerd onder Jeugdontwikkeling, niet hier.

### 6. Evaluatie

| | |
|---|---|
| **Wat** | Rondes, coordinatoren, e-mail templates |
| **Routes** | `/evaluatie/rondes`, `/evaluatie/coordinatoren`, `/evaluatie/templates` |
| **Status** | Placeholder (Sprint 3: migratie vanuit evaluatie-app `/admin/`) |
| **Gebruikt door** | Evaluatie-app |

Wordt gemigreerd vanuit `apps/evaluatie/src/app/admin/`. De evaluatie-items komen uit het raamwerk (Jeugdontwikkeling).

### 7. Werving

| | |
|---|---|
| **Wat** | Sales-funnel: Aanmelding → Proefles → Intake → Lid |
| **Routes** | `/werving/aanmeldingen`, `/werving/funnel` |
| **Status** | Placeholder |
| **Gebruikt door** | (nieuw) |

Aanmeldingen moeten in de gaten worden gehouden. Dit is een sales-funnel met checks en handoffs tussen ledenadmin, trainer en TC. Elke stap heeft een verantwoordelijke en een deadline.

### 8. Systeem

| | |
|---|---|
| **Wat** | Gebruikers, rollen, technische import |
| **Routes** | `/systeem/gebruikers`, `/systeem/import` |
| **Status** | **Actief** (gebruikersbeheer + import-historie) |
| **Gebruikt door** | Alle apps |

Vervangt de hardcoded allowlist in `packages/auth/src/allowlist.ts`. Gebruikersbeheer met roltoewijzing (EDITOR, REVIEWER, VIEWER) en scout-rollen.

### 9. Archivering

| | |
|---|---|
| **Wat** | Teamhistorie, resultaten per seizoen (frozen/read-only) |
| **Routes** | `/archief/teams`, `/archief/resultaten` |
| **Status** | Placeholder |
| **Gebruikt door** | Monitor (historische dashboards) |

Afgeronde seizoenen worden bevroren. Teams, resultaten en evaluaties uit het verleden veranderen niet meer. De archivering biedt een read-only weergave van historische data.

---

## Relatie met apps

Elk domein heeft een admin-sectie in beheer en kan een of meer dagelijkse apps bedienen:

```
Domein                    Admin (beheer)           Dagelijks gebruik (apps)
───────────────────────   ──────────────────────   ─────────────────────────
Jaarplanning              Kalender, mijlpalen      Alle apps lezen planning
Roostering                Schema's, velden         (toekomstige app)
Teams & Leden             Sportlink sync           Monitor, Team-Indeling
Jeugdontwikkeling         Raamwerk, USS            Scouting, Evaluatie
Scouting                  Scout-accounts           Scouting-app
Evaluatie                 Rondes, templates        Evaluatie-app
Werving                   Funnel, aanmeldingen     (nieuw)
Systeem                   Gebruikers, import       Alle apps
Archivering               Teamhistorie             Monitor
```

---

## Temporeel model

```
Seizoen 2025-2026 (ACTIEF — huidig)
  ├── Teams spelen (Teams & Leden: actueel)
  ├── Evaluaties worden uitgevoerd (Evaluatie: voor volgend seizoen)
  ├── Scouting-missies actief (Scouting: voor volgend seizoen)
  └── Monitor toont live data

Seizoen 2026-2027 (VOORBEREIDING — komend)
  ├── Raamwerk wordt opgesteld (Jeugdontwikkeling)
  ├── Team-indeling is de workspace
  └── Jaarplanning wordt voorbereid

Seizoen 2024-2025 (AFGEROND — archief)
  ├── Alle data is frozen/read-only
  └── Archivering toont historische data
```

**Evaluaties en scouting dienen het komende seizoen maar worden uitgevoerd tijdens het huidige.**
