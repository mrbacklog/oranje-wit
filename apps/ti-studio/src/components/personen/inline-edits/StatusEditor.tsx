"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { updateSpelerStatus } from "@/app/(protected)/indeling/werkindeling-actions";

export type SpelerStatusWaarde =
  | "BESCHIKBAAR"
  | "TWIJFELT"
  | "GEBLESSEERD"
  | "GAAT_STOPPEN"
  | "NIEUW_POTENTIEEL"
  | "NIEUW_DEFINITIEF"
  | "ALGEMEEN_RESERVE";

export const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GEBLESSEERD: "Geblesseerd",
  GAAT_STOPPEN: "Gaat stoppen",
  NIEUW_POTENTIEEL: "Nieuw potentieel",
  NIEUW_DEFINITIEF: "Nieuw definitief",
  ALGEMEEN_RESERVE: "Reserve",
};

export const STATUS_DOT: Record<string, string> = {
  BESCHIKBAAR: "#22c55e",
  TWIJFELT: "#f59e0b",
  GEBLESSEERD: "#f97316",
  GAAT_STOPPEN: "#ef4444",
  NIEUW_POTENTIEEL: "#3b82f6",
  NIEUW_DEFINITIEF: "#3b82f6",
  ALGEMEEN_RESERVE: "#6b7280",
};

const OPTIES: { value: SpelerStatusWaarde; label: string }[] = [
  { value: "BESCHIKBAAR", label: "Beschikbaar" },
  { value: "TWIJFELT", label: "Twijfelt" },
  { value: "GEBLESSEERD", label: "Geblesseerd" },
  { value: "GAAT_STOPPEN", label: "Gaat stoppen" },
  { value: "NIEUW_POTENTIEEL", label: "Nieuw potentieel" },
  { value: "NIEUW_DEFINITIEF", label: "Nieuw definitief" },
  { value: "ALGEMEEN_RESERVE", label: "Reserve" },
];

const popoverBaseStyle: React.CSSProperties = {
  position: "fixed",
  zIndex: 9999,
  background: "var(--surface-card)",
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  padding: "0.375rem",
  minWidth: 180,
  maxHeight: 260,
  overflowY: "auto",
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const itemStyle = (actief: boolean): React.CSSProperties => ({
  padding: "0.375rem 0.625rem",
  borderRadius: 6,
  background: actief ? "rgba(255,107,0,0.1)" : "transparent",
  color: actief ? "var(--accent)" : "var(--text-primary)",
  fontSize: "0.75rem",
  fontWeight: 600,
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  gap: 6,
});

interface Props {
  spelerId: string;
  huidigeStatus: string;
  kadersId: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOptimistischUpdate: (status: string) => void;
  onFout: (fout: string) => void;
  onRefresh: () => void;
}

export function StatusEditor({
  spelerId,
  huidigeStatus,
  kadersId,
  open,
  onOpen,
  onClose,
  onOptimistischUpdate,
  onFout,
  onRefresh,
}: Props) {
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPopoverPos(null);
      return;
    }
    function bereken() {
      const r = buttonRef.current?.getBoundingClientRect();
      if (!r) return;
      setPopoverPos({ top: r.bottom + 4, left: r.left });
    }
    bereken();
    window.addEventListener("scroll", bereken, true);
    window.addEventListener("resize", bereken);
    return () => {
      window.removeEventListener("scroll", bereken, true);
      window.removeEventListener("resize", bereken);
    };
  }, [open]);

  const statusDot = STATUS_DOT[huidigeStatus] ?? "#6b7280";
  const statusLabel = STATUS_LABELS[huidigeStatus] ?? huidigeStatus;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          open ? onClose() : onOpen();
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          background: "none",
          border: "none",
          padding: "4px 8px",
          borderRadius: 5,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background 120ms",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "none";
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: statusDot,
            flexShrink: 0,
          }}
        />
        {statusLabel}
        <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>▾</span>
      </button>

      {open &&
        popoverPos &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ ...popoverBaseStyle, top: popoverPos.top, left: popoverPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {OPTIES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    onOptimistischUpdate(opt.value);
                    onClose();
                    try {
                      await updateSpelerStatus(kadersId, spelerId, opt.value);
                      onRefresh();
                    } catch (err) {
                      onFout(err instanceof Error ? err.message : "Kon status niet bijwerken");
                    }
                  })
                }
                style={itemStyle(opt.value === huidigeStatus)}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: STATUS_DOT[opt.value] ?? "#6b7280",
                    flexShrink: 0,
                  }}
                />
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
