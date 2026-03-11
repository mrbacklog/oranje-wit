import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders met primary variant als default", () => {
    render(<Button>Opslaan</Button>);
    const btn = screen.getByRole("button", { name: "Opslaan" });
    expect(btn).toBeDefined();
    expect(btn.className).toContain("bg-ow-oranje");
  });

  it("renders secondary variant", () => {
    render(<Button variant="secondary">Annuleer</Button>);
    const btn = screen.getByRole("button", { name: "Annuleer" });
    expect(btn.className).toContain("border");
    expect(btn.className).not.toContain("bg-ow-oranje");
  });

  it("renders danger variant", () => {
    render(<Button variant="danger">Verwijder</Button>);
    const btn = screen.getByRole("button", { name: "Verwijder" });
    expect(btn.className).toContain("bg-red");
  });

  it("renders ghost variant", () => {
    render(<Button variant="ghost">Meer</Button>);
    const btn = screen.getByRole("button", { name: "Meer" });
    expect(btn.className).not.toContain("bg-ow-oranje");
    expect(btn.className).not.toContain("border");
  });

  it("ondersteunt size sm", () => {
    render(<Button size="sm">Klein</Button>);
    const btn = screen.getByRole("button", { name: "Klein" });
    expect(btn.className).toContain("text-sm");
  });

  it("kan disabled zijn", () => {
    render(<Button disabled>Uit</Button>);
    const btn = screen.getByRole("button", { name: "Uit" });
    expect(btn).toHaveProperty("disabled", true);
  });
});
