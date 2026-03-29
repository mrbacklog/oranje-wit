# Design: Signaal- en actiesysteem voor Team-Indeling

**Datum**: 2026-03-29
**Status**: Brainstorm-design, klaar voor review met product-owner
**Auteur**: Korfbal-technisch expert (korfbal-agent)
**Afhankelijk van**: `2026-03-28-teamindeling-scheiding-design.md`, `2026-03-29-what-if-model-design.md`

---

## Samenvatting

De TC van c.k.v. Oranje Wit mist een gestructureerd systeem om signalen (afwijkingen van "stabiel") te registreren, acties bij te houden, en domino-effecten door de indeling te volgen. Dit document ontwerpt dat systeem.

### Het basisprincipe

Elke speler en elke coach heeft een default-status: **stabiel**. Dat wil zeggen: gaat door naar volgend seizoen en zit op het juiste niveau. Alles wat daarvan afwijkt is een **signaal**. Elk signaal leidt tot een of meer **acties**. Acties kunnen weer nieuwe signalen opleveren -- dat is de **domino-keten**.

```
STABIEL is de norm
  |
  v
SIGNAAL: afwijking van stabiel
  |
  v
ACTIE: wat moet er gebeuren?
  |
  v
GEVOLG: nieuw signaal, what-if, of terug naar stabiel
```

### Waarom dit ertoe doet

De TC begint elk voorjaar met ~300 spelers en ~50 stafleden. Bij 10% afwijking (conservatief) zijn dat 30 signalen die parallel lopen, acties genereren, en door de hele indeling heen doorwerken. Zonder systeem verliest de TC het overzicht. Met systeem wordt de TC proactief in plaats van reactief.

---

## 1. Het statusmodel

### 1.1 Huidige situatie

Het Prisma-schema heeft twee gerelateerde statusmodellen:

**SpelerStatus** (op TeamSpeler en WhatIfTeamSpeler):
```
BESCHIKBAAR | TWIJFELT | GAAT_STOPPEN | NIEUW_POTENTIEEL | NIEUW_DEFINITIEF | ALGEMEEN_RESERVE
```

**GezienStatus** (op BlauwdrukSpeler):
```
ONGEZIEN | GROEN | GEEL | ORANJE | ROOD
```

### 1.2 Analyse: wat mist er?

De twee modellen overlappen en verwarren twee concepten:

- **SpelerStatus** gaat over de *beschikbaarheid* van een speler (gaat door, twijfelt, stopt)
- **GezienStatus** gaat over de *werkstatus* van de TC (hebben we deze speler al besproken?)

In de TC-werkwijze is het verschil cruciaal. Een speler kan BESCHIKBAAR zijn maar nog ONGEZIEN (we weten dat ze doorgaat, maar we hebben haar nog niet ingedeeld). Of TWIJFELT maar al GROEN in de indeling (we weten dat ze twijfelt, maar we hebben haar alvast ingedeeld en een actie lopen om het uit te zoeken).

### 1.3 Voorstel: twee assen, helder gescheiden

**As 1: Beschikbaarheidsstatus** (feitelijk: wat weten we over deze persoon?)

| Status | Betekenis | Voorbeeld |
|---|---|---|
| `STABIEL` | Gaat door, juist niveau, geen signalen | De default voor ~85% van de spelers |
| `TWIJFELT` | Speler heeft twijfels geuit of er zijn signalen | Lisa's moeder belde: "ze weet het nog niet" |
| `GAAT_STOPPEN` | Definitief besluit: stopt na dit seizoen | Klaas heeft het aan de trainer verteld |
| `NIEUW` | Nieuwe aanmelding, nog niet ingedeeld | Via proeftraining of schoolkorfbal |
| `WACHT_OP_INFO` | Er loopt een uitvraag, status onbekend | TC heeft de coordinator gevraagd om te polsen |
| `NIET_BESCHIKBAAR` | Blessure, verhuizing, tijdelijk weg | Geen signaal maar een feit |

Wijzigingen t.o.v. huidig:
- `BESCHIKBAAR` wordt `STABIEL` (beter TC-taalgebruik: "stabiel" is het woord dat de TC gebruikt)
- `NIEUW_POTENTIEEL` en `NIEUW_DEFINITIEF` worden samengevoegd tot `NIEUW` (het onderscheid tussen potentieel en definitief zit in het signaal, niet in de status)
- `ALGEMEEN_RESERVE` vervalt als status -- dit is een *plaatsing*, geen beschikbaarheid. Wordt opgelost via teamindeling (speler staat in reserve-pool)
- `WACHT_OP_INFO` is nieuw: er loopt een actie, resultaat nog onbekend
- `NIET_BESCHIKBAAR` is nieuw: feitelijke onbeschikbaarheid (niet hetzelfde als stoppen)

**As 2: Werkstatus** (proces: waar zijn we mee bezig?)

Blijft zoals het is (GezienStatus):
```
ONGEZIEN | GROEN | GEEL | ORANJE | ROOD
```

Dit is de TC-workflow: spelers doorlopen een triage-proces. GROEN = beschikbaar en ingedeeld. GEEL = er is een open punt. ORANJE = stop-signalen. ROOD = stopt definitief.

### 1.4 State machine: beschikbaarheidsstatus

```
           ┌──────────────────────────────────────┐
           |                                      |
           v                                      |
        STABIEL ──── signaal ──── TWIJFELT ──── GAAT_STOPPEN
           ^              |            |
           |              v            |
           |        WACHT_OP_INFO      |
           |              |            |
           |              v            |
           └── terug naar stabiel ─────┘
                    (gaat toch door)

        NIEUW ──── ingedeeld ──── STABIEL
                       |
                       v
                 (trekt zich terug) ──── GAAT_STOPPEN

        NIET_BESCHIKBAAR ──── hersteld/terug ──── STABIEL
```

### 1.5 Wie mag welke status zetten?

