export { prisma } from "@oranje-wit/database";

// Prisma 7 type-recursie workaround (TS2321)

export type PrismaFn = (...a: never[]) => any;
