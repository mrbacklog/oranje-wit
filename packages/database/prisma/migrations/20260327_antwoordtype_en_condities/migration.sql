-- Gestructureerde invoer voor standaardvragen en besluiten

-- CreateEnum
CREATE TYPE "AntwoordType" AS ENUM ('TEKST', 'GETAL', 'JA_NEE', 'KEUZE', 'GETAL_RANGE');

-- AlterTable: StandaardVraag — antwoordType, opties, toonAls, rename categorie→groep
ALTER TABLE "StandaardVraag" ADD COLUMN "antwoordType" "AntwoordType" NOT NULL DEFAULT 'TEKST';
ALTER TABLE "StandaardVraag" ADD COLUMN "opties" TEXT[] DEFAULT '{}';
ALTER TABLE "StandaardVraag" ADD COLUMN "toonAls" JSONB;
ALTER TABLE "StandaardVraag" RENAME COLUMN "categorie" TO "groep";

-- AlterTable: BlauwdrukBesluit — antwoordType, antwoordWaarde, opties, toonAls, groep
ALTER TABLE "BlauwdrukBesluit" ADD COLUMN "antwoordType" "AntwoordType" NOT NULL DEFAULT 'TEKST';
ALTER TABLE "BlauwdrukBesluit" ADD COLUMN "antwoordWaarde" JSONB;
ALTER TABLE "BlauwdrukBesluit" ADD COLUMN "opties" TEXT[] DEFAULT '{}';
ALTER TABLE "BlauwdrukBesluit" ADD COLUMN "toonAls" JSONB;
ALTER TABLE "BlauwdrukBesluit" ADD COLUMN "groep" TEXT;