| Overgang | Mag gedaan worden door | Voorbeeld |
|---|---|---|
| naar TWIJFELT | TC, coordinator, automatisch (retentiedata) | Coordinator hoort van trainer dat Piet twijfelt |
| naar GAAT_STOPPEN | TC, coordinator | Definitief bericht van speler/ouder |
| naar STABIEL | TC, coordinator | Na gesprek: gaat toch door |
| naar NIEUW | Automatisch (nieuw lid in ledenbestand), TC | Fiedith meldt nieuw lid aan |
| naar WACHT_OP_INFO | Automatisch (bij aanmaken uitvraag) | TC stuurt uitvraag naar coordinator |
| naar NIET_BESCHIKBAAR | TC | Blessure, verhuizing |

### 1.6 Staf-status

Coaches en trainers hebben een vergelijkbaar maar eenvoudiger statusmodel:

| Status | Betekenis |
|---|---|
| `STABIEL` | Gaat door volgend seizoen |
| `TWIJFELT` | Onzeker of ze doorgaan |
| `STOPT` | Gaat stoppen |
| `NIEUW` | Nieuwe trainer (geworven) |
| `ONBEKEND` | Nog niet gepolst |

Dit is nieuw -- het huidige schema heeft geen staf-status. De what-if review noemde dit al als blinde vlek (R5). Een staf-signaal ("trainer U17 stopt") heeft net zoveel impact als een speler-signaal.

---

## 2. Signaalmodel

### 2.1 Wat is een signaal?

Een signaal is een geregistreerde afwijking van "stabiel". Het is geen alarm, het is een feit dat aandacht vereist.

Kenmerken van een signaal:
- Het gaat over een **entiteit** (speler, staf, of team)
- Het heeft een **type** (wat is er aan de hand?)
- Het heeft een **bron** (wie/wat heeft het gemeld?)
- Het heeft een **ernst** (hoe urgent?)
- Het kan een of meer **acties** hebben (wat moet er gebeuren?)
- Het kan leiden tot een **what-if** (wat zijn de gevolgen voor de indeling?)

### 2.2 Signaaltypen

| Type | Entiteit | Beschrijving | Voorbeeld |
|---|---|---|---|
| `SPELER_STOPT` | Speler | Speler gaat definitief stoppen | Klaas (Sen 3) zegt na het seizoen te stoppen |
| `SPELER_TWIJFELT` | Speler | Speler twijfelt over doorgaan | Lisa's moeder belt: "ze weet het niet" |
| `SPELER_NIVEAU` | Speler | Speler zit niet op juist niveau | Evaluatie: Tim scoort ver boven U15-2 niveau |
| `SPELER_NIEUW` | Speler | Nieuw lid aangemeld | Nieuw meisje (11 jaar) via schoolkorfbal |
| `SPELER_BLESSURE` | Speler | Langdurige blessure / onbeschikbaar | Kruisband, half jaar uit |
| `STAF_STOPT` | Staf | Trainer/coach gaat stoppen | U17-trainer zegt op |
| `STAF_TWIJFELT` | Staf | Trainer/coach twijfelt | Assistent Groen overweegt te stoppen |
| `STAF_NIEUW` | Staf | Nieuwe trainer beschikbaar | Via trainerscursus aangemeld |
| `TEAM_TEKORT` | Team | Team zakt onder minimum teamgrootte | Senioren 3 heeft maar 7 spelers over |
| `TEAM_OVERVOL` | Team | Team boven maximum | Geel 1 heeft 14 spelers |
| `TEAM_GENDER` | Team | Genderbalans verstoord | Groen 3 heeft nog maar 1 meisje |
| `RETENTIE_RISICO` | Speler | Retentiedata wijst op risico | Uit signalering-tabel: leeftijdsgroep 16-18 verliest 40% |
| `DOORSTROOM` | Speler | Speler moet naar volgende categorie | Oudste geel-spelers worden 13, moeten naar oranje |
| `KNKV_DEADLINE` | Systeem | KNKV-deadline nadert | Teamopgave nieuw seizoen over 3 weken |

### 2.3 Bronnen

**Handmatig** (TC of coordinator registreert):
- Gesprek met ouder/speler
- Bericht van trainer
- Observatie tijdens wedstrijd of training
- TC-vergadering

**Automatisch** (systeem genereert):
- Retentiedata uit de `signalering`-tabel (monitor-domein)
- Evaluatie-resultaten (niveau-mismatch als USS-score ver afwijkt van teamniveau)
- Leeftijdsgrenzen (speler wordt te oud voor huidige kleur)
- Teamgrootte (team zakt onder minimum na status-wijziging)
- KNKV-kalender (deadline nadert)
- Nieuw lid in ledenbestand (automatisch SPELER_NIEUW signaal)

**Geimporteerd** (vanuit ander domein):
- Monitor: retentie-signalering (bestaande `Signalering`-tabel)
- Evaluatie: niveau-inschatting door trainers
- Scouting: scoutingrapport met aanbeveling

### 2.4 Ernst

| Ernst | Betekenis | Voorbeeld | Visueel |
|---|---|---|---|
| `KRITIEK` | Directe impact op teamsamenstelling | Trainer stopt, team onder minimum | Rood |
| `AANDACHT` | Moet binnen 2 weken opgepakt | Speler twijfelt, gender scheef | Oranje |
| `INFO` | Geen directe actie nodig, wel registreren | Nieuw lid aangemeld, retentietrend | Grijs/blauw |

### 2.5 Relatie tot bestaande Signalering-tabel

De bestaande `Signalering`-tabel in de Monitor is een *andere* laag:

| | Monitor-Signalering | TI-Signaal |
|---|---|---|
| **Scope** | Hele vereniging, historisch | Eeen seizoensindeling |
| **Granulariteit** | Per leeftijdsgroep/geslacht | Per speler/staf/team |
| **Doel** | Trends in beeld brengen | Acties genereren |
| **Trigger** | Data-pipeline (bereken-verloop) | Handmatig of automatisch |
| **Voorbeeld** | "Retentie meisjes 14-16 is 65%" | "Lisa (14, meisje) twijfelt" |

