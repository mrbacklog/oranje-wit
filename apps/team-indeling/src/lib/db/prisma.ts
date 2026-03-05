// Re-export prisma client from shared database package
export { prisma } from "@oranje-wit/database";

// anyTeam: prisma.team met vereenvoudigde types om TS2321 "Excessive stack depth"
// te vermijden bij CI (Linux Prisma binary genereert diepere type-structuur dan Windows).
import { prisma as _prisma } from "@oranje-wit/database";

export const anyTeam = _prisma.team as unknown as {
  findMany: (...args: any[]) => Promise<any[]>;
  findFirst: (...args: any[]) => Promise<any | null>;
  findUniqueOrThrow: (...args: any[]) => Promise<any>;
  create: (...args: any[]) => Promise<any>;
  update: (...args: any[]) => Promise<any>;
  updateMany: (...args: any[]) => Promise<any>;
  delete: (...args: any[]) => Promise<any>;
  count: (...args: any[]) => Promise<number>;
};
