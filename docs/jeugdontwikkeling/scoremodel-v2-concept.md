# USS v2 — Scoremodel Concept

> **Versie:** 2.0-concept
> **Datum:** 2026-03-26
> **Status:** Concept — ter bespreking TC
> **Voorganger:** USS v1.0 (`rules/score-model.md`)
> **Vereiste:** Vaardigheidsraamwerk v3.0 (`docs/jeugdontwikkeling/vaardigheidsraamwerk-v3.md`)
> **Implementatie:** `packages/types/src/score-model.ts` (toekomstig)

---

## 1. Waarom USS v2?

USS v1 combineert drie bronnen tot een speler-USS:

| Bron | Wat het meet | Hoe het vertaalt |
|------|-------------|-----------------|
| KNKV teamrating | Teamsterkte | Directe mapping (1:1) |
| Scouting overall-score | Individuele sterkte (6 pijlers, 1 getal) | Conversieformule per leeftijdsgroep |
| Coach-evaluatie (niveau 1-5) | Positie in eigen team | Offset t.o.v. team-USS |

Dit werkt, maar heeft drie beperkingen:

1. **Geen pijler-USS.** We weten dat een speler USS 112 is, maar niet of dat komt door sterk aanvallen of sterk verdedigen.
2. **Het raamwerk is veranderd.** v3.0 heeft variabele pijlers (5/6/7/9) met verschillende schalen per leeftijdsgroep. De oude conversieformule (0-99 overall score) past niet meer.
3. **Nieuwe methoden.** De TEAM-methode (trainer-evaluatie via kern-items) en de VERGELIJKING-methode (relatieve positionering op een balk) zijn nieuwe databronnen die USS v1 niet kent.

USS v2 lost dit op met **vijf databronnen** en **USS per pijler**.

---

## 2. Het model in een oogopslag

```
                    ┌──────────────────────────────┐
                    │        USS_speler             │
                    │   (gewogen combinatie)         │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────┴────────┐  ┌───────┴───────┐  ┌────────┴────────┐
     │   USS_coach      │  │  USS_scout     │  │ USS_vergelijking│
     │ (TEAM-methode)   │  │ (INDIVIDUEEL)  │  │ (VERGELIJKING)  │
     └────────┬────────┘  └───────┬───────┘  └────────┬────────┘
              │                    │                    │
              │    per pijler      │    per pijler      │    per pijler
              │                    │                    │
     ┌────────┴────────┐  ┌───────┴───────┐           │
     │  USS_team        │  │  Basislijn     │           │
     │  (KNKV/A-cat)    │  │  S(leeftijd)   │           │
     │  = ANKER          │  │  = REFERENTIE  │           │
     └─────────────────┘  └───────────────┘           │
                                                       │
                                              Verankering via
                                              bekende USS-scores
```

**Kernprincipe:** Elke pijler krijgt een eigen USS. De overall USS is een gewogen gemiddelde van de pijler-USS scores.

---

## 3. Wat blijft uit USS v1

### 3.1 De basislijnfunctie — ongewijzigd

```
S(l) = S_max / (1 + e^(-k * (l - l₀)))
```

| Parameter | Waarde | Betekenis |
|-----------|--------|-----------|
| S_max | 180 | Asymptotisch maximum |
| k | 0.35 | Steilheid |
| l₀ | 12.5 | Inflectiepunt |

De basislijn geeft de verwachte USS voor een gemiddelde speler op leeftijd `l`. Dit is het referentiepunt voor alle conversies.

### 3.2 KNKV teamrating naar USS_team — ongewijzigd

```
USS_team = KNKV_rating          (B-categorie)
USS_team = A_CATEGORIE_USS[key] (A-categorie)
```

### 3.3 De brug — ongewijzigd als principe

```
USS_team ≈ gemiddelde(USS_speler)  voor alle spelers in het team
```

---

## 4. Bron 1: KNKV teamrating (USS_team)

Ongewijzigd. Zie USS v1, sectie 4.

---

## 5. Bron 2: Trainer-evaluatie — TEAM-methode (USS_coach)

### 5.1 Wat verandert t.o.v. USS v1

| Aspect | USS v1 | USS v2 |
|--------|--------|--------|
| Input | Eén niveau (1-5) per speler | ~10 kern-items per speler, gegroepeerd in pijlers |
| Output | Eén USS_coach | USS_coach **per pijler** + overall USS_coach |
| Schaal | 1-5 (vijf niveaus) | Varieert per leeftijdsgroep (zie onder) |
| Anker | USS_team + offset | USS_team + offset (ongewijzigd principe) |

### 5.2 Van kern-items naar pijlerscore

De trainer vult de ~10 kern-items in. Per pijler worden de scores gemiddeld tot een **ruwe pijlerscore**.

**Per leeftijdsgroep:**

| Groep | Schaal per item | Codering | Pijlerscore = |
|-------|----------------|----------|---------------|
| Blauw | Ja / Nog niet | Ja=1, Nog niet=0 | Percentage (0-100%) |
| Groen | Goed / Oke / Nog niet | Goed=1, Oke=0.5, Nog niet=0 | Percentage (0-100%) |
| Geel | 1-5 sterren | Waarde 1.0-5.0 | Gemiddelde (1.0-5.0) |
| Oranje | Slider 1-10 | Waarde 1.0-10.0 | Gemiddelde (1.0-10.0) |
| Rood | Slider 1-10 | Waarde 1.0-10.0 | Gemiddelde (1.0-10.0) |

