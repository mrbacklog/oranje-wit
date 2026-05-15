"use client";

import type { TeamKaartData } from "./werkbord-types";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

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
      className={cx("wb-team-rij", actief && "active")}
      style={{ "--team-kleur": teamKleur } as React.CSSProperties}
      onClick={onClick}
    >
      <span className="t-naam">{team.alias ?? team.naam}</span>
      <span
        style={{
          fontSize: 11,
          color: "var(--sexe-v)",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ♀{team.spelersDames.length}
      </span>
      <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>/</span>
      <span
        style={{
          fontSize: 11,
          color: "var(--sexe-h)",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ♂{team.spelersHeren.length}
      </span>
      {team.openMemoCount > 0 && (
        <span
          data-memo-indicator
          style={{
            fontSize: 10,
            color: "var(--memo-open)",
            fontWeight: 800,
          }}
          title={`${team.openMemoCount} open memo`}
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