De koppeling: een Monitor-signalering kan automatisch TI-signalen genereren. Als de retentie voor meisjes 14-16 onder de 70% zakt, genereert het systeem `RETENTIE_RISICO`-signalen voor alle meisjes in die leeftijdsgroep die nog ONGEZIEN zijn in de blauwdruk.

### 2.6 Relatie tot GezienStatus (BlauwdrukSpeler)

De GezienStatus is de *uitkomst* van het verwerken van signalen:

```
Signaal binnenkomt → TC triageert → GezienStatus bijgewerkt
```

- `SPELER_STOPT` → GezienStatus wordt ROOD
- `SPELER_TWIJFELT` → GezienStatus wordt ORANJE of GEEL (afhankelijk van ernst)
- `SPELER_NIVEAU` → GezienStatus wordt GEEL (moet besproken)
- Geen signaal + ingedeeld → GezienStatus wordt GROEN

GezienStatus is dus niet een bron van signalen, maar een *resultaat* van het signaalproces.

---

## 3. Actiemodel

### 3.1 Wat is een actie?

Een actie is een concrete taak die voortkomt uit een signaal. Het is iets dat iemand moet doen. Geen vaag agendapunt, maar een helder werkpakket.

### 3.2 Actietypen

| Type | Beschrijving | Voorbeeld |
|---|---|---|
| `GESPREK` | Gesprek voeren met speler, ouder, trainer of coordinator | "Bel Lisa's moeder om te polsen" |
| `UITVRAAG` | Gestructureerde vraag aan coordinator of trainer | "Wat is jouw beeld van Tim's niveau?" |
| `ZOEK_ALTERNATIEF` | Alternatief vinden voor een knelpunt | "Zoek een trainer voor U17" |
| `BESLUIT` | Besluit nemen op basis van verzamelde informatie | "Besluit: maken we een 3e seniorenteam?" |
| `WHAT_IF` | What-if aanmaken om de gevolgen te verkennen | "Maak what-if: wat als Klaas stopt?" |
| `REGISTREER` | Administratieve handeling | "Verwerk opzegging in ledenadministratie" |

### 3.3 Relatie tot bestaand Werkitem/Actiepunt

Het huidige Prisma-schema heeft:

**Werkitem**: breed werkitem op blauwdruk- of scenarioniveau, met type (STRATEGISCH, DATA, REGEL, TRAINER, SPELER, BESLUIT), prioriteit, status.

**Actiepunt**: concreet actiepunt onder een werkitem, met deadline, toewijzing, status (OPEN, BEZIG, AFGEROND).

**Analyse**: de bestaande modellen zijn een goede basis maar missen signaal-koppeling. Een werkitem kan nu al aan een speler of staf gekoppeld worden (`spelerId`, `stafId`), maar er is geen expliciete link naar het *waarom* (het signaal).

**Voorstel**: hergebruik het bestaande Actiepunt-model als basis voor acties, maar koppel het aan het nieuwe Signaal-model. Het Werkitem-model blijft voor grotere strategische vraagstukken (blauwdruk-breed). Signaal-acties zijn concreter en korter-levend.

### 3.4 Actie-workflow

```
OPEN → BEZIG → AFGEROND
  |               |
  v               v
VERVALLEN     resultaat → nieuw signaal?
                      → what-if bijwerken?
                      → status bijwerken?
```

**VERVALLEN** is nieuw: een actie die niet meer relevant is omdat het onderliggende signaal is opgelost (speler belt zelf: "ik ga toch door").

### 3.5 Toewijzing

| Rol | Mag acties aanmaken | Mag acties toewijzen aan | Ziet acties |
|---|---|---|---|
| TC-lid | Ja | Iedereen | Alle |
| Coordinator | Eigen scope | Trainers in eigen scope | Eigen scope |
| Trainer | Nee (suggesties via opmerkingen) | Nee | Eigen team |

**Deadline**: elke actie heeft een optionele deadline. Acties zonder deadline worden periodiek gesignaleerd ("3 acties zonder deadline bij U15-selectie").

**Prioriteit**: overgeerfd van het signaal (KRITIEK/AANDACHT/INFO), maar overschrijfbaar.

### 3.6 Resultaat vastleggen

Elke afgeronde actie heeft een resultaat:

```
Actie: "Bel Lisa's moeder om te polsen"
Resultaat: "Moeder gebeld 15 mrt. Lisa gaat door maar wil niet meer op zaterdag."
Gevolg: Status terug naar STABIEL, notitie bij speler over zaterdagvoorkeur.
```

Het resultaat is vrije tekst met een optionele categorisering:
- DOORGAAN (signaal opgelost, speler/staf gaat door)
- STOPPEN (bevestigd: stopt)
- WIJZIGING (er is iets veranderd: ander team, ander niveau, andere wens)
- ONBEKEND (nog steeds onduidelijk, escalatie nodig)

---

## 4. Domino-ketens

### 4.1 Het probleem

Een enkel signaal kan een cascade van gevolgen veroorzaken:

```
Signaal: Trainer U17 stopt
  |
  +-- Actie: zoek vervangende trainer
  |     |
  |     +-- Resultaat: geen trainer gevonden
  |           |
  |           +-- Signaal: TEAM_TEKORT (staf) bij U17
  |                 |
  |                 +-- Actie: overweeg U17-assistent doorschuiven
  |                       |
  |                       +-- Signaal: STAF_TEKORT bij U15 (verliest assistent)
  |                             |
  |                             +-- Actie: zoek U15-assistent
```

Of een speler-cascade:

```
Signaal: 3 twijfelaars Sen 3 stoppen
  |
  +-- Signaal: TEAM_TEKORT bij Sen 3 (5 spelers over)
        |
        +-- Actie: WHAT_IF "opheffing Sen 3, verdelen over Sen 2 en Sen 4"
        |     |
        |     +-- Signaal: Sen 2 gaat van 10 naar 13 spelers (TEAM_OVERVOL)
        |     +-- Signaal: Sen 4 gaat van 9 naar 11 spelers (acceptabel)
        |
        +-- Actie: WHAT_IF "Sen 3 in stand houden, U19-spelers optrekken"
              |
              +-- Signaal: U19 verliest 3 spelers (TEAM_TEKORT)
```

