"use client";

/**
 * StafDialogProvider — globale opening van StafDialog vanuit elke
 * v2-component. Gemount in AppShell. Elke component die `useStafDialog()`
 * aanroept kan de dialoog openen op basis van een stafId.
 *
 * Gebruik:
 *   const { open, close } = useStafDialog();
 *   <button onClick={() => open(stafId)}>Detail</button>
 *
 *   // Met pre-fetched data (geen extra server-call):
 *   open(stafId, { initialData: staflid });
 */

import { createContext, useCallback, useContext, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { logger } from "@oranje-wit/types";
import type { StafRijData } from "@/components/personen/types";
import { getStafDialogData } from "@/actions/staf-actions";
import { StafDialog } from "./StafDialog";

export interface OpenStafOpts {
  initialData?: StafRijData;
}

interface StafDialogContextValue {
  open: (stafId: string, opts?: OpenStafOpts) => void;
  close: () => void;
  isOpen: boolean;
  isLoading: boolean;
}

const StafDialogContext = createContext<StafDialogContextValue | null>(null);

export function useStafDialog(): StafDialogContextValue {
  const ctx = useContext(StafDialogContext);
  if (!ctx) {
    throw new Error("useStafDialog moet binnen <StafDialogProvider> staan");
  }
  return ctx;
}

export function StafDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StafRijData | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = useCallback((stafId: string, opts?: OpenStafOpts) => {
    if (opts?.initialData) {
      setState(opts.initialData);
      return;
    }

    startTransition(async () => {
      const result = await getStafDialogData(stafId);
      if (!result.ok) {
        logger.warn("StafDialogProvider: laden mislukt:", result.error);
        return;
      }
      setState(result.data);
    });
  }, []);

  const close = useCallback(() => setState(null), []);

  const value: StafDialogContextValue = {
    open,
    close,
    isOpen: state !== null,
    isLoading: isPending,
  };

  return (
    <StafDialogContext.Provider value={value}>
      {children}
      {state && <StafDialog staflid={state} open={true} onClose={close} />}
    </StafDialogContext.Provider>
  );
}
