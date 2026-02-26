# Design: Skill `ledenverloop`

**Datum:** 2026-02-24
**Skill:** `/oranje-wit:ledenverloop`
**Agent:** `data-analist`
**Status:** Ontwerp goedgekeurd

---

## Doel

Compleet beeld van ledenverloop bij c.k.v. Oranje Wit: retentie, instroom, uitstroom en benchmarking tegen KNKV-landelijk en regionale concurrenten. Voor alle leeftijden, met nadruk op jeugd. Zowel periodiek rapport als proactieve signalering.

## Relatie tot bestaande skills

- `lid-monitor` — verwerkt nieuwe snapshots (CSV → verrijkt JSON). Blijft ongewijzigd.
- `ledenverloop` — analyseert de verwerkte snapshots longitudinaal. Draait ná lid-monitor.
- `jeugdmodel` — levert streefcijfers en retentie-drempelwaarden die ledenverloop als benchmark gebruikt.

## Kernbegrippen

### Classificatie per lid (op basis van `rel_code`-vergelijking)

| Status | Definitie |
|---|---|
| **Behouden** | Aanwezig in beide snapshots met `spelactiviteit: korfbal` |
| **Nieuw (instroom)** | Aanwezig in nieuw snapshot, niet in vorig. Eerste keer in data |
| **Herinschrijver** | Aanwezig in nieuw snapshot, niet in vorig, wél in een eerder snapshot |
| **Uitgestroomd (drop-out)** | Aanwezig in vorig snapshot, niet in nieuw |
| **Niet-spelend geworden** | Nog lid maar spelactiviteit gewijzigd van korfbal naar anders |

### Primaire analyse-as: geboortejaar-cohort

Leeftijdsbanden (Blauw, Groen, etc.) en U-categorieën verschuiven per seizoen. De stabiele eenheid is het **geboortejaar-cohort** (bijv. "cohort 2012, M"). Band/U-categorie wordt als contextueel label meegenomen.

### Instroomfasen

| Fase | Leeftijd | Kenmerk |
|---|---|---|
| Kerninstroom | 6-9 jaar | Primaire wervingsvenster, hier zit de groei |
| Naloop | 10-12 jaar | Late instromers, kleiner volume |
| Overstappers | 13-18 jaar | Transfers van/naar andere clubs, beide kanten |

Mogelijke corona-invloed op instroompatronen 2020-2022 wordt meegenomen als contextfactor.

### Kritische overgangsmomenten

- **5→6 jaar:** start competitie
- **12→13 jaar:** kantelpunt (puberleeftijd, eerste drop-out piek)
- **14→15 jaar:** overgang naar A-categorie (talentselectie)
- **18→19 jaar:** einde jeugd, overgang naar senioren
- **21→23 jaar:** tweede drop-out piek (studie, verhuizing)

## KPI's

| KPI | Formule |
|---|---|
| Retentiepercentage | behouden / totaal vorig snapshot × 100% |
| Instroompercentage | (nieuw + herinschrijver) / totaal nieuw snapshot × 100% |
| Uitstroompercentage | uitgestroomd / totaal vorig snapshot × 100% |
| Netto groei | instroom − uitstroom (absoluut en %) |
| Drop-out risico | Cohorten met retentie < streefmodel drempel |
| Instroomleeftijd | Gemiddelde en mediaan leeftijd van nieuwe leden |
| Instroomleeftijd-trend | Verschuiving instroomleeftijd over seizoenen |

Uitsplitsingen: per geboortejaar-cohort + geslacht (primair), per overgangsmoment, per team (secundair).

## Signalering

### Drempelwaarden

| Leeftijdsgroep | Streef retentie | Aandacht (<) | Kritiek (<) |
|---|---|---|---|
| 6-12 jaar | 95% | 85% | 70% |
| 13-14 jaar | 90% | 80% | 65% |
| 15-16 jaar | 88% | 78% | 63% |
| 17-18 jaar | 90% | 80% | 65% |
| 19-23 jaar | 75% | 65% | 50% |
| 24+ senioren | 80% | 70% | 55% |

