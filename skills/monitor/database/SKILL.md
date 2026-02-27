---
name: database
description: Beheer en query de PostgreSQL database op Railway. Synchroniseer data, bevraag leden/teams/competities/verloop, en beheer het schema.
user-invocable: true
allowed-tools: Read, Write, Glob, Bash
argument-hint: "[query of sync-opdracht]"
---

# Database — PostgreSQL op Railway

Beheer de Oranje Wit PostgreSQL database op Railway. Alle verenigingsdata (16 seizoenen, 957 unieke spelers, 9375 competitie-records) is beschikbaar als relationele data.

## Architectuur

```
Databronnen → import scripts → PostgreSQL (Railway) → MCP tools → Claude Code
```

- **Host**: Railway (PostgreSQL 16)
- **MCP server**: `apps/mcp/oranje-wit-db/server.js` — biedt tools aan Claude Code
- **Schema**: `packages/database/prisma/schema.prisma` — Prisma is source of truth (33 modellen)

## Competitie-datamodel (kern)

```
SpelerSeizoen (speler_seizoenen) — 1 per speler per seizoen
  ├── rel_code, seizoen, team (primair), geslacht, bron, betrouwbaar
  └── CompetitieSpeler (competitie_spelers) — 1 per competitieperiode
        ├── competitie: "veld_najaar" | "zaal" | "veld_voorjaar"
        ├── team, bron
        └── bron: "telling" | "a2" | "snapshot" | "sportlink" | "afgeleid" | "preseason"
```

### Dekking

| Competitie | Seizoenen | Bron |
|---|---|---|
| veld_najaar | 2010-2026 (16) | Telling-bestand + afgeleid |
| zaal | 2018-2024 + 2025-2026 (7) | A2-formulieren + Sportlink export |
| veld_voorjaar | 2017-2025 (8) | Sportlink juni-snapshots |

### Bronverdeling (9375 records)
- `telling`: 5001 — Telling Excel (primaire historische bron)
- `snapshot`: 2216 — Sportlink juni-snapshots (veld_voorjaar)
- `a2`: 1495 — KNKV A2-formulieren (zaal)
- `afgeleid`: 398 — ingevuld uit andere competitieperiodes
- `sportlink`: 258 — Sportlink teams-export (zaal 2025-2026)
- `preseason`: 7 — "team vorig seizoen" kolom

## Database tabellen

### Competitie-data (nieuw)
| Tabel | Rijen | Beschrijving |
|---|---|---|
| `speler_seizoenen` | 5.399 | Speler × seizoen met primair team |
| `competitie_spelers` | 9.375 | Speler × team × competitieperiode |
| `competitie_rondes` | - | Welke periodes per seizoen gespeeld |

### Overige Monitor-tabellen
| Tabel | Rijen | Beschrijving |
|---|---|---|
| `leden` | ~1.000 | Permanente ledenrecords (1 per lid) |
| `seizoenen` | 16 | Seizoenen 2010-2011 t/m 2025-2026 |
| `snapshots` | 17+ | Snapshot metadata per peildatum |
| `leden_snapshot` | ~5.000 | Lid-status per snapshot (point-in-time) |
| `teams` | ~30 | Teams per seizoen met ow_code |
| `team_periodes` | ~70 | J-nummer, pool, sterkte per competitiefase |
| `spelerspaden` | 5.218 | **DEPRECATED** — vervangen door speler_seizoenen + competitie_spelers |
| `ledenverloop` | ~5.700 | Individueel verloop per seizoenspaar |
| `cohort_seizoenen` | ~1.150 | Cohortdata per geboortejaar × geslacht × seizoen |
| `signalering` | ~10 | Stoplicht-alerts |

## Import-pipeline

| Script | Input | Output |
|---|---|---|
| `scripts/import/sync-telling.ts` | `docs/Telling spelers per seizoen.xlsx` | speler_seizoenen + competitie_spelers (veld_najaar) |
| `scripts/import/import-veld-voorjaar.js` | `data/leden/snapshots/YYYY-06-01.json` | competitie_spelers (veld_voorjaar) |
| `scripts/import/vul-veld-najaar-aan.js` | bestaande DB-data | competitie_spelers (veld_najaar, bron=afgeleid) |
| `scripts/import/check-kwaliteit.js` | database | kwaliteitsrapport op stdout |

A2-import en Sportlink-import zijn inline uitgevoerd (niet als herbruikbaar script).

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
| `ow_sync_alles` | Volledige sync: alle JSON → DB |

## Voorbeeldqueries

```sql
-- Speler-competitiepad over alle seizoenen
SELECT ss.seizoen, cs.competitie, cs.team, cs.bron
FROM speler_seizoenen ss
JOIN competitie_spelers cs ON cs.speler_seizoen_id = ss.id
WHERE ss.rel_code = 'NMC41D1'
ORDER BY ss.seizoen, cs.competitie;

-- Teamsamenstelling voor zaal 2023-2024
SELECT cs.team, COUNT(*) as spelers
FROM competitie_spelers cs
JOIN speler_seizoenen ss ON cs.speler_seizoen_id = ss.id
WHERE ss.seizoen = '2023-2024' AND cs.competitie = 'zaal'
GROUP BY cs.team ORDER BY cs.team;

-- Dekking per seizoen
SELECT ss.seizoen, cs.competitie, COUNT(*)::int as n
FROM competitie_spelers cs
JOIN speler_seizoenen ss ON cs.speler_seizoen_id = ss.id
GROUP BY ss.seizoen, cs.competitie
ORDER BY ss.seizoen, cs.competitie;

-- Retentie per geboortejaar (laatste 3 seizoenen)
SELECT geboortejaar, seizoen, actief, retentie_pct
FROM cohort_seizoenen
WHERE seizoen >= '2023-2024'
ORDER BY geboortejaar, seizoen;
```

## Schema-eigenaarschap

**Prisma is de bron van waarheid.** Het schema wordt beheerd in `packages/database/prisma/schema.prisma`. Schema-wijzigingen via `pnpm db:generate` en `pnpm db:push`.

## Configuratie

- `.env` — DATABASE_URL (gitignored)
- `.mcp.json` — MCP server registratie
- `apps/mcp/oranje-wit-db/server.js` — MCP server
- Railway: `shinkansen.proxy.rlwy.net:18957`, database: `oranjewit`
