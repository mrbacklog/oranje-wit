-- Rename tabellen
ALTER TABLE "catalogus_versies" RENAME TO "raamwerk_versies";
ALTER TABLE "catalogus_groepen" RENAME TO "leeftijdsgroepen";
ALTER TABLE "catalogus_pijlers" RENAME TO "pijlers";
ALTER TABLE "catalogus_items" RENAME TO "ontwikkel_items";

-- Rename enum
ALTER TYPE "CatalogusStatus" RENAME TO "RaamwerkStatus";
