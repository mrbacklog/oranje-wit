#!/bin/bash
set -e
echo "=== Signalering herberekenen ==="
export $(grep -v '^#' apps/web/.env | xargs)
node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.query('TRUNCATE signalering')).then(() => { console.log('signalering geleegd'); c.end(); });"
node -r dotenv/config scripts/js/genereer-signalering.js
node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.query('SELECT id, type, ernst FROM signalering')).then(r => { r.rows.forEach(r => console.log(r.ernst, r.type)); c.end(); });"
