"use client";

import { createContext, useContext, type ReactNode } from "react";

const ReadOnlyContext = createContext<boolean>(false);

/**
 * Provider voor de READ_ONLY-modus.
 *
 * Wordt gevuld vanuit de root layout met `process.env.READ_ONLY === "true"`.
 * UI-componenten lezen `useReadOnly()` om mutate-knoppen te verbergen of
 * te disablen wanneer de app in lees-only modus draait (v2-prod).
 */
export function ReadOnlyProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <ReadOnlyContext.Provider value={value}>{children}</ReadOnlyContext.Provider>;
}

export function useReadOnly(): boolean {
  return useContext(ReadOnlyContext);
}
