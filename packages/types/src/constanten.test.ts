import { describe, it, expect } from "vitest";
import { HUIDIG_SEIZOEN, HUIDIGE_PEILDATUM, MIN_GENDER_PER_TEAM } from "./constanten";
import { korfbalPeildatum } from "./korfballeeftijd";

describe("constanten", () => {
  it("HUIDIG_SEIZOEN heeft het formaat YYYY-YYYY", () => {
    expect(HUIDIG_SEIZOEN).toMatch(/^\d{4}-\d{4}$/);
  });

  it("HUIDIGE_PEILDATUM komt overeen met korfbalPeildatum(HUIDIG_SEIZOEN)", () => {
    const expected = korfbalPeildatum(HUIDIG_SEIZOEN);
    expect(HUIDIGE_PEILDATUM.getTime()).toBe(expected.getTime());
  });

  it("HUIDIGE_PEILDATUM is 31 december", () => {
    expect(HUIDIGE_PEILDATUM.getMonth()).toBe(11);
    expect(HUIDIGE_PEILDATUM.getDate()).toBe(31);
  });

  it("MIN_GENDER_PER_TEAM is 2", () => {
    expect(MIN_GENDER_PER_TEAM).toBe(2);
  });
});
