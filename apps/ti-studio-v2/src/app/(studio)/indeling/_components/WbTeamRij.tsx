"use client";

import type { TeamKaartData } from "./werkbord-types";

const CAT_KLEUREN: Record<string, string> = {
  SENIOR: "var(--cat-senior)",
  rood: "var(--cat-rood)",
  oranje: "var(--cat-oranje)",
  geel: "var(--cat-geel)",
  groen: "var(--cat-groen)",
  blauw: "var(--cat-blauw)",
};

const VAL_KLEUREN: Record<string, string> = {
  OK: "var(--val-ok)",
  WAARSCHUWING: "var(--val-warn)",
  FOUT: "var(--val-err)",
  ONBEKEND: "var(--border-default)",
};

interface WbTeamRijProps {
  team: TeamKaartData;
  actief?: boolean;
  onClick: () => void;
}

export function WbTeamRij({ team, actief = false, onClick }: WbTeamRijProps) {
  const teamKleur =
    (team.kleur ? CAT_KLEUREN[team.kleur] : null) ??
    CAT_KLEUREN[team.categorie] ??
    "var(--border-default)";
  const valKleur = VAL_KLEUREN[team.validatieStatus] ?? "var(--border-default)";
  const aantalSpelers = team.spelersDames.length + team.spelersHeren.length;

  return (
    <div
      className={`wb-team-rij${actief ? "active" : ""}`}
      style={{ "--team-kleur": teamKleur } as React.CSSProperties}
      onClick={onClick}
    >
      <span className="t-naam">{team.alias ?? team.naam}</span>
      <span className="t-count">
        ♀{team.spelersDames.length} ♂{team.spelersHeren.length}
        {aantalSpelers > 0 && <span style={{ marginLeft: 4 }}>({aantalSpelers})</span>}
      </span>
      {team.openMemoCount > 0 && (
        <span
          style={{
            fontSize: 9,
            color: "#eab308",
            background: "rgba(234,179,8,.12)",
            border: "1px solid rgba(234,179,8,.3)",
            borderRadius: 3,
            padding: "1px 4px",
            fontWeight: 700,
          }}
        >
          ▲{team.openMemoCount}
        </span>
      )}
      <span
        className="t-val"
        style={{ background: valKleur }}
        title={`Validatie: ${team.validatieStatus}`}
      />
    </div>
  );
}
