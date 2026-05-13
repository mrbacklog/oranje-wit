#!/bin/sh
set -e

# apps/ti-studio-v2 — test-schaduwapp.
# Draait tegen test-database (Postgres-test), geen migraties hier.

cd /app
exec node apps/ti-studio-v2/server.js
