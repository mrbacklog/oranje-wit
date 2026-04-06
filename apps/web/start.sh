#!/bin/sh
set -e

# Schrijf Prisma config naast de prisma-map zodat relatieve paden kloppen
node -e "
const fs = require('fs');
fs.writeFileSync('/app/packages/database/prisma.config.mjs',
  'export default {' +
  '  schema: \"prisma/schema.prisma\",' +
  '  migrations: { path: \"prisma/migrations\" },' +
  '  datasource: { url: \"' + process.env.DATABASE_URL + '\" }' +
  '}'
);
"

# Draai pending migraties
prisma migrate deploy --config /app/packages/database/prisma.config.mjs

# Herstel VIEW speler_seizoenen
psql "$DATABASE_URL" -f packages/database/prisma/views.sql

# Start de applicatie
exec node apps/web/server.js
