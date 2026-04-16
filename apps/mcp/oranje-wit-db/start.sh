#!/bin/bash
# PostgreSQL MCP Server voor oranje-wit database
# Leest DATABASE_URL uit .env.local (of .env) om credentials buiten de repo te houden

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

DB_URL=$(grep -m1 '^DATABASE_URL=' "$PROJECT_ROOT/.env.local" 2>/dev/null | cut -d'=' -f2-)
if [ -z "$DB_URL" ]; then
  DB_URL=$(grep -m1 '^DATABASE_URL=' "$PROJECT_ROOT/.env" 2>/dev/null | cut -d'=' -f2-)
fi

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL niet gevonden in .env.local of .env" >&2
  exit 1
fi

exec npx -y @modelcontextprotocol/server-postgres "$DB_URL"
