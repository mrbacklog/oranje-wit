---
name: jeugdmodel
description: Referentiedata statistisch jeugdmodel. Bevat de geboortejaar-categorie mapping voor 10 seizoenen, streefaantallen en signalering. Gebruik bij elke analyse van ledenaantallen, teamindeling of wervingsvraagstuk.
user-invocable: true
allowed-tools: Read, Write, Glob
argument-hint: "[optioneel: seizoen, bijv. 2026-2027]"
---

# Statistisch Jeugdmodel — Referentiedata

Snelle referentie voor het jeugdmodel van c.k.v. Oranje Wit.
Volledig model: `model/jeugdmodel.yaml`
Beleidsnotitie: `docs/technisch-beleid-jeugdmodel.md`
Visualisatie-spec: `model/visualisatie-spec.yaml`

---

## Talent-ratio

| Scenario | Ratio | Betekenis |
|----------|-------|-----------|
| Conservatief | 20% (1 op 5) | Zonder gerichte investering |
| Middenwaarde | 22,5% (1 op 4,4) | Standaard modelwaarde |
| Optimistisch | 25% (1 op 4) | Bovengrens zonder extra investering |
| Goede begeleiding | 30% (1 op 3,3) | Doelwaarde bij sterk kader |

## Streefaantallen per selectie (2 teams: prestatie + ontwikkeling)

Elke selectie: 10 dames + 10 heren = 20 spelers

| Ratio | Per gender per categorie | Per geboortejaar per gender | Totaal per categorie |
|-------|------------------------|-----------------------------|---------------------|
| 20% | 50 | 25 | 100 |
| 22,5% | 44 | 22 | 88 |
| 30% | 34 | 17 | 68 |

## Signalering (stoplicht)

| Status | Vulgraad | Actie |
|--------|----------|-------|
| Op koers | > 80% | Geen urgente actie |
| Aandacht | 60–80% | Monitoring verhogen, gericht werven |
| Kritiek | < 60% | Actief werven, externe talenten benaderen |

---

## Retentie per leeftijdsjaar

Seizoen-op-seizoen retentie (% dat volgend seizoen terugkeert). Bron: `model/jeugdmodel.yaml` v2.0.
Gebaseerd op 629 spelers met geboortedatum, 16 seizoenen (2010-2026). Blend van betrouwbare data (2021-2026, Sportlink ID) en alle seizoenen (2010-2026, name-matching).

| Leeftijd | Retentie | M | V | Toelichting |
|----------|----------|------|------|-------------|
| 5 | 85% | — | — | Lage steekproef, conservatief |
| 6 | 82% | 75% | 87% | Blauw-instap: veel kinderen proberen en stoppen |
| 7 | 84% | 78% | 88% | Nog fragiel, iets beter dan 6 |
| 8 | 95% | 95% | 96% | Groen: sterke binding, piek-instroom |
| 9 | 93% | 93% | 94% | Stabiel, lichte daling t.o.v. 8 |
| 10 | 93% | 97% | 91% | Geel-start, M hoger dan V |
| 11 | 92% | 92% | 92% | Lichte daling |
| 12 | 90% | 92% | 90% | Transitiejaar: B→A overgang |
| 13 | 94% | 94% | 94% | Verrassend hoog! Committed spelers |
| 14 | 95% | 97% | 93% | Hoogste retentie |
| 15 | 92% | 90% | 93% | Begin geleidelijke daling |
| 16 | 87% | 89% | 85% | Duidelijke daling, school/werk-druk |
| 17 | 82% | 79% | 85% | Senior-cliff, zwaarste uitval |
| 18 | 84% | 90% | 80% | Iets herstel t.o.v. 17 |

**Samenvatting:** Beste retentie 13-14 (94-95%), slechtste 6-7 (82-84%) en 17 (82%). M hoger bij 10-14 en 16+, V hoger bij 6-9 en 15.

---

## Instroomverdeling

Verdeling van nieuwe jeugdleden per leeftijd (% van alle jeugd-instroom). ~24 nieuwe leden/seizoen (excl. COVID-boom).

| Leeftijd | % instroom | Toelichting |
|----------|-----------|-------------|
| 5 | 1.7% | |
| 6 | 6.5% | Blauw |
| 7 | 11.0% | Blauw |
| 8 | **16.7%** | **Groen — PIEK** |
| 9 | **16.9%** | **Groen — PIEK** |
| 10 | 12.7% | Geel |
| 11 | 8.4% | Geel |
| 12 | 7.6% | Geel |
| 13 | 4.6% | Oranje |
| 14 | 3.4% | Oranje |
| 15 | 5.5% | Mini-bump (laterale transfers?) |
| 16 | 1.9% | Rood |
| 17 | 1.9% | Rood |
| 18 | 1.3% | Rood |

**Kernfeiten:** Piek bij 8-9 jaar (Groen, 34% van alle instroom), NIET bij 6 (Blauw, slechts 18%). M/V-ratio bij instroom: 40/60.

---

## Externe benchmarks (ter validatie)

