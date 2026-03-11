-- =============================================================
-- Migratie: Hernoem Notitie → Werkitem + notitieId → werkitemId
-- Datum: 2026-03-11
-- Doel: Tabelnaam en kolomnaam in lijn brengen met Prisma model
-- LET OP: Handmatig — we gebruiken GEEN db:push (dat dropt de speler_seizoenen VIEW)
-- =============================================================

BEGIN;

-- 1. Hernoem tabel Notitie → Werkitem
ALTER TABLE "Notitie" RENAME TO "Werkitem";

-- 2. Hernoem FK-kolom in Actiepunt: notitieId → werkitemId
ALTER TABLE "Actiepunt" RENAME COLUMN "notitieId" TO "werkitemId";

-- 3. Hernoem indices (Prisma-gegenereerde namen)
ALTER INDEX IF EXISTS "Notitie_pkey" RENAME TO "Werkitem_pkey";
ALTER INDEX IF EXISTS "Notitie_blauwdrukId_idx" RENAME TO "Werkitem_blauwdrukId_idx";
ALTER INDEX IF EXISTS "Notitie_status_idx" RENAME TO "Werkitem_status_idx";
ALTER INDEX IF EXISTS "Notitie_prioriteit_idx" RENAME TO "Werkitem_prioriteit_idx";

-- 4. Hernoem FK-constraints
ALTER TABLE "Werkitem" RENAME CONSTRAINT "Notitie_blauwdrukId_fkey" TO "Werkitem_blauwdrukId_fkey";
ALTER TABLE "Werkitem" RENAME CONSTRAINT "Notitie_scenarioId_fkey" TO "Werkitem_scenarioId_fkey";
ALTER TABLE "Werkitem" RENAME CONSTRAINT "Notitie_spelerId_fkey" TO "Werkitem_spelerId_fkey";
ALTER TABLE "Werkitem" RENAME CONSTRAINT "Notitie_stafId_fkey" TO "Werkitem_stafId_fkey";
ALTER TABLE "Werkitem" RENAME CONSTRAINT "Notitie_auteurId_fkey" TO "Werkitem_auteurId_fkey";
ALTER TABLE "Actiepunt" RENAME CONSTRAINT "Actiepunt_notitieId_fkey" TO "Actiepunt_werkitemId_fkey";

-- 5. Verwijder oud 'categorie' veld (overblijfsel van Notitie model, niet meer in schema)
ALTER TABLE "Werkitem" DROP COLUMN IF EXISTS "categorie";

COMMIT;
