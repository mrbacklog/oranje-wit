import { describe, it, expect } from "vitest";
import { hashRelCode, hashEmail, deterministicIndex } from "./hash";

const SALT = "0123456789abcdef0123456789abcdef";

describe("hashRelCode", () => {
  it("is deterministisch", () => {
    const a = hashRelCode("12345", SALT);
    const b = hashRelCode("12345", SALT);
    expect(a).toBe(b);
  });

  it("verschilt voor verschillende inputs", () => {
    expect(hashRelCode("12345", SALT)).not.toBe(hashRelCode("67890", SALT));
  });

  it("levert 12 cijfers op", () => {
    const h = hashRelCode("12345", SALT);
    expect(h).toMatch(/^\d{12}$/);
  });

  it("verschilt bij andere salt", () => {
    expect(hashRelCode("12345", SALT)).not.toBe(hashRelCode("12345", SALT + "x"));
  });
});

describe("hashEmail", () => {
  it("is deterministisch en hoofdletterongevoelig", () => {
    const a = hashEmail("ANTjan@example.com", SALT);
    const b = hashEmail("antjan@example.com", SALT);
    expect(a).toBe(b);
    expect(a?.endsWith("@test.local")).toBe(true);
  });

  it("returnt null voor lege input", () => {
    expect(hashEmail(null, SALT)).toBeNull();
    expect(hashEmail(undefined, SALT)).toBeNull();
    expect(hashEmail("", SALT)).toBeNull();
  });
});

describe("deterministicIndex", () => {
  it("blijft binnen modulo-range", () => {
    for (let i = 0; i < 100; i++) {
      const idx = deterministicIndex(`seed-${i}`, SALT, [0, 4], 50);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(50);
    }
  });
});
