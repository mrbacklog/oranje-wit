# Domeinreview: What-if model voor Team-Indeling

**Datum**: 2026-03-29
**Reviewer**: Korfbal-technisch expert (korfbal-agent)
**Bron**: `docs/specs/2026-03-29-what-if-model-design.md`
**Status**: Review compleet, klaar voor handshake

---

## 1. Past het what-if model bij de TC-werkwijze?

### Ja, dit model past beter dan het huidige scenario-model

De TC van c.k.v. Oranje Wit (Merel, Antjan, Thomas) werkt in de praktijk al op de manier die het what-if model beschrijft. Het huidige scenario-model (volledige kopie van de hele indeling) werd in de praktijk nauwelijks benut voor parallelle scenario's. De werkelijke workflow is:

1. **Blauwdruk vastleggen**: hoeveel teams, welke categorieeen, teamgrootte-targets, speerpunten
2. **Eeen werkindeling opbouwen**: spelers toewijzen aan teams, stapsgewijs
3. **Deelvragen verkennen**: "Wat als Klaas naar Senioren 1 gaat?" of "Kunnen we een 3e seniorenteam maken?"
4. **Besluit nemen**: wijziging doorvoeren of verwerpen
5. **Doorwerken**: tot de indeling compleet is

Het scenario-model dwingt je om een *hele* indeling te kopieeren voordat je eeen deelvraag kunt onderzoeken. Dat past niet bij hoe de TC denkt. Het what-if model sluit hier veel beter op aan.

### Coordinatoren en doelgroepen

Een belangrijk aspect dat in het design goed zit: coordinatoren werken parallel per doelgroep. De jeugdcoordinator werkt aan de jeugdindeling, de seniorencoordinator aan de senioren. What-ifs zijn per definitie *doelgroep-lokaal* tenzij ze expliciet doorwerken naar andere doelgroepen. Dat past bij de parallelle werkwijze.

### Top-TC en selectieteams

De Top-TC (bestuurslid technische zaken + hoofdtrainer) bepaalt de selectieteams (U15-1, U17-1, U19-1, Senioren 1-2) binnen de kaders van de blauwdruk. What-ifs over selectieteams zijn typisch gevoeliger en minder geschikt om breed te delen. Het autorisatiemodel (scope-filtering uit de scheiding-spec) is hier cruciaal: selectie-what-ifs moeten beperkt zichtbaar zijn.

### Aandachtspunt: eeen werkindeling is in de praktijk niet altijd stabiel

In de beginfase van het seizoensplanningsproces (maart-mei) is de werkindeling nog zeer vloeibaar. Er is dan eigenlijk nog geen "werkindeling" maar een verzameling losse brokken. Het model moet daarmee om kunnen: een werkindeling die grotendeels leeg is, met what-ifs die de eerste contouren verkennen.

**Aanbeveling voor UX-designer**: ontwerp een toestand voor de werkindeling die nog grotendeels leeg is. Het mag niet aanvoelen alsof je "al een indeling hebt" voordat die er is.

---

## 2. Typische what-if scenario's

### Scenario 1: Extra seniorenteam
**Vraag**: "Wat als we een 3e (of 6e) seniorenteam maken?"
**Teams geraakt**: Senioren 1-4 (of 5+), mogelijk U19
**Domino-effect**: Spelers uit bestaande teams worden verdeeld, U19-spelers worden eerder opgetrokken. Senioren 2 kan onder minimum komen. Stafbezetting wordt een probleem.
**Validatie**: teamgrootte (KNKV min 8 voor A, OW ideaal 10-11 voor breedte), genderbalans (4V+4M bij A-cat), staf (trainer nodig voor extra team), blauwdruk (wijkt af van gepland aantal teams).

### Scenario 2: Talent doorschuiven naar selectie
**Vraag**: "Wat als we Lisa (U15-2) naar U15-1 halen?"
**Teams geraakt**: U15-1, U15-2 (altijd als selectiepaar)
**Domino-effect**: U15-2 verliest een speelster, genderbalans kan scheeftrekken. U15-1 kan vol raken. Mogelijk moet een 2e-jaars terug naar U15-2.
**Validatie**: selectiegrootte (OW: 20 spelers per selectie, 10M+10V ideaal), genderbalans (4V+4M verplicht bij A-cat), pinnen ("Lisa blijft in U15-2" als pin van de coordinator).

