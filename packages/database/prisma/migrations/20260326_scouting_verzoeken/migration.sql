-- Scouting Verzoeken: Mission-Based Scouting
-- Rolscheiding Scout vs TC-lid

-- ══════════════════════════════════════════════
-- Nieuwe enum types
-- ══════════════════════════════════════════════

CREATE TYPE "ScoutRol" AS ENUM ('SCOUT', 'TC');
CREATE TYPE "VerzoekType" AS ENUM ('GENERIEK', 'SPECIFIEK', 'VERGELIJKING');
CREATE TYPE "VerzoekStatus" AS ENUM ('OPEN', 'ACTIEF', 'AFGEROND', 'GEANNULEERD');
CREATE TYPE "ToewijzingStatus" AS ENUM ('UITGENODIGD', 'GEACCEPTEERD', 'AFGEWEZEN', 'AFGEROND');
CREATE TYPE "ScoutSpelerRelatie" AS ENUM ('GEEN', 'OUDER', 'FAMILIE', 'BEKENDE', 'TRAINER');

-- ══════════════════════════════════════════════
-- Wijzigingen bestaande tabellen
-- ══════════════════════════════════════════════

-- Scout: rol en vrij-scouten flag
ALTER TABLE "scouts" ADD COLUMN "rol" "ScoutRol" NOT NULL DEFAULT 'SCOUT';
ALTER TABLE "scouts" ADD COLUMN "vrij_scouten" BOOLEAN NOT NULL DEFAULT false;

-- ScoutingRapport: verzoek-koppeling en relatie-tracking
ALTER TABLE "scouting_rapporten" ADD COLUMN "verzoek_id" TEXT;
ALTER TABLE "scouting_rapporten" ADD COLUMN "relatie" "ScoutSpelerRelatie" NOT NULL DEFAULT 'GEEN';

-- ══════════════════════════════════════════════
-- Nieuwe tabellen
-- ══════════════════════════════════════════════

CREATE TABLE "scouting_verzoeken" (
    "id" TEXT NOT NULL,
    "type" "VerzoekType" NOT NULL,
    "status" "VerzoekStatus" NOT NULL DEFAULT 'OPEN',
    "toelichting" TEXT,
    "deadline" TIMESTAMP(3),
    "anoniem" BOOLEAN NOT NULL DEFAULT false,
    "team_id" TEXT,
    "speler_ids" TEXT[],
    "seizoen" TEXT NOT NULL,
    "aangemaakt_door" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scouting_verzoeken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scout_toewijzingen" (
    "id" TEXT NOT NULL,
    "verzoek_id" TEXT NOT NULL,
    "scout_id" TEXT NOT NULL,
    "status" "ToewijzingStatus" NOT NULL DEFAULT 'UITGENODIGD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_toewijzingen_pkey" PRIMARY KEY ("id")
);

-- ══════════════════════════════════════════════
-- Indexes
-- ══════════════════════════════════════════════

CREATE INDEX "scouting_verzoeken_seizoen_idx" ON "scouting_verzoeken"("seizoen");
CREATE INDEX "scouting_verzoeken_status_idx" ON "scouting_verzoeken"("status");
CREATE INDEX "scouting_rapporten_verzoek_id_idx" ON "scouting_rapporten"("verzoek_id");
CREATE INDEX "scout_toewijzingen_scout_id_idx" ON "scout_toewijzingen"("scout_id");
CREATE UNIQUE INDEX "scout_toewijzingen_verzoek_id_scout_id_key" ON "scout_toewijzingen"("verzoek_id", "scout_id");

-- ══════════════════════════════════════════════
-- Foreign keys
-- ══════════════════════════════════════════════

ALTER TABLE "scouting_verzoeken" ADD CONSTRAINT "scouting_verzoeken_aangemaakt_door_fkey"
    FOREIGN KEY ("aangemaakt_door") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "scout_toewijzingen" ADD CONSTRAINT "scout_toewijzingen_verzoek_id_fkey"
    FOREIGN KEY ("verzoek_id") REFERENCES "scouting_verzoeken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "scout_toewijzingen" ADD CONSTRAINT "scout_toewijzingen_scout_id_fkey"
    FOREIGN KEY ("scout_id") REFERENCES "scouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "scouting_rapporten" ADD CONSTRAINT "scouting_rapporten_verzoek_id_fkey"
    FOREIGN KEY ("verzoek_id") REFERENCES "scouting_verzoeken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
