---
name: database
description: Beheer en query de PostgreSQL database op Railway. Bevraag leden/teams/competities/verloop, en beheer het schema.
user-invocable: true
allowed-tools: Read, Write, Glob, Bash
argument-hint: "[query of sync-opdracht]"
---

# Database — PostgreSQL op Railway

Beheer de Oranje Wit PostgreSQL database op Railway. Alle verenigingsdata (16 seizoenen, 924 unieke spelers, ~4.933 records) is beschikbaar als relationele data.

## Architectuur

```
CompetitieSpeler (competitie_spelers) — PRIMAIRE TABEL
  → 1 per speler × seizoen × competitie
  → VIEW speler_seizoenen (afgeleid via DISTINCT ON)
  → verloop-pipeline → ledenverloop, cohort_seizoenen, signalering
```

- **Host**: Railway (PostgreSQL 16)
- **MCP server**: `apps/mcp/oranje-wit-db/server.js` — biedt tools aan Claude Code
- **Schema**: `packages/database/prisma/schema.prisma` — Prisma is source of truth

## Competitie-datamodel (kern)

```
CompetitieSpeler (competitie_spelers) — PRIMAIRE TABEL
  ├── rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar
  ├── competitie: veld_najaar | zaal | veld_voorjaar
  ├── Unique: (rel_code, seizoen, competitie)
  └── FKs: leden(rel_code), seizoenen(seizoen)

VIEW speler_seizoenen — afgeleid uit competitie_spelers
  ├── DISTINCT ON (rel_code, seizoen) met prioriteit: veld_najaar > zaal > veld_voorjaar
  └── Geen Prisma model — alleen via $queryRaw of raw SQL
```

**LET OP:** `pnpm db:push` mag NIET draaien — zou de VIEW droppen.

## Database tabellen

### Competitie-data
| Tabel | Rijen | Beschrijving |
|---|---|---|
| `competitie_spelers` | ~4.933 | PRIMAIR: 1 per speler × seizoen × competitie |
| VIEW `speler_seizoenen` | ~924 per seizoen | Afgeleid: 1 per speler per seizoen |
| `competitie_rondes` | - | Welke periodes per seizoen gespeeld |

### Overige Monitor-tabellen
| Tabel | Rijen | Beschrijving |
|---|---|---|
| `leden` | ~1.000 | Permanente ledenrecords (1 per lid) |
| `seizoenen` | 16 | Seizoenen 2010-2011 t/m 2025-2026 |
| `teams` | ~30 | Teams per seizoen met ow_code |
| `team_periodes` | ~70 | J-nummer, pool, sterkte per competitiefase |
| `ledenverloop` | ~5.400 | Individueel verloop per seizoenspaar |
| `cohort_seizoenen` | ~1.200 | Cohortdata per geboortejaar × geslacht × seizoen |
| `signalering` | ~10 | Stoplicht-alerts |

## Verloop-pipeline (database-based)

| Script | Input | Output |
|---|---|---|
| `scripts/js/bereken-verloop.js` | competitie_spelers + leden | ledenverloop |
| `scripts/js/bereken-cohorten.js` | competitie_spelers + ledenverloop | cohort_seizoenen |
| `scripts/js/genereer-signalering.js` | ledenverloop + cohort_seizoenen | signalering |

Scripts draaien met: `node -r dotenv/config scripts/js/<script>.js`

## MCP Tools (beschikbaar als de MCP server draait)

| Tool | Gebruik |
|---|---|
| `ow_status` | Database status: tabellen, rijen |
| `ow_query` | SQL SELECT query uitvoeren |
| `ow_leden_zoek` | Zoek leden op naam, team, kleur, geboortejaar |
| `ow_team_info` | Team ophalen met periodedata en spelers |
| `ow_spelerspad` | Spelerspad van 1 speler over alle seizoenen |
| `ow_verloop` | Verloop-samenvatting per seizoen |
| `ow_cohort` | Cohortdata per geboortejaar |
| `ow_signalering` | Actieve alerts ophalen |
| `ow_sync_alles` | Volledige sync: alle JSON → DB |

## Voorbeeldqueries

```sql
-- Spelerspad over alle seizoenen (direct uit competitie_spelers)
SELECT seizoen, team, geslacht, bron, competitie
FROM competitie_spelers
WHERE rel_code = 'NMC41D1'
ORDER BY seizoen, CASE competitie
  WHEN 'veld_najaar' THEN 1 WHEN 'zaal' THEN 2 WHEN 'veld_voorjaar' THEN 3 END;

-- Spelers per team per seizoen (via VIEW)
SELECT team, COUNT(*) as spelers
FROM speler_seizoenen
WHERE seizoen = '2025-2026'
GROUP BY team ORDER BY team;

-- Dekking per seizoen
SELECT seizoen, COUNT(DISTINCT rel_code)::int as spelers
FROM competitie_spelers
GROUP BY seizoen ORDER BY seizoen;

-- Retentie per geboortejaar (laatste 3 seizoenen)
SELECT geboortejaar, seizoen, actief, retentie_pct
FROM cohort_seizoenen
WHERE seizoen >= '2023-2024'
ORDER BY geboortejaar, seizoen;
```

## Schema-eigenaarschap

**Prisma is de bron van waarheid** voor alle tabellen. De VIEW `speler_seizoenen` wordt apart beheerd via raw SQL. Schema-wijzigingen via `pnpm db:generate`.

## Configuratie

- `.env` — DATABASE_URL (gitignored)
- `.mcp.json` — MCP server registratie
- `apps/mcp/oranje-wit-db/server.js` — MCP server
- Railway: `shinkansen.proxy.rlwy.net:18957`, database: `oranjewit`
