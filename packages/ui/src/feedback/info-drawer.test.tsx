import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InfoDrawer } from "./info-drawer";

describe("InfoDrawer", () => {
  it("rendert niets wanneer gesloten", () => {
    const { container } = render(
      <InfoDrawer open={false} onClose={vi.fn()} title="Info">
        Inhoud
      </InfoDrawer>
    );
    expect(container.innerHTML).toBe("");
  });

  it("rendert de titel wanneer open", () => {
    render(
      <InfoDrawer open={true} onClose={vi.fn()} title="Pagina info">
        Inhoud
      </InfoDrawer>
    );
    expect(screen.getByText("Pagina info")).toBeInTheDocument();
  });

  it("rendert de children als content", () => {
    render(
      <InfoDrawer open={true} onClose={vi.fn()} title="Info">
        <p>Uitleg over deze pagina</p>
      </InfoDrawer>
    );
    expect(screen.getByText("Uitleg over deze pagina")).toBeInTheDocument();
  });

  it("heeft role=dialog wanneer open", () => {
    render(
      <InfoDrawer open={true} onClose={vi.fn()} title="Info">
        Inhoud
      </InfoDrawer>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("heeft aria-modal=true", () => {
    render(
      <InfoDrawer open={true} onClose={vi.fn()} title="Info">
        Inhoud
      </InfoDrawer>
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("heeft een aria-label die overeenkomt met de titel", () => {
    render(
      <InfoDrawer open={true} onClose={vi.fn()} title="Mijn info">
        Inhoud
      </InfoDrawer>
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Mijn info");
  });

  it("heeft een sluitknop met toegankelijk label", () => {
    render(
      <InfoDrawer open={true} onClose={vi.fn()} title="Info">
        Inhoud
      </InfoDrawer>
    );
    expect(screen.getByRole("button", { name: "Sluiten" })).toBeInTheDocument();
  });

  it("roept onClose aan bij klik op sluitknop", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <InfoDrawer open={true} onClose={handleClose} title="Info">
        Inhoud
      </InfoDrawer>
    );

    await user.click(screen.getByRole("button", { name: "Sluiten" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("roept onClose aan bij klik op backdrop", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const { container } = render(
      <InfoDrawer open={true} onClose={handleClose} title="Info">
        Inhoud
      </InfoDrawer>
    );

    // Backdrop is het eerste kind-element (een div met fixed inset-0)
    const backdrop = container.querySelector("[aria-hidden='true']")!;
    await user.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("toont de titel in een h3 element", () => {
    render(
      <InfoDrawer open={true} onClose={vi.fn()} title="Titeltest">
        Inhoud
      </InfoDrawer>
    );
    const heading = screen.getByText("Titeltest");
    expect(heading.tagName).toBe("H3");
  });
});
