-- CreateEnum
CREATE TYPE "OWTeamType" AS ENUM ('JEUGD', 'SELECTIE', 'SENIOREN', 'OVERIG');

-- AlterTable teams: naam NOT NULL, alias, team_type
-- Zet eventuele NULL namen op ow_code als fallback
UPDATE "teams" SET naam = ow_code WHERE naam IS NULL;

ALTER TABLE "teams"
  ALTER COLUMN "naam" SET NOT NULL,
  ADD COLUMN "alias" TEXT,
  ADD COLUMN "team_type" "OWTeamType" NOT NULL DEFAULT 'JEUGD';

-- AlterTable competitie_spelers: ow_team_id FK
ALTER TABLE "competitie_spelers"
  ADD COLUMN "ow_team_id" INTEGER;

-- AddForeignKey
ALTER TABLE "competitie_spelers"
  ADD CONSTRAINT "competitie_spelers_ow_team_id_fkey"
  FOREIGN KEY ("ow_team_id") REFERENCES "teams"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
