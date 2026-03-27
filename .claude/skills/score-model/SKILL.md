---
name: score-model
description: Berekent en vergelijkt speler- en teamscores via de Geunificeerde Score Schaal (USS). Vertaalt KNKV teamratings, scouting spelersscores, coach-evaluaties en spelerratings naar een vergelijkbare schaal. Gebruik bij elke vraag over scores, ratings, teamsterkte, spelerswaarde, KNKV-punten, kalibratie, A-categorie scores of de verhouding team/speler.
user-invocable: true
allowed-tools: Read, Write, Glob, Bash
---

# Skill: Score-Model (USS)

## Doel

Beheer en toepassing van de Geunificeerde Score Schaal (USS) — het wiskundige model dat de brug vormt tussen KNKV teamratings, scouting spelersscores en coach-evaluaties.

## Source of Truth

-> Lees altijd `rules/score-model.md` voor formules, parameters en voorbeelden.

## Wanneer deze skill gebruiken

- **Score berekenen**: speler- of teamscore opvragen, vergelijken of omrekenen
- **Rating interpreteren**: wat betekent een USS van 115? Vergelijking met teams/categorieeen
- **Kalibratie**: na KNKV rating-update de parameters herijken
- **A-categorie**: USS bepalen voor U15/U17/U19 teams
- **Scouting ↔ team**: verband leggen tussen individuele scoutingscore en teamsterkte
- **Coach ↔ scouting**: gewogen combinatie berekenen op basis van beschikbare data
- **Leeftijdscheck**: speelgerechtigheid A-categorie controleren

## Code-locaties

| Wat | Bestand |
|-----|---------|
| USS-functies (gedeeld) | `packages/types/src/score-model.ts` |
| Scouting score-ranges | `apps/web/src/app/(scouting)/scouting/src/lib/scouting/rating.ts` |
| Team-indeling ratings | `apps/web/src/app/(teamindeling)/teamindeling/src/lib/rating.ts` |
| Coach-evaluatie types | `packages/types/src/evaluatie.ts` |
| KNKV pool-standen | `apps/web/src/app/(monitor)/monitor/src/lib/sync/standen-knkv.ts` |

## Kernformules (samenvatting)

### Basislijn (leeftijd → verwachte USS)
```
S(l) = 180 / (1 + e^(-0.35 * (l - 12.5)))
```

### Scouting → USS
```
USS = ussBasis + ((score - mediaan) / halveRange) * bandbreedte
```

### Coach → USS
```
USS = ussTeam + ((niveau - 3) / 2) * 20
```

### Gecombineerd
```
USS = w_scout * USS_scouting + w_coach * USS_coach
```
Gewichten verschuiven: meer scouting-data → scouting weegt zwaarder.

## Kalibratie-protocol

1. Na elke KNKV rating-update (3x per seizoen):
   - Haal nieuwe teamratings op via `knkv-api` skill
   - Vergelijk met basislijn per team
   - Herbereken spelerscores via `/api/ratings/herbereken`
2. Bij seizoensstart:
   - Herijk basislijn-parameters (k, l0, sMax) met least-squares fit
   - Update A-categorie USS-waarden indien nodig
   - Draai `pnpm calibrate` (scripts/js/kalibreer-score-model.js)
