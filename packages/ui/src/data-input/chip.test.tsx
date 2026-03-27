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
      layout,
      layoutId,
      whileHover,
      whileTap,
      style,
      ...props
    }: Record<string, unknown>) => (
      <div style={style as React.CSSProperties} {...props}>
        {children as React.ReactNode}
      </div>
    ),
    span: ({
      children,
      animate,
      transition,
      initial,
      exit,
      style,
      ...props
    }: Record<string, unknown>) => (
      <span style={style as React.CSSProperties} {...props}>
        {children as React.ReactNode}
      </span>
    ),
    button: ({
      children,
      animate,
      transition,
      initial,
      exit,
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

import { Chip } from "./chip";

describe("Chip", () => {
  it("rendert de label tekst", () => {
    render(<Chip label="U15" />);
    expect(screen.getByText("U15")).toBeInTheDocument();
  });

  it("rendert als een niet-interactief element zonder onSelect", () => {
    render(<Chip label="Filter" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("rendert als een button met onSelect", () => {
    render(<Chip label="Filter" onSelect={vi.fn()} />);
    // Chip zelf heeft role="button"
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("roept onSelect aan bij klik", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<Chip label="Filter" onSelect={handleSelect} />);

    await user.click(screen.getByRole("button"));
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it("heeft aria-pressed=true bij geselecteerde chip", () => {
    render(<Chip label="Filter" onSelect={vi.fn()} selected />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("heeft aria-pressed=false bij niet-geselecteerde chip", () => {
    render(<Chip label="Filter" onSelect={vi.fn()} selected={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("toont een verwijderknop wanneer onRemove meegegeven is", () => {
    render(<Chip label="Tag" onRemove={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Tag verwijderen" })).toBeInTheDocument();
  });

  it("roept onRemove aan bij klik op verwijderknop", async () => {
    const user = userEvent.setup();
    const handleRemove = vi.fn();
    render(<Chip label="Tag" onRemove={handleRemove} />);

    await user.click(screen.getByRole("button", { name: "Tag verwijderen" }));
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it("stopt event propagation bij klik op verwijderknop", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleRemove = vi.fn();
    render(<Chip label="Tag" onSelect={handleSelect} onRemove={handleRemove} />);

    await user.click(screen.getByRole("button", { name: "Tag verwijderen" }));
    expect(handleRemove).toHaveBeenCalledTimes(1);
    // onSelect moet NIET zijn aangeroepen door de klik op de X
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it("geeft de juiste aria-label bij geselecteerde chip", () => {
    render(<Chip label="Actief" onSelect={vi.fn()} selected />);
    expect(screen.getByRole("button", { name: "Actief geselecteerd" })).toBeInTheDocument();
  });

  it("geeft de juiste aria-label bij niet-geselecteerde chip", () => {
    render(<Chip label="Actief" onSelect={vi.fn()} selected={false} />);
    expect(screen.getByRole("button", { name: "Actief niet geselecteerd" })).toBeInTheDocument();
  });
});
