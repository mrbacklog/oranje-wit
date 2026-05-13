# Blocker-A: Teams-2025-2026 Migratie Plan
**Status:** SNAPSHOT-DRY-RUN voltooid 2026-05-13 — advies GO voor historisch script op productie  
**Datum:** 2026-05-08 (plan) · 2026-05-11 (lege-dev dry-run) · 2026-05-13 (snapshot dry-run)  
**Doel:** Inventarisatie + dry-run-strategie voor v2 TI Studio start

---

## Snapshot dry-run 2026-05-13

**Setup:** Productie-snapshot van 7 tabellen (`seizoenen`, `leden`, `teams`, `team_periodes`, `team_aliases`, `competitie_spelers`, `team_scouting_sessies`) gekopieerd naar dev-DB via `scripts/snapshot-prod-to-dev.ts` (node-streaming, geen pg_dump). Productie: read-only. Daarna `migrate-teams-historisch.ts` + `db:ensure-views` + `verify-teams-migration.ts` op dev-snapshot.

### Snapshot-grootte (= productie 2026-05-13)

| Tabel | Rijen |
|---|---:|
| seizoenen | 16 |
| leden | 1 709 |
| teams (alle, vóór script) | 31 |
| team_periodes | 88 |
| team_aliases (vóór script) | 57 |
| competitie_spelers (totaal) | 4 893 |
| competitie_spelers (<2025-2026, hist) | 4 052 |
| team_scouting_sessies | 0 |

### Pre-state historisch (snapshot, vóór script)

| Metriek | Waarde |
|---|---:|
| Teams <2025-2026 | 0 |
| Historische cs met NULL ow_team_id | 4 052 (100%) |
| Missing team+seizoen combos | 497 |

### Script-resultaat

```
497 ontbrekende team+seizoen combos
✓ 497 teams aangemaakt
✓ 497 nieuwe aliases aangemaakt
✓ 0 extra ow_code-aliases aangemaakt
✓ 4052 historische competitie_spelers rijen gekoppeld
✓ Alle historische rijen volledig gekoppeld
```

### Categorisatie-breakdown (497 nieuwe teams)

| team_type | categorie | aantal |
|---|---|---:|
| JEUGD | b | 353 |
| SENIOREN | a | 78 |
| SELECTIE | a | 49 |
| OVERIG | b | 17 |

### Aliases per seizoen (1 alias per uniek KNKV-teamnaam per seizoen)

| Seizoen | Aliases | Seizoen | Aliases |
|---|---:|---|---:|
| 2024-2025 | 28 | 2016-2017 | 40 |
| 2023-2024 | 29 | 2015-2016 | 37 |
| 2022-2023 | 29 | 2014-2015 | 38 |
| 2021-2022 | 35 | 2013-2014 | 35 |
| 2020-2021 | 33 | 2012-2013 | 32 |
| 2019-2020 | 36 | 2011-2012 | 31 |
| 2018-2019 | 32 | 2010-2011 | 26 |
| 2017-2018 | 36 | | |

Totaal historische aliases: **497**.

### Random sample 20 historische teams

| Seizoen | Naam | team_type | categorie | ow_code |
|---|---|---|---|---|
| 2020-2021 | A3 | SELECTIE | a | OW-A3 |
| 2018-2019 | A4 | SELECTIE | a | OW-A4 |
| 2016-2017 | A1 | SELECTIE | a | OW-A1 |
| 2014-2015 | B4 | JEUGD | b | OW-B4 |
| 2016-2017 | B4 | JEUGD | b | OW-B4 |
| 2023-2024 | S1S2 | SENIOREN | a | OW-S1S2 |
| 2018-2019 | S3 | SENIOREN | a | OW-S3 |
| 2019-2020 | A2 | SELECTIE | a | OW-A2 |
| 2023-2024 | E3 | JEUGD | b | OW-E3 |
| 2020-2021 | F3 | JEUGD | b | OW-F3 |
| 2010-2011 | A3 | SELECTIE | a | OW-A3 |
| 2014-2015 | B1 | JEUGD | b | OW-B1 |
| 2011-2012 | S1 | SENIOREN | a | OW-S1 |
| 2016-2017 | MW2 | JEUGD | b | OW-MW2 |
| 2016-2017 | F3 | JEUGD | b | OW-F3 |
| 2023-2024 | E2 | JEUGD | b | OW-E2 |
| 2013-2014 | E1 | JEUGD | b | OW-E1 |
| 2017-2018 | E2 | JEUGD | b | OW-E2 |
| 2023-2024 | AR | OVERIG | b | OW-AR |
| 2014-2015 | D4 | JEUGD | b | OW-D4 |

