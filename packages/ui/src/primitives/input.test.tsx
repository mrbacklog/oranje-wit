import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("rendert een input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("toont een label wanneer meegegeven", () => {
    render(<Input label="Naam" />);
    expect(screen.getByLabelText("Naam")).toBeInTheDocument();
  });

  it("genereert een id op basis van het label", () => {
    render(<Input label="Voornaam" />);
    const input = screen.getByLabelText("Voornaam");
    expect(input.id).toBe("voornaam");
  });

  it("gebruikt een meegegeven id in plaats van het label", () => {
    render(<Input label="Voornaam" id="custom-id" />);
    const input = screen.getByLabelText("Voornaam");
    expect(input.id).toBe("custom-id");
  });

  it("toont placeholder tekst", () => {
    render(<Input placeholder="Typ hier..." />);
    expect(screen.getByPlaceholderText("Typ hier...")).toBeInTheDocument();
  });

  it("roept onChange aan bij typen", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "test");

    expect(handleChange).toHaveBeenCalled();
  });

  it("kan disabled zijn", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("toont een foutmelding", () => {
    render(<Input error="Dit veld is verplicht" />);
    expect(screen.getByText("Dit veld is verplicht")).toBeInTheDocument();
  });

  it("voegt error-styling toe bij een fout", () => {
    render(<Input error="Fout" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-500");
  });

  it("heeft geen error-styling zonder fout", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input.className).not.toContain("border-red-500");
  });

  it("ondersteunt type email", () => {
    render(<Input type="email" placeholder="email" />);
    const input = screen.getByPlaceholderText("email");
    expect(input).toHaveAttribute("type", "email");
  });

  it("ondersteunt type password", () => {
    render(<Input type="password" placeholder="wachtwoord" />);
    const input = screen.getByPlaceholderText("wachtwoord");
    expect(input).toHaveAttribute("type", "password");
  });

  it("ondersteunt type number", () => {
    render(<Input type="number" placeholder="aantal" />);
    const input = screen.getByPlaceholderText("aantal");
    expect(input).toHaveAttribute("type", "number");
  });

  it("past extra className toe", () => {
    render(<Input className="mijn-class" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("mijn-class");
  });

  it("rendert geen label als die niet meegegeven is", () => {
    const { container } = render(<Input />);
    expect(container.querySelector("label")).toBeNull();
  });

  it("rendert geen foutmelding als die niet meegegeven is", () => {
    const { container } = render(<Input />);
    expect(container.querySelector("p")).toBeNull();
  });
});
