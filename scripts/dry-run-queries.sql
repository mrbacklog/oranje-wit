-- ===========================================
-- Teams Migratie DRY-RUN: SQL Validation
-- ===========================================
-- BELANGRIJK: ALLEEN SELECT QUERIES — geen schrijfopdrachten!
-- Voer uit tegen: productie-DB (of test-replica)
--
-- Doel: Voorspel impact van migrate-teams-2025-2026.ts en migrate-teams-historisch.ts
--

SET search_path TO public;

-- ============================================
-- QUERY 1: Huidge 2025-2026 staat
-- ============================================
-- Tabel                        | Rijen
-- ─────────────────────────────┼──────
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
  FROM team_scouting_sessies WHERE "owTeamId" IN (SELECT id FROM teams WHERE seizoen = '2025-2026')
ORDER BY tabel;

-- ============================================
-- QUERY 2: NULL ow_team_id in 2025-2026
-- ============================================
-- Hoeveel competitie_spelers hebben geen gekoppelde ow_team_id?
-- Verwacht: enkele %, target na backfill: <5%
--
SELECT
  COUNT(*)::int AS null_count,
  (SELECT COUNT(*) FROM competitie_spelers WHERE seizoen = '2025-2026')::int AS total,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM competitie_spelers WHERE seizoen = '2025-2026'), 1)::numeric AS pct
FROM competitie_spelers
WHERE seizoen = '2025-2026' AND ow_team_id IS NULL;

-- ============================================
-- QUERY 3: Potentiële alias-matches
-- ============================================
-- Hoeveel NULL rijen kunnen gekoppeld worden via alias-backfill?
-- Dit geeft: reductie = (NULL voor) - (NULL na backfill)
--
SELECT
  COUNT(*)::int AS zou_gekoppeld
FROM competitie_spelers cs
LEFT JOIN team_aliases a ON a.seizoen = cs.seizoen AND a.alias = cs.team
WHERE cs.seizoen = '2025-2026'
  AND cs.ow_team_id IS NULL
  AND a.id IS NOT NULL;

-- ============================================
-- QUERY 4: Historisch - ontbrekende combos
-- ============================================
-- Hoeveel team+seizoen combos hebben GEEN alias?
-- migrate-teams-historisch.ts moet deze aanmaken
--
SELECT COUNT(*)::int AS missing_combos
FROM (
  SELECT DISTINCT cs.seizoen, cs.team
  FROM competitie_spelers cs
  LEFT JOIN team_aliases ta ON ta.seizoen = cs.seizoen AND ta.alias = cs.team
  WHERE cs.seizoen < '2025-2026' AND ta.id IS NULL
) tmp;

-- ============================================
-- QUERY 5: Historisch NULL per seizoen
-- ============================================
-- Voor elke seizoen < 2025-2026: hoeveel NULL ow_team_id?
-- Na migrate-teams-historisch.ts zouden deze moeten afnemen
--
SELECT
  cs.seizoen,
  COUNT(*)::int AS null_count,
  (SELECT COUNT(*) FROM competitie_spelers WHERE seizoen = cs.seizoen)::int AS total
FROM competitie_spelers cs
WHERE cs.seizoen < '2025-2026' AND cs.ow_team_id IS NULL
GROUP BY cs.seizoen
ORDER BY cs.seizoen DESC;

-- ============================================
-- BONUS: Alias-dekking check
-- ============================================
-- Welke team-namen in 2025-2026 hebben geen alias?
-- Dit zijn de "onbekenden" die NULL blijven
--
SELECT DISTINCT cs.team
FROM competitie_spelers cs
LEFT JOIN team_aliases ta ON ta.seizoen = cs.seizoen AND ta.alias = cs.team
WHERE cs.seizoen = '2025-2026'
  AND cs.ow_team_id IS NULL
  AND ta.id IS NULL
ORDER BY cs.team;

-- ============================================
-- BONUS: VIEW test
-- ============================================
-- Controleer dat speler_seizoenen VIEW nog werkt
--
SELECT COUNT(*)::int AS rijen
FROM speler_seizoenen
WHERE seizoen = '2025-2026';
