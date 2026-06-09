-- CreateTable
CREATE TABLE "TeamindelingPublicatie" (
    "id" TEXT NOT NULL,
    "kadersId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "seizoenLabel" TEXT NOT NULL,
    "introTekst" TEXT NOT NULL,
    "waaromTekst" TEXT NOT NULL,
    "werkwijzeTekst" TEXT NOT NULL,
    "competitieTekst" TEXT NOT NULL,
    "tcTekst" TEXT NOT NULL,
    "kennismakingTekst" TEXT NOT NULL,
    "contactTekst" TEXT NOT NULL,
    "kangoeroesTekst" TEXT NOT NULL,
    "bedankTekst" TEXT NOT NULL,
    "sectieVolgorde" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamindelingPublicatie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamindelingPublicatie_kadersId_key" ON "TeamindelingPublicatie"("kadersId");

-- CreateIndex
CREATE INDEX "TeamindelingPublicatie_kadersId_idx" ON "TeamindelingPublicatie"("kadersId");

-- AddForeignKey
ALTER TABLE "TeamindelingPublicatie" ADD CONSTRAINT "TeamindelingPublicatie_kadersId_fkey" FOREIGN KEY ("kadersId") REFERENCES "Kaders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
