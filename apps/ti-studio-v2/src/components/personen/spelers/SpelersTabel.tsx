"use client";

import { useCallback } from "react";
import type { SpelerRijData } from "@/components/personen/types";
import { SpelersTabelRij } from "./SpelersTabelRij";
import { useSpelerDialog } from "@/components/speler/contexts/SpelerDialogProvider";

interface SpelersTabelProps {
  data: SpelerRijData[];
  actieveVersieId: string;
  kadersId: string;
  teams: Array<{ id: string; naam: string; kleur: string | null }>;
}

const KOLOMMEN = [
  { label: "Foto", align: "left" },
  { label: "Naam", align: "left" },
  { label: "Status", align: "left" },
  { label: "Huidig", align: "left" },
  { label: "Indeling", align: "left" },
  { label: "Memo", align: "left" },
  { label: "Gezien", align: "center" },
  { label: "Leeft.", align: "right" },
];

export function SpelersTabel({ data, actieveVersieId, kadersId, teams }: SpelersTabelProps) {
  const { open } = useSpelerDialog();

  const handleOpenDialog = useCallback(
    (spelerId: string) => {
      const rij = data.find((s) => s.id === spelerId);
      if (!rij) return;
      open(spelerId, { initialData: rij, initialTab: "pad", actieveVersieId, teams });
    },
    [data, open, actieveVersieId, teams]
  );

  const handleOpenWerkitems = useCallback(
    (spelerId: string) => {
      const rij = data.find((s) => s.id === spelerId);
      if (!rij) return;
      open(spelerId, { initialData: rij, initialTab: "werkitems", actieveVersieId, teams });
    },
    [data, open, actieveVersieId, teams]
  );

  if (data.length === 0) {
    return (
      <div
        style={{
          background: "var(--bg-1)",
          borderRadius: "var(--radius-md)",
          padding: "32px 16px",
          textAlign: "center",
          color: "var(--text-3)",
          fontSize: 13,
        }}
      >
        Geen spelers gevonden.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-1)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Tabelheader */}
      <div
        className="spelers-tabel-rij"
        style={{
          borderBottom: "1px solid var(--bg-2)",
          padding: "10px 16px",
        }}
      >
        {KOLOMMEN.map((k, i) => (
          <span
            key={i}
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
              textAlign: k.align as "left" | "center" | "right",
            }}
          >
            {k.label}
          </span>
        ))}
      </div>

      {/* Tabelrijen */}
      {data.map((speler) => (
        <SpelersTabelRij
          key={speler.id}
          speler={speler}
          actieveVersieId={actieveVersieId}
          kadersId={kadersId}
          teams={teams}
          onOpenDialog={handleOpenDialog}
          onOpenWerkitems={handleOpenWerkitems}
        />
      ))}
    </div>
  );
}
