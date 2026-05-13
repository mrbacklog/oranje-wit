#!/bin/sh
set -e

# apps/ti-studio-v2 — test-schaduwapp.
#
# Optionele auto-schema-sync bij elke deploy: alleen actief op v2-test
# (AUTO_SCHEMA_SYNC=true). Houdt het schema van de test-database in
# pas met packages/database/prisma/schema.prisma na main-pushes met
# schema-wijzigingen, zonder de geanonimiseerde test-data te overschrijven.
#
# Op v2-prod blijft AUTO_SCHEMA_SYNC ongezet/false → push wordt overgeslagen,
# productie-DB wordt nooit geraakt.

cd /app

if [ "$AUTO_SCHEMA_SYNC" = "true" ]; then
  if [ -f node_modules/prisma/build/index.js ]; then
    echo "[start] AUTO_SCHEMA_SYNC=true — prisma db push tegen DATABASE_URL..."
    node node_modules/prisma/build/index.js db push \
      --schema=packages/database/prisma/schema.prisma \
      --accept-data-loss
    echo "[start] schema sync klaar."
  else
    echo "[start] AUTO_SCHEMA_SYNC=true maar prisma CLI niet aanwezig in image — sync overgeslagen."
  fi
fi

exec node apps/ti-studio-v2/server.js
