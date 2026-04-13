#!/bin/bash
set -e

echo "=== Ledenverloop herberekenen ==="

# Laad DATABASE_URL vanuit apps/web/.env
export $(grep -v '^#' apps/web/.env | xargs)

# Leeg de tabel eerst (anders dubbele records bij heruitvoering)
node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect()
  .then(() => c.query('TRUNCATE ledenverloop'))
  .then(() => { console.log('ledenverloop geleegd'); c.end(); });
"

# Herbereken via bestaand script
node -r dotenv/config scripts/js/bereken-verloop.js

# Verifieer resultaat
node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect()
  .then(() => c.query('SELECT COUNT(*) FROM ledenverloop'))
  .then(r => { console.log('ledenverloop records:', r.rows[0].count); c.end(); });
"
