/**
 * Prisma client alias met any-cast om TS2321 (Prisma v7 type-recursie) te vermijden.
 * Zie packages/database/src/index.ts PrismaFn opmerking voor context.
 */
import { prisma } from "@oranje-wit/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = prisma as any;
