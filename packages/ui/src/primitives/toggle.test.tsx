import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Mock framer-motion zodat motion-componenten als gewone HTML renderen
vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      animate,
      transition,
      whileHover,
      whileTap,
      style,
      ...props
    }: Record<string, unknown>) => (
      <button style={style as React.CSSProperties} {...props}>
        {children as React.ReactNode}
      </button>
    ),
    div: ({ children, animate, transition, initial, style, ...props }: Record<string, unknown>) => (
      <div style={style as React.CSSProperties} {...props}>
        {children as React.ReactNode}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

import { Toggle } from "./toggle";

describe("Toggle", () => {
  it("rendert een switch element", () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("heeft aria-checked=false wanneer uit", () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("heeft aria-checked=true wanneer aan", () => {
    render(<Toggle checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("roept onChange aan met de nieuwe waarde bij klik", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} />);

    await user.click(screen.getByRole("switch"));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("roept onChange aan met false bij klik wanneer aan", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle checked={true} onChange={handleChange} />);

    await user.click(screen.getByRole("switch"));
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it("kan disabled zijn", () => {
    render(<Toggle checked={false} onChange={vi.fn()} disabled />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("roept onChange niet aan wanneer disabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle checked={false} onChange={handleChange} disabled />);

    await user.click(screen.getByRole("switch"));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("gebruikt het label als aria-label", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Meldingen" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "Meldingen");
  });

  it("toont het label als zichtbare tekst", () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Meldingen" />);
    expect(screen.getByText("Meldingen")).toBeInTheDocument();
  });

  it("rendert geen zichtbaar label als die niet meegegeven is", () => {
    const { container } = render(<Toggle checked={false} onChange={vi.fn()} />);
    expect(container.querySelector("span")).toBeNull();
  });
});
