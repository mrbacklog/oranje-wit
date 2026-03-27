-- Vaardigheidsraamwerk v3.0 + USS v2
-- Pijlerevolutie, variabele pijlers, fysiek profiel, USS-cache, vergelijkende scouting
-- IDEMPOTENT: alle statements zijn veilig om meerdere keren uit te voeren

-- 0. Drop VIEW speler_seizoenen om kolom-conflicten te voorkomen
DROP VIEW IF EXISTS speler_seizoenen;

-- ══════════════════════════════════════════════════════════════
-- 1. Pijler — voeg blok en gewicht toe
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pijlers' AND column_name = 'blok') THEN
    ALTER TABLE "pijlers" ADD COLUMN "blok" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pijlers' AND column_name = 'gewicht') THEN
    ALTER TABLE "pijlers" ADD COLUMN "gewicht" DECIMAL(4, 2);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 2. OntwikkelItem — voeg is_kern, categorie, observatie toe
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ontwikkel_items' AND column_name = 'is_kern') THEN
    ALTER TABLE "ontwikkel_items" ADD COLUMN "is_kern" BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ontwikkel_items' AND column_name = 'categorie') THEN
    ALTER TABLE "ontwikkel_items" ADD COLUMN "categorie" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ontwikkel_items' AND column_name = 'observatie') THEN
    ALTER TABLE "ontwikkel_items" ADD COLUMN "observatie" TEXT;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 3. Leeftijdsgroep — voeg USS v2 schaalparameters toe
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leeftijdsgroepen' AND column_name = 'schaal_min') THEN
    ALTER TABLE "leeftijdsgroepen" ADD COLUMN "schaal_min" DECIMAL(4, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leeftijdsgroepen' AND column_name = 'schaal_max') THEN
    ALTER TABLE "leeftijdsgroepen" ADD COLUMN "schaal_max" DECIMAL(4, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leeftijdsgroepen' AND column_name = 'schaal_mediaan') THEN
    ALTER TABLE "leeftijdsgroepen" ADD COLUMN "schaal_mediaan" DECIMAL(4, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leeftijdsgroepen' AND column_name = 'halve_bereik') THEN
    ALTER TABLE "leeftijdsgroepen" ADD COLUMN "halve_bereik" DECIMAL(4, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leeftijdsgroepen' AND column_name = 'bandbreedte_coach') THEN
    ALTER TABLE "leeftijdsgroepen" ADD COLUMN "bandbreedte_coach" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leeftijdsgroepen' AND column_name = 'bandbreedte_scout') THEN
    ALTER TABLE "leeftijdsgroepen" ADD COLUMN "bandbreedte_scout" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leeftijdsgroepen' AND column_name = 'kern_items_target') THEN
    ALTER TABLE "leeftijdsgroepen" ADD COLUMN "kern_items_target" INTEGER;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 4. SpelersKaart — voeg pijlerScores (JSON) en leeftijdsgroep toe
--    Bestaande kolommen worden nullable (backward compatible)
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spelers_kaarten' AND column_name = 'pijlerScores') THEN
    ALTER TABLE "spelers_kaarten" ADD COLUMN "pijlerScores" JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spelers_kaarten' AND column_name = 'leeftijdsgroep') THEN
    ALTER TABLE "spelers_kaarten" ADD COLUMN "leeftijdsgroep" TEXT;
  END IF;
END $$;

-- Maak oude vaste kolommen nullable (idempotent: DROP NOT NULL is veilig als al nullable)
ALTER TABLE "spelers_kaarten" ALTER COLUMN "schot" DROP NOT NULL;
ALTER TABLE "spelers_kaarten" ALTER COLUMN "aanval" DROP NOT NULL;
ALTER TABLE "spelers_kaarten" ALTER COLUMN "passing" DROP NOT NULL;
ALTER TABLE "spelers_kaarten" ALTER COLUMN "verdediging" DROP NOT NULL;
ALTER TABLE "spelers_kaarten" ALTER COLUMN "fysiek" DROP NOT NULL;
ALTER TABLE "spelers_kaarten" ALTER COLUMN "mentaal" DROP NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- 5. Enums voor FysiekProfiel
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LengteRelatief') THEN
    CREATE TYPE "LengteRelatief" AS ENUM ('ONDER_GEMIDDELD', 'GEMIDDELD', 'BOVENGEMIDDELD', 'UITZONDERLIJK');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Lichaamsbouw') THEN
    CREATE TYPE "Lichaamsbouw" AS ENUM ('LICHT', 'GEMIDDELD_LB', 'STEVIG');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AtetischType') THEN
    CREATE TYPE "AtetischType" AS ENUM ('ONDER_GEMIDDELD_AT', 'GEMIDDELD_AT', 'BOVENGEMIDDELD_AT', 'UITZONDERLIJK_AT');
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 6. FysiekProfiel
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "fysiek_profielen" (
    "id" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "scoutId" TEXT,
    "lengte" "LengteRelatief",
    "lichaamsbouw" "Lichaamsbouw",
    "atletisch_type" "AtetischType",
    "opmerking" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fysiek_profielen_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fysiek_profielen_spelerId_seizoen_key" ON "fysiek_profielen"("spelerId", "seizoen");
CREATE INDEX IF NOT EXISTS "fysiek_profielen_spelerId_idx" ON "fysiek_profielen"("spelerId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fysiek_profielen_spelerId_fkey') THEN
    ALTER TABLE "fysiek_profielen" ADD CONSTRAINT "fysiek_profielen_spelerId_fkey"
      FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fysiek_profielen_scoutId_fkey') THEN
    ALTER TABLE "fysiek_profielen" ADD CONSTRAINT "fysiek_profielen_scoutId_fkey"
      FOREIGN KEY ("scoutId") REFERENCES "scouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 7. SpelerUSS — drop en recreate (0 records, oud schema via db:push had afwijkende kolommen)
-- ══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS "speler_uss" CASCADE;

CREATE TABLE "speler_uss" (
    "id" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "leeftijdsgroep" TEXT NOT NULL,
    "uss_overall" INTEGER,
    "uss_pijlers" JSONB,
    "uss_coach" INTEGER,
    "uss_scout" INTEGER,
    "uss_vergelijking" INTEGER,
    "uss_team" INTEGER,
    "uss_basislijn" INTEGER,
    "uss_coach_pijlers" JSONB,
    "uss_scout_pijlers" JSONB,
    "uss_vergelijking_pijlers" JSONB,
    "aantal_coach_sessies" INTEGER NOT NULL DEFAULT 0,
    "aantal_scout_sessies" INTEGER NOT NULL DEFAULT 0,
    "aantal_vergelijkingen" INTEGER NOT NULL DEFAULT 0,
    "betrouwbaarheid" TEXT NOT NULL DEFAULT 'concept',
    "cross_validatie_signalen" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speler_uss_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "speler_uss_spelerId_seizoen_key" ON "speler_uss"("spelerId", "seizoen");
CREATE INDEX "speler_uss_spelerId_idx" ON "speler_uss"("spelerId");
CREATE INDEX "speler_uss_seizoen_idx" ON "speler_uss"("seizoen");

ALTER TABLE "speler_uss" ADD CONSTRAINT "speler_uss_spelerId_fkey"
    FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- 8. ScoutingVergelijking + posities — drop en recreate (0 records, oud schema via db:push afwijkend)
-- ══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS "scouting_vergelijking_posities" CASCADE;
DROP TABLE IF EXISTS "scouting_vergelijkingen" CASCADE;

CREATE TABLE "scouting_vergelijkingen" (
    "id" TEXT NOT NULL,
    "scoutId" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" "ScoutingContext" NOT NULL,
    "opmerking" TEXT,
    "team_id" INTEGER,
    "verzoek_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scouting_vergelijkingen_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scouting_vergelijkingen_seizoen_idx" ON "scouting_vergelijkingen"("seizoen");
CREATE INDEX "scouting_vergelijkingen_scoutId_idx" ON "scouting_vergelijkingen"("scoutId");

ALTER TABLE "scouting_vergelijkingen" ADD CONSTRAINT "scouting_vergelijkingen_scoutId_fkey"
    FOREIGN KEY ("scoutId") REFERENCES "scouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "scouting_vergelijking_posities" (
    "id" TEXT NOT NULL,
    "vergelijking_id" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "pijler_code" TEXT NOT NULL,
    "balk_positie" DECIMAL(5, 2) NOT NULL,
    "is_anker" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "scouting_vergelijking_posities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scouting_vergelijking_posities_vergelijking_id_spelerId_pijl_key"
    ON "scouting_vergelijking_posities"("vergelijking_id", "spelerId", "pijler_code");
CREATE INDEX "scouting_vergelijking_posities_vergelijking_id_idx"
    ON "scouting_vergelijking_posities"("vergelijking_id");
CREATE INDEX "scouting_vergelijking_posities_spelerId_idx"
    ON "scouting_vergelijking_posities"("spelerId");

ALTER TABLE "scouting_vergelijking_posities" ADD CONSTRAINT "scouting_vergelijking_posities_vergelijking_id_fkey"
    FOREIGN KEY ("vergelijking_id") REFERENCES "scouting_vergelijkingen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "scouting_vergelijking_posities" ADD CONSTRAINT "scouting_vergelijking_posities_spelerId_fkey"
    FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- 9. Herstel VIEW speler_seizoenen
-- ══════════════════════════════════════════════════════════════

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