### Vreemde/discutabele categorisaties

| Naam | Huidige cat | Verwacht | Reden |
|---|---|---|---|
| `MW1` / `MW2` / `MW3` (23x) | **JEUGD** | OVERIG (midweekdames) | Regex `/^[BCM][A-Z]\d/` matcht eerder dan `/^MW\d/` — orderings-bug in `categorize()` |
| `b3` (1x, 2010-2011) | OVERIG | JEUGD | Lowercase — regex is case-sensitive |
| `AR` (1x, 2023-2024) | OVERIG | onduidelijk | Geen regex-match (Aspirant Rood?) — fallback |
| `A`, `B`, `C`, `D`, `E`, `F` (6x, losse letter zonder cijfer) | OVERIG | mogelijk import-vervuiling | Geen cijfer → geen match |
| `Senioren`, `K`, `NSL` (8x) | OVERIG | mogelijk SENIOREN/OVERIG | Vrije tekst-velden |
| `S5-6-7`, `S5S6`, `B1B2`, `A1A2`, `S1S2` (11x) | correct (SELECTIE/SENIOREN/JEUGD) | OK | Combinatieteams, juist gecat |

**Impact:** ~24 van 497 teams (4.8%) hebben een discutabele categorisatie. Backfill van `ow_team_id` in `competitie_spelers` werkt correct (100% gekoppeld) — de categorie is alleen relevant voor UI-filtering, niet voor de migratie zelf. MW-bug is wel het serieus aandachtspunt (15+ teams over de jaren).

### NULL-resterend

| Bereik | Pre | Post |
|---|---:|---:|
| Historisch (<2025-2026) | 4 052 (100%) | **0 (0%)** |
| 2025-2026 | 61 (7.3%) | 61 (7.3%) — ongewijzigd (script raakt 2025-2026 niet aan) |

### Alias-impact

| Bereik | Pre | Post | Delta |
|---|---:|---:|---:|
| 2025-2026 | 57 | 57 | 0 |
| <2025-2026 | 0 | 497 | +497 |
| Totaal | 57 | 554 | +497 |

VIEW `speler_seizoenen`: 4 373 rijen (was 321 vóór script; +4 052 historische rijen krijgen nu een `ow_team_naam`).

### Vergelijking lege-dev vs snapshot

| Stap | Lege-dev (2026-05-11) | Snapshot (2026-05-13) |
|---|---|---|
| Missing combos | 0 | **497** |
| Teams aangemaakt | 0 | **497** |
| Aliases aangemaakt | 0 | **497** |
| Rijen gekoppeld | 0 | **4 052** |
| NULL resterend (hist) | 0 (niets te koppelen) | **0** (alles gekoppeld) |
| Regex-categorisatie getest | nee | **ja** — ~24 discutabel, 95% correct |

De lege-dev dry-run gaf geen confidence over de regex; deze snapshot run wel.

### Eindadvies: GO voor live-migratie op productie

**GO** voor `npx tsx scripts/migrate-teams-historisch.ts` op productie, met deze opmerkingen:

1. **Veilig:** script is idempotent (`ON CONFLICT DO NOTHING / DO UPDATE`), 100% historische rijen worden gekoppeld, geen data-loss.
2. **Risico-beperkt:** scouting_sessies = 0, geen 2025-2026 mutatie, geen VIEW-drop.
3. **Aandachtspunt MW-categorisatie:** 15-23 historische `MW*` teams krijgen `team_type = JEUGD` i.p.v. OVERIG. **Niet blokkerend** — alleen UI-filtering raakt dit en het is reverseerbaar met één UPDATE achteraf:
   ```sql
   UPDATE teams SET team_type = 'OVERIG'
   WHERE seizoen < '2025-2026' AND naam LIKE 'MW%';
   ```
