import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  afterEach(() => cleanup());
  it("toont de titel", () => {
    render(<PageHeader title="Dashboard" subtitle="Overzicht" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("toont de subtitle", () => {
    render(<PageHeader title="Dashboard" subtitle="Seizoen 2025-2026" />);
    expect(screen.getByText("Seizoen 2025-2026")).toBeInTheDocument();
  });

  it("rendert titel als h2", () => {
    render(<PageHeader title="Dashboard" subtitle="Overzicht" />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Dashboard");
  });

  it("rendert subtitle als paragraph", () => {
    render(<PageHeader title="Dashboard" subtitle="Overzicht" />);
    const subtitle = screen.getByText("Overzicht");
    expect(subtitle.tagName).toBe("P");
  });
});