**Voorbeeld Geel:** Trainer geeft voor de pijler AANVALLEN twee kern-items:
- `aan_vrijlopen` = 4
- `aan_balbezit` = 3

Pijlerscore AANVALLEN = (4 + 3) / 2 = **3.5**

### 5.3 Van pijlerscore naar USS_coach per pijler

Het principe uit v1 blijft: de score van een speler wordt uitgedrukt als **offset ten opzichte van de team-USS**. De schaal en het bereik van de offset hangen af van de leeftijdsgroep.

**Formule:**

```
USS_coach_pijler = USS_team + offset(pijlerscore, schaal)
```

De offset-functie vertaalt een ruwe pijlerscore naar een USS-verschil ten opzichte van het teamgemiddelde. Het teamgemiddelde (schaal-mediaan) geeft offset = 0.

**Offset-definitie per schaal:**

| Schaal | Min | Max | Mediaan | Offset-formule | Offset-bereik |
|--------|-----|-----|---------|----------------|---------------|
| Blauw (%) | 0% | 100% | 50% | (score - 50) / 50 * B | [-B, +B] |
| Groen (%) | 0% | 100% | 50% | (score - 50) / 50 * B | [-B, +B] |
| Geel (1-5) | 1.0 | 5.0 | 3.0 | (score - 3.0) / 2.0 * B | [-B, +B] |
| Oranje (1-10) | 1.0 | 10.0 | 5.5 | (score - 5.5) / 4.5 * B | [-B, +B] |
| Rood (1-10) | 1.0 | 10.0 | 5.5 | (score - 5.5) / 4.5 * B | [-B, +B] |

Waarbij **B = bandbreedte** = de maximale USS-afwijking ten opzichte van het teamgemiddelde.

**De bandbreedte B:**

| Groep | B (USS-punten) | Toelichting |
|-------|----------------|-------------|
| Blauw | 15 | Kleine spreiding, iedereen leert |
| Groen | 18 | Iets meer differentiatie |
| Geel | 20 | Duidelijke niveauverschillen zichtbaar |
| Oranje | 22 | Grotere spreiding door selectie-effect |
| Rood | 25 | Maximale spreiding, sterkste differentiatie |

De bandbreedte groeit mee met de leeftijd: bij jongere kinderen is de spreiding binnen een team kleiner (iedereen leert), bij oudere spelers zijn de niveauverschillen groter.

**Generieke formule:**

```
USS_coach_pijler = USS_team + ((pijlerscore - mediaan) / halve_bereik) * B
```

### 5.4 Overall USS_coach

```
USS_coach = Σ(w_i × USS_coach_pijler_i)
```

De gewichten w_i zijn gedefinieerd per leeftijdsgroep in het raamwerk (Bijlage A van v3.0).

**Wegingstabel (samenvatting):**

| Groep | Pijlers | Gewichten |
|-------|---------|----------|
| Blauw (5) | BAL, BEWEGEN, SPEL, SAMEN, IK | 25%, 25%, 25%, 12.5%, 12.5% |
| Groen (5) | BAL, BEWEGEN, SPEL, SAMEN, IK | 25%, 25%, 25%, 12.5%, 12.5% |
| Geel (6) | AANV, VERD, TEC, TAC, MEN, FYS | 18%, 18%, 18%, 18%, 14%, 14% |
| Oranje (7) | AANV, VERD, TEC, TAC, MEN, SOC, FYS | 16%, 16%, 16%, 16%, 12%, 12%, 12% |
| Rood (9) | AANV, VERD, SCO, TEC, TAC, SPI, MEN, SOC, FYS | 12%, 12%, 12%, 12%, 10%, 10%, 10%, 10%, 12% |

---

## 6. Bron 3: Individuele scouting (USS_scout)

### 6.1 Wat verandert t.o.v. USS v1

| Aspect | USS v1 | USS v2 |
|--------|--------|--------|
| Input | Overall score (0-99) | Per-pijler scores (uit kern + verdieping items) |
| Output | Eén USS_scout | USS_scout **per pijler** + overall USS_scout |
| Conversie | Eén formule per leeftijdsgroep | Per-pijler conversie met dezelfde formule |

### 6.2 Van items naar pijlerscore

De scout vult alle items in (kern + verdieping). Per pijler worden de scores gemiddeld.

**Voorbeeld Geel (pijler AANVALLEN, 5 items):**
- `aan_vrijlopen` = 4, `aan_positie` = 3, `aan_dreigen` = 4, `aan_balbezit` = 5, `aan_omschakeling` = 3
- Pijlerscore AANVALLEN = (4 + 3 + 4 + 5 + 3) / 5 = **3.8**

### 6.3 Van pijlerscore naar USS_scout per pijler

Bij individuele scouting is het anker niet het team, maar de **basislijn voor de leeftijd**. De scout beoordeelt absoluut, niet relatief.

**Formule:**

```
USS_scout_pijler = USS_basislijn(leeftijd) + offset(pijlerscore, schaal)
```

De offset-functie is identiek aan die bij USS_coach (sectie 5.3), maar met een **grotere bandbreedte** omdat individuele scouting een nauwkeurigere differentiatie toelaat (meer items per pijler).

**Bandbreedte scouting (B_scout):**

| Groep | B_scout (USS-punten) | B_coach | Verschil |
|-------|---------------------|---------|----------|
| Blauw | 18 | 15 | +3 (meer items) |
| Groen | 22 | 18 | +4 |
| Geel | 28 | 20 | +8 (25 items vs. 10 kern) |
| Oranje | 30 | 22 | +8 (40 items vs. 10 kern) |
| Rood | 32 | 25 | +7 (60 items vs. 10 kern) |

