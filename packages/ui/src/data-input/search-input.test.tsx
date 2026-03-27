import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
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

import { SearchInput } from "./search-input";

describe("SearchInput", () => {
  it("rendert een tekstveld", () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("toont de standaard placeholder", () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Zoeken...")).toBeInTheDocument();
  });

  it("toont een custom placeholder", () => {
    render(<SearchInput value="" onChange={vi.fn()} placeholder="Speler zoeken..." />);
    expect(screen.getByPlaceholderText("Speler zoeken...")).toBeInTheDocument();
  });

  it("toont de huidige waarde", () => {
    render(<SearchInput value="Jan" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Jan");
  });

  it("roept onChange aan bij typen", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchInput value="" onChange={handleChange} />);

    await user.type(screen.getByRole("textbox"), "t");
    expect(handleChange).toHaveBeenCalledWith("t");
  });

  it("toont een wis-knop wanneer er tekst is", () => {
    render(<SearchInput value="zoekterm" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Zoekveld wissen" })).toBeInTheDocument();
  });

  it("toont geen wis-knop wanneer het veld leeg is", () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Zoekveld wissen" })).not.toBeInTheDocument();
  });

  it("wist de waarde bij klik op de wis-knop", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchInput value="zoekterm" onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: "Zoekveld wissen" }));
    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("roept onClear callback aan bij wissen", async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();
    render(<SearchInput value="zoekterm" onChange={vi.fn()} onClear={handleClear} />);

    await user.click(screen.getByRole("button", { name: "Zoekveld wissen" }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("heeft type=text", () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
  });

  it("past extra className toe", () => {
    const { container } = render(<SearchInput value="" onChange={vi.fn()} className="extra" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("extra");
  });
});
