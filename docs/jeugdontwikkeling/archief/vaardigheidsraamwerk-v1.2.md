# Vaardigheidsraamwerk v1.2 — c.k.v. Oranje Wit

> **Versie:** 1.2
> **Datum:** 2026-03-26
> **Status:** Definitief concept ter goedkeuring TC/bestuur
> **Doelgroep:** Technische Commissie, trainers, scouts, bestuur
> **Toepassingen:** Scouting-app, spelerskaart, trainer-evaluaties, doorstroombeleid
> **Wijzigingen t.o.v. v1.1:** Zie Changelog v1.1 → v1.2 (sectie 14)

---

## 1. Samenvatting

Dit document beschrijft het complete jeugdontwikkelings- en scoutingssysteem van c.k.v. Oranje Wit. Het raamwerk verbindt de Oranje Draad (Plezier + Ontwikkeling + Prestatie) met een concreet beoordelingsmodel dat meegroeit met de leeftijd van het kind.

**Het model in het kort:**

- **7 scores op de spelerskaart:** 4 korfbalacties (SCHIETEN, AANVALLEN, PASSEN, VERDEDIGEN) + 3 persoonlijke dimensies (FYSIEK, MENTAAL, SOCIAAL)
- **3 lagen per korfbalactie:** Technisch (KAN je het?), Tactisch (WEET je wanneer?), Mentaal (DOE je het als het ertoe doet?) — gebaseerd op Football Manager's driehoek
- **Inside Out meegroei-principe:** Bij de jongsten 4 basispijlers met smileys, bij de oudsten 7 volledige scores met sliders — het systeem groeit mee met het kind
- **3 scoutingsmethoden:** Individueel (diepgaand), Team (breed), Vergelijking (relatief)
- **USS-integratie:** Alle scores worden vertaald naar de Geunificeerde Score Schaal (0-200), zodat scouts, trainers en de TC dezelfde taal spreken
- **Geen labels, wel observaties:** Mentale en sociale kwaliteiten worden beoordeeld op basis van zichtbaar gedrag, nooit als persoonlijkheidslabels
- **Sociale veiligheid als voorwaarde:** Bij elke leeftijdsgroep wordt sociale veiligheid geobserveerd als signaalvlag of item — zonder veiligheid zijn alle andere scores irrelevant
- **Veld/zaal context:** Elke scouting-sessie registreert of de observatie op het veld of in de zaal is gedaan

**Totaaltellingen (v1.2):**

| Groep | Leeftijd | Items |
|-------|----------|-------|
| Blauw | 5-7 | 9 (8 + 1 signaalvlag) |
| Groen | 8-9 | 13 (12 + 1 signaalvlag) |
| Geel | 10-12 | 22 |
| Oranje | 13-15 | 37 (+ 1 optioneel) |
| Rood | 16-18 | 58 (35 korfbalacties + 23 persoonlijk) |

Het raamwerk is wetenschappelijk onderbouwd door het Athletic Skills Model (ASM), Self-Determination Theory (SDT), het Mental Toughness 4C-model, Football Manager's Technical/Mental/Physical driehoek, en KNKV-talentontwikkelingsbeleid.

---

## 2. De 7 scores en hun betekenis

### Groep 1 — Korfbalacties (4 scores)

De vier korfbalacties vormen de kern van het beoordelingssysteem. Ze zijn gebaseerd op de vier aanvallende KNKV-korfbalacties en dekken het complete korfbalspel.

| Score | Afkorting | Betekenis | Wat het omvat |
|-------|-----------|-----------|---------------|
| **SCHIETEN** | SCH | Scoren en afronden | Afstandsschot, doorloopbal, strafworp, schotvariatie, schotselectie, scorend vermogen, aanvallende rebound |
| **AANVALLEN** | AAN | Ruimte creeren en dreigen | Vrijlopen, positiespel, dreigen richting korf, omschakeling, 1-op-1 vermogen, spelcreatie |
| **PASSEN** | PAS | Bal verplaatsen en samenspelen | Passtechniek, overzicht, besluitvorming, balbehandeling, aanname in beweging, creativiteit, balbezitbeheer |
| **VERDEDIGEN** | VER | Tegenstander stoppen | Mandekking, onderscheppen, reboundwerk, verdedigingscommunicatie, blokken, druk op de bal |

Elke korfbalactie heeft drie lagen als drill-down (zie sectie 4):

| Laag | Vraag | Voorbeeld bij SCHIETEN |
|------|-------|------------------------|
| **Technisch** | KAN je het? | Heeft de speler de schottechniek om van afstand te scoren? |
| **Tactisch** | WEET je wanneer? | Kiest de speler het juiste moment en het juiste schot? |
| **Mentaal** | DOE je het als het ertoe doet? | Schiet de speler ook bij 4-4 in de laatste minuut? |

Dit drielagen-model is gebaseerd op Football Manager's Technical/Mental/Physical driehoek — het enige grote ratingsysteem dat een echte dimensionale structuur gebruikt (zie `docs/jeugdontwikkeling/research-game-ratings.md`).

> **Uitlegkader: Mentale laag per actie vs. MENTAAL-pijler**
>
> De term "mentaal" komt op twee plekken voor in het raamwerk. Dit is geen dubbeling — het zijn twee fundamenteel verschillende dingen:
>
> | | Mentale laag per korfbalactie | MENTAAL-pijler |
> |---|---|---|
> | **Wat het meet** | Presteren onder druk *bij deze specifieke actie* | Mentale instelling *over de hele wedstrijd heen* |
> | **Kernvraag** | DOE je het als het ertoe doet? | Hoe ga je om met druk, tegenslagen en uitdagingen? |
> | **Voorbeeld** | `sch_m_penalty`: Scoort de speler een strafworp bij 4-4? | `men_weerbaarheid`: Herstelt de speler na drie tegendoelpunten? |
> | **Vergelijking** | Je zenuwen bij een specifiek tentamen wiskunde | Hoe je in het algemeen omgaat met stress |
> | **Constructtype** | Situatie-specifiek (state) | Persoonsbreed (trait-achtig) |
>
> **Concreet voorbeeld:** Een speler kan een ijskoude strafworpnemer zijn (`sch_m_penalty` = 9) maar totaal de concentratie verliezen na drie tegendoelpunten (`men_concentratie` = 5). Of andersom: een speler die mentaal rotsvast is (`men_weerbaarheid` = 9) maar bij de strafworp altijd mist door een slechte routine (`sch_m_penalty` = 4).
>
> **Voor de trainer:** Als je de mentale laag bij SCHIETEN invult, denk dan alleen aan het schieten. Als je de MENTAAL-pijler invult, denk dan aan de speler als persoon over de hele wedstrijd.

> **Uitlegkader: Waarom drie lagen en niet vier?**
>
> De drie lagen per korfbalactie zijn Technisch, Tactisch en Mentaal. Een logische vraag is: waarom is Fysiek geen vierde laag? Het antwoord: de fysieke component (kracht, snelheid, uithouding) is niet actie-specifiek op dezelfde manier als techniek en mentaal. Een explosieve sprint is relevant voor zowel aanvallen als verdedigen; schotkracht is relevant voor zowel schieten als passen. Daarom is FYSIEK een aparte pijler die *dwars door alle acties snijdt*, niet een laag per actie. Het ASM ondersteunt dit: fysieke kwaliteiten worden breed beoordeeld, niet per sportspecifieke actie (Wormhoudt et al., 2018).

### Groep 2 — Persoonlijke dimensies (3 scores)

De drie persoonlijke dimensies staan los van de korfbalacties en snijden er dwars doorheen. Ze zijn gebaseerd op het Athletic Skills Model (ASM) en het geconsolideerde framework uit de talentassessment-research.

| Score | Afkorting | Betekenis | Wat het omvat |
|-------|-----------|-----------|---------------|
| **FYSIEK** | FYS | Het lichaam als instrument | Snelheid, uithoudingsvermogen, kracht, beweeglijkheid, sprongkracht, herstelvermogen |
| **MENTAAL** | MEN | Het hoofd in het spel | Inzet, concentratie, weerbaarheid, wedstrijdmentaliteit, spelintelligentie, emotieregulatie |
| **SOCIAAL** | SOC | De speler in het team | Communicatie, samenwerking, leiderschap, teamsfeer, rolacceptatie, conflicthantering, plezier, sociale veiligheid |

**Totaal: 7 scores op de spelerskaart + 1 USS overall.**

### Veld vs. Zaal — impact op beoordeling

Korfbal wordt gespeeld in twee varianten die wezenlijk verschillen. Elke scouting-sessie registreert verplicht de context: `veld` of `zaal`.

| Aspect | Veldkorfbal | Zaalkorfbal |
|--------|------------|-------------|
| **Vakgrootte** | Groot (20x40m per vak) | Klein (~20x20m per vak) |
| **Ondergrond** | Gras (nat/droog) | Parket |
| **Weerfactoren** | Wind, regen | Geen |
| **Afstandsschot** | Meer ruimte, wind als factor | Minder ruimte, sneller losdraaien |
| **Doorloopbal** | Lastiger bij regen (glad, natte bal) | Betere grip, scherpere stops |
| **Passes** | Lange passes (15-20m) essentieel | Korte tikpasses dominant |
| **Snelheid** | Herhaalde sprints over grotere afstanden | Explosieve eerste stap |
| **Beweeglijkheid** | Belangrijk, meer ruimte om te draaien | Crucialer door kleinere ruimte |
| **Vrijlopen** | Grote in-uit bewegingen | Korte, snelle richtingsveranderingen |

**Let op bij het beoordelen:** Een lage score op afstandsschot in de zaal betekent niet dat de speler niet kan schieten — mogelijk biedt de zaalcontext minder ruimte. Vergelijk scores altijd binnen dezelfde context (veld met veld, zaal met zaal).

### Cognitieve dimensie — mapping naar bestaande items

Het profiel-top-talent-18 onderscheidt een Cognitieve dimensie. In ons raamwerk is deze verdeeld over bestaande items, niet als aparte achtste pijler. Dit is bewust: acht pijlers is te veel voor trainers, en cognitieve vaardigheden zijn altijd ingebed in een korfbalactie.

| Cognitieve vaardigheid | Waar in het raamwerk | Item-ID's |
|------------------------|---------------------|-----------|
| Spellezing | Tactische laag VERDEDIGEN | `ver_ta_onderscheppen`, `ver_ta_verdedigingsvorm` |
| Anticipatie | Tactische laag VERDEDIGEN + PASSEN | `ver_ta_onderscheppen`, `pas_ta_overzicht` |
| Besluitvorming | Tactische laag PASSEN | `pas_ta_besluitvorming` |
| Patronenherkenning | Tactische laag AANVALLEN | `aan_ta_patronen` |
| Overzicht | Tactische laag PASSEN | `pas_ta_overzicht` |
| Concentratie | MENTAAL-pijler | `men_concentratie` |
| Spelintelligentie | Verdeeld over alle tactische lagen | Alle `_ta_` items |

---

## 3. Per leeftijdsgroep: pijlers, items, schaal en voorbeelden

### Inside Out meegroei-principe

De pijlers en items groeien mee met de leeftijd van het kind. Bij de jongsten is alles simpel en breed; bij de oudsten is het systeem volledig uitgewerkt. Dit is gebaseerd op twee principes:

1. **ASM-ontwikkelingsfasen:** "First the athlete, then the specialist" — breed motorisch fundament eerst, daarna sportspecifiek (Wormhoudt et al., 2018)
2. **SDT-motivatieontwikkeling:** Bij jonge kinderen domineert intrinsiek speelplezier; beoordelen mag dat nooit ondermijnen (Deci & Ryan, 2000)

De naam "Inside Out" verwijst naar de Pixar-film die emoties visualiseert. Net als de emoties in de film verschijnen onze pijlers geleidelijk: bij de jongsten zijn er vier basispijlers, bij de oudsten alle zeven.

### Schalen per leeftijdsgroep

| Groep | Leeftijd | Schaal | Symbolen |
|-------|----------|--------|----------|
| Blauw | 5-7 | 2 niveaus | :+1: :thumbsdown: |
| Groen | 8-9 | 3 niveaus | :+1: :fist: :thumbsdown: (goed / oke / nog niet) |
| Geel | 10-12 | 5 sterren | 1-5 sterren |
| Oranje | 13-15 | Slider 1-10 | 1-10 |
| Rood | 16-18 | Slider 1-10 | 1-10 |

> **Open punt: pilottest 7-punts vs. 10-puntsschaal**
>
> De 10-puntsschaal bij Oranje en Rood is mogelijk te fijnmazig voor vrijwillige trainers (Preston & Colman, 2000: inter-rater reliability daalt bij meer dan 7 schaalpunten). Een pilottest met 4-6 trainers is gepland voor v1.3: dezelfde 5 spelers scoren op zowel een 7-puntsschaal als een 10-puntsschaal, en de inter-rater reliability vergelijken. Tot die tijd blijft de 10-puntsschaal, met ankerbeschrijvingen per item (1-3 = onder niveau, 4-6 = op niveau, 7-8 = boven niveau, 9-10 = uitzonderlijk) om de werkbaarheid te verbeteren.

### Lagen per leeftijdsgroep

| Groep | Lagen |
|-------|-------|
| Blauw | Geen laag-onderscheid (basispijlers BAL/BEWEGEN) |
| Groen | Geen laag-onderscheid |
| Geel | Technisch + Tactisch |
| Oranje | Technisch + Tactisch + Mentaal |
| Rood | Technisch + Tactisch + Mentaal (meer items per laag) |

> **Herinnering bij Oranje en Rood:** De mentale laag bij een korfbalactie gaat over presteren onder druk *bij deze specifieke actie*. Het is NIET hetzelfde als de MENTAAL-pijler, die gaat over de mentale instelling van de speler in het algemeen. Zie het uitlegkader in sectie 2.

### Sociale veiligheid — bij elke leeftijdsgroep

Sociale veiligheid is geen vaardigheid van het kind maar een observatie van de omgeving. Het is de voorwaarde waaronder alle andere vaardigheden kunnen bloeien. Bij elke leeftijdsgroep wordt sociale veiligheid geobserveerd:

| Groep | Type | Item-ID | Formulering | Schaal |
|-------|------|---------|-------------|--------|
| Blauw | Signaalvlag | `veilig_welkom` | Voelt het kind zich welkom in de groep? | Ja / Nee (trainer-only) |
| Groen | Signaalvlag | `veilig_welkom` | Voelt het kind zich veilig en welkom in het team? | Ja / Nee (trainer-only) |
| Geel | Item | `soc_veiligheid` | Durft fouten te maken zonder bang te zijn voor reacties van teamgenoten | 1-5 sterren |
| Oranje | Item | `soc_veiligheid` | Voelt zich veilig om risico's te nemen en fouten te maken; wordt niet buitengesloten of gepest | Slider 1-10 |
| Rood | Item | `soc_veiligheid` | Voelt zich veilig in het team; kan kwetsbaar zijn (fouten toegeven, hulp vragen) zonder sociale consequenties | Slider 1-10 |

**Alarmsignaal:** Als het antwoord "Nee" is (Blauw/Groen) of de score 1-3 (Geel/Oranje/Rood), worden alle andere scores minder relevant. Prioriteit: bespreek sociale veiligheid met trainer, ouders en eventueel vertrouwenspersoon.

---

### 3.1 Blauw (5-7 jaar) — De basis

**POP-ratio:** 70% Plezier / 25% Ontwikkeling / 5% Prestatie

