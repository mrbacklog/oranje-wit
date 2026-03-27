-- CreateEnum
CREATE TYPE "GezienStatus" AS ENUM ('ONGEZIEN', 'GROEN', 'GEEL', 'ORANJE', 'ROOD');

-- CreateTable
CREATE TABLE "BlauwdrukSpeler" (
    "id" TEXT NOT NULL,
    "blauwdrukId" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "gezienStatus" "GezienStatus" NOT NULL DEFAULT 'ONGEZIEN',
    "notitie" TEXT,
    "signalering" TEXT,
    "actiepuntId" TEXT,
    "gezienDoorId" TEXT,
    "gezienOp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlauwdrukSpeler_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlauwdrukSpeler_actiepuntId_key" ON "BlauwdrukSpeler"("actiepuntId");

-- CreateIndex
CREATE INDEX "BlauwdrukSpeler_blauwdrukId_idx" ON "BlauwdrukSpeler"("blauwdrukId");

-- CreateIndex
CREATE INDEX "BlauwdrukSpeler_spelerId_idx" ON "BlauwdrukSpeler"("spelerId");

-- CreateIndex
CREATE INDEX "BlauwdrukSpeler_gezienStatus_idx" ON "BlauwdrukSpeler"("gezienStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BlauwdrukSpeler_blauwdrukId_spelerId_key" ON "BlauwdrukSpeler"("blauwdrukId", "spelerId");

-- AddForeignKey
ALTER TABLE "BlauwdrukSpeler" ADD CONSTRAINT "BlauwdrukSpeler_blauwdrukId_fkey" FOREIGN KEY ("blauwdrukId") REFERENCES "Blauwdruk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlauwdrukSpeler" ADD CONSTRAINT "BlauwdrukSpeler_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlauwdrukSpeler" ADD CONSTRAINT "BlauwdrukSpeler_actiepuntId_fkey" FOREIGN KEY ("actiepuntId") REFERENCES "Actiepunt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlauwdrukSpeler" ADD CONSTRAINT "BlauwdrukSpeler_gezienDoorId_fkey" FOREIGN KEY ("gezienDoorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
