-- CreateTable
CREATE TABLE "werkbord_mutaties" (
    "id" TEXT NOT NULL,
    "versieId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "inverse" JSONB,
    "spelerId" TEXT,
    "vanTeamId" TEXT,
    "naarTeamId" TEXT,
    "selectieGroepId" TEXT,
    "doorId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "werkbord_mutaties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "werkbord_mutaties_versieId_createdAt_idx" ON "werkbord_mutaties"("versieId", "createdAt");

-- CreateIndex
CREATE INDEX "werkbord_mutaties_spelerId_createdAt_idx" ON "werkbord_mutaties"("spelerId", "createdAt");

-- CreateIndex
CREATE INDEX "werkbord_mutaties_doorId_createdAt_idx" ON "werkbord_mutaties"("doorId", "createdAt");

-- AddForeignKey
ALTER TABLE "werkbord_mutaties" ADD CONSTRAINT "werkbord_mutaties_versieId_fkey" FOREIGN KEY ("versieId") REFERENCES "Versie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "werkbord_mutaties" ADD CONSTRAINT "werkbord_mutaties_spelerId_fkey" FOREIGN KEY ("spelerId") REFERENCES "Speler"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "werkbord_mutaties" ADD CONSTRAINT "werkbord_mutaties_doorId_fkey" FOREIGN KEY ("doorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
