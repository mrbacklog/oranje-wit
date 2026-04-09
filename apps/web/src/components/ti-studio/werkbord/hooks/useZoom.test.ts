import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useZoom } from "./useZoom";

describe("useZoom", () => {
  it("begint op 0.75 (normaal)", () => {
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoom).toBe(0.75);
    expect(result.current.zoomLevel).toBe("normaal");
  });

  it("zoomLevel is compact bij zoom < 0.64", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(0.5));
    expect(result.current.zoomLevel).toBe("compact");
  });

  it("zoomLevel is detail bij zoom >= 1.0", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(1.0));
    expect(result.current.zoomLevel).toBe("detail");
  });

  it("clamp: zoom blijft tussen 0.4 en 1.5", () => {
    const { result } = renderHook(() => useZoom());
    act(() => result.current.setZoom(0.1));
    expect(result.current.zoom).toBe(0.4);
    act(() => result.current.setZoom(9.9));
    expect(result.current.zoom).toBe(1.5);
  });
});
