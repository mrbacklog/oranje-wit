import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SignalBadge } from "./signal-badge";

describe("SignalBadge", () => {
  afterEach(() => cleanup());
  it("toont de children tekst", () => {
    render(<SignalBadge ernst="opkoers">Alles goed</SignalBadge>);
    expect(screen.getByText("Alles goed")).toBeInTheDocument();
  });

  it("past kritiek styling toe via inline styles", () => {
    render(<SignalBadge ernst="kritiek">Urgent</SignalBadge>);
    const badge = screen.getByText("Urgent");
    expect(badge.style.backgroundColor).toContain("239, 68, 68");
  });

  it("past aandacht styling toe via inline styles", () => {
    render(<SignalBadge ernst="aandacht">Let op</SignalBadge>);
    const badge = screen.getByText("Let op");
    expect(badge.style.backgroundColor).toContain("234, 179, 8");
  });

  it("past opkoers styling toe via inline styles", () => {
    render(<SignalBadge ernst="opkoers">Op schema</SignalBadge>);
    const badge = screen.getByText("Op schema");
    expect(badge.style.backgroundColor).toContain("34, 197, 94");
  });

  it("past op_koers styling toe via inline styles", () => {
    render(<SignalBadge ernst="op_koers">Op koers</SignalBadge>);
    const badge = screen.getByText("Op koers");
    expect(badge.style.backgroundColor).toContain("34, 197, 94");
  });

  it("onbekende ernst valt terug op grijze styling", () => {
    render(<SignalBadge ernst="onbekend">Fallback</SignalBadge>);
    const badge = screen.getByText("Fallback");
    expect(badge.style.backgroundColor).toContain("156, 163, 175");
  });

  it("rendert als een span element", () => {
    render(<SignalBadge ernst="opkoers">Test</SignalBadge>);
    const badge = screen.getByText("Test");
    expect(badge.tagName).toBe("SPAN");
  });
});
