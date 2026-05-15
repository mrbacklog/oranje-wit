-- CreateTable
CREATE TABLE "agent_mutaties" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "inverse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rolledBackAt" TIMESTAMP(3),

    CONSTRAINT "agent_mutaties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_mutaties_agentRunId_idx" ON "agent_mutaties"("agentRunId");
