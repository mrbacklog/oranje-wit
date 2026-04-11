import { describe, it, expect, vi } from "vitest";

vi.mock("@oranje-wit/types", () => ({
  HUIDIG_SEIZOEN: "2025-2026",
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { buildDaisyPrompt } from "./daisy";
import type { AuthSession } from "@oranje-wit/auth/checks";

const mockSession: AuthSession = {
  user: {
    name: "Antjan",
    email: "antjan@example.com",
    clearance: 3,
    isTC: true,
  },
} as AuthSession;

describe("buildDaisyPrompt", () => {
  it("bevat geen werkbord-blok als context ontbreekt", () => {
    const prompt = buildDaisyPrompt(mockSession);
    expect(prompt).not.toContain("Actieve werkindeling");
    expect(prompt).not.toContain("v:");
  });

  it("bevat werkbord-blok met versieId en naam als context aanwezig is", () => {
    const prompt = buildDaisyPrompt(mockSession, {
      versieId: "abc-123",
      werkindelingId: "wi-456",
      werkindelingNaam: "Veld Voorjaar 2026",
    });
    expect(prompt).toContain("Veld Voorjaar 2026");
    expect(prompt).toContain("v:abc-123");
    expect(prompt).toContain("wi-456");
  });

  it("bevat altijd de basisregels ongeacht context", () => {
    const prompt = buildDaisyPrompt(mockSession);
    expect(prompt).toContain("Daisy");
    expect(prompt).toContain("Nederlands");
  });
});