| Eigenschap | Waarde |
|------------|--------|
| Pijlers | BAL, BEWEGEN, SAMEN, IK |
| Schaal | 2 niveaus |
| Symbolen | :+1: :thumbsdown: |
| Aantal items | 9 (8 items + 1 signaalvlag) |
| Beoordelaar | Alleen trainer |

**Relatie tot volwassen pijlers:**

| Blauw-pijler | Groeit uit tot | Waarom |
|-------------|---------------|--------|
| BAL | SCHIETEN + PASSEN | Gooien en vangen is de voorloper van alle balgerelateerde acties |
| BEWEGEN | AANVALLEN + VERDEDIGEN + FYSIEK | Rennen, stoppen en bewegen vormt de motorische basis |
| SAMEN | SOCIAAL | Samenspelen is de voorloper van alle sociale vaardigheden |
| IK | MENTAAL | Durven, luisteren en doorzetten zijn de voorlopers van mentale kwaliteiten |

#### Signaalvlag — Sociale veiligheid

| # | Item-ID | Formulering | Schaal | Observatie-instructie |
|---|---------|-------------|--------|-----------------------|
| 0 | `veilig_welkom` | Voelt het kind zich welkom in de groep? | Ja / Nee | Doet het kind vrijwillig mee? Zoekt het contact met andere kinderen? Of staat het vaak alleen of achter de trainer? |

#### Korfbalactie-items (4 stuks — via basispijlers BAL en BEWEGEN)

BAL is de voorloper van SCHIETEN en PASSEN. BEWEGEN is de voorloper van AANVALLEN, VERDEDIGEN en FYSIEK.

| # | Pijler | Item-ID | Formulering | Schaal |
|---|--------|---------|-------------|--------|
| 1 | BAL | `bal_gooien` | Kan de bal gooien naar een ander | :+1: :thumbsdown: |
| 2 | BAL | `bal_vangen` | Kan de bal vangen | :+1: :thumbsdown: |
| 3 | BEWEGEN | `bew_rennen` | Rent en stopt zonder te vallen | :+1: :thumbsdown: |
| 4 | BEWEGEN | `bew_richting` | Kan van richting veranderen tijdens het bewegen | :+1: :thumbsdown: |

#### Persoonlijke items (4 stuks — via basispijlers IK en SAMEN)

IK is de voorloper van MENTAAL. SAMEN is de voorloper van SOCIAAL.

| # | Pijler | Item-ID | Formulering | Schaal |
|---|--------|---------|-------------|--------|
| 5 | SAMEN | `sam_samenspelen` | Speelt samen met anderen (geeft de bal af) | :+1: :thumbsdown: |
| 6 | SAMEN | `sam_luisteren` | Luistert naar uitleg van de trainer | :+1: :thumbsdown: |
| 7 | IK | `ik_durft` | Durft mee te doen aan oefeningen en spelletjes | :+1: :thumbsdown: |
| 8 | IK | `ik_plezier` | Heeft zichtbaar plezier tijdens training of wedstrijd | :+1: :thumbsdown: |

**Wetenschappelijke onderbouwing:**
- ASM Basic fase (5-9 jaar): verhouding basis:sport = 80:20. De nadruk ligt op de 10 basisbeweegvormen, niet op sportspecifieke vaardigheden (Wormhoudt et al., 2018).
- SDT: bij 5-7 jaar domineert intrinsiek speelplezier. Beoordelen moet dit beschermen, niet bedreigen (Deci & Ryan, 2000).
- Fun Integration Theory: de top-5 plezier-factoren bij kinderen zijn inzet, respect, speeltijd, samenspel en sociale connectie — niet winnen of scoren (Visek et al., 2015).

---

### 3.2 Groen (8-9 jaar) — Korfbalacties verschijnen

**POP-ratio:** 55% Plezier / 35% Ontwikkeling / 10% Prestatie

| Eigenschap | Waarde |
|------------|--------|
| Pijlers | SCHIETEN, AANVALLEN, PASSEN, VERDEDIGEN + FYSIEK + IK |
| Schaal | 3 niveaus |
| Symbolen | :+1: :fist: :thumbsdown: (goed / oke / nog niet) |
| Aantal items | 13 (12 items + 1 signaalvlag) |
| Beoordelaar | Alleen trainer |

**Verschil met Blauw:** BAL splitst in SCHIETEN en PASSEN, BEWEGEN splitst in AANVALLEN en VERDEDIGEN. FYSIEK verschijnt als eigen pijler. IK blijft (wordt later MENTAAL). SOCIAAL is nog niet apart — zit impliciet in alle acties. Er is nog geen laag-onderscheid (technisch/tactisch/mentaal) per korfbalactie.

#### Signaalvlag — Sociale veiligheid

| # | Item-ID | Formulering | Schaal | Observatie-instructie |
|---|---------|-------------|--------|-----------------------|
| 0 | `veilig_welkom` | Voelt het kind zich veilig en welkom in het team? | Ja / Nee | Let op: speelt het kind met iedereen of alleen met bepaalde kinderen? Wordt het buitengesloten bij het kiezen van teams? Durft het fouten te maken? |

#### Korfbalactie-items (8 stuks)

**SCHIETEN (2 items):**

| # | Item-ID | Formulering | Schaal |
|---|---------|-------------|--------|
| 1 | `sch_schieten_korf` | Schiet op de korf | :+1: :fist: :thumbsdown: |
| 2 | `sch_schotkeuze` | Schiet als er ruimte is (niet als tegenstander ervoor staat) | :+1: :fist: :thumbsdown: |

**AANVALLEN (2 items):**

| # | Item-ID | Formulering | Schaal |
|---|---------|-------------|--------|
| 3 | `aan_vrijlopen` | Loopt vrij van de tegenstander | :+1: :fist: :thumbsdown: |
| 4 | `aan_positie` | Staat op goede plekken in het vak | :+1: :fist: :thumbsdown: |

**PASSEN (2 items):**

| # | Item-ID | Formulering | Schaal |
|---|---------|-------------|--------|
| 5 | `pas_gooien_vangen` | Kan de bal goed gooien en vangen | :+1: :fist: :thumbsdown: |
| 6 | `pas_vrije_medespeler` | Geeft de bal aan een vrije medespeler | :+1: :fist: :thumbsdown: |

**VERDEDIGEN (2 items):**

| # | Item-ID | Formulering | Schaal |
|---|---------|-------------|--------|
| 7 | `ver_bal_afpakken` | Probeert de bal af te pakken | :+1: :fist: :thumbsdown: |
| 8 | `ver_actief` | Verdedigt actief (loopt mee met tegenstander) | :+1: :fist: :thumbsdown: |

#### Persoonlijke items (4 stuks)

**FYSIEK (2 items):**

| # | Pijler | Item-ID | Formulering | Schaal |
|---|--------|---------|-------------|--------|
| 9 | FYSIEK | `fys_snel_beweeglijk` | Is snel en beweeglijk | :+1: :fist: :thumbsdown: |
| 10 | FYSIEK | `fys_uithouding` | Houdt het tempo vol tijdens de hele wedstrijd | :+1: :fist: :thumbsdown: |

**IK (2 items — mentaal + sociaal gecombineerd):**

| # | Pijler | Item-ID | Formulering | Schaal |
|---|--------|---------|-------------|--------|
| 11 | IK | `ik_samenwerken` | Werkt goed samen in het team | :+1: :fist: :thumbsdown: |
| 12 | IK | `ik_doorzetten` | Blijft proberen na een fout | :+1: :fist: :thumbsdown: |

**Wetenschappelijke onderbouwing:**
- ASM einde Basic / begin Transition fase (8-9 jaar): de verhouding basis:sport verschuift naar circa 60:40. De korfbalacties verschijnen maar zijn nog breed geformuleerd (Wormhoudt et al., 2018).
- SDT: vriendschappen worden belangrijker. Sociale motivatie ("mijn vriendje doet het ook") is een sterke drijfveer (Ryan & Deci, 2017).
- Retentiedata OW: 8-9 jaar is de piek-instroomleeftijd (34% van alle instroom) met hoge retentie (93-95%). Dit is het moment om binding te creeren (jeugdmodel.yaml).

---

### 3.3 Geel (10-12 jaar) — Eerste laag-onderscheid

**POP-ratio:** 40% Plezier / 40% Ontwikkeling / 20% Prestatie

| Eigenschap | Waarde |
|------------|--------|
| Pijlers | 4 korfbalacties + FYSIEK + MENTAAL (= 6 scores) |
| Lagen per actie | Technisch + Tactisch (2 van de 3 lagen) |
| Schaal | 5 sterren |
| Symbolen | 1-5 sterren |
| Aantal items | 22 |
| Beoordelaar | Trainer + optioneel scout |

**Verschil met Groen:** IK wordt MENTAAL (volwassen term). Per korfbalactie verschijnen twee lagen: technisch en tactisch. De mentale laag per actie is nog niet apart — die zit impliciet in het item. SOCIAAL is nog niet apart zichtbaar als pijler (behalve `soc_veiligheid`).

#### Korfbalactie-items (13 stuks)

**SCHIETEN (4 items):**

| # | Laag | Item-ID | Formulering | Schaal |
|---|------|---------|-------------|--------|
| 1 | Technisch | `sch_t_afstandsschot` | Schiet goed van afstand (techniek, kracht) | 1-5 sterren |
| 2 | Technisch | `sch_t_doorloopbal` | Maakt doorloopballen (timing, afzet) | 1-5 sterren |
| 3 | Technisch | `sch_t_strafworp` | Kan een strafworp nemen (goede positie, zuivere worp) | 1-5 sterren |
| 4 | Tactisch | `sch_ta_schotkeuze` | Kiest het juiste moment om te schieten | 1-5 sterren |

*Observatie-instructie `sch_t_strafworp`: Let op: staat het kind goed voor de korf? Is de worp vloeiend? Dit is een technisch item — als een kind de strafworp niet durft te nemen, noteer dat apart (sociale veiligheid / mentaal), maar scoor hier alleen de techniek als het kind het wel doet.*

**AANVALLEN (3 items):**

| # | Laag | Item-ID | Formulering | Schaal |
|---|------|---------|-------------|--------|
| 5 | Technisch | `aan_t_vrijlopen` | Loopt slim vrij van de tegenstander | 1-5 sterren |
| 6 | Tactisch | `aan_ta_positie` | Neemt goede posities in bij aanval | 1-5 sterren |
| 7 | Tactisch | `aan_ta_dreigen` | Dreigt richting de korf (dwingt verdediger tot keuze) | 1-5 sterren |

**PASSEN (3 items):**

| # | Laag | Item-ID | Formulering | Schaal |
|---|------|---------|-------------|--------|
| 8 | Technisch | `pas_t_techniek` | Gooit technisch goed over (strak, zuiver) | 1-5 sterren |
| 9 | Technisch | `pas_t_balbehandeling` | Vangt en verwerkt de bal goed | 1-5 sterren |
| 10 | Tactisch | `pas_ta_overzicht` | Ziet vrije medespelers staan | 1-5 sterren |

**VERDEDIGEN (3 items):**

| # | Laag | Item-ID | Formulering | Schaal |
|---|------|---------|-------------|--------|
| 11 | Technisch | `ver_t_dekken` | Dekt de tegenstander goed af | 1-5 sterren |
| 12 | Tactisch | `ver_ta_onderscheppen` | Onderschept ballen (leest de passlijn) | 1-5 sterren |
| 13 | Tactisch | `ver_ta_positie` | Staat op de goede plek bij verdedigen | 1-5 sterren |

#### Persoonlijke items (9 stuks)

**FYSIEK (3 items):**

| # | Item-ID | Formulering | Schaal |
|---|---------|-------------|--------|
| 14 | `fys_snelheid` | Is snel in korte sprints | 1-5 sterren |
| 15 | `fys_uithoudingsvermogen` | Houdt het tempo de hele wedstrijd vol | 1-5 sterren |
| 16 | `fys_beweeglijkheid` | Beweegt soepel en wendbaar | 1-5 sterren |

**MENTAAL (5 items):**

| # | Item-ID | Formulering | Gedragsobservatie | Schaal |
|---|---------|-------------|-------------------|--------|
| 17 | `men_inzet` | Laat zichtbare inspanning zien, ook in het laatste kwart van de wedstrijd | Zichtbare inspanning, ook in laatste kwart | 1-5 sterren |
| 18 | `men_concentratie` | Blijft geconcentreerd tijdens de wedstrijd | Maakt geen fouten door onoplettendheid | 1-5 sterren |
| 19 | `men_coachbaarheid` | Neemt aanwijzingen goed aan | Probeert het anders na feedback van trainer | 1-5 sterren |
| 20 | `men_plezier` | Heeft plezier in het spel | Lacht, moedigt anderen aan, komt graag | 1-5 sterren |
| 21 | `men_herstelt` | Herstelt na een fout of tegengoal | Gaat verder met de volgende actie, treurt niet lang | 1-5 sterren |

**SOCIAAL (1 item):**

| # | Item-ID | Formulering | Schaal |
|---|---------|-------------|--------|
| 22 | `soc_veiligheid` | Durft fouten te maken zonder bang te zijn voor reacties van teamgenoten | 1-5 sterren |

*Observatie-instructie `soc_veiligheid`: Let op: aarzelt het kind voor het schieten (angst om te missen)? Wordt het kind uitgelachen na een fout? Trekt het zich terug na kritiek? Score 1-2 = alarmsignaal.*

**Wetenschappelijke onderbouwing:**
- ASM Transition fase: dit is de "golden age" van motorische ontwikkeling (10-14 jaar). Coordinatieve vaardigheden bereiken hun hoogtepunt. Het tactische laag verschijnt in ons model precies op dit moment (Wormhoudt et al., 2018).
- Growth mindset: bij 10-12 jaar begint sociale vergelijking een rol te spelen. Het risico op een fixed mindset groeit. Items als "coachbaarheid" en "herstelt na een fout" meten indirect of het kind een growth mindset laat zien (Dweck, 2006).
- KNKV: "Voor 12 jaar is het vrijwel onmogelijk om te identificeren wie de getalenteerde spelers zijn." Daarom is de beoordeling tot hier vooral gericht op brede ontwikkeling, niet op selectie (KNKV, 2024).
- De strafworp verschijnt hier als technisch item omdat de KNKV bij Geel (8-tallen, 10-12 jaar) al strafworpen toekent. De korf staat op 3.0 meter, de bal is maat 4. De ASM "golden age" maakt dit het ideale moment om deze complexe motorische vaardigheid aan te leren.

---

### 3.4 Oranje (13-15 jaar) — Drie lagen, SOCIAAL verschijnt

**POP-ratio:** 30% Plezier / 40% Ontwikkeling / 30% Prestatie

| Eigenschap | Waarde |
|------------|--------|
| Pijlers | 4 korfbalacties + FYSIEK + MENTAAL + SOCIAAL (= 7 scores) |
| Lagen per actie | Technisch + Tactisch + Mentaal (alle 3 lagen) |
| Schaal | Slider 1-10 |
| Aantal items | 37 (+ 1 optioneel) |
| Beoordelaar | Trainer + scout |

**Verschil met Geel:** SOCIAAL verschijnt als zevende pijler. Per korfbalactie is nu ook de mentale laag apart zichtbaar. De schaal verschuift van sterren naar een slider, wat meer nuance toelaat. Dit is de leeftijd waarop A-categorie begint (U15) en selectie een rol gaat spelen.

