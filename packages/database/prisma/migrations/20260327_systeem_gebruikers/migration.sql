-- CreateTable: gebruikers (centraal gebruikersbeheer)
CREATE TABLE "gebruikers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'VIEWER',
    "scout_rol" "ScoutRol",
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gebruikers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gebruikers_email_key" ON "gebruikers"("email");
