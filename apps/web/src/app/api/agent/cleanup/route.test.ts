import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { callRoute } from "@oranje-wit/test-utils";

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: mockPrisma,
}));

import { POST } from "./route";

describe("POST /api/agent/cleanup", () => {
  beforeEach(() => {
    process.env.AGENT_SECRET = "dit-is-een-test-secret-van-32-tekens-lang!!";
    mockPrisma.werkindeling.findMany.mockReset();
    mockPrisma.werkindeling.delete.mockReset();
  });

  it("wijst verzoek af bij ontbrekend secret", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: { agentRunId: "abc-123" },
    });
    expect(result.status).toBe(400);
  });

  it("wijst verzoek af bij verkeerd secret", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: { secret: "fout-secret", agentRunId: "abc-123" },
    });
    expect(result.status).toBe(403);
  });

  it("wijst verzoek af bij ontbrekend agentRunId", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: { secret: "dit-is-een-test-secret-van-32-tekens-lang!!" },
    });
    expect(result.status).toBe(400);
  });

  it("ruimt agent-werkindelingen op en geeft aantal terug", async () => {
    mockPrisma.werkindeling.findMany.mockResolvedValueOnce([
      { id: "w1", naam: "agent-abc-123" },
      { id: "w2", naam: "agent-abc-123-v2" },
    ]);
    mockPrisma.werkindeling.delete.mockResolvedValue({});

    const result = await callRoute(POST, {
      method: "POST",
      body: {
        secret: "dit-is-een-test-secret-van-32-tekens-lang!!",
        agentRunId: "abc-123",
      },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { werkindelingenVerwijderd: number } };
    expect(data.ok).toBe(true);
    expect(data.data.werkindelingenVerwijderd).toBe(2);
    expect(mockPrisma.werkindeling.delete).toHaveBeenCalledTimes(2);
  });

  it("retourneert 0 als er niets op te ruimen is", async () => {
    mockPrisma.werkindeling.findMany.mockResolvedValueOnce([]);

    const result = await callRoute(POST, {
      method: "POST",
      body: {
        secret: "dit-is-een-test-secret-van-32-tekens-lang!!",
        agentRunId: "abc-123",
      },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { werkindelingenVerwijderd: number } };
    expect(data.data.werkindelingenVerwijderd).toBe(0);
  });
});
