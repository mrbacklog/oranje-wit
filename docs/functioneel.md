# c.k.v. Oranje Wit — Platform Handleiding

> **Voor**: TC-leden, trainers, scouts, ouders en spelers
> **Versie**: 1.0 — Seizoen 2025-2026
> **Adres**: [ckvoranjewit.app](https://ckvoranjewit.app)

---

## 1. Wat is het platform?

Het digitale platform van c.k.v. Oranje Wit bundelt alle tools die de vereniging gebruikt voor teamindeling, spelersmonitoring, evaluaties en scouting. Alles zit in een app op [ckvoranjewit.app](https://ckvoranjewit.app) — je hoeft niet meer te schakelen tussen losse websites.

Het platform bestaat uit vijf onderdelen:

| App | Wat doet het? | Voor wie? |
|---|---|---|
| **Monitor** | Ledenoverzicht, trends, signaleringen | TC |
| **Team-Indeling** | Seizoensteams samenstellen | TC, coordinatoren |
| **Evaluatie** | Spelers beoordelen en zelfevaluaties | Iedereen |
| **Scouting** | Spelers observeren en scoren | Scouts, TC |
| **Beheer** | Instellingen, gebruikers, raamwerken | TC |

---

## 2. Inloggen

### Met Google-account

Ga naar [ckvoranjewit.app/login](https://ckvoranjewit.app/login) en klik op **Inloggen met Google**. Gebruik het Google-account dat bij de TC bekend is. Na inloggen kom je op de Hub (startpagina).

### Met een smartlink (zonder account)

Spelers en ouders krijgen soms een persoonlijke link per mail — bijvoorbeeld voor het invullen van een zelfevaluatie. Klik op die link en je bent meteen ingelogd. Geen Google-account nodig.

### Rollen

Wat je ziet hangt af van je rol:

| Rol | Wat kun je? |
|---|---|
| **TC-lid** | Alles: Monitor, Team-Indeling, Evaluatie, Scouting, Beheer |
| **Coordinator** | Team-Indeling (voor je eigen doelgroepen), Evaluatie |
| **Scout** | Scouting, Evaluatie |
| **Trainer/coach** | Evaluatie (spelers beoordelen) |
| **Speler/ouder** | Evaluatie (zelfevaluatie invullen via smartlink) |

---

## 3. De Hub (startpagina)

Na inloggen zie je de Hub. Dit is je persoonlijke startpagina die zich aanpast aan je rol.

### Wat staat erop?

- **Begroeting** met je naam en rol
- **Meldingen** (afhankelijk van je rol):
  - TC ziet: signaleringen, openstaande actiepunten
  - Trainers zien: evaluaties die je nog moet invullen
  - Scouts zien: openstaande scoutingverzoeken
  - Spelers zien: zelfevaluaties die je nog kunt invullen
- **App-launcher** onderaan: klikbare tegels naar de apps die voor jou beschikbaar zijn
- Als er niets te doen is, zie je "Alles bijgewerkt"

---

## 4. Verenigingsmonitor

> **Route**: /monitor
> **Toegang**: alleen TC-leden

De Monitor geeft inzicht in hoe de vereniging ervoor staat: hoeveel leden, wie stroomt in/uit, welke leeftijdsgroepen groeien of krimpen.

### Dashboard

De startpagina toont de belangrijkste cijfers op een rij:

- **Spelende leden** — totaal aantal actieve leden dit seizoen
- **Teams** — hoeveel teams er draaien
- **Instroom** — nieuwe leden dit seizoen
- **Uitstroom** — leden die zijn gestopt

Daaronder staan grafieken: ledentrend over meerdere seizoenen en instroom versus uitstroom.

### Ledendynamiek (Retentie)

Vier tabbladen geven diep inzicht in ledenbewegingen:

| Tab | Wat zie je? |
|---|---|
| **Behoud** | Retentiepercentage per leeftijd, waterfall-grafiek van verloop, kritieke overgangsmomenten |
| **Instroom** | Nieuwe leden per leeftijd en seizoen, gesplitst in jeugd en senioren |
| **Uitstroom** | Vertrokken leden per leeftijd en seizoen |
| **Cohorten** | Hoe presteren instroom-jaargangen over de jaren (blijven ze of stoppen ze?) |

Alle data is uitgesplitst naar jongens en meisjes.

### Samenstelling

Hoeveel spelers per leeftijdsgroep en geboortejaar. Handig om te zien waar tekorten of overschotten zitten.

### Spelers

Zoek op naam en bekijk het volledige spelerspad: in welke teams heeft iemand gespeeld door de jaren heen?

### Teams

Overzicht van alle teams dit seizoen, inclusief stafbezetting (wie traint welk team).

### Signaleringen

Automatische waarschuwingen in drie niveaus:

| Niveau | Betekenis | Voorbeeld |
|---|---|---|
| **Kritiek** (rood) | Vereist directe actie | Instroom Groen gedaald met 40% |
| **Aandacht** (oranje) | Houd in de gaten | Retentie 13-jarigen onder 70% |
| **Op koers** (groen) | Gaat goed | Ledengroei +5% ten opzichte van vorig seizoen |

Signaleringen zijn gegroepeerd op thema: werving, retentie en pijplijn (doorstroom).

### Projecties

Doorstroomprognoses: hoeveel spelers stromen naar verwachting door naar de volgende leeftijdsgroep of naar senioren?

---

## 5. Team-Indeling

> **Route**: /teamindeling
> **Toegang**: TC-leden en coordinatoren

Hier stelt de TC de seizoensteams samen. Het proces verloopt in vier stappen.

### Het proces

```
1. Blauwdruk     Kaders instellen (hoeveel teams, welke categorieeen)
       |
2. Concepten     Uitgangspunten vastleggen (wat zijn de speerpunten?)
       |
3. Scenario's    Concrete indelingen maken en vergelijken
       |
4. Definitief    Beste scenario kiezen en vastleggen
```

### Blauwdruk

In de blauwdruk leg je de kaders vast voor het seizoen:

- **Teamstructuur** — Hoeveel teams per kleur (Blauw, Groen, Geel, etc.)
- **Teamgrootte** — Minimaal, ideaal en maximaal aantal spelers per team
- **Spelers bekijken** — Overzicht van alle beschikbare spelers per categorie
- **Pins** — Vastgezette beslissingen die voor alle scenario's gelden. Bijvoorbeeld: "Deze speler speelt in de selectie" of "Deze speler gaat stoppen"
- **Besluiten** — Belangrijke TC-keuzes vastleggen met motivatie
- **Gezien-functie** — Vink af dat je alle spelers hebt doorgelopen, zodat niemand over het hoofd gezien wordt

### Scenario's

Hier bouw je concrete teamindelingen:

- **Drag & drop** — Sleep spelers naar teams
- **Spelerskaart** — Klik op een speler en zie foto, leeftijd, evaluatie en sterkte-inschatting
- **Validatie** — Het systeem controleert automatisch de regels (zie hieronder)
- **Meerdere scenario's** — Probeer verschillende opstellingen uit
- **Impactanalyse** — Wat verandert er als je een speler verplaatst?

### Vergelijken

Leg twee scenario's naast elkaar:

- Zie per team de verschillen
- Vergelijk op sterkte, balans en andere criteria
- Kies het scenario dat het beste past bij de Oranje Draad

### Validatiemeldingen

Tijdens het indelen controleert het systeem continu op regels. Je ziet drie soorten meldingen:

| Kleur | Wat betekent het? | Moet je oplossen? |
|---|---|---|
| **Rood** | KNKV-overtreding (landelijke regels) | Ja, verplicht |
| **Oranje** | OW-voorkeur (verenigingsafspraak) | Nee, maar let op |
| **Groen** | Alles in orde | Nee |

Voorbeelden van rode meldingen:
- Team heeft meer dan 3 jaar leeftijdsspreiding (B-categorie 8-tal)
- Niet 4 jongens + 4 meisjes in A-categorie team
- Speler te oud voor deze categorie

Voorbeelden van oranje meldingen:
- Team groter dan het OW-maximum (bijv. meer dan 11 spelers in een 8-tal)
- Slechts 1 jongen of 1 meisje in een team
- Selectiegroep heeft niet de ideale 20 spelers

### Werkbord

Een kanban-bord om taken en actiepunten bij te houden rondom de teamindeling. Wie moet nog met welke ouders bellen? Welke trainer is al benaderd?

### Instellingen

- Seizoen wisselen
- Mijlpalen beheren (deadlines voor het indelingsproces)
- Data importeren

---

## 6. Evaluatie

> **Route**: /evaluatie
> **Toegang**: iedereen (trainers, spelers, ouders, TC)

Met evaluaties beoordeelt de vereniging hoe spelers zich ontwikkelen. Er zijn twee vormen: trainerevaluaties en zelfevaluaties.

### Hoe werkt het?

1. **TC maakt een evaluatieronde aan** — met een naam, seizoen en deadline
2. **Coordinator wijst teams toe** — welke teams doen mee aan deze ronde
3. **Trainers krijgen een uitnodiging** — per mail, met een link naar het formulier
4. **Spelers/ouders krijgen een smartlink** — voor de zelfevaluatie
5. **Resultaten zijn beschikbaar** — TC en coordinatoren kunnen de ingevulde evaluaties bekijken

### Voor trainers

Je krijgt een mail met een link. Klik erop en je komt direct bij het evaluatieformulier. Per speler beoordeel je het niveau op een schaal van 1 tot 5.

### Voor spelers en ouders

Je krijgt een persoonlijke link (smartlink) per mail. Geen account nodig. Klik op de link en vul je zelfevaluatie in. Na het insturen zie je een bedankpagina.

### Voor TC en coordinatoren

In het beheerpaneel kun je:
- Evaluatierondes aanmaken en beheren
- Zien wie er al heeft ingevuld en wie nog niet
- Resultaten bekijken per speler en per team

---

## 7. OW Scout

> **Route**: /scouting
> **Toegang**: scouts en TC-leden

De scouting-app is gebouwd voor mobiel gebruik. Scouts observeren spelers tijdens wedstrijden en trainingen en leggen hun bevindingen vast.

### Dashboard

Na inloggen zie je:
- Je **XP-balk** en huidige level
- Knoppen om te **scouten** (zoek een speler of bekijk een team)
- Openstaande **verzoeken** van de TC
- Je **recente rapporten**

### Een speler scouten

1. **Zoek** de speler (op naam)
2. **Vul de scorekaart in** — zes onderdelen:

| Pijler | Wat beoordeel je? |
|---|---|
| **Schot** | Schietvaardigheden, afstandsschot, doorloopbal |
| **Aanval** | Aanvallende acties, vrijlopen, kansen creeren |
| **Passing** | Passing, overzicht, aanspeelbaarheid |
| **Verdediging** | Verdedigend werk, onderscheppen, druk zetten |
| **Fysiek** | Snelheid, kracht, uithoudingsvermogen |
| **Mentaal** | Concentratie, inzet, veerkracht |

3. **Dien het rapport in** — de scores worden omgezet naar een USS-rating (zie sectie 13)

### Spelerskaarten

Een verzameling van alle gescoute spelers als kaarten, vergelijkbaar met voetbalplaatjes. Elke kaart toont de naam, foto, team, scores per pijler en een overall rating. Kaarten komen in drie tiers: brons, zilver en goud.

### Spelervergelijking

Vergelijk twee of meer spelers naast elkaar. Handig om te bepalen wie er in welk team past.

### Verzoeken

De TC kan scoutingverzoeken aanmaken: "Bekijk speler X tijdens de wedstrijd van zaterdag." Als scout zie je deze verzoeken op je dashboard en kun je ze oppakken.

### Gamification

Scouten levert XP op. Hoe meer je scout, hoe hoger je level. Er zijn badges te verdienen voor bijzondere prestaties (bijv. "10 rapporten ingediend", "alle teams gescouted"). Op je profielpagina zie je je voortgang, badges en een leaderboard.

---

## 8. TC Beheer

> **Route**: /beheer
> **Toegang**: alleen TC-leden

Het beheerpaneel is de plek waar de TC alles configureert. Het heeft negen domeinen:

| # | Domein | Wat kun je hier? |
|---|---|---|
| 1 | **Jaarplanning** | Seizoenskalender en mijlpalen beheren |
| 2 | **Roostering** | Trainings- en wedstrijdschema's |
| 3 | **Teams & Leden** | Teamoverzicht, leden synchroniseren met Sportlink |
| 4 | **Jeugdontwikkeling** | Vaardigheidsraamwerk beheren, USS-scores bekijken, progressie volgen |
| 5 | **Scouting** | Scout-accounts beheren |
| 6 | **Evaluatie** | Evaluatierondes, coordinatoren en templates beheren |
| 7 | **Werving** | Aanmeldingen en wervingsfunnel |
| 8 | **Systeem** | Gebruikers en rollen beheren, data importeren |
| 9 | **Archief** | Historische teams en resultaten inzien |

### Seizoenen

Het platform werkt met seizoenen (bijv. 2025-2026). Het huidige seizoen is actief en bewerkbaar. Vorige seizoenen zijn bevroren — je kunt ze bekijken maar niet wijzigen. Het komende seizoen is de werkruimte voor de teamindeling.

---

## 9. De Oranje Draad

De Oranje Draad is het technisch beleid van c.k.v. Oranje Wit. Alle teamindelingen worden hieraan getoetst.

### De formule

```
PLEZIER + ONTWIKKELING + PRESTATIE = DUURZAAMHEID
```

### De drie pijlers

| Pijler | Betekenis |
|---|---|
| **Plezier** | Altijd de hoogste prioriteit. Niet onderhandelbaar. Elk kind moet met plezier naar training en wedstrijd. Sociale cohesie in teams is essentieel. |
| **Ontwikkeling** | Het echte doel. Spelers uitdagen op hun niveau. Doorstroommogelijkheden bieden. |
| **Prestatie** | Een middel, nooit een einddoel. Wedstrijden winnen is leuk, maar niet het doel. Selectie op basis van niveau is prima, maar niet ten koste van plezier. |

Samen leiden ze tot **duurzaamheid**: beleid dat volhoudbaar is voor spelers en staf. Geen seizoensdenken maar een meerjarenvisie. Retentie (leden behouden) is belangrijker dan korte-termijn succes.

### POP-ratio per leeftijdsgroep

De verhouding tussen Plezier, Ontwikkeling en Prestatie verschuift naarmate spelers ouder worden:

| Leeftijd | Kleur | Plezier | Ontwikkeling | Prestatie |
|---|---|---|---|---|
| 5-7 jaar | Blauw | 70% | 25% | 5% |
| 8-9 jaar | Groen | 55% | 35% | 10% |
| 10-12 jaar | Geel | 40% | 40% | 20% |
| 13-15 jaar | Oranje / U15 | 30% | 40% | 30% |
| 16-18 jaar | Rood / U17 / U19 | 25% | 35% | 40% |
| Senioren wedstrijd | Sen 1-4 | 20% | 25% | 55% |
| Senioren breedte | Sen 5+ | 50% | 20% | 30% |

Bij de jongsten draait het dus bijna helemaal om plezier. Bij senioren wedstrijdkorfbal verschuift het naar prestatie. Maar ook bij senioren breedtesport (5e en lager) staat plezier weer bovenaan.

### Vijf toetsingsvragen

Bij elke teamindeling stelt de TC deze vragen:

1. **Heeft elk team voldoende sociale cohesie?** (Plezier)
2. **Worden spelers uitgedaagd op hun niveau?** (Ontwikkeling)
3. **Zijn de selectieteams sterk genoeg om competitief te zijn?** (Prestatie)
4. **Is deze indeling volhoudbaar met de beschikbare staf?** (Duurzaamheid)
5. **Zijn er spelers met hoog retentierisico die extra aandacht nodig hebben?**

---

## 10. Seizoenscyclus

Het indelingsproces volgt een vaste cyclus door het jaar:

| Wanneer | Wat gebeurt er? |
|---|---|
| **Maart - april** | Blauwdruk opstellen: hoeveel teams, welke categorieeen? |
| **April - mei** | Scenario's bouwen: spelers indelen, varianten uitproberen |
| **Mei - juni** | Vergelijken en kiezen: beste scenario definitief maken |
| **Juni** | Pre-season indeling delen met trainers en spelers |
| **Augustus** | Nieuw seizoen start |
| **September - december** | Veldcompetitie najaar |
| **Januari - maart** | Zaalcompetitie |
| **April - juni** | Veldcompetitie voorjaar |
| **Doorlopend** | Monitoring (ledencijfers), evaluaties, scouting |

---

## 11. KNKV-regels (vereenvoudigd)

De KNKV (Koninklijk Nederlands Korfbal Verbond) stelt regels voor teamsamenstelling. Hieronder de belangrijkste regels, vereenvoudigd.

### Kleuren en categorieeen

In de jeugd zijn er twee soorten korfbal:

**B-categorie (breedtekorfbal)** — voor alle jeugd, ingedeeld op leeftijd met een kleur:

| Kleur | Leeftijd | Spelformat | Spelers |
|---|---|---|---|
| **Blauw** | 5-7 jaar | 4-tal | 4 op het veld |
| **Groen** | 8-9 jaar | 4-tal | 4 op het veld |
| **Geel** | 10-12 jaar | 8-tal | 6-8 op het veld |
| **Oranje** | 13-15 jaar | 8-tal | 6-8 op het veld |
| **Rood** | 16-18 jaar | 8-tal | 6-8 op het veld |

**A-categorie (wedstrijdkorfbal)** — voor de sterkste spelers per leeftijdsgroep:

| Categorie | Leeftijd | Spelformat |
|---|---|---|
| **U15** | 13-14 jaar | 8-tal (4 jongens + 4 meisjes verplicht) |
| **U17** | 15-16 jaar | 8-tal (4 jongens + 4 meisjes verplicht) |
| **U19** | 17-18 jaar | 8-tal (4 jongens + 4 meisjes verplicht) |

**Senioren**:

| Type | Wie | Gender |
|---|---|---|
| **Sen 1-4** (wedstrijd) | Competitief, geen leeftijdsgrens | 4V + 4M verplicht |
| **Sen 5+** (breedte) | Recreatief | Gender mag afwijken |

### Leeftijdsgrenzen

De leeftijd wordt bepaald op 31 december van het seizoensjaar. Een speler die op die datum 14 is, speelt in de groep 13-14 (Oranje/U15).

### Teamgrootte

B-categorie regels:
- **4-tallen** (Blauw, Groen): maximaal 2 jaar leeftijdsverschil in het team
- **8-tallen** (Geel, Oranje, Rood): maximaal 3 jaar leeftijdsverschil

### Gender-regels

- **A-categorie**: verplicht 4 jongens + 4 meisjes op het veld
- **B-categorie**: in principe gemengd, maar mag afwijken
- **OW-regel**: nooit 1 kind alleen van een geslacht in een team (minimum 2 van elk)

### Wat controleert het systeem?

De Team-Indeling app controleert automatisch op deze regels. Rode meldingen (KNKV-overtredingen) moeten opgelost worden voordat een indeling definitief gemaakt kan worden. Oranje meldingen (OW-voorkeuren) zijn waarschuwingen die de TC bewust mag negeren.

---

## 12. OW-teamgroottes

Naast de KNKV-regels hanteert c.k.v. Oranje Wit eigen richtlijnen voor teamgrootte:

| Categorie | Minimum | Ideaal | Maximum |
|---|---|---|---|
| **4-tal** (Blauw, Groen) | 5 | 6 | 6 |
| **8-tal breedte** (Geel, Oranje, Rood) | 9 | 10 | 11 |
| **A-categorie team** (U15/U17/U19) | 8 | 10 | 11 |
| **A-categorie selectie** (2 teams samen) | 18 | 20 | 22 |
| **Senioren selectie** | 20 | 24 | 26 |

Bij A-categorie (U15, U17, U19) werkt OW altijd met twee teams per categorie: een prestatieteam en een ontwikkelteam. Samen vormen ze een selectiegroep van idealiter 20 spelers (10 jongens + 10 meisjes).

---

## 13. De USS-score

USS staat voor Geunificeerde Score Schaal. Het is een getal van 0 tot 200 dat aangeeft hoe sterk een speler of team is. Hoe hoger, hoe sterker.

| USS | Niveau |
|---|---|
| 0-20 | Net begonnen (jongste Blauw) |
| 20-50 | Blauw / Groen niveau |
| 50-80 | Groen / Geel niveau |
| 80-110 | Geel niveau |
| 110-130 | Oranje / sterk Geel |
| 130-150 | Rood / A-categorie instap |
| 150-170 | A-categorie (U17, U19) |
| 170-200 | Top jeugd / senioren |

De USS combineert drie bronnen:
- **KNKV-teamrating** — hoe sterk het team presteert in competitie
- **Scouting-score** — hoe scouts de individuele speler beoordelen
- **Trainerevaluatie** — hoe de trainer de speler beoordeelt ten opzichte van het team

Het handige is dat je hiermee een speler kunt vergelijken met een team. Een speler met USS 115 in een team met USS 90 is een van de sterksten. In een team met USS 130 zou diezelfde speler onderaan zitten.

---

## 14. Privacy

- Persoonsgegevens zijn alleen zichtbaar voor mensen die ze nodig hebben
- TC-leden zien alle spelersgegevens
- Trainers zien alleen hun eigen teamleden
- Scouts zien spelersprofielen die ze mogen scouten
- Spelers/ouders zien alleen hun eigen gegevens
- Er worden geen BSN-nummers, adressen of andere gevoelige gegevens opgeslagen in het platform

---

## 15. Veelgestelde vragen

### Hoe log ik in?

Ga naar [ckvoranjewit.app](https://ckvoranjewit.app) en klik op **Inloggen met Google**. Gebruik het Google-account dat bij de TC bekend is. Heb je geen account? Neem contact op met de TC.

### Ik ben trainer, wat moet ik doen?

Je krijgt een mail als er een evaluatieronde loopt. Klik op de link in de mail en vul per speler het formulier in. Dat is het.

### Hoe vul ik een zelfevaluatie in?

Je krijgt een persoonlijke link per mail. Klik erop, vul het formulier in en druk op "Versturen". Geen account nodig.

### Wat betekenen de rode/oranje/groene meldingen?

- **Rood** = landelijke KNKV-regel overtreden. Moet opgelost worden.
- **Oranje** = OW-voorkeur niet gevolgd. Mag, maar denk erover na.
- **Groen** = alles in orde.

### Hoe werkt de USS-score?

De USS is een getal van 0 tot 200 dat de sterkte van een speler of team aangeeft. Het combineert gegevens van competitieresultaten, scouting en trainerevaluaties. Zie sectie 13 voor de volledige uitleg.

### Wie kan mijn gegevens zien?

Dat hangt af van je rol. TC-leden zien alles, trainers zien hun eigen team, spelers zien alleen hun eigen profiel. Gevoelige gegevens (adres, BSN) worden niet opgeslagen in het platform.

### Ik zie een app niet op mijn startpagina

Je ziet alleen de apps die bij je rol horen. Als je denkt dat er iets mist, neem contact op met de TC om je rol te laten controleren.

### De app werkt niet goed op mijn telefoon

De scouting-app is speciaal ontworpen voor mobiel gebruik. De andere apps werken het beste op een laptop of tablet, maar zijn ook op telefoon te gebruiken.

### Ik heb een fout gevonden

Neem contact op met de TC. Beschrijf wat je deed, wat je verwachtte en wat er gebeurde.

---

*c.k.v. Oranje Wit — "Een leven lang!" — Dordrecht*
