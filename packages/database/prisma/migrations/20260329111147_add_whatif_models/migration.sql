-- CreateEnum
CREATE TYPE "WhatIfStatus" AS ENUM ('OPEN', 'BESLISBAAR', 'TOEGEPAST', 'VERWORPEN');

-- CreateTable
CREATE TABLE "what_ifs" (
    "id" TEXT NOT NULL,
    "werkindelingId" TEXT NOT NULL,
    "vraag" TEXT NOT NULL,
    "toelichting" TEXT,
    "status" "WhatIfStatus" NOT NULL DEFAULT 'OPEN',
    "basisVersieNummer" INTEGER NOT NULL,
    "toelichtingAfwijking" TEXT,
    "toegepastOp" TIMESTAMP(3),
    "verworpenOp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "what_ifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "what_if_teams" (
    "id" TEXT NOT NULL,
    "whatIfId" TEXT NOT NULL,
    "bronTeamId" TEXT,
    "naam" TEXT NOT NULL,
    "categorie" "TeamCategorie" NOT NULL,
    "kleur" "Kleur",
    "teamType" "TeamType",
    "niveau" TEXT,
    "volgorde" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "what_if_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "what_if_team_spelers" (
    "id" TEXT NOT NULL,
    "whatIfTeamId" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "statusOverride" "SpelerStatus",
    "notitie" TEXT,

    CONSTRAINT "what_if_team_spelers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "what_if_team_staf" (
    "id" TEXT NOT NULL,
    "whatIfTeamId" TEXT NOT NULL,
    "stafId" TEXT NOT NULL,
    "rol" TEXT,

    CONSTRAINT "what_if_team_staf_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Werkitem krijgt whatIfId
ALTER TABLE "Werkitem" ADD COLUMN "whatIfId" TEXT;

-- CreateIndex
CREATE INDEX "what_ifs_werkindelingId_idx" ON "what_ifs"("werkindelingId");
CREATE INDEX "what_ifs_status_idx" ON "what_ifs"("status");

CREATE INDEX "what_if_teams_whatIfId_idx" ON "what_if_teams"("whatIfId");
CREATE INDEX "what_if_teams_bronTeamId_idx" ON "what_if_teams"("bronTeamId");

CREATE INDEX "what_if_team_spelers_whatIfTeamId_idx" ON "what_if_team_spelers"("whatIfTeamId");
CREATE INDEX "what_if_team_spelers_spelerId_idx" ON "what_if_team_spelers"("spelerId");
CREATE UNIQUE INDEX "what_if_team_spelers_whatIfTeamId_spelerId_key" ON "what_if_team_spelers"("whatIfTeamId", "spelerId");

CREATE INDEX "what_if_team_staf_whatIfTeamId_idx" ON "what_if_team_staf"("whatIfTeamId");
CREATE UNIQUE INDEX "what_if_team_staf_whatIfTeamId_stafId_key" ON "what_if_team_staf"("whatIfTeamId", "stafId");

-- AddForeignKey
ALTER TABLE "what_ifs" ADD CONSTRAINT "what_ifs_werkindelingId_fkey" FOREIGN KEY ("werkindelingId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "what_if_teams" ADD CONSTRAINT "what_if_teams_whatIfId_fkey" FOREIGN KEY ("whatIfId") REFERENCES "what_ifs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "what_if_teams" ADD CONSTRAINT "what_if_teams_bronTeamId_fkey" FOREIGN KEY ("bronTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "what_if_team_spelers" ADD CONSTRAINT "what_if_team_spelers_whatIfTeamId_fkey" FOREIGN KEY ("whatIfTeamId") REFERENCES "what_if_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "what_if_team_spelers" ADD CONSTRAINT "what_if_team_spelers_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "what_if_team_staf" ADD CONSTRAINT "what_if_team_staf_whatIfTeamId_fkey" FOREIGN KEY ("whatIfTeamId") REFERENCES "what_if_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "what_if_team_staf" ADD CONSTRAINT "what_if_team_staf_stafId_fkey" FOREIGN KEY ("stafId") REFERENCES "Staf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Werkitem" ADD CONSTRAINT "Werkitem_whatIfId_fkey" FOREIGN KEY ("whatIfId") REFERENCES "what_ifs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
