"use client";

import { useState } from "react";
import type { SyncKaartData, SyncStatus } from "./types";
import { SyncKaart } from "./SyncKaart";
import { SyncOverlay } from "./SyncOverlay";

interface SyncGridProps {
  status: SyncStatus;
  historieKaartData?: SyncKaartData;
}

export function SyncGrid({ status, historieKaartData }: SyncGridProps) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [actieveKaartId, setActieveKaartId] = useState<SyncKaartData["id"] | null>(null);

  function handleSynchroniseer(id: SyncKaartData["id"]) {
    setActieveKaartId(id);
    setOverlayOpen(true);
  }

  const statusMetHistorie: SyncStatus = historieKaartData
    ? { ...status, historie: historieKaartData }
    : status;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SyncKaart data={status.leden} onSynchroniseer={handleSynchroniseer} disabled />
        <SyncKaart data={status.competitie} onSynchroniseer={handleSynchroniseer} disabled />
        <SyncKaart
          data={statusMetHistorie.historie}
          onSynchroniseer={handleSynchroniseer}
          disabled
        />
      </div>

      <SyncOverlay
        open={overlayOpen}
        kaartId={actieveKaartId}
        status={statusMetHistorie}
        onClose={() => {
          setOverlayOpen(false);
          setActieveKaartId(null);
        }}
      />
    </>
  );
}