### 4.2 Modelkeuze: gelinkte lijst, geen graaf

Een volledige graaf-structuur is overkill voor de TC-werkwijze. De TC denkt niet in grafen maar in kettingen: "als dit, dan dat, dan dat." Bovendien zijn de meeste domino's lineair of vertakkend, niet circulair.

**Voorstel**: elk signaal heeft een optioneel `veroorzaaktDoor`-veld dat naar een ander signaal wijst. Dit vormt een gelinkte keten:

```
Signaal A (root)
  ├── Signaal B (veroorzaaktDoor: A)
  │   └── Signaal C (veroorzaaktDoor: B)
  └── Signaal D (veroorzaaktDoor: A)
```

### 4.3 Automatisch vs. handmatig

**Automatische domino-detectie** (systeem genereert):
- Na status-wijziging naar GAAT_STOPPEN: controleer teamgrootte. Als onder minimum → genereer TEAM_TEKORT signaal.
- Na verwijdering uit team: controleer genderbalans. Als 1 kind alleen → genereer TEAM_GENDER signaal.
- Na toepassen what-if: controleer alle geraakte teams op validatieregels.

**Handmatige domino-registratie** (TC registreert):
- TC ziet een gevolg dat het systeem niet kan detecteren (sociale impact, motivatie-effecten).
- TC koppelt handmatig een nieuw signaal aan een bestaand signaal.

### 4.4 Visualisatie

**Ketenweergave**: een verticale tijdlijn die de cascade toont. Elk signaal is een kaart met:
- Type + entiteit (icoon + naam)
- Korte beschrijving
- Status van gekoppelde acties (0/3 afgerond)
- Doorwerking (pijl naar volgend signaal)

```
┌─────────────────────────────────────┐
│ [!] Klaas (Sen 3) stopt             │
│     SPELER_STOPT · KRITIEK          │
│     ▸ 1 actie afgerond              │
│                 │                    │
│                 v                    │
│ [!] Sen 3: 7 spelers (min 8)        │
│     TEAM_TEKORT · KRITIEK           │
│     ▸ 2 acties open                 │
│                 │                    │
│                 v                    │
│ [?] What-if: "opheffing Sen 3"      │
│     ▸ status: WACHT_OP_ANTWOORDEN   │
└─────────────────────────────────────┘
```

**Wanneer tonen**: de ketenweergave verschijnt:
- Bij het openen van een signaal (toon de hele keten waar dit signaal onderdeel van is)
- In het what-if impact-panel (toon welke signalen aanleiding waren)
- Op het mobile dashboard (toon ketens met open acties voor jou)

### 4.5 Wanneer wordt een keten getriggerd?

| Trigger | Automatisch signaal | Voorbeeld |
|---|---|---|
| Speler status → GAAT_STOPPEN | TEAM_TEKORT als team < minimum | Klaas stopt, Sen 3 onder minimum |
| Speler verwijderd uit team | TEAM_TEKORT, TEAM_GENDER | Na what-if toepassen |
| Staf status → STOPT | TEAM_TEKORT (staf) | Trainer weg, team zonder coach |
| Teamgrootte wijzigt | TEAM_OVERVOL als > maximum | 3 nieuwe leden bij Geel 1 |
| Genderbalans wijzigt | TEAM_GENDER als 1 kind alleen | Enige meisje van Groen 3 stopt |
| What-if toegepast | Hervalidatie alle geraakte teams | Diverse mogelijke signalen |
| Seizoensovergang | DOORSTROOM voor leeftijdsgrens-spelers | Oudste geel wordt 13 |

---

## 5. Uitvragen

### 5.1 Het probleem

De TC heeft informatie nodig die alleen een coordinator of trainer kan geven:
- "Hoe doet Piet het in de groep?"
- "Klopt het dat Lisa wil stoppen?"
- "Zijn er spelers in jouw team die naar een hoger niveau willen?"
- "Heb je het gevoel dat de genderbalans een probleem is?"

Nu verloopt dit via WhatsApp: losstaande berichten die verdwijnen in de stroom. Het antwoord wordt niet gekoppeld aan het signaal of de speler.

### 5.2 Mechanisme: vergelijkbaar met EvaluatieUitnodiging

Het bestaande `EvaluatieUitnodiging`-model is een goed precedent:
- Uitnodiging met uniek token
- Email (of push) naar ontvanger
- Ontvanger klikt link → ziet formulier → vult in → opgeslagen

**Verschil met evaluatie**: een uitvraag is korter en meer ad-hoc. Het is geen uitgebreid evaluatieformulier maar een gerichte vraag met een beknopt antwoord.

### 5.3 Uitvraag-model

Een uitvraag is een speciaal type actie (`UITVRAAG`) met extra velden:

| Veld | Beschrijving | Voorbeeld |
|---|---|---|
| Vraag | Wat wil je weten? | "Klopt het dat Lisa twijfelt over doorgaan?" |
| Context | Optionele achtergrond voor de ontvanger | "We hoorden van een ouder dat ze twijfelt" |
| Ontvanger | Coordinator of trainer | Gertjan (coordinator Geel) |
| Antwoordformat | Type verwacht antwoord | Vrij tekst, keuze, of score |
| Deadline | Wanneer antwoord verwacht | 2 weken |

### 5.4 Antwoordformaten

| Format | Wanneer | Voorbeeld |
|---|---|---|
| **Vrij tekst** | Open vraag, context gewenst | "Vertel over de situatie van Piet" |
| **Keuze** | Ja/nee of meerkeuze | "Gaat Lisa door? Ja / Nee / Weet niet" |
| **Score** | Niveau-inschatting | "Op een schaal van 1-5, hoe schat je Tim's niveau in?" |
| **Lijst** | Meerdere spelers benoemen | "Welke spelers in jouw team zijn toe aan een hoger niveau?" |

### 5.5 Kanaal

**Primair**: in-app notificatie (mobile app). De coordinator opent de app, ziet "1 uitvraag van TC", tikt erop, beantwoordt.

