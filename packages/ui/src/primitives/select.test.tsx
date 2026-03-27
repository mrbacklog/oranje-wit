import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./select";

describe("Select", () => {
  it("rendert een select element", () => {
    render(
      <Select>
        <option value="a">A</option>
      </Select>
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("toont een label wanneer meegegeven", () => {
    render(
      <Select label="Seizoen">
        <option value="2025">2025-2026</option>
      </Select>
    );
    expect(screen.getByLabelText("Seizoen")).toBeInTheDocument();
  });

  it("genereert een id op basis van het label", () => {
    render(
      <Select label="Team keuze">
        <option value="1">Team 1</option>
      </Select>
    );
    const select = screen.getByLabelText("Team keuze");
    expect(select.id).toBe("team-keuze");
  });

  it("gebruikt een meegegeven id in plaats van het label", () => {
    render(
      <Select label="Seizoen" id="my-select">
        <option value="a">A</option>
      </Select>
    );
    const select = screen.getByLabelText("Seizoen");
    expect(select.id).toBe("my-select");
  });

  it("rendert meerdere opties", () => {
    render(
      <Select label="Keuze">
        <option value="a">Optie A</option>
        <option value="b">Optie B</option>
        <option value="c">Optie C</option>
      </Select>
    );
    expect(screen.getByRole("option", { name: "Optie A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Optie B" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Optie C" })).toBeInTheDocument();
  });

  it("roept onChange aan bij selectie", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Select label="Keuze" onChange={handleChange}>
        <option value="a">Optie A</option>
        <option value="b">Optie B</option>
      </Select>
    );

    await user.selectOptions(screen.getByLabelText("Keuze"), "b");
    expect(handleChange).toHaveBeenCalled();
  });

  it("kan disabled zijn", () => {
    render(
      <Select disabled>
        <option value="a">A</option>
      </Select>
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("past extra className toe", () => {
    render(
      <Select className="extra">
        <option value="a">A</option>
      </Select>
    );
    const select = screen.getByRole("combobox");
    expect(select.className).toContain("extra");
  });

  it("rendert geen label als die niet meegegeven is", () => {
    const { container } = render(
      <Select>
        <option value="a">A</option>
      </Select>
    );
    expect(container.querySelector("label")).toBeNull();
  });

  it("ondersteunt een default waarde", () => {
    render(
      <Select label="Keuze" defaultValue="b">
        <option value="a">Optie A</option>
        <option value="b">Optie B</option>
      </Select>
    );
    const select = screen.getByLabelText("Keuze") as HTMLSelectElement;
    expect(select.value).toBe("b");
  });
});
