-- ============================================================
-- Hernoem Blauwdruk → Kaders (tabellen, kolommen, indexen, FK's)
-- De @@map directives in schema.prisma zorgen dat de DB-tabelnamen
-- behouden blijven totdat deze migratie draait.
-- Na deze migratie matchen de schema-namen (Kaders/KadersSpeler/KadersBesluit)
-- met de daadwerkelijke DB-tabelnamen.
-- ============================================================

-- Stap 1: Drop FK-constraints die refereren naar "Blauwdruk"
ALTER TABLE "BlauwdrukSpeler" DROP CONSTRAINT IF EXISTS "BlauwdrukSpeler_blauwdrukId_fkey";
ALTER TABLE "BlauwdrukBesluit" DROP CONSTRAINT IF EXISTS "BlauwdrukBesluit_blauwdrukId_fkey";
ALTER TABLE "Pin"              DROP CONSTRAINT IF EXISTS "Pin_blauwdrukId_fkey";
ALTER TABLE "werkindelingen"   DROP CONSTRAINT IF EXISTS "werkindelingen_blauwdrukId_fkey";
ALTER TABLE "Werkitem"         DROP CONSTRAINT IF EXISTS "Werkitem_blauwdrukId_fkey";
ALTER TABLE "Actiepunt"        DROP CONSTRAINT IF EXISTS "Actiepunt_blauwdrukId_fkey";
ALTER TABLE "Activiteit"       DROP CONSTRAINT IF EXISTS "Activiteit_blauwdrukId_fkey";

-- Stap 2: Drop oude indexen op blauwdrukId-kolommen
DROP INDEX IF EXISTS "BlauwdrukSpeler_blauwdrukId_idx";
DROP INDEX IF EXISTS "BlauwdrukSpeler_blauwdrukId_spelerId_key";
DROP INDEX IF EXISTS "BlauwdrukBesluit_blauwdrukId_idx";
DROP INDEX IF EXISTS "Pin_blauwdrukId_idx";
DROP INDEX IF EXISTS "werkindelingen_blauwdrukId_idx";
DROP INDEX IF EXISTS "Werkitem_blauwdrukId_idx";
DROP INDEX IF EXISTS "Actiepunt_blauwdrukId_idx";
DROP INDEX IF EXISTS "Activiteit_blauwdrukId_idx";

-- Stap 3: Hernoem de FK-kolommen in child-tabellen
ALTER TABLE "BlauwdrukSpeler" RENAME COLUMN "blauwdrukId" TO "kadersId";
ALTER TABLE "BlauwdrukBesluit" RENAME COLUMN "blauwdrukId" TO "kadersId";
ALTER TABLE "Pin"              RENAME COLUMN "blauwdrukId" TO "kadersId";
ALTER TABLE "werkindelingen"   RENAME COLUMN "blauwdrukId" TO "kadersId";
ALTER TABLE "Werkitem"         RENAME COLUMN "blauwdrukId" TO "kadersId";
ALTER TABLE "Actiepunt"        RENAME COLUMN "blauwdrukId" TO "kadersId";
ALTER TABLE "Activiteit"       RENAME COLUMN "blauwdrukId" TO "kadersId";

-- Stap 4: Hernoem de tabellen zelf
ALTER TABLE "Blauwdruk"        RENAME TO "Kaders";
ALTER TABLE "BlauwdrukSpeler"  RENAME TO "KadersSpeler";
ALTER TABLE "BlauwdrukBesluit" RENAME TO "KadersBesluit";

-- Stap 5: Hernoem de primary-key constraints
ALTER TABLE "Kaders"       RENAME CONSTRAINT "Blauwdruk_pkey"        TO "Kaders_pkey";
ALTER TABLE "KadersSpeler" RENAME CONSTRAINT "BlauwdrukSpeler_pkey"  TO "KadersSpeler_pkey";
ALTER TABLE "KadersBesluit" RENAME CONSTRAINT "BlauwdrukBesluit_pkey" TO "KadersBesluit_pkey";

-- Stap 6: Maak nieuwe indexen aan op kadersId-kolommen
CREATE INDEX "KadersSpeler_kadersId_idx" ON "KadersSpeler"("kadersId");
CREATE UNIQUE INDEX "KadersSpeler_kadersId_spelerId_key" ON "KadersSpeler"("kadersId", "spelerId");
CREATE INDEX "KadersBesluit_kadersId_idx" ON "KadersBesluit"("kadersId");
CREATE INDEX "Pin_kadersId_idx" ON "Pin"("kadersId");
CREATE INDEX "werkindelingen_kadersId_idx" ON "werkindelingen"("kadersId");
CREATE INDEX "Werkitem_kadersId_idx" ON "Werkitem"("kadersId");
CREATE INDEX "Actiepunt_kadersId_idx" ON "Actiepunt"("kadersId");
CREATE INDEX "Activiteit_kadersId_idx" ON "Activiteit"("kadersId");

-- Stap 7: Herstel FK-constraints met nieuwe namen
ALTER TABLE "KadersSpeler" ADD CONSTRAINT "KadersSpeler_kadersId_fkey"
    FOREIGN KEY ("kadersId") REFERENCES "Kaders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KadersBesluit" ADD CONSTRAINT "KadersBesluit_kadersId_fkey"
    FOREIGN KEY ("kadersId") REFERENCES "Kaders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Pin" ADD CONSTRAINT "Pin_kadersId_fkey"
    FOREIGN KEY ("kadersId") REFERENCES "Kaders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "werkindelingen" ADD CONSTRAINT "werkindelingen_kadersId_fkey"
    FOREIGN KEY ("kadersId") REFERENCES "Kaders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Werkitem" ADD CONSTRAINT "Werkitem_kadersId_fkey"
    FOREIGN KEY ("kadersId") REFERENCES "Kaders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Actiepunt" ADD CONSTRAINT "Actiepunt_kadersId_fkey"
    FOREIGN KEY ("kadersId") REFERENCES "Kaders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Activiteit" ADD CONSTRAINT "Activiteit_kadersId_fkey"
    FOREIGN KEY ("kadersId") REFERENCES "Kaders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Stap 8: Hernoem de unieke index op BlauwdrukSpeler.seizoen → Kaders.seizoen
ALTER TABLE "Kaders" RENAME CONSTRAINT "Blauwdruk_seizoen_key" TO "Kaders_seizoen_key";
