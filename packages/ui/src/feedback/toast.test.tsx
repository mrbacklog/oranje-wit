import { render, screen, act } from "@testing-library/react";
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
      layout,
      variants,
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

// Mock motion variants
vi.mock("../motion/variants", () => ({
  toastSlide: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
}));

import { ToastProvider, useToast } from "./toast";

// Testcomponent die de toast-hook gebruikt
function TestTrigger({
  message = "Testbericht",
  type,
  action,
}: {
  message?: string;
  type?: "success" | "error" | "warning" | "info";
  action?: { label: string; onClick: () => void };
}) {
  const { toast } = useToast();
  return <button onClick={() => toast(message, { type, action, duration: 0 })}>Toon toast</button>;
}

describe("ToastProvider", () => {
  it("rendert children", () => {
    render(
      <ToastProvider>
        <p>App content</p>
      </ToastProvider>
    );
    expect(screen.getByText("App content")).toBeInTheDocument();
  });

  it("toont een toast na aanroep van toast()", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestTrigger message="Opgeslagen!" />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Toon toast" }));
    expect(screen.getByText("Opgeslagen!")).toBeInTheDocument();
  });

  it("toont een sluitknop bij de toast", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Toon toast" }));
    expect(screen.getByRole("button", { name: "Sluiten" })).toBeInTheDocument();
  });

  it("verwijdert de toast bij klik op sluiten", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestTrigger message="Verwijder mij" />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Toon toast" }));
    expect(screen.getByText("Verwijder mij")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sluiten" }));
    expect(screen.queryByText("Verwijder mij")).not.toBeInTheDocument();
  });

  it("toont een actie-knop wanneer meegegeven", async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    render(
      <ToastProvider>
        <TestTrigger
          message="Verwijderd"
          action={{ label: "Ongedaan maken", onClick: handleAction }}
        />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Toon toast" }));
    expect(screen.getByText("Ongedaan maken")).toBeInTheDocument();
  });

  it("roept de actie-callback aan bij klik op actie", async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    render(
      <ToastProvider>
        <TestTrigger
          message="Verwijderd"
          action={{ label: "Ongedaan maken", onClick: handleAction }}
        />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Toon toast" }));
    await user.click(screen.getByText("Ongedaan maken"));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it("kan meerdere toasts tegelijk tonen", async () => {
    const user = userEvent.setup();

    function MultiTrigger() {
      const { toast } = useToast();
      return (
        <>
          <button onClick={() => toast("Eerste", { duration: 0 })}>Toast 1</button>
          <button onClick={() => toast("Tweede", { duration: 0 })}>Toast 2</button>
        </>
      );
    }

    render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: "Toast 1" }));
    await user.click(screen.getByRole("button", { name: "Toast 2" }));

    expect(screen.getByText("Eerste")).toBeInTheDocument();
    expect(screen.getByText("Tweede")).toBeInTheDocument();
  });
});

describe("useToast", () => {
  it("gooit een fout buiten ToastProvider", () => {
    // Suppress console.error van React
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function BadComponent() {
      useToast();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      "useToast moet binnen een <ToastProvider> worden gebruikt"
    );

    spy.mockRestore();
  });
});
