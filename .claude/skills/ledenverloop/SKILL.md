---
name: ledenverloop
description: Analyseer retentie, instroom, uitstroom en KNKV-benchmark over alle seizoenen
context: fork
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, WebFetch
argument-hint: "[optioneel: seizoen zoals 2025-2026, of 'benchmark' voor alleen KNKV-vergelijking]"
---

# Ledenverloop — Retentie, Instroom & Uitstroom

Analyseer het ledenverloop van c.k.v. Oranje Wit over meerdere seizoenen: wie blijft, wie komt erbij, wie valt af, en hoe staan we ervoor ten opzichte van vergelijkbare verenigingen?

## Context

Deze skill analyseert het ledenverloop **longitudinaal** — over meerdere seizoenen heen. Daarmee vult hij twee andere skills aan:

- **lid-monitor** verwerkt nieuwe Sportlink-data en updatet de leden-tabel (korte termijn)
- **jeugdmodel** levert de streefcijfers en retentie-parameters waar ledenverloop tegen toetst

Ledenverloop pakt het op **nadat** lid-monitor de ledendata heeft bijgewerkt: hij classificeert elk lid over opeenvolgende seizoenen via speler_seizoenen, berekent retentie-KPI's per geboortejaar-cohort, en vergelijkt met KNKV-ledencijfers van concurrerende verenigingen.

## Kernbegrippen

### Classificatie per lid

| Status | Definitie |
|---|---|
| **Behouden** | Aanwezig in beide seizoenen met `spelactiviteit: korfbal` |
| **Nieuw (instroom)** | Aanwezig in huidig seizoen, niet in vorig. Eerste keer in data |
| **Herinschrijver** | Aanwezig in huidig seizoen, niet in vorig, wel in een eerder seizoen |
| **Uitgestroomd (drop-out)** | Aanwezig in vorig seizoen, niet in huidig |
| **Niet-spelend geworden** | Nog lid maar spelactiviteit gewijzigd van korfbal naar anders |

### Primaire analyse-as: geboortejaar-cohort

De primaire analyse-as is **geboortejaar-cohort**, niet leeftijdsband. Reden: leeftijdsbanden (Blauw, Groen, Geel, etc.) verschuiven per seizoen — een kind van geboortejaar 2016 zit het ene seizoen in Groen, het volgende in Geel. Geboortejaar is stabiel en maakt longitudinale vergelijking betrouwbaar.

Leeftijdsbanden worden wel als secundaire groepering gebruikt voor presentatie en signalering.

### Instroomfasen

| Fase | Leeftijd | Toelichting |
|---|---|---|
| **Kerninstroom** | 6-9 jaar | Primaire wervingsdoelgroep, start in Blauw/Groen |
| **Naloop** | 10-12 jaar | Late instroom, vaak via vriendjes of schoolkorfbal |
| **Overstappers** | 13-18 jaar | Instroom vanuit andere sport of andere vereniging |

### Kritische overgangsmomenten

| Overgang | Leeftijd | Risico |
|---|---|---|
| **5 naar 6** | Start | Eerste contact met de sport — instroom of niet |
| **12 naar 13** | Breedte naar wedstrijd | Overgang van B- naar A-categorie (of omgekeerd) |
| **14 naar 15** | U15 naar U17 | Stijging in fysieke eisen en competitieniveau |
| **18 naar 19** | Jeugd naar senioren | Grootste uitstroommoment in de korfbalsport |
| **21 naar 23** | Jong-senior | Studie, werk, verhuizing — tweede uitstroomgolf |

## KPI's

| KPI | Formule |
|---|---|
| **Retentiepercentage** | behouden / totaal vorig seizoen x 100% |
| **Instroompercentage** | (nieuw + herinschrijver) / totaal huidig seizoen x 100% |
| **Uitstroompercentage** | uitgestroomd / totaal vorig seizoen x 100% |
| **Netto groei** | instroom - uitstroom (absoluut en %) |
| **Drop-out risico** | Cohorten met retentie < streefmodel drempel |
| **Instroomleeftijd** | Gemiddelde en mediaan leeftijd van nieuwe leden |
| **Instroomleeftijd-trend** | Verschuiving instroomleeftijd over seizoenen |

**Uitsplitsingen:**
- Primair: per geboortejaar-cohort + geslacht
- Per overgangsmoment (zie kritische overgangen)
- Secundair: per team

## Databronnen

- PostgreSQL `ledenverloop` — al berekend door `scripts/js/bereken-verloop.js`
- PostgreSQL `cohort_seizoenen` — al berekend door `scripts/js/bereken-cohorten.js`
- PostgreSQL `signalering` — al berekend door `scripts/js/genereer-signalering.js`
- `data/modellen/streef-ledenboog.json` — retentie-parameters en streefcijfers
- `data/ledenverloop/benchmark/knkv-kwartaal/*.json` — KNKV kwartaalcijfers (als beschikbaar)
- `data/ledenverloop/benchmark/config.json` — concurrenten-configuratie