4. **Aanbevolen volgorde live:**
   - Railway backup bevestigen (timestamp noteren)
   - `npx tsx scripts/migrate-teams-historisch.ts` (~5-10 sec, 497 inserts + 4 052 updates)
   - `pnpm db:ensure-views`
   - `npx tsx scripts/verify-teams-migration.ts`
   - Optioneel: MW-correctie SQL (1 statement)
5. **Timing:** geen onderhoudsvenster nodig. Korte locks (<10 sec). Mag tijdens kantoor-uren.

**Geen blockers meer — productie kan zodra Antjan groen licht geeft.**

---

## Dry-run resultaten 2026-05-11

**Productie-DB:** `postgres@shinkansen.proxy.rlwy.net:18957/oranjewit` (via Railway TCP proxy, SELECT only)
**Dev-DB:** `postgres@localhost:5434/oranjewit_dev` (Docker compose, scripts uitgevoerd)

### Productie SELECT-queries (vóór live-migratie)

| Query | Tabel / metriek | Productie | Opmerking |
|---|---|---:|---|
| Q1 | teams 2025-2026 | **31** | Al aanwezig — `migrate-teams-2025-2026.ts` is eerder gedraaid |
| Q1 | team_periodes 2025-2026 | 88 | Volledig (>50 target) |
| Q1 | team_aliases 2025-2026 | 57 | Op target (~60) |
| Q1 | competitie_spelers 2025-2026 | 841 | |
| Q1 | team_scouting_sessies impact | **0** | Geen risico op data-loss |
| Q2 | NULL ow_team_id 2025-2026 | **61 / 841 (7.3%)** | Boven target <5% maar onder rode lijn 10% |
| Q3 | Potentieel via alias-backfill | **0** | Alle koppelbare zijn al gekoppeld |
| Q4 | Historisch missing combos | **497** | Historisch script nog nooit gedraaid |
| Q5 | Historisch NULL 2010-2025 | **100% per seizoen** | 176–344 NULL per seizoen, totaal ~4 052 rijen |
| Bonus | Onbekende 2025-2026 namen | `K`, `onbekend`, `S1S2` | 3 categorieën — niet auto-koppelbaar |
| Bonus | VIEW speler_seizoenen | 321 rijen | Werkt |

**Interpretatie:**
- 2025-2026 migratie staat al live op productie. Er valt niets meer winnen door `migrate-teams-2025-2026.ts` nogmaals te draaien (alias-pool is al uitgeput voor de bestaande KNKV-namen).
- De 7.3% NULL bestaat uit `K`, `onbekend`, `S1S2` — handmatige beslissing nodig (geen alias-toevoeging zonder PO-akkoord).
- Historisch script is écht waar de winst zit: 497 ontbrekende team+seizoen combos en 4 052 rijen zonder `ow_team_id`.

### Dev-DB scripts (uitgevoerd)

| Stap | Resultaat | Logs |
|---|---|---|
| `pnpm db:migrate:deploy` | 8 nieuwe migraties toegepast, VIEW OK (842 rijen) | ✓ |
| `migrate-teams-2025-2026.ts` | 31 teams gemaakt, 609 gekoppeld, 207 NULL (25.4%) | ✓ Idempotent |
| `migrate-teams-historisch.ts` | 0 combos, 0 teams, 0 aliases, 0 backfill | Dev heeft geen historische `competitie_spelers` |
| `pnpm db:ensure-views` | VIEW speler_seizoenen OK (842 rijen) | ✓ |
| `verify-teams-migration.ts` | Teams 31/31, aliases 57, periodes 36, NULL 25.4%, VIEW 272 rijen | 2 gele vlaggen |

**Dev-vs-prod afwijkingen:**
- Dev heeft KNKV-namen `D1 / H1 / J19-J23 / U15` (oudere import) — productie heeft `K / onbekend / S1S2`. Verklaart hogere NULL% in dev (25.4% vs 7.3%).
- Dev heeft geen historische competitie_spelers — historisch script is niet end-to-end gevalideerd op realistische data. Risico: medium.

### Go/no-go check per target

