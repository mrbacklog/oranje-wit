-- AlterTable
ALTER TABLE "Scenario" ADD COLUMN "isWerkindeling" BOOLEAN NOT NULL DEFAULT false;

-- Data-migratie: promoveer het meest recente DEFINITIEF of ACTIEF scenario per blauwdruk tot werkindeling
WITH ranked AS (
  SELECT
    s.id,
    c."blauwdrukId",
    ROW_NUMBER() OVER (
      PARTITION BY c."blauwdrukId"
      ORDER BY
        CASE WHEN s.status = 'DEFINITIEF' THEN 0 ELSE 1 END,
        s."createdAt" DESC
    ) as rn
  FROM "Scenario" s
  JOIN "Concept" c ON c.id = s."conceptId"
  WHERE s."verwijderdOp" IS NULL
)
UPDATE "Scenario"
SET "isWerkindeling" = true
FROM ranked
WHERE "Scenario".id = ranked.id AND ranked.rn = 1;

-- Partial unique index: max 1 werkindeling per concept
CREATE UNIQUE INDEX "idx_scenario_werkindeling_per_concept"
ON "Scenario" ("conceptId")
WHERE "isWerkindeling" = true;
