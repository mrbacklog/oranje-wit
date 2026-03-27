# Blauwdruk 2.0 — Totaalconcept

## Visie

De blauwdruk is het **seizoensplanningsinstrument** van de TC. Het begeleidt het hele traject van evaluatie tot publicatie van de teamindeling. De blauwdruk is geen losse vragenlijst — het is een levend dashboard dat voortgang, besluiten en openstaande acties verbindt.

---

## Anatomie van de blauwdruk

```
BLAUWDRUK (seizoen 2026-2027)
│
├── ❶ KADERS (settings)
│   Gestructureerde parameters die de teamindeling sturen.
│   Teamaantallen, selectiestructuur, bezettingsgraad, doorstroombeleid.
│   → Voeden direct de CategorieKaders en validatie-engine.
│   → Elk antwoord is een besluit met status (onduidelijk/voorlopig/definitief).
│
├── ❷ SPELERS GEZIEN
│   Elke speler moet beoordeeld worden: beschikbaar / onzeker / stop-signaal / stopt.
│   Voortgangsbalk: "142 van 180 gezien".
│   Doorstroom-signaleringen (leeftijdgebonden) als startpunt.
│   Geel/oranje → genereert actiepunt.
│
├── ❸ STAF
│   Aparte tab/pagina. Flow per stafpositie:
│   VACANT → KANDIDAAT → IN_GESPREK → TOEGEWEZEN → BEVESTIGD
│   Versneld: directe aanwijzing (VACANT → BEVESTIGD).
│   Voortgang: "18 van 22 posities ingevuld".
│
├── ❹ TEAMS
│   Team-ambitie als veld op het team.
│   Referentieteams vorig seizoen als uitgangspunt.
│   Pins (bevestigde feiten) die alle scenario's raken.
│
├── ❺ SCENARIO'S
│   Concrete teamindelingen (bestaand). Drag-and-drop.
│   Validatie tegen kaders uit ❶.
│
└── ❻ VOORTGANG
    Mijlpalen als processtappen (jaarplanning-breed, niet blauwdruk-exclusief).
    Actielijst (ook jaarplanning-breed).
    Besluitenoverzicht met status-voortgang.
```

---

## ❶ Kaders (de standaardvragenset)

### Principe
Geen vrije tekst. Elke vraag heeft een gestructureerd antwoordtype (GETAL, JA_NEE, KEUZE, GETAL_RANGE). Antwoorden sturen direct de CategorieKaders en validatie-engine aan.

### Vraaggroepen

**Groep 1 — Teamaantallen** (5 vragen, GETAL)
Hoeveel teams per categorie? Dit is het vertrekpunt waarop alle vervolgvragen afhangen.

| Code | Vraag |
|---|---|
| `TEAMS_SENIOREN_A` | Hoeveel A-categorie seniorenteams? |
| `TEAMS_SENIOREN_B` | Hoeveel B-categorie seniorenteams? |
| `TEAMS_U19` | Hoeveel U19 teams? |
| `TEAMS_U17` | Hoeveel U17 teams? |
| `TEAMS_U15` | Hoeveel U15 teams? |

**Groep 2 — Selectiestructuur** (15 vragen, conditioneel op teamaantal)
Per categorie met ≥2 teams hetzelfde patroon:

1. Is er een selectie bij seizoensstart? → JA_NEE
2. Samenstelling vooraf bekendgemaakt of selectie gedurende seizoen? → KEUZE
3. Afvallers verwacht waarvoor plek vrijhouden? → JA_NEE

Herhaalt voor: Senioren 1e selectie (≥3 A-teams), Senioren 2e selectie (≥4 A-teams), U19, U17, U15.

**Groep 3 — Bezettingsgraad** (14 vragen, GETAL_RANGE)
Per teamtype: ideaal M / ideaal V / afwijking ±.
Defaults voorgevuld uit OW-voorkeuren. TC hoeft alleen af te wijken.
→ Stuurt direct `updateCategorieKaders()` aan.
→ BlauwdrukBesluit dient als audit-trail (waarom afwijken).

Conditioneel: selectie-bezetting verschijnt alleen als die selectie actief is.

**Groep 4 — Doorstroom en beleid** (3 vragen, JA_NEE)
Vervroegd doorstromen, dubbelspelen, terugstromen.

### Conditionele logica
Elke StandaardVraag krijgt een `toonAls` veld:
```json
{ "code": "TEAMS_U15", "operator": ">=", "waarde": 2 }
```
Client-side evaluatie: vraag is verborgen als conditie niet klopt.

### Status per besluit
Elk antwoord is een besluit: ONDUIDELIJK → VOORLOPIG → DEFINITIEF.
Voortgangsbalk: "X van Y definitief".

---

## ❷ Spelers gezien

### Principe
De blauwdruk is pas compleet als elke speler is beoordeeld.

### Statussen
| Status | Kleur | Betekenis | Genereert actie? |
|---|---|---|---|
| ONGEZIEN | Grijs | Nog niet bekeken | Nee |
| GROEN | Groen | Beschikbaar, geen twijfel | Nee |
| GEEL | Geel | Onzeker, moet uitgezocht | Ja → actiepunt |
| ORANJE | Oranje | Stop-signalen | Ja → actiepunt |
| ROOD | Rood | Stopt definitief | Nee (eindstatus) |

### Auto-signalering bij start
Bij initialisatie worden automatisch gedetecteerd:
- Spelers die hun U-team moeten verlaten (leeftijd)
- Spelers die naar senioren gaan
- Spelers die van kleur wisselen
- Spelers die al als "gaat stoppen" gemarkeerd staan → direct ROOD

### Retentie (zacht)
Groepssignaal: "12 spelers met verhoogd retentierisico — check status".
Geen individuele rode vlaggen maar een actiepunt op groepsniveau.

### Ledenbestand-updates
Bij nieuwe Sportlink import: nieuwe/verdwenen spelers als actiepunt signaleren.

---

## ❸ Staf

### Principe
Aparte tab/pagina in de blauwdruk. Staf-toewijzing is een flow, geen enkele vraag.

### Flow per positie
```
VACANT → KANDIDAAT → IN_GESPREK → TOEGEWEZEN → BEVESTIGD
```

**Versneld**: directe aanwijzing skipt de tussenstappen (VACANT → BEVESTIGD).

### Posities
Per team in de blauwdruk wordt automatisch een set posities aangemaakt op basis van de teamstructuur:
- Hoofdtrainer (verplicht)
- Assistent-trainer (optioneel, afhankelijk van categorie)
- Teammanager (optioneel)

### Voortgang
"18 van 22 posities ingevuld" als voortgangsbalk.
Vacatures zonder kandidaat → oranje signaal.
Teams zonder hoofdtrainer → rood signaal (blocker).

### Koppeling met blauwdruk
Bevestigde staf wordt een Pin (STAF_POSITIE) die doorwerkt in alle scenario's.

---

## ❹ Teams

### Team-ambitie
Elk team in de blauwdruk krijgt een ambitieveld:

| Ambitie | Betekenis |
|---|---|
| PROMOTIE | Streven naar hoger niveau |
| HANDHAVING | Huidige niveau behouden |
| ONTWIKKELING | Focus op spelerontwikkeling, resultaat secundair |
| PLEZIER | Focus op plezier en participatie |

Dit is een gestructureerd veld op het Team-model (geen vrije tekst).
De ambitie bepaalt mede de selectiecriteria en POP-ratio weging.

### Referentieteams
Vorig seizoen als uitgangspunt. Welke teams bestonden, hoeveel spelers, welk niveau.

### Pins
Bevestigde feiten die alle scenario's raken:
- Speler X speelt bij Senioren 1 (SPELER_POSITIE)
- Trainer Y traint U15-1 (STAF_POSITIE, vanuit staf-flow)
- Speler Z stopt (SPELER_STATUS, vanuit gezien-flow)

---

## ❺ Scenario's
Bestaande functionaliteit. Drag-and-drop teamindeling.
Validatie nu versterkt door:
- Bezettingsgraad uit kaders (❶)
- Gezien-status (❷) — ongeziene spelers markeren
- Staf-status (❸) — teams zonder bevestigde trainer markeren
- Team-ambitie (❹) — weging bij validatie

---

## ❻ Voortgang (toekomstig: coördinatielaag)

### Mijlpalen
De 14 processtappen van het seizoensplanningsproces:

1. 1e evaluatie
2. 2e evaluatie
3. Blauwdruk formuleren
4. Gesprekken coordinator/trainers
5. Trainers ambities vastleggen
6. Speler-inventarisatie (gezien worden)
7. Teamkernen bouwen
8. Stafkernen opzetten
9. Scenario's bouwen
10. TC-doelgroepoverleggen
11. Actielijsten uitwerken
12. Concept delen en teams bevriezen
13. Publicatie pre-season teamindeling
14. Trainingsplan/concept vastleggen

> **Let op**: mijlpalen zijn jaarplanning-breed, niet blauwdruk-exclusief.
> Ze horen uiteindelijk in de coördinatielaag (app-generiek).

### Actielijst en besluiten
Eveneens jaarplanning-breed. Worden vanuit de blauwdruk gevuld maar zijn niet exclusief eigendom van de blauwdruk.

### Notificaties (toekomstig)
Signaleren wanneer actie vereist is: deadline nadert, status wijzigt, nieuwe speler gedetecteerd.

---

## Datamodel-impact

### Bestaand (gebouwd in Sprint 1-3)
| Model | Status |
|---|---|
| `BlauwdrukSpeler` (gezien-status) | ✅ Gebouwd, migratie live |
| `BlauwdrukBesluit` (besluitenlijst) | ✅ Gebouwd, migratie live |
| `StandaardVraag` (vragenset-beheer) | ✅ Gebouwd, migratie live |
| `GezienStatus` enum | ✅ Gebouwd |
| `BesluitStatus` / `BesluitNiveau` enums | ✅ Gebouwd |
| `Rol.COORDINATOR` | ✅ Gebouwd |
| `Gebruiker.doelgroepen` | ✅ Gebouwd |

### Nog te bouwen
| Model/uitbreiding | Onderdeel | Prioriteit |
|---|---|---|
| `antwoordType` + `toonAls` op BlauwdrukBesluit/StandaardVraag | Kaders (❶) | Hoog |
| Seed-data standaardvragen (~40 vragen) | Kaders (❶) | Hoog |
| `StafPositie` model met flow-status | Staf (❸) | Hoog |
| `Team.ambitie` veld (enum) | Teams (❹) | Middel |
| Coördinatielaag (generieke besluiten/acties/mijlpalen/notificaties) | Voortgang (❻) | Apart traject |

---

## Pagina-structuur blauwdruk

```
/blauwdruk
├── Tab: Categorieën          (bestaand)
├── Tab: Gezien               (Sprint 1 ✅)
├── Tab: Besluiten/Kaders     (Sprint 2 ✅, UI uitbreiden met antwoordtypes)
├── Tab: Staf                 (nieuw: staf-flow)
├── Tab: Uitgangspositie      (bestaand: referentieteams)
├── Tab: Leden                (bestaand: ledendashboard)
├── Tab: Werkbord             (bestaand, toekomstig → coördinatielaag)
├── Tab: Pins                 (bestaand)
└── Tab: Toelichting          (bestaand)
```
