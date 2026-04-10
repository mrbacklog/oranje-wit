-- AlterTable: voeg memo-velden toe aan Team
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "notitie" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "memoStatus" TEXT NOT NULL DEFAULT 'gesloten';
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "besluit" TEXT;

-- AlterTable: voeg memo-velden toe aan Speler
ALTER TABLE "Speler" ADD COLUMN IF NOT EXISTS "memoStatus" TEXT NOT NULL DEFAULT 'gesloten';
ALTER TABLE "Speler" ADD COLUMN IF NOT EXISTS "besluit" TEXT;
