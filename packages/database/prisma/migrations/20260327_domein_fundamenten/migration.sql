-- Domein-fundamenten: SeizoenStatus + Aanmelding
-- Migratie voor beheer-app domeinen Jaarplanning en Werving

-- 0. Drop VIEW speler_seizoenen om kolom-conflicten te voorkomen
DROP VIEW IF EXISTS speler_seizoenen;

-- 1. SeizoenStatus enum + status kolom op seizoenen
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SeizoenStatus') THEN
    CREATE TYPE "SeizoenStatus" AS ENUM ('VOORBEREIDING', 'ACTIEF', 'AFGEROND');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seizoenen' AND column_name = 'status') THEN
    ALTER TABLE "seizoenen" ADD COLUMN "status" "SeizoenStatus" NOT NULL DEFAULT 'VOORBEREIDING';
  END IF;
END $$;

-- 2. AanmeldingStatus enum + aanmeldingen tabel
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AanmeldingStatus') THEN
    CREATE TYPE "AanmeldingStatus" AS ENUM ('AANMELDING', 'PROEFLES', 'INTAKE', 'LID', 'AFGEHAAKT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "aanmeldingen" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "email" TEXT,
    "telefoon" TEXT,
    "geboortejaar" INTEGER,
    "opmerking" TEXT,
    "status" "AanmeldingStatus" NOT NULL DEFAULT 'AANMELDING',
    "bron" TEXT,
    "ledenadmin" TEXT,
    "trainer" TEXT,
    "tc_lid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aanmeldingen_pkey" PRIMARY KEY ("id")
);

-- 3. Herstel VIEW speler_seizoenen
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
