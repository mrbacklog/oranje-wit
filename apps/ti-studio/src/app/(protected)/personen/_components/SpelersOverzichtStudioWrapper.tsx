"use client";

import { useState } from "react";
import SpelersOverzichtStudio from "./SpelersOverzichtStudio";
import { ReserveringenOverzicht } from "./ReserveringenOverzicht";
import { NieuweSpelerDialog } from "./NieuweSpelerDialog";
import { SpelerProfielDialog, DaisyWidget } from "@/components";
import type { StudioSpeler } from "../actions";
import type { StudioReservering } from "../reserveringen-actions";

interface Props {
  spelers: StudioSpeler[];
  reserveringen: StudioReservering[];
  context: {
    kadersId: string | null;
    versieId: string | null;
    doelen: {
      id: string;
      naam: string;
      kleur: string | null;
      type: "team" | "selectie";
    }[];
  };
}

export default function SpelersOverzichtStudioWrapper({ spelers, reserveringen, context }: Props) {
  const [profielId, setProfielId] = useState<string | null>(null);
  const [nieuwDialogOpen, setNieuwDialogOpen] = useState(false);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
        <button
          onClick={() => setNieuwDialogOpen(true)}
          style={{
            padding: "0.375rem 0.875rem",
            borderRadius: 7,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + Nieuwe speler
        </button>
      </div>
      <SpelersOverzichtStudio
        spelers={spelers}
        onOpenProfiel={setProfielId}
        kadersId={context.kadersId}
        versieId={context.versieId}
        versieDoelen={context.doelen}
      />
      <ReserveringenOverzicht reserveringen={reserveringen} />
      <NieuweSpelerDialog open={nieuwDialogOpen} onClose={() => setNieuwDialogOpen(false)} />
      <SpelerProfielDialog
        spelerId={profielId}
        open={!!profielId}
        onClose={() => setProfielId(null)}
      />
      <DaisyWidget />
    </>
  );
}
