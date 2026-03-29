-- CreateEnum
CREATE TYPE "BerichtRol" AS ENUM ('GEBRUIKER', 'ASSISTENT', 'SYSTEEM', 'TOOL');

-- CreateTable
CREATE TABLE "ai_gesprekken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seizoen" TEXT NOT NULL,
    "titel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_gesprekken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_berichten" (
    "id" TEXT NOT NULL,
    "gesprek_id" TEXT NOT NULL,
    "rol" "BerichtRol" NOT NULL,
    "inhoud" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_berichten_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_berichten" ADD CONSTRAINT "ai_berichten_gesprek_id_fkey" FOREIGN KEY ("gesprek_id") REFERENCES "ai_gesprekken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
