-- CreateEnum
CREATE TYPE "CatalogusStatus" AS ENUM ('CONCEPT', 'ACTIEF', 'GEARCHIVEERD');

-- CreateTable: catalogus_versies
CREATE TABLE "catalogus_versies" (
    "id" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "status" "CatalogusStatus" NOT NULL DEFAULT 'CONCEPT',
    "opmerking" TEXT,
    "bron_versie_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gepubliceerd_op" TIMESTAMP(3),

    CONSTRAINT "catalogus_versies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: catalogus_groepen
CREATE TABLE "catalogus_groepen" (
    "id" TEXT NOT NULL,
    "versie_id" TEXT NOT NULL,
    "band" TEXT NOT NULL,
    "schaal_type" TEXT NOT NULL,
    "max_score" INTEGER NOT NULL,
    "doel_aantal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "catalogus_groepen_pkey" PRIMARY KEY ("id")
);

-- CreateTable: catalogus_pijlers
CREATE TABLE "catalogus_pijlers" (
    "id" TEXT NOT NULL,
    "groep_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "icoon" TEXT,
    "volgorde" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "catalogus_pijlers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: catalogus_items
CREATE TABLE "catalogus_items" (
    "id" TEXT NOT NULL,
    "pijler_id" TEXT NOT NULL,
    "item_code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "vraag_tekst" TEXT NOT NULL,
    "laag" TEXT,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "voorloper_id" TEXT,

    CONSTRAINT "catalogus_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalogus_versies_seizoen_key" ON "catalogus_versies"("seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "catalogus_groepen_versie_id_band_key" ON "catalogus_groepen"("versie_id", "band");

-- CreateIndex
CREATE UNIQUE INDEX "catalogus_pijlers_groep_id_code_key" ON "catalogus_pijlers"("groep_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "catalogus_items_pijler_id_item_code_key" ON "catalogus_items"("pijler_id", "item_code");

-- CreateIndex
CREATE INDEX "catalogus_items_pijler_id_volgorde_idx" ON "catalogus_items"("pijler_id", "volgorde");

-- AddForeignKey
ALTER TABLE "catalogus_groepen" ADD CONSTRAINT "catalogus_groepen_versie_id_fkey" FOREIGN KEY ("versie_id") REFERENCES "catalogus_versies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogus_pijlers" ADD CONSTRAINT "catalogus_pijlers_groep_id_fkey" FOREIGN KEY ("groep_id") REFERENCES "catalogus_groepen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogus_items" ADD CONSTRAINT "catalogus_items_pijler_id_fkey" FOREIGN KEY ("pijler_id") REFERENCES "catalogus_pijlers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (self-referential: meegroei voorloper)
ALTER TABLE "catalogus_items" ADD CONSTRAINT "catalogus_items_voorloper_id_fkey" FOREIGN KEY ("voorloper_id") REFERENCES "catalogus_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
