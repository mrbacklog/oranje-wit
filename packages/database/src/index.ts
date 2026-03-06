import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

// Re-export everything from Prisma client for convenience
export * from "./generated/prisma/client";
