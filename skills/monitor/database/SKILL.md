---
name: database
description: Beheer en query de PostgreSQL database op Railway. Synchroniseer JSON data, bevraag leden/teams/verloop/cohorten, en beheer het schema.
user-invocable: true
allowed-tools: Read, Write, Glob, Bash
argument-hint: "[query of sync-opdracht]"
---

# Database — PostgreSQL op Railway

Beheer de Oranje Wit PostgreSQL database op Railway. Alle verenigingsdata (16 seizoenen, 801 leden, 5218 spelerspaden) is beschikbaar als relationele data.

## Architectuur

```
JSON-bestanden (bron) → sync tools → PostgreSQL (Railway) → MCP tools → Claude Code
```

- **Host**: Railway (PostgreSQL 16)
- **MCP server**: `mcp/server.js` — biedt tools aan Claude Code
- **Sync**: `mcp/tools/sync.js` — JSON → DB migratie
- **Schema**: `db/schema.sql` — 11 tabellen

## Database tabellen

| Tabel | Rijen | Beschrijving |
|---|---|---|
| `leden` | 801 | Permanente ledenrecords (1 per lid) |
| `seizoenen` | 16 | Seizoenen 2010-2011 t/m 2025-2026 |
| `snapshots` | 17 | Snapshot metadata per peildatum |
| `leden_snapshot` | 4.836 | Lid-status per snapshot (point-in-time) |
| `teams` | 30 | Teams per seizoen met ow_code |
| `team_periodes` | 67 | J-nummer, pool, sterkte per competitiefase |
| `spelerspaden` | 5.218 | Speler × seizoen (longitudinaal) |
| `ledenverloop` | 5.734 | Individueel verloop per seizoenspaar |
| `cohort_seizoenen` | 1.150 | Cohortdata per geboortejaar × geslacht × seizoen |
| `signalering` | 9 | Stoplicht-alerts (kritiek/aandacht/op_koers) |

## MCP Tools (beschikbaar als de MCP server draait)

| Tool | Gebruik |
|---|---|
| `ow_status` | Database status: tabellen, rijen, laatste sync |
| `ow_query` | SQL SELECT query uitvoeren |
| `ow_leden_zoek` | Zoek leden op naam, team, kleur, geboortejaar |
| `ow_team_info` | Team ophalen met periodedata en spelers |
| `ow_spelerspad` | Spelerspad van 1 speler over alle seizoenen |
| `ow_verloop` | Verloop-samenvatting per seizoen |
| `ow_cohort` | Cohortdata per geboortejaar |
| `ow_signalering` | Actieve alerts ophalen |
| `ow_sync_snapshot` | JSON snapshot importeren |
| `ow_sync_teams` | Teams register importeren |
| `ow_sync_verloop` | Alle verloop-bestanden importeren |
| `ow_sync_cohorten` | Cohorten importeren |
| `ow_sync_alles` | Volledige sync: alle JSON → DB |

## Handmatig syncen (zonder MCP)

```bash
# Volledige migratie
node scripts/migreer-naar-db.js

# Database connectie testen
node -e "require('dotenv').config(); const {Client}=require('pg'); const c=new Client({connectionString:process.env.DATABASE_URL}); c.connect().then(()=>c.query('SELECT COUNT(*) FROM leden')).then(r=>{console.log(r.rows);c.end()})"
```

## Voorbeeldqueries

```sql
-- Leden per team in huidig seizoen
SELECT ls.ow_code, COUNT(*) as spelers,
       SUM(CASE WHEN l.geslacht='M' THEN 1 ELSE 0 END) as m,
       SUM(CASE WHEN l.geslacht='V' THEN 1 ELSE 0 END) as v
FROM leden_snapshot ls
JOIN leden l ON ls.rel_code = l.rel_code
JOIN snapshots s ON ls.snapshot_id = s.id
WHERE s.snapshot_datum = (SELECT MAX(snapshot_datum) FROM snapshots)
GROUP BY ls.ow_code ORDER BY ls.ow_code;

-- Retentie per geboortejaar (laatste 3 seizoenen)
SELECT geboortejaar, seizoen, actief, retentie_pct
FROM cohort_seizoenen
WHERE seizoen >= '2023-2024'
ORDER BY geboortejaar, seizoen;

-- Spelerspad van een specifiek lid
SELECT sp.seizoen, sp.team, sp.ow_code, sp.categorie
FROM spelerspaden sp
WHERE sp.speler_id = 'NMC41D1'
ORDER BY sp.seizoen;
```

## Schema-eigenaarschap

**Prisma is de bron van waarheid.** Het schema wordt beheerd in het team-indeling project (`c:\oranje-wit-team-indeling\prisma\schema.prisma`). Schema-wijzigingen altijd via `prisma migrate dev` in dat project.

`db/schema.sql` is een afgeleide backup — NIET handmatig bewerken.

## Configuratie

- `.env` — DATABASE_URL (gitignored)
- `.mcp.json` — MCP server registratie
- `db/schema.sql` — Schema backup (Prisma is bron)
- `mcp/server.js` — MCP server
- `mcp/tools/sync.js` — Sync functies

## Railway details

- Project: oranje-wit-db
- Service: Postgres (PostgreSQL 16)
- Host: shinkansen.proxy.rlwy.net:18957
- Database: oranjewit
