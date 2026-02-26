import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { BandPill } from "./band-pill";

describe("BandPill", () => {
  afterEach(() => cleanup());

  it("toont de band naam", () => {
    render(<BandPill band="Blauw" />);
    expect(screen.getByText("Blauw")).toBeInTheDocument();
  });

  it.each([
    ["Blauw", "bg-band-blauw"],
    ["Groen", "bg-band-groen"],
    ["Geel", "bg-band-geel"],
    ["Oranje", "bg-band-oranje"],
    ["Rood", "bg-band-rood"],
    ["Senioren", "bg-gray-600"],
  ])("past juiste kleur toe voor band %s", (band, expectedClass) => {
    render(<BandPill band={band} />);
    const pill = screen.getByText(band);
    expect(pill.className).toContain(expectedClass);
  });

  it("gebruikt fallback styling voor onbekende band", () => {
    render(<BandPill band="Onbekend" />);
    const pill = screen.getByText("Onbekend");
    expect(pill.className).toContain("bg-gray-200");
    expect(pill.className).toContain("text-gray-600");
  });

  it("rendert als een span element", () => {
    render(<BandPill band="Test" />);
    const pill = screen.getByText("Test");
    expect(pill.tagName).toBe("SPAN");
  });
});
