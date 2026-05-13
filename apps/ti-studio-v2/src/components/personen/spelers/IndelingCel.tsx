"use client";

import { useState, useTransition } from "react";
import { updateSpelerIndeling } from "@/app/(personen)/personen/actions";
import { logger } from "@oranje-wit/types";

interface IndelingCelProps {
  spelerId: string;
  versieId: string;
  teamId: string | null;
  teamNaam: string | null;
  teams: Array<{ id: string; naam: string; kleur: string | null }>;
}

export function IndelingCel({ spelerId, versieId, teamId, teamNaam, teams }: IndelingCelProps) {
  const [huidigTeamId, setHuidigTeamId] = useState(teamId);
  const [huidigTeamNaam, setHuidigTeamNaam] = useState(teamNaam);
  const [editMode, setEditMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newTeamId: string) => {
    const vorigeId = huidigTeamId;
    const vorigeNaam = huidigTeamNaam;
    const nyNaam = teams.find((t) => t.id === newTeamId)?.naam ?? null;
    setHuidigTeamId(newTeamId || null);
    setHuidigTeamNaam(nyNaam);
    setEditMode(false);

    startTransition(async () => {
      const result = await updateSpelerIndeling({
        spelerId,
        versieId,
        teamId: newTeamId || null,
      });
      if (!result.ok) {
        logger.warn("IndelingCel: update mislukt:", result.error);
        setHuidigTeamId(vorigeId);
        setHuidigTeamNaam(vorigeNaam);
      }
    });
  };

  if (!versieId) {
    return <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>;
  }

  if (editMode) {
    return (
      <select
        defaultValue={huidigTeamId ?? ""}
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
          maxWidth: 120,
        }}
      >
        <option value="">— geen team —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.naam}
          </option>
        ))}
      </select>
    );
  }

  if (!huidigTeamId) {
    return (
      <button
        onClick={() => setEditMode(true)}
        disabled={isPending}
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          background: "none",
          border: "1px dashed var(--border-1)",
          borderRadius: "var(--radius-sm)",
          padding: "2px 8px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Indelen
      </button>
    );
  }

  return (
    <button
      onClick={() => setEditMode(true)}
      disabled={isPending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px 2px 8px",
        borderRadius: "var(--radius-sm)",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        background: "rgba(34,197,94,.08)",
        border: "1px solid rgba(34,197,94,.2)",
        color: "#4ade80",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        opacity: isPending ? 0.6 : 1,
      }}
      title="Klik om indeling te wijzigen"
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#22c55e",
          flexShrink: 0,
        }}
      />
      {huidigTeamNaam}
    </button>
  );
}
