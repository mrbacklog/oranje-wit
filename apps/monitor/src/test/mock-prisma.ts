import { vi } from "vitest";

export const mockPrisma = {
  lid: { count: vi.fn(), findMany: vi.fn() },
  seizoen: { findMany: vi.fn() },
  oWTeam: { count: vi.fn(), findMany: vi.fn() },
  signalering: { findMany: vi.fn() },
  ledenverloop: { findMany: vi.fn() },
  cohortSeizoen: { findMany: vi.fn() },
  streefmodel: { findMany: vi.fn() },
  $queryRaw: vi.fn(),
};

vi.mock("@oranje-wit/database", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));
