import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Mock framer-motion zodat motion.button als gewone button rendert
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
  },
}));

import { IconButton } from "./icon-button";

const TestIcon = () => (
  <svg data-testid="test-icon" viewBox="0 0 24 24">
    <path d="M12 2L2 22h20L12 2z" />
  </svg>
);

describe("IconButton", () => {
  it("rendert een knop", () => {
    render(<IconButton icon={<TestIcon />} label="Sluiten" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("rendert het icon als children", () => {
    render(<IconButton icon={<TestIcon />} label="Sluiten" />);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("gebruikt het label als aria-label", () => {
    render(<IconButton icon={<TestIcon />} label="Meer opties" />);
    expect(screen.getByRole("button", { name: "Meer opties" })).toBeInTheDocument();
  });

  it("roept onClick aan bij klik", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<IconButton icon={<TestIcon />} label="Klik" onClick={handleClick} />);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("kan disabled zijn", () => {
    render(<IconButton icon={<TestIcon />} label="Uit" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("roept onClick niet aan wanneer disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<IconButton icon={<TestIcon />} label="Uit" onClick={handleClick} disabled />);

    await user.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("heeft type=button", () => {
    render(<IconButton icon={<TestIcon />} label="Test" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("past extra className toe", () => {
    render(<IconButton icon={<TestIcon />} label="Test" className="extra" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("extra");
  });

  it("past grootte sm toe", () => {
    render(<IconButton icon={<TestIcon />} label="Klein" size="sm" />);
    const button = screen.getByRole("button");
    expect(button.style.width).toBe("36px");
    expect(button.style.height).toBe("36px");
  });

  it("past grootte md toe als default", () => {
    render(<IconButton icon={<TestIcon />} label="Medium" />);
    const button = screen.getByRole("button");
    expect(button.style.width).toBe("44px");
    expect(button.style.height).toBe("44px");
  });

  it("past grootte lg toe", () => {
    render(<IconButton icon={<TestIcon />} label="Groot" size="lg" />);
    const button = screen.getByRole("button");
    expect(button.style.width).toBe("52px");
    expect(button.style.height).toBe("52px");
  });
});
