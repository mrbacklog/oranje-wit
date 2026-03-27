import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockGetFoto } = vi.hoisted(() => ({
  mockGetFoto: vi.fn(),
}));

vi.mock("@oranje-wit/database", () => ({
  prisma: {},
  getFoto: mockGetFoto,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {},
}));

vi.mock("@oranje-wit/types", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@oranje-wit/auth/checks", () => ({
  guardAuth: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: { email: "test@test.nl", isTC: true, isScout: false, clearance: 3, doelgroepen: [] },
    },
  }),
  guardTC: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: { email: "test@test.nl", isTC: true, isScout: false, clearance: 3, doelgroepen: [] },
    },
  }),
  guardScout: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: { email: "test@test.nl", isTC: true, isScout: true, clearance: 3, doelgroepen: [] },
    },
  }),
  guardCoordinator: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: {
        email: "test@test.nl",
        isTC: true,
        isScout: false,
        clearance: 3,
        doelgroepen: ["ALLE"],
      },
    },
  }),
  guardClearance: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: { email: "test@test.nl", isTC: true, isScout: false, clearance: 3, doelgroepen: [] },
    },
  }),
}));

import { GET } from "./route";

describe("GET /api/foto/:id", () => {
  beforeEach(() => {
    mockGetFoto.mockReset();
  });

  it("retourneert 404 als foto niet bestaat", async () => {
    mockGetFoto.mockResolvedValueOnce(null);

    const req = new Request("http://localhost/test");
    const ctx = { params: Promise.resolve({ id: "ONBEKEND" }) };
    const result = await GET(req, ctx);

    expect(result.status).toBe(404);
  });

  it("retourneert foto met juiste content-type en caching headers", async () => {
    const fakeImage = Buffer.from([0x52, 0x49, 0x46, 0x46]); // RIFF header (WebP start)
    mockGetFoto.mockResolvedValueOnce(fakeImage);

    const req = new Request("http://localhost/test");
    const ctx = { params: Promise.resolve({ id: "TSTN001" }) };
    const res = await GET(req, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Cache-Control")).toContain("public");
    expect(res.headers.get("Cache-Control")).toContain("max-age=3600");
  });
});
