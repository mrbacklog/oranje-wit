-- OW Doelgroepen: vervang KNKV-categorieën door behoefteprofielen
-- + isTCKern capability op Gebruiker

-- Stap 1: Nieuwe doelgroep-waarden toevoegen
ALTER TYPE "Doelgroep" ADD VALUE 'KWEEKVIJVER';
ALTER TYPE "Doelgroep" ADD VALUE 'ONTWIKKELHART';
ALTER TYPE "Doelgroep" ADD VALUE 'TOP';
ALTER TYPE "Doelgroep" ADD VALUE 'WEDSTRIJDSPORT';
ALTER TYPE "Doelgroep" ADD VALUE 'KORFBALPLEZIER';

-- Stap 2: Bestaande waarden migreren (als er rijen zijn die de oude waarden gebruiken)
UPDATE "BlauwdrukBesluit" SET "doelgroep" = 'KWEEKVIJVER' WHERE "doelgroep" = 'WELPEN';
UPDATE "BlauwdrukBesluit" SET "doelgroep" = 'KWEEKVIJVER' WHERE "doelgroep" = 'PUPILLEN';
UPDATE "BlauwdrukBesluit" SET "doelgroep" = 'ONTWIKKELHART' WHERE "doelgroep" = 'ASPIRANTEN';
UPDATE "BlauwdrukBesluit" SET "doelgroep" = 'TOP' WHERE "doelgroep" = 'JUNIOREN';
UPDATE "BlauwdrukBesluit" SET "doelgroep" = 'WEDSTRIJDSPORT' WHERE "doelgroep" = 'SENIOREN';

UPDATE "Werkitem" SET "doelgroep" = 'KWEEKVIJVER' WHERE "doelgroep" = 'WELPEN';
UPDATE "Werkitem" SET "doelgroep" = 'KWEEKVIJVER' WHERE "doelgroep" = 'PUPILLEN';
UPDATE "Werkitem" SET "doelgroep" = 'ONTWIKKELHART' WHERE "doelgroep" = 'ASPIRANTEN';
UPDATE "Werkitem" SET "doelgroep" = 'TOP' WHERE "doelgroep" = 'JUNIOREN';
UPDATE "Werkitem" SET "doelgroep" = 'WEDSTRIJDSPORT' WHERE "doelgroep" = 'SENIOREN';

-- Stap 3: Oude enum-waarden kunnen niet verwijderd worden in PostgreSQL
-- (ALTER TYPE ... DROP VALUE bestaat niet). De oude waarden blijven bestaan
-- maar worden niet meer gebruikt. Het Prisma schema definieert alleen de nieuwe waarden.

-- Stap 4: isTCKern op Gebruiker
ALTER TABLE "gebruikers" ADD COLUMN "is_tc_kern" BOOLEAN NOT NULL DEFAULT false;

-- Bestaande TC-leden met clearance 3 worden TC-kern
UPDATE "gebruikers" SET "is_tc_kern" = true WHERE "is_tc" = true AND "clearance" >= 3;
