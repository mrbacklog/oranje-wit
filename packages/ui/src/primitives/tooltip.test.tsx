import { render, screen, act, waitFor } from "@testing-library/react";
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
      style,
      ...props
    }: Record<string, unknown>) => (
      <div style={style as React.CSSProperties} {...props}>
        {children as React.ReactNode}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

import { Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("rendert het trigger-element", () => {
    render(
      <Tooltip content="Tooltip tekst">
        <button>Hover mij</button>
      </Tooltip>
    );
    expect(screen.getByRole("button", { name: "Hover mij" })).toBeInTheDocument();
  });

  it("toont de tooltip niet standaard", () => {
    render(
      <Tooltip content="Tooltip tekst">
        <button>Hover mij</button>
      </Tooltip>
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("toont de tooltip bij hover na delay", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Uitleg" delay={0}>
        <button>Hover mij</button>
      </Tooltip>
    );

    await user.hover(screen.getByRole("button", { name: "Hover mij" }));

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
    expect(screen.getByText("Uitleg")).toBeInTheDocument();
  });

  it("verbergt de tooltip bij unhover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Uitleg" delay={0}>
        <button>Hover mij</button>
      </Tooltip>
    );

    await user.hover(screen.getByRole("button", { name: "Hover mij" }));
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    await user.unhover(screen.getByRole("button", { name: "Hover mij" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("rendert de content als tekst in de tooltip", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Meer informatie" delay={0}>
        <button>Info</button>
      </Tooltip>
    );

    await user.hover(screen.getByRole("button", { name: "Info" }));

    await waitFor(() => {
      expect(screen.getByText("Meer informatie")).toBeInTheDocument();
    });
  });
});
