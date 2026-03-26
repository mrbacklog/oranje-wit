-- Baseline migratie: gegenereerd vanuit schema.prisma
-- Deze migratie is gemarkeerd als "already applied" (baselining)
-- De database bevat al alle tabellen — deze SQL is NIET uitgevoerd.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('EDITOR', 'REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "Geslacht" AS ENUM ('M', 'V');

-- CreateEnum
CREATE TYPE "PinType" AS ENUM ('SPELER_STATUS', 'SPELER_POSITIE', 'STAF_POSITIE');

-- CreateEnum
CREATE TYPE "ConceptStatus" AS ENUM ('ACTIEF', 'GEARCHIVEERD', 'DEFINITIEF');

-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('ACTIEF', 'GEARCHIVEERD', 'DEFINITIEF');

-- CreateEnum
CREATE TYPE "TeamCategorie" AS ENUM ('SENIOREN', 'A_CATEGORIE', 'B_CATEGORIE');

-- CreateEnum
CREATE TYPE "Kleur" AS ENUM ('PAARS', 'BLAUW', 'GROEN', 'GEEL', 'ORANJE', 'ROOD');

-- CreateEnum
CREATE TYPE "ValidatieStatus" AS ENUM ('GROEN', 'ORANJE', 'ROOD', 'ONBEKEND');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('VIERTAL', 'ACHTTAL');

-- CreateEnum
CREATE TYPE "SpelerStatus" AS ENUM ('BESCHIKBAAR', 'TWIJFELT', 'GAAT_STOPPEN', 'NIEUW_POTENTIEEL', 'NIEUW_DEFINITIEF', 'ALGEMEEN_RESERVE');

-- CreateEnum
CREATE TYPE "WerkitemType" AS ENUM ('STRATEGISCH', 'DATA', 'REGEL', 'TRAINER', 'SPELER', 'BESLUIT');

-- CreateEnum
CREATE TYPE "WerkitemPrioriteit" AS ENUM ('BLOCKER', 'HOOG', 'MIDDEL', 'LAAG', 'INFO');

-- CreateEnum
CREATE TYPE "WerkitemStatus" AS ENUM ('OPEN', 'IN_BESPREKING', 'OPGELOST', 'GEACCEPTEERD_RISICO', 'GEARCHIVEERD');

-- CreateEnum
CREATE TYPE "Besluitniveau" AS ENUM ('TC', 'BESTUUR', 'TRAINER');

-- CreateEnum
CREATE TYPE "Doelgroep" AS ENUM ('SENIOREN', 'JUNIOREN', 'ASPIRANTEN', 'PUPILLEN', 'WELPEN', 'ALLE');

-- CreateEnum
CREATE TYPE "Entiteit" AS ENUM ('SPELER', 'STAF', 'TEAM', 'BLAUWDRUK');

-- CreateEnum
CREATE TYPE "ActiepuntStatus" AS ENUM ('OPEN', 'BEZIG', 'AFGEROND');

-- CreateEnum
CREATE TYPE "ActiviteitType" AS ENUM ('OPMERKING', 'ACTIEPUNT', 'STATUS_WIJZIGING');

-- CreateEnum
CREATE TYPE "ScoutingContext" AS ENUM ('WEDSTRIJD', 'TRAINING', 'OVERIG');

-- CreateTable
CREATE TABLE "leden" (
    "rel_code" TEXT NOT NULL,
    "roepnaam" TEXT NOT NULL,
    "achternaam" TEXT NOT NULL,
    "tussenvoegsel" TEXT,
    "voorletters" TEXT,
    "geslacht" TEXT NOT NULL,
    "geboortejaar" INTEGER,
    "geboortedatum" DATE,
    "lid_sinds" DATE,
    "afmelddatum" DATE,
    "lidsoort" TEXT,
    "email" TEXT,
    "registratie_datum" DATE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leden_pkey" PRIMARY KEY ("rel_code")
);

-- CreateTable
CREATE TABLE "lid_fotos" (
    "rel_code" TEXT NOT NULL,
    "bron_url" TEXT,
    "image_webp" BYTEA NOT NULL,
    "content_hash" TEXT,
    "source_updated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lid_fotos_pkey" PRIMARY KEY ("rel_code")
);

-- CreateTable
CREATE TABLE "seizoenen" (
    "seizoen" TEXT NOT NULL,
    "start_jaar" INTEGER NOT NULL,
    "eind_jaar" INTEGER NOT NULL,
    "start_datum" DATE NOT NULL,
    "eind_datum" DATE NOT NULL,
    "peildatum" DATE NOT NULL,

    CONSTRAINT "seizoenen_pkey" PRIMARY KEY ("seizoen")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "seizoen" TEXT NOT NULL,
    "ow_code" TEXT NOT NULL,
    "naam" TEXT,
    "categorie" TEXT NOT NULL,
    "kleur" TEXT,
    "leeftijdsgroep" TEXT,
    "spelvorm" TEXT,
    "is_selectie" BOOLEAN NOT NULL DEFAULT false,
    "selectie_ow_code" TEXT,
    "sort_order" INTEGER,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_periodes" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "periode" TEXT NOT NULL,
    "j_nummer" TEXT,
    "pool" TEXT,
    "sterkte" INTEGER,
    "gem_leeftijd" DECIMAL(5,2),
    "aantal_spelers" INTEGER,

    CONSTRAINT "team_periodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_aliases" (
    "id" SERIAL NOT NULL,
    "seizoen" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "ow_team_id" INTEGER NOT NULL,
    "ow_code" TEXT NOT NULL,

    CONSTRAINT "team_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitie_rondes" (
    "id" SERIAL NOT NULL,
    "seizoen" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "spelvorm" TEXT,
    "volgorde" INTEGER NOT NULL,

    CONSTRAINT "competitie_rondes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitie_spelers" (
    "id" SERIAL NOT NULL,
    "rel_code" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "competitie" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "geslacht" TEXT,
    "bron" TEXT NOT NULL,
    "betrouwbaar" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "competitie_spelers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledenverloop" (
    "id" SERIAL NOT NULL,
    "seizoen" TEXT NOT NULL,
    "rel_code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "geboortejaar" INTEGER,
    "geslacht" TEXT,
    "leeftijd_vorig" INTEGER,
    "leeftijd_nieuw" INTEGER,
    "team_vorig" TEXT,
    "team_nieuw" TEXT,

    CONSTRAINT "ledenverloop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_seizoenen" (
    "id" SERIAL NOT NULL,
    "geboortejaar" INTEGER NOT NULL,
    "geslacht" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "leeftijd" INTEGER,
    "band" TEXT,
    "actief" INTEGER DEFAULT 0,
    "behouden" INTEGER DEFAULT 0,
    "nieuw" INTEGER DEFAULT 0,
    "herinschrijver" INTEGER DEFAULT 0,
    "uitgestroomd" INTEGER DEFAULT 0,
    "retentie_pct" DECIMAL(5,2),

    CONSTRAINT "cohort_seizoenen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signalering" (
    "id" SERIAL NOT NULL,
    "seizoen" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ernst" TEXT NOT NULL,
    "leeftijdsgroep" TEXT,
    "geslacht" TEXT,
    "waarde" DECIMAL,
    "drempel" DECIMAL,
    "streef" DECIMAL,
    "beschrijving" TEXT,
    "advies" TEXT,

    CONSTRAINT "signalering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streefmodel" (
    "id" SERIAL NOT NULL,
    "versie" TEXT NOT NULL,
    "seizoen_basis" TEXT NOT NULL,
    "seizoen_doel" TEXT NOT NULL,
    "leeftijd" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "totaal" INTEGER,
    "m" INTEGER,
    "v" INTEGER,

    CONSTRAINT "streefmodel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_standen" (
    "id" SERIAL NOT NULL,
    "seizoen" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "pool" TEXT NOT NULL,
    "niveau" TEXT,
    "regio" TEXT,
    "stand_datum" DATE,
    "bron_bestand" TEXT,

    CONSTRAINT "pool_standen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_stand_regels" (
    "id" SERIAL NOT NULL,
    "pool_stand_id" INTEGER NOT NULL,
    "positie" INTEGER NOT NULL,
    "team_naam" TEXT NOT NULL,
    "is_ow" BOOLEAN NOT NULL DEFAULT false,
    "gs" INTEGER NOT NULL,
    "wn" INTEGER NOT NULL,
    "gl" INTEGER NOT NULL,
    "vl" INTEGER NOT NULL,
    "pt" INTEGER NOT NULL,
    "vr" INTEGER NOT NULL,
    "tg" INTEGER NOT NULL,
    "teamscore" DECIMAL(6,2),
    "gem_leeftijd" DECIMAL(5,2),

    CONSTRAINT "pool_stand_regels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Speler" (
    "id" TEXT NOT NULL,
    "roepnaam" TEXT NOT NULL,
    "achternaam" TEXT NOT NULL,
    "geboortejaar" INTEGER NOT NULL,
    "geboortedatum" DATE,
    "geslacht" "Geslacht" NOT NULL,
    "lidSinds" TEXT,
    "huidig" JSONB,
    "spelerspad" JSONB,
    "volgendSeizoen" JSONB,
    "retentie" JSONB,
    "teamgenotenHistorie" JSONB,
    "seizoenenActief" INTEGER,
    "instroomLeeftijd" INTEGER,
    "status" "SpelerStatus" NOT NULL DEFAULT 'BESCHIKBAAR',
    "notitie" TEXT,
    "rating" INTEGER,
    "rating_berekend" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Speler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staf" (
    "id" TEXT NOT NULL,
    "rel_code" TEXT,
    "naam" TEXT NOT NULL,
    "geboortejaar" INTEGER,
    "email" TEXT,
    "rollen" TEXT[],
    "notitie" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staf_toewijzingen" (
    "id" SERIAL NOT NULL,
    "staf_id" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "functie" TEXT,
    "bron" TEXT NOT NULL DEFAULT 'staf_overzicht',

    CONSTRAINT "staf_toewijzingen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blauwdruk" (
    "id" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "isWerkseizoen" BOOLEAN NOT NULL DEFAULT false,
    "toelichting" TEXT,
    "kaders" JSONB NOT NULL,
    "speerpunten" TEXT[],
    "keuzes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blauwdruk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pin" (
    "id" TEXT NOT NULL,
    "blauwdrukId" TEXT NOT NULL,
    "type" "PinType" NOT NULL,
    "waarde" JSONB NOT NULL,
    "notitie" TEXT,
    "spelerId" TEXT,
    "stafId" TEXT,
    "gepindDoorId" TEXT NOT NULL,
    "gepindOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "blauwdrukId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "uitgangsprincipe" TEXT NOT NULL,
    "keuzes" JSONB NOT NULL,
    "aannames" JSONB,
    "status" "ConceptStatus" NOT NULL DEFAULT 'ACTIEF',
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "toelichting" TEXT,
    "aannames" JSONB,
    "keuzeWaardes" JSONB,
    "status" "ScenarioStatus" NOT NULL DEFAULT 'ACTIEF',
    "parentId" TEXT,
    "verwijderdOp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioSnapshot" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "reden" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "aantalTeams" INTEGER NOT NULL DEFAULT 0,
    "aantalSpelers" INTEGER NOT NULL DEFAULT 0,
    "auteur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Versie" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "nummer" INTEGER NOT NULL,
    "naam" TEXT,
    "auteur" TEXT NOT NULL,
    "posities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Versie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "versieId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "alias" TEXT,
    "categorie" "TeamCategorie" NOT NULL,
    "kleur" "Kleur",
    "teamType" "TeamType",
    "niveau" TEXT,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "validatieStatus" "ValidatieStatus" NOT NULL DEFAULT 'ONBEKEND',
    "validatieMeldingen" JSONB,
    "selectieGroepId" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectieGroep" (
    "id" TEXT NOT NULL,
    "versieId" TEXT NOT NULL,
    "naam" TEXT,

    CONSTRAINT "SelectieGroep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectieSpeler" (
    "id" TEXT NOT NULL,
    "selectieGroepId" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "statusOverride" "SpelerStatus",
    "notitie" TEXT,

    CONSTRAINT "SelectieSpeler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectieStaf" (
    "id" TEXT NOT NULL,
    "selectieGroepId" TEXT NOT NULL,
    "stafId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,

    CONSTRAINT "SelectieStaf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSpeler" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "statusOverride" "SpelerStatus",
    "notitie" TEXT,

    CONSTRAINT "TeamSpeler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamStaf" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "stafId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,

    CONSTRAINT "TeamStaf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluatie" (
    "id" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "ronde" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'trainer',
    "scores" JSONB NOT NULL,
    "opmerking" TEXT,
    "coach" TEXT,
    "team_naam" TEXT,
    "ronde_id" TEXT,
    "coordinator_memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'concept',
    "ingediend_op" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluatie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "versieId" TEXT NOT NULL,
    "actie" TEXT NOT NULL,
    "detail" TEXT,
    "doorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Import" (
    "id" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "exportDatum" TEXT NOT NULL,
    "snapshotDatum" TEXT NOT NULL,
    "spelersNieuw" INTEGER NOT NULL,
    "spelersBijgewerkt" INTEGER NOT NULL,
    "stafNieuw" INTEGER NOT NULL,
    "stafBijgewerkt" INTEGER NOT NULL,
    "teamsGeladen" INTEGER NOT NULL,
    "meta" JSONB NOT NULL,
    "spelerIds" TEXT[],
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferentieTeam" (
    "id" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "kleur" TEXT,
    "niveau" TEXT,
    "spelvorm" TEXT,
    "teamType" "TeamType",
    "poolVeld" TEXT,
    "poolZaal" TEXT,
    "spelerIds" TEXT[],
    "stafIds" TEXT[],
    "stats" JSONB NOT NULL,
    "teamscore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferentieTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Werkitem" (
    "id" TEXT NOT NULL,
    "blauwdrukId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "type" "WerkitemType" NOT NULL,
    "prioriteit" "WerkitemPrioriteit" NOT NULL DEFAULT 'MIDDEL',
    "status" "WerkitemStatus" NOT NULL DEFAULT 'OPEN',
    "besluitniveau" "Besluitniveau",
    "doelgroep" "Doelgroep",
    "entiteit" "Entiteit",
    "scenarioId" TEXT,
    "spelerId" TEXT,
    "stafId" TEXT,
    "teamOwCode" TEXT,
    "resolutie" TEXT,
    "opgelostOp" TIMESTAMP(3),
    "auteurId" TEXT NOT NULL,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Werkitem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actiepunt" (
    "id" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "status" "ActiepuntStatus" NOT NULL DEFAULT 'OPEN',
    "deadline" DATE,
    "werkitemId" TEXT,
    "blauwdrukId" TEXT NOT NULL,
    "toegewezenAanId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "afgerondOp" TIMESTAMP(3),
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actiepunt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activiteit" (
    "id" TEXT NOT NULL,
    "type" "ActiviteitType" NOT NULL,
    "inhoud" TEXT NOT NULL,
    "spelerId" TEXT,
    "stafId" TEXT,
    "teamOwCode" TEXT,
    "actiepuntStatus" "ActiepuntStatus",
    "deadline" DATE,
    "toegewezenAanId" TEXT,
    "afgerondOp" TIMESTAMP(3),
    "blauwdrukId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activiteit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluatie_rondes" (
    "id" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "ronde" INTEGER NOT NULL,
    "naam" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'trainer',
    "deadline" TIMESTAMPTZ(6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'concept',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluatie_rondes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinatoren" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordinatoren_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinator_teams" (
    "id" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "ow_team_id" INTEGER NOT NULL,
    "seizoen" TEXT NOT NULL,

    CONSTRAINT "coordinator_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluatie_uitnodigingen" (
    "id" TEXT NOT NULL,
    "rondeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "ow_team_id" INTEGER,
    "spelerId" TEXT,
    "token" TEXT NOT NULL,
    "email_verstuurd" TIMESTAMPTZ(6),
    "reminder_verstuurd" TIMESTAMPTZ(6),
    "reminder_aantal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluatie_uitnodigingen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speler_zelf_evaluaties" (
    "id" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "ronde" INTEGER NOT NULL DEFAULT 1,
    "rondeId" TEXT,
    "plezier_korfbal" INTEGER,
    "plezier_team" INTEGER,
    "plezier_uitdaging" INTEGER,
    "plezier_toelichting" TEXT,
    "training_zin" INTEGER,
    "training_kwaliteit" INTEGER,
    "wedstrijd_beleving" INTEGER,
    "training_verbetering" INTEGER,
    "training_toelichting" TEXT,
    "toekomst_intentie" TEXT,
    "toekomst_ambitie" TEXT,
    "toekomst_toelichting" TEXT,
    "algemeen_opmerking" TEXT,
    "coordinator_memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'concept',
    "ingediend_op" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speler_zelf_evaluaties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "sleutel" TEXT NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "inhoud_html" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mijlpaal" (
    "id" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "afgerond" BOOLEAN NOT NULL DEFAULT false,
    "afgerondOp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mijlpaal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scouts" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "stafId" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scouting_rapporten" (
    "id" TEXT NOT NULL,
    "scoutId" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" "ScoutingContext" NOT NULL,
    "contextDetail" TEXT,
    "scores" JSONB NOT NULL,
    "opmerking" TEXT,
    "overallScore" INTEGER,
    "teamSessieId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scouting_rapporten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_scouting_sessies" (
    "id" TEXT NOT NULL,
    "scoutId" TEXT NOT NULL,
    "owTeamId" INTEGER NOT NULL,
    "seizoen" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" "ScoutingContext" NOT NULL,
    "contextDetail" TEXT,
    "rankings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_scouting_sessies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spelers_kaarten" (
    "id" TEXT NOT NULL,
    "spelerId" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "schot" INTEGER NOT NULL,
    "aanval" INTEGER NOT NULL,
    "passing" INTEGER NOT NULL,
    "verdediging" INTEGER NOT NULL,
    "fysiek" INTEGER NOT NULL,
    "mentaal" INTEGER NOT NULL,
    "aantalRapporten" INTEGER NOT NULL DEFAULT 0,
    "betrouwbaarheid" TEXT NOT NULL DEFAULT 'concept',
    "laatsteUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trendOverall" INTEGER DEFAULT 0,

    CONSTRAINT "spelers_kaarten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_badges" (
    "id" TEXT NOT NULL,
    "scoutId" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_challenges" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "xpBeloning" INTEGER NOT NULL,
    "startDatum" TIMESTAMP(3) NOT NULL,
    "eindDatum" TIMESTAMP(3) NOT NULL,
    "seizoen" TEXT NOT NULL,
    "voorwaarde" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scout_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_teams_seizoen" ON "teams"("seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "teams_seizoen_ow_code_key" ON "teams"("seizoen", "ow_code");

-- CreateIndex
CREATE INDEX "idx_team_periodes_team" ON "team_periodes"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_periodes_team_id_periode_key" ON "team_periodes"("team_id", "periode");

-- CreateIndex
CREATE INDEX "team_aliases_seizoen_alias_idx" ON "team_aliases"("seizoen", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "team_aliases_seizoen_alias_key" ON "team_aliases"("seizoen", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "competitie_rondes_seizoen_periode_key" ON "competitie_rondes"("seizoen", "periode");

-- CreateIndex
CREATE INDEX "idx_cs_seizoen" ON "competitie_spelers"("seizoen");

-- CreateIndex
CREATE INDEX "idx_cs_relcode" ON "competitie_spelers"("rel_code");

-- CreateIndex
CREATE UNIQUE INDEX "competitie_spelers_rel_code_seizoen_competitie_key" ON "competitie_spelers"("rel_code", "seizoen", "competitie");

-- CreateIndex
CREATE INDEX "idx_ledenverloop_seizoen" ON "ledenverloop"("seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "ledenverloop_seizoen_rel_code_key" ON "ledenverloop"("seizoen", "rel_code");

-- CreateIndex
CREATE INDEX "idx_cohort_seizoen" ON "cohort_seizoenen"("seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_seizoenen_geboortejaar_geslacht_seizoen_key" ON "cohort_seizoenen"("geboortejaar", "geslacht", "seizoen");

-- CreateIndex
CREATE INDEX "idx_signalering_seizoen" ON "signalering"("seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "streefmodel_versie_seizoen_doel_leeftijd_key" ON "streefmodel"("versie", "seizoen_doel", "leeftijd");

-- CreateIndex
CREATE INDEX "idx_pool_stand_seizoen" ON "pool_standen"("seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "pool_standen_seizoen_periode_pool_key" ON "pool_standen"("seizoen", "periode", "pool");

-- CreateIndex
CREATE INDEX "idx_pool_stand_regel_stand" ON "pool_stand_regels"("pool_stand_id");

-- CreateIndex
CREATE INDEX "idx_pool_stand_regel_ow" ON "pool_stand_regels"("is_ow");

-- CreateIndex
CREATE UNIQUE INDEX "pool_stand_regels_pool_stand_id_positie_key" ON "pool_stand_regels"("pool_stand_id", "positie");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Speler_geboortejaar_idx" ON "Speler"("geboortejaar");

-- CreateIndex
CREATE INDEX "Speler_geslacht_idx" ON "Speler"("geslacht");

-- CreateIndex
CREATE UNIQUE INDEX "Staf_rel_code_key" ON "Staf"("rel_code");

-- CreateIndex
CREATE INDEX "staf_toewijzingen_seizoen_idx" ON "staf_toewijzingen"("seizoen");

-- CreateIndex
CREATE INDEX "staf_toewijzingen_staf_id_idx" ON "staf_toewijzingen"("staf_id");

-- CreateIndex
CREATE UNIQUE INDEX "staf_toewijzingen_staf_id_seizoen_team_key" ON "staf_toewijzingen"("staf_id", "seizoen", "team");

-- CreateIndex
CREATE UNIQUE INDEX "Blauwdruk_seizoen_key" ON "Blauwdruk"("seizoen");

-- CreateIndex
CREATE INDEX "Pin_blauwdrukId_idx" ON "Pin"("blauwdrukId");

-- CreateIndex
CREATE INDEX "Pin_type_idx" ON "Pin"("type");

-- CreateIndex
CREATE INDEX "Concept_blauwdrukId_idx" ON "Concept"("blauwdrukId");

-- CreateIndex
CREATE INDEX "Scenario_conceptId_idx" ON "Scenario"("conceptId");

-- CreateIndex
CREATE INDEX "ScenarioSnapshot_scenarioId_idx" ON "ScenarioSnapshot"("scenarioId");

-- CreateIndex
CREATE INDEX "Versie_scenarioId_idx" ON "Versie"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Versie_scenarioId_nummer_key" ON "Versie"("scenarioId", "nummer");

-- CreateIndex
CREATE INDEX "Team_versieId_idx" ON "Team"("versieId");

-- CreateIndex
CREATE INDEX "SelectieGroep_versieId_idx" ON "SelectieGroep"("versieId");

-- CreateIndex
CREATE INDEX "SelectieSpeler_selectieGroepId_idx" ON "SelectieSpeler"("selectieGroepId");

-- CreateIndex
CREATE INDEX "SelectieSpeler_spelerId_idx" ON "SelectieSpeler"("spelerId");

-- CreateIndex
CREATE UNIQUE INDEX "SelectieSpeler_selectieGroepId_spelerId_key" ON "SelectieSpeler"("selectieGroepId", "spelerId");

-- CreateIndex
CREATE INDEX "SelectieStaf_selectieGroepId_idx" ON "SelectieStaf"("selectieGroepId");

-- CreateIndex
CREATE UNIQUE INDEX "SelectieStaf_selectieGroepId_stafId_key" ON "SelectieStaf"("selectieGroepId", "stafId");

-- CreateIndex
CREATE INDEX "TeamSpeler_teamId_idx" ON "TeamSpeler"("teamId");

-- CreateIndex
CREATE INDEX "TeamSpeler_spelerId_idx" ON "TeamSpeler"("spelerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSpeler_teamId_spelerId_key" ON "TeamSpeler"("teamId", "spelerId");

-- CreateIndex
CREATE INDEX "TeamStaf_teamId_idx" ON "TeamStaf"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamStaf_teamId_stafId_key" ON "TeamStaf"("teamId", "stafId");

-- CreateIndex
CREATE INDEX "Evaluatie_seizoen_idx" ON "Evaluatie"("seizoen");

-- CreateIndex
CREATE INDEX "Evaluatie_seizoen_ronde_idx" ON "Evaluatie"("seizoen", "ronde");

-- CreateIndex
CREATE INDEX "Evaluatie_type_idx" ON "Evaluatie"("type");

-- CreateIndex
CREATE INDEX "Evaluatie_ronde_id_idx" ON "Evaluatie"("ronde_id");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluatie_spelerId_seizoen_ronde_type_key" ON "Evaluatie"("spelerId", "seizoen", "ronde", "type");

-- CreateIndex
CREATE INDEX "LogEntry_versieId_idx" ON "LogEntry"("versieId");

-- CreateIndex
CREATE INDEX "Import_seizoen_idx" ON "Import"("seizoen");

-- CreateIndex
CREATE INDEX "ReferentieTeam_seizoen_idx" ON "ReferentieTeam"("seizoen");

-- CreateIndex
CREATE INDEX "Werkitem_blauwdrukId_idx" ON "Werkitem"("blauwdrukId");

-- CreateIndex
CREATE INDEX "Werkitem_status_idx" ON "Werkitem"("status");

-- CreateIndex
CREATE INDEX "Werkitem_prioriteit_idx" ON "Werkitem"("prioriteit");

-- CreateIndex
CREATE INDEX "Actiepunt_blauwdrukId_idx" ON "Actiepunt"("blauwdrukId");

-- CreateIndex
CREATE INDEX "Actiepunt_toegewezenAanId_idx" ON "Actiepunt"("toegewezenAanId");

-- CreateIndex
CREATE INDEX "Actiepunt_status_idx" ON "Actiepunt"("status");

-- CreateIndex
CREATE INDEX "Activiteit_spelerId_createdAt_idx" ON "Activiteit"("spelerId", "createdAt");

-- CreateIndex
CREATE INDEX "Activiteit_stafId_createdAt_idx" ON "Activiteit"("stafId", "createdAt");

-- CreateIndex
CREATE INDEX "Activiteit_blauwdrukId_idx" ON "Activiteit"("blauwdrukId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluatie_rondes_seizoen_ronde_type_key" ON "evaluatie_rondes"("seizoen", "ronde", "type");

-- CreateIndex
CREATE UNIQUE INDEX "coordinatoren_email_key" ON "coordinatoren"("email");

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_teams_coordinatorId_ow_team_id_seizoen_key" ON "coordinator_teams"("coordinatorId", "ow_team_id", "seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "evaluatie_uitnodigingen_token_key" ON "evaluatie_uitnodigingen"("token");

-- CreateIndex
CREATE UNIQUE INDEX "evaluatie_uitnodigingen_rondeId_email_ow_team_id_key" ON "evaluatie_uitnodigingen"("rondeId", "email", "ow_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "speler_zelf_evaluaties_spelerId_seizoen_ronde_key" ON "speler_zelf_evaluaties"("spelerId", "seizoen", "ronde");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_sleutel_key" ON "email_templates"("sleutel");

-- CreateIndex
CREATE INDEX "Mijlpaal_seizoen_idx" ON "Mijlpaal"("seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "scouts_email_key" ON "scouts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "scouts_userId_key" ON "scouts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "scouts_stafId_key" ON "scouts"("stafId");

-- CreateIndex
CREATE INDEX "scouting_rapporten_spelerId_seizoen_idx" ON "scouting_rapporten"("spelerId", "seizoen");

-- CreateIndex
CREATE INDEX "scouting_rapporten_scoutId_datum_idx" ON "scouting_rapporten"("scoutId", "datum");

-- CreateIndex
CREATE INDEX "scouting_rapporten_teamSessieId_idx" ON "scouting_rapporten"("teamSessieId");

-- CreateIndex
CREATE INDEX "team_scouting_sessies_owTeamId_seizoen_idx" ON "team_scouting_sessies"("owTeamId", "seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "spelers_kaarten_spelerId_seizoen_key" ON "spelers_kaarten"("spelerId", "seizoen");

-- CreateIndex
CREATE UNIQUE INDEX "scout_badges_scoutId_badge_key" ON "scout_badges"("scoutId", "badge");

-- AddForeignKey
ALTER TABLE "lid_fotos" ADD CONSTRAINT "lid_fotos_rel_code_fkey" FOREIGN KEY ("rel_code") REFERENCES "leden"("rel_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_seizoen_fkey" FOREIGN KEY ("seizoen") REFERENCES "seizoenen"("seizoen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_periodes" ADD CONSTRAINT "team_periodes_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_aliases" ADD CONSTRAINT "team_aliases_ow_team_id_fkey" FOREIGN KEY ("ow_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitie_rondes" ADD CONSTRAINT "competitie_rondes_seizoen_fkey" FOREIGN KEY ("seizoen") REFERENCES "seizoenen"("seizoen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitie_spelers" ADD CONSTRAINT "competitie_spelers_rel_code_fkey" FOREIGN KEY ("rel_code") REFERENCES "leden"("rel_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitie_spelers" ADD CONSTRAINT "competitie_spelers_seizoen_fkey" FOREIGN KEY ("seizoen") REFERENCES "seizoenen"("seizoen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledenverloop" ADD CONSTRAINT "ledenverloop_seizoen_fkey" FOREIGN KEY ("seizoen") REFERENCES "seizoenen"("seizoen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_seizoenen" ADD CONSTRAINT "cohort_seizoenen_seizoen_fkey" FOREIGN KEY ("seizoen") REFERENCES "seizoenen"("seizoen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signalering" ADD CONSTRAINT "signalering_seizoen_fkey" FOREIGN KEY ("seizoen") REFERENCES "seizoenen"("seizoen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_standen" ADD CONSTRAINT "pool_standen_seizoen_fkey" FOREIGN KEY ("seizoen") REFERENCES "seizoenen"("seizoen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_stand_regels" ADD CONSTRAINT "pool_stand_regels_pool_stand_id_fkey" FOREIGN KEY ("pool_stand_id") REFERENCES "pool_standen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staf" ADD CONSTRAINT "Staf_rel_code_fkey" FOREIGN KEY ("rel_code") REFERENCES "leden"("rel_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staf_toewijzingen" ADD CONSTRAINT "staf_toewijzingen_staf_id_fkey" FOREIGN KEY ("staf_id") REFERENCES "Staf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_blauwdrukId_fkey" FOREIGN KEY ("blauwdrukId") REFERENCES "Blauwdruk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_stafId_fkey" FOREIGN KEY ("stafId") REFERENCES "Staf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_gepindDoorId_fkey" FOREIGN KEY ("gepindDoorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_blauwdrukId_fkey" FOREIGN KEY ("blauwdrukId") REFERENCES "Blauwdruk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Versie" ADD CONSTRAINT "Versie_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_versieId_fkey" FOREIGN KEY ("versieId") REFERENCES "Versie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_selectieGroepId_fkey" FOREIGN KEY ("selectieGroepId") REFERENCES "SelectieGroep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectieGroep" ADD CONSTRAINT "SelectieGroep_versieId_fkey" FOREIGN KEY ("versieId") REFERENCES "Versie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectieSpeler" ADD CONSTRAINT "SelectieSpeler_selectieGroepId_fkey" FOREIGN KEY ("selectieGroepId") REFERENCES "SelectieGroep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectieSpeler" ADD CONSTRAINT "SelectieSpeler_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectieStaf" ADD CONSTRAINT "SelectieStaf_selectieGroepId_fkey" FOREIGN KEY ("selectieGroepId") REFERENCES "SelectieGroep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectieStaf" ADD CONSTRAINT "SelectieStaf_stafId_fkey" FOREIGN KEY ("stafId") REFERENCES "Staf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSpeler" ADD CONSTRAINT "TeamSpeler_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSpeler" ADD CONSTRAINT "TeamSpeler_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStaf" ADD CONSTRAINT "TeamStaf_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStaf" ADD CONSTRAINT "TeamStaf_stafId_fkey" FOREIGN KEY ("stafId") REFERENCES "Staf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluatie" ADD CONSTRAINT "Evaluatie_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluatie" ADD CONSTRAINT "Evaluatie_ronde_id_fkey" FOREIGN KEY ("ronde_id") REFERENCES "evaluatie_rondes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_versieId_fkey" FOREIGN KEY ("versieId") REFERENCES "Versie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_doorId_fkey" FOREIGN KEY ("doorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Werkitem" ADD CONSTRAINT "Werkitem_blauwdrukId_fkey" FOREIGN KEY ("blauwdrukId") REFERENCES "Blauwdruk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Werkitem" ADD CONSTRAINT "Werkitem_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Werkitem" ADD CONSTRAINT "Werkitem_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Werkitem" ADD CONSTRAINT "Werkitem_stafId_fkey" FOREIGN KEY ("stafId") REFERENCES "Staf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Werkitem" ADD CONSTRAINT "Werkitem_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actiepunt" ADD CONSTRAINT "Actiepunt_werkitemId_fkey" FOREIGN KEY ("werkitemId") REFERENCES "Werkitem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actiepunt" ADD CONSTRAINT "Actiepunt_blauwdrukId_fkey" FOREIGN KEY ("blauwdrukId") REFERENCES "Blauwdruk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actiepunt" ADD CONSTRAINT "Actiepunt_toegewezenAanId_fkey" FOREIGN KEY ("toegewezenAanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actiepunt" ADD CONSTRAINT "Actiepunt_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activiteit" ADD CONSTRAINT "Activiteit_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activiteit" ADD CONSTRAINT "Activiteit_stafId_fkey" FOREIGN KEY ("stafId") REFERENCES "Staf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activiteit" ADD CONSTRAINT "Activiteit_toegewezenAanId_fkey" FOREIGN KEY ("toegewezenAanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activiteit" ADD CONSTRAINT "Activiteit_blauwdrukId_fkey" FOREIGN KEY ("blauwdrukId") REFERENCES "Blauwdruk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activiteit" ADD CONSTRAINT "Activiteit_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinator_teams" ADD CONSTRAINT "coordinator_teams_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "coordinatoren"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinator_teams" ADD CONSTRAINT "coordinator_teams_ow_team_id_fkey" FOREIGN KEY ("ow_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluatie_uitnodigingen" ADD CONSTRAINT "evaluatie_uitnodigingen_rondeId_fkey" FOREIGN KEY ("rondeId") REFERENCES "evaluatie_rondes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluatie_uitnodigingen" ADD CONSTRAINT "evaluatie_uitnodigingen_ow_team_id_fkey" FOREIGN KEY ("ow_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speler_zelf_evaluaties" ADD CONSTRAINT "speler_zelf_evaluaties_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mijlpaal" ADD CONSTRAINT "Mijlpaal_seizoen_fkey" FOREIGN KEY ("seizoen") REFERENCES "seizoenen"("seizoen") ON DELETE RESTRICT ON UPDATE CASCADE;

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

