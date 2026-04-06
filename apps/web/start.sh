#!/bin/sh
set -e

# Maak runtime Prisma config met DATABASE_URL uit de omgeving
node -e "
const fs = require('fs');
fs.writeFileSync('/tmp/pc.mjs',
  'export default {' +
  '  schema: \"/app/packages/database/prisma/schema.prisma\",' +
  '  migrations: { path: \"/app/packages/database/prisma/migrations\" },' +
  '  datasource: { url: \"' + process.env.DATABASE_URL + '\" }' +
  '}'
);
"

# Draai pending migraties
prisma migrate deploy --config /tmp/pc.mjs

# Herstel VIEW speler_seizoenen
psql "$DATABASE_URL" -f packages/database/prisma/views.sql

# Start de applicatie
exec node apps/web/server.js
