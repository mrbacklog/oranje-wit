"use client";

import { setGezienStatus } from "@/app/(protected)/personen/speler-edit-actions";

interface Props {
  spelerId: string;
  kadersId: string;
  gezien: boolean;
  onOptimistischUpdate: (gezien: boolean) => void;
  onFout: (fout: string) => void;
  onRefresh: () => void;
}

export function GezienToggle({
  spelerId,
  kadersId,
  gezien,
  onOptimistischUpdate,
  onFout,
  onRefresh,
}: Props) {
  return (
    <button
      type="button"
      title={gezien ? "Gezien — klik om te wisselen" : "Niet gezien — klik om te wisselen"}
      onClick={async (e) => {
        e.stopPropagation();
        const nieuw = !gezien;
        onOptimistischUpdate(nieuw);
        const resultaat = await setGezienStatus(kadersId, spelerId, nieuw ? "GROEN" : "ONGEZIEN");
        if (resultaat.ok) {
          onRefresh();
        } else {
          onOptimistischUpdate(gezien);
          onFout(resultaat.error);
        }
      }}
      style={{
        background: "none",
        border: "none",
        padding: "4px 6px",
        fontSize: "1rem",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        color: gezien ? "#22c55e" : "#4b5563",
        opacity: gezien ? 1 : 0.35,
        transition: "color 120ms, opacity 120ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = gezien ? "1" : "0.35";
      }}
    >
      ✓
    </button>
  );
}