De scouting-bandbreedte is groter omdat:
1. Meer items per pijler geven een nauwkeuriger beeld
2. De verdiepingsitems laten extremen zien die de kern-items niet vangen
3. Een grotere bandbreedte in USS-punten doet recht aan de fijnere resolutie

### 6.4 Overall USS_scout

```
USS_scout = Σ(w_i × USS_scout_pijler_i)
```

Met dezelfde gewichten als bij USS_coach (sectie 5.4).

---

## 7. Bron 4: Vergelijkende scouting (USS_vergelijking)

### 7.1 Het probleem

Bij vergelijkende scouting positioneert een scout 2-6 spelers op een horizontale balk per pijler. Dit levert:
1. **Rangorde:** wie is beter op deze pijler?
2. **Afstand:** hoeveel beter?

Maar geen absolute score. Hoe vertaal je relatieve posities naar USS?

### 7.2 Het verankeringsmodel

De oplossing: gebruik spelers met bekende USS-scores als **ankers**.

**Stap 1: Balkposities normaliseren**

De balk loopt van 0 (zwakst in de vergelijkingsgroep) tot 100 (sterkst). De scout sleept spelers naar hun positie.

```
Voorbeeld: vergelijking AANVALLEN, 4 spelers

  0         25         50         75        100
  |---------|----------|----------|---------|
       Lisa(30)    Mila(52)  Thijs(71)  Daan(88)
```

**Stap 2: Verankeren via bekende USS-scores**

Tenminste een van de vergeleken spelers heeft al een USS (uit eerdere scouting of trainer-evaluatie). Stel dat Mila eerder USS_scout_AANVALLEN = 105 had en Thijs USS_coach_AANVALLEN = 115.

**Stap 3: Lineaire interpolatie**

Gebruik de ankers om de balkposities te vertalen naar USS:

```
USS_per_punt = (USS_Thijs - USS_Mila) / (pos_Thijs - pos_Mila)
             = (115 - 105) / (71 - 52)
             = 10 / 19
             = 0.526 USS per balkpunt
```

```
USS_Lisa    = USS_Mila + (pos_Lisa - pos_Mila) * USS_per_punt
            = 105 + (30 - 52) * 0.526
            = 105 + (-11.6)
            = 93

USS_Daan    = USS_Mila + (pos_Daan - pos_Mila) * USS_per_punt
            = 105 + (88 - 52) * 0.526
            = 105 + 18.9
            = 124
```

**Stap 4: Wanneer geen anker beschikbaar is**

Als geen enkele speler in de vergelijkingsgroep een bestaande USS heeft, valt het systeem terug op de team-USS als referentie:

```
USS_vergelijking_pijler = USS_team + ((balkpositie - 50) / 50) * B
```

Dit is functioneel identiek aan de coach-offset, maar met de balkpositie als input in plaats van een itemscore.

### 7.3 Betrouwbaarheid van vergelijkingsdata

Vergelijkingsdata is inherent minder betrouwbaar dan individuele scouting:
- Het is een relatief oordeel, geen absoluut
- Het hangt af van de kwaliteit van de ankers
- Het is gevoelig voor de samenstelling van de vergelijkingsgroep

Daarom krijgt USS_vergelijking een **lagere weging** dan USS_scout in de combinatieformule (sectie 9).

### 7.4 Bradley-Terry als toekomstige verbetering

Het verankeringsmodel hierboven is een pragmatische eerste stap. Een volwaardig Bradley-Terry model zou robuuster zijn:

- Na elke vergelijking worden spelerscores bijgewerkt (Elo-achtig)
- Na voldoende vergelijkingen convergeert het systeem naar een betrouwbare ranking
- Goed in omgaan met inconsistenties en transitieve relaties

Dit is een **toekomstige uitbreiding**, niet voor de eerste implementatie. De huidige vergelijkingsfunctie met verankeringsmodel is eenvoudiger te implementeren en te begrijpen.

---

## 8. Bron 5: Team-context (het anker)

### 8.1 Het principe

Elke relatieve beoordeling (coach, vergelijking) heeft een **absoluut referentiepunt** nodig. Dat is de team-USS.

- Een score van 4.0/5.0 in een sterk team (USS_team = 120) levert een hogere USS op dan dezelfde score in een zwak team (USS_team = 80)
- Dit is het mechanisme dat relatieve scores absoluut maakt

### 8.2 Formeel

```
USS_coach_pijler = USS_team + offset(score)    ← team-context als anker
USS_scout_pijler = USS_basislijn(leeftijd) + offset(score)  ← leeftijd als anker
```

De coach-evaluatie is verankerd aan het team. De individuele scouting is verankerd aan de leeftijdsbasislijn. De vergelijking is verankerd aan bekende USS-scores of (fallback) het team.

### 8.3 Wanneer team-context ontbreekt

Bij een speler die niet in een bestaand team speelt (nieuwkomer, transferspeler), is er geen USS_team beschikbaar. In dat geval:

1. Gebruik USS_basislijn(leeftijd) als fallback-anker voor coach-evaluaties
2. Individuele scouting werkt sowieso met de basislijn

---

## 9. Gecombineerde USS_speler

### 9.1 Per pijler combineren

Per pijler combineren we de beschikbare bronnen:

```
USS_pijler = w_coach * USS_coach_pijler
           + w_scout * USS_scout_pijler
           + w_verg  * USS_vergelijking_pijler
```

### 9.2 Gewichten per bron

