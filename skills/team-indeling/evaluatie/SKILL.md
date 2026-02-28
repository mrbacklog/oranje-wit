---
name: evaluatie
description: Spelerevaluaties importeren, interpreteren en gebruiken bij teamindelingsadvies.
user-invocable: false
allowed-tools: Read, Write, Glob
---

# Skill: Evaluatie

## Doel
Spelerevaluaties vanuit de Lovable evaluatie-app beschikbaar maken en inzetten bij spelersadvies en teamindeling.

## Wat zijn evaluaties?
Coaches beoordelen spelers periodiek op diverse aspecten (techniek, inzet, spelvisie, etc.). Deze evaluaties worden in de Lovable app (`mrbacklog/oranje-wit-evaluate`) ingevoerd en als JSON geëxporteerd.

## Importproces
1. Coach voert evaluatie in via de Lovable evaluatie-app
2. Export als JSON naar `data/evaluaties/`
3. Import via `pnpm import:evaluaties` (script: `scripts/import/import-evaluaties.ts`)
4. Data wordt opgeslagen in de `Evaluatie` tabel (Prisma)

## Database
Prisma model `Evaluatie` in `packages/database/prisma/schema.prisma`:
- Gekoppeld aan `Speler` via relatie
- Bevat scores, opmerkingen, datum, coach

## Gebruik bij teamindeling
- Agent `adviseur` gebruikt evaluaties voor onderbouwd spelersadvies
- Agent `speler-scout` gebruikt evaluaties voor profielopbouw
- Evaluatiescores wegen mee bij:
  - Selectie prestatie- vs. ontwikkelteam
  - Doorstroomadvies (niveau-inschatting)
  - What-if analyses (impact van verplaatsing)

## Referenties
- Import-skill: → zie `team-indeling/import` voor het importproces
- Evaluatie-app: Lovable repo `mrbacklog/oranje-wit-evaluate`