> **Herinnering:** De mentale laag bij een korfbalactie (bijv. `aan_m_omschakeling`) gaat over presteren onder druk *bij die specifieke actie*. Het is NIET hetzelfde als de MENTAAL-pijler items (bijv. `men_weerbaarheid`). Zie het uitlegkader in sectie 2.

#### Korfbalactie-items (20 stuks)

**SCHIETEN (5 items):**

| # | Laag | Item-ID | Formulering | Schaal |
|---|------|---------|-------------|--------|
| 1 | Technisch | `sch_t_afstandsschot` | Schiet goed en hard van afstand, ook vanuit beweging | Slider 1-10 |
| 2 | Technisch | `sch_t_doorloopbal` | Maakt doorloopballen links en rechts onder lichte druk | Slider 1-10 |
| 3 | Technisch | `sch_t_techniek` | Heeft een zuivere, herhaalbare schietbeweging | Slider 1-10 |
| 4 | Technisch | `sch_t_penalty` | Scoort strafworpen betrouwbaar | Slider 1-10 |
| 5 | Tactisch | `sch_ta_schotkeuze` | Kiest het juiste schot op het juiste moment | Slider 1-10 |

*Veld/zaal bij `sch_t_afstandsschot`: Veld: let op schietafstand (6-8m realistisch), wind-impact. Zaal: let op snelheid van losdraaien, minder ruimte.*

**AANVALLEN (5 items):**

| # | Laag | Item-ID | Formulering | Schaal |
|---|------|---------|-------------|--------|
| 6 | Technisch | `aan_t_vrijlopen` | Loopt op het juiste moment vrij (timing + misleiding) | Slider 1-10 |
| 7 | Tactisch | `aan_ta_positie` | Neemt sterke aanvalsposities in (diepte, aanspeelbaarheid) | Slider 1-10 |
| 8 | Tactisch | `aan_ta_dreigen` | Brengt de verdediging in problemen door te dreigen (schot/doorloop dilemma) | Slider 1-10 |
| 9 | Tactisch | `aan_ta_zonder_bal` | Beweegt doelgericht ook zonder bal, houdt de verdediger bezig | Slider 1-10 |
| 10 | Mentaal | `aan_m_omschakeling` | Schakelt snel om van verdediging naar aanval (mentale switch) | Slider 1-10 |

*Veld/zaal bij `aan_t_vrijlopen`: Veld: grotere in-uit bewegingen. Zaal: korte, snelle richtingsveranderingen.*

**PASSEN (5 items):**

| # | Laag | Item-ID | Formulering | Schaal |
|---|------|---------|-------------|--------|
| 11 | Technisch | `pas_t_techniek` | Geeft strakke, zuivere passes over korte en lange afstand | Slider 1-10 |
| 12 | Technisch | `pas_t_balbehandeling` | Controleert de bal onder druk (twee handen, een hand, in beweging) | Slider 1-10 |
| 13 | Technisch | `pas_t_aanname` | Neemt de bal aan terwijl hij/zij in beweging is, kan direct doorspelen | Slider 1-10 |
| 14 | Tactisch | `pas_ta_overzicht` | Heeft goed overzicht over het speelveld, ziet meerdere opties | Slider 1-10 |
| 15 | Tactisch | `pas_ta_besluitvorming` | Maakt de juiste keuze: passen, schieten of vasthouden | Slider 1-10 |

*Veld/zaal bij `pas_t_techniek`: Veld: lange pass over 15-20m nodig. Zaal: korte tikpass dominant.*

**VERDEDIGEN (6 items):**

| # | Laag | Item-ID | Formulering | Schaal |
|---|------|---------|-------------|--------|
| 16 | Technisch | `ver_t_dekken` | Dekt de directe tegenstander strak af (positie, contact, discipline) | Slider 1-10 |
| 17 | Technisch | `ver_t_rebound` | Pakt rebounds na een schot (positie, timing) | Slider 1-10 |
| 18 | Technisch | `ver_t_druk` | Zet druk op de balbezitter zonder de eigen positie op te geven | Slider 1-10 |
| 19 | Tactisch | `ver_ta_onderscheppen` | Leest het spel en onderschept ballen, anticipeert op passes | Slider 1-10 |
| 20 | Mentaal | `ver_m_communicatie` | Stuurt medespelers aan bij verdedigen (roept, waarschuwt) | Slider 1-10 |

#### Persoonlijke items (17 stuks, waarvan 1 optioneel)

**FYSIEK (5 items + 1 optioneel):**

| # | Item-ID | Formulering | Schaal |
|---|---------|-------------|--------|
| 22 | `fys_snelheid` | Is explosief snel in de eerste meters en bij vrijlopen | Slider 1-10 |
| 23 | `fys_uithoudingsvermogen` | Presteert op gelijk niveau in het eerste en laatste kwart van de wedstrijd | Slider 1-10 |
| 24 | `fys_beweeglijkheid` | Verandert snel van richting zonder snelheidsverlies | Slider 1-10 |
| 25 | `fys_kracht` | Zet het lichaam goed in bij duels en bij het schieten | Slider 1-10 |
| 26 | `fys_actiesnelheid` | Handelt snel in spelsituaties: ziet de kans en voert direct uit | Slider 1-10 |

*Veld/zaal bij `fys_snelheid`: Veld: herhaalde sprints over grotere afstanden. Zaal: explosieve eerste stap.*
*Veld/zaal bij `fys_beweeglijkheid`: Zaal: crucialer door kleinere ruimte, scherpe stops op parket.*

**Optioneel FYSIEK-item:**

| # | Item-ID | Formulering | Schaal | Status |
|---|---------|-------------|--------|--------|
| — | `fys_sprongkracht` | Springt hoog bij rebounds en schoten | Slider 1-10 | Optioneel/aanvullend |

> **Waarschuwing biologische rijping:** Sprongkracht bij 13-15 jaar is sterk afhankelijk van biologische rijping (lengte, gewicht, spiermassa). Scoor dit item alleen als aanvullende observatie; gebruik het NIET als selectiecriterium. Een late rijper die nu laag scoort, kan over twee jaar de beste springer van het team zijn.

**MENTAAL (5 items):**

| # | Item-ID | Formulering | Gedragsobservatie | Schaal |
|---|---------|-------------|-------------------|--------|
| 27 | `men_inzet` | Geeft altijd maximale inzet | Zichtbare inspanning ongeacht stand of tegenstander | Slider 1-10 |
| 28 | `men_concentratie` | Blijft scherp in cruciale momenten | Maakt de juiste keuze bij 4-4 in de slotfase | Slider 1-10 |
| 29 | `men_leiderschap` | Neemt verantwoordelijkheid en stuurt anderen aan | Coacht teamgenoten, vraagt de bal in druksituaties | Slider 1-10 |
| 30 | `men_weerbaarheid` | Herstelt snel na tegenslagen | Na een gemiste strafworp: wat doet de speler in de volgende 2 minuten? | Slider 1-10 |
| 31 | `men_groei` | Zoekt uitdaging en leert van feedback | Probeert het anders na een aanwijzing, kiest moeilijke oefening | Slider 1-10 |

**SOCIAAL (7 items):**

| # | Item-ID | Formulering | Gedragsobservatie | Schaal |
|---|---------|-------------|-------------------|--------|
| 32 | `soc_communicatie` | Communiceert duidelijk op het veld | Roept vrijlopen aan, waarschuwt voor lopers | Slider 1-10 |
| 33 | `soc_samenwerking` | Zoekt de combinatie en geeft de extra pass | Stelt teambelang boven eigen score | Slider 1-10 |
| 34 | `soc_teamsfeer` | Draagt bij aan een positieve sfeer | Viert doelpunten van anderen, steunt na fouten | Slider 1-10 |
| 35 | `soc_rolacceptatie` | Accepteert verschillende rollen | Klaagt niet bij een ondersteunende rol | Slider 1-10 |
| 36 | `soc_conflicthantering` | Lost meningsverschillen constructief op | Zoekt de dialoog, houdt het hoofd koel | Slider 1-10 |
| 37 | `soc_plezier` | Straalt plezier uit tijdens training en wedstrijd; reageert enthousiast op goede acties van anderen | Komt met enthousiasme het veld op, lacht regelmatig | Slider 1-10 |
| 38 | `soc_veiligheid` | Voelt zich veilig om risico's te nemen en fouten te maken; wordt niet buitengesloten of gepest | Durft nieuwe dingen te proberen, trekt zich niet terug na fouten | Slider 1-10 |

*Observatie-instructie `soc_plezier`: Let op: komt de speler met enthousiasme het veld op? Lacht hij/zij regelmatig? Is er een verschil tussen training en wedstrijd? Als plezier ontbreekt, is dat een alarmsignaal — bespreek dit met de speler en de ouders.*

**Let op biologische rijping:** Bij 13-15 zijn de fysieke verschillen door biologische rijpingsvariatie (vroeg/laat rijpers) enorm. Een late rijper kan op alle fysieke items laag scoren en toch een toptalent zijn. Fysieke scores in Oranje moeten ALTIJD gekoppeld worden aan een inschatting van biologische rijping.

**Wetenschappelijke onderbouwing:**
- SDT: 13-15 jaar is de kritische fase voor identiteitsvorming en drop-out. Autonomie wordt cruciaal. De Oranje Draad benadrukt dat plezier nooit mag verdwijnen, ook als prestatie een grotere rol krijgt (Crane & Temple, 2015).
- Mental Toughness 4C-model: vanaf 13 jaar zijn de vier C's (Control, Commitment, Challenge, Confidence) meetbaar en trainbaar. Onze MEN-items zijn hierop gebaseerd, maar geformuleerd als observeerbaar gedrag (Clough et al., 2002).
- Inside Out 2: in de puberteit verschijnen complexe emoties als anxiety, jaloezie en schaamte. SOCIAAL als aparte pijler erkent dat de sociale dimensie nu bewust geobserveerd moet worden.
- Plezier is bij Oranje een expliciet SOCIAAL-item (`soc_plezier`). Dit vult het gat dat in v1.1 bestond: bij Geel is plezier een MENTAAL-item (`men_plezier`), bij Oranje wordt het sociaal (plezier als teamkracht), en bij Rood wordt het `soc_aanstekelijk_plezier`.

---

### 3.5 Rood (16-18 jaar) — Maximale verdieping

**POP-ratio:** 25% Plezier / 35% Ontwikkeling / 40% Prestatie

| Eigenschap | Waarde |
|------------|--------|
| Pijlers | 4 korfbalacties + FYSIEK + MENTAAL + SOCIAAL (= 7 scores) |
| Lagen per actie | 3 lagen met meerdere sub-items |
| Schaal | Slider 1-10 |
| Aantal items | 58 (35 korfbalacties + 23 persoonlijk) |
| Beoordelaar | Trainer + scout + optioneel zelfevaluatie |

**Dit is het "plafond" van het systeem.** De 58 items zijn afgeleid van het referentieprofiel in `docs/jeugdontwikkeling/profiel-top-talent-18.md`. Elk item is geclassificeerd als KERN (moet goed zijn voor USS 150+) of ONDERSCHEIDEND (maakt het verschil tussen USS 150 en USS 175+).

> **Herinnering:** De mentale laag bij een korfbalactie gaat over presteren onder druk *bij deze specifieke actie*. Het is NIET hetzelfde als de MENTAAL-pijler. Zie sectie 2.

> **Tweelaagse observatie-instructies:** Bij Rood heeft elk item een kernzin (max 15 woorden, standaard zichtbaar in de app) en een uitgebreide versie (beschikbaar via "meer info"). Hieronder staat per item de kernzin; de uitgebreide versie staat in de aparte observatiehandleiding.

#### Korfbalactie-items (36 stuks)

**SCHIETEN (9 items):**

| # | Laag | Item-ID | Formulering | K/O | Schaal | Kernzin observatie |
|---|------|---------|-------------|-----|--------|--------------------|
| 1 | Technisch | `sch_t_afstandsschot` | Schiet krachtig en geplaatst van afstand, droog en uit de beweging, scoort consistent | KERN | Slider 1-10 | Hoe vaak scoort de speler van afstand in een wedstrijd? |
| 2 | Technisch | `sch_t_doorloopbal` | Maakt doorloopballen onder hoge druk, vanuit verschillende hoeken, links- en rechtshandig | KERN | Slider 1-10 | Maakt de speler doorloopballen met links en rechts? |
| 3 | Technisch | `sch_t_techniek` | Schiet met een stabiele, herhaalbare techniek, ook onder fysieke druk en vermoeidheid | KERN | Slider 1-10 | Blijft de schottechniek gelijk in de tweede helft? |
| 4 | Technisch | `sch_t_variatie` | Heeft meerdere schotvormen in het arsenaal (draaibal, lob, scoop, schijnschot) | ONDERSCHEIDEND | Slider 1-10 | Hoeveel verschillende schotvormen toont de speler? |
| 5 | Technisch | `sch_t_rebound` | Pakt aanvallende rebounds na een schot en rondt direct af (tip-in, kortschot, draaibal) | ONDERSCHEIDEND | Slider 1-10 | Beweegt de speler na een schot richting de korf voor de rebound? |
| 6 | Tactisch | `sch_ta_schotkeuze` | Kiest het optimale schot in elke situatie, schiet niet als een pass meer oplevert | KERN | Slider 1-10 | Kiest de speler het juiste schot of forceert hij/zij? |
| 7 | Tactisch | `sch_ta_na_dreiging` | Schiet effectief direct na een dreigactie (schijnbeweging, aanbieden, terugtrekken) | ONDERSCHEIDEND | Slider 1-10 | Schiet de speler direct na het dreigen? |
| 8 | Mentaal | `sch_m_penalty` | Scoort strafworpen onder druk, heeft een vaste routine, laat zich niet afleiden | KERN | Slider 1-10 | Scoort de speler de strafworp bij 4-4? |
| 9 | Mentaal | `sch_m_scorend_vermogen` | Scoort in beslissende momenten, mist zelden vrije kansen, is klinisch in de afronding | ONDERSCHEIDEND | Slider 1-10 | Scoort de speler zijn/haar vrije kansen? |

**AANVALLEN (8 items):**

| # | Laag | Item-ID | Formulering | K/O | Schaal | Kernzin observatie |
|---|------|---------|-------------|-----|--------|--------------------|
| 10 | Technisch | `aan_t_vrijlopen` | Creëert ruimte door slim vrij te lopen: in-uit, V-loop, achterdeur, met optimale timing | KERN | Slider 1-10 | Hoe creëert de speler ruimte voor zichzelf? |
| 11 | Technisch | `aan_t_1_op_1` | Wint individuele duels door snelheid, lichaamstaal of schijnbeweging, dwingt strafworpen af | ONDERSCHEIDEND | Slider 1-10 | Wint de speler 1-op-1 duels? |
| 12 | Tactisch | `aan_ta_positie` | Neemt dominante aanvalsposities in: voor/achter korf, creëert diepte, staat altijd aanspeelbaar | KERN | Slider 1-10 | Staat de speler op de juiste plek in de aanval? |
| 13 | Tactisch | `aan_ta_dreigen` | Dwingt verdedigers in onmogelijke keuzes: schot/doorloop dilemma constant aanwezig | KERN | Slider 1-10 | Staat de verdediger voor een onmogelijke keuze? |
| 14 | Tactisch | `aan_ta_zonder_bal` | Beweegt continu doelgericht zonder bal: creëert ruimte voor anderen, trekt verdedigers weg | KERN | Slider 1-10 | Wat doet de speler als hij/zij geen bal heeft? |
| 15 | Tactisch | `aan_ta_spelcreatie` | Creëert kansen voor medespelers door slim te bewegen: trekt verdedigers weg, maakt de ruimte vrij, ziet de optie die anderen niet zien | ONDERSCHEIDEND | Slider 1-10 | Maakt de speler anderen beter door zijn/haar beweging? |
| 16 | Tactisch | `aan_ta_patronen` | Kent standaard aanvalsopstellingen (4-0, 3-1, wissel), past aan op tegenstander | ONDERSCHEIDEND | Slider 1-10 | Herkent de speler welk aanvalspatroon effectief is? |
| 17 | Mentaal | `aan_m_omschakeling` | Schakelt razendsnel om na balverovering, sprint naar aanvalsvak of geeft de snelle lange pass | KERN | Slider 1-10 | Hoe snel schakelt de speler om na balverovering? |

