-- =============================================================
-- VIEW: speler_seizoenen
-- Afgeleid uit competitie_spelers via DISTINCT ON (rel_code, seizoen)
-- Prioriteit: veld_najaar (1) > zaal (2) > veld_voorjaar (3)
--
-- Deze VIEW staat NIET in het Prisma schema — Prisma kent hem niet.
-- Bij elke migratie moet gecontroleerd worden of de VIEW nog bestaat.
-- =============================================================

CREATE OR REPLACE VIEW speler_seizoenen AS
SELECT DISTINCT ON (cp.rel_code, cp.seizoen)
  cp.rel_code,
  cp.seizoen,
  cp.team,
  cp.competitie,
  cp.geslacht
FROM competitie_spelers cp
ORDER BY cp.rel_code, cp.seizoen,
  CASE cp.competitie
    WHEN 'veld_najaar'  THEN 1
    WHEN 'zaal'         THEN 2
    WHEN 'veld_voorjaar' THEN 3
    ELSE 4
  END;
