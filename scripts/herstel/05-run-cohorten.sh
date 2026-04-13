#!/bin/bash
set -e
echo "=== Cohort_seizoenen herberekenen ==="
export $(grep -v '^#' apps/web/.env | xargs)
node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.query('TRUNCATE cohort_seizoenen')).then(() => { console.log('cohort_seizoenen geleegd'); c.end(); });"
node -r dotenv/config scripts/js/bereken-cohorten.js
node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.query('SELECT COUNT(*) FROM cohort_seizoenen')).then(r => { console.log('cohort_seizoenen records:', r.rows[0].count); c.end(); });"