De gewichten hangen af van twee factoren:
1. **Beschikbaarheid:** is de bron ingevuld?
2. **Betrouwbaarheid:** hoeveel data zit er achter?

**Basistabel (alle bronnen beschikbaar):**

| Bron | Basistabel | Toelichting |
|------|-----------|-------------|
| USS_coach | 0.35 | Trainer ziet speler dagelijks, maar beoordeelt relatief |
| USS_scout | 0.50 | Scout beoordeelt absoluut, diepere analyse |
| USS_vergelijking | 0.15 | Relatief oordeel, minder nauwkeurig |
| **Totaal** | **1.00** | |

**Aanpassing op basis van datahoeveelheid:**

| Aantal scouting-sessies | w_scout | w_coach | w_verg |
|------------------------|---------|---------|--------|
| 0 (geen scouting) | 0.00 | 0.85 | 0.15 |
| 1 (concept) | 0.30 | 0.55 | 0.15 |
| 2-3 (basis) | 0.45 | 0.40 | 0.15 |
| 4-6 (betrouwbaar) | 0.55 | 0.30 | 0.15 |
| 7+ (bevestigd) | 0.65 | 0.20 | 0.15 |

Als USS_vergelijking ontbreekt, wordt het gewicht herverdeeld over coach en scout in dezelfde verhouding.

### 9.3 Recentheidscorrectie

Scores ouder dan 6 maanden krijgen een vervaldiscount:

```
effectief_gewicht = basis_gewicht * vervalfactor(leeftijd_score)
```

| Leeftijd score | Vervalfactor |
|---------------|-------------|
| 0-3 maanden | 1.0 |
| 3-6 maanden | 0.9 |
| 6-12 maanden | 0.7 |
| 12+ maanden | 0.4 |

Hierdoor wegen recente beoordelingen zwaarder. Dit is belangrijk bij jeugdspelers die snel ontwikkelen.

### 9.4 Overall USS_speler

```
USS_speler = Σ(w_i × USS_pijler_i)
```

Met de pijlergewichten uit sectie 5.4 (per leeftijdsgroep).

---

## 10. De validatietoets

### 10.1 Het principe (ongewijzigd uit v1)

```
USS_team ≈ gemiddelde(USS_speler)   voor alle spelers in het team
```

### 10.2 Uitgebreide diagnostiek in v2

Naast de overall validatie kan v2 ook **per pijler** valideren:

```
USS_team_AANVALLEN ≈ gemiddelde(USS_speler_AANVALLEN)
USS_team_VERDEDIGEN ≈ gemiddelde(USS_speler_VERDEDIGEN)
...
```

Dit geeft de TC richer inzicht: "ons team is sterk in aanvallen (gemiddelde pijler-USS boven team-USS) maar zwak in verdedigen."

### 10.3 Afwijkingssignalen (uitgebreid)

| Afwijking | Type | Mogelijke oorzaak |
|-----------|------|-------------------|
| gem(speler) > USS_team + 15 | Overall | Spelers sterker dan resultaten → coaching? |
| gem(speler) < USS_team - 15 | Overall | Team presteert boven individueel niveau → chemie! |
| gem(pijler_X) >> gem(pijler_Y) + 20 | Per pijler | Team is eenzijdig → aandachtspunt TC |
| USS_coach_pijler >> USS_scout_pijler + 15 | Cross-validatie | Coach overschat op deze pijler |
| USS_coach_pijler << USS_scout_pijler - 15 | Cross-validatie | Coach onderschat op deze pijler |

---

## 11. Leeftijdsspecifieke kalibratie

### 11.1 De parameters per leeftijdsgroep

| Groep | Leeftijd | Pijlers | Schaal | Mediaan | Halve bereik | B_coach | B_scout | USS_basislijn (midden) |
|-------|----------|---------|--------|---------|-------------|---------|---------|----------------------|
| Blauw | 5-7 | 5 | 0-100% | 50% | 50 | 15 | 18 | S(6.0) = 17 |
| Groen | 8-9 | 5 | 0-100% | 50% | 50 | 18 | 22 | S(8.5) = 35 |
| Geel | 10-12 | 6 | 1-5 | 3.0 | 2.0 | 20 | 28 | S(11.0) = 67 |
| Oranje | 13-15 | 7 | 1-10 | 5.5 | 4.5 | 22 | 30 | S(14.0) = 113 |
| Rood | 16-18 | 9 | 1-10 | 5.5 | 4.5 | 25 | 32 | S(17.0) = 149 |

### 11.2 Wat betekent "gemiddelde score"?

De mediaan van de schaal representeert een **gemiddelde speler** op die leeftijd. Dit is een definitie-keuze:

- **Blauw (50%):** de helft van de items "Ja", de helft "Nog niet" → gemiddeld voor die leeftijd
- **Geel (3.0/5.0):** precies het midden van de sterrenschaal → gemiddeld
- **Oranje/Rood (5.5/10.0):** precies het midden van de slider → gemiddeld

Een score op de mediaan levert USS = USS_basislijn(leeftijd) op (bij scouting) of USS = USS_team (bij coach-evaluatie). Boven de mediaan levert een hogere USS, eronder een lagere.

### 11.3 Bandbreedte-motivatie

De bandbreedte bepaalt hoeveel USS-punten de spreiding binnen een leeftijdsgroep bestrijkt. De keuze is gebaseerd op:

1. **Empirische KNKV-data:** de range van teamratings binnen een leeftijdsgroep
2. **Verwachte spreiding:** hoe groot zijn de niveauverschillen binnen een team?

