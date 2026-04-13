#!/bin/sh
set -e

# apps/ti-studio deelt de database met apps/web.
# Migraties worden beheerd door apps/web bij opstarten — niet hier.

cd /app
exec node apps/ti-studio/server.js
