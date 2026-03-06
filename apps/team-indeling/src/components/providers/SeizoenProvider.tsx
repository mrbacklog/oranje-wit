"use client";

import { createContext, useContext, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setWerkseizoen as setWerkseizoenAction } from "@/app/blauwdruk/actions";
import type { SeizoenInfo } from "@/lib/seizoen";

interface SeizoenContextValue {
  seizoen: string;
  alleSeizoenen: SeizoenInfo[];
  isWerkseizoen: boolean;
  setSeizoen: (seizoen: string) => void;
  setWerkseizoen: (seizoen: string) => void;
  isPending: boolean;
}

const SeizoenContext = createContext<SeizoenContextValue | null>(null);

export function useSeizoen() {
  const ctx = useContext(SeizoenContext);
  if (!ctx) throw new Error("useSeizoen moet binnen SeizoenProvider worden gebruikt");
  return ctx;
}

export default function SeizoenProvider({
  seizoen,
  alleSeizoenen,
  isWerkseizoen,
  children,
}: {
  seizoen: string;
  alleSeizoenen: SeizoenInfo[];
  isWerkseizoen: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setSeizoen = useCallback(
    async (nieuwSeizoen: string) => {
      await fetch("/api/seizoen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seizoen: nieuwSeizoen }),
      });
      router.refresh();
    },
    [router]
  );

  const setWerkseizoen = useCallback(
    (nieuwSeizoen: string) => {
      startTransition(async () => {
        await setWerkseizoenAction(nieuwSeizoen);
        router.refresh();
      });
    },
    [router]
  );

  return (
    <SeizoenContext.Provider
      value={{ seizoen, alleSeizoenen, isWerkseizoen, setSeizoen, setWerkseizoen, isPending }}
    >
      {children}
    </SeizoenContext.Provider>
  );
}