| Groep | KNKV-range (OW-teams) | Verwachte individuele spreiding |
|-------|----------------------|-------------------------------|
| Blauw | 12-55 (range 43) | Beperkt: iedereen leert |
| Groen | 50-90 (range 40) | Groeiend: verschil in aanleg zichtbaar |
| Geel | 60-120 (range 60) | Significant: niveauverschillen duidelijk |
| Oranje | 73-125 (range 52) | Groot: puberteit versterkt verschillen |
| Rood | 80-165 (range 85) | Maximaal: selectie-effect + A-categorie |

---

## 12. Voorbeeldberekeningen

### Voorbeeld 1: Geel-speler, TEAM-methode

**Situatie:** Lisa (11 jaar) speelt in team J8 (USS_team = 106). Trainer vult de 10 kern-items in.

**Kern-items en scores:**

| Pijler | Items | Scores | Pijlerscore |
|--------|-------|--------|-------------|
| AANVALLEN | aan_vrijlopen, aan_balbezit | 4, 5 | 4.5 |
| VERDEDIGEN | ver_dekken, ver_bal_veroveren | 3, 3 | 3.0 |
| TECHNIEK | tec_schieten, tec_passen | 4, 4 | 4.0 |
| TACTIEK | tac_schotkeuze | 4 | 4.0 |
| MENTAAL | men_inzet, men_plezier | 5, 5 | 5.0 |
| FYSIEK | fys_snelheid | 3 | 3.0 |

**Per pijler USS_coach berekenen (Geel: mediaan=3.0, halve_bereik=2.0, B=20):**

```
USS_coach_AANVALLEN   = 106 + ((4.5 - 3.0) / 2.0) * 20 = 106 + 15.0 = 121
USS_coach_VERDEDIGEN  = 106 + ((3.0 - 3.0) / 2.0) * 20 = 106 +  0.0 = 106
USS_coach_TECHNIEK    = 106 + ((4.0 - 3.0) / 2.0) * 20 = 106 + 10.0 = 116
USS_coach_TACTIEK     = 106 + ((4.0 - 3.0) / 2.0) * 20 = 106 + 10.0 = 116
USS_coach_MENTAAL     = 106 + ((5.0 - 3.0) / 2.0) * 20 = 106 + 20.0 = 126
USS_coach_FYSIEK      = 106 + ((3.0 - 3.0) / 2.0) * 20 = 106 +  0.0 = 106
```

**Overall USS_coach (Geel-gewichten: 18/18/18/18/14/14%):**

```
USS_coach = 0.18*121 + 0.18*106 + 0.18*116 + 0.18*116 + 0.14*126 + 0.14*106
          = 21.8 + 19.1 + 20.9 + 20.9 + 17.6 + 14.8
          = 115
```

**Interpretatie:** Lisa scoort USS 115 — boven haar team (106). Sterk in aanvallen en mentaal, gemiddeld in verdedigen en fysiek. Dit profiel past bij een spelmaker die hard werkt maar fysiek nog groeit.

---

### Voorbeeld 2: Rood-speler, INDIVIDUEEL + TEAM gecombineerd

**Situatie:** Thijs (17 jaar) speelt in team J1 (USS_team = 118). Zowel een scout als de trainer hebben hem beoordeeld.

**Trainer-evaluatie (TEAM-methode, kern-items):**

| Pijler | Kernscore | USS_coach_pijler |
|--------|-----------|-----------------|
| AANVALLEN | 7.0 | 118 + ((7.0-5.5)/4.5)*25 = 118 + 8.3 = **126** |
| VERDEDIGEN | 8.5 | 118 + ((8.5-5.5)/4.5)*25 = 118 + 16.7 = **135** |
| SCOREN | 6.0 | 118 + ((6.0-5.5)/4.5)*25 = 118 + 2.8 = **121** |
| TECHNIEK | 7.5 | 118 + ((7.5-5.5)/4.5)*25 = 118 + 11.1 = **129** |
| TACTIEK | 6.5 | 118 + ((6.5-5.5)/4.5)*25 = 118 + 5.6 = **124** |
| SPELINTELLIGENTIE | 8.0 | 118 + ((8.0-5.5)/4.5)*25 = 118 + 13.9 = **132** |
| MENTAAL | 9.0 | 118 + ((9.0-5.5)/4.5)*25 = 118 + 19.4 = **137** |
| SOCIAAL | 7.0 | 118 + ((7.0-5.5)/4.5)*25 = 118 + 8.3 = **126** |
| FYSIEK | 7.0 | 118 + ((7.0-5.5)/4.5)*25 = 118 + 8.3 = **126** |

**Overall USS_coach (Rood-gewichten):**

```
= 0.12*126 + 0.12*135 + 0.12*121 + 0.12*129 + 0.10*124
  + 0.10*132 + 0.10*137 + 0.10*126 + 0.12*126
= 15.1 + 16.2 + 14.5 + 15.5 + 12.4 + 13.2 + 13.7 + 12.6 + 15.1
= 128
```

**Scout-evaluatie (INDIVIDUEEL, basislijn(17.0) = 149):**

