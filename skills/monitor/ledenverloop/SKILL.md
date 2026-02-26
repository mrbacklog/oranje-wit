---
name: ledenverloop
description: Analyseer retentie, instroom, uitstroom en KNKV-benchmark over alle seizoenen
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, WebFetch
argument-hint: "[optioneel: seizoen zoals 2025-2026, of 'benchmark' voor alleen KNKV-vergelijking]"
---

# Ledenverloop — Retentie, Instroom & Uitstroom

Analyseer het ledenverloop van c.k.v. Oranje Wit over meerdere seizoenen: wie blijft, wie komt erbij, wie valt af, en hoe staan we ervoor ten opzichte van vergelijkbare verenigingen?

## Context

Deze skill analyseert het ledenverloop **longitudinaal** — over meerdere seizoenen heen. Daarmee vult hij twee andere skills aan:

- **lid-monitor** verwerkt een nieuwe ledensnapshot en vergelijkt met de vorige momentopname (korte termijn, snapshot-niveau)
- **jeugdmodel** levert de streefcijfers en retentie-parameters waar ledenverloop tegen toetst

Ledenverloop pakt het op **nadat** lid-monitor de snapshots heeft verwerkt: hij classificeert elk lid over opeenvolgende snapshots, berekent retentie-KPI's per geboortejaar-cohort, en vergelijkt met KNKV-ledencijfers van concurrerende verenigingen.

## Kernbegrippen

### Classificatie per lid

| Status | Definitie |
|---|---|
| **Behouden** | Aanwezig in beide snapshots met `spelactiviteit: korfbal` |
| **Nieuw (instroom)** | Aanwezig in nieuw snapshot, niet in vorig. Eerste keer in data |
| **Herinschrijver** | Aanwezig in nieuw snapshot, niet in vorig, wel in een eerder snapshot |
| **Uitgestroomd (drop-out)** | Aanwezig in vorig snapshot, niet in nieuw |
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
| **Retentiepercentage** | behouden / totaal vorig snapshot x 100% |
| **Instroompercentage** | (nieuw + herinschrijver) / totaal nieuw snapshot x 100% |
| **Uitstroompercentage** | uitgestroomd / totaal vorig snapshot x 100% |
| **Netto groei** | instroom - uitstroom (absoluut en %) |
| **Drop-out risico** | Cohorten met retentie < streefmodel drempel |
| **Instroomleeftijd** | Gemiddelde en mediaan leeftijd van nieuwe leden |
| **Instroomleeftijd-trend** | Verschuiving instroomleeftijd over seizoenen |

**Uitsplitsingen:**
- Primair: per geboortejaar-cohort + geslacht
- Per overgangsmoment (zie kritische overgangen)
- Secundair: per team

## Databronnen

- `data/leden/snapshots/*.json` — verrijkte ledensnapshots (verwerkt door lid-monitor)
- `data/modellen/streef-ledenboog.json` — retentie-parameters en streefcijfers
- `data/ledenverloop/benchmark/knkv-kwartaal/*.json` — KNKV kwartaalcijfers (als beschikbaar)
- `data/ledenverloop/benchmark/config.json` — concurrenten-configuratie

## Stappen

1. **Laad alle beschikbare snapshots**
   - Scan `data/leden/snapshots/*.json` (exclusief `-diff`, `-analyse` bestanden)
   - Sorteer op datum, bepaal welke paren te vergelijken
   - Als `$ARGUMENTS` een seizoen bevat: filter op dat seizoen
   - Als `$ARGUMENTS` "benchmark" is: spring naar stap 6

2. **Classificeer elk lid per snapshot-paar**
   - Vergelijk opeenvolgende snapshots op `rel_code`-niveau
   - Ken status toe: behouden, nieuw, herinschrijver, uitgestroomd, niet-spelend geworden
   - Bij herinschrijver: noteer het laatste eerdere snapshot waarin het lid voorkwam

3. **Aggregeer per geboortejaar-cohort + geslacht**
   - Tel per cohort: behouden, nieuw, herinschrijver, uitgestroomd, niet-spelend
   - Splits M/V apart
   - Bereken ook per instroomfase en per overgangsmoment

4. **Bereken KPI's per cohort en totaal**
   - Retentiepercentage, instroompercentage, uitstroompercentage
   - Netto groei (absoluut en percentage)
   - Instroomleeftijd (gemiddeld en mediaan)
   - Als meerdere seizoenen beschikbaar: instroomleeftijd-trend

5. **Toets aan drempelwaarden en genereer alerts**
   - Vergelijk retentie per leeftijdsgroep met signaleringsgrenzen (zie Signalering)
   - Vergelijk met streefmodel uit `data/modellen/streef-ledenboog.json`
   - Genereer signalen: retentie, instroom, genderdisbalans, trendbreuk

6. **KNKV-benchmark (als data beschikbaar)**
   - Laad kwartaalcijfers uit `data/ledenverloop/benchmark/knkv-kwartaal/*.json`
   - Laad concurrenten-configuratie uit `data/ledenverloop/benchmark/config.json`
   - Vergelijk eigen retentie/instroom/uitstroom met concurrenten en landelijk gemiddelde
   - Bereken relatieve positie per categorie

7. **Schrijf JSON-output**
   - `data/ledenverloop/individueel/YYYY-YYYY-verloop.json` — status per lid per seizoen
   - `data/ledenverloop/cohorten/totaal-cohorten.json` — KPI's per cohort over alle seizoenen
   - `data/ledenverloop/signalering/YYYY-YYYY-alerts.json` — overschrijdingen en signalen

8. **Genereer/update HTML dashboard**
   - Schrijf of update `app/ledenverloop.html`
   - Standalone pagina (geen server nodig), zelfde stijl als `app/teamsamenstelling.html`
   - Visualisaties: retentiecurve per cohort, instroom/uitstroom-balans, benchmark-vergelijking

9. **Presenteer samenvatting**
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

```
data/ledenverloop/
├── individueel/
│   └── YYYY-YYYY-classificatie.json    # Status per lid per seizoen
├── cohorten/
│   └── YYYY-YYYY-cohorten.json         # KPI's per geboortejaar-cohort
├── signalering/
│   └── YYYY-YYYY-alerts.json           # Overschrijdingen en signalen
└── benchmark/
    ├── config.json                      # Concurrenten-configuratie
    └── knkv-kwartaal/
        ├── raw/                         # Ruwe KNKV PDF's
        ├── YYYY-QN.json                 # Geparsed per kwartaal
        └── SCHEMA.md                    # JSON-schema documentatie
```

Bondige samenvatting met signaleringen, benchmark-positie en aanbevelingen voor technisch beleid.
