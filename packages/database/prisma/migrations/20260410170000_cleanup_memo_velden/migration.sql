-- Verwijder verouderde memo-velden van Team, Speler en Staf
-- Vervangen door Werkitem (type=MEMO) relaties

-- Team: verwijder notitie, memoStatus, besluit
ALTER TABLE "Team" DROP COLUMN IF EXISTS "notitie";
ALTER TABLE "Team" DROP COLUMN IF EXISTS "memoStatus";
ALTER TABLE "Team" DROP COLUMN IF EXISTS "besluit";

-- Speler: verwijder notitie, memoStatus, besluit
ALTER TABLE "Speler" DROP COLUMN IF EXISTS "notitie";
ALTER TABLE "Speler" DROP COLUMN IF EXISTS "memoStatus";
ALTER TABLE "Speler" DROP COLUMN IF EXISTS "besluit";

-- Staf: verwijder notitie
ALTER TABLE "Staf" DROP COLUMN IF EXISTS "notitie";
