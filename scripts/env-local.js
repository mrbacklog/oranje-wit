/**
 * Preload-script dat .env.local laadt voordat .env wordt geladen.
 * Gebruik: npx tsx -r ./scripts/env-local.js scripts/seed-demo-data.ts
 */
const { config } = require("dotenv");
const { resolve } = require("path");

const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });
