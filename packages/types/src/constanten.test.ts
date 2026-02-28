import { describe, it, expect } from "vitest";
import { PEILJAAR, HUIDIG_SEIZOEN, PEILDATUM, MIN_GENDER_PER_TEAM } from "./constanten";

describe("constanten", () => {
  it("PEILJAAR is een redelijk jaartal", () => {
    expect(PEILJAAR).toBeGreaterThanOrEqual(2024);
    expect(PEILJAAR).toBeLessThanOrEqual(2030);
  });

  it("HUIDIG_SEIZOEN bevat het peiljaar", () => {
    expect(HUIDIG_SEIZOEN).toContain(String(PEILJAAR - 1));
    expect(HUIDIG_SEIZOEN).toContain(String(PEILJAAR));
  });

  it("PEILDATUM is 31 december van het peiljaar", () => {
    expect(PEILDATUM.getFullYear()).toBe(PEILJAAR);
    expect(PEILDATUM.getMonth()).toBe(11); // december = 11
    expect(PEILDATUM.getDate()).toBe(31);
  });

  it("MIN_GENDER_PER_TEAM is positief", () => {
    expect(MIN_GENDER_PER_TEAM).toBeGreaterThan(0);
  });
});