| Target | Productie nu | Na historisch script (verwacht) | Status |
|---|---|---|---|
| Teams 2025-2026 = 31 | 31 | 31 (ongewijzigd) | ✓ GROEN |
| NULL ow_team_id 2025-2026 < 5% | 7.3% | 7.3% (script doet niets meer) | 🟡 GEEL — `K/onbekend/S1S2` blijven, vereist handmatige alias-beslissing |
| Alias-dekking 2025-2026 > 95% | 92.7% effectief | 92.7% | 🟡 GEEL — zelfde als boven |
| Scouting-sessies impact < 10 | 0 | 0 | ✓ GROEN |
| VIEW speler_seizoenen werkt | ✓ (321 rijen) | ✓ verwacht | ✓ GROEN |
| Historisch: 497 combos opgelost | 497 missing | 0 verwacht | 🟡 GEEL — niet gevalideerd op realistische data in dev |

### Aanbeveling: GO (gefaseerd) voor historisch script, NO-OP voor 2025-2026

1. **2025-2026 script:** NIET opnieuw draaien op productie — heeft geen effect (idempotent, alias-pool uitgeput). De 7.3% NULL is een data-kwaliteits-issue (`K`, `onbekend`, `S1S2`), niet een migratie-issue. → escaleer naar PO voor handmatige alias-toevoeging of opschoning aan de bron (Sportlink sync / import-mapper).
2. **Historisch script:** GO voor productie, maar met voorzichtigheid:
   - Eerst pg_dump van `teams`, `team_aliases`, `competitie_spelers` als snapshot (backup-id noteren).
   - Draai binnen onderhoudsvenster (23:00-02:00).
   - Direct na uitvoeren: `pnpm db:ensure-views` + `verify-teams-migration.ts`.
   - Verwacht: 497 nieuwe team+seizoen combos → ~150-300 nieuwe `teams` rijen + ~497 aliases + ~4 052 `competitie_spelers` rijen krijgen `ow_team_id`.
   - Bewaar `scripts/dry-run-queries.sql` en `scripts/verify-teams-migration.ts` voor pre/post vergelijk.
3. **Niet gevalideerd risico:** Het historisch script gebruikt regex-categorisatie en is niet end-to-end op realistische data getest in dev (dev heeft geen historische rijen). Voor extra zekerheid: dev-DB seeden met productie-snapshot vóór live (1 uur werk), of de eerste run op productie binnen een transactie wrappen.

**Eindadvies:** GO voor `migrate-teams-historisch.ts` in onderhoudsvenster, met backup-snapshot. NO-OP voor `migrate-teams-2025-2026.ts` (al live). De 7.3% NULL in 2025-2026 is een aparte data-kwaliteitstaak voor PO.

---

---

## Context

OWTeamType/alias/owTeamId schema staat klaar, maar data-migratiescripts zijn nog **NIET live gedraaid** op productie-DB. Dit moet gebeuren voordat v2-fase-0 begint.

Twee scripts:
1. `migrate-teams-2025-2026.ts` — Fresh start: delete/recreate alle 31 teams voor 2025-2026 + team_periodes + team_aliases + backfill ow_team_id in competitie_spelers
2. `migrate-teams-historisch.ts` — Backfill team_aliases voor alle seizoenen 2010-2026 (behalve 2025-2026)

---

## Script-Inventory

### 1. migrate-teams-2025-2026.ts
**Doel:** Fresh-start seizoen 2025-2026 met correcte OW-teams

**Wat het doet:**
- **Stap 1:** Verwijdert ALLE bestaande 2025-2026 teams, team_periodes, team_aliases, competitie_spelers.ow_team_id, team_scouting_sessies
- **Stap 2–5:** Maakt 31 nieuwe teams aan (18 jeugd + 5 selectie + 6 senioren + 2 overig)
  - Jeugd: 18 teams (Rood-1/2, Oranje-1..4, Geel-1..4, Groen-1..4, Blauw-1..4)
  - Selectie: U15-1, U17-1/2, U19-1/2
  - Senioren: S1–S6
  - Overig: MW1, Kangoeroes
- **Stap 3:** Vult team_periodes met j_nummer per fase (veld_najaar, zaal_deel1)
- **Stap 4:** Vult team_aliases (KNKV-teamnamen → OW team IDs)
- **Stap 6:** Backfill ow_team_id in competitie_spelers via alias-lookup

**Impact:** 31 rows in `teams`, ~50+ rows in `team_periodes`, ~60+ rows in `team_aliases`, UPDATE op competitie_spelers (alle 2025-2026 rijen)