**PASSEN (8 items):**

| # | Laag | Item-ID | Formulering | K/O | Schaal | Kernzin observatie |
|---|------|---------|-------------|-----|--------|--------------------|
| 18 | Technisch | `pas_t_techniek` | Geeft technisch perfecte passes: borst, overhand, pols, bodem, getimed en op snelheid | KERN | Slider 1-10 | Hoe zuiver zijn de passes? |
| 19 | Technisch | `pas_t_balbehandeling` | Controleert de bal foutloos onder hoge druk, vangt met twee handen en een hand | KERN | Slider 1-10 | Hoeveel balverlies door techniek? |
| 20 | Technisch | `pas_t_aanname` | Neemt de bal in volle sprint feilloos aan, de aanname is onderdeel van de actie | KERN | Slider 1-10 | Is de aanname vloeiend of een apart moment? |
| 21 | Technisch | `pas_t_eenhandig` | Kan de bal met een hand controleren, passen en afronden, vergroot het speelbare bereik | ONDERSCHEIDEND | Slider 1-10 | Speelt de speler effectief eenhandig? |
| 22 | Tactisch | `pas_ta_overzicht` | Heeft volledig overzicht over het speelveld, leest passlijnen, ziet kansen die anderen niet zien | KERN | Slider 1-10 | Ziet de speler de beste optie? |
| 23 | Tactisch | `pas_ta_besluitvorming` | Maakt onder druk de juiste keuzes in een fractie van een seconde: schieten, passen, vasthouden; beschermt het balbezit door de veilige optie te kiezen als er geen goede schietkans is | KERN | Slider 1-10 | Maakt de speler de juiste keuze onder druk? |
| 24 | Tactisch | `pas_ta_tempo` | Bepaalt het tempo van de aanval door de bal: versnelt door snelle passes bij overmacht, vertraagt door de bal vast te houden als de verdediging georganiseerd is | ONDERSCHEIDEND | Slider 1-10 | Past de speler het tempo aan via de bal? |
| 25 | Mentaal | `pas_m_creativiteit` | Verrast met onverwachte passes: verrassingspass, tikbal naar medespeler, creëert overtal door onorthodoxe passlijnen | ONDERSCHEIDEND | Slider 1-10 | Verrast de speler met onverwachte passes? |

*Observatie-instructie `pas_ta_tempo`: Let ook op: houdt de speler het balbezit vast wanneer er geen kans is? Of forceert hij/zij een schot?*

**VERDEDIGEN (11 items):**

| # | Laag | Item-ID | Formulering | K/O | Schaal | Kernzin observatie |
|---|------|---------|-------------|-----|--------|--------------------|
| 26 | Technisch | `ver_t_dekken` | Dekt de tegenstander strak en gedisciplineerd, blijft tussen tegenstander en korf, zonder overtredingen | KERN | Slider 1-10 | Houdt de speler de tegenstander uit de bal? |
| 27 | Technisch | `ver_t_rebound` | Domineert de reboundzone: goede positie, timing, reboundpositie innemen (box-out), zet direct de omschakeling in | KERN | Slider 1-10 | Pakt de speler de rebound? |
| 28 | Technisch | `ver_t_druk_zetten` | Zet continu druk op de balbezitter, maakt het moeilijk om te passen of te schieten | KERN | Slider 1-10 | Hoe moeilijk maakt de speler het voor de balbezitter? |
| 29 | Tactisch | `ver_ta_onderscheppen` | Anticipeert en onderschept gevaarlijke ballen, leest passlijnen | KERN | Slider 1-10 | Onderschept de speler ballen door goed te lezen? |
| 30 | Tactisch | `ver_ta_helpverdediging` | Helpt uit bij doorbraak, schuift en roteert mee zonder eigen tegenstander volledig los te laten | ONDERSCHEIDEND | Slider 1-10 | Helpt de speler uit bij een doorbraak? |
| 31 | Tactisch | `ver_ta_verdedigingsvorm` | Herkent de aanvalsopstelling van de tegenstander en past de eigen verdediging aan | ONDERSCHEIDEND | Slider 1-10 | Past de speler de verdediging aan op de tegenstander? |
| 32 | Tactisch | `ver_ta_blok` | Blokkeert effectief schoten door timing, onderscheidt echt schot van schijnbeweging, zonder overtreding | ONDERSCHEIDEND | Slider 1-10 | Blokkeert de speler schoten met goede timing? |
| 33 | Mentaal | `ver_m_communicatie` | Organiseert de verdediging door constant te communiceren: wissels, lopers, dekkingsafspraken | ONDERSCHEIDEND | Slider 1-10 | Organiseert de speler de verdediging door te communiceren? |
| 34 | Mentaal | `ver_m_omschakeling` | Na balverlies onmiddellijk terug in verdedigende modus, pakt de dichtstbijzijnde tegenstander op | KERN | Slider 1-10 | Hoe snel is de speler terug in verdediging na balverlies? |
| 35 | Mentaal | `ver_m_discipline` | Blijft gedisciplineerd verdedigen ook bij achterstand of frustratie, maakt geen onnodige overtredingen | KERN | Slider 1-10 | Blijft de speler gedisciplineerd bij achterstand? |

#### Persoonlijke items (23 stuks)

**FYSIEK (7 items):**

| # | Item-ID | Formulering | K/O | Schaal | Kernzin observatie |
|---|---------|-------------|-----|--------|--------------------|
| 36 | `fys_snelheid` | Is explosief snel over de eerste 5-10 meter; de eerste stap laat de verdediger achter zich | KERN | Slider 1-10 | Hoe snel is de eerste stap? |
| 37 | `fys_uithoudingsvermogen` | Presteert constant op hoog niveau gedurende 2x30 minuten; geen zichtbaar prestatieverlies in de tweede helft | KERN | Slider 1-10 | Is de speler even goed in de tweede helft? |
| 38 | `fys_kracht` | Houdt stand in fysieke duels; stabiliseert de romp bij schieten onder druk; gebruikt het lichaam effectief als schild | KERN | Slider 1-10 | Houdt de speler stand in duels? |
| 39 | `fys_beweeglijkheid` | Beweegt soepel met snelle richtingsveranderingen; lage zwaartepunthouding bij keren, kan stoppen-en-starten zonder snelheidsverlies | KERN | Slider 1-10 | Hoe soepel zijn de richtingsveranderingen? |
| 40 | `fys_actiesnelheid` | Reageert razendsnel in spelsituaties; de tijd tussen zien en doen is minimaal, ook onder verdedigingsdruk | KERN | Slider 1-10 | Hoe snel reageert de speler op kansen? |
| 41 | `fys_sprongkracht` | Springt hoog bij rebounds en afstandsschoten; combineert sprongkracht met timing | ONDERSCHEIDEND | Slider 1-10 | Springt de speler boven de verdediger uit? |
| 42 | `fys_herstel` | Herstelt snel na intensieve acties; is direct klaar voor de volgende actie na een sprint of duel | ONDERSCHEIDEND | Slider 1-10 | Hoe snel is de speler klaar na een sprint? |

**MENTAAL (8 items):**

Alle mentale items zijn geformuleerd als **observeerbaar gedrag**, niet als persoonlijkheidslabels (zie sectie 10 — Beoordelen zonder te labelen).

| # | Item-ID | Formulering | Gedragsobservatie | K/O | Schaal | Kernzin observatie |
|---|---------|-------------|-------------------|-----|--------|--------------------|
| 43 | `men_inzet` | Geeft altijd 100% inzet; inzet is niet afhankelijk van externe motivatie; werkt net zo hard in training als in de wedstrijd | Zichtbare inspanning in elke actie, training en wedstrijd gelijk | KERN | Slider 1-10 | Is de inzet in training gelijk aan de wedstrijd? |
| 44 | `men_concentratie` | Houdt volledige focus gedurende 2x30 minuten; kan concentratie vasthouden bij gelijke stand in de laatste minuut | Laat zich niet afleiden door publiek of scheidsrechter | KERN | Slider 1-10 | Blijft de speler scherp in de slotfase? |
| 45 | `men_weerbaarheid` | Blijft presteren onder druk en na tegenslagen; wordt sterker naarmate de druk toeneemt | Na een gemiste strafworp: hoe snel is de speler terug in het spel? | KERN | Slider 1-10 | Wat doet de speler in de 2 minuten na een tegengoal? |
| 46 | `men_wedstrijdmentaliteit` | Presteert beter naarmate de wedstrijd belangrijker is; wil de beslissende bal; zoekt de verantwoordelijkheid op; houdt fair play hoog | Wil de beslissende bal, zoekt verantwoordelijkheid op | KERN | Slider 1-10 | Wie neemt de strafworp bij 4-4? |
| 47 | `men_trainingsmentaliteit` | Benadert elke training als een kans om beter te worden; werkt zelfstandig aan zwakke punten | Werkt zelfstandig aan zwakke punten, is altijd voorbereid | KERN | Slider 1-10 | Traint de speler ook buiten de reguliere training? |
| 48 | `men_leiderschap` | Toont leiderschap door houding en daden: loopt rechtop na een tegengoal, spreekt medespelers bemoedigend aan, neemt verantwoordelijkheid in druksituaties | Loopt rechtop na een tegengoal, klapt in handen, roept "komaan!" | ONDERSCHEIDEND | Slider 1-10 | Wat doet de speler na een tegengoal? |
| 49 | `men_drukbestendigheid` | Presteert op gelijk of hoger niveau in de 5 belangrijkste wedstrijden van het seizoen; lichaamstaal blijft open en rustig onder extreme spanning | Kalm bij extreme spanning, beslist rationeel als emoties hoog oplopen | ONDERSCHEIDEND | Slider 1-10 | Hoe presteert de speler in de halve finale vs. een oefenwedstrijd? |
| 50 | `men_zelfkritiek` | Kan eigen prestaties eerlijk analyseren; ziet verbeterpunten zonder in negativiteit te vervallen; gebruikt feedback constructief | Is nooit klaar met leren, kan benoemen wat goed ging en wat beter kan | ONDERSCHEIDEND | Slider 1-10 | Kan de speler benoemen wat goed ging en wat beter kan? |

**SOCIAAL (8 items):**

| # | Item-ID | Formulering | Gedragsobservatie | K/O | Schaal | Kernzin observatie |
|---|---------|-------------|-------------------|-----|--------|--------------------|
| 51 | `soc_veldcommunicatie` | Communiceert continu en duidelijk met medespelers; past communicatiestijl aan per medespeler | Roept vrijlopen aan, geeft passinstructies, concreet en helpend | KERN | Slider 1-10 | Is de communicatie concreet en helpend? |
| 52 | `soc_samenwerking` | Speelt het team beter; zoekt de combinatie; stelt teambelang boven persoonlijke statistieken | Geeft de extra pass als een medespeler beter staat | KERN | Slider 1-10 | Wordt het team beter door deze speler? |
| 53 | `soc_rolacceptatie` | Accepteert wisselende rollen (ster/waterdrager, aanval/verdediging); begrijpt teambelang | Klaagt niet bij ondersteunende rol, volle inzet ongeacht rol | KERN | Slider 1-10 | Hoe reageert de speler in een ondersteunende rol? |
| 54 | `soc_aanstekelijk_plezier` | Speelt met zichtbaar plezier dat aanstekelijk is voor het team; passie voor het spel is motor achter de inzet | Energie is voelbaar voor het team, intrinsieke drive die anderen meeneemt | KERN | Slider 1-10 | Is het plezier van deze speler voelbaar voor het team? |
| 55 | `soc_coaching` | Geeft korte, specifieke en positieve aanwijzingen aan teamgenoten tijdens het spel; helpt minder ervaren spelers met concrete tips | Geeft concrete aanwijzingen ("Stap naar rechts!") in plaats van vage ("Beter verdedigen!") | ONDERSCHEIDEND | Slider 1-10 | Zijn de aanwijzingen concreet en positief? |
| 56 | `soc_teamsfeer` | Draagt actief bij aan een positieve teamsfeer; viert doelpunten van anderen net zo enthousiast | Staat naast wie een fout maakt, voorkomt onderlinge irritaties | ONDERSCHEIDEND | Slider 1-10 | Wie houdt het team bij elkaar na een tegengoal? |
| 57 | `soc_conflicthantering` | Kan meningsverschillen constructief oplossen; houdt het hoofd koel bij frustratie; is een verbinder | Zoekt de dialoog, de-escaleert bij spanning, verbindt het team | ONDERSCHEIDEND | Slider 1-10 | Escaleert of de-escaleert de speler bij frustratie? |
| 58 | `soc_veiligheid` | Voelt zich veilig in het team; kan kwetsbaar zijn (fouten toegeven, hulp vragen) zonder sociale consequenties | Durft fouten toe te geven, vraagt hulp, deelt twijfels met teamgenoten | KERN | Slider 1-10 | Durft de speler kwetsbaar te zijn in het team? |

**Wetenschappelijke onderbouwing:**
- ASM Performance-fase: maximale sportspecifieke verdieping (Wormhoudt et al., 2018).
- Mental Toughness 4C-model: de 8 MEN-items mappen direct op Control (weerbaarheid), Commitment (inzet + trainingsmentaliteit), Challenge (zelfkritiek) en Confidence (wedstrijdmentaliteit + drukbestendigheid) (Clough et al., 2002).
- Oranje Draad: soc_aanstekelijk_plezier verankert plezier als hoogste prioriteit direct in het beoordelingssysteem. De plezier-reis door het systeem (IK -> MENTAAL -> SOCIAAL) weerspiegelt de verschuiving van individueel naar collectief.

---

## 4. Progressietabellen — hoe elke vaardigheid groeit van Blauw tot Rood

Dit hoofdstuk toont per korfbalactie hoe elke vaardigheid meegroeit over de leeftijdsgroepen. De volledige uitwerking staat in `docs/jeugdontwikkeling/items-korfbalacties.md`.

### Het drielagen-principe

Elke korfbalactie (SCHIETEN, AANVALLEN, PASSEN, VERDEDIGEN) wordt beoordeeld op drie lagen die dwars door de actie snijden.

```
         KORFBALACTIE
              |
    +---------+---------+
    |         |         |
TECHNISCH  TACTISCH  MENTAAL
 (KAN je   (WEET je  (DOE je het
  het?)    wanneer?)  als het
                      ertoe doet?)
```

| Laag | Kernvraag | Wat het meet | Voorbeeld SCHIETEN |
|------|-----------|-------------|-------------------|
| **Technisch** | KAN je het? | Uitvoering van de vaardigheid | Heeft de speler de schottechniek? |
| **Tactisch** | WEET je wanneer? | Besluitvorming en timing | Kiest de speler het juiste schot op het juiste moment? |
| **Mentaal** | DOE je het als het ertoe doet? | Presteren onder druk | Schiet de speler ook bij 4-4? |

