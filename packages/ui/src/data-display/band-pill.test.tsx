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
  ])("past juiste kleur toe voor band %s", (band, expectedClass) => {
    render(<BandPill band={band} />);
    const pill = screen.getByText(band);
    expect(pill.className).toContain(expectedClass);
  });

  it("gebruikt semantic token styling voor Senioren", () => {
    render(<BandPill band="Senioren" />);
    const pill = screen.getByText("Senioren");
    expect(pill.style.backgroundColor).toBe("var(--text-tertiary)");
  });

  it("gebruikt fallback styling voor onbekende band", () => {
    render(<BandPill band="Onbekend" />);
    const pill = screen.getByText("Onbekend");
    expect(pill.style.backgroundColor).toBe("var(--surface-sunken)");
    expect(pill.style.color).toBe("var(--text-secondary)");
  });

  it("rendert als een span element", () => {
    render(<BandPill band="Test" />);
    const pill = screen.getByText("Test");
    expect(pill.tagName).toBe("SPAN");
  });
});
