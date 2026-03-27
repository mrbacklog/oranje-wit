-- Capabilities-based auth model: vervangt rol/scoutRol/isAdmin door isTC/isScout/clearance
-- Zie: .claude/plans/atomic-growing-music.md

-- Stap 1: Nieuwe kolommen toevoegen met defaults
ALTER TABLE "gebruikers" ADD COLUMN "is_tc" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "gebruikers" ADD COLUMN "is_scout" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "gebruikers" ADD COLUMN "clearance" INTEGER NOT NULL DEFAULT 0;

-- Stap 2: Data migratie — bestaande rollen naar capabilities
UPDATE "gebruikers" SET "is_tc" = true, "clearance" = 3 WHERE "rol" = 'EDITOR';
UPDATE "gebruikers" SET "is_tc" = true WHERE "is_admin" = true;
UPDATE "gebruikers" SET "is_scout" = true WHERE "scout_rol" IS NOT NULL;
UPDATE "gebruikers" SET "clearance" = 1 WHERE "rol" = 'COORDINATOR' AND "clearance" = 0;
UPDATE "gebruikers" SET "clearance" = 1 WHERE "rol" = 'REVIEWER' AND "clearance" = 0;

-- Stap 3: Drop oude kolommen
ALTER TABLE "gebruikers" DROP COLUMN "rol";
ALTER TABLE "gebruikers" DROP COLUMN "scout_rol";
ALTER TABLE "gebruikers" DROP COLUMN "is_admin";