| Pijler | Pijlerscore | USS_scout_pijler |
|--------|------------|-----------------|
| AANVALLEN | 6.5 | 149 + ((6.5-5.5)/4.5)*32 = 149 + 7.1 = **156** |
| VERDEDIGEN | 8.0 | 149 + ((8.0-5.5)/4.5)*32 = 149 + 17.8 = **167** |
| SCOREN | 5.0 | 149 + ((5.0-5.5)/4.5)*32 = 149 + (-3.6) = **145** |
| TECHNIEK | 7.0 | 149 + ((7.0-5.5)/4.5)*32 = 149 + 10.7 = **160** |
| TACTIEK | 6.0 | 149 + ((6.0-5.5)/4.5)*32 = 149 + 3.6 = **153** |
| SPELINTELLIGENTIE | 7.5 | 149 + ((7.5-5.5)/4.5)*32 = 149 + 14.2 = **163** |
| MENTAAL | 8.5 | 149 + ((8.5-5.5)/4.5)*32 = 149 + 21.3 = **170** |
| SOCIAAL | 6.5 | 149 + ((6.5-5.5)/4.5)*32 = 149 + 7.1 = **156** |
| FYSIEK | 7.0 | 149 + ((7.0-5.5)/4.5)*32 = 149 + 10.7 = **160** |

**Overall USS_scout:**

```
= 0.12*156 + 0.12*167 + 0.12*145 + 0.12*160 + 0.10*153
  + 0.10*163 + 0.10*170 + 0.10*156 + 0.12*160
= 18.7 + 20.0 + 17.4 + 19.2 + 15.3 + 16.3 + 17.0 + 15.6 + 19.2
= 159
```

**Gecombineerd (2 scouting-sessies, w_scout=0.45, w_coach=0.40, w_verg=0.15 maar geen vergelijking):**

Geen vergelijkingsdata, dus gewichten herverdelen: w_scout = 0.45/(0.45+0.40) = 0.53, w_coach = 0.47.

```
USS_speler = 0.53 * 159 + 0.47 * 128 = 84.3 + 60.2 = 145
```

**Cross-validatie signaal:** De scout geeft structureel hogere USS dan de coach (159 vs. 128, verschil = 31). Dit is een significant verschil. Mogelijke verklaring: team J1 heeft een KNKV-rating van 118, wat door het selectie-effect (beste spelers naar A-categorie) lager is dan de basislijn voor 17-jarigen (149). De scout beoordeelt absoluut t.o.v. de basislijn; de coach beoordeelt relatief t.o.v. het team. Het verschil is hier niet zozeer een fout, maar een structureel effect van het selectie-effect.

**Interpretatie:** Thijs scoort USS 145 — geschikt voor A-categorie U19-2 (USS 142) of net onder U17-1 (USS 147). Sterk in verdedigen, mentaal en spelintelligentie. Scoren is relatief zwak — een verdediger/organisator, geen afmaker.

---

### Voorbeeld 3: Vergelijkende scouting bij Oranje

**Situatie:** TC wil weten wie beter past in de selectie: Eva, Nina of Sem. Alle drie spelen in Oranje-teams. Een scout positioneert ze op de balk per pijler.

**Bekende USS (uit eerdere evaluaties):**
- Eva: USS_AANVALLEN = 108
- Nina: geen eerdere USS
- Sem: USS_AANVALLEN = 120

**Balkposities pijler AANVALLEN:**

```
  0         25         50         75        100
  |---------|----------|----------|---------|
       Nina(22)    Eva(48)        Sem(81)
```

**Berekening:**

```
USS_per_punt = (USS_Sem - USS_Eva) / (pos_Sem - pos_Eva)
             = (120 - 108) / (81 - 48)
             = 12 / 33 = 0.364

USS_Nina_AANVALLEN = USS_Eva + (pos_Nina - pos_Eva) * USS_per_punt
                   = 108 + (22 - 48) * 0.364
                   = 108 + (-9.5)
                   = 99
```

**Interpretatie:** Nina scoort USS 99 op AANVALLEN — onder het Oranje-gemiddelde (basislijn 14.0 = 113). Dit bevestigt het beeld dat Nina in aanvallend opzicht achterblijft bij Eva en Sem.

---

### Voorbeeld 4: Blauw-speler, alleen trainer

**Situatie:** Max (6 jaar) speelt in J17 (USS_team = 47). Trainer vult de 10 kern-items in. Geen scouting beschikbaar.

**Kern-items:**

| Pijler | Items | Ja/Nog niet | Pijlerscore |
|--------|-------|-------------|-------------|
| BAL | bal_gooien, bal_vangen | Ja, Nog niet | 50% |
| BEWEGEN | bew_rennen, bew_richting, bew_energie | Ja, Ja, Ja | 100% |
| SPEL | spel_balbezit | Nog niet | 0% |
| SAMEN | sam_samenspelen, sam_luisteren | Ja, Ja | 100% |
| IK | ik_durft, ik_plezier | Ja, Ja | 100% |

**USS_coach per pijler (Blauw: mediaan=50%, halve_bereik=50, B=15):**

```
USS_coach_BAL     = 47 + ((50 - 50) / 50) * 15 = 47 +  0.0 = 47
USS_coach_BEWEGEN = 47 + ((100 - 50) / 50) * 15 = 47 + 15.0 = 62
USS_coach_SPEL    = 47 + ((0 - 50) / 50) * 15 = 47 - 15.0 = 32
USS_coach_SAMEN   = 47 + ((100 - 50) / 50) * 15 = 47 + 15.0 = 62
USS_coach_IK      = 47 + ((100 - 50) / 50) * 15 = 47 + 15.0 = 62
```

**Overall USS_coach (Blauw-gewichten: 25/25/25/12.5/12.5%):**

```
= 0.25*47 + 0.25*62 + 0.25*32 + 0.125*62 + 0.125*62
= 11.8 + 15.5 + 8.0 + 7.8 + 7.8
= 51
```