**Fallback**: email met smartlink (token-URL). Voor coordinatoren die de app niet gebruiken. De link opent het antwoordformulier direct.

**Geen push-notificatie in v1**: push-notificaties vereisen service workers en notificatie-toestemming. Dat is een groot implementatietraject. Begin met in-app badge + email als fallback.

**Herinnering**: na X dagen zonder antwoord, automatische herinnering (email). Configureerbaar per uitvraag.

### 5.6 Privacy

Uitvragen bevatten spelersnamen en mogelijke gevoelige informatie. De smartlink-URL met token is voldoende beveiliging voor de OW-context (geen BSN, geen medische data). Het token verloopt na 30 dagen.

---

## 6. Integratie met what-ifs

### 6.1 Signaal als aanleiding voor what-if

Het meest voorkomende patroon: een signaal leidt tot een what-if.

```
Signaal: "3 twijfelaars Sen 3 stoppen"
  |
  +-- TC maakt what-if: "Wat als Sen 3 wordt opgeheven?"
  +-- TC maakt what-if: "Wat als we U19-spelers optrekken?"
```

De koppeling: een signaal kan verwijzen naar een of meer what-ifs die het heeft uitgelokt. Een what-if kan verwijzen naar het signaal dat de aanleiding was.

### 6.2 Acties bij what-ifs zijn signaal-acties

De what-if design spec (sectie 3) beschrijft acties bij what-ifs. Die zijn een subset van het signaal-actie-systeem:

- What-if "extra 3e senioren" → actie: "Vraag Jasper of er een trainer beschikbaar is" → dat is een `UITVRAAG` actie gekoppeld aan een `STAF_TWIJFELT` signaal.
- What-if "talent doorschuiven" → actie: "Bespreek met coordinator U15" → dat is een `GESPREK` actie gekoppeld aan een `SPELER_NIVEAU` signaal.

**Voorstel**: unificeer. Er is maar een actie-systeem. Acties kunnen gekoppeld zijn aan een signaal, een what-if, of beide. De what-if status ("wacht op antwoorden") wordt afgeleid uit de openstaande acties -- precies zoals de what-if spec beschrijft.

### 6.3 Bij toepassen/verwerpen van een what-if

**Toepassen**:
- Alle openstaande acties worden gereviewed. Acties die niet meer relevant zijn krijgen status VERVALLEN.
- Signalen die door de what-if zijn opgelost, worden afgerond.
- Nieuwe signalen die uit de toepassing komen (teamgrootte-wijzigingen) worden automatisch gegenereerd.

**Verwerpen**:
- Signalen blijven open (het probleem is niet opgelost, alleen de oplossingsrichting is afgewezen).
- Acties die specifiek aan deze what-if hingen, worden VERVALLEN.
- De TC kan direct een nieuwe what-if starten vanuit hetzelfde signaal.

---

## 7. Integratie met mobile

### 7.1 Mobile als primair signaal- en actieplatform

De mobile app (`/teamindeling/*`) is de plek waar het signaal-actie-systeem tot leven komt. De scheiding-spec (sectie 8) stelt terecht: "Dit systeem wordt de primaire reden dat mensen de mobile app openen."

### 7.2 Dashboardweergave

Het mobile dashboard toont per gebruiker:

**TC-lid** (Antjan, Merel, Thomas):
```
Openstaande acties (7)
  [!] 3 KRITIEK: trainer U17 stopt, Sen 3 onder minimum, ...
  [?] 2 AANDACHT: Lisa twijfelt, Geel gender...
  [i] 2 INFO: 2 nieuwe leden

Uitvragen wachtend op antwoord (3)
  Gertjan (Geel): 5 dagen geleden
  Barbara (D/E/F): 2 dagen geleden
  Marco (selectie): vandaag

Actieve signalen per doelgroep
  TOP: 2 signalen (1 kritiek)
  KWEEKVIJVER: 1 signaal
  SENIOREN: 3 signalen (2 kritiek)
```

**Coordinator** (Gertjan, Barbara, Marco):
```
Uitvragen voor jou (1)
  "Wat is jouw beeld van Tim's niveau?" — deadline: 15 apr

Signalen in jouw scope (3)
  Lisa (Geel 2): TWIJFELT
  Nieuw lid (meisje, 11): NIEUW
  Geel 1: 12 spelers (boven target)
```

**Trainer**:
```
Uitvragen voor jou (0)
  (geen openstaande uitvragen)

Je team: Geel 2 (10 spelers)
  1 signaal: Lisa twijfelt
```

### 7.3 Interacties op mobile

| Actie | Hoe | Wie |
|---|---|---|
| Signaal bekijken | Tik op signaal → detail met keten en acties | Iedereen |
| Actie beantwoorden | Tik op actie → antwoordformulier | Toegewezen persoon |
| Uitvraag beantwoorden | Tik op uitvraag → antwoordformulier | Ontvanger |
| Signaal aanmaken | + knop → type kiezen → speler/staf selecteren → beschrijving | TC, coordinator |
| Status wijzigen | Swipe of tik op statusindicator | TC, coordinator |

### 7.4 Notificaties

**v1**: in-app badge ("3 acties") + email voor uitvragen.

**v2 (later)**: push-notificaties voor KRITIEK-signalen en deadline-herinneringen.

---

## 8. Prisma-model voorstel

### 8.1 Nieuw: Signaal

```prisma
model Signaal {
  id            String         @id @default(cuid())
  blauwdruk     Blauwdruk      @relation(fields: [blauwdrukId], references: [id], onDelete: Cascade)
  blauwdrukId   String

  type          SignaalType
  ernst         SignaalErnst   @default(AANDACHT)
  beschrijving  String         @db.Text
  bron          SignaalBron    @default(HANDMATIG)

  // Entiteit (een van deze drie)
  speler        Speler?        @relation(fields: [spelerId], references: [id])
  spelerId      String?
  staf          Staf?          @relation(fields: [stafId], references: [id])
  stafId        String?
  teamOwCode    String?        // OW-teamcode voor team-signalen

  // Domino-keten
  veroorzaaktDoor   Signaal?   @relation("SignaalKeten", fields: [veroorzaaktDoorId], references: [id])
  veroorzaaktDoorId String?
  gevolgSignalen    Signaal[]  @relation("SignaalKeten")

  // Koppeling naar what-if (optioneel)
  whatIf         WhatIf?       @relation(fields: [whatIfId], references: [id])
  whatIfId       String?

  // Status
  status         SignaalStatus @default(OPEN)
  afgerondOp     DateTime?
  resolutie      String?       @db.Text

  // Audit
  gemeldDoor     User?         @relation("SignaalMelder", fields: [gemeldDoorId], references: [id])
  gemeldDoorId   String?

  // Relaties
  acties         Actiepunt[]   @relation("SignaalActies")

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([blauwdrukId])
  @@index([type])
  @@index([status])
  @@index([spelerId])
  @@index([stafId])
}

enum SignaalType {
  SPELER_STOPT
  SPELER_TWIJFELT
  SPELER_NIVEAU
  SPELER_NIEUW
  SPELER_BLESSURE
  STAF_STOPT
  STAF_TWIJFELT
  STAF_NIEUW
  TEAM_TEKORT
  TEAM_OVERVOL
  TEAM_GENDER
  RETENTIE_RISICO
  DOORSTROOM
  KNKV_DEADLINE
}

enum SignaalErnst {
  KRITIEK
  AANDACHT
  INFO
}

enum SignaalBron {
  HANDMATIG        // TC of coordinator registreert
  AUTOMATISCH      // Systeem detecteert
  MONITOR          // Uit signalering-tabel
  EVALUATIE        // Uit evaluatie-resultaten
  SCOUTING         // Uit scoutingrapport
}

enum SignaalStatus {
  OPEN
  IN_BEHANDELING
  AFGEROND
  VERVALLEN
}
```

### 8.2 Nieuw: Uitvraag

```prisma
model Uitvraag {
  id            String         @id @default(cuid())
  signaal       Signaal?       @relation(fields: [signaalId], references: [id])
  signaalId     String?

  blauwdruk     Blauwdruk      @relation(fields: [blauwdrukId], references: [id], onDelete: Cascade)
  blauwdrukId   String

  // Vraag
  vraag         String         @db.Text
  context       String?        @db.Text
  antwoordType  AntwoordType   @default(VRIJ_TEKST)
  opties        Json?          // Bij KEUZE of SCORE: de opties

  // Ontvanger
  ontvangerEmail String
  ontvangerNaam  String
  token          String        @unique @default(cuid())

  // Koppeling
  speler        Speler?        @relation(fields: [spelerId], references: [id])
  spelerId      String?
  staf          Staf?          @relation(fields: [stafId], references: [id])
  stafId        String?

  // Deadline
  deadline      DateTime?      @db.Date

  // Antwoord
  antwoord      String?        @db.Text
  antwoordScore Int?
  beantwoordOp  DateTime?

  // Communicatie
  verstuurdOp        DateTime?
  reminderVerstuurd  DateTime?
  reminderAantal     Int       @default(0)

  // Audit
  auteur        User           @relation("UitvraagAuteur", fields: [auteurId], references: [id])
  auteurId      String

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([blauwdrukId])
  @@index([token])
  @@index([signaalId])
}

enum AntwoordType {
  VRIJ_TEKST
  KEUZE
  SCORE
  LIJST
}
```

### 8.3 Uitbreiding: Actiepunt

Het bestaande Actiepunt-model krijgt een optionele signaal-koppeling:

```prisma
model Actiepunt {
  // ... bestaande velden ...

  // NIEUW: optionele koppeling aan signaal
  signaal       Signaal?       @relation("SignaalActies", fields: [signaalId], references: [id])
  signaalId     String?

  // NIEUW: actie-type
  actieType     ActieType?

  // NIEUW: resultaat
  resultaat     String?        @db.Text
  resultaatType ResultaatType?
}

enum ActieType {
  GESPREK
  UITVRAAG
  ZOEK_ALTERNATIEF
  BESLUIT
  WHAT_IF
  REGISTREER
}

enum ResultaatType {
  DOORGAAN
  STOPPEN
  WIJZIGING
  ONBEKEND
}
```

### 8.4 Uitbreiding: Staf (status)

```prisma
model Staf {
  // ... bestaande velden ...

  // NIEUW: beschikbaarheidsstatus
  status        StafStatus     @default(ONBEKEND)
}

enum StafStatus {
  STABIEL
  TWIJFELT
  STOPT
  NIEUW
  ONBEKEND
}
```

### 8.5 Uitbreiding: SpelerStatus enum

```prisma
enum SpelerStatus {
  STABIEL              // was: BESCHIKBAAR
  TWIJFELT             // ongewijzigd
  GAAT_STOPPEN         // ongewijzigd
  NIEUW                // was: NIEUW_POTENTIEEL + NIEUW_DEFINITIEF
  WACHT_OP_INFO        // nieuw
  NIET_BESCHIKBAAR     // nieuw
  // BESCHIKBAAR         -- deprecated, migreren naar STABIEL
  // NIEUW_POTENTIEEL    -- deprecated, migreren naar NIEUW
  // NIEUW_DEFINITIEF    -- deprecated, migreren naar NIEUW
  // ALGEMEEN_RESERVE    -- deprecated, verwijderen
}
```

**Migratiepad**: bestaande records met BESCHIKBAAR worden STABIEL. NIEUW_POTENTIEEL en NIEUW_DEFINITIEF worden NIEUW. ALGEMEEN_RESERVE wordt verwijderd (spelers in reserve-pool worden anders gemodelleerd).

### 8.6 Modelrelaties overzicht