### Verschijnen van lagen per leeftijdsgroep

| Leeftijdsgroep | Technisch | Tactisch | Mentaal |
|----------------|-----------|----------|---------|
| Blauw (5-7) | Impliciet in basispijlers | - | - |
| Groen (8-9) | Impliciet | Impliciet | - |
| Geel (10-12) | Expliciet | Expliciet | Impliciet |
| Oranje (13-15) | Expliciet | Expliciet | Expliciet |
| Rood (16-18) | Volledig (meerdere items) | Volledig (meerdere items) | Volledig (meerdere items) |

### 4.1 SCHIETEN — Progressie

#### Afstandsschot

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | "Gooit de bal naar de korf" (via BAL `bal_gooien`) | :+1: :thumbsdown: | -- |
| Groen | "Schiet op de korf" | :+1: :fist: :thumbsdown: | -- |
| Geel | "Schiet goed van afstand (techniek, kracht)" | 1-5 sterren | Technisch |
| Oranje | "Schiet goed en hard van afstand, ook vanuit beweging" | Slider 1-10 | Technisch |
| Rood | "Schiet krachtig en geplaatst van afstand, droog en uit de beweging, scoort consistent" | Slider 1-10 | Technisch, KERN |

#### Doorloopbal

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | -- | -- | -- |
| Groen | -- | -- | -- |
| Geel | "Maakt doorloopballen (timing, afzet)" | 1-5 sterren | Technisch |
| Oranje | "Maakt doorloopballen links en rechts onder lichte druk" | Slider 1-10 | Technisch |
| Rood | "Maakt doorloopballen onder hoge druk, vanuit verschillende hoeken, links- en rechtshandig" | Slider 1-10 | Technisch, KERN |

#### Strafworp

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | -- | -- | -- |
| Groen | -- | -- | -- |
| Geel | "Kan een strafworp nemen (goede positie, zuivere worp)" | 1-5 sterren | Technisch |
| Oranje | "Scoort strafworpen betrouwbaar" | Slider 1-10 | Technisch |
| Rood | "Scoort strafworpen onder druk, heeft een vaste routine, laat zich niet afleiden" | Slider 1-10 | Mentaal, KERN |

*Progressielijn: Geel technisch (basistechniek) -> Oranje technisch (betrouwbaarheid) -> Rood mentaal (presteren onder druk).*

#### Schotkeuze / Schotselectie

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | -- | -- | -- |
| Groen | "Schiet als er ruimte is (niet als tegenstander ervoor staat)" | :+1: :fist: :thumbsdown: | -- |
| Geel | "Kiest het juiste moment om te schieten" | 1-5 sterren | Tactisch |
| Oranje | "Kiest het juiste schot op het juiste moment" | Slider 1-10 | Tactisch |
| Rood | "Kiest het optimale schot in elke situatie, schiet niet als een pass meer oplevert" | Slider 1-10 | Tactisch, KERN |

#### Schiethouding en -techniek

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Geel | -- (zit impliciet in afstandsschot) | -- | -- |
| Oranje | "Heeft een zuivere, herhaalbare schietbeweging" | Slider 1-10 | Technisch |
| Rood | "Schiet met een stabiele, herhaalbare techniek, ook onder fysieke druk en vermoeidheid" | Slider 1-10 | Technisch, KERN |

#### Schotvariatie (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- (bouwt op via afstandsschot + doorloopbal) | -- | -- |
| Rood | "Heeft meerdere schotvormen in het arsenaal (draaibal, lob, scoop, schijnschot)" | Slider 1-10 | Technisch, ONDERSCHEIDEND |

#### Aanvallende rebound (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- (verschijnt alleen bij Rood) | -- | -- |
| Rood | "Pakt aanvallende rebounds na een schot en rondt direct af (tip-in, kortschot, draaibal)" | Slider 1-10 | Technisch, ONDERSCHEIDEND |

#### Schieten na dreiging (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- | -- | -- |
| Rood | "Schiet effectief direct na een dreigactie (schijnbeweging, aanbieden, terugtrekken)" | Slider 1-10 | Tactisch, ONDERSCHEIDEND |

#### Scorend vermogen (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- (impliciet in schotkeuze + afstandsschot) | -- | -- |
| Rood | "Scoort in beslissende momenten, mist zelden vrije kansen, is klinisch in de afronding" | Slider 1-10 | Mentaal, ONDERSCHEIDEND |

### 4.2 AANVALLEN — Progressie

#### Vrijlopen

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | "Rent en stopt zonder te vallen" (via BEWEGEN `bew_rennen`) | :+1: :thumbsdown: | -- |
| Groen | "Loopt vrij van de tegenstander" | :+1: :fist: :thumbsdown: | -- |
| Geel | "Loopt slim vrij van de tegenstander" | 1-5 sterren | Technisch |
| Oranje | "Loopt op het juiste moment vrij (timing + misleiding)" | Slider 1-10 | Technisch |
| Rood | "Creëert ruimte door slim vrij te lopen: in-uit, V-loop, achterdeur, met optimale timing" | Slider 1-10 | Technisch, KERN |

#### Positiespel

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | -- | -- | -- |
| Groen | "Staat op goede plekken in het vak" | :+1: :fist: :thumbsdown: | -- |
| Geel | "Neemt goede posities in bij aanval" | 1-5 sterren | Tactisch |
| Oranje | "Neemt sterke aanvalsposities in (diepte, aanspeelbaarheid)" | Slider 1-10 | Tactisch |
| Rood | "Neemt dominante aanvalsposities in: voor/achter korf, creëert diepte, staat altijd aanspeelbaar" | Slider 1-10 | Tactisch, KERN |

#### Dreigen richting korf

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Groen | -- | -- | -- |
| Geel | "Dreigt richting de korf (dwingt verdediger tot keuze)" | 1-5 sterren | Tactisch |
| Oranje | "Brengt de verdediging in problemen door te dreigen (schot/doorloop dilemma)" | Slider 1-10 | Tactisch |
| Rood | "Dwingt verdedigers in onmogelijke keuzes: schot/doorloop dilemma constant aanwezig" | Slider 1-10 | Tactisch, KERN |

#### Spel zonder bal

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Geel | -- (zit impliciet in vrijlopen) | -- | -- |
| Oranje | "Beweegt doelgericht ook zonder bal, houdt de verdediger bezig" | Slider 1-10 | Tactisch |
| Rood | "Beweegt continu doelgericht zonder bal: creëert ruimte voor anderen, trekt verdedigers weg" | Slider 1-10 | Tactisch, KERN |

#### Omschakeling (verdediging naar aanval)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | "Kan van richting veranderen tijdens het bewegen" (via BEWEGEN `bew_richting`) | :+1: :thumbsdown: | -- |
| Groen-Geel | -- (niet apart beoordeeld) | -- | -- |
| Oranje | "Schakelt snel om van verdediging naar aanval (mentale switch)" | Slider 1-10 | Mentaal |
| Rood | "Schakelt razendsnel om na balverovering, sprint naar aanvalsvak of geeft de snelle lange pass" | Slider 1-10 | Mentaal, KERN |

#### 1-tegen-1 vermogen (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- (zit impliciet in vrijlopen + dreigen) | -- | -- |
| Rood | "Wint individuele duels door snelheid, lichaamstaal of schijnbeweging, dwingt strafworpen af" | Slider 1-10 | Technisch, ONDERSCHEIDEND |

#### Spelcreatie (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- (zit deels in positiespel en dreigen) | -- | -- |
| Rood | "Creëert kansen voor medespelers door slim te bewegen: trekt verdedigers weg, maakt de ruimte vrij, ziet de optie die anderen niet zien" | Slider 1-10 | Tactisch, ONDERSCHEIDEND |

#### Aanvalspatronen herkennen (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- | -- | -- |
| Rood | "Kent standaard aanvalsopstellingen (4-0, 3-1, wissel), past aan op tegenstander" | Slider 1-10 | Tactisch, ONDERSCHEIDEND |

### 4.3 PASSEN — Progressie

#### Passtechniek

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | "Kan de bal gooien naar een ander" (via BAL `bal_gooien`) | :+1: :thumbsdown: | -- |
| Groen | "Kan de bal goed gooien en vangen" | :+1: :fist: :thumbsdown: | -- |
| Geel | "Gooit technisch goed over (strak, zuiver)" | 1-5 sterren | Technisch |
| Oranje | "Geeft strakke, zuivere passes over korte en lange afstand" | Slider 1-10 | Technisch |
| Rood | "Geeft technisch perfecte passes: borst, overhand, pols, bodem, getimed en op snelheid" | Slider 1-10 | Technisch, KERN |

#### Balbehandeling / Vangen

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | "Kan de bal vangen" (via BAL `bal_vangen`) | :+1: :thumbsdown: | -- |
| Groen | "Kan de bal goed gooien en vangen" (gecombineerd) | :+1: :fist: :thumbsdown: | -- |
| Geel | "Vangt en verwerkt de bal goed" | 1-5 sterren | Technisch |
| Oranje | "Controleert de bal onder druk (twee handen, een hand, in beweging)" | Slider 1-10 | Technisch |
| Rood | "Controleert de bal foutloos onder hoge druk, vangt met twee handen en een hand" | Slider 1-10 | Technisch, KERN |

#### Overzicht

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | -- | -- | -- |
| Groen | "Geeft de bal aan een vrije medespeler" | :+1: :fist: :thumbsdown: | -- |
| Geel | "Ziet vrije medespelers staan" | 1-5 sterren | Tactisch |
| Oranje | "Heeft goed overzicht over het speelveld, ziet meerdere opties" | Slider 1-10 | Tactisch |
| Rood | "Heeft volledig overzicht over het speelveld, leest passlijnen, ziet kansen die anderen niet zien" | Slider 1-10 | Tactisch, KERN |

#### Besluitvorming

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Geel | -- (zit impliciet in overzicht) | -- | -- |
| Oranje | "Maakt de juiste keuze: passen, schieten of vasthouden" | Slider 1-10 | Tactisch |
| Rood | "Maakt onder druk de juiste keuzes in een fractie van een seconde: schieten, passen, vasthouden; beschermt het balbezit door de veilige optie te kiezen als er geen goede schietkans is" | Slider 1-10 | Tactisch, KERN |

#### Aanname in beweging

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Geel | -- (zit impliciet in balbehandeling) | -- | -- |
| Oranje | "Neemt de bal aan terwijl hij/zij in beweging is, kan direct doorspelen" | Slider 1-10 | Technisch |
| Rood | "Neemt de bal in volle sprint feilloos aan, de aanname is onderdeel van de actie" | Slider 1-10 | Technisch, KERN |

#### Eenhandig spelen (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- | -- | -- |
| Rood | "Kan de bal met een hand controleren, passen en afronden, vergroot het speelbare bereik" | Slider 1-10 | Technisch, ONDERSCHEIDEND |

#### Tempo bepalen (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- | -- | -- |
| Rood | "Bepaalt het tempo van de aanval door de bal: versnelt door snelle passes bij overmacht, vertraagt door de bal vast te houden als de verdediging georganiseerd is" | Slider 1-10 | Tactisch, ONDERSCHEIDEND |

#### Creativiteit in passing (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- (bouwt op via techniek en overzicht) | -- | -- |
| Rood | "Verrast met onverwachte passes: verrassingspass, tikbal naar medespeler, creëert overtal door onorthodoxe passlijnen" | Slider 1-10 | Mentaal, ONDERSCHEIDEND |

### 4.4 VERDEDIGEN — Progressie

#### Dekken / Mandekking

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | "Rent en stopt zonder te vallen" (via BEWEGEN) | :+1: :thumbsdown: | -- |
| Groen | "Verdedigt actief (loopt mee met tegenstander)" | :+1: :fist: :thumbsdown: | -- |
| Geel | "Dekt de tegenstander goed af" | 1-5 sterren | Technisch |
| Oranje | "Dekt de directe tegenstander strak af (positie, contact, discipline)" | Slider 1-10 | Technisch |
| Rood | "Dekt de tegenstander strak en gedisciplineerd, blijft tussen tegenstander en korf, zonder overtredingen" | Slider 1-10 | Technisch, KERN |

#### Onderscheppen / Bal afpakken

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw | -- | -- | -- |
| Groen | "Probeert de bal af te pakken" | :+1: :fist: :thumbsdown: | -- |
| Geel | "Onderschept ballen (leest de passlijn)" | 1-5 sterren | Tactisch |
| Oranje | "Leest het spel en onderschept ballen, anticipeert op passes" | Slider 1-10 | Tactisch |
| Rood | "Anticipeert en onderschept gevaarlijke ballen, leest passlijnen" | Slider 1-10 | Tactisch, KERN |

#### Rebound

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Geel | -- (verschijnt bij hogere korf en harder spel) | -- | -- |
| Oranje | "Pakt rebounds na een schot (positie, timing)" | Slider 1-10 | Technisch |
| Rood | "Domineert de reboundzone: goede positie, timing, reboundpositie innemen (box-out), zet direct de omschakeling in" | Slider 1-10 | Technisch, KERN |

#### Druk op de bal

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Geel | -- (zit impliciet in dekken) | -- | -- |
| Oranje | "Zet druk op de balbezitter zonder de eigen positie op te geven" | Slider 1-10 | Technisch |
| Rood | "Zet continu druk op de balbezitter, maakt het moeilijk om te passen of te schieten" | Slider 1-10 | Technisch, KERN |

*Noot: Druk op de bal is consistent geclassificeerd als Technisch bij zowel Oranje als Rood. Het is primair een uitvoeringsvaardigheid (voetverplaatsing, armhouding, positiekeuze).*

#### Verdedigingscommunicatie

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Geel | -- | -- | -- |
| Oranje | "Stuurt medespelers aan bij verdedigen (roept, waarschuwt)" | Slider 1-10 | Mentaal |
| Rood | "Organiseert de verdediging door constant te communiceren: wissels, lopers, dekkingsafspraken" | Slider 1-10 | Mentaal, ONDERSCHEIDEND |

#### Blokken (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- (blokken vereist ervaring en timing) | -- | -- |
| Rood | "Blokkeert effectief schoten door timing, onderscheidt echt schot van schijnbeweging, zonder overtreding" | Slider 1-10 | Tactisch, ONDERSCHEIDEND |

*Noot: Blokken is geclassificeerd als Tactisch (timing en spellezing), niet als Mentaal. Bij 16-18 jaar is het durven-aspect voorbij; het draait om het lezen van het schot.*

#### Omschakeling aanval naar verdediging (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- (impliciet) | -- | -- |
| Rood | "Na balverlies onmiddellijk terug in verdedigende modus, pakt de dichtstbijzijnde tegenstander op" | Slider 1-10 | Mentaal, KERN |

#### Verdedigingsdiscipline (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- (impliciet in dekken) | -- | -- |
| Rood | "Blijft gedisciplineerd verdedigen ook bij achterstand of frustratie, maakt geen onnodige overtredingen" | Slider 1-10 | Mentaal, KERN |

#### Helpverdediging (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- | -- | -- |
| Rood | "Helpt uit bij doorbraak, schuift en roteert mee zonder eigen tegenstander volledig los te laten" | Slider 1-10 | Tactisch, ONDERSCHEIDEND |

#### Verdedigingsvorm herkennen (alleen Rood)