**Interpretatie:** Max scoort USS 51 — boven zijn team (47). Fysiek sterk (beweegt graag), sociaal goed, maar het spelbesef is er nog niet. Dat is normaal voor een 6-jarige — geen reden tot zorg.

---

## 13. Wat verandert t.o.v. USS v1 — samenvatting

| Aspect | USS v1 | USS v2 |
|--------|--------|--------|
| **Pijler-USS** | Nee (alleen overall) | Ja, per pijler |
| **Aantal bronnen** | 3 | 5 (coach, scout, vergelijking, team-context, basislijn) |
| **Coach-evaluatie input** | Niveau 1-5 (1 getal) | ~10 kern-items, score per pijler |
| **Coach-evaluatie output** | 1 USS_coach | USS_coach per pijler + overall |
| **Scouting input** | Overall score 0-99 | Per-pijler gemiddelde uit items |
| **Scouting output** | 1 USS_scout | USS_scout per pijler + overall |
| **Vergelijkende scouting** | Niet ondersteund | Verankeringsmodel met bekende USS als ankers |
| **Leeftijdsgroepen** | 6 groepen, vaste 6-pijler structuur | 5 groepen (Paurs uitgezonderd), variabele pijlers (5/6/7/9) |
| **Gewichten scout/coach** | Op basis van aantal rapporten | Op basis van aantal sessies + recentheid |
| **Recentheidscorrectie** | Nee | Ja, vervalfactor op scores ouder dan 3 maanden |
| **Cross-validatie** | Impliciet (brug-toets) | Expliciet per pijler: coach vs. scout signalen |
| **Bandbreedte** | Vast (20 USS-punten) | Variabel per leeftijdsgroep en per bron |
| **Basislijn** | Ongewijzigd | Ongewijzigd |
| **KNKV mapping** | Ongewijzigd | Ongewijzigd |

---

## 14. Open vragen

### 14.1 Kalibratie

| Vraag | Waarom relevant | Voorstel |
|-------|----------------|---------|
| Zijn de bandbreedtes (B_coach, B_scout) correct? | Bepalen de spreiding in USS. Te smal = alle spelers dicht bij het teamgemiddelde. Te breed = extremen die niet realistisch zijn. | Kalibreren op de eerste volledige evaluatieronde (veld najaar 2026-2027). Vergelijk de resulterende USS met KNKV-teamratings. |
| Klopt de mediaan per schaal? | Bij Geel is 3.0/5.0 het midden. Maar geven trainers gemiddeld 3.5? Dan is de mediaan te laag en scoren alle spelers te hoog. | Na de eerste evaluatieronde de werkelijke mediaan berekenen en de formule bijstellen. |
| Hoe verhoudt B_coach zich tot B_scout? | Als de verhouding niet klopt, domineren coach- of scoutscores onterecht. | De brug-toets (gem(speler) ≈ USS_team) toepassen met alleen coach-data, alleen scout-data, en gecombineerd. |

### 14.2 Vergelijkende scouting

| Vraag | Waarom relevant | Voorstel |
|-------|----------------|---------|
| Wat als alle spelers in de vergelijking nieuw zijn (geen bestaande USS)? | Verankeringsmodel vereist tenminste een anker. | Fallback naar team-USS als referentie (sectie 7.4). Op termijn Bradley-Terry. |
| Hoeveel vergelijkingen zijn nodig voor betrouwbaarheid? | Een enkele vergelijking is anekdotisch. | Minimaal 3 vergelijkingen met overlappende spelers voor een betrouwbare ordening. |

### 14.3 Pijlergewichten

| Vraag | Waarom relevant | Voorstel |
|-------|----------------|---------|
| Moeten korfbalacties zwaarder wegen dan persoonlijke pijlers? | De huidige gewichten (v3.0 Bijlage A) geven korfbalacties meer gewicht. Is dat correct? | Empirisch toetsen: levert gelijke weging een betere correlatie op met KNKV-teamratings? |
| Moeten gewichten situatie-afhankelijk zijn? | Voor een doorstroom-naar-A-cat-beslissing weegt SCOREN misschien zwaarder dan voor een recreatief team. | Twee gewichtsets: "standaard" (voor overall USS) en "selectie" (voor doorstroombeslissingen). Buiten scope voor v2.0, mogelijk in v2.1. |

### 14.4 Structureel

| Vraag | Waarom relevant | Voorstel |
|-------|----------------|---------|
| Hoe ga je om met de meetbreuk bij Geel? | Een speler die van Groen (5 pijlers, %) naar Geel (6 pijlers, 1-5) gaat heeft geen vergelijkbare historie. | USS-scores zijn vergelijkbaar ongeacht de pijlerstructuur — dat is het hele punt van de USS. Maar de pijler-USS scores voor specifieke pijlers (bijv. BAL → AANVALLEN) zijn niet 1-op-1 vergelijkbaar. Accepteren als inherent aan het model. |
| Hoe integreer je zelfevaluatie? | De evaluatie-app ondersteunt zelfevaluatie. Dit is een 6e databron. | Buiten scope voor v2.0. Zelfevaluatie als informatief (wordt niet meegenomen in USS-berekening), met cross-validatie t.o.v. coach en scout als ontwikkelgespreksinstrument. |
| Moet de KNKV-basislijn worden aangepast voor vrouwen vs. mannen? | Bij senioren zijn er niveauverschillen. Bij jeugd is het onduidelijk. | Voorlopig een uniforme basislijn. Bij voldoende data (meerdere seizoenen) splitsen. |
| Hoe vaak herberekenen? | Elke keer als er nieuwe data binnenkomt? Of periodiek? | Na elke scouting-sessie of evaluatieronde herberekenen. Na elke KNKV-update alle team-ankers bijwerken. |

