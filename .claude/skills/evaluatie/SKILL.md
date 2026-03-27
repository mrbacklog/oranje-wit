---
name: evaluatie
description: Spelerevaluaties importeren, interpreteren en gebruiken bij teamindelingsadvies.
user-invocable: false
allowed-tools: Read, Write, Glob
---

# Skill: Evaluatie

## Doel
Spelerevaluaties beschikbaar maken en inzetten bij spelersadvies en teamindeling.

## Wat zijn evaluaties?
Coaches beoordelen spelers periodiek op diverse aspecten (techniek, inzet, spelvisie, etc.). Evaluaties worden ingevoerd via de native evaluatie-app (`apps/web/src/app/(evaluatie)/evaluatie/`) en direct opgeslagen in PostgreSQL.

## Evaluatie-app
De evaluatie-app (`apps/web/src/app/(evaluatie)/evaluatie/`) is een Next.js 16 app in het monorepo:
- **URL**: https://evaluaties.ckvoranjewit.app
- **Lokaal**: `pnpm dev` (poort 4104)
- **Auth**: NextAuth v5 via `@oranje-wit/auth` (Google OAuth)
- Coördinatoren maken evaluatierondes aan en nodigen coaches uit per e-mail
- Coaches vullen evaluaties in via een formulier
- Spelers kunnen zelfevaluaties invullen via een uitnodigingslink

## Legacy importproces (verouderd)
Het oude importproces via Lovable (`mrbacklog/oranje-wit-evaluate`) wordt niet meer gebruikt:
1. ~~Export als JSON naar `data/evaluaties/`~~
2. ~~Import via `pnpm import:evaluaties`~~
3. Data staat nu direct in PostgreSQL via de native evaluatie-app

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
- Evaluatie-app: `apps/web/src/app/(evaluatie)/evaluatie/` (native Next.js app in monorepo)
- TI API route: `app/api/spelers/[id]/evaluaties/route.ts`
- TI UI: `components/scenario/EvaluatieScores.tsx`, `components/scenario/SpelerDetail.tsx`
- Legacy: Lovable repo `mrbacklog/oranje-wit-evaluate` (niet meer in gebruik)