**Waarschuwing:** Destructief — wist alle 2025-2026 teamdata. **Idempotent**: meerdere runs geven hetzelfde eindresultaat.

---

### 2. migrate-teams-historisch.ts
**Doel:** Backfill team_aliases + ontbrekende teams voor 2010-2026 (behalve 2025-2026)

**Wat het doet:**
- **Stap 1:** Vindt alle team+seizoen combos in competitie_spelers die GEEN alias hebben
- **Stap 2:** Maakt ontbrekende teams aan op basis van team-naampatronen (categorisatie via regex: A*/S* → SELECTIE/SENIOREN, B*/C* → JEUGD, etc.)
- **Stap 3:** Maakt aliases aan voor bestaande teams (ow_code ohne "OW-" prefix)
- **Stap 4:** Backfill ow_team_id in competitie_spelers

**Impact:** Variabel per seizoen. Verwacht ~10–20 ontbrekende teams per seizoen × 15 seizoenen = potentieel 150–300 nieuwe teams. Plus aliases.

**Betrouwbaarheid:** Medium — regex-categorisatie kan misspellingen/onbekende naamconventies missen.

---

## Schema-Impact

**Primaire Tabellen:**

| Tabel | Query | Rows | Operatie | Risico |
|---|---|---|---|---|
| `teams` | `seizoen = '2025-2026'` | ~31 → 0 → 31 | DELETE + INSERT | ✓ Idempotent (ON CONFLICT) |
| `team_periodes` | `team_id IN (2025-2026 teams)` | ~50 | DELETE + INSERT | ✓ Idempotent (ON CONFLICT) |
| `team_aliases` | `seizoen = '2025-2026'` | ~60 | DELETE + INSERT | ✓ Idempotent (ON CONFLICT) |
| `competitie_spelers` | `seizoen = '2025-2026'` | ~300–400 | UPDATE ow_team_id | ✓ Nur NULL→value |
| `team_scouting_sessies` | `owTeamId IN (2025-2026)` | ~0–10 | DELETE | ⚠ Cascade missing, explicit DELETE |
| **Historisch:** `teams`, `team_aliases`, `competitie_spelers` | `seizoen < '2025-2026'` | +100–300 | INSERT + UPDATE | ✓ ON CONFLICT |

**VIEW Impact:**

`speler_seizoenen` — LEFT JOIN teams t ON t.id = cp.ow_team_id
- Rijen zonder ow_team_id blijven NULL (wees voorzichtig!)
- VIEW-definitie hoeft NIET te wijzigen

---

## Dry-Run Plan

**Doel:** Voorspellen hoeveel records worden gewijzigd, valideren logic, GEEN wijzigingen doorvoeren

### Stap 1: Backup maken (Railway automatic)
```
Railway Console → [project-id] → Backups tab
→ Automatic backups zijn ingesteld (2026-04-14 hardening)
→ Herstelscripts in scripts/herstel/
```

### Stap 2: DRY-RUN — Voorbereiding scripts
De twee scripts hebben **GEEN ingebouwde DRY_RUN mode**. We gaan handmatig dry-run draaien:

**2a: Dry-run migrate-teams-2025-2026.ts**
```sql
-- Voorbereiding: check huidge 2025-2026 state
SELECT 'teams' AS tabel, COUNT(*)::int AS rijen
  FROM teams WHERE seizoen = '2025-2026'
UNION ALL
SELECT 'team_periodes', COUNT(*)::int
  FROM team_periodes WHERE team_id IN (SELECT id FROM teams WHERE seizoen = '2025-2026')
UNION ALL
SELECT 'team_aliases', COUNT(*)::int
  FROM team_aliases WHERE seizoen = '2025-2026'
UNION ALL
SELECT 'competitie_spelers', COUNT(*)::int
  FROM competitie_spelers WHERE seizoen = '2025-2026'
UNION ALL
SELECT 'team_scouting_sessies', COUNT(*)::int
  FROM team_scouting_sessies WHERE "owTeamId" IN (SELECT id FROM teams WHERE seizoen = '2025-2026');

-- Check: hoeveel competitie_spelers hebben NULL ow_team_id?
SELECT COUNT(*)::int AS null_count 
  FROM competitie_spelers 
  WHERE seizoen = '2025-2026' AND ow_team_id IS NULL;

-- Check: hoeveel zouden gekoppeld worden via alias-backfill?
SELECT COUNT(*)::int AS zou_gekoppeld
  FROM competitie_spelers cs
  LEFT JOIN team_aliases a ON a.seizoen = cs.seizoen AND a.alias = cs.team
  WHERE cs.seizoen = '2025-2026' AND cs.ow_team_id IS NULL AND a.id IS NOT NULL;
```

