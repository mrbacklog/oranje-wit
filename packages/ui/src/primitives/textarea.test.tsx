import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("rendert een textarea element", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("toont een label wanneer meegegeven", () => {
    render(<Textarea label="Opmerking" />);
    expect(screen.getByLabelText("Opmerking")).toBeInTheDocument();
  });

  it("genereert een id op basis van het label", () => {
    render(<Textarea label="Extra informatie" />);
    const textarea = screen.getByLabelText("Extra informatie");
    expect(textarea.id).toBe("extra-informatie");
  });

  it("gebruikt een meegegeven id in plaats van het label", () => {
    render(<Textarea label="Opmerking" id="custom-ta" />);
    const textarea = screen.getByLabelText("Opmerking");
    expect(textarea.id).toBe("custom-ta");
  });

  it("toont placeholder tekst", () => {
    render(<Textarea placeholder="Schrijf hier..." />);
    expect(screen.getByPlaceholderText("Schrijf hier...")).toBeInTheDocument();
  });

  it("roept onChange aan bij typen", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "test");

    expect(handleChange).toHaveBeenCalled();
  });

  it("kan disabled zijn", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("toont een foutmelding", () => {
    render(<Textarea error="Dit veld is verplicht" />);
    expect(screen.getByText("Dit veld is verplicht")).toBeInTheDocument();
  });

  it("voegt error-styling toe bij een fout", () => {
    render(<Textarea error="Fout" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.className).toContain("border-red-500");
  });

  it("heeft geen error-styling zonder fout", () => {
    render(<Textarea />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.className).not.toContain("border-red-500");
  });

  it("past extra className toe", () => {
    render(<Textarea className="mijn-class" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.className).toContain("mijn-class");
  });

  it("ondersteunt rows attribuut", () => {
    render(<Textarea rows={5} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "5");
  });

  it("rendert geen label als die niet meegegeven is", () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector("label")).toBeNull();
  });

  it("rendert geen foutmelding als die niet meegegeven is", () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector("p")).toBeNull();
  });
});
