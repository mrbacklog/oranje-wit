import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InfoButton } from "./info-button";

describe("InfoButton", () => {
  it("rendert een knop", () => {
    render(<InfoButton onClick={vi.fn()} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("toont de letter i als inhoud", () => {
    render(<InfoButton onClick={vi.fn()} />);
    expect(screen.getByText("i")).toBeInTheDocument();
  });

  it("heeft een toegankelijk label", () => {
    render(<InfoButton onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Pagina-informatie" })).toBeInTheDocument();
  });

  it("roept onClick aan bij klik", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<InfoButton onClick={handleClick} />);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("heeft een title attribuut", () => {
    render(<InfoButton onClick={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "Informatie over deze pagina");
  });
});
