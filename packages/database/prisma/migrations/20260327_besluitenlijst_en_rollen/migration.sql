-- CreateEnum
CREATE TYPE "BesluitStatus" AS ENUM ('ONDUIDELIJK', 'VOORLOPIG', 'DEFINITIEF');

-- CreateEnum
CREATE TYPE "BesluitNiveau" AS ENUM ('BESTUURLIJK', 'TECHNISCH');

-- AlterEnum: voeg COORDINATOR toe aan Rol
ALTER TYPE "Rol" ADD VALUE 'COORDINATOR';

-- AlterTable: gebruikers — voeg doelgroepen toe
ALTER TABLE "gebruikers" ADD COLUMN "doelgroepen" "Doelgroep"[] DEFAULT '{}';

-- CreateTable: StandaardVraag
CREATE TABLE "StandaardVraag" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "vraag" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandaardVraag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StandaardVraag_code_key" ON "StandaardVraag"("code");

-- CreateTable: BlauwdrukBesluit
CREATE TABLE "BlauwdrukBesluit" (
    "id" TEXT NOT NULL,
    "blauwdrukId" TEXT NOT NULL,
    "vraag" TEXT NOT NULL,
    "isStandaard" BOOLEAN NOT NULL DEFAULT false,
    "standaardCode" TEXT,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "antwoord" TEXT,
    "toelichting" TEXT,
    "status" "BesluitStatus" NOT NULL DEFAULT 'ONDUIDELIJK',
    "niveau" "BesluitNiveau" NOT NULL DEFAULT 'TECHNISCH',
    "doelgroep" "Doelgroep",
    "auteurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlauwdrukBesluit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlauwdrukBesluit_blauwdrukId_idx" ON "BlauwdrukBesluit"("blauwdrukId");

-- CreateIndex
CREATE INDEX "BlauwdrukBesluit_status_idx" ON "BlauwdrukBesluit"("status");

-- AlterTable: Actiepunt — voeg besluitId toe
ALTER TABLE "Actiepunt" ADD COLUMN "besluitId" TEXT;

-- AddForeignKey
ALTER TABLE "BlauwdrukBesluit" ADD CONSTRAINT "BlauwdrukBesluit_blauwdrukId_fkey" FOREIGN KEY ("blauwdrukId") REFERENCES "Blauwdruk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlauwdrukBesluit" ADD CONSTRAINT "BlauwdrukBesluit_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actiepunt" ADD CONSTRAINT "Actiepunt_besluitId_fkey" FOREIGN KEY ("besluitId") REFERENCES "BlauwdrukBesluit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