## Pipeline (eenmalig per dataimport)

De verloopdata zit al in PostgreSQL. Na een nieuwe data-import (Sportlink CSV) opnieuw berekenen:

```bash
node -r dotenv/config scripts/js/bereken-verloop.js
node -r dotenv/config scripts/js/bereken-cohorten.js
node -r dotenv/config scripts/js/genereer-signalering.js
```

De Verenigingsmonitor (`pnpm dev:monitor`) toont vervolgens altijd live data uit PostgreSQL.

## Stappen

1. **Query verloopdata uit PostgreSQL**
   - Haal `ledenverloop` op (status per lid per seizoen)
   - Haal `cohort_seizoenen` op (KPI's per geboortejaar-cohort)
   - Als `$ARGUMENTS` een seizoen bevat: filter op dat seizoen
   - Als `$ARGUMENTS` "benchmark" is: spring naar stap 5

2. **Analyseer KPI's per cohort en totaal**
   - Retentiepercentage, instroompercentage, uitstroompercentage
   - Netto groei (absoluut en percentage)
   - Instroomleeftijd (gemiddeld en mediaan)
   - Trend over meerdere seizoenen

3. **Toets aan drempelwaarden**
   - Vergelijk retentie per leeftijdsgroep met signaleringsgrenzen (zie Signalering)
   - Vergelijk met streefmodel uit `data/modellen/streef-ledenboog.json`
   - Controleer `signalering` tabel voor actieve alerts

4. **KNKV-benchmark (als data beschikbaar)**
   - Laad kwartaalcijfers uit `data/ledenverloop/benchmark/knkv-kwartaal/*.json`
   - Laad concurrenten-configuratie uit `data/ledenverloop/benchmark/config.json`
   - Vergelijk eigen retentie/instroom/uitstroom met concurrenten en landelijk gemiddelde
   - Bereken relatieve positie per categorie

5. **Presenteer samenvatting**
   - Toon bondige samenvatting met belangrijkste KPI's
   - Highlight signaleringen (kritiek/aandacht)
   - Benchmark-positie als data beschikbaar
   - Concrete aanbevelingen voor technisch beleid

## Signalering

### Drempelwaarden retentie

| Leeftijdsgroep | Streef retentie | Aandacht (<) | Kritiek (<) |
|---|---|---|---|
| 6-12 jaar | 95% | 85% | 70% |
| 13-14 jaar | 90% | 80% | 65% |
| 15-16 jaar | 88% | 78% | 63% |
| 17-18 jaar | 90% | 80% | 65% |
| 19-23 jaar | 75% | 65% | 50% |
| 24+ senioren | 80% | 70% | 55% |

### Signaaltypen

| Type | Trigger |
|---|---|
| **retentie** | Retentie onder aandacht- of kritiekgrens |
| **instroom** | Instroom onder verwachting (< vorig seizoen of < streefmodel) |
| **genderdisbalans** | M/V-verhouding wijkt > 15 procentpunt af van streef (40/60) |
| **benchmark** | Eigen retentie > 5 procentpunt onder regionaal gemiddelde |
| **trendbreuk** | KPI wijkt > 10 procentpunt af van 3-seizoens voortschrijdend gemiddelde |

## Benchmark

### Concurrenten

| Categorie | Verenigingen |
|---|---|
| **Lokaal** | DeetosSnel, Sporting Delta, Movado |
| **Regionaal** | PKC, Albatros, Merwede, Kinderdijk |

### KNKV-bron

- URL: https://www.knkv.nl/kennisbank/ledencijfers/
- Data: PDF-publicaties met kwartaalcijfers per vereniging
- **Aanpak**: probeer PDF te parsen via WebFetch. Valt dat tegen, dan handmatige invoer in `data/ledenverloop/benchmark/knkv-kwartaal/YYYY-QN.json` volgens het schema in `SCHEMA.md`

## Output

Data staat in PostgreSQL — de Verenigingsmonitor toont dit live:
- **Retentie-tab**: cohort-curves, waterfall, intra-seizoen flow
- **Instroom/uitstroom-tab**: per seizoen, per leeftijd, M/V
- **Cohorten-tab**: matrix + eerste-seizoen retentie

Benchmark-data (optioneel):
```
data/ledenverloop/benchmark/
├── config.json                   # Concurrenten-configuratie
└── knkv-kwartaal/
    ├── raw/                      # Ruwe KNKV PDF's
    ├── YYYY-QN.json              # Geparsed per kwartaal
    └── SCHEMA.md                 # JSON-schema documentatie
```

Bondige samenvatting met signaleringen, benchmark-positie en aanbevelingen voor technisch beleid.
