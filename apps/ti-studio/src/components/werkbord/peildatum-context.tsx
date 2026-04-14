// apps/ti-studio/src/components/werkbord/peildatum-context.tsx
"use client";

/**
 * PeildatumContext — geeft de KNKV-peildatum (31 dec van het startjaar van het
 * actieve seizoen) door aan alle werkbord-components zonder prop-drilling.
 *
 * De TiStudioShell wikkelt zijn children in `<PeildatumProvider value={...}>`
 * met `korfbalPeildatum(state.seizoen)`. Leaf-components (SpelerKaart,
 * SpelerRij, HoverSpelersKaart, TeamKaartSpelerRij) lezen de waarde via
 * `usePeildatum()`. Buiten een provider valt de hook terug op
 * `HUIDIGE_PEILDATUM` zodat detached gebruik (bv. de SpelerProfielDialog
 * vanuit een personen-overzicht) niet crasht.
 */

import { createContext, useContext, type ReactNode } from "react";
import { HUIDIGE_PEILDATUM } from "@oranje-wit/types";

const PeildatumContext = createContext<Date>(HUIDIGE_PEILDATUM);

export function PeildatumProvider({ value, children }: { value: Date; children: ReactNode }) {
  return <PeildatumContext.Provider value={value}>{children}</PeildatumContext.Provider>;
}

export function usePeildatum(): Date {
  return useContext(PeildatumContext);
}
