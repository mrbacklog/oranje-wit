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

## Evaluatie-scores (datamodel)
Scores JSON bevat:
- **Individueel**: `niveau` (1-4), `inzet` (1-4), `groei` (1-4)
- **Oranje Draad**: `team_plezier` (1-4 + toelichting), `team_ontwikkeling` (1-4 + toelichting), `team_prestatie` (1-4 + toelichting)
- **Overig**: `team_naam`, `speler_opmerkingen`

TypeScript types: `EvaluatieScore`, `EvaluatieData`, `TeamGemiddelde` in `components/scenario/types.ts`

## UI-componenten

### SpelerDetail popup
- Lazy fetch: `GET /api/spelers/[id]/evaluaties?teamId=xxx`
- Retourneert: `{ evaluaties: EvaluatieData[], teamVergelijking: TeamGemiddelde | null }`
- Toont per seizoen: score-balkjes (1-4), coach-opmerking, speler-opmerkingen
- Toggle "Vergelijk met team": toont team-gemiddelde als verticale marker op balkjes

### EvaluatieScores component
- Horizontale score-balkjes (oranje, schaal 1-4)
- Team-gemiddelde als dunne verticale marker (blauw)
- "Oranje Draad" blok met plezier/ontwikkeling/prestatie in oranje achtergrond

### ChatPanel AI-tool
- `bekijk_evaluaties` tool: Claude kan evaluaties opvragen in chat-context

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
- API route: `app/api/spelers/[id]/evaluaties/route.ts`
- UI: `components/scenario/EvaluatieScores.tsx`, `components/scenario/SpelerDetail.tsx`
