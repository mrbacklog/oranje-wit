"use client";

import { useState, useTransition } from "react";
import { updateGezienStatus } from "@/app/(personen)/personen/actions";
import { logger } from "@oranje-wit/types";

const GEZIEN_CONFIG: Record<string, { label: string; kleur: string }> = {
  ONGEZIEN: { label: "Ongezien", kleur: "var(--gezien-grijs)" },
  GROEN: { label: "Groen", kleur: "var(--gezien-groen)" },
  GEEL: { label: "Geel", kleur: "var(--gezien-geel)" },
  ORANJE: { label: "Oranje", kleur: "var(--gezien-oranje)" },
  ROOD: { label: "Rood", kleur: "var(--gezien-rood)" },
};

const ALLE_STATUSSEN = Object.keys(GEZIEN_CONFIG);

interface GezienCelProps {
  kadersId: string;
  spelerId: string;
  huidigeStatus: string;
}

export function GezienCel({ kadersId, spelerId, huidigeStatus }: GezienCelProps) {
  const [status, setStatus] = useState(huidigeStatus);
  const [editMode, setEditMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const config = GEZIEN_CONFIG[status] ?? GEZIEN_CONFIG["ONGEZIEN"]!;

  const handleChange = (newStatus: string) => {
    const vorige = status;
    setStatus(newStatus); // optimistic
    setEditMode(false);
    startTransition(async () => {
      const result = await updateGezienStatus({
        kadersId,
        spelerId,
        gezienStatus: newStatus as never,
      });
      if (!result.ok) {
        logger.warn("GezienCel: update mislukt:", result.error);
        setStatus(vorige);
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
            {GEZIEN_CONFIG[s]?.label ?? s}
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
        justifyContent: "center",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 4,
        borderRadius: "50%",
        opacity: isPending ? 0.6 : 1,
      }}
      title={`Gezien: ${config.label} — klik om te wijzigen`}
      aria-label={`Gezien status: ${config.label}`}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: config.kleur,
          display: "block",
          boxShadow: `0 0 6px ${config.kleur}`,
        }}
      />
    </button>
  );
}
