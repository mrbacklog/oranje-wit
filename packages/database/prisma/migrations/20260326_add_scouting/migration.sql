-- CreateEnum
CREATE TYPE "ScoutingContext" AS ENUM ('WEDSTRIJD', 'TRAINING', 'OVERIG');

-- AlterTable: scouting_rapporten — convert context to enum
ALTER TABLE "scouting_rapporten" DROP COLUMN "context",
ADD COLUMN     "context" "ScoutingContext" NOT NULL DEFAULT 'OVERIG';

-- AlterTable: scouts — fix level default
ALTER TABLE "scouts" ALTER COLUMN "level" SET DEFAULT 1;

-- AlterTable: team_scouting_sessies — convert context to enum
ALTER TABLE "team_scouting_sessies" DROP COLUMN "context",
ADD COLUMN     "context" "ScoutingContext" NOT NULL DEFAULT 'OVERIG';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "scouts_stafId_key" ON "scouts"("stafId");

-- AddForeignKey
ALTER TABLE "scouts" ADD CONSTRAINT "scouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouts" ADD CONSTRAINT "scouts_stafId_fkey" FOREIGN KEY ("stafId") REFERENCES "Staf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouting_rapporten" ADD CONSTRAINT "scouting_rapporten_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "scouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouting_rapporten" ADD CONSTRAINT "scouting_rapporten_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scouting_rapporten" ADD CONSTRAINT "scouting_rapporten_teamSessieId_fkey" FOREIGN KEY ("teamSessieId") REFERENCES "team_scouting_sessies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_scouting_sessies" ADD CONSTRAINT "team_scouting_sessies_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "scouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_scouting_sessies" ADD CONSTRAINT "team_scouting_sessies_owTeamId_fkey" FOREIGN KEY ("owTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spelers_kaarten" ADD CONSTRAINT "spelers_kaarten_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_badges" ADD CONSTRAINT "scout_badges_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "scouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
