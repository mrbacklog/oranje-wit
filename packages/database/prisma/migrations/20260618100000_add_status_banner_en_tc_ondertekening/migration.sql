-- AlterTable
ALTER TABLE "TeamindelingPublicatie" ADD COLUMN "statusBanner" TEXT,
ADD COLUMN "tcOndertekening" TEXT;

-- Vul bestaande rijen met de standaardteksten
UPDATE "TeamindelingPublicatie"
SET
  "statusBanner"    = '**Voorlopige indeling** — Samenstelling kan nog wijzigen tijdens de voorbereiding en selectiedagen. De definitieve indeling volgt voor aanvang van het seizoen.',
  "tcOndertekening" = E'Wij wensen alle teams een fantastisch seizoen toe.\n— De Technische Commissie, c.k.v. Oranje Wit'
WHERE "statusBanner" IS NULL;
