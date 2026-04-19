import { describe, it, expect } from "vitest";
import { resolveService } from "./config.js";
import { buildAskCommand } from "./server.js";

describe("resolveService", () => {
  it("web → correct ID", () => {
    expect(resolveService("web").id).toBe("46a4f38c-eff1-4140-ad07-f12be057ef30");
  });

  it("database → correct ID", () => {
    expect(resolveService("database").id).toBe("e7486b49-dba3-4e0a-8709-a501cea860ae");
  });

  it("ti-studio → correct ID", () => {
    expect(resolveService("ti-studio").id).toBe("4feb4549-cafb-433c-89fb-505aeb05ae44");
  });

  it("onbekend → throws met beschikbare services", () => {
    expect(() => resolveService("onbekend")).toThrow("beschikbaar: web, ti-studio, database");
  });
});

describe("buildAskCommand", () => {
  it("builds command without service", () => {
    const { cmd, args } = buildAskCommand("test question");
    expect(cmd).toBe("railway");
    expect(args).toContain("-p");
    expect(args).toContain("test question");
    expect(args).toContain("--json");
    expect(args).not.toContain("--service");
  });

  it("builds command with service scope", () => {
    const { cmd, args } = buildAskCommand("test", "web");
    expect(args).toContain("--service");
    expect(args).toContain("ckvoranjewit.app");
  });
});
