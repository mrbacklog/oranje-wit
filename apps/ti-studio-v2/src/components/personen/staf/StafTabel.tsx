"use client";

import { useState } from "react";
import type { StafRijData } from "@/components/personen/types";
import { StafTabelRij } from "./StafTabelRij";
import { StafDialog } from "./StafDialog";

interface StafTabelProps {
  data: StafRijData[];
}

const KOLOMMEN = [
  { label: "Naam", align: "left" },
  { label: "Rollen", align: "left" },
  { label: "Koppelingen", align: "left" },
  { label: "Memo", align: "center" },
  { label: "", align: "center" },
];

export function StafTabel({ data }: StafTabelProps) {
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const selectedStaf = openDialogId ? (data.find((s) => s.id === openDialogId) ?? null) : null;

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
        Geen actieve stafleden gevonden.
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          background: "var(--bg-1)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="staf-tabel-rij"
          style={{ borderBottom: "1px solid var(--bg-2)", padding: "10px 16px" }}
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
                textAlign: k.align as "left" | "center",
              }}
            >
              {k.label}
            </span>
          ))}
        </div>

        {/* Rijen */}
        {data.map((staflid) => (
          <StafTabelRij key={staflid.id} staflid={staflid} onOpenDialog={setOpenDialogId} />
        ))}
      </div>

      {selectedStaf && <StafDialog staflid={selectedStaf} onClose={() => setOpenDialogId(null)} />}
    </>
  );
}
