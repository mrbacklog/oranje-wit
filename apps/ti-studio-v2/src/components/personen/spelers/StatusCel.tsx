"use client";

import { useState, useTransition } from "react";
import { updateSpelerStatus } from "@/app/(personen)/personen/actions";
import { logger } from "@oranje-wit/types";

const STATUS_CONFIG: Record<string, { label: string; kleur: string }> = {
  BESCHIKBAAR: { label: "Beschikbaar", kleur: "#22c55e" },
  TWIJFELT: { label: "Twijfelt", kleur: "#f59e0b" },
  GEBLESSEERD: { label: "Geblesseerd", kleur: "#f97316" },
  GAAT_STOPPEN: { label: "Stopt", kleur: "#ef4444" },
  NIEUW_POTENTIEEL: { label: "Nieuw potentieel", kleur: "#3b82f6" },
  NIEUW_DEFINITIEF: { label: "Nieuw definitief", kleur: "#3b82f6" },
  ALGEMEEN_RESERVE: { label: "Alg. reserve", kleur: "#6b7280" },
  RECREANT: { label: "Recreant", kleur: "#9ca3af" },
  NIET_SPELEND: { label: "Niet spelend", kleur: "#9ca3af" },
};

const ALLE_STATUSSEN = Object.keys(STATUS_CONFIG);

interface StatusCelProps {
  spelerId: string;
  huidigeStatus: string;
}

export function StatusCel({ spelerId, huidigeStatus }: StatusCelProps) {
  const [status, setStatus] = useState(huidigeStatus);
  const [editMode, setEditMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const config = STATUS_CONFIG[status] ?? { label: status, kleur: "#9ca3af" };

  const handleChange = (newStatus: string) => {
    const vorige = status;
    setStatus(newStatus); // optimistic
    setEditMode(false);
    startTransition(async () => {
      const result = await updateSpelerStatus({ spelerId, status: newStatus as never });
      if (!result.ok) {
        logger.warn("StatusCel: update mislukt:", result.error);
        setStatus(vorige); // revert
      }
    });
  };

  if (editMode) {
    return (
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setEditMode(false)}
        autoFocus
        style={{
          background: "var(--input-bg)",
          border: "1px solid var(--ow-accent)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-1)",
          fontSize: 12,
          padding: "2px 6px",
          cursor: "pointer",
          fontFamily: "inherit",
          outline: "none",
        }}
      >
        {ALLE_STATUSSEN.map((s) => (
          <option key={s} value={s}>
            {STATUS_CONFIG[s]?.label ?? s}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setEditMode(true)}
      disabled={isPending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        background: "none",
        color: config.kleur,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        opacity: isPending ? 0.6 : 1,
      }}
      title="Klik om status te wijzigen"
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: config.kleur,
          flexShrink: 0,
        }}
      />
      {config.label}
      <span style={{ fontSize: 9, opacity: 0.5 }}>▾</span>
    </button>
  );
}
