import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

// Laad .env uit de monorepo root (twee niveaus omhoog)
config({ path: resolve(__dirname, "..", "..", ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
