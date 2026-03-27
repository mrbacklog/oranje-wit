# Standaardvragen Seizoensblauwdruk

Ontwerpdocument voor de jaarlijks terugkerende vragenset bij het opstellen van de teamindeling-blauwdruk.

## Uitgangspunten

- **Geen vrije tekst** waar gestructureerde invoer mogelijk is
- **Conditioneel**: vragen verschijnen op basis van eerdere antwoorden
- **Bezettingsgraad** stuurt direct de CategorieKaders aan (geen dubbele opslag)
- **Besluit per vraag**: status (ONDUIDELIJK → VOORLOPIG → DEFINITIEF)
- Standaardset is elk jaar hetzelfde; TC kan extra vragen toevoegen

---

## Groep 1: Teamaantallen

Basis voor alle vervolgvragen. Antwoordtype: GETAL.

| Code | Vraag | Niveau | Doelgroep |
|---|---|---|---|
| `TEAMS_SENIOREN_A` | Hoeveel A-categorie seniorenteams? | TECHNISCH | SENIOREN |
| `TEAMS_SENIOREN_B` | Hoeveel B-categorie seniorenteams? | TECHNISCH | SENIOREN |
| `TEAMS_U19` | Hoeveel U19 teams? | TECHNISCH | SENIOREN |
| `TEAMS_U17` | Hoeveel U17 teams? | TECHNISCH | JUNIOREN |
| `TEAMS_U15` | Hoeveel U15 teams? | TECHNISCH | ASPIRANTEN |

---

## Groep 2: Selectiestructuur

Conditioneel: verschijnt alleen als het teamaantal >= 2 in de betreffende categorie.

### 2A. Senioren 1e selectie

**Conditie**: `TEAMS_SENIOREN_A >= 3`

| Code | Vraag | Type | Opties |
|---|---|---|---|
| `SELECTIE_SEN1_ACTIEF` | Is er een 1e senioren selectie (Sen 1 + Sen 2) bij seizoensstart? | JA_NEE | — |
| `SELECTIE_SEN1_COMMUNICATIE` | Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen? | KEUZE | Vooraf bekendgemaakt / Selectie gedurende seizoen |
| `SELECTIE_SEN1_AFVALLERS` | Worden er afvallers verwacht waarvoor een passende plaats moet worden vrijgehouden? | JA_NEE | — |

### 2B. Senioren 2e selectie

**Conditie**: `TEAMS_SENIOREN_A >= 4`

| Code | Vraag | Type | Opties |
|---|---|---|---|
| `SELECTIE_SEN2_ACTIEF` | Is er een 2e senioren selectie bij seizoensstart? Zo ja, welke 2 A-categorie teams? | JA_NEE | — |
| `SELECTIE_SEN2_COMMUNICATIE` | Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen? | KEUZE | Vooraf bekendgemaakt / Selectie gedurende seizoen |
| `SELECTIE_SEN2_AFVALLERS` | Worden er afvallers verwacht waarvoor een passende plaats moet worden vrijgehouden? | JA_NEE | — |

### 2C. U19 selectie

**Conditie**: `TEAMS_U19 >= 2`

| Code | Vraag | Type | Opties |
|---|---|---|---|
| `SELECTIE_U19_ACTIEF` | Is er een U19 selectie (U19-1 + U19-2) bij seizoensstart? | JA_NEE | — |
| `SELECTIE_U19_COMMUNICATIE` | Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen? | KEUZE | Vooraf bekendgemaakt / Selectie gedurende seizoen |
| `SELECTIE_U19_AFVALLERS` | Worden er afvallers verwacht waarvoor een passende plaats moet worden vrijgehouden? | JA_NEE | — |

### 2D. U17 selectie

**Conditie**: `TEAMS_U17 >= 2`

| Code | Vraag | Type | Opties |
|---|---|---|---|
| `SELECTIE_U17_ACTIEF` | Is er een U17 selectie (U17-1 + U17-2) bij seizoensstart? | JA_NEE | — |
| `SELECTIE_U17_COMMUNICATIE` | Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen? | KEUZE | Vooraf bekendgemaakt / Selectie gedurende seizoen |
| `SELECTIE_U17_AFVALLERS` | Worden er afvallers verwacht waarvoor een passende plaats moet worden vrijgehouden? | JA_NEE | — |

### 2E. U15 selectie

**Conditie**: `TEAMS_U15 >= 2`

| Code | Vraag | Type | Opties |
|---|---|---|---|
| `SELECTIE_U15_ACTIEF` | Is er een U15 selectie (U15-1 + U15-2) bij seizoensstart? | JA_NEE | — |
| `SELECTIE_U15_COMMUNICATIE` | Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen? | KEUZE | Vooraf bekendgemaakt / Selectie gedurende seizoen |
| `SELECTIE_U15_AFVALLERS` | Worden er afvallers verwacht waarvoor een passende plaats moet worden vrijgehouden? | JA_NEE | — |

---

## Groep 3: Bezettingsgraad

Deze vragen sturen direct de CategorieKaders aan. Het BlauwdrukBesluit dient als audit-trail (waarom afwijken van defaults).

Antwoordtype: GETAL_RANGE (ideaal M / ideaal V / afwijking +/- per geslacht).

