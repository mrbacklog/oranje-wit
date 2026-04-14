import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./allowlist", () => ({
  getCapabilities: vi.fn().mockResolvedValue({
    isTC: true,
    isScout: false,
    clearance: 3,
    doelgroepen: ["ALLE"],
    actief: true,
  }),
  ADMIN_EMAIL: "antjanlaban@gmail.com",
}));

import { authorizeAgent } from "./agent-provider";

describe("authorizeAgent", () => {
  beforeEach(() => {
    process.env.AGENT_SECRET = "dit-is-een-test-secret-van-32-tekens-lang!!";
  });

  it("geeft null terug bij ontbrekend secret", async () => {
    const result = await authorizeAgent({ secret: "" });
    expect(result).toBeNull();
  });

  it("geeft null terug bij verkeerd secret", async () => {
    const result = await authorizeAgent({ secret: "fout-secret" });
    expect(result).toBeNull();
  });

  it("geeft null terug als AGENT_SECRET niet geconfigureerd is", async () => {
    delete process.env.AGENT_SECRET;
    const result = await authorizeAgent({ secret: "whatever" });
    expect(result).toBeNull();
  });

  it("geeft null terug als AGENT_SECRET korter is dan 32 tekens", async () => {
    process.env.AGENT_SECRET = "te-kort";
    const result = await authorizeAgent({ secret: "te-kort" });
    expect(result).toBeNull();
  });

  it("retourneert TC-gebruiker met agentRunId bij geldig secret", async () => {
    const result = await authorizeAgent({
      secret: "dit-is-een-test-secret-van-32-tekens-lang!!",
    });
    expect(result).not.toBeNull();
    expect(result?.agentRunId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(result?.isTC).toBe(true);
  });
});