**2b: Dry-run migrate-teams-historisch.ts**
```sql
-- Hoeveel ontbrekende team+seizoen combos?
SELECT COUNT(*)::int AS missing_combos
  FROM (
    SELECT DISTINCT cs.seizoen, cs.team
      FROM competitie_spelers cs
      LEFT JOIN team_aliases ta ON ta.seizoen = cs.seizoen AND ta.alias = cs.team
      WHERE cs.seizoen < '2025-2026' AND ta.id IS NULL
  ) tmp;

-- Per seizoen: hoeveel?
SELECT cs.seizoen, COUNT(DISTINCT cs.team)::int AS unique_teams_without_alias
  FROM competitie_spelers cs
  LEFT JOIN team_aliases ta ON ta.seizoen = cs.seizoen AND ta.alias = cs.team
  WHERE cs.seizoen < '2025-2026' AND ta.id IS NULL
  GROUP BY cs.seizoen
  ORDER BY cs.seizoen DESC;

-- Hoeveel historische competitie_spelers hebben NULL ow_team_id?
SELECT cs.seizoen, COUNT(*)::int AS null_count
  FROM competitie_spelers cs
  WHERE cs.seizoen < '2025-2026' AND cs.ow_team_id IS NULL
  GROUP BY cs.seizoen
  ORDER BY cs.seizoen DESC;
```

### Stap 3: DRY-RUN — Transactie wrapper
Beide scripts kunnen in een transactie gedraaid worden (PostgreSQL):
```sql
BEGIN TRANSACTION;
  -- migrate-teams-2025-2026.ts logic
  DELETE FROM team_periodes WHERE team_id = ANY(ARRAY(SELECT id FROM teams WHERE seizoen = '2025-2026'));
  -- etc.
ROLLBACK;  -- Dry-run: terug naar begin
```

**Maar:** De scripts zijn in TypeScript, niet SQL. Alternatief:
- Draai scripts op development/test-DB eerst
- Dump SQL-output met logging ingebouwd
- Handmatig check verwachte getallen

---

## VIEW-Update Strategie

**Huidge VIEW speler_seizoenen:**
```sql
CREATE OR REPLACE VIEW speler_seizoenen AS
SELECT DISTINCT ON (cp.rel_code, cp.seizoen)
  cp.rel_code, cp.seizoen, cp.team, cp.competitie, cp.geslacht,
  cp.ow_team_id,                          ← Nieuw veld!
  t.naam  AS ow_team_naam,                ← Nieuw (LEFT JOIN teams)
  t.alias AS ow_team_alias,               ← Nieuw
  t.kleur AS ow_team_kleur                ← Nieuw
FROM competitie_spelers cp
LEFT JOIN teams t ON t.id = cp.ow_team_id ← Nieuw
ORDER BY ...
```

**Actie:** VIEW-definitie is al up-to-date in `prisma/views.sql`. Na teams-migratie:
- Draai `pnpm db:ensure-views` (automatisch na migrate, maar kan ook handmatig)
- Verifieer: SELECT COUNT(*) FROM speler_seizoenen; (moet > 0)

---

## Risico-Analyse

| Risico | Impact | Mitigation |
|---|---|---|
| **Verwijdering scouting_sessies** | 🔴 Data loss | Backup vooraf; check vooraf hoeveel; delete-query apart valideren |
| **NULL ow_team_id blijft** | 🟡 Warning | Monitoring: check per seizoen hoeveel NULL blijven; loggen in script |
| **Alias-mismatch** | 🟡 Incompleteness | Handmatig valideren: zijn alle teams gekoppeld? |
| **VIEW verdwenen** | 🔴 Critical (old) | Beschermd nu: migrate-deploy.ts + ensure-views.ts |
| **Downtime v1 TI Studio** | 🟠 UX impact | Migratie: ~2-5 sec (kort lock). Warn users beforehand. |
| **Transactie timeout** | 🟡 Rollback needed | Scripts gebruiken autocommit; geen lange transactie. Maar handig voor DRY-RUN. |

