import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      animate,
      transition,
      initial,
      exit,
      variants,
      style,
      ...props
    }: Record<string, unknown>) => (
      <div style={style as React.CSSProperties} {...props}>
        {children as React.ReactNode}
      </div>
    ),
    button: ({
      children,
      animate,
      transition,
      whileTap,
      style,
      ...props
    }: Record<string, unknown>) => (
      <button style={style as React.CSSProperties} {...props}>
        {children as React.ReactNode}
      </button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock motion variants
vi.mock("../motion/variants", () => ({
  dialogScale: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  overlayBackdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
}));

import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("rendert niets wanneer gesloten", () => {
    const { container } = render(
      <ConfirmDialog open={false} onClose={vi.fn()} onConfirm={vi.fn()} title="Verwijderen?" />
    );
    expect(container.innerHTML).toBe("");
  });

  it("rendert de titel wanneer open", () => {
    render(
      <ConfirmDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Weet je het zeker?" />
    );
    expect(screen.getByText("Weet je het zeker?")).toBeInTheDocument();
  });

  it("rendert de beschrijving wanneer meegegeven", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Verwijderen?"
        description="Dit kan niet ongedaan worden gemaakt."
      />
    );
    expect(screen.getByText("Dit kan niet ongedaan worden gemaakt.")).toBeInTheDocument();
  });

  it("rendert geen beschrijving wanneer niet meegegeven", () => {
    render(
      <ConfirmDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Verwijderen?" />
    );
    expect(screen.queryByText(/ongedaan/)).not.toBeInTheDocument();
  });

  it("heeft role=alertdialog", () => {
    render(<ConfirmDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Test" />);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("heeft aria-modal=true", () => {
    render(<ConfirmDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Test" />);
    expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-modal", "true");
  });

  it("toont de titel in een h2 element", () => {
    render(<ConfirmDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Titel hier" />);
    const heading = screen.getByText("Titel hier");
    expect(heading.tagName).toBe("H2");
  });

  it("toont een annuleer-knop", () => {
    render(<ConfirmDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Test" />);
    expect(screen.getByRole("button", { name: "Annuleren" })).toBeInTheDocument();
  });

  it("toont de standaard bevestig-knop tekst", () => {
    render(<ConfirmDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Test" />);
    expect(screen.getByRole("button", { name: "Bevestigen" })).toBeInTheDocument();
  });

  it("toont een custom bevestig-knop tekst", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test"
        confirmLabel="Verwijder definitief"
      />
    );
    expect(screen.getByRole("button", { name: "Verwijder definitief" })).toBeInTheDocument();
  });

  it("roept onClose aan bij klik op annuleren", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<ConfirmDialog open={true} onClose={handleClose} onConfirm={vi.fn()} title="Test" />);

    await user.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("roept onConfirm en onClose aan bij klik op bevestigen", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog open={true} onClose={handleClose} onConfirm={handleConfirm} title="Test" />
    );

    await user.click(screen.getByRole("button", { name: "Bevestigen" }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("roept onClose aan bij klik op backdrop", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const { container } = render(
      <ConfirmDialog open={true} onClose={handleClose} onConfirm={vi.fn()} title="Test" />
    );

    // Backdrop is het eerste absolute element binnen de fixed container
    const fixedContainer = container.firstChild as HTMLElement;
    const backdrop = fixedContainer.querySelector(".absolute.inset-0") as HTMLElement;
    await user.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
