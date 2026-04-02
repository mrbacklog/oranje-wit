-- CreateTable: coördinator-wijzigingsvoorstellen
CREATE TABLE "coordinator_voorstellen" (
  "id"            TEXT NOT NULL,
  "coordinatorId" TEXT NOT NULL,
  "type"          TEXT NOT NULL,
  "omschrijving"  TEXT NOT NULL,
  "spelerId"      TEXT,
  "teamNaam"      TEXT,
  "seizoen"       TEXT NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'OPEN',
  "toelichting"   TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "coordinator_voorstellen_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "coordinator_voorstellen"
  ADD CONSTRAINT "coordinator_voorstellen_coordinatorId_fkey"
  FOREIGN KEY ("coordinatorId") REFERENCES "coordinatoren"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "coordinator_voorstellen_coordinatorId_idx" ON "coordinator_voorstellen"("coordinatorId");
CREATE INDEX "coordinator_voorstellen_seizoen_idx" ON "coordinator_voorstellen"("seizoen");
CREATE INDEX "coordinator_voorstellen_status_idx" ON "coordinator_voorstellen"("status");
