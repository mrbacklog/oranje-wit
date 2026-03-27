import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardHeader, CardBody } from "./card";

describe("Card", () => {
  it("rendert children", () => {
    render(<Card>Inhoud</Card>);
    expect(screen.getByText("Inhoud")).toBeInTheDocument();
  });

  it("heeft de juiste basis classes", () => {
    const { container } = render(<Card>Test</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-xl");
    expect(card.className).toContain("border");
  });

  it("heeft een shadow via inline style", () => {
    const { container } = render(<Card>Test</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.style.boxShadow).toContain("var(--shadow-card)");
  });

  it("past extra className toe", () => {
    const { container } = render(<Card className="extra">Test</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("extra");
  });

  it("past extra style toe", () => {
    const { container } = render(<Card style={{ maxWidth: "300px" }}>Test</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.style.maxWidth).toBe("300px");
  });

  it("geeft overige props door", () => {
    render(<Card data-testid="mijn-kaart">Test</Card>);
    expect(screen.getByTestId("mijn-kaart")).toBeInTheDocument();
  });
});

describe("CardHeader", () => {
  it("rendert children", () => {
    render(<CardHeader>Header tekst</CardHeader>);
    expect(screen.getByText("Header tekst")).toBeInTheDocument();
  });

  it("heeft border-bottom styling", () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header.className).toContain("border-b");
  });

  it("past extra className toe", () => {
    const { container } = render(<CardHeader className="extra">Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header.className).toContain("extra");
  });
});

describe("CardBody", () => {
  it("rendert children", () => {
    render(<CardBody>Body tekst</CardBody>);
    expect(screen.getByText("Body tekst")).toBeInTheDocument();
  });

  it("heeft padding", () => {
    const { container } = render(<CardBody>Body</CardBody>);
    const body = container.firstChild as HTMLElement;
    expect(body.className).toContain("px-5");
    expect(body.className).toContain("py-4");
  });

  it("past extra className toe", () => {
    const { container } = render(<CardBody className="extra">Body</CardBody>);
    const body = container.firstChild as HTMLElement;
    expect(body.className).toContain("extra");
  });
});
