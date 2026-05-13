"use client";

import { useState } from "react";
import { NieuweStafDialog } from "./NieuweStafDialog";

export function StafFilterbar() {
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
      <input
        type="text"
        placeholder="Zoek staf..."
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--radius-md)",
          padding: "6px 12px",
          color: "var(--text-1)",
          fontSize: 13,
          outline: "none",
          width: 200,
          fontFamily: "inherit",
        }}
        aria-label="Zoek staflid"
      />

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
        + Nieuw staflid
      </button>

      {dialogOpen && <NieuweStafDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}
