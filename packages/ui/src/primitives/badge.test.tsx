import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders default (gray) badge", () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText("Status")).toBeDefined();
  });

  it("renders colored variants via inline styles", () => {
    const { container } = render(<Badge color="green">OK</Badge>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.backgroundColor).toContain("34, 197, 94");
  });

  it("renders orange variant via inline styles", () => {
    const { container } = render(<Badge color="orange">Let op</Badge>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.backgroundColor).toContain("249, 115, 22");
  });
});
