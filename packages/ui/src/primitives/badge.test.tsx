import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders default (gray) badge", () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText("Status")).toBeDefined();
  });

  it("renders colored variants", () => {
    const { container } = render(<Badge color="green">OK</Badge>);
    expect(container.firstChild?.className).toContain("green");
  });

  it("renders orange variant", () => {
    const { container } = render(<Badge color="orange">Let op</Badge>);
    expect(container.firstChild?.className).toContain("orange");
  });
});
