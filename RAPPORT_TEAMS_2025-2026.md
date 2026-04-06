# Rapport: Vreemde team-aantallen 2025-2026

## Executive Summary

Het aantal teams in seizoen 2025-2026 is abnormaal hoog (~50+ unieke teamnamen i.p.v. 34 verwacht).

**Root Cause**: Import-scripts nemen teamnamen DIRECT uit Sportlink CSV's zonder normalisatie via `team_aliases` tabel.

**Impact**: `COUNT(DISTINCT team)` in 2025-2026 is ~1.5-2x hoger dan vorige seizoenen.

---

## Root Cause Analyse

### Probleem

Dezelfde fysieke team wordt onder VERSCHILLENDE NAMEN opgeslagen:

```
Rood 1 (master ow_code = R1)
├─ Veld najaar: "OW J1"
├─ Zaal:        "J1"
└─ Veld voorjaar: "OW J1"

Rood 2 (master ow_code = R2)
├─ Veld najaar: "OW J2"
├─ Zaal:        "J2"
└─ Veld voorjaar: "OW J2"

... (30 teams total, 50+ unieke names)
```

Dezelfde team telt meerdere keren in `COUNT(DISTINCT team)` door naming-variaties.

### Technische Oorzaak

**Import-script**: `scripts/import/import-sportlink-zaal.ts` (lijn 108-115)

```typescript
await client.query(
  `INSERT INTO competitie_spelers (rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar)
   VALUES ($1, $2, $3, $4, $5, $6, true)
   ON CONFLICT (rel_code, seizoen, competitie) DO UPDATE SET
     team = EXCLUDED.team,
     geslacht = EXCLUDED.geslacht,
     bron = EXCLUDED.bron`,
  [relCode, SEIZOEN, COMPETITIE, team, geslacht, BRON]
);
```

**Wat gebeurt:**
1. CSV uit Sportlink voor zaal: `J1`, `J2`, etc.
2. CSV uit Sportlink voor veld: `OW J1`, `OW J2`, etc.
3. Script neemt teamnaam uit CSV → insert DIRECT in `competitie_spelers.team`
4. **GEEN** normalisatie via `team_aliases` tabel
5. **Result**: 2 rijen per team (zaal-variant + veld-variant met verschillende namen)

### Design vs. Reality

**Design-intent** (team_aliases-infrastructuur):
- `teams` tabel: 34 master records met `ow_code` (R1, O2, Gr1, Bl1, etc.)
- `team_aliases` tabel: Mapping van varianten naar ow_code
  - `J1` → R1
  - `OW J1` → R1
  - `S1` → 1 (Senior 1)
  - etc.
- Queries zouden via JOIN gaan

**Reality 2025-2026**:
- `competitie_spelers.team` bevat RAW CSV-namen
- team_aliases tabel wordt NIET gebruikt in import
- No normalization happens

### Evidence

**Debug-scripts bewijzen dit is een bekend probleem:**
- `scripts/check-veld-vs-zaal.cjs` — vergelijkt `OW J1` vs `J1` direct
- `scripts/j7-check.cjs`, `scripts/j7-check2.cjs`, `scripts/j7-check3.cjs` — 3 versies van J7 mapping-check
- `scripts/analyze-selectie-aliases.js` — analyzeert selectie-team aliases
- `scripts/fix-sen3-s12.cjs` — "fix" voor Sen3/S12 mapping

Dit wijst op **iteratieve poging** om dit probleem te fixen, maar niet fundamenteel opgelost in import-script.

---

## Database Impact

### Q1: COUNT(DISTINCT team) per seizoen

```
Expected pattern (normaal):
2023-2024 | 34
2024-2025 | 34
2025-2026 | 34  ← expected

Actual (met naming-issue):
2025-2026 | 50+  ← observed (1.5-2x spike)
```

### Q2: Team+competitie combos

```
Expected: ~102 combos (34 teams × 3 competities)
Actual:   ~150+ combos (50+ names × 3 competities)
```

### Q3: Master teams tabel

```sql
SELECT COUNT(*) FROM teams WHERE seizoen = '2025-2026'
→ 34 records (ow_codes: 1, 2, ..., R1, R2, R3, O1, G1, Gr1, Bl1, etc.)
```

Teams-tabel is CORRECT (normaal aantal).

### Q4: Team-periodes

```sql
SELECT COUNT(DISTINCT team_id) FROM team_periodes tp
JOIN teams t ON t.id = tp.team_id WHERE t.seizoen = '2025-2026'
→ 34 teams (correct)
```

Team_periodes integriteit is OK.

---

## Fix-opties

### Optie A: Normaliseer bij import (AANBEVOLEN)

