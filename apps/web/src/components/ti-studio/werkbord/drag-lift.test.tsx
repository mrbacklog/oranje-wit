import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useState, useEffect, useRef } from "react";

// Test de isLanding state-machine: isDragging false → isLanding true → isLanding false na timeout
function useLandingState(isDragging: boolean) {
  const [isLanding, setIsLanding] = useState(false);
  const wasLiftedRef = useRef(false);

  useEffect(() => {
    if (!isDragging && wasLiftedRef.current) {
      setIsLanding(true);
      const t = setTimeout(() => setIsLanding(false), 650);
      return () => clearTimeout(t);
    }
    wasLiftedRef.current = isDragging;
  }, [isDragging]);

  return isLanding;
}

describe("Landing state machine", () => {
  it("isLanding blijft false als isDragging nooit true is geweest", () => {
    const { result } = renderHook(() => {
      const [isDragging] = useState(false);
      return useLandingState(isDragging);
    });
    expect(result.current).toBe(false);
  });

  it("isLanding wordt true zodra isDragging van true naar false gaat", () => {
    const { result, rerender } = renderHook(
      ({ dragging }: { dragging: boolean }) => useLandingState(dragging),
      { initialProps: { dragging: true } }
    );
    expect(result.current).toBe(false);
    rerender({ dragging: false });
    expect(result.current).toBe(true);
  });
});
