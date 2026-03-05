-- =============================================================
-- Migratie: Evaluatie-modellen (rondes, coordinatoren, uitnodigingen, zelfevaluaties, templates)
-- Datum: 2026-03-03
-- Doel: Tabellen aanmaken voor de evaluatie-app
-- LET OP: Handmatig — we gebruiken GEEN db:push (dat dropt de speler_seizoenen VIEW)
-- =============================================================

BEGIN;

-- 1. evaluatie_rondes
CREATE TABLE IF NOT EXISTS "evaluatie_rondes" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seizoen"   TEXT NOT NULL,
  "ronde"     INTEGER NOT NULL,
  "naam"      TEXT NOT NULL,
  "type"      TEXT NOT NULL DEFAULT 'trainer',
  "deadline"  TIMESTAMPTZ(6) NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'concept',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "evaluatie_rondes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "evaluatie_rondes_seizoen_ronde_type_key"
  ON "evaluatie_rondes" ("seizoen", "ronde", "type");

-- 2. coordinatoren
CREATE TABLE IF NOT EXISTS "coordinatoren" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "naam"      TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "coordinatoren_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coordinatoren_email_key"
  ON "coordinatoren" ("email");

-- 3. coordinator_teams
CREATE TABLE IF NOT EXISTS "coordinator_teams" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "coordinatorId"   TEXT NOT NULL,
  "ow_team_id"      INTEGER NOT NULL,
  "seizoen"         TEXT NOT NULL,

  CONSTRAINT "coordinator_teams_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coordinator_teams_coordinatorId_fkey"
    FOREIGN KEY ("coordinatorId") REFERENCES "coordinatoren"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "coordinator_teams_ow_team_id_fkey"
    FOREIGN KEY ("ow_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "coordinator_teams_coordinatorId_ow_team_id_seizoen_key"
  ON "coordinator_teams" ("coordinatorId", "ow_team_id", "seizoen");

-- 4. evaluatie_uitnodigingen
CREATE TABLE IF NOT EXISTS "evaluatie_uitnodigingen" (
  "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "rondeId"             TEXT NOT NULL,
  "type"                TEXT NOT NULL,
  "email"               TEXT NOT NULL,
  "naam"                TEXT NOT NULL,
  "ow_team_id"          INTEGER,
  "spelerId"            TEXT,
  "token"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email_verstuurd"     TIMESTAMPTZ(6),
  "reminder_verstuurd"  TIMESTAMPTZ(6),
  "reminder_aantal"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "evaluatie_uitnodigingen_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "evaluatie_uitnodigingen_rondeId_fkey"
    FOREIGN KEY ("rondeId") REFERENCES "evaluatie_rondes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "evaluatie_uitnodigingen_ow_team_id_fkey"
    FOREIGN KEY ("ow_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "evaluatie_uitnodigingen_token_key"
  ON "evaluatie_uitnodigingen" ("token");

CREATE UNIQUE INDEX IF NOT EXISTS "evaluatie_uitnodigingen_rondeId_email_ow_team_id_key"
  ON "evaluatie_uitnodigingen" ("rondeId", "email", "ow_team_id");

-- 5. speler_zelf_evaluaties
CREATE TABLE IF NOT EXISTS "speler_zelf_evaluaties" (
  "id"                    TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "spelerId"              TEXT NOT NULL,
  "seizoen"               TEXT NOT NULL,
  "ronde"                 INTEGER NOT NULL DEFAULT 1,
  "rondeId"               TEXT,

  "plezier_korfbal"       INTEGER,
  "plezier_team"          INTEGER,
  "plezier_uitdaging"     INTEGER,
  "plezier_toelichting"   TEXT,

  "training_zin"          INTEGER,
  "training_kwaliteit"    INTEGER,
  "wedstrijd_beleving"    INTEGER,
  "training_verbetering"  INTEGER,
  "training_toelichting"  TEXT,

  "toekomst_intentie"     TEXT,
  "toekomst_ambitie"      TEXT,
  "toekomst_toelichting"  TEXT,

  "algemeen_opmerking"    TEXT,

  "coordinator_memo"      TEXT,
  "status"                TEXT NOT NULL DEFAULT 'concept',
  "ingediend_op"          TIMESTAMPTZ(6),

  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "speler_zelf_evaluaties_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "speler_zelf_evaluaties_spelerId_fkey"
    FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "speler_zelf_evaluaties_spelerId_seizoen_ronde_key"
  ON "speler_zelf_evaluaties" ("spelerId", "seizoen", "ronde");

-- 6. email_templates
CREATE TABLE IF NOT EXISTS "email_templates" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sleutel"     TEXT NOT NULL,
  "onderwerp"   TEXT NOT NULL,
  "inhoud_html" TEXT NOT NULL,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_templates_sleutel_key"
  ON "email_templates" ("sleutel");

-- 7. Uitbreiding bestaande "Evaluatie" tabel: 4 nieuwe kolommen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Evaluatie' AND column_name = 'ronde_id'
  ) THEN
    ALTER TABLE "Evaluatie" ADD COLUMN "ronde_id" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Evaluatie' AND column_name = 'coordinator_memo'
  ) THEN
    ALTER TABLE "Evaluatie" ADD COLUMN "coordinator_memo" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Evaluatie' AND column_name = 'status'
  ) THEN
    ALTER TABLE "Evaluatie" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'concept';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Evaluatie' AND column_name = 'ingediend_op'
  ) THEN
    ALTER TABLE "Evaluatie" ADD COLUMN "ingediend_op" TIMESTAMPTZ(6);
  END IF;
