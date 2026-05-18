"use client";

/**
 * SpelerDialogProvider — globale opening van SpelerDialog vanuit elke
 * v2-component. Gemount in AppShell. Elke component die `useSpelerDialog()`
 * aanroept kan de dialoog openen op basis van een rel_code (spelerId).
 *
 * Gebruik:
 *   const { open, close } = useSpelerDialog();
 *   <button onClick={() => open(spelerId)}>Detail</button>
 *
 *   // Met pre-fetched data (geen extra server-call):
 *   open(spelerId, { initialData: speler, actieveVersieId, teams });
 *
 *   // Op specifieke tab:
 *   open(spelerId, { initialTab: "werkitems" });
 */

import { createContext, useCallback, useContext, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { logger } from "@oranje-wit/types";
import type { SpelerRijData } from "@/components/personen/types";
import { SpelerDialog, type TabId } from "./SpelerDialog";
import { getSpelerDialogData } from "@/actions/speler-actions";

export interface OpenSpelerOpts {
  initialData?: SpelerRijData;
  initialTab?: TabId;
  actieveVersieId?: string;
  teams?: Array<{ id: string; naam: string; kleur: string | null }>;
}

interface SpelerDialogContextValue {
  open: (spelerId: string, opts?: OpenSpelerOpts) => void;
  close: () => void;
  isOpen: boolean;
  isLoading: boolean;
}

const SpelerDialogContext = createContext<SpelerDialogContextValue | null>(null);

export function useSpelerDialog(): SpelerDialogContextValue {
  const ctx = useContext(SpelerDialogContext);
  if (!ctx) {
    throw new Error("useSpelerDialog moet binnen <SpelerDialogProvider> staan");
  }
  return ctx;
}

interface DialogState {
  speler: SpelerRijData;
  initialTab: TabId;
  actieveVersieId: string | undefined;
  teams: Array<{ id: string; naam: string; kleur: string | null }>;
}

export function SpelerDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = useCallback((spelerId: string, opts?: OpenSpelerOpts) => {
    const initialTab: TabId = opts?.initialTab ?? "pad";
    const actieveVersieId = opts?.actieveVersieId;
    const teams = opts?.teams ?? [];

    if (opts?.initialData) {
      setState({ speler: opts.initialData, initialTab, actieveVersieId, teams });
      return;
    }

    startTransition(async () => {
      const result = await getSpelerDialogData(spelerId);
      if (!result.ok) {
        logger.warn("SpelerDialogProvider: laden mislukt:", result.error);
        return;
      }
      setState({ speler: result.data, initialTab, actieveVersieId, teams });
    });
  }, []);

  const close = useCallback(() => setState(null), []);

  const value: SpelerDialogContextValue = {
    open,
    close,
    isOpen: state !== null,
    isLoading: isPending,
  };

  return (
    <SpelerDialogContext.Provider value={value}>
      {children}
      {state && (
        <SpelerDialog
          speler={state.speler}
          initialTab={state.initialTab}
          actieveVersieId={state.actieveVersieId}
          teams={state.teams}
          onClose={close}
        />
      )}
    </SpelerDialogContext.Provider>
  );
}
