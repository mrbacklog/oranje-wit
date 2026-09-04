-- Voeg competitieklasse (met bron) toe aan team_periodes.
-- Herkomst: historisch geoogste standenpagina's (data/seizoenen/historie/team-niveaus.json).
-- De bestaande kolom "pool" wordt hergebruikt voor de poulecode — er komt geen apart poule-veld
-- bij, omdat "pool" nog nergens in productie geschreven wordt (alleen een demo-seed placeholder)
-- en al gedocumenteerd staat als "Pool- en sterktedata per periode".
ALTER TABLE "team_periodes" ADD COLUMN "klasse" TEXT;
ALTER TABLE "team_periodes" ADD COLUMN "klasse_bron" TEXT;