---

## Backup Checkpoint

**Railway Automatic Backups:** Ingesteld 2026-04-14 (hardening incident)
- Fullbackup: dagelijks (rollback tot 24h terug)
- WAL: 7 dagen

**Voordat live draaien:**
1. Railway Console → Backups → Verify latest
2. Noteer backup timestamp
3. Herstelscripts in `scripts/herstel/` klaar houden

**Herstel (als nodig):**
```bash
# From Railway docs: restore to specific point-in-time
# Lokaal voorbereiding: pg_restore uit dump
scripts/herstel/restore-from-backup.sh <backup-date>
```

---

## v1 Productie-Impact

**Huidge State:**
- v1 TI Studio (`apps/web/pages/teamindeling/*`) — DEPRECATED (redirect naar apps/ti-studio)
- Monitor app uses competitie_spelers + speler_seizoenen VIEW
- Teams niet zichtbaar in v1 TI, dus geen direct UI-break

**Downtime:**
- Scripts: ~2-5 sec totaal (korte locks op teams, team_aliases, competitie_spelers)
- Zichtbaar voor: niemand (monitor is gesloten buiten kantooruren, TI is deprecated)
- Aanbeveling: **Draai 's nachts (23:00-06:00) of in onderhoudsvenster**

---

## Checklist: Go/No-Go

Voordat live migreren (MOET allemaal groen):

- [ ] **1. Backup geverifieerd** — Railway automatic backup recentheid check
- [ ] **2. DRY-RUN SQL statements** — Alle 5 queries hierboven gedraaid op productie-replica, verwachte nummers vastgesteld
- [ ] **3. Scripts testen op dev-DB** — Beide migrations scripts lokaal draait, verwachte records aangemaakt
- [ ] **4. View-hersteaming gevalideerd** — `pnpm db:ensure-views` werkt op dev
- [ ] **5. Alias-dekking** — Alle 2025-2026 competitie-spelers hebben alias in lookup tabel
- [ ] **6. NULL-check** — Afgesproken: maximaal 5% NULL ow_team_id blijven (anders: waarschuwing)
- [ ] **7. Post-migration query** — Script geeft duidelijk aus hoeveel gekoppeld, hoeveel NULL
- [ ] **8. Downtime-window gereed** — Antjan akkoord 's nachts draaien (23:00-02:00)
- [ ] **9. Rollback-plan gereed** — backup ID + herstelscript.sh getest lokaal
- [ ] **10. Scouting-sessie check** — Duidelijke logging: hoeveel scouting_sessies worden verwijderd?

---

## Aanbeveling: Fases

**Fase 1 (Nu): DRY-RUN**
1. Draai alle 5 dry-run SQL queries op **test-replica** (Railway kan dit spiegelen)
2. Draai beide TypeScript scripts op **development-DB** (lokaal)
3. Rapporteer nummers, validate logic

**Fase 2 (After approval): Live Productie**
1. Backup bevestigd
2. Draai migrate-teams-2025-2026.ts ('s nachts)
3. Draai migrate-teams-historisch.ts (direct daarna)
4. Draai `pnpm db:ensure-views`
5. Valideer: SELECT COUNT(*), SELECT COUNT(*) WHERE ow_team_id IS NULL
6. Monitoring: dashboard refresh, speler_seizoenen queries in monitor

**Fase 3 (Next day)**
1. Spot-check: zijn alle teams zichtbaar in v2 TI Studio?
2. Spot-check: zijn signaleringen correct?
3. Archiveer backup ID voor referentie

---

## Conclusie

**Status: READY FOR DRY-RUN**

De scripts zijn solide (idempotent, goed gedocumenteerd). De VIEW-infra is beschermd. De enige blocker: confirmatie van datanummers en risico-acceptatie voordat live draaien.

**Volgende stap:** Antjan geeft groen licht voor stap 1 (DRY-RUN), vervolgens data-analist voert dry-run uit en rapporteert.
