"use client";
import type { ConflictResult, SpelerLocatie } from "@/lib/teamindeling/audit/types";

function locatieLabel(
  l: SpelerLocatie,
  teamNamen: Record<string, string>,
  selectieNamen: Record<string, string>
): string {
  if (l.soort === "pool") return "de spelerspool";
  if (l.soort === "team") return `team ${teamNamen[l.teamId] ?? l.teamId}`;
  return `selectie ${selectieNamen[l.selectieGroepId] ?? l.selectieGroepId}`;
}

export function ConflictToast({
  conflict,
  teamNamen,
  selectieNamen,
  onSluit,
}: {
  conflict: ConflictResult;
  teamNamen: Record<string, string>;
  selectieNamen: Record<string, string>;
  onSluit: () => void;
}) {
  const door = conflict.doorWie?.naam ?? "Iemand anders";
  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: 48,
        right: 16,
        maxWidth: 380,
        borderRadius: 8,
        background: "var(--bg-2)",
        border: "1px solid var(--border-warn, rgba(234,179,8,.5))",
        padding: "12px 16px",
        boxShadow: "0 4px 16px rgba(0,0,0,.35)",
        zIndex: 9000,
        fontSize: 13,
      }}
    >
      <strong style={{ display: "block", color: "var(--text-warn, #ca8a04)", marginBottom: 4 }}>
        Tegelijk bewerkt
      </strong>
      <p style={{ margin: 0, color: "var(--text-1)", lineHeight: 1.5 }}>
        Je verplaatste een speler, maar <strong>{door}</strong> heeft hem ondertussen in{" "}
        {locatieLabel(conflict.werkelijk, teamNamen, selectieNamen)} gezet. Het werkbord is ververst
        — bekijk de actuele plaatsing en probeer opnieuw als je het echt anders wilt.
      </p>
      <button
        onClick={onSluit}
        style={{
          marginTop: 8,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 12,
          color: "var(--text-2)",
          textDecoration: "underline",
        }}
      >
        Sluiten
      </button>
    </div>
  );
}
