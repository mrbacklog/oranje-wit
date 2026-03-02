"use client";

import { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SeizoenContextValue {
  seizoen: string;
  alleSeizoenen: string[];
  isHuidig: boolean;
  setSeizoen: (seizoen: string) => void;
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
  isHuidig,
  children,
}: {
  seizoen: string;
  alleSeizoenen: string[];
  isHuidig: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

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

  return (
    <SeizoenContext.Provider value={{ seizoen, alleSeizoenen, isHuidig, setSeizoen }}>
      {children}
    </SeizoenContext.Provider>
  );
}
