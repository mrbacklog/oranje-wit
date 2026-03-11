"use client";

import { createContext, useContext } from "react";

interface SeizoenContextValue {
  seizoen: string;
  isWerkseizoen: boolean;
}

const SeizoenContext = createContext<SeizoenContextValue | null>(null);

export function useSeizoen() {
  const ctx = useContext(SeizoenContext);
  if (!ctx) throw new Error("useSeizoen moet binnen SeizoenProvider worden gebruikt");
  return ctx;
}

export default function SeizoenProvider({
  seizoen,
  isWerkseizoen,
  children,
}: {
  seizoen: string;
  isWerkseizoen: boolean;
  children: React.ReactNode;
}) {
  return (
    <SeizoenContext.Provider value={{ seizoen, isWerkseizoen }}>{children}</SeizoenContext.Provider>
  );
}