| Groep | Formulering | Schaal | Laag |
|-------|-------------|--------|------|
| Blauw-Oranje | -- | -- | -- |
| Rood | "Herkent de aanvalsopstelling van de tegenstander en past de eigen verdediging aan" | Slider 1-10 | Tactisch, ONDERSCHEIDEND |

### 4.5 Laag-itemmatrix per korfbalactie (Rood-niveau)

**SCHIETEN:**

| Laag | Items | Toelichting |
|------|-------|-------------|
| Technisch | `sch_t_afstandsschot`, `sch_t_doorloopbal`, `sch_t_techniek`, `sch_t_variatie`, `sch_t_rebound` | Techniek, kracht, precisie, variatie in schotvormen, aanvallende rebound |
| Tactisch | `sch_ta_schotkeuze`, `sch_ta_na_dreiging` | Schotselectie, timing, ruimte lezen |
| Mentaal | `sch_m_penalty`, `sch_m_scorend_vermogen` | Presteren onder druk, klinische afronding |

**AANVALLEN:**

| Laag | Items | Toelichting |
|------|-------|-------------|
| Technisch | `aan_t_vrijlopen`, `aan_t_1_op_1` | Looptechniek, schijnbewegingen, tempowisseling |
| Tactisch | `aan_ta_positie`, `aan_ta_dreigen`, `aan_ta_zonder_bal`, `aan_ta_spelcreatie`, `aan_ta_patronen` | Positiekeuze, ruimte-creatie, kansen voor anderen |
| Mentaal | `aan_m_omschakeling` | Mentale snelheid bij omschakeling, initiatief |

**PASSEN:**

| Laag | Items | Toelichting |
|------|-------|-------------|
| Technisch | `pas_t_techniek`, `pas_t_balbehandeling`, `pas_t_aanname`, `pas_t_eenhandig` | Passuitvoering, balcontrole, aanname in beweging |
| Tactisch | `pas_ta_overzicht`, `pas_ta_besluitvorming`, `pas_ta_tempo` | Speloverzicht, balbezitbeheer, tempobepaling |
| Mentaal | `pas_m_creativiteit` | Onverwachte oplossingen onder druk |

**VERDEDIGEN:**

| Laag | Items | Toelichting |
|------|-------|-------------|
| Technisch | `ver_t_dekken`, `ver_t_rebound`, `ver_t_druk_zetten` | Dekkingstechniek, positie, rebounds, baldruk |
| Tactisch | `ver_ta_onderscheppen`, `ver_ta_helpverdediging`, `ver_ta_verdedigingsvorm`, `ver_ta_blok` | Anticipatie, passlijnen, hulpverdediging, blokken |
| Mentaal | `ver_m_communicatie`, `ver_m_omschakeling`, `ver_m_discipline` | Verdediging organiseren, omschakeling, discipline |

---

## 5. Samenhang-overzicht — de Inside Out boom

Dit overzicht toont hoe ELKE Blauw-pijler uitgroeit tot de volledige Rood-items. Het visualiseert het Inside Out meegroei-principe als een boom.

### 5.1 BAL -> SCHIETEN + PASSEN

```
BAL (Blauw)
|
+-- bal_gooien
|   +-- Groen: sch_schieten_korf, pas_gooien_vangen
|   +-- Geel: sch_t_afstandsschot, sch_t_doorloopbal, sch_t_strafworp, pas_t_techniek
|   +-- Oranje: sch_t_afstandsschot, sch_t_doorloopbal, sch_t_techniek, sch_t_penalty, pas_t_techniek
|   +-- Rood: sch_t_afstandsschot (K), sch_t_doorloopbal (K), sch_t_techniek (K),
|             sch_t_variatie (O), sch_t_rebound (O), pas_t_techniek (K)
|
+-- bal_vangen
    +-- Groen: pas_gooien_vangen
    +-- Geel: pas_t_balbehandeling
    +-- Oranje: pas_t_balbehandeling, pas_t_aanname
    +-- Rood: pas_t_balbehandeling (K), pas_t_aanname (K), pas_t_eenhandig (O)
```

### 5.2 BEWEGEN -> AANVALLEN + VERDEDIGEN + FYSIEK

```
BEWEGEN (Blauw)
|
+-- bew_rennen
|   +-- Groen: aan_vrijlopen, ver_actief, fys_snel_beweeglijk
|   +-- Geel: aan_t_vrijlopen, ver_t_dekken, fys_snelheid
|   +-- Oranje: aan_t_vrijlopen, ver_t_dekken, fys_snelheid
|   +-- Rood: aan_t_vrijlopen (K), aan_t_1_op_1 (O), ver_t_dekken (K), fys_snelheid (K)
|
+-- bew_richting
    +-- Groen: aan_vrijlopen, aan_positie
    +-- Geel: aan_t_vrijlopen, aan_ta_positie, fys_beweeglijkheid
    +-- Oranje: aan_t_vrijlopen, aan_m_omschakeling, fys_beweeglijkheid
    +-- Rood: aan_t_vrijlopen (K), aan_m_omschakeling (K),
              ver_m_omschakeling (K), fys_beweeglijkheid (K)
```

### 5.3 SAMEN -> SOCIAAL

```
SAMEN (Blauw)
|
+-- sam_samenspelen
|   +-- Groen: ik_samenwerken
|   +-- Geel: (impliciet in PAS-items)
|   +-- Oranje: soc_samenwerking, soc_teamsfeer, soc_plezier
|   +-- Rood: soc_samenwerking (K), soc_teamsfeer (O), soc_coaching (O),
|             soc_aanstekelijk_plezier (K)
|
+-- sam_luisteren
    +-- Groen: (impliciet in ik_samenwerken)
    +-- Geel: (impliciet in men_coachbaarheid)
    +-- Oranje: soc_communicatie
    +-- Rood: soc_veldcommunicatie (K)
```

### 5.4 IK -> MENTAAL

```
IK (Blauw)
|
+-- ik_durft
|   +-- Groen: ik_doorzetten
|   +-- Geel: men_inzet, men_coachbaarheid
|   +-- Oranje: men_inzet, men_groei
|   +-- Rood: men_inzet (K), men_wedstrijdmentaliteit (K),
|             men_drukbestendigheid (O)
|
+-- ik_plezier
    +-- Groen: (impliciet in ik_samenwerken)
    +-- Geel: men_plezier
    +-- Oranje: soc_plezier [verschuift naar SOC]
    +-- Rood: soc_aanstekelijk_plezier (K) [verschuift naar SOC]
```

### 5.5 Sociale veiligheid — doorlopende lijn

```
veilig_welkom (Blauw, signaalvlag Ja/Nee)
    +-- veilig_welkom (Groen, signaalvlag Ja/Nee)
    +-- soc_veiligheid (Geel, 1-5 sterren)
    +-- soc_veiligheid (Oranje, 1-10)
    +-- soc_veiligheid (Rood, 1-10, KERN)
```

### 5.6 Tellingencontrole

| Blauw-item | Rood-items dat het voedt | Aantal |
|------------|--------------------------|--------|
| `bal_gooien` | sch_t_afstandsschot, sch_t_doorloopbal, sch_t_techniek, sch_t_variatie, sch_t_rebound, pas_t_techniek | 6 |
| `bal_vangen` | pas_t_balbehandeling, pas_t_aanname, pas_t_eenhandig | 3 |
| `bew_rennen` | aan_t_vrijlopen, aan_t_1_op_1, ver_t_dekken, fys_snelheid | 4 |
| `bew_richting` | aan_t_vrijlopen, aan_m_omschakeling, ver_m_omschakeling, fys_beweeglijkheid | 4 |
| `sam_samenspelen` | soc_samenwerking, soc_teamsfeer, soc_coaching, soc_aanstekelijk_plezier | 4 |
| `sam_luisteren` | soc_veldcommunicatie | 1 |
| `ik_durft` | men_inzet, men_wedstrijdmentaliteit, men_drukbestendigheid | 3 |
| `ik_plezier` | soc_aanstekelijk_plezier | 1 |
| `veilig_welkom` | soc_veiligheid | 1 |

**Conclusie:** Elk Blauw-item leidt naar minimaal 1 Rood-item. Geen losse eindjes.

---

## 6. De 3 scoutingsmethoden

### 6.1 Methode 1: INDIVIDUEEL

**Doel:** Compleet profiel van een enkele speler opbouwen.

**Wanneer:** Bij doorstroombeslissingen, niveaubepaling nieuwe spelers, tussentijdse ontwikkelcheck.

**Hoe:** De scout (of trainer) beoordeelt 1 speler op alle items van de bijbehorende leeftijdsgroep, met de bijbehorende schaal. Verplichte metadata: `context: veld | zaal`.

| Leeftijdsgroep | Aantal items | Schaal | Verwachte invultijd |
|----------------|-------------|--------|---------------------|
| Blauw | 9 | :+1: :thumbsdown: + Ja/Nee | 2 minuten |
| Groen | 13 | :+1: :fist: :thumbsdown: + Ja/Nee | 3 minuten |
| Geel | 22 | 1-5 sterren | 5 minuten |
| Oranje | 37 | Slider 1-10 | 10 minuten |
| Rood | 58 | Slider 1-10 | 15 minuten |

**Filter-optie (specifiek scouten):** Een scout kan een individuele scouting beperken tot een subset van pijlers. Bijvoorbeeld: "Beoordeel alleen SCHIETEN en VERDEDIGEN van deze speler." Dit is functioneel equivalent aan gerichte scouting — het is geen aparte methode maar een filter op de individuele methode.

**Betrouwbaarheid:** Een enkele observatie is onvoldoende voor een betrouwbare beoordeling. Het USS-model weegt scouting-data zwaarder naarmate er meer rapporten zijn (zie `rules/score-model.md`, sectie 7):

| Aantal rapporten | Gewicht scout | Betrouwbaarheid |
|-----------------|--------------|-----------------|
| 1-2 | 0.4 | Concept — eerste indruk |
| 3-4 | 0.6 | Basis — begint te stabiliseren |
| 5-9 | 0.8 | Betrouwbaar |
| 10+ | 0.9 | Bevestigd |

### 6.2 Methode 2: TEAM

**Doel:** Totaalbeeld van een heel team in een enkele sessie.

**Wanneer:** Bij seizoensstart (basescan), eindevaluatie, tussentijds teamoverzicht.

**Hoe:** De scout (of trainer) beoordeelt alle spelers van een team op de **7 topscores** (SCH, AAN, PAS, VER, FYS, MEN, SOC) met een relatieve 5-puntschaal:

| Score | Symbool | Betekenis |
|-------|---------|-----------|
| 5 | **++** | Blinkt uit in dit team |
| 4 | **+** | Bovengemiddeld voor dit team |
| 3 | **=** | Gemiddeld voor dit team |
| 2 | **-** | Onder gemiddeld voor dit team |
| 1 | **--** | Valt tegen in dit team |

**Alle 7 topscores worden beoordeeld:** SCH, AAN, PAS, VER, FYS, MEN, SOC. Elke speler krijgt per score een ++/+/=/--/-- beoordeling, relatief ten opzichte van het eigen team.

**Identiek aan trainer-evaluatie:** Deze relatieve 5-puntschaal is bewust identiek aan wat een trainer invult bij evaluaties (niveau 1-5 in de evaluatie-app). Dit is geen toeval — het is een ontwerp-principe dat automatische cross-validatie mogelijk maakt (zie sectie 9).

**Output:** Een teammatrix met alle spelers als rijen en de 7 pijlers als kolommen. Per cel een ++/+/=/-/-- score.

**Efficientie:** Een team van 8 spelers x 7 pijlers = 56 beoordelingen. Dit kost een scout 5-10 minuten na een wedstrijd.

### 6.3 Methode 3: VERGELIJKING

**Doel:** 2-6 spelers direct naast elkaar positioneren op specifieke aspecten.

**Wanneer:** Bij selectiebeslissingen ("wie gaat naar A-categorie?"), grensgevallen, tweestrijd-situaties.

**Hoe:** Per aspect sleept de scout spelers op een horizontale balk van zwak naar sterk. De **7 topscores** (SCH, AAN, PAS, VER, FYS, MEN, SOC) worden beoordeeld op een continue balk (maximaal 6 spelers per vergelijking).

**Wat dit oplevert:**
1. **Rangorde:** directe vergelijking
2. **Afstandsinformatie:** hoe groot is het verschil?
3. **Gelijke posities:** spelers mogen op dezelfde positie staan als het verschil verwaarloosbaar is

**Voordeel boven individuele scoring:** Bij individuele scoring worden spelers onafhankelijk beoordeeld. Vergelijkingsscouting dwingt de scout tot een directe keuze: "als ik maar een van deze twee kan kiezen, wie kies ik dan?" Dit levert scherpere informatie op bij grensgevallen.

**Relatie tot USS:** De posities op de balk worden vertaald naar relatieve USS-afstanden.

---

## 7. KNKV-mapping: de 8 acties

De KNKV definieert 8 korfbalacties: 4 aanvallende en 4 verdedigende. Ons model gebruikt 4 pijlers die zowel de aanvallende als verdedigende variant dekken.

### Hoe de 8 KNKV-acties mappen op onze 4 pijlers

```
KNKV 8 ACTIES                           ONZE 4 PIJLERS
----------------------------------------------------------------------
AANVALLEND:
  1. Schieten                    --->  SCHIETEN (technisch + tactisch + mentaal)
  2. Vrijlopen om te schieten   --->  AANVALLEN (vrijlopen, positiespel, dreigen)
  3. Vrijpassen om te schieten  --->  PASSEN (passtechniek, overzicht, besluitvorming)
  4. Balbezit behouden          --->  PASSEN (tactisch: balbehandeling, overzicht, balbezitbeheer)

VERDEDIGEND:
  5. Voorkomen van schieten     --->  VERDEDIGEN (blokken, schotverstoring, druk op bal)
  6. Voorkomen van vrijlopen    --->  VERDEDIGEN (dekken, mandekking, positie)
  7. Voorkomen van vrijpassen   --->  VERDEDIGEN (onderscheppen, passlijnen)
  8. Balbezit heroveren         --->  VERDEDIGEN (tactisch: rebounds, onderscheppen, druk)
```

### Waarom 4 pijlers en niet 8?

De 8 KNKV-acties zijn als bril op het spel onmisbaar. Maar voor een beoordelingsmodel zijn 8 acties te veel — research uit games en analytics toont dat 6-8 hoofdcategorieen de sweet spot is voor begrijpelijkheid (EA Sports FC gebruikt 6, NBA 2K gebruikt 6). Bovendien zijn de verdedigende acties functioneel het spiegelbeeld van de aanvallende acties.

### Korfbal-specifieke context

Korfbal is uniek: elke speler speelt zowel in het aanvals- als verdedigingsvak (wisseling na 2 goals in A-categorie). Daarom moet elke speler ALLE 4 pijlers beheersen. Een pure "scorer" zonder verdedigingskwaliteiten komt niet boven USS 150. Dit verschilt fundamenteel van voetbal (specialistische posities).

---

## 8. ASM-integratie

### Het Athletic Skills Model als fundament

Het Athletic Skills Model (Wormhoudt et al., 2018) is het leidende framework voor de motorische ontwikkeling in ons raamwerk. Het ASM-motto "first the athlete, then the specialist" bepaalt hoe onze pijlers verschijnen per leeftijdsgroep.

### Mapping ASM op ons model

