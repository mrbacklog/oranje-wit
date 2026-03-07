---
name: batch-plaats
description: Spelers batch-gewijs plaatsen in scenario-teams via CLI script of API. Gebruik voor het snel vullen van teamindelingen.
user-invocable: false
allowed-tools: Bash, Read
---

# Skill: Batch-plaats

## Doel
Snel spelers plaatsen in scenario-teams op basis van filters (huidig team, kleur, geslacht, geboortejaar, specifieke IDs).

## CLI script

**Pad**: `scripts/plaats-spelers.mjs`

### Overzicht bekijken

```bash
# Toon alle teams met hun spelers
node scripts/plaats-spelers.mjs --scenario "0.1" --show

# Toon beschikbare (niet-ingedeelde) spelers
node scripts/plaats-spelers.mjs --scenario "0.1" --pool

# Pool met filters
node scripts/plaats-spelers.mjs --scenario "0.1" --pool --kleur GROEN
node scripts/plaats-spelers.mjs --scenario "0.1" --pool --jaar 2010-2012 --geslacht M
node scripts/plaats-spelers.mjs --scenario "0.1" --pool --huidig-team "Blauw"
```

### Spelers plaatsen

```bash
# Alle spelers van een kleurgroep
node scripts/plaats-spelers.mjs --scenario "0.1" --team "Groen-1" --kleur GROEN --jaar 2016

# Op basis van huidig team (bevat-match)
node scripts/plaats-spelers.mjs --scenario "0.1" --team "Blauw-1" --huidig-team "Blauw E1"

# Op geslacht + geboortejaar range
node scripts/plaats-spelers.mjs --scenario "0.1" --team "Oranje-3" --kleur ORANJE --geslacht V --jaar 2013-2014

# Specifieke spelers op ID
node scripts/plaats-spelers.mjs --scenario "0.1" --team "U17-1" --ids "NJH39X4,ABC123"

# Dry-run: toon wat er zou gebeuren zonder te plaatsen
node scripts/plaats-spelers.mjs --scenario "0.1" --team "Groen-1" --kleur GROEN --jaar 2016 --dry
```

### Filters

| Flag | Beschrijving | Voorbeeld |
|---|---|---|
| `--huidig-team` | Bevat-match op huidig teamnaam | `"Blauw E1"`, `"Groen"` |
| `--kleur` | Exacte match op kleurgroep | `BLAUW`, `GROEN`, `GEEL`, `ORANJE`, `ROOD` |
| `--geslacht` | M of V | `M`, `V` |
| `--jaar` | Geboortejaar (enkel of range) | `2016`, `2014-2015` |
| `--ids` | Comma-separated speler-IDs (rel_codes) | `"NJH39X4,ABC123"` |
| `--dry` | Dry-run, geen wijzigingen | - |

Filters zijn combineerbaar. Spelers die al ingedeeld zijn worden automatisch overgeslagen.

## API route

**Endpoint**: `POST /api/scenarios/{scenarioId}/batch-plaats`

```json
{
  "teamNaam": "Groen-2",
  "filter": {
    "huidigTeam": "Groen E3",
    "huidigKleur": "GROEN",
    "geslacht": "V",
    "geboortejaarVan": 2014,
    "geboortejaarTot": 2015,
    "spelerIds": ["NJH39X4"],
    "status": "BESCHIKBAAR"
  },
  "dryRun": true
}
```

Alle filter-velden zijn optioneel. `dryRun: true` retourneert de gevonden spelers zonder te plaatsen.

## Werkwijze voor AI-assistent

Bij het vullen van een scenario:
1. Gebruik `--pool` met filters om eerst te laten zien welke spelers beschikbaar zijn
2. Gebruik `--dry` om de plaatsing te simuleren
3. Na goedkeuring van de gebruiker: voer het commando uit zonder `--dry`
4. Gebruik `--show` om het resultaat te tonen

**LET OP**: Dit script werkt direct op de productie-database. Gebruik altijd `--dry` eerst.

## Teamkleuren (B-categorie)

| Kleur | Leeftijdsgroep (indicatief) |
|---|---|
| BLAUW | Oudste jeugd (~2008-2010) |
| GROEN | ~2015-2018 |
| GEEL | ~2012-2014 |
| ORANJE | ~2011-2013 |
| ROOD | Jongste jeugd (~2017-2019) |

## Huidig team veld

Het `huidig` JSON veld op `Speler` bevat:
- `team`: huidig teamnaam (bijv. "Blauw E1", "J11")
- `kleur`: kleurgroep (bijv. "Groen", "Blauw")
- `categorie`: categorie
- `ow_code`: OW teamcode
- `leeftijd`: korfballeeftijd
