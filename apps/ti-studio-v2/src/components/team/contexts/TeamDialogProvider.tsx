"use client";

/**
 * TeamDialogProvider — globale opening van TeamDialog vanuit elke
 * v2-component. Gemount in AppShell. Elke component die `useTeamDialog()`
 * aanroept kan de dialoog openen op basis van een teamId.
 *
 * Gebruik:
 *   const { open, close } = useTeamDialog();
 *   <button onClick={() => open(teamId)}>Detail</button>
 *
 *   // Met pre-fetched data (geen extra server-call):
 *   open(teamId, { initialData: team });
 */

import { createContext, useCallback, useContext, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { logger } from "@oranje-wit/types";
import type { TeamKaartData } from "@/app/(app)/(studio)/indeling/_components/werkbord-types";
import { TeamDialog } from "./TeamDialog";
import { getTeamDialogData } from "@/actions/team-actions";

export interface OpenTeamOpts {
  initialData?: TeamKaartData;
}

interface TeamDialogContextValue {
  open: (teamId: string, opts?: OpenTeamOpts) => void;
  close: () => void;
  isOpen: boolean;
  isLoading: boolean;
}

const TeamDialogContext = createContext<TeamDialogContextValue | null>(null);

export function useTeamDialog(): TeamDialogContextValue {
  const ctx = useContext(TeamDialogContext);
  if (!ctx) {
    throw new Error("useTeamDialog moet binnen <TeamDialogProvider> staan");
  }
  return ctx;
}

export function TeamDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TeamKaartData | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = useCallback((teamId: string, opts?: OpenTeamOpts) => {
    if (opts?.initialData) {
      setState(opts.initialData);
      return;
    }

    startTransition(async () => {
      const result = await getTeamDialogData(teamId);
      if (!result.ok) {
        logger.warn("TeamDialogProvider: laden mislukt:", result.error);
        return;
      }
      setState(result.data);
    });
  }, []);

  const close = useCallback(() => setState(null), []);

  const value: TeamDialogContextValue = {
    open,
    close,
    isOpen: state !== null,
    isLoading: isPending,
  };

  return (
    <TeamDialogContext.Provider value={value}>
      {children}
      {state && <TeamDialog team={state} open={true} onClose={close} />}
    </TeamDialogContext.Provider>
  );
}
