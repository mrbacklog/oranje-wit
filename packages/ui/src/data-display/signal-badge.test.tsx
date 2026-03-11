import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SignalBadge } from "./signal-badge";

describe("SignalBadge", () => {
  afterEach(() => cleanup());
  it("toont de children tekst", () => {
    render(<SignalBadge ernst="opkoers">Alles goed</SignalBadge>);
    expect(screen.getByText("Alles goed")).toBeInTheDocument();
  });

  it("past kritiek styling toe", () => {
    render(<SignalBadge ernst="kritiek">Urgent</SignalBadge>);
    const badge = screen.getByText("Urgent");
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-800");
    expect(badge.className).toContain("border-red-200");
  });

  it("past aandacht styling toe", () => {
    render(<SignalBadge ernst="aandacht">Let op</SignalBadge>);
    const badge = screen.getByText("Let op");
    expect(badge.className).toContain("bg-yellow-50");
    expect(badge.className).toContain("text-yellow-800");
    expect(badge.className).toContain("border-yellow-200");
  });

  it("past opkoers styling toe", () => {
    render(<SignalBadge ernst="opkoers">Op schema</SignalBadge>);
    const badge = screen.getByText("Op schema");
    expect(badge.className).toContain("bg-green-50");
    expect(badge.className).toContain("text-green-800");
    expect(badge.className).toContain("border-green-200");
  });

  it("rendert als een span element", () => {
    render(<SignalBadge ernst="opkoers">Test</SignalBadge>);
    const badge = screen.getByText("Test");
    expect(badge.tagName).toBe("SPAN");
  });
});
