---
name: import
description: Data importeren in de Team-Indeling app. Sportlink export en evaluaties naar de database.
user-invocable: true
allowed-tools: Read, Write, Glob, Bash
argument-hint: "[optioneel: 'evaluaties' voor alleen evaluatie-import]"
---

# Skill: Import

## Doel
Data importeren vanuit de Verenigingsmonitor en evaluatie-app naar de Team-Indeling database.

## Data-import (spelers, staf, referentieteams)

### Bron
Export uit de Verenigingsmonitor: `data/export/export-YYYY-YYYY.json`
Gegenereerd via skill `monitor/exporteer`.

### Commando
```bash
pnpm import
```

### Script
`scripts/import/import-data.ts` — importeert naar Prisma-tabellen:
- `Speler` — alle actieve spelers met profiel, retentie, spelerspad
- `Staf` — trainers en staf per team
- `ReferentieTeam` — huidige teamstructuur als referentie

### Logica
`apps/team-indeling/src/lib/import.ts` — verwerking en mapping

## Evaluatie-import

### Bron
JSON export uit de Lovable evaluatie-app (`data/evaluaties/`)

### Commando
```bash
pnpm import:evaluaties
```

### Script
`scripts/import/import-evaluaties.ts` — importeert naar Prisma-tabel:
- `Evaluatie` — spelerevaluaties (scores, opmerkingen van coaches)

## Overige import-scripts
- `scripts/import/import-check.ts` — valideer import-data
- `scripts/import/check-kwaliteit.js` — kwaliteitscontrole
- `scripts/import/check-verschil.js` — vergelijk met vorige import
- `scripts/import/sync-leden-csv.ts` — Sportlink CSV synchronisatie
