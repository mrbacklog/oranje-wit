-- CreateTable: verificatie_tokens (magic link tokens voor NextAuth EmailProvider)
CREATE TABLE "verificatie_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "verificatie_tokens_token_key" ON "verificatie_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificatie_tokens_identifier_token_key" ON "verificatie_tokens"("identifier", "token");

-- CreateTable: toegangs_tokens (tijdelijke links voor evaluaties, scouting, etc.)
CREATE TABLE "toegangs_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "naam" TEXT,
    "type" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "verloopt_op" TIMESTAMP(3) NOT NULL,
    "gebruikt_op" TIMESTAMP(3),
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "toegangs_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "toegangs_tokens_token_key" ON "toegangs_tokens"("token");

-- CreateIndex
CREATE INDEX "toegangs_tokens_token_idx" ON "toegangs_tokens"("token");
