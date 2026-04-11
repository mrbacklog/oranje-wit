-- AlterEnum
ALTER TYPE "WerkitemType" ADD VALUE 'MEMO';

-- AlterTable
ALTER TABLE "Werkitem" ADD COLUMN     "teamId" TEXT,
ALTER COLUMN "titel" DROP NOT NULL;

-- AlterTable
ALTER TABLE "coordinator_voorstellen" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameForeignKey
ALTER TABLE "KadersBesluit" RENAME CONSTRAINT "BlauwdrukBesluit_auteurId_fkey" TO "KadersBesluit_auteurId_fkey";

-- RenameForeignKey
ALTER TABLE "KadersSpeler" RENAME CONSTRAINT "BlauwdrukSpeler_actiepuntId_fkey" TO "KadersSpeler_actiepuntId_fkey";

-- RenameForeignKey
ALTER TABLE "KadersSpeler" RENAME CONSTRAINT "BlauwdrukSpeler_gezienDoorId_fkey" TO "KadersSpeler_gezienDoorId_fkey";

-- RenameForeignKey
ALTER TABLE "KadersSpeler" RENAME CONSTRAINT "BlauwdrukSpeler_spelerId_fkey" TO "KadersSpeler_spelerId_fkey";

-- AddForeignKey
ALTER TABLE "Werkitem" ADD CONSTRAINT "Werkitem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "BlauwdrukBesluit_status_idx" RENAME TO "KadersBesluit_status_idx";

-- RenameIndex
ALTER INDEX "BlauwdrukSpeler_actiepuntId_key" RENAME TO "KadersSpeler_actiepuntId_key";

-- RenameIndex
ALTER INDEX "BlauwdrukSpeler_gezienStatus_idx" RENAME TO "KadersSpeler_gezienStatus_idx";

-- RenameIndex
ALTER INDEX "BlauwdrukSpeler_spelerId_idx" RENAME TO "KadersSpeler_spelerId_idx";
