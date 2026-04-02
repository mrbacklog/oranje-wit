-- CreateTable
CREATE TABLE "ai_provider_instelling" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'auto',
    "claude_model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "gemini_model" TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    "max_tokens" INTEGER NOT NULL DEFAULT 1024,
    "bijgewerkt_op" TIMESTAMP(3) NOT NULL,
    "bijgewerkt_door" TEXT,

    CONSTRAINT "ai_provider_instelling_pkey" PRIMARY KEY ("id")
);
