import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "prisma/config";

// Laad .env.local (als het bestaat), dan .env als fallback — zelfde volgorde als Next.js
config({ path: resolve(__dirname, "..", "..", ".env.local") });
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