```
Blauwdruk
  ├── BlauwdrukSpeler (gezienStatus: werkstatus TC)
  │   └── Actiepunt (optioneel: bij GEEL/ORANJE)
  │
  ├── Signaal (per speler/staf/team)
  │   ├── Actiepunt[] (acties bij dit signaal)
  │   ├── Uitvraag[] (uitvragen bij dit signaal)
  │   ├── Signaal[] (gevolgSignalen: domino-keten)
  │   └── WhatIf? (gekoppelde what-if)
  │
  ├── Uitvraag (via smartlink aan coordinator/trainer)
  │
  ├── WhatIf
  │   ├── Werkitem[] (hergebruik bestaand)
  │   └── Signaal[] (signalen die aanleiding waren)
  │
  └── Werkitem (strategische vraagstukken)
      └── Actiepunt[] (concrete taken)
```

### 8.7 Minimaal viable versie (MVP)

De kleinste versie die waarde heeft voor de TC:

**MVP bevat**:
1. Signaal-model met handmatige registratie (SPELER_STOPT, SPELER_TWIJFELT, STAF_STOPT)
2. Beschikbaarheidsstatus op speler (STABIEL, TWIJFELT, GAAT_STOPPEN, NIEUW)
3. Actiepunt met signaal-koppeling (GESPREK, BESLUIT)
4. Koppeling GezienStatus aan signaal (ROOD = GAAT_STOPPEN, ORANJE = TWIJFELT)
5. Mobile dashboard: openstaande signalen en acties per gebruiker

**MVP bevat NIET**:
- Automatische signaal-generatie (retentie, teamgrootte)
- Uitvragen (v2)
- Domino-ketens (v2)
- Staf-status (v2)
- What-if integratie (v2)
- Email/push notificaties (v2)

**Reden**: de TC moet eerst wennen aan het registreren van signalen. Als dat werkt, bouwen we de automatisering en uitvragen erop.

---

## 9. Oranje Draad toetsing

Elk onderdeel van het signaal-actie-systeem wordt getoetst aan de Oranje Draad.

### Plezier
- **Signaaltype TEAM_GENDER**: voorkomt dat een kind als enige jongen of meisje in een team zit. Direct gekoppeld aan de OW-regel "nooit 1 kind alleen."
- **Signaaltype RETENTIE_RISICO**: maakt spelers zichtbaar die dreigen af te haken. Vroegtijdig ingrijpen (gesprek, team-aanpassing) kan het plezier herstellen.
- **Uitvraag**: de coordinator kan sociaal signaleren: "De groep klikt niet" of "Er is een conflict." Dit soort zachte informatie is cruciaal voor plezier maar wordt nu niet gestructureerd vastgelegd.

### Ontwikkeling
- **Signaaltype SPELER_NIVEAU**: maakt zichtbaar dat een speler onder of boven niveau speelt. Koppeling met evaluatie-scores maakt dit objectiveerbaar.
- **Signaaltype DOORSTROOM**: automatische detectie van spelers die toe zijn aan de volgende categorie. Voorkomt dat talenten te lang "blijven hangen."

### Prestatie
- **Signaaltype TEAM_TEKORT**: voorkomt dat selectieteams te zwak worden door niet-gedetecteerde uitstroom.
- **What-if integratie**: als een signaal leidt tot een what-if, wordt de impact op teamsterkte direct zichtbaar.

### Duurzaamheid
- **Staf-status**: het meest onderbelichte maar belangrijkste aspect. Een team zonder trainer is niet duurzaam. Staf-signalen krijgen dezelfde urgentie als speler-signalen.
- **Domino-ketens**: maken expliciet wat er gebeurt als de TC niet ingrijpt. "Als we niets doen, dan..." -- dat maakt de urgentie voelbaar.
- **Gestructureerde workflow**: vermindert het ad-hoc karakter van de huidige WhatsApp-communicatie. Minder vergeten acties, minder "o ja, dat moesten we nog doen."

---

## 10. Concrete OW-voorbeelden

### Voorbeeld 1: De twijfelende junior

**Maart 2026**. De coordinator van Geel (Gertjan) hoort van de trainer van Geel 2 dat Lisa (12, meisje) het niet meer zo leuk vindt.

Zonder systeem: Gertjan appt de TC. Antjan noteert het ergens. Het verdwijnt.

Met systeem:
1. Gertjan opent de app, maakt signaal: SPELER_TWIJFELT bij Lisa
2. GezienStatus Lisa wordt automatisch ORANJE
3. TC ziet signaal op dashboard, maakt actie: "Antjan belt ouders Lisa" (GESPREK, deadline: 1 week)
4. Antjan belt. Resultaat: "Lisa wil graag met haar vriendin Sanne samen spelen. Sanne zit in Geel 1."
5. Antjan maakt what-if: "Wat als Lisa naar Geel 1 gaat?" Impact: Geel 2 verliest 1 meisje (genderbalans krap), Geel 1 gaat naar 11 spelers (boven target).
6. TC bespreekt, past what-if toe. Signaal afgerond, status terug naar STABIEL.

### Voorbeeld 2: De stopper-cascade bij senioren

**April 2026**. Drie senioren bij Sen 3 melden dat ze stoppen.

1. TC registreert 3x signaal SPELER_STOPT. Status wordt GAAT_STOPPEN.
2. Systeem genereert automatisch: TEAM_TEKORT bij Sen 3 (van 10 naar 7 spelers, onder KNKV minimum 8).
3. TC maakt twee what-ifs:
   - "Opheffing Sen 3, verdelen over Sen 2 en Sen 4"
   - "Sen 3 in stand houden, 2 U19-spelers optrekken"
4. Bij what-if 2 genereert het systeem: TEAM_TEKORT bij U19 als 2 spelers weg gaan.
5. Actie: "Uitvraag naar Jasper: zijn er U19-spelers die naar senioren willen?"
6. Jasper antwoordt: "Ja, Robin en Daan willen graag."
7. TC past what-if 2 toe. Verwerpt what-if 1. Signalen afgerond.

### Voorbeeld 3: De verdwenen trainer

**Mei 2026**. De trainer van U17 meldt dat hij stopt.