### Scenario 3: Categorie-overgang bij leeftijdsgrens
**Vraag**: "Wat als we de oudste geel-spelers naar oranje laten doorstromen?"
**Teams geraakt**: Geel teams, Oranje teams
**Domino-effect**: Geel wordt kleiner, oranje wordt groter. Gemiddelde leeftijd van geel daalt, van oranje ook (jonge aanwas). Kleur-herindelingsrisico bij de bond.
**Validatie**: leeftijdsspreiding (max 3 jaar voor 8-tallen), gemiddelde leeftijd (min 9.0 voor 8-tal), kleur-grens (KLEUR_VEILIGE_RANGE), teamgrootte.

### Scenario 4: Stopper-cascade
**Vraag**: "Wat als de 3 twijfelaars bij Senioren 3 allemaal stoppen?"
**Teams geraakt**: Senioren 3, mogelijk Senioren 2, mogelijk U19
**Domino-effect**: Senioren 3 valt onder minimum (8 spelers). Opties: team opheffen (spelers verdelen over Sen 2 en 4), of spelers uit Senioren 2/U19 optrekken.
**Validatie**: teamgrootte (KNKV minimums), impact-analyse (best/verwacht/worst case uit `impact.ts`).

### Scenario 5: Gender-probleem oplossen
**Vraag**: "Wat als we Groen 2 en Groen 3 samenvoegen? We hebben maar 1 meisje in Groen 3."
**Teams geraakt**: Groen 2, Groen 3 (verwijderd), mogelijk Groen 1
**Domino-effect**: Samenvoeging maakt een team te groot (meer dan 8 bij een 4-tal). Alternatief: herverdeling over 2 teams in plaats van 3.
**Validatie**: gender_alleen (OW-regel: nooit 1 kind alleen van een geslacht), teamgrootte (4-tal max 6-8), blauwdruk (gepland aantal teams wijzigt).

### Scenario 6: U19-speler wil bij senioren spelen
**Vraag**: "Wat als Tim (U19) al bij Senioren 2 gaat spelen?"
**Teams geraakt**: U19-1 of U19-2, Senioren 2
**Domino-effect**: U19-selectie verliest een speler, kan onder de 18 komen. Tim is vastgespeeld na 3 wedstrijden bij senioren (KNKV-regel).
**Validatie**: bandbreedte U19 (geboortejaar check), vastspeel-risico (KNKV: 3 wedstrijden), selectiegrootte.

### Scenario 7: Nieuwe aanmelding mid-season
**Vraag**: "Wat als we die 2 nieuwe aanmeldingen (jongen 11, meisje 12) in Geel plaatsen?"
**Teams geraakt**: Geel teams
**Domino-effect**: Geel 1 of 2 wordt voller. Mogelijk moet herverdeling over geel-teams.
**Validatie**: teamgrootte, leeftijd past bij geel (9-13 jaar range), genderbalans.

### Scenario 8: Coach-wissel
**Vraag**: "Wat als onze U17-trainer stopt? Kunnen we de U15-assistent laten doorschuiven?"
**Teams geraakt**: U17 (staf), U15 (staf)
**Domino-effect**: Stafbezetting. U15 verliest assistent, U17 krijgt minder ervaren trainer. Duurzaamheids-toets: is deze stafbezetting volhoudbaar?
**Validatie**: staf-pinnen (STAF_POSITIE pins), duurzaamheid (Oranje Draad toetsvraag 4).

### Blinde vlekken van het model

1. **Staf-impact is beperkt uitgewerkt**. Het design heeft WhatIfTeamStaf, maar het impact-panel toont alleen speler-delta's. Een what-if die leidt tot een staf-tekort is net zo relevant als een speler-tekort.

2. **Selectiegroepen als geheel**. OW behandelt U15-1 en U15-2 altijd als een selectie (20 spelers, 10M+10V). Het design valideert per team, maar de selectie-validatie (`selectie-regels.ts`) kijkt naar het *paar*. What-ifs die een selectieteam raken, moeten automatisch het andere selectieteam mee-valideren.

3. **Vastspeel-regel**. De KNKV-regel dat een speler na 3 wedstrijden in hetzelfde team is vastgespeeld, is niet meegenomen in de validatie. Dit is relevant voor what-ifs die mid-season spelers verplaatsen.

4. **Combinatie-what-ifs**. Wat als je twee what-ifs tegelijk wilt *toepassen*? Het design zegt "eeen what-if tegelijk actief", maar bij toepassen moet je ook rekening houden met de combinatie-effecten van recent toegepaste what-ifs.

---

## 3. Validatie-volledigheid

### 3.1 Relevante KNKV-regels voor what-if validatie

