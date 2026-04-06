#!/bin/sh
set -e

# Draai pending migraties — DATABASE_URL staat in schema.prisma via env("DATABASE_URL")
prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma

# Herstel VIEW speler_seizoenen
psql "$DATABASE_URL" -f /app/packages/database/prisma/views.sql

# Start de applicatie
exec node apps/web/server.js
