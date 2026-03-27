"use client";

import { createContext, useContext } from "react";

const ZoomScaleContext = createContext(1);

export const ZoomScaleProvider = ZoomScaleContext.Provider;

export function useZoomScale(): number {
  return useContext(ZoomScaleContext);
}
