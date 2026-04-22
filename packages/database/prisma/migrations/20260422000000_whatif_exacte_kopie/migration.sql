-- What-if wordt een exacte kopie van de werkindeling.
-- Drie nieuwe velden:
-- 1. what_ifs.posities (JSON)     — canvas-posities per team in deze variant
-- 2. what_if_teams.selectieGroepBronId (TEXT, nullable)
--                                   — id van de SelectieGroep in de werkversie
--                                     waar dit team oorspronkelijk bij hoorde
-- 3. what_if_teams.selectieNaam   — naam van de pool (snapshot)
-- 4. what_if_teams.gebundeld      — stond het team in een gebundelde pool?
--
-- Alle velden zijn optioneel / hebben defaults, dus veilig op bestaande data.

-- AlterTable
ALTER TABLE "what_ifs" ADD COLUMN "posities" JSONB;

-- AlterTable
ALTER TABLE "what_if_teams" ADD COLUMN "selectieGroepBronId" TEXT;
ALTER TABLE "what_if_teams" ADD COLUMN "selectieNaam" TEXT;
ALTER TABLE "what_if_teams" ADD COLUMN "gebundeld" BOOLEAN NOT NULL DEFAULT false;
