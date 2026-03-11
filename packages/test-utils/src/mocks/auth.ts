import { vi } from "vitest";

export interface MockSession {
  user: {
    email: string;
    name: string;
  };
}

/**
 * Standaard test-sessie (match met E2E auth en allowlist).
 */
export const DEFAULT_SESSION: MockSession = {
  user: {
    email: "antjanlaban@gmail.com",
    name: "Test Gebruiker",
  },
};

/**
 * Mock voor NextAuth auth() functie.
 * Gebruik: vi.mock("@oranje-wit/auth", () => mockAuthModule())
 */
export function mockAuthModule(session: MockSession = DEFAULT_SESSION) {
  return {
    auth: vi.fn().mockResolvedValue(session),
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
}
