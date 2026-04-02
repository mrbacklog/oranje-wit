-- AlterTable: voeg coördinator-voorstel velden toe aan BlauwdrukSpeler
ALTER TABLE "BlauwdrukSpeler"
  ADD COLUMN IF NOT EXISTS "gezien_status_voorgesteld" "GezienStatus",
  ADD COLUMN IF NOT EXISTS "gezien_voorgesteld_door" TEXT,
  ADD COLUMN IF NOT EXISTS "gezien_voorgesteld_notitie" TEXT,
  ADD COLUMN IF NOT EXISTS "gezien_voorgesteld_op" TIMESTAMP(3);
