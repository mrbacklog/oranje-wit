-- =============================================================
-- Migratie: Soft delete + snapshot voor Scenario's
-- Datum: 2026-03-12
-- Doel: Scenario-data beschermen tegen accidenteel verlies
-- LET OP: Handmatig — we gebruiken GEEN db:push (dat dropt de speler_seizoenen VIEW)
-- =============================================================

BEGIN;

-- 1. Soft delete veld op Scenario
ALTER TABLE "Scenario" ADD COLUMN IF NOT EXISTS "verwijderdOp" TIMESTAMPTZ;

-- 2. Partial index voor snelle filtering (NULL = actief)
CREATE INDEX IF NOT EXISTS "Scenario_verwijderdOp_actief_idx"
  ON "Scenario" ("verwijderdOp")
  WHERE "verwijderdOp" IS NULL;

-- 3. ScenarioSnapshot tabel (geen FK naar Scenario — snapshot overleeft hard-delete)
CREATE TABLE IF NOT EXISTS "ScenarioSnapshot" (
  "id"            TEXT NOT NULL,
  "scenarioId"    TEXT NOT NULL,
  "naam"          TEXT NOT NULL,
  "reden"         TEXT NOT NULL,
  "data"          JSONB NOT NULL,
  "aantalTeams"   INTEGER NOT NULL DEFAULT 0,
  "aantalSpelers" INTEGER NOT NULL DEFAULT 0,
  "auteur"        TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ScenarioSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ScenarioSnapshot_scenarioId_idx"
  ON "ScenarioSnapshot" ("scenarioId");

COMMIT;