### 3A. A-categorie selecties (geheel)

| Code | Categorie | Default M | Default V | Default afwijking |
|---|---|---|---|---|
| `BEZETTING_SEN_A_SELECTIE` | A-cat senioren selectie | 12 | 12 | ±3 |
| `BEZETTING_U19_SELECTIE` | U19 selectie | 10 | 10 | ±2 |
| `BEZETTING_U17_SELECTIE` | U17 selectie | 10 | 10 | ±2 |
| `BEZETTING_U15_SELECTIE` | U15 selectie | 10 | 10 | ±2 |

**Conditie**: verschijnt alleen als de bijbehorende selectie ACTIEF is.

### 3B. A-categorie teams (per team)

| Code | Categorie | Default M | Default V | Default afwijking |
|---|---|---|---|---|
| `BEZETTING_SEN_A_TEAM` | A-cat senioren per team | 6 | 6 | ±2 |
| `BEZETTING_U19_TEAM` | U19 per team | 5 | 5 | ±2 |
| `BEZETTING_U17_TEAM` | U17 per team | 5 | 5 | ±2 |
| `BEZETTING_U15_TEAM` | U15 per team | 5 | 5 | ±2 |

### 3C. B-categorie senioren

| Code | Categorie | Default M | Default V | Default afwijking |
|---|---|---|---|---|
| `BEZETTING_SEN_B_TEAM` | B-cat senioren per team | 5 | 5 | ±4 |

### 3D. B-categorie jeugd

| Code | Categorie | Spelvorm | Default M | Default V | Default afwijking |
|---|---|---|---|---|---|
| `BEZETTING_ROOD` | Rood | 8-tal | 5 | 5 | ±2 |
| `BEZETTING_ORANJE` | Oranje | 8-tal | 5 | 5 | ±2 |
| `BEZETTING_GEEL` | Geel | 8-tal | 5 | 5 | ±4 |
| `BEZETTING_GEEL_4` | Geel 4-korfbal | 4-tal | 3 | 3 | ±1 |
| `BEZETTING_GROEN` | Groen | 4-tal | 3 | 3 | ±1 |
| `BEZETTING_BLAUW` | Blauw | 4-tal | 3 | 3 | ±1 |

---

## Groep 4: Staf

Staf-inventarisatie als onderdeel van de blauwdruk. Niet per vraag maar als flow:
kandidaat → gesprek → toegewezen → bevestigd.

| Code | Vraag | Type |
|---|---|---|
| `STAF_INVENTARISATIE` | Welke trainers/coaches zijn beschikbaar komend seizoen? | FLOW (apart proces) |
| `STAF_TEKORTEN` | Voor welke teams is er een trainerstekort? | SIGNALERING (afgeleid) |
| `STAF_DUBBELROL` | Worden trainers ingezet bij meerdere teams? | JA_NEE |

> Staf-inventarisatie is een eigen flow, geen simpele vraag. De blauwdruk toont de status (X van Y teams hebben een trainer), de details leven in het staf-toewijzingsproces.

---

## Groep 5: Doorstroom en beleid

| Code | Vraag | Type | Opties |
|---|---|---|---|
| `DOORSTROOM_VERVROEGD` | Mogen spelers vervroegd doorstromen naar een hogere categorie? | JA_NEE | — |
| `DOORSTROOM_DUBBELSPELEN` | Is dubbelspelen toegestaan dit seizoen? | JA_NEE | — |
| `DOORSTROOM_TERUGSTROMEN` | Mag een speler terugstromen naar een lagere categorie? | JA_NEE | — |

---

## Conditionele logica (samenvatting)

| Vraag(groep) | Verschijnt als |
|---|---|
| Selectie Sen 1e | `TEAMS_SENIOREN_A >= 3` |
| Selectie Sen 2e | `TEAMS_SENIOREN_A >= 4` |
| Selectie U19 | `TEAMS_U19 >= 2` |
| Selectie U17 | `TEAMS_U17 >= 2` |
| Selectie U15 | `TEAMS_U15 >= 2` |
| Bezetting selectie | Bijbehorende `SELECTIE_*_ACTIEF == true` |
| Selectie communicatie/afvallers | Bijbehorende `SELECTIE_*_ACTIEF == true` |

---

## Antwoordtypes

| Type | Invoer | Voorbeeld |
|---|---|---|
| `GETAL` | Number input | 4 |
| `JA_NEE` | Toggle | Ja / Nee |
| `KEUZE` | Radio/select uit opties | "Vooraf bekendgemaakt" |
| `GETAL_RANGE` | 3× number (ideaal M / ideaal V / afwijking) | 6M / 6V / ±2 |

---

## Totaal: ~40 vragen

| Groep | Aantal | Conditioneel |
|---|---|---|
| Teamaantallen | 5 | Nee |
| Selectiestructuur | 15 | Ja (op teamaantal) |
| Bezettingsgraad | 14 | Deels (op selectie-actief) |
| Staf | 3 | Nee |
| Doorstroom/beleid | 3 | Nee |
| **Totaal** | **~40** | **~20 conditioneel** |

In de praktijk ziet de TC ~25 vragen (de rest is verborgen door condities).
