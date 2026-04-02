-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "daisy_acties" (
    "id" TEXT NOT NULL,
    "sessieId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "doPayload" JSONB NOT NULL,
    "undoPayload" JSONB NOT NULL,
    "tijdstip" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "namens" TEXT,
    "uitgevoerdIn" TEXT NOT NULL,
    "ongedaan" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "daisy_acties_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "plaatsreserveringen" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "geslacht" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plaatsreserveringen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "daisy_acties_sessieId_idx" ON "daisy_acties"("sessieId");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "daisy_acties_tijdstip_idx" ON "daisy_acties"("tijdstip");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "plaatsreserveringen_teamId_idx" ON "plaatsreserveringen"("teamId");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plaatsreserveringen_teamId_fkey'
  ) THEN
    ALTER TABLE "plaatsreserveringen" ADD CONSTRAINT "plaatsreserveringen_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
