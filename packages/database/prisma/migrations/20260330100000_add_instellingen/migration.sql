-- CreateTable
CREATE TABLE "instellingen" (
    "sleutel" TEXT NOT NULL,
    "waarde" TEXT NOT NULL,
    "geheim" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "instellingen_pkey" PRIMARY KEY ("sleutel")
);
