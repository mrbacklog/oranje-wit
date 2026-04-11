-- CreateEnum: LogActie voor werkitem activiteitlog
DO $$ BEGIN
  CREATE TYPE "LogActie" AS ENUM ('AANGEMAAKT', 'BEWERKT', 'STATUS_GEWIJZIGD', 'VERWIJDERD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: WerkitemToelichting
CREATE TABLE IF NOT EXISTS "WerkitemToelichting" (
    "id" TEXT NOT NULL,
    "werkitemId" TEXT NOT NULL,
    "auteurNaam" TEXT NOT NULL,
    "auteurEmail" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WerkitemToelichting_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WerkitemLog
CREATE TABLE IF NOT EXISTS "WerkitemLog" (
    "id" TEXT NOT NULL,
    "werkitemId" TEXT NOT NULL,
    "auteurNaam" TEXT NOT NULL,
    "auteurEmail" TEXT NOT NULL,
    "actie" "LogActie" NOT NULL,
    "detail" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WerkitemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WerkitemToelichting_werkitemId_idx" ON "WerkitemToelichting"("werkitemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WerkitemLog_werkitemId_idx" ON "WerkitemLog"("werkitemId");

-- AddForeignKey: WerkitemToelichting -> Werkitem
DO $$ BEGIN
  ALTER TABLE "WerkitemToelichting"
    ADD CONSTRAINT "WerkitemToelichting_werkitemId_fkey"
    FOREIGN KEY ("werkitemId")
    REFERENCES "Werkitem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: WerkitemLog -> Werkitem
DO $$ BEGIN
  ALTER TABLE "WerkitemLog"
    ADD CONSTRAINT "WerkitemLog_werkitemId_fkey"
    FOREIGN KEY ("werkitemId")
    REFERENCES "Werkitem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