| Bron | Retentie/dropout | OW-vergelijking |
|------|-----------------|-----------------|
| Sport Vlaanderen 10-19 | M 86%, V 82% | OW doet het BETER (92-95% bij 10-15) |
| Sport Vlaanderen 19+ | M 79%, V 70% | OW 17-18 (82-84%) komt overeen |
| KNHB 2024 (n=6000) | Top reden stoppen 12-18: "vanwege mijn team" (36%) | Bevestigt belang teamsamenstelling |

---

## Geboortejaar-categorie mapping — 10 seizoenen

Peildatum: 31 december van het seizoen.
Formule: 2e jaars = peildatumjaar − leeftijdsgrens, 1e jaars = peildatumjaar − (leeftijdsgrens − 1).
Geen minimumleeftijd in A-categorie — jongere talenten mogen altijd omhoog.

### Seizoen 2025-2026 (peildatum 31-12-2025)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2007 (18 jr) | geb. 2008 (17 jr) |
| U17 | geb. 2009 (16 jr) | geb. 2010 (15 jr) |
| U15 | geb. 2011 (14 jr) | geb. 2012 (13 jr) |

### Seizoen 2026-2027 (peildatum 31-12-2026)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2008 (18 jr) | geb. 2009 (17 jr) |
| U17 | geb. 2010 (16 jr) | geb. 2011 (15 jr) |
| U15 | geb. 2012 (14 jr) | geb. 2013 (13 jr) |

### Seizoen 2027-2028 (peildatum 31-12-2027)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2009 (18 jr) | geb. 2010 (17 jr) |
| U17 | geb. 2011 (16 jr) | geb. 2012 (15 jr) |
| U15 | geb. 2013 (14 jr) | geb. 2014 (13 jr) |

### Seizoen 2028-2029 (peildatum 31-12-2028)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2010 (18 jr) | geb. 2011 (17 jr) |
| U17 | geb. 2012 (16 jr) | geb. 2013 (15 jr) |
| U15 | geb. 2014 (14 jr) | geb. 2015 (13 jr) |

### Seizoen 2029-2030 (peildatum 31-12-2029)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2011 (18 jr) | geb. 2012 (17 jr) |
| U17 | geb. 2013 (16 jr) | geb. 2014 (15 jr) |
| U15 | geb. 2015 (14 jr) | geb. 2016 (13 jr) |

### Seizoen 2030-2031 (peildatum 31-12-2030)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2012 (18 jr) | geb. 2013 (17 jr) |
| U17 | geb. 2014 (16 jr) | geb. 2015 (15 jr) |
| U15 | geb. 2016 (14 jr) | geb. 2017 (13 jr) |

### Seizoen 2031-2032 (peildatum 31-12-2031)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2013 (18 jr) | geb. 2014 (17 jr) |
| U17 | geb. 2015 (16 jr) | geb. 2016 (15 jr) |
| U15 | geb. 2017 (14 jr) | geb. 2018 (13 jr) |

### Seizoen 2032-2033 (peildatum 31-12-2032)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2014 (18 jr) | geb. 2015 (17 jr) |
| U17 | geb. 2016 (16 jr) | geb. 2017 (15 jr) |
| U15 | geb. 2018 (14 jr) | geb. 2019 (13 jr) |

### Seizoen 2033-2034 (peildatum 31-12-2033)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2015 (18 jr) | geb. 2016 (17 jr) |
| U17 | geb. 2017 (16 jr) | geb. 2018 (15 jr) |
| U15 | geb. 2019 (14 jr) | geb. 2020 (13 jr) |

### Seizoen 2034-2035 (peildatum 31-12-2034)

| Categorie | 2e jaars (oudste) | 1e jaars (jongste) |
|-----------|-------------------|-------------------|
| U19 | geb. 2016 (18 jr) | geb. 2017 (17 jr) |
| U17 | geb. 2018 (16 jr) | geb. 2019 (15 jr) |
| U15 | geb. 2020 (14 jr) | geb. 2021 (13 jr) |

---

## Cohort-pad (volg een geboortejaar door het systeem)

Voorbeeld: geboortejaar **2013**

| Seizoen | Categorie | Rol |
|---------|-----------|-----|
| 2025-2026 | B-categorie | Pre-competitief (12 jr) |
| 2026-2027 | **U15** | **1e jaars** (13 jr) |
| 2027-2028 | **U15** | **2e jaars** (14 jr) |
| 2028-2029 | **U17** | **1e jaars** (15 jr) |
| 2029-2030 | **U17** | **2e jaars** (16 jr) |
| 2030-2031 | **U19** | **1e jaars** (17 jr) |
| 2031-2032 | **U19** | **2e jaars** (18 jr) |
| 2032-2033 | Senioren | Doorstroom |

---

## Gebruik

Bij het analyseren van een ledenlijst of het maken van een teamindeling:

1. Bepaal het seizoen
2. Zoek de geboortejaren per categorie op in bovenstaande tabellen
3. Tel het aantal leden per geboortejaar per geslacht
4. Vergelijk met de streefaantallen
5. Pas het stoplichtmodel toe
6. Kijk ook 2-6 jaar vooruit via de pipeline-tabellen
7. Gebruik retentie per leeftijdsjaar voor prognoses en wervingsprioriteiten
8. Raadpleeg `data/aggregaties/analyse-per-leeftijd.json` voor historische patronen per leeftijd
