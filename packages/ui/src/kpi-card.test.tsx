import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { KpiCard } from "./kpi-card";

describe("KpiCard", () => {
  afterEach(() => cleanup());
  it("toont label en waarde", () => {
    render(<KpiCard label="Leden" value={42} />);
    expect(screen.getByText("Leden")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("toont een string waarde", () => {
    render(<KpiCard label="Retentie" value="85%" />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("toont trend als die meegegeven is", () => {
    render(
      <KpiCard label="Leden" value={42} trend={{ value: 5, label: "t.o.v. vorig seizoen" }} />
    );
    expect(screen.getByText("+5 t.o.v. vorig seizoen")).toBeInTheDocument();
  });

  it("toont negatieve trend zonder plus-teken", () => {
    render(
      <KpiCard label="Leden" value={42} trend={{ value: -3, label: "t.o.v. vorig seizoen" }} />
    );
    expect(screen.getByText("-3 t.o.v. vorig seizoen")).toBeInTheDocument();
  });

  it("toont geen trend als die niet meegegeven is", () => {
    const { container } = render(<KpiCard label="Leden" value={42} />);
    expect(container.querySelectorAll("p")).toHaveLength(2); // label + value only
  });

  it("past signaalkleur toe voor rood", () => {
    render(<KpiCard label="Verloop" value="25%" signal="rood" />);
    const valueEl = screen.getByText("25%");
    expect(valueEl.className).toContain("text-signal-rood");
  });

  it("past signaalkleur toe voor geel", () => {
    render(<KpiCard label="Verloop" value="15%" signal="geel" />);
    const valueEl = screen.getByText("15%");
    expect(valueEl.className).toContain("text-signal-geel");
  });

  it("past signaalkleur toe voor groen", () => {
    render(<KpiCard label="Verloop" value="5%" signal="groen" />);
    const valueEl = screen.getByText("5%");
    expect(valueEl.className).toContain("text-signal-groen");
  });

  it("gebruikt standaardkleur zonder signaal", () => {
    render(<KpiCard label="Leden" value={42} />);
    const valueEl = screen.getByText("42");
    expect(valueEl.className).toContain("text-ow-oranje");
  });
});