---

## 15. Implementatieroute

### Fase 1: MVP (seizoen 2026-2027, veld najaar)

- [ ] USS per pijler voor TEAM-methode (coach-evaluatie)
- [ ] Offset-formule per leeftijdsgroep geimplementeerd
- [ ] Overall USS_coach uit gewogen pijler-USS
- [ ] Brug-toets: vergelijk gem(USS_speler) met USS_team
- [ ] Basis cross-validatie (signaal bij |delta| > 15)

### Fase 2: Scouting-integratie (seizoen 2026-2027, zaal)

- [ ] USS per pijler voor INDIVIDUEEL-methode (scouting)
- [ ] Combinatieformule coach + scout
- [ ] Recentheidscorrectie
- [ ] Per-pijler validatie-dashboard

### Fase 3: Vergelijking + geavanceerd (seizoen 2026-2027, veld voorjaar)

- [ ] Verankeringsmodel voor vergelijkende scouting
- [ ] Automatische cross-validatiematrix per team
- [ ] Kalibratie op basis van seizoensdata

### Fase 4: Bradley-Terry + optimalisatie (seizoen 2027-2028)

- [ ] Bradley-Terry model voor vergelijkingsdata
- [ ] Automatische bandbreedte-kalibratie
- [ ] Gewicht-optimalisatie op basis van meerdere seizoenen data

---

## 16. Wiskundige samenvatting

### Notatie

| Symbool | Betekenis |
|---------|-----------|
| S(l) | Basislijn-USS op leeftijd l |
| USS_team | USS van het team (KNKV-rating of A-categorie) |
| p_i | Ruwe pijlerscore voor pijler i |
| m | Mediaan van de schaal |
| h | Halve bereik van de schaal |
| B | Bandbreedte (max USS-offset) |
| w_i | Gewicht van pijler i |

### Formules

**Basislijn:**
```
S(l) = 180 / (1 + e^(-0.35 * (l - 12.5)))
```

**Coach-evaluatie per pijler:**
```
USS_coach_i = USS_team + ((p_i - m) / h) * B_coach
```

**Scouting per pijler:**
```
USS_scout_i = S(leeftijd) + ((p_i - m) / h) * B_scout
```

**Vergelijking per pijler (met ankers):**
```
USS_verg_i = USS_anker + (pos_speler - pos_anker) * (USS_anker2 - USS_anker1) / (pos_anker2 - pos_anker1)
```

**Vergelijking per pijler (zonder ankers, fallback):**
```
USS_verg_i = USS_team + ((balkpositie - 50) / 50) * B_coach
```

**Gecombineerd per pijler:**
```
USS_pijler_i = w_c * USS_coach_i + w_s * USS_scout_i + w_v * USS_verg_i
```

**Overall:**
```
USS_speler = Σ(w_i * USS_pijler_i)
```

**Validatie:**
```
|USS_team - gemiddelde(USS_speler)| < 15  →  model is consistent
```

---

## Bijlage: Parametertabel (alle constanten op een rij)

### Basislijn

| Parameter | Waarde |
|-----------|--------|
| S_max | 180 |
| k | 0.35 |
| l₀ | 12.5 |

### Bandbreedte per groep

| Groep | B_coach | B_scout |
|-------|---------|---------|
| Blauw | 15 | 18 |
| Groen | 18 | 22 |
| Geel | 20 | 28 |
| Oranje | 22 | 30 |
| Rood | 25 | 32 |

### Schaalparameters per groep

| Groep | Mediaan (m) | Halve bereik (h) |
|-------|------------|-----------------|
| Blauw | 50 (%) | 50 |
| Groen | 50 (%) | 50 |
| Geel | 3.0 | 2.0 |
| Oranje | 5.5 | 4.5 |
| Rood | 5.5 | 4.5 |

### Pijlergewichten per groep

**Blauw/Groen:** BAL 25%, BEWEGEN 25%, SPEL 25%, SAMEN 12.5%, IK 12.5%

**Geel:** AANV 18%, VERD 18%, TEC 18%, TAC 18%, MEN 14%, FYS 14%

**Oranje:** AANV 16%, VERD 16%, TEC 16%, TAC 16%, MEN 12%, SOC 12%, FYS 12%

**Rood:** AANV 12%, VERD 12%, SCO 12%, TEC 12%, TAC 10%, SPI 10%, MEN 10%, SOC 10%, FYS 12%

### Brongewichten

| Sessies | w_coach | w_scout | w_verg |
|---------|---------|---------|--------|
| 0 | 0.85 | 0.00 | 0.15 |
| 1 | 0.55 | 0.30 | 0.15 |
| 2-3 | 0.40 | 0.45 | 0.15 |
| 4-6 | 0.30 | 0.55 | 0.15 |
| 7+ | 0.20 | 0.65 | 0.15 |

### Vervalfactoren

| Leeftijd score | Factor |
|---------------|--------|
| 0-3 maanden | 1.0 |
| 3-6 maanden | 0.9 |
| 6-12 maanden | 0.7 |
| 12+ maanden | 0.4 |

### A-categorie USS (ongewijzigd)

| Combinatie | USS |
|------------|-----|
| U19-HK | 175 |
| U19-OK | 170 |
| U17-HK | 160 |
| U19-1 | 155 |
| U17-1 | 147 |
| U15-HK | 143 |
| U19-2 | 142 |
| U17-2 | 135 |
| U15-1 | 128 |