1. TC registreert signaal STAF_STOPT bij de U17-trainer.
2. Systeem toont in impact-panel: U17-1 en U17-2 hebben geen hoofdtrainer meer.
3. Actie: "Zoek vervangende trainer" (ZOEK_ALTERNATIEF, deadline: 1 juni)
4. TC maakt what-if: "Wat als de U15-assistent doorschuift naar U17?"
5. What-if toont impact: U15 verliest assistent. Actie: "Uitvraag naar Alex: is er een aspirant-trainer voor U15?"
6. Alex antwoordt: "Ja, Marc (KT2-cursist) wil bij U15 assisteren."
7. TC past toe. Domino opgelost.

---

## 11. Implementatiepad

### Fase 1: Signaal-basis (MVP)

**Scope**: handmatige signaalregistratie + beschikbaarheidsstatus + dashboard.

| Item | Wat | Complexiteit |
|---|---|---|
| SpelerStatus migratie | BESCHIKBAAR → STABIEL, NIEUW_* → NIEUW | Laag |
| Signaal model | Prisma model + CRUD server actions | Middel |
| Signaal-actiepunt koppeling | Uitbreiding bestaand Actiepunt | Laag |
| Mobile signaal-dashboard | Openstaande signalen per scope | Middel |
| GezienStatus-koppeling | SPELER_STOPT → ROOD, TWIJFELT → ORANJE | Laag |

**Doorlooptijd**: 2-3 weken.

### Fase 2: Uitvragen + staf

**Scope**: uitvraag-model, staf-status, email-notificatie.

| Item | Wat | Complexiteit |
|---|---|---|
| Uitvraag model | Prisma model + smartlink | Middel |
| Antwoordformulier | Token-based pagina, 4 antwoordtypen | Middel |
| Email-verzending | Uitvraag + herinnering via email | Middel |
| StafStatus | Nieuw veld op Staf + UI | Laag |
| Staf-signalen | STAF_STOPT, STAF_TWIJFELT, STAF_NIEUW | Laag |

**Doorlooptijd**: 2-3 weken.

### Fase 3: Automatische signalen + domino-ketens

**Scope**: systeem genereert signalen, ketenweergave.

| Item | Wat | Complexiteit |
|---|---|---|
| Teamgrootte-detectie | Na status-wijziging: check minimum | Middel |
| Gender-detectie | Na verwijdering: check 1-kind-alleen | Middel |
| Retentie-import | Monitor-signalering → TI-signalen | Middel |
| Domino-keten model | veroorzaaktDoor relatie | Laag |
| Ketenweergave | Verticale tijdlijn UI | Middel |

**Doorlooptijd**: 3-4 weken.

### Fase 4: What-if integratie

**Scope**: signaal ← → what-if koppeling, actie-unificatie.

| Item | Wat | Complexiteit |
|---|---|---|
| Signaal → what-if link | "Maak what-if vanuit signaal" | Laag |
| What-if → signaal generatie | Na toepassen: hervalidatie | Middel |
| Actie-unificatie | What-if acties = signaal-acties | Middel |

**Doorlooptijd**: 2 weken.

### Fase 5: Doorstroom + KNKV-kalender

**Scope**: automatische doorstroom-signalen, deadline-herinneringen.

| Item | Wat | Complexiteit |
|---|---|---|
| Doorstroom-detectie | Leeftijdsgrenzen → DOORSTROOM signalen | Middel |
| KNKV-kalender | Deadline-signalen op basis van seizoenscyclus | Laag |
| Push-notificaties (optioneel) | Service worker + toestemming | Hoog |

**Doorlooptijd**: 2-3 weken.

---

## 12. Open vragen voor de product-owner

1. **SpelerStatus hernoeming**: is het acceptabel om BESCHIKBAAR te hernoemen naar STABIEL? Dit raakt bestaande code en mogelijk de UI.

2. **ALGEMEEN_RESERVE**: kunnen we deze status verwijderen? Het concept "reserve" is een plaatsing (speler staat in reserve-pool), niet een beschikbaarheidsstatus.

3. **Staf-status**: hoe ver gaan we met staf-signalen? De TC heeft weinig grip op trainerswerving. Is het systeem een hulpmiddel of een herinnering aan een probleem dat niet via software op te lossen is?

4. **Automatische signalen**: hoeveel automatische signalen zijn nuttig voordat het ruis wordt? Als het systeem 50 RETENTIE_RISICO signalen genereert, wordt de TC er niet blij van. Moeten we filteren op ernst?

5. **Scope van uitvragen**: mogen coordinatoren ook uitvragen sturen naar hun trainers, of is dat alleen TC-bevoegdheid?

6. **Smartlink-beveiliging**: is een token-URL voldoende, of willen we Google-login voor coordinatoren/trainers? (Dit raakt het autorisatiemodel uit de scheiding-spec.)

7. **What-if MVP**: moeten signalen en what-ifs tegelijk live gaan, of kan het signaal-systeem eerder live omdat het onafhankelijk waarde heeft?

8. **WhatsApp-integratie**: de TC communiceert via WhatsApp. Is er een route naar WhatsApp-notificaties (WhatsApp Business API) of is dat te complex?

---

## Besluitenlog

| Besluit | Reden |
|---|---|
| Twee assen (beschikbaarheid + werkstatus) i.p.v. een | TC gebruikt beide onafhankelijk: "ze gaat door maar we hebben haar nog niet ingedeeld" |
| Gelinkte lijst i.p.v. graaf voor domino-ketens | TC denkt in kettingen, niet in grafen. Eenvoudiger te bouwen en te tonen |
| Hergebruik Actiepunt i.p.v. nieuw model | Vermijdt duplicatie, Actiepunt heeft al status/deadline/toewijzing |
| Nieuw Signaal-model i.p.v. uitbreiding Werkitem | Signalen zijn fijnmaziger en korter-levend dan werkitems |
| Uitvraag als apart model | Smartlink-mechanisme vereist eigen token, deadline, antwoord-opslag |
| Signaal gekoppeld aan Blauwdruk | Elk signaal hoort bij een seizoensplanning, niet los |
| Staf-status als nieuw veld | De what-if review noemde staf als blinde vlek, dit lost het op |
| MVP zonder automatische signalen | TC moet eerst wennen aan handmatig registreren |
| Email + in-app, geen push in v1 | Push-notificaties zijn complex en de TC-doelgroep is klein |
