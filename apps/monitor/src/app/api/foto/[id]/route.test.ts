import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { callRoute } from "@oranje-wit/test-utils";
import { GET } from "./route";

describe("GET /api/foto/:id", () => {
  beforeEach(() => {
    mockPrisma.lidFoto.findUnique.mockReset();
  });

  it("retourneert 404 als foto niet bestaat", async () => {
    mockPrisma.lidFoto.findUnique.mockResolvedValueOnce(null);

    const result = await callRoute(GET, {
      method: "GET",
      params: { id: "ONBEKEND" },
    });

    expect(result.status).toBe(404);
  });

  it("retourneert foto met juiste content-type en caching headers", async () => {
    const fakeImage = Buffer.from([0x52, 0x49, 0x46, 0x46]); // RIFF header (WebP start)
    mockPrisma.lidFoto.findUnique.mockResolvedValueOnce({
      imageWebp: fakeImage,
    });

    // We moeten de handler direct aanroepen omdat callRoute JSON/text verwacht
    const req = new Request("http://localhost/test");
    const ctx = { params: Promise.resolve({ id: "TSTN001" }) };
    const res = await GET(req, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Cache-Control")).toContain("public");
    expect(res.headers.get("Cache-Control")).toContain("max-age=3600");
  });
});
