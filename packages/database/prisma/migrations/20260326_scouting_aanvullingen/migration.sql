-- Scouting aanvullingen uit korfbal-validatie

-- Nieuw enum: VerzoekDoel
CREATE TYPE "VerzoekDoel" AS ENUM ('DOORSTROOM', 'SELECTIE', 'NIVEAUBEPALING', 'OVERIG');

-- Nieuwe waarde in ToewijzingStatus
ALTER TYPE "ToewijzingStatus" ADD VALUE 'GESTOPT';

-- ScoutingVerzoek: doel-veld
ALTER TABLE "scouting_verzoeken" ADD COLUMN "doel" "VerzoekDoel" NOT NULL DEFAULT 'NIVEAUBEPALING';

-- ScoutingRapport: niet-beoordeeld flag (bij GENERIEK kan scout niet alle spelers zien)
ALTER TABLE "scouting_rapporten" ADD COLUMN "niet_beoordeeld" BOOLEAN NOT NULL DEFAULT false;
