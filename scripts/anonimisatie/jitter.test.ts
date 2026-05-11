import { describe, it, expect } from "vitest";
import { jitterDate } from "./jitter";

const SALT = "0123456789abcdef0123456789abcdef";

function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

describe("jitterDate", () => {
  it("is deterministisch voor dezelfde input", () => {
    const a = jitterDate(utc(2010, 6, 15), "12345", SALT);
    const b = jitterDate(utc(2010, 6, 15), "12345", SALT);
    expect(a?.toISOString()).toBe(b?.toISOString());
  });

  it("respecteert kalenderjaargrens — eind december blijft in zelfde jaar", () => {
    // Genereer 100 verschillende rel_codes en check dat het jaar nooit wisselt
    for (let i = 0; i < 100; i++) {
      const d = utc(2008, 12, 31);
      const j = jitterDate(d, `rel-${i}`, SALT);
      expect(j?.getUTCFullYear()).toBe(2008);
    }
  });

  it("respecteert kalenderjaargrens — 1 januari blijft in zelfde jaar", () => {
    for (let i = 0; i < 100; i++) {
      const d = utc(2009, 1, 1);
      const j = jitterDate(d, `rel-${i}`, SALT);
      expect(j?.getUTCFullYear()).toBe(2009);
    }
  });

  it("biedt voldoende spreiding midden in het jaar", () => {
    const datums = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const j = jitterDate(utc(2010, 6, 15), `rel-${i}`, SALT);
      if (j) datums.add(j.toISOString().slice(0, 10));
    }
    // Verwacht ten minste 10 unieke uitkomsten — bewijst dat het jittert
    expect(datums.size).toBeGreaterThan(10);
  });

  it("returnt null voor null-input", () => {
    expect(jitterDate(null, "x", SALT)).toBeNull();
    expect(jitterDate(undefined, "x", SALT)).toBeNull();
  });

  it("verschuift inderdaad (niet de identieke datum)", () => {
    // Bij voldoende verschillende seeds moet minstens één keer NIET de oorspronkelijke datum uitkomen
    const oorspronkelijk = utc(2010, 6, 15).toISOString();
    let aantalVerschillend = 0;
    for (let i = 0; i < 20; i++) {
      const j = jitterDate(utc(2010, 6, 15), `rel-${i}`, SALT);
      if (j && j.toISOString() !== oorspronkelijk) aantalVerschillend++;
    }
    expect(aantalVerschillend).toBeGreaterThan(15);
  });
});
