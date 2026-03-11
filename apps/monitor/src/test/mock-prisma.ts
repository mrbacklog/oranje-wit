import { vi } from "vitest";
import { createMockPrisma } from "@oranje-wit/test-utils";

export const mockPrisma = createMockPrisma();

vi.mock("@oranje-wit/database", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));
