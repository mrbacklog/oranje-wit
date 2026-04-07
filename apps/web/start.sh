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

# Probeer migrate deploy. Bij P3009 (gedeeltelijk uitgevoerde migratie):
# markeer failed migraties als applied en probeer opnieuw.
MIGRATE_OUTPUT=$(prisma migrate deploy 2>&1)
MIGRATE_EXIT=$?
echo "$MIGRATE_OUTPUT"

if [ $MIGRATE_EXIT -ne 0 ]; then
  if echo "$MIGRATE_OUTPUT" | grep -q "P3009"; then
    echo "P3009 gedetecteerd — markeer failed migraties als applied en herstart"
    # Haal de naam van de failed migratie op
    FAILED=$(prisma migrate status 2>&1 | grep -A1 "Following migration have failed:" | tail -1 | tr -d '[:space:]')
    if [ -n "$FAILED" ]; then
      echo "Markeer '$FAILED' als applied"
      prisma migrate resolve --applied "$FAILED"
      # Probeer opnieuw
      prisma migrate deploy
    else
      echo "Kon failed migratie niet bepalen"
      exit 1
    fi
  else
    exit 1
  fi
fi

# Herstel VIEW speler_seizoenen
psql "$DATABASE_URL" -f prisma/views.sql

# Start de applicatie
cd /app
exec node apps/web/server.js
