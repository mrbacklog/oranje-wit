---
name: team-seizoensindeling
description: Start een Agent Team voor het volledige seizoensindelingsproces. Gebruik wanneer de TC het indelingstraject van kaders tot definitieve indeling doorloopt.
disable-model-invocation: true
argument-hint: "[optioneel: specifieke opdracht of focus]"
---

# Agent Team: Seizoensindeling

Start een agent team voor het teamindelingsproces van c.k.v. Oranje Wit.

## Team samenstelling

Stel het volgende agent team samen:

### Lead: team-planner
- **Rol**: Coördineert het volledige indelingstraject (kaders → concept → scenario → definitief)
- **Verantwoordelijkheden**:
  - Bewaakt het overzicht en de voortgang
  - Verdeelt taken naar teammates
  - Synthetiseert input tot beslissingen
  - Communiceert conclusies terug

### Teammate 1: adviseur
- **Rol**: Spelersadvies, what-if analyses, Oranje Draad-toetsing
- **Verantwoordelijkheden**:
  - Beantwoordt vragen over individuele spelersplaatsing
  - Voert what-if analyses uit ("wat als speler X stopt?")
  - Toetst scenario's aan de Oranje Draad (Plezier + Ontwikkeling + Prestatie)
  - Genereert startvoorstellen op basis van kaders + concept
  - Vergelijkt scenario's op trade-offs
- **Communiceert met**: team-planner (opdrachten), regel-checker (validatie van voorstellen)

### Teammate 2: regel-checker
- **Rol**: Doorlopende validatie van alle indelingsvoorstellen
- **Verantwoordelijkheden**:
  - Valideert elk voorstel tegen KNKV Competitie 2.0 regels
  - Controleert OW-voorkeuren (teamgrootte-targets, gendermix)
  - Geeft stoplicht-status per team (groen/oranje/rood)
  - Signaleert dubbele plaatsingen en leeftijdsband-overtredingen
  - Berekent impact bij spelersverplaatsingen
- **Communiceert met**: team-planner (rapportage), adviseur (feedback op voorstellen)

### Teammate 3: data-analist
- **Rol**: Live data ophalen en analyseren
- **Verantwoordelijkheden**:
  - Haalt actuele spelersdata op uit PostgreSQL (leden, competitie_spelers)
  - Berekent retentierisico's per speler/cohort
  - Levert vulgraad-analyses per geboortejaar × geslacht
  - Vergelijkt met streefmodel
  - Signaleert gaps en risico's
- **Communiceert met**: team-planner (data-verzoeken), adviseur (spelerscontext)

## Memory

Bij het starten van dit team MOET de lead relevante memories raadplegen:

1. **Lees** `MEMORY.md` (index) in de memory-directory
2. **Lees** alle memories met type `project` of `feedback` die gerelateerd zijn aan teamindeling, TC-besluiten, of spelersafspraken
3. **Gebruik** deze context bij het formuleren van opdrachten aan teammates
4. **Sla op** na afloop: nieuwe TC-besluiten, spelersafspraken, of verrassende bevindingen als `project`-memory

Typische memories voor dit team:
- TC-besluiten over specifieke spelers of teams
- Afspraken over spelersplaatsing (bijv. "speler X blijft bij team Y")
- Retentierisico's die eerder besproken zijn
- Feedback op eerdere indelingsvoorstellen

## Werkwijze

1. **team-planner** start met het laden van de huidige kaders en actieve concepten
2. **team-planner** raadpleegt relevante memories (TC-besluiten, spelersafspraken)
3. **data-analist** haalt parallel de actuele spelersdata en retentiecijfers op
3. **team-planner** formuleert de eerste opdrachten:
   - Aan **adviseur**: genereer startvoorstel op basis van concept
   - Aan **regel-checker**: bereid validatiecriteria voor (teamgrootte-targets)
4. **adviseur** levert voorstel → **regel-checker** valideert direct
5. **team-planner** synthetiseert en presenteert aan de TC
6. Bij aanpassingen: **adviseur** berekent what-if, **regel-checker** hervalideert

## Communicatiepatronen

```
TC (gebruiker)
    ↕ vragen en beslissingen
team-planner (lead)
    ↕ opdrachten en synthese
    ├── adviseur ←→ regel-checker  (directe validatie-feedback)
    ├── adviseur ←→ data-analist   (spelersdata voor advies)
    └── data-analist               (achtergrond data-ophalen)
```

## Context

- **Taal**: Nederlands
- **Database**: PostgreSQL via Prisma (`packages/database/`)
- **App**: Team-Indeling (`apps/ti-studio/`)
- **Regels**: `rules/knkv-regels.md`, `rules/ow-voorkeuren.md`, `rules/oranje-draad.md`
- **Peiljaar**: 2027 (seizoen 2026-2027), peildatum 31 december 2026

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, start dan met:
1. Laad de huidige kaders en actieve scenario's
2. Geef een statusoverzicht: hoeveel spelers, hoeveel teams, openstaande issues
3. Vraag de TC wat de volgende stap is