| Regel | Beschrijving | Type | Al in code? |
|---|---|---|---|
| Teamgrootte min/max | Per format (4-tal/8-tal) en categorie | Hard | Ja (`harde-regels.ts`) |
| Leeftijdsspreiding | 2 jaar (4-tal), 3 jaar (8-tal) | Hard | Ja (`harde-regels.ts`) |
| Gemiddelde leeftijd 8-tal | Min 9.0 jaar | Hard | Ja (`harde-regels.ts`) |
| Bandbreedte A-categorie | 2 geboortejaren per U-categorie | Hard | Ja (`harde-regels.ts`) |
| Gender 4V+4M (A-cat) | Verplicht in wedstrijdkorfbal | Hard | Ja (`zachte-regels.ts`) |
| Kleur-herindelingsrisico | Gem. leeftijd buiten veilige range | Zacht | Ja (`harde-regels.ts` kleur-grens) |
| Vastspeel-regel | 3 wedstrijden = vastgespeeld | Hard | **Nee** |
| Invallers leeftijdsregel | Max 1.5 jaar ouder dan gem. team | Zacht | **Nee** |

### 3.2 Relevante OW-voorkeuren

| Voorkeur | Beschrijving | Type | Al in code? |
|---|---|---|---|
| Nooit 1 kind alleen | Min 2 van elk geslacht per team | Hard | Ja (`zachte-regels.ts`) |
| Teamgrootte-targets | Per kleur/categorie specifiek | Zacht | Ja (via `BlauwdrukKaders`) |
| Selectie als paar | 2 teams = 20 spelers, 10M+10V | Zacht | Ja (`selectie-regels.ts`) |
| Prestatie/ontwikkel-verdeling | ~65/35% 2e/1e-jaars in prestatieteam | Zacht | **Nee** |
| Geel altijd 8-tal | OW kiest altijd 8-tal bij geel | Info | Impliciet (via kleur-format) |

### 3.3 Relevante Oranje Draad toetsingsvragen

Alle vijf toetsingsvragen zijn relevant bij what-ifs:

1. **Sociale cohesie** (Plezier) -- Wordt een team uit elkaar getrokken? Verliezen vriendjes/vriendinnen elkaar? Dit is niet te automatiseren maar moet als aandachtspunt in het impact-panel.
2. **Uitdaging op niveau** (Ontwikkeling) -- Wordt een speler onder- of boven-niveau geplaatst? Relevant bij doorschuif-what-ifs.
3. **Selectieteams competitief** (Prestatie) -- Wordt het prestatieteam zwakker door deze what-if? Relevant bij talent-doorschuif scenario's.
4. **Staf-volhoudbaarheid** (Duurzaamheid) -- Leidt de what-if tot een staf-tekort of overbelasting? Dit mist grotendeels in het huidige design.
5. **Retentierisico** (Duurzaamheid) -- Zijn er spelers in deze what-if die al een hoog retentierisico hebben (uit de signalering-tabel)?

### 3.4 Wat mist er in de drie validatielagen?

**Laag 1: KNKV-regels (harde fouten)**
- Vastspeel-regel ontbreekt (relevant voor mid-season what-ifs)
- Invallers-leeftijdsregel ontbreekt (relevant voor B-categorie)
- *Aanbeveling*: deze twee toevoegen is niet nodig voor fase 1-2, maar wel voor fase 4 (validatie)

**Laag 2: Blauwdruk-kaders (afwijkingen)**
- Aantal teams per categorie: goed beschreven
- Teamgrootte-targets: goed beschreven
- **Mist**: prestatie/ontwikkel-verdeling binnen selectie (65/35% 2e-jaars)
- **Mist**: blauwdruk-speerpunten als zachte check ("dit seizoen focus op doorstroom")

**Laag 3: Pins (harde fouten)**
- SPELER_STATUS: speler mag niet verplaatst worden -- goed beschreven
- SPELER_POSITIE: speler moet in specifiek team -- goed beschreven
- STAF_POSITIE: staf moet bij specifiek team -- beschreven maar impact-panel toont dit niet
- **Mist**: "anti-pins" -- spelers die *niet* samen in een team mogen (komt in de praktijk voor bij conflicten of te grote vriendengroepen die de groepsdynamiek verstoren)

**Aanbeveling**: voeg een vierde validatielaag toe:

| Laag | Bron | Voorbeeld |
|---|---|---|
| **Oranje Draad** | POP-ratio's, retentiedata | "3 spelers met hoog retentierisico in dezelfde what-if" |

