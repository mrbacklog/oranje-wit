export { prisma } from "@oranje-wit/database";

/**
 * Prisma 7 type-recursie workaround (TS2321).
 * Eenmalige eslint-disable zodat alle call-sites schoon blijven.
 */

export type PrismaFn = (...args: unknown[]) => any;
