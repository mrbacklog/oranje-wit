---
name: team-seizoensanalyse
description: Start een Agent Team voor een brede seizoensanalyse. Gebruik bij seizoensstart voor totaalbeeld van ledenbestand, retentie, prognoses en concept-indelingen.
disable-model-invocation: true
argument-hint: "[optioneel: specifieke analysevraag]"
---

# Agent Team: Seizoensanalyse

Start een agent team voor een brede analyse van het ledenbestand en de seizoensvoorbereiding van c.k.v. Oranje Wit.

## Team samenstelling

### Lead: korfbal
- **Rol**: Korfbal-technisch expert, coördineert de totaalanalyse
- **Verantwoordelijkheden**:
  - Stelt de analysevragen op basis van de Oranje Draad
  - Synthetiseert bevindingen van alle teammates tot een totaalbeeld
  - Formuleert strategische aanbevelingen voor de TC
  - Bewaakt de samenhang tussen data, spelersanalyse en teamsamenstelling

### Teammate 1: data-analist
- **Rol**: Data-pipeline, verloop-analyse, signalering
- **Verantwoordelijkheden**:
  - Draait de verloop-pipeline (competitie_spelers → ledenverloop → cohorten → signalering)
  - Berekent vulgraad per geboortejaar × geslacht tegen streefmodel
  - Vergelijkt retentiecijfers met vorig seizoen en KNKV-benchmark
  - Identificeert kritieke cohorten (instroom-tekort, verhoogd verloop)
  - Levert dashboard-data en trendanalyses
- **Communiceert met**: korfbal (rapportage), speler-scout (cohort-context)

### Teammate 2: speler-scout
- **Rol**: Individuele spelersprofielen en werving
- **Verantwoordelijkheden**:
  - Bouwt profielen van risicospelers (hoog retentierisico, overgangsleeftijd)
  - Identificeert wervingskansen per geboortejaar × geslacht
  - Analyseert spelerspaden en ontwikkelingstrajecten
  - Beoordeelt evaluatiedata voor sleutelspelers
  - Adviseert over boeien & binden strategieën
- **Communiceert met**: korfbal (spelersadvies), data-analist (retentie-context), team-selector (plaatsingsadvies)

### Teammate 3: team-selector
- **Rol**: Concept-indelingen voorbereiden
- **Verantwoordelijkheden**:
  - Bereidt concept-indelingen voor op basis van beschikbare data
  - Berekent hoeveel teams per kleur/categorie haalbaar zijn
  - Identificeert knelpunten (te weinig spelers, genderbalans)
  - Stelt teamgrootte-scenario's op (optimistisch/realistisch/pessimistisch)
  - Respecteert seizoenskaders en pins
- **Communiceert met**: korfbal (concepten), speler-scout (spelersadvies), data-analist (aantallen)

## Memory

Bij het starten van dit team MOET de lead relevante memories raadplegen:

1. **Lees** `MEMORY.md` (index) in de memory-directory
2. **Lees** alle memories met type `project` die gerelateerd zijn aan seizoensanalyse, retentie, trends of ledenaantallen
3. **Vergelijk** eerdere bevindingen met nieuwe data — signaleer veranderingen
4. **Sla op** na afloop: verrassende trends, nieuwe risico's, of significante verschuivingen als `project`-memory

Typische memories voor dit team:
- Conclusies uit vorige seizoensanalyses (trends, risico-cohorten)
- Bekende retentierisico's per leeftijdsgroep
- Wervingsacties en hun effecten
- Vergelijking met vorig jaar (beter/slechter/gelijk)

## Werkwijze

1. **korfbal** formuleert de kernvragen voor het seizoen
2. **korfbal** raadpleegt memories van eerdere analyses — wat was vorig keer het beeld?
3. **data-analist** start parallel met de verloop-pipeline en signalering
4. **speler-scout** begint met profielen van risicospelers uit vorig seizoen
4. Na data: **korfbal** stuurt gerichte vragen:
   - Aan **data-analist**: "welke cohorten zijn kritiek?"
   - Aan **speler-scout**: "welke spelers hebben extra aandacht nodig?"
   - Aan **team-selector**: "hoeveel teams kunnen we vormen?"
5. **team-selector** levert concept-indelingen → **speler-scout** beoordeelt individuele plaatsingen
6. **korfbal** synthetiseert tot seizoensrapport met aanbevelingen

## Communicatiepatronen

```
TC (gebruiker)
    ↕ vragen en beleid
korfbal (lead)
    ↕ analyse-opdrachten en synthese
    ├── data-analist ←→ speler-scout  (cohort- en spelersdata)
    ├── speler-scout ←→ team-selector (plaatsingsadvies)
    └── data-analist ←→ team-selector (aantallen en vulgraad)
```

## Context

- **Taal**: Nederlands
- **Database**: PostgreSQL via Prisma (`packages/database/`)
- **Pipeline**: `scripts/js/` (verloop, cohorten, signalering)
- **Streefmodel**: `data/modellen/streef-ledenboog.json`
- **Jeugdmodel**: `model/jeugdmodel.yaml`
- **Regels**: `rules/oranje-draad.md`, `rules/knkv-regels.md`, `rules/ow-voorkeuren.md`

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, voer dan een **volledige seizoensanalyse** uit:
1. Draai de verloop-pipeline voor het huidige seizoen
2. Genereer signalering (kritiek/aandacht/op_koers per cohort)
3. Identificeer de top-10 risicospelers (retentie)
4. Bereken hoeveel teams per kleur haalbaar zijn
5. Presenteer een totaalrapport met aanbevelingen
