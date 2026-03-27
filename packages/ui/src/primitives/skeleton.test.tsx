import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("rendert een status element", () => {
    render(<Skeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("heeft aria-label voor toegankelijkheid", () => {
    render(<Skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Laden...");
  });

  it("bevat sr-only tekst voor schermlezers", () => {
    render(<Skeleton />);
    expect(screen.getByText("Laden...")).toBeInTheDocument();
  });

  it("gebruikt de shimmer class", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain("skeleton-shimmer");
  });

  it("past de default text variant toe", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.height).toBe("14px");
    expect(skeleton.style.width).toBe("100%");
  });

  it("past de card variant toe", () => {
    const { container } = render(<Skeleton variant="card" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.height).toBe("120px");
    expect(skeleton.style.borderRadius).toBe("16px");
  });

  it("past de circle variant toe", () => {
    const { container } = render(<Skeleton variant="circle" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe("40px");
    expect(skeleton.style.height).toBe("40px");
    expect(skeleton.style.borderRadius).toBe("50%");
  });

  it("past custom breedte en hoogte toe", () => {
    const { container } = render(<Skeleton width={200} height={50} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe("200px");
    expect(skeleton.style.height).toBe("50px");
  });

  it("accepteert string waarden voor breedte en hoogte", () => {
    const { container } = render(<Skeleton width="80%" height="2rem" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe("80%");
    expect(skeleton.style.height).toBe("2rem");
  });

  it("rendert meerdere regels bij text variant met lines > 1", () => {
    render(<Skeleton variant="text" lines={3} />);
    // Bij meerdere regels wrapping div heeft role="status"
    const status = screen.getByRole("status");
    const shimmerDivs = status.querySelectorAll(".skeleton-shimmer");
    expect(shimmerDivs.length).toBe(3);
  });

  it("maakt de laatste regel korter bij meerdere regels", () => {
    render(<Skeleton variant="text" lines={3} />);
    const status = screen.getByRole("status");
    const shimmerDivs = status.querySelectorAll(".skeleton-shimmer");
    const lastLine = shimmerDivs[2] as HTMLElement;
    expect(lastLine.style.width).toBe("75%");
  });

  it("maakt niet-laatste regels 100% breed", () => {
    render(<Skeleton variant="text" lines={3} />);
    const status = screen.getByRole("status");
    const shimmerDivs = status.querySelectorAll(".skeleton-shimmer");
    const firstLine = shimmerDivs[0] as HTMLElement;
    expect(firstLine.style.width).toBe("100%");
  });

  it("past extra className toe", () => {
    const { container } = render(<Skeleton className="extra" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain("extra");
  });

  it("past extra className toe bij meerdere regels", () => {
    render(<Skeleton variant="text" lines={2} className="extra" />);
    const status = screen.getByRole("status");
    expect(status.className).toContain("extra");
  });
});