### Signaaltypen

- **Retentie-alert:** cohort zakt onder drempel
- **Instroom-alert:** kerninstroom (6-9 jaar) daalt t.o.v. voorgaande jaren
- **Genderdisbalans:** M/V verhouding in een cohort wijkt >60/40 af
- **Benchmark-alert:** OW presteert significant slechter dan landelijk gemiddelde of concurrenten
- **Trendbreuk:** abrupte verandering t.o.v. geleidelijke trend

## KNKV Benchmarking

### Databron

KNKV publiceert kwartaalcijfers als PDF op [knkv.nl/kennisbank/ledencijfers](https://www.knkv.nl/kennisbank/ledencijfers/) (SharePoint). Bevat ledenaantallen per vereniging, per district, per categorie.

### Aanpak: PDF parsing met handmatige fallback

1. PDF downloaden of lokaal plaatsen in `data/ledenverloop/benchmark/knkv-kwartaal/raw/`
2. Tabellen parsen naar gestructureerde data
3. Relevante rijen extraheren: Oranje Wit + concurrenten + landelijk totaal
4. Opslaan als JSON
5. Bij parse-fout: terugvallen op handmatige invoer in hetzelfde JSON-schema

### Concurrenten

```
lokaal:    DeetosSnel, Sporting Delta, Movado
regionaal: PKC, Albatros, Merwede, Kinderdijk
```

### Benchmark-KPI's

- Ledengroei % (OW vs. landelijk vs. concurrenten)
- Jeugdaandeel % (jeugd t.o.v. totaal)
- Groei/krimp per leeftijdscategorie vergeleken

## Datamodel en opslag

### Input

- Bestaande snapshots: `data/leden/snapshots/*.json`
- KNKV kwartaalcijfers: PDF of handmatige JSON

### Output

```
data/
└── ledenverloop/
    ├── individueel/
    │   └── YYYY-YYYY-verloop.json       # Per rel_code: status classificatie
    ├── cohorten/
    │   └── YYYY-YYYY-cohorten.json      # Per geboortejaar+geslacht: KPI's
    ├── signalering/
    │   └── YYYY-YYYY-alerts.json        # Drempeloverschrijdingen
    └── benchmark/
        ├── knkv-kwartaal/
        │   ├── raw/                     # Originele PDF's
        │   └── YYYY-QN.json            # Geparsede kwartaalcijfers
        └── YYYY-YYYY-vergelijking.json  # OW vs landelijk vs concurrenten

app/
└── ledenverloop.html                    # Standalone HTML dashboard
```

## HTML Dashboard

Standalone HTML (zoals `teamsamenstelling.html`), geen server nodig.

### Pagina's/secties

1. **Overzicht:** totaal leden, netto groei, retentie headline-cijfer
2. **Cohort-analyse:** tabel/grafiek per geboortejaar met retentie/instroom/uitstroom over seizoenen
3. **Instroomvenster:** visualisatie van instroomleeftijd-verdeling en trend
4. **Drop-out heatmap:** uitval per leeftijd × seizoen
5. **Benchmark:** OW vs. KNKV landelijk vs. concurrenten
6. **Signalering:** actieve alerts met stoplicht-kleuren
7. **Filters:** per geslacht, per leeftijdsrange, per seizoen

## Skill-workflow (stappen voor de agent)

1. Laad alle beschikbare snapshots
2. Vergelijk opeenvolgende snapshots op `rel_code`-niveau → classificeer elk lid
3. Aggregeer per geboortejaar-cohort + geslacht
4. Bereken KPI's per cohort en totaal
5. Toets aan drempelwaarden → genereer alerts
6. Als KNKV-data beschikbaar: parse en vergelijk
7. Schrijf JSON-output naar `data/ledenverloop/`
8. Genereer/update HTML dashboard
9. Presenteer samenvatting met signaleringen
