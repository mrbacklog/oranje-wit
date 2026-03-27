import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeAll } from "vitest";
import { Dialog } from "./dialog";

// jsdom heeft geen native showModal/close, dus mocken we die
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("Dialog", () => {
  it("rendert de titel", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Bevestig">
        Inhoud
      </Dialog>
    );
    expect(screen.getByText("Bevestig")).toBeInTheDocument();
  });

  it("rendert de children als content", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Test">
        <p>Dit is de body</p>
      </Dialog>
    );
    expect(screen.getByText("Dit is de body")).toBeInTheDocument();
  });

  it("rendert een footer wanneer meegegeven", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Test" footer={<button>Opslaan</button>}>
        Inhoud
      </Dialog>
    );
    expect(screen.getByRole("button", { name: "Opslaan" })).toBeInTheDocument();
  });

  it("rendert geen footer wanneer niet meegegeven", () => {
    const { container } = render(
      <Dialog open={true} onClose={vi.fn()} title="Test">
        Inhoud
      </Dialog>
    );
    // Alleen header + content divs, geen footer div
    const dialoog = container.querySelector("dialog")!;
    const sections = dialoog.querySelectorAll(":scope > div");
    expect(sections.length).toBe(2); // header + body
  });

  it("roept showModal aan wanneer open is true", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Test">
        Inhoud
      </Dialog>
    );
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it("gebruikt een dialog element", () => {
    const { container } = render(
      <Dialog open={true} onClose={vi.fn()} title="Test">
        Inhoud
      </Dialog>
    );
    expect(container.querySelector("dialog")).toBeInTheDocument();
  });

  it("toont de titel in een h2 element", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Mijn Titel">
        Inhoud
      </Dialog>
    );
    const heading = screen.getByText("Mijn Titel");
    expect(heading.tagName).toBe("H2");
  });
});