| ASM-bouwsteen | Leeftijd | Ons model | Toelichting |
|---------------|----------|-----------|-------------|
| **10 Basic Movement Skills** | 5-9 jaar (Basic) | BAL, BEWEGEN (Blauw); korfbalacties verschijnen (Groen) | De basisbewegingen zijn de voorlopers van onze korfbalacties |
| **Coordinative Abilities** | 10-14 jaar (Transition) | TACTISCH laag verschijnt bij Geel | De "golden age" van motorische ontwikkeling valt samen met het verschijnen van het tactische laag |
| **Conditions of Movement** | 15-18 jaar (Performance) | FYSIEK pijler volledig uitgewerkt bij Rood | Kracht, uithoudingsvermogen, flexibiliteit en stabiliteit worden sportspecifiek getraind en gemeten |

### Verhouding basis:sport per leeftijdsgroep

| Leeftijdsgroep | ASM-verhouding | Ons model |
|----------------|----------------|-----------|
| Blauw (5-7) | **80:20** basis:sport | 4 brede pijlers (BAL, BEWEGEN, SAMEN, IK). Geen sportspecifieke termen. |
| Groen (8-9) | **~60:40** (einde Basic / begin Transition) | Korfbalacties verschijnen maar zijn nog breed geformuleerd. Geen laag-onderscheid. |
| Geel (10-12) | **50:50** | Twee lagen per actie (technisch + tactisch). De "golden age" maakt diepere beoordeling mogelijk. |
| Oranje (13-15) | **30:70** | Drie lagen, alle 7 pijlers. Sportspecifieke toepassing domineert. |
| Rood (16-18) | **20:80** | Maximale verdieping. 58 items, volledige matrix. |

---

## 9. Cross-validatie

### Het principe

Cross-validatie betekent: dezelfde speler beoordelen vanuit meerdere onafhankelijke bronnen en controleren of de conclusies convergeren.

### Waarom cross-validatie automatisch werkt

| Bron | Beoordelaar | Structuur | Schaal | Output |
|------|-------------|-----------|--------|--------|
| Trainer-evaluatie | Coach (dagelijks) | 7 pijlers | 1-5 (relatief t.o.v. team) | USS_coach |
| Team-scouting | Scout (incidenteel) | 7 pijlers | ++/+/=/--/-- (relatief t.o.v. team) | USS_scout |

### Signaalregels

- |Delta| <= 10 = Convergent (groen)
- |Delta| 10-20 = Aandachtspunt (geel)
- |Delta| > 20 = Significant verschil (rood) — nader onderzoek nodig

### Informatiebarriere

Scouts mogen de coach-evaluatie NIET zien voordat ze hun rapport indienen (en vice versa). Dit voorkomt anchoring en zorgt voor onafhankelijke databronnen.

---

## 10. Beoordelen zonder te labelen

### Het Pygmalion-effect

Bij het beoordelen van mentale en sociale kwaliteiten is er een fundamenteel risico: labeling. Het Pygmalion-effect (Rosenthal & Jacobson, 1968) toont aan dat verwachtingen van trainers de prestaties van kinderen direct beinvloeden.

### De regel: gedragsobservatie, NOOIT persoonlijkheidslabels

Alle mentale en sociale items in dit raamwerk zijn geformuleerd als **observeerbaar gedrag**, niet als persoonlijkheidstrekken:

| Vermijd (labelen) | Gebruik (observeren) |
|-------------------|---------------------|
| "Hij is mentaal zwak" | "Hij had moeite om zich te herstellen na de 0-2 achterstand" |
| "Zij is een leider" | "Zij coachte haar teamgenoten actief in de tweede helft" |
| "Hij heeft geen doorzettingsvermogen" | "Hij stopte met proberen na twee mislukte schoten" |
| "Zij is introvert" | "Zij zoekt minder contact met teamgenoten tijdens de pauze" |
| "Hij kan niet tegen druk" | "Bij 4-4 in de slotseconden aarzelde hij om te schieten" |

### Vier principes voor veilig beoordelen

1. **Observeer gedrag, niet persoonlijkheid** — beschrijf wat je ziet, niet wie het kind "is"
2. **Situatie-specifiek** — gedrag verschilt per context; een kind dat op training geen moeite doet, kan in wedstrijden uitblinken
3. **Tijdgebonden** — "vandaag liet hij zien dat..." in plaats van "hij is altijd..."
4. **Groei-gericht** — elke observatie koppelen aan ontwikkelpotentieel: "hij kan leren om..."

### Persoonlijkheid is niet stabiel bij kinderen

De Big Five persoonlijkheidsdimensies zijn pas vanaf circa 18 jaar redelijk stabiel (Roberts & DelVecchio, 2000). Bij kinderen onder 12 zijn persoonlijkheidslabels niet alleen onbetrouwbaar, maar potentieel schadelijk.

---

## 11. Inside Out meegroei-overzicht

### Totaalplaatje

```
Leeftijd   5  6  7  8  9  10  11  12  13  14  15  16  17  18
           |  BLAUW  | GROEN |    GEEL    |   ORANJE   |   ROOD    |

Pijlers:
SCH        .  .  .  o  o   o   o   o    o   o   o   o   o   o
AAN        .  .  .  o  o   o   o   o    o   o   o   o   o   o
PAS        .  .  .  o  o   o   o   o    o   o   o   o   o   o
VER        .  .  .  o  o   o   o   o    o   o   o   o   o   o
FYS        .  .  .  o  o   o   o   o    o   o   o   o   o   o
MEN        .  .  .  .  .   o   o   o    o   o   o   o   o   o
SOC        .  .  .  .  .   v   v   v    o   o   o   o   o   o

Lagen:
Technisch  .  .  .  .  .   o   o   o    o   o   o   o   o   o
Tactisch   .  .  .  .  .   o   o   o    o   o   o   o   o   o
Mentaal    .  .  .  .  .   .   .   .    o   o   o   o   o   o

Veiligheid:
           V  V  V  V  V   S   S   S    S   S   S   S   S   S

Schaal:
           2 niv.    3 niv.   5 sterren   Slider 1-10  Slider 1-10

Items:     9         13       22          37(+1)       58

. = impliciet (zit in bredere basispijler)
o = expliciet beoordeeld
v = alleen veiligheidsitem (soc_veiligheid)
V = signaalvlag (veilig_welkom, Ja/Nee)
S = standaard item (soc_veiligheid, 1-5 of 1-10)
```

### Overgangsmomenten

| Overgang | Wat verandert | Waarom op dit moment |
|----------|---------------|----------------------|
| Blauw -> Groen | BAL splitst in SCH + PAS; BEWEGEN in AAN + VER; FYSIEK verschijnt | ASM: einde Basic-fase, sportspecifieke termen mogen verschijnen |
| Groen -> Geel | IK wordt MENTAAL; 2 lagen per actie verschijnen; sterren-schaal; strafworp verschijnt; soc_veiligheid als item | ASM "golden age": coordinatieve vaardigheden pieken, tactisch inzicht groeit |
| Geel -> Oranje | SOCIAAL verschijnt als 7e pijler met plezier-item; 3 lagen per actie; slider-schaal | Puberteit: identiteitsvorming, sociale vergelijking, A-categorie begint |
| Oranje -> Rood | Items groeien van 37 naar 58; KERN/ONDERSCHEIDEND classificatie; aanvallende rebound verschijnt | ASM Performance-fase: maximale sportspecifieke verdieping |

### Pijler-ontwikkeling als voorloper-boom

```
BLAUW               GROEN              GEEL              ORANJE            ROOD
-----               -----              ----              ------            ----

BAL --------------> SCHIETEN --------> SCHIETEN --------> SCHIETEN -------> SCHIETEN
                                        T+Ta               T+Ta+Me          T+Ta+Me (9 items)
                 -> PASSEN ----------> PASSEN ----------> PASSEN ---------> PASSEN
                                        T+Ta               T+Ta+Me          T+Ta+Me (8 items)

BEWEGEN ----------> AANVALLEN -------> AANVALLEN -------> AANVALLEN ------> AANVALLEN
                                        T+Ta               T+Ta+Me          T+Ta+Me (8 items)
                 -> VERDEDIGEN ------> VERDEDIGEN ------> VERDEDIGEN -----> VERDEDIGEN
                                        T+Ta               T+Ta+Me          T+Ta+Me (10 items)
                 -> (FYSIEK) --------> FYSIEK ----------> FYSIEK ---------> FYSIEK (7 items)

SAMEN ------------> (in IK) ---------> (soc_veiligheid)-> SOCIAAL --------> SOCIAAL (8 items)

IK ---------------> IK --------------> MENTAAL ----------> MENTAAL --------> MENTAAL (8 items)

T=Technisch, Ta=Tactisch, Me=Mentaal (lagen)
```

---

## 12. Totaaloverzicht: KERN vs. ONDERSCHEIDEND bij Rood

### 12.1 Korfbalacties — Rood verdeling

| Actie | KERN | ONDERSCHEIDEND | Totaal |
|-------|------|----------------|--------|
| SCHIETEN | 5 (afstandsschot, doorloopbal, techniek, schotkeuze, penalty) | 4 (variatie, rebound, na dreiging, scorend vermogen) | 9 |
| AANVALLEN | 5 (vrijlopen, positie, dreigen, zonder bal, omschakeling) | 3 (1-op-1, spelcreatie, patronen) | 8 |
| PASSEN | 5 (techniek, balbehandeling, aanname, overzicht, besluitvorming) | 3 (eenhandig, tempo, creativiteit) | 8 |
| VERDEDIGEN | 6 (dekken, rebound, druk zetten, onderscheppen, omschakeling, discipline) | 4 (helpverdediging, verdedigingsvorm, blok, communicatie) | 10 |
| **Totaal korfbalacties** | **22** | **13** | **35** |

*Noot: VERDEDIGEN heeft 6 KERN-items (dekken, rebound, druk zetten, onderscheppen, omschakeling, discipline) en 4 ONDERSCHEIDEND (helpverdediging, verdedigingsvorm, blok, communicatie) = 10 totaal.*

### 12.2 Persoonlijke dimensies — Rood verdeling

| Dimensie | KERN | ONDERSCHEIDEND | Totaal |
|----------|------|----------------|--------|
| FYSIEK | 5 (snelheid, uithoudingsvermogen, kracht, beweeglijkheid, actiesnelheid) | 2 (sprongkracht, herstel) | 7 |
| MENTAAL | 5 (inzet, concentratie, weerbaarheid, wedstrijdmentaliteit, trainingsmentaliteit) | 3 (leiderschap, drukbestendigheid, zelfkritiek) | 8 |
| SOCIAAL | 5 (veldcommunicatie, samenwerking, rolacceptatie, aanstekelijk plezier, veiligheid) | 3 (coaching, teamsfeer, conflicthantering) | 8 |
| **Totaal persoonlijk** | **15** | **8** | **23** |

### 12.3 Totaal Rood

| Categorie | KERN | ONDERSCHEIDEND | Totaal |
|-----------|------|----------------|--------|
| Korfbalacties | 22 | 13 | 35 |
| Persoonlijk | 15 | 8 | 23 |
| **Totaal** | **37** | **21** | **58** |

*Noot: het totaal van 35 korfbalactie-items en 23 persoonlijke items geeft 58 items. `soc_veiligheid` is zowel een regulier item als een signaalfunctie: een score van 1-3 genereert een alarmsignaal.*

### 12.4 Wat maakt het verschil?

Een speler op USS 150-160 beheerst de KERN-items op goed tot uitstekend niveau, maar mist diepgang in de ONDERSCHEIDENDE items. Een speler op USS 175+ beheerst ook de onderscheidende items — dat is wat toptalent scheidt van een goede speler.

### 12.5 Tellingen per groep

| Groep | SCH | AAN | PAS | VER | Subtotaal 4 acties | FYS | MEN/IK | SOC | Veiligheid | TOTAAL |
|-------|-----|-----|-----|-----|---------------------|-----|--------|-----|------------|--------|
| Blauw | 2* | 2* | 2* | 2* | 4 (gedeeld via BAL+BEWEGEN) | 2* | 2 (IK) | 2 (SAMEN) | 1 signaalvlag | 9 |
| Groen | 2 | 2 | 2 | 2 | 8 | 2 | 2 (IK) | -- | 1 signaalvlag | 13 |
| Geel | 4 | 3 | 3 | 3 | 13 | 3 | 5 | 1 | -- | 22 |
| Oranje | 5 | 5 | 5 | 5 | 20 | 5(+1 opt.) | 5 | 7 | -- | 37(+1) |
| Rood | 9 | 8 | 8 | 10 | 35 | 7 | 8 | 8 | -- | 58 |

*\* Blauw heeft gedeelde basispijlers: BAL (2) dekt SCH+PAS, BEWEGEN (2) dekt AAN+VER+FYS*
*\* Bij Rood is `soc_veiligheid` meegeteld in SOC (8 items)*

### 12.6 Item-ID conventie

Het item-ID volgt de structuur: `[actie]_[laag]_[vaardigheid]`

| Prefix | Betekenis |
|--------|-----------|
| `sch_` | Schieten |
| `aan_` | Aanvallen |
| `pas_` | Passen |
| `ver_` | Verdedigen |
| `fys_` | Fysiek |
| `men_` | Mentaal |
| `soc_` | Sociaal |
| `_t_` | Technische laag |
| `_ta_` | Tactische laag |
| `_m_` | Mentale laag |

Bij Blauw en Groen is er geen laag-prefix (bijv. `sch_schieten_korf`, niet `sch_t_schieten_korf`).

---

## 13. Wetenschappelijke onderbouwing — verwijzingen per ontwerpkeuze

