-- AlterEnum
ALTER TYPE "PinType" ADD VALUE 'SPELER_GEPIND';

-- CreateTable
CREATE TABLE "reserveringsspelers" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "geslacht" "Geslacht" NOT NULL,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reserveringsspelers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reserveringsspelers" ADD CONSTRAINT "reserveringsspelers_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