Dit hoeft geen harde blokkering te zijn, maar een informatief signaal in het impact-panel.

---

## 4. Doelgroep-overstijgende effecten

### 4.1 Doorschuiven in de praktijk

Bij c.k.v. Oranje Wit loopt het doorschuiven van spelers altijd van jong naar oud, langs de leeftijdsas:

```
Blauw (5-7) -> Groen (8-9) -> Geel (10-12) -> Oranje (13-15) / U15
                                                  -> Rood (16-18) / U17 / U19
                                                                       -> Senioren
```

Doorschuiven gebeurt typisch:
- **Seizoensovergang** (juni-augustus): de standaard. Oudste spelers van een kleur gaan naar de volgende.
- **Mid-season**: alleen bij grote tekorten of uitzonderlijke talenten.
- **Optrekken naar A-categorie**: talent uit breedte-oranje naar U15, of uit breedte-rood naar U17/U19. Dit is een bewuste keuze, geen automatisme.

### 4.2 Welke doelgroep-combinaties beinvloeden elkaar het meest?

**Sterk gekoppeld** (wijziging in een werkt bijna altijd door in de ander):
- U15-1 en U15-2 (altijd als paar)
- U17-1 en U17-2 (altijd als paar)
- U19-1 en U19-2 (altijd als paar)
- Senioren 1 en Senioren 2 (selectie-verband)
- Oranje en U15 (doorstroom-grens B naar A)