END $$;

-- Foreign key van Evaluatie.ronde_id naar evaluatie_rondes.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Evaluatie_ronde_id_fkey'
      AND table_name = 'Evaluatie'
  ) THEN
    ALTER TABLE "Evaluatie"
      ADD CONSTRAINT "Evaluatie_ronde_id_fkey"
      FOREIGN KEY ("ronde_id") REFERENCES "evaluatie_rondes"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Index op ronde_id in Evaluatie
CREATE INDEX IF NOT EXISTS "Evaluatie_ronde_id_idx" ON "Evaluatie" ("ronde_id");

-- =============================================================
-- 8. Seed data: 7 e-mail templates
-- =============================================================

INSERT INTO "email_templates" ("id", "sleutel", "onderwerp", "inhoud_html", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'trainer_uitnodiging',
   'Evaluatieformulier {{team}} - Seizoen {{seizoen}}',
   '<p>Hoi {{naam}},</p>
<p>Het is weer tijd om je spelers te evalueren! Voor <strong>{{team}}</strong> staat de evaluatieronde <strong>{{ronde_naam}}</strong> klaar.</p>
<p>Klik op de link hieronder om het formulier in te vullen:</p>
<p><a href="{{link}}">Evaluatieformulier openen</a></p>
<p>Graag invullen voor <strong>{{deadline}}</strong>.</p>
<p>Alvast bedankt!</p>
<p>Sportieve groet,<br>TC c.k.v. Oranje Wit</p>',
   CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'trainer_herinnering',
   'Herinnering: Evaluatie {{team}} nog niet ingevuld',
   '<p>Hoi {{naam}},</p>
<p>We zagen dat de evaluatie voor <strong>{{team}}</strong> (ronde: {{ronde_naam}}) nog niet is ingevuld.</p>
<p>Kun je dit voor <strong>{{deadline}}</strong> afronden? Het helpt ons enorm bij de teamindeling.</p>
<p><a href="{{link}}">Evaluatieformulier openen</a></p>
<p>Sportieve groet,<br>TC c.k.v. Oranje Wit</p>',
   CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'trainer_bevestiging',
   'Evaluatie {{team}} ontvangen - Bedankt!',
   '<p>Hoi {{naam}},</p>
<p>Bedankt voor het invullen van de evaluatie voor <strong>{{team}}</strong>! We hebben je antwoorden goed ontvangen.</p>
<p>De TC neemt dit mee in de voorbereiding van de teamindeling voor volgend seizoen.</p>
<p>Sportieve groet,<br>TC c.k.v. Oranje Wit</p>',
   CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'coordinator_notificatie',
   'Evaluatie binnengekomen: {{team}} ({{trainer}})',
   '<p>Hoi {{naam}},</p>
<p><strong>{{trainer}}</strong> heeft de evaluatie voor <strong>{{team}}</strong> ingediend.</p>
<p>Je kunt de resultaten bekijken in de <a href="{{link}}">evaluatie-app</a>.</p>
<p>Sportieve groet,<br>TC c.k.v. Oranje Wit</p>',
   CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'coordinator_uitnodiging',
   'Evaluatieronde {{ronde_naam}} gestart - Actie gevraagd',
   '<p>Hoi {{naam}},</p>
<p>De evaluatieronde <strong>{{ronde_naam}}</strong> voor seizoen {{seizoen}} is gestart.</p>
<p>Jouw teams: {{teams}}.</p>
<p>Bekijk de voortgang en beheer de uitnodigingen in de <a href="{{link}}">evaluatie-app</a>.</p>
<p>Sportieve groet,<br>TC c.k.v. Oranje Wit</p>',
   CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'speler_uitnodiging',
   'Hoe vind jij het bij {{team}}? Vul de zelfevaluatie in!',
   '<p>Hoi {{naam}},</p>
<p>We vinden het belangrijk om te weten hoe jij het korfballen bij <strong>{{team}}</strong> ervaart. Daarom vragen we je een korte zelfevaluatie in te vullen.</p>
<p>Het duurt maar een paar minuten en je antwoorden helpen ons om het nog leuker en beter te maken!</p>
<p><a href="{{link}}">Zelfevaluatie invullen</a></p>
<p>Graag invullen voor <strong>{{deadline}}</strong>.</p>
<p>Sportieve groet,<br>TC c.k.v. Oranje Wit</p>',
   CURRENT_TIMESTAMP),

  (gen_random_uuid()::text, 'speler_herinnering',
   'Herinnering: Zelfevaluatie {{team}} nog niet ingevuld',
   '<p>Hoi {{naam}},</p>
<p>We zagen dat je de zelfevaluatie voor <strong>{{team}}</strong> nog niet hebt ingevuld. We horen graag hoe het gaat!</p>
<p>Het kost maar een paar minuten:</p>
<p><a href="{{link}}">Zelfevaluatie invullen</a></p>
<p>Deadline: <strong>{{deadline}}</strong>.</p>
<p>Sportieve groet,<br>TC c.k.v. Oranje Wit</p>',
   CURRENT_TIMESTAMP)
ON CONFLICT ("sleutel") DO NOTHING;

COMMIT;
