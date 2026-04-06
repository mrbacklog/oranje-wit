#!/bin/sh
set -e

# Schrijf prisma.config.mjs naast de prisma-map zodat Prisma hem autodiscovered
# (Prisma 7 zoekt prisma.config.{ts,mjs,js} in de working directory)
cat > /app/packages/database/prisma.config.mjs << EOF
export default {
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: "${DATABASE_URL}" }
}
EOF

# Draai pending migraties vanuit de database package directory
cd /app/packages/database
prisma migrate deploy

# Herstel VIEW speler_seizoenen
psql "$DATABASE_URL" -f prisma/views.sql

# Start de applicatie
cd /app
exec node apps/web/server.js