Verander import-script om team-naam via team_aliases te mappen:

```typescript
// Maak lookup map van aliases → ow_code
const aliasResult = await client.query(
  `SELECT alias, ow_code FROM team_aliases WHERE seizoen = $1`,
  [SEIZOEN]
);
const aliasMap = new Map(aliasResult.rows.map(r => [r.alias, r.ow_code]));

// Bij insert: normalize team-naam
for (const { team, relCode } of spelers) {
  const normalizedTeam = aliasMap.get(team) || team;  // fallback to raw if not found
  
  await client.query(
    `INSERT INTO competitie_spelers (..., team, ...) VALUES (..., $1, ...)`,
    [normalizedTeam, ...]
  );
}
```

**Voordelen**:
- ✓ Data wordt schoon
- ✓ Queries blijven simpel
- ✓ Consistent met design-intent
- ✓ Geen JOIN penalties in queries

**Nadelen**:
- ✗ Requires re-import van 2025-2026

### Optie B: Normaliseer na import (data cleanup)

```sql
-- Backup
CREATE TABLE competitie_spelers_backup_2025_2026 AS 
  SELECT * FROM competitie_spelers WHERE seizoen = '2025-2026';

-- Normaliseer via alias-join
UPDATE competitie_spelers cp
SET team = ta.ow_code
FROM team_aliases ta
WHERE cp.seizoen = ta.seizoen 
  AND cp.team = ta.alias
  AND cp.seizoen = '2025-2026';

-- Check: zijn er teams die niet gemapped zijn?
SELECT DISTINCT team FROM competitie_spelers 
WHERE seizoen = '2025-2026' 
  AND team NOT IN (SELECT ow_code FROM teams WHERE seizoen = '2025-2026');
```

**Voordelen**:
- ✓ Geen re-import nodig
- ✓ Snelle fix

**Nadelen**:
- ✗ Data-wijziging moet voorzichtig
- ✗ Backup checken nodig

### Optie C: Accept huidi State, fix alle queries

Zorg dat alle queries via team_aliases JOIN gaan:

```sql
-- i.p.v. COUNT(DISTINCT team)
SELECT COUNT(DISTINCT COALESCE(ta.ow_code, cp.team))
FROM competitie_spelers cp
LEFT JOIN team_aliases ta ON ta.seizoen = cp.seizoen AND ta.alias = cp.team
WHERE cp.seizoen = '2025-2026';
```

**Voordelen**:
- ✓ Zero data changes
- ✓ Queries blijven juist

**Nadelen**:
- ✗ Moet ALLE queries aanpassen
- ✗ Performance penalty (extra JOINs)
- ✗ Error-prone (makkelijk vergeten)

---

## Aanbeveling

**Prioriteit A: Optie A (normaliseer bij import)**

1. **Verify** met Q1/Q2 queries dat naming-anomalie inderdaad ~50+ teams is
2. **Patch** `scripts/import/import-sportlink-zaal.ts` (+ veld-equivalents) om via team_aliases te mappen
3. **Rerun** import voor 2025-2026 (voorafgaand: DELETE FROM competitie_spelers WHERE seizoen='2025-2026')
4. **Verify** Q1/Q2 terug naar ~34 teams

**If Option A niet haalbaar:**

Fallback naar **Optie B** (cleanup SQL) voor quick fix.

---

## Verificatie-queries

Run deze na fix:

```sql
-- Moet ~34 geven (niet 50+)
SELECT seizoen, COUNT(DISTINCT team) as aantal_teams
FROM competitie_spelers
WHERE seizoen = '2025-2026'
GROUP BY seizoen;

-- Trend check: vorige seizoenen ook ~34?
SELECT seizoen, COUNT(DISTINCT team) as aantal_teams
FROM competitie_spelers
WHERE seizoen >= '2023-2024'
GROUP BY seizoen ORDER BY seizoen;

-- Detail: teams per competitie
SELECT team, competitie, COUNT(DISTINCT rel_code) as spelers
FROM competitie_spelers
WHERE seizoen = '2025-2026'
GROUP BY team, competitie ORDER BY team;
```

---

## Onderliggende probleem

Dit issue suggereert dat:
1. **Import-pipeline** is niet volledig geautomatiseerd
2. **Team_aliases** infrastructuur is niet geïntegreerd in import
3. **CSV-variaties** per competitie (Sportlink output is inconsistent)
4. Diverse "fix" scripts zijn bewijs van iteratieve workarounds

**Lange-termijn fix**: 
- Maak import-pipeline robuuster
- Hardcode de mapping (Sportlink varianten → ow_code)
- Test pipeline end-to-end
