import { describe, it, expect } from "vitest";

describe("sportlink types", () => {
  it("SportlinkToken has required fields", () => {
    // Type-level check — als dit compileert, werken de exports
    const token: import("../types").SportlinkToken = {
      navajoToken: "test",
      clubId: "NCX19J3",
      userName: "test@test.nl",
    };
    expect(token.navajoToken).toBe("test");
  });
});
