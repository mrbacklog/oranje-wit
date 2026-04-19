-- Lid-tabel uitbreiden met Sportlink sync velden
ALTER TABLE "leden" ADD COLUMN "lid_status" TEXT;
ALTER TABLE "leden" ADD COLUMN "spelactiviteiten" TEXT;
ALTER TABLE "leden" ADD COLUMN "club_teams" TEXT;
ALTER TABLE "leden" ADD COLUMN "leeftijdscategorie" TEXT;
ALTER TABLE "leden" ADD COLUMN "laatst_gesynct_op" TIMESTAMPTZ;

-- SportlinkNotificatie tabel
CREATE TABLE "sportlink_notificaties" (
    "id" SERIAL NOT NULL,
    "rel_code" TEXT NOT NULL,
    "datum" TIMESTAMPTZ NOT NULL,
    "actie" TEXT NOT NULL,
    "entiteit" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "gewijzigd_door" TEXT NOT NULL,
    "gesynct_op" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sportlink_notificaties_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sportlink_notificaties_rel_code_idx" ON "sportlink_notificaties"("rel_code");
CREATE INDEX "sportlink_notificaties_datum_idx" ON "sportlink_notificaties"("datum");
CREATE INDEX "sportlink_notificaties_entiteit_idx" ON "sportlink_notificaties"("entiteit");
