-- CreateTable
CREATE TABLE "passkeys" (
    "id" TEXT NOT NULL,
    "gebruiker_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "credential_public_key" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "credential_device_type" TEXT NOT NULL,
    "credential_backed_up" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "device_name" TEXT,

    CONSTRAINT "passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "passkeys_credential_id_key" ON "passkeys"("credential_id");

-- AddForeignKey
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_gebruiker_id_fkey" FOREIGN KEY ("gebruiker_id") REFERENCES "gebruikers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
