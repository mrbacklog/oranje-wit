"use client";

import { useState } from "react";
import { NieuweReserveringDialog } from "./NieuweReserveringDialog";

export function ReserveringenFilterbar() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text-3)" }}>
        Reserveringsspelers (tijdelijke posities zonder Sportlink-koppeling)
      </span>
      <button
        onClick={() => setDialogOpen(true)}
        style={{
          marginLeft: "auto",
          padding: "6px 14px",
          background: "var(--ow-accent)",
          border: "none",
          borderRadius: "var(--radius-md)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        + Nieuwe reservering
      </button>
      {dialogOpen && <NieuweReserveringDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}
