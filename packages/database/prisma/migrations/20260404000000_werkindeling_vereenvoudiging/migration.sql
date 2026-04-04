-- Migreer werkindelingen van scenarios naar nieuwe tabel
-- (uitgevoerd VOOR de structurele wijzigingen)

-- CreateEnum
CREATE TYPE "WerkindelingStatus" AS ENUM ('ACTIEF', 'GEARCHIVEERD', 'DEFINITIEF');

-- CreateTable
CREATE TABLE "werkindelingen" (
    "id" TEXT NOT NULL,
    "blauwdrukId" TEXT NOT NULL,
    "naam" TEXT NOT NULL DEFAULT 'Werkindeling',
    "toelichting" TEXT,
    "status" "WerkindelingStatus" NOT NULL DEFAULT 'ACTIEF',
    "verwijderdOp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "werkindelingen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "werkindeling_snapshots" (
    "id" TEXT NOT NULL,
    "werkindelingId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "reden" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "aantalTeams" INTEGER NOT NULL DEFAULT 0,
    "aantalSpelers" INTEGER NOT NULL DEFAULT 0,
    "auteur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "werkindeling_snapshots_pkey" PRIMARY KEY ("id")
);

-- Migreer werkindelingen van scenarios naar nieuwe tabel
INSERT INTO "werkindelingen" (id, "blauwdrukId", naam, toelichting, status, "verwijderdOp", "createdAt", "updatedAt")
SELECT s.id, c."blauwdrukId", s.naam, s.toelichting,
       s.status::text::"WerkindelingStatus",
       s."verwijderdOp", s."createdAt", s."updatedAt"
FROM "Scenario" s
JOIN "Concept" c ON c.id = s."conceptId"
WHERE s."isWerkindeling" = true
ON CONFLICT (id) DO NOTHING;

-- Hernoem scenarioId kolom in Versie
ALTER TABLE "Versie" RENAME COLUMN "scenarioId" TO "werkindelingId";

-- Hernoem scenarioId kolom in Werkitem
ALTER TABLE "Werkitem" RENAME COLUMN "scenarioId" TO "werkindelingId";

-- Drop de partial unique index op Scenario
DROP INDEX IF EXISTS "idx_scenario_werkindeling_per_concept";

-- Drop FK constraints die naar Scenario verwijzen (Versie, WhatIf, Werkitem)
ALTER TABLE "Versie" DROP CONSTRAINT IF EXISTS "Versie_scenarioId_fkey";
ALTER TABLE "what_ifs" DROP CONSTRAINT IF EXISTS "what_ifs_werkindelingId_fkey";
ALTER TABLE "Werkitem" DROP CONSTRAINT IF EXISTS "Werkitem_scenarioId_fkey";

-- Drop unieke index op Versie (scenarioId, nummer)
DROP INDEX IF EXISTS "Versie_scenarioId_nummer_key";

-- AddForeignKey van Versie naar werkindelingen
ALTER TABLE "Versie" ADD CONSTRAINT "Versie_werkindelingId_fkey"
    FOREIGN KEY ("werkindelingId") REFERENCES "werkindelingen"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey van what_ifs naar werkindelingen
ALTER TABLE "what_ifs" ADD CONSTRAINT "what_ifs_werkindelingId_fkey"
    FOREIGN KEY ("werkindelingId") REFERENCES "werkindelingen"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey van Werkitem naar werkindelingen
ALTER TABLE "Werkitem" ADD CONSTRAINT "Werkitem_werkindelingId_fkey"
    FOREIGN KEY ("werkindelingId") REFERENCES "werkindelingen"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey van werkindelingen naar Blauwdruk
ALTER TABLE "werkindelingen" ADD CONSTRAINT "werkindelingen_blauwdrukId_fkey"
    FOREIGN KEY ("blauwdrukId") REFERENCES "Blauwdruk"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "werkindelingen_blauwdrukId_idx" ON "werkindelingen"("blauwdrukId");
CREATE INDEX "werkindeling_snapshots_werkindelingId_idx" ON "werkindeling_snapshots"("werkindelingId");

-- CreateIndex uniek (werkindelingId, nummer) op Versie
CREATE UNIQUE INDEX "Versie_werkindelingId_nummer_key" ON "Versie"("werkindelingId", "nummer");

-- CreateIndex
CREATE INDEX "Versie_werkindelingId_idx" ON "Versie"("werkindelingId");

-- DropTable Scenario, Concept en ScenarioSnapshot (na data-migratie)
DROP TABLE IF EXISTS "ScenarioSnapshot";
DROP TABLE IF EXISTS "Scenario";
DROP TABLE IF EXISTS "Concept";

-- DropEnum
DROP TYPE IF EXISTS "ConceptStatus";
DROP TYPE IF EXISTS "ScenarioStatus";