**Regelmatig gekoppeld** (bij specifieke scenario's):
- Geel en Oranje (doorstroom)
- Rood en U17/U19 (breedte naar selectie)
- U19 en Senioren (overgang naar senioren)
- Senioren 2 en Senioren 3 (spelers schuiven op)

**Zelden gekoppeld** (alleen bij extreme situaties):
- Blauw en Groen (bijna nooit doorwerk-effect)
- Groen en Geel (soms bij kleine aantallen)
- Senioren 4+ onderling (vrij onafhankelijk)

### 4.3 Afhankelijkheden tussen what-ifs in de korfbalcontext

Het ontwerp beschrijft afhankelijkheden correct. In de praktijk zien we drie patronen:

**Patroon 1: Sequentiele afhankelijkheid**
"Kunnen we een 3e seniorenteam maken?" moet eerst beantwoord zijn voordat "Waar plaatsen we de U19-doorstromers?" zin heeft. De tweede what-if hangt af van de eerste.

**Patroon 2: Wederzijdse uitsluiting**
"Lisa naar U15-1" en "Lisa naar U17 (optrekken)" sluiten elkaar uit. Als je de ene toepast, wordt de andere ongeldig. Het design beschrijft dit als "afhankelijke what-if wordt bijgewerkt of ongeldig verklaard" -- dat klopt, maar de UI moet dit duidelijk maken.

**Patroon 3: Onafhankelijk maar gecombineerd effect**
"Extra seniorenteam" en "Geel herverdelen" zijn onafhankelijk, maar als je ze allebei toepast, verplaats je meer spelers dan verwacht. Het gecombineerde effect moet controleerbaar zijn.

**Aanbeveling voor ontwikkelaar**: bij het toepassen van een what-if, draai de volledige validatie opnieuw over de werkindeling (inclusief eerder toegepaste what-ifs). Niet alleen de delta valideren.

---

## 5. Seizoenscyclus

### 5.1 Wanneer worden what-ifs het meest gebruikt?

| Periode | Activiteit | What-if gebruik |
|---|---|---|
| **Maart-april** | Evaluaties binnenkomen, eerste signalen | Laag. Werkindeling is nog leeg. What-ifs zijn verkennend: "hoeveel teams kunnen we maken?" |
| **April-mei** | Blauwdruk vaststellen, spelers toewijzen | Hoog. De bulk van het indelingswerk. "Wat als we 2 i.p.v. 3 geel-teams maken?" |
| **Mei-juni** | Indeling afronden, delen met coordinatoren | Zeer hoog. Finetuning. "Wat als we Piet en Karin wisselen?" Veel kleine what-ifs. |
| **Juni** | Pre-season indeling communiceren | Laag. Indeling is (bijna) definitief. Alleen nood-what-ifs bij late stoppers. |
| **Aug-sept** | Seizoen start, competitie-inschrijving | Middel. Nieuwe aanmeldingen, late stoppers, KNKV-herindeling van kleuren. |
| **Okt-dec** | Najaarcompetitie | Laag. Alleen bij blessures, verhuizingen, conflicten. |
| **Jan-feb** | Zaalseizoen | Laag. Soms bij A-categorie: wissel tussen 1 en 2. |

### 5.2 Hoe evolueert de werkindeling?

```
Maart     : [leeg]
April     : [blauwdruk staat, eerste teams gevuld, veel gaten]
Mei       : [80% gevuld, veel what-ifs voor de resterende 20%]
Juni      : [95%+ gevuld, indeling gedeeld, "definitief"]
Augustus  : [100%, aangepast voor late wijzigingen]
September : [definitief na KNKV-inschrijving]
```

### 5.3 Momenten waarop het model anders moet werken

**Pre-blauwdruk (maart)**
- Er is nog geen werkindeling. Het model moet toestaan dat de "werkindeling" leeg is en what-ifs puur verkennend zijn ("hoeveel teams kunnen we vormen met deze aantallen?").
- *Aanbeveling*: de wizard "start werkindeling vanuit blauwdruk" is de juiste entry point. Maak duidelijk dat je eerst een blauwdruk nodig hebt.

**Post-definitief (september+)**
- De werkindeling is bevroren (status DEFINITIEF). What-ifs voor mid-season wijzigingen moeten nog steeds mogelijk zijn, maar met extra waarschuwingen:
  - Vastspeel-risico (speler is al 2x opgesteld in huidig team)
  - Competitie-gevolgen (team staat al ingeschreven bij KNKV)
  - Sociale impact (speler wordt mid-season overgeplaatst)

**Zaal-overgang (december-januari)**
- Sommige teams wijzigen bij de overgang van veld naar zaal (andere zaalsamenstelling). Dit is geen what-if maar een reguliere werkindeling-wijziging. Het model moet onderscheid maken tussen "verkennen" (what-if) en "doorvoeren" (werkindeling bewerken).

**Aanbeveling voor ontwikkelaar**: voeg een `fase` veld toe aan de Blauwdruk of werkindeling die aangeeft in welke seizoensfase de planning zit (VERKENNING, OPSTELLEN, AFRONDEN, DEFINITIEF, UITVOERING). Dit stuurt welke validaties en waarschuwingen actief zijn.

---

## 6. Risico's en aanbevelingen

### 6.1 Risico's

**R1: Complexiteit van het impact-panel**
Het impact-panel moet real-time delta's tonen over meerdere teams, inclusief domino-effecten. Dit is technisch complex en kan traag worden bij grote indelingen. Bij OW gaat het om ~25-30 teams en ~300 spelers -- dat is beheersbaar, maar de architectuur moet er op voorbereid zijn.
*Mitigatie*: bouw het impact-panel incrementeel (fase 3), begin met simpele tellingen.

**R2: Overgang van scenario-denken naar what-if-denken**
De TC is gewend aan het scenario-model, ook al gebruikten ze het suboptimaal. De overstap naar een nieuw model kost tijd.
*Mitigatie*: stapsgewijze invoering (zie 6.3). Begin met de werkindeling, voeg what-ifs later toe.

**R3: What-if-wildgroei**
Als de TC veel what-ifs openlaat zonder ze toe te passen of te verwerpen, wordt de zijbalk onoverzichtelijk en verliest het model zijn kracht.
*Mitigatie*: bouw een opruim-mechanisme. Na 2 weken inactiviteit: herinnering. Na toepassen van een gerelateerde what-if: suggestie om afhankelijke what-ifs te reviewen.

**R4: Selectie-paar wordt niet als geheel behandeld**
Het design behandelt teams individueel. Bij OW zijn selecties (U15-1/U15-2, U17-1/U17-2) altijd een paar. Als je een what-if start op U15-1, moet U15-2 automatisch mee. Dit staat niet expliciet in het design.
*Mitigatie*: voeg een "selectie-koppeling" toe. Als een team onderdeel is van een SelectieGroep, wordt het andere team automatisch meegenomen.

**R5: Staf-aspect is onderbelicht**
What-ifs over spelers krijgen alle aandacht, maar in de praktijk is stafbezetting net zo vaak het breekpunt. "We willen een 3e seniorenteam, maar wie gaat dat trainen?" Die vraag bepaalt of de what-if haalbaar is.
*Mitigatie*: toon staf-status in het impact-panel naast speler-delta's. "Team X: 10 spelers, 0 trainers".

**R6: Verlies van historische scenario-data**
De migratie converteert bestaande scenario's naar de werkindeling. Oude scenario-vergelijkingen gaan verloren als die niet expliciet worden gearchiveerd.
*Mitigatie*: het design beschrijft archivering correct. Zorg dat oude scenario's raadpleegbaar blijven, ook als ze niet meer bewerkbaar zijn.

### 6.2 Welke training heeft de TC nodig?

1. **Conceptueel**: uitleggen waarom "eeen werkindeling + what-ifs" beter past dan "meerdere scenario's". Concreet voorbeeld doorwerken met de TC.
2. **Praktisch**: what-if aanmaken, bewerken, toepassen, verwerpen. Impact-panel lezen. Acties aanmaken en toewijzen.
3. **Workflow**: wanneer maak je een what-if vs. wanneer bewerk je de werkindeling direct? Vuistregel: als het een *vraag* is ("wat als..."), maak een what-if. Als het een *besluit* is ("we doen dit"), bewerk de werkindeling.

De training hoeft niet formeel: een 30-minuten walkthrough met het TC is voldoende, mits de UI intuietief genoeg is.

### 6.3 Stapsgewijze invoering (aanbevolen)

| Stap | Wat | Wanneer | Risico |
|---|---|---|---|
| 1 | Werkindeling als startscherm (geen what-ifs) | Zo snel mogelijk | Laag -- is vooral een UI-wijziging |
| 2 | What-if basis (aanmaken, bewerken, toepassen/verwerpen) | Na UX-handshake | Middel -- nieuw concept voor TC |
| 3 | Impact-panel en automatisch meenemen | Na stap 2 stabiel is | Middel -- technisch complex |
| 4 | Validatie in what-ifs (KNKV + blauwdruk + pins) | Na stap 3 | Laag -- hergebruik bestaande validatie-engine |
| 5 | Acties, afhankelijkheden, blokkering | Wanneer stap 2-4 bewezen | Middel -- workflow-complexiteit |

**Big bang wordt afgeraden.** De TC heeft beperkte tijd en kan niet in eeen keer een heel nieuw model leren. Stapsgewijs invoeren geeft ruimte om feedback te verwerken.

**Timing**: stap 1 kan voor het seizoen 2026-2027 (planning start april 2026). Stap 2-3 tijdens het seizoen, stap 4-5 voor seizoen 2027-2028.

---

## Samenvatting voor handshake-partners

### Voor de UX-designer

- Ontwerp een "lege werkindeling" toestand die niet suggereert dat de indeling al af is
- Selectieparen (U15-1/U15-2) moeten visueel als geheel behandeld worden
- Het impact-panel moet naast speler-delta's ook staf-status tonen
- Overweeg een Oranje Draad-indicatortje: "3 spelers met retentierisico in deze what-if"
- De drie-zone editor (actief/impact/ongeraakt) is goed bedacht, maar test met de TC of de terminologie ("impact-team") aansluit bij hun denkwijze

### Voor de ontwikkelaar

- Het bestaande validatiesysteem (`lib/teamindeling/validatie/`) is een solide basis. De what-if validatie kan hierop voortbouwen door `valideerTeam()` en `valideerSelectie()` aan te roepen op de what-if teams
- **Let op**: selectie-validatie (`selectie-regels.ts`) moet automatisch meelopen als een selectieteam in een what-if zit
- **Let op**: cross-team duplicaten (`valideerDubbeleSpelersOverTeams`) moet draaien over de *gecombineerde* set van werkindeling + what-if teams (niet alleen de what-if teams)
- Vastspeel-regel en invallers-leeftijdsregel hoeven niet in fase 1-3, maar bereid de validatie-types voor op uitbreiding
- De `impact.ts` (best/verwacht/worst case op basis van spelerstatus) is direct bruikbaar voor what-if impact-berekeningen
- Overweeg een `fase`-veld op Blauwdruk/werkindeling om seizoensfase-afhankelijke validatie te sturen

### Voor de product-owner

- Het what-if model past goed bij de TC-werkwijze. Goedkeuring is terecht.
- Stapsgewijze invoering is sterk aan te raden. Begin met de werkindeling, voeg what-ifs pas toe na UX-handshake.
- De vijf genoemde risico's zijn beheersbaar maar vragen aandacht bij de implementatie.
- De twee blinde vlekken (staf-impact en selectie-als-geheel) moeten in het design worden opgelost voordat implementatie van fase 2 start.
- Prioriteer de integratie met het signaal/actie-systeem (uit de scheiding-spec sectie 8) zodra dat design gereed is -- what-ifs en signalen zijn in de praktijk onlosmakelijk verbonden.