| Ontwerpkeuze | Onderbouwing | Bron |
|-------------|-------------|------|
| 7 hoofdscores (4+3) | 6-8 categorieen is de sweet spot voor begrijpelijkheid | `research-game-ratings.md` |
| 3 lagen per actie (Technisch/Tactisch/Mentaal) | Football Manager's driehoek als enige echte dimensionale structuur | `research-game-ratings.md` |
| Geen vierde laag (Fysiek) | Fysiek is niet actie-specifiek; ASM beoordeelt fysiek breed | Wormhoudt et al. (2018) |
| Inside Out meegroei | ASM-ontwikkelingsfasen: basis (5-9), transitie (10-14), performance (15-18) | Wormhoudt et al. (2018); `research-top-talent-assessment.md` |
| Blauw: 4 basispijlers, geen korfbaltermen | ASM: 80:20 basis:sport bij 5-9 jaar | Wormhoudt et al. (2018) |
| Groen: ASM-ratio ~60:40 | Einde Basic / begin Transition bij 8-9 jaar | Wormhoudt et al. (2018) |
| Geel: tactisch laag + strafworp verschijnt | ASM "golden age" + KNKV-competitieregels (strafworp bij 8-tallen) | Wormhoudt et al. (2018); KNKV (2024) |
| Plezier als eerste check bij jongsten | SDT: intrinsieke motivatie als hoogste kwaliteit; Oranje Draad POP-ratio's | Deci & Ryan (2000); `oranje-draad.md` |
| Plezier expliciet bij Oranje (soc_plezier) | SDT: piekleeftijd drop-out bij 13-14; Fun Integration Theory | Crane & Temple (2015); Visek et al. (2015) |
| Sociale veiligheid bij alle groepen | SDT-basisbehoefte verbondenheid; consequential validity | Deci & Ryan (2000); Messick (1995) |
| Gedragsobservatie i.p.v. persoonlijkheidslabels | Pygmalion-effect; Big Five instabiliteit bij kinderen | `research-motivatie-persoonlijkheid.md` |
| Growth mindset als trainbare kwaliteit | Dweck (2006): mindset is trainbaar en contextafhankelijk | `research-motivatie-persoonlijkheid.md` |
| Mental Toughness 4C-model | Clough et al. (2002): Control, Commitment, Challenge, Confidence | `research-motivatie-persoonlijkheid.md` |
| Team-scouting op relatieve 5-puntschaal | Professionele clubs gebruiken relatieve team-evaluaties | `research-scouting-methoden.md` |
| Vergelijkende scouting met continue balk | Bradley-Terry model / Elo-achtige vergelijking | `research-scouting-methoden.md` |
| Cross-validatie scout/trainer | Informatiebarriere-principe uit professionele scouting | `research-scouting-methoden.md` |
| 58 items als plafond (Rood) | Referentieprofiel + sociale veiligheid + aanvallende rebound | `profiel-top-talent-18.md` |
| KERN/ONDERSCHEIDEND classificatie | Verschil USS 150 vs 175 | `profiel-top-talent-18.md` |
| USS 0-200 als integrerende schaal | Geunificeerde Score Schaal verbindt team-ratings, scouting en evaluaties | `score-model.md` |
| Retentiedata per leeftijd | OW-data: 16 seizoenen, 1246 spelers, gevalideerd | `model/jeugdmodel.yaml` |
| KNKV-korfbalacties als basis voor 4 pijlers | KNKV Visie Teamsamenstelling en Talentontwikkeling (2024) | `research-top-talent-assessment.md` |
| Veld/zaal contextnotatie | Korfbal kent twee wezenlijk verschillende speelvarianten | KNKV competitieregels |
| Tweelaagse observatie-instructies (Rood) | Trade-off validiteit vs. bruikbaarheid | Assessmentliteratuur |
| Pilottest 7- vs. 10-puntsschaal (v1.3) | Inter-rater reliability daalt bij >7 schaalpunten | Preston & Colman (2000) |

---

## Bijlage A: Korfbal-specifieke ontwerpkeuzes

### A.1 Doorloopbal als kernvaardigheid

De doorloopbal is het korfbal-equivalent van de layup in basketbal. Het is de meest efficiente manier van scoren en verschijnt al bij Geel (10-12 jaar). Bij Rood is het een KERN-vaardigheid die links en rechts beheerst moet worden onder hoge druk.

### A.2 Geen dribble = nadruk op passen en vrijlopen

Korfbal kent geen dribble. Dit betekent dat PASSEN en AANVALLEN (vrijlopen) zwaarder wegen dan in sporten met dribble. De speler met de bal moet direct een keuze maken: schieten, passen of dreigen.

### A.3 Vak-indeling: elke speler moet ALLES

Omdat korfbal verplicht vak-indeling heeft (wissel na 2 goals), moet elke speler zowel aanvallen als verdedigen. Een pure aanvaller of pure verdediger bestaat niet.

### A.4 Strafworp: pas vanaf Geel

De KNKV kent strafworpen al bij Geel (8-tallen, 10-12 jaar). De korf staat op 3.0 meter, de bal is maat 4. De strafworp verschijnt in het raamwerk bij Geel als technisch item (`sch_t_strafworp`), bij Oranje als technisch item met nadruk op betrouwbaarheid (`sch_t_penalty`), en bij Rood als mentaal item met nadruk op presteren onder druk (`sch_m_penalty`). Deze progressielijn weerspiegelt de verschuiving van "de techniek leren" via "betrouwbaar uitvoeren" naar "scoren als het ertoe doet."

### A.5 Rebounding: korfbal-specifiek

Korfbal heeft geen backboard; de bal ketst af op de paal of korf. De *verdedigende* rebound verschijnt bij Oranje en is bij Rood een KERN-item (`ver_t_rebound`). De *aanvallende* rebound (na eigen of medespeler's schot direct afronden) verschijnt bij Rood als ONDERSCHEIDEND item (`sch_t_rebound`). Dit onderscheid volgt het NBA-model waar "offensive rebounding" en "defensive rebounding" gescheiden worden.

### A.6 Blokken: alleen bij Rood

Blokken (schotverstoring) vereist timing, spellezing en ervaring. Verschijnt bij Rood als tactisch ONDERSCHEIDEND item (`ver_ta_blok`). Het is geclassificeerd als Tactisch (niet Mentaal) omdat het bij 16-18 jaar primair draait om het lezen van het schot en timing, niet om durven.

### A.7 Gemengd spel en communicatie

A-categorie korfbal (vanaf U15) is verplicht 4V + 4M. Dit maakt communicatie extra belangrijk. Verdedigingscommunicatie verschijnt bij Oranje en wordt bij Rood een ONDERSCHEIDEND item.

### A.8 Balbezit behouden

Balbezit behouden (de vierde KNKV-aanvalsactie) is expliciet verwerkt in `pas_ta_besluitvorming` (Rood): "beschermt het balbezit door de veilige optie te kiezen als er geen goede schietkans is." Het is geen apart item maar een expliciete component van besluitvorming — de kunst om NIET te schieten als er geen kans is.

---

## Bijlage B: Relatie met USS score-model

Het vaardigheidsraamwerk en het USS score-model (`rules/score-model.md`) zijn complementair:

- **Het raamwerk** definieert WAT er beoordeeld wordt (welke items, welke schaal, per leeftijdsgroep)
- **Het USS-model** definieert HOE scores worden vertaald naar een vergelijkbaar getal (0-200)

De brug:
1. Individuele scouting levert scores per pijler -> gewogen gemiddelde -> scouting overall score
2. Scouting overall score -> `scoutingNaarUSS(score, groep)` -> USS_scouting
3. Team-scouting / trainer-evaluatie levert niveau 1-5 -> `coachNaarUSS(ussTeam, niveau)` -> USS_coach
4. USS_speler = gewogen combinatie van USS_scouting en USS_coach (afhankelijk van aantal rapporten)

---

## Bijlage C: Oranje Draad toets

Elke component van dit raamwerk is getoetst aan de Oranje Draad:

| Raamwerk-component | Plezier | Ontwikkeling | Prestatie |
|-------------------|---------|-------------|----------|
| Blauw: 4 basispijlers, smileys | Geen druk, speels beoordelen | Breed motorisch fundament | Niet aan de orde |
| Groen: korfbalacties, 3 niveaus | Samenwerken en doorzetten als items | Sportspecifieke vaardigheden | Minimaal |
| Geel: lagen, sterren, strafworp | Plezier als expliciet MEN-item | Technisch + tactisch onderscheid, strafworptechniek | Beginnende vergelijking |
| Oranje: 7 pijlers, slider, plezier | Plezier als expliciet SOC-item + teamsfeer | Drie lagen, groei-gericht | A-categorie, selectie |
| Rood: 58 items, KERN/ONDERSCHEIDEND | "Aanstekelijk plezier" als item | Groei naar senioren | USS-niveaubepaling |
| Sociale veiligheid: alle groepen | Beschermt plezier als voorwaarde | Voorwaarde voor groei | - |
| Team-scouting: 7 topscores op 5-puntschaal | Efficient: geen druk op individu | Breed overzicht | Vergelijking binnen team |
| Vergelijkingsscouting: 7 topscores op continue balk | - | - | Scherpe selectie-informatie |
| Cross-validatie | - | Kwaliteitsborging | Objectieve beoordeling |
| Gedragsobservatie | Beschermt zelfbeeld kind | Groei-gerichte feedback | - |
| Veld/zaal context | Eerlijke beoordeling in beide varianten | Volledig beeld | Context-specifieke prestatie |

---

## Bijlage D: Onderliggende documenten

Dit raamwerk is gebaseerd op de volgende documenten in `docs/jeugdontwikkeling/`:

| Document | Inhoud | Relatie tot raamwerk |
|----------|--------|---------------------|
| `items-korfbalacties.md` | Volledige itemuitwerking SCH/AAN/PAS/VER | Sectie 3 (korfbalactie-items) en sectie 4 (progressietabellen) |
| `items-persoonlijk.md` | Volledige itemuitwerking FYS/MEN/SOC | Sectie 3 (persoonlijke items) en samenhang-checks |
| `panel-discussie-v1.2.md` | 17 verbeterpunten paneldiscussie | Alle wijzigingen in v1.2 |
| `profiel-top-talent-18.md` | Referentieprofiel 18-jarig toptalent | Rood-items en KERN/ONDERSCHEIDEND classificatie |
| `research-game-ratings.md` | Analyse FIFA/FM/NBA 2K ratingsystemen | 7-score structuur en 3-lagen model |
| `research-top-talent-assessment.md` | Wetenschappelijke talentbeoordeling | ASM-integratie en beoordelingsstructuur |
| `research-motivatie-persoonlijkheid.md` | SDT, growth mindset, Mental Toughness | Mentale en sociale items, labelingsprincipes |
| `research-scouting-methoden.md` | Scoutingsmethoden en betrouwbaarheid | 3 methoden, cross-validatie, IRR |

---

## 14. Changelog v1.1 → v1.2

Alle 17 verbeterpunten uit de paneldiscussie (`panel-discussie-v1.2.md`) zijn verwerkt:

### Prioriteit 1 — Structurele wijzigingen

| # | Punt | Wijziging | Impact |
|---|------|-----------|--------|
| 1 | **Mentale overlap uitleggen** | Uitlegkader toegevoegd in sectie 2: verschil mentale laag per actie (situatie-specifiek) vs. MENTAAL-pijler (persoonsbreed), met concreet korfbalvoorbeeld. Herinneringen bij Oranje en Rood. | Geen item-wijzigingen |
| 2 | **Plezier bij Oranje** | Nieuw item `soc_plezier` bij Oranje SOCIAAL: "Straalt plezier uit tijdens training en wedstrijd; reageert enthousiast op goede acties van anderen." Progressietabel plezier-lijn continu gemaakt: `ik_plezier` -> `men_plezier` -> `soc_plezier` -> `soc_aanstekelijk_plezier`. | Oranje +1 item |
| 3 | **Sociale veiligheid** | Signaalvlag `veilig_welkom` (Ja/Nee, trainer-only) bij Blauw en Groen. Item `soc_veiligheid` bij Geel (1-5 sterren), Oranje (1-10) en Rood (1-10, KERN). Alarmsignaal bij score "Nee" of 1-3. | Blauw +1, Groen +1, Geel +1, Oranje +1, Rood +1 |
| 4 | **Strafworp naar Geel** | Nieuw item `sch_t_strafworp` bij Geel SCHIETEN (Technisch): "Kan een strafworp nemen (goede positie, zuivere worp)." Oranje strafworp hernoemd van `sch_ta_penalty` naar `sch_t_penalty` (Technisch). Progressielijn: Geel T -> Oranje T -> Rood M. | Geel +1 item; Oranje laagcorrectie |
| 5 | **Veld/zaal differentiatie** | Nieuw uitlegblok "Veld vs. Zaal" in sectie 2. Verplichte metadata `context: veld | zaal` bij elke scouting-sessie. Veld/zaal observatie-instructies bij 5 specifieke items. | Geen item-wijzigingen |
| 6 | **Laag-classificaties corrigeren** | `ver_ta_druk` -> `ver_t_druk` (Tactisch -> Technisch) bij Oranje. `ver_m_blok` -> `ver_ta_blok` (Mentaal -> Tactisch) bij Rood. `sch_ta_penalty` -> `sch_t_penalty` (Tactisch -> Technisch) bij Oranje. | 3 item-ID hernoeningen + laagcorrecties |
| 7 | **5 formuleringen concreter** | `men_leiderschap` (Rood): "inspireert" -> "loopt rechtop na tegengoal, spreekt bemoedigend aan." `men_wedstrijdmentaliteit` (Rood): "winnaarsmentaliteit" verwijderd. `soc_coaching` (Rood): "korte, specifieke, positieve aanwijzingen." `aan_ta_spelcreatie` (Rood): "regisseur/dicteert" -> "slim bewegen, ruimte vrijmaken." `men_drukbestendigheid` (Rood): "ademhaling gecontroleerd" -> "presteert op gelijk/hoger niveau in 5 belangrijkste wedstrijden." | 5 formuleringen herschreven |

### Prioriteit 2 — Verfijningen en documentatie

| # | Punt | Wijziging | Impact |
|---|------|-----------|--------|
| 8 | **ASM-ratio Groen** | Onderbouwingstekst Groen: "80:20" -> "circa 60:40 (einde Basic / begin Transition)." | Alleen tekst |
| 9 | **7-puntsschaal** | Geparkeerd voor pilottest v1.3. Ankerbeschrijvingen (1-3, 4-6, 7-8, 9-10) als tussenoplossing. Notitie in raamwerk. | Alleen tekst |
| 10 | **Aanvallende rebound** | Nieuw item `sch_t_rebound` bij Rood SCHIETEN (Technisch, ONDERSCHEIDEND): "Pakt aanvallende rebounds en rondt direct af." | Rood +1 item |
| 11 | **Balbezit behouden** | `pas_ta_besluitvorming` (Rood) uitgebreid met "beschermt het balbezit door de veilige optie te kiezen als er geen goede schietkans is." Observatie-instructie `pas_ta_tempo` aangevuld. | Formulering uitgebreid |
| 12 | **Fysiek als ontbrekende laag** | Uitlegblok "Waarom drie lagen en niet vier?" in sectie 2: fysiek is niet actie-specifiek, daarom aparte pijler. | Alleen tekst |
| 13 | **Sprongkracht bij Oranje** | Optioneel item `fys_sprongkracht` bij Oranje met waarschuwing biologische rijping. Niet in standaard telling. | +1 optioneel item |
| 14 | **Cognitieve dimensie** | Kruistabel "Cognitieve dimensie — mapping naar bestaande items" in sectie 2. 7 cognitieve vaardigheden gemapped op bestaande item-ID's. | Alleen tekst |
| 15 | **Overlap tempo/spelcreatie** | `pas_ta_tempo` (Rood): nadruk op BAL ("door de bal: versnelt door snelle passes, vertraagt door vasthouden"). `aan_ta_spelcreatie` (Rood): nadruk op BEWEGING ("door slim te bewegen: trekt verdedigers weg, maakt ruimte vrij"). | 2 formuleringen aangescherpt |
| 16 | **Engelse termen vernederlandsen** | "passing lanes" -> "passlijnen" in alle items en tekst. "no-look pass" -> "verrassingspass." "box-out" behouden als korfbaljargon met Nederlandse toelichting "reboundpositie innemen." | Terminologie |
| 17 | **Observatie-instructies Rood inkorten** | Tweelaagse instructie: kernzin (max 15 woorden, standaard in app) + uitgebreide versie (via "meer info"). Alle Rood-items voorzien van kernzin. | UX-wijziging |

### Totale impact op itemtellingen

| Groep | v1.1 | v1.2 | Verschil | Details |
|-------|------|------|----------|---------|
| Blauw | 8 | 9 | +1 | + signaalvlag `veilig_welkom` |
| Groen | 12 | 13 | +1 | + signaalvlag `veilig_welkom` |
| Geel | 20 | 22 | +2 | + `sch_t_strafworp`, + `soc_veiligheid` |
| Oranje | 35 | 37 (+1 opt.) | +2 (+1) | + `soc_plezier`, + `soc_veiligheid`, + optioneel `fys_sprongkracht` |
| Rood | 56 | 58 | +2 | + `soc_veiligheid`, + `sch_t_rebound` |
