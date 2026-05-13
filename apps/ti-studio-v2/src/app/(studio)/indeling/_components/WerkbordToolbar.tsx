"use client";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

interface WerkbordToolbarProps {
  werkindelingNaam: string;
  versieNummer: number;
  versieNaam: string | null;
  statsIngedeeld: number;
  statsTotaal: number;
  statsTeams: number;
  poolOpen: boolean;
  stafOpen: boolean;
  teamsOpen: boolean;
  versiesOpen: boolean;
  onTogglePool: () => void;
  onToggleStaf: () => void;
  onToggleTeams: () => void;
  onToggleVersies: () => void;
}

export function WerkbordToolbar({
  werkindelingNaam,
  versieNummer,
  versieNaam,
  statsIngedeeld,
  statsTotaal,
  statsTeams,
  poolOpen,
  stafOpen,
  teamsOpen,
  versiesOpen,
  onTogglePool,
  onToggleStaf,
  onToggleTeams,
  onToggleVersies,
}: WerkbordToolbarProps) {
  return (
    <div className="werkbord-toolbar">
      {/* Links: Pool + Staf */}
      <div className="wb-toggles-links">
        <button className={cx("wb-toggle", poolOpen && "active")} onClick={onTogglePool}>
          Pool
        </button>
        <button className={cx("wb-toggle", stafOpen && "active")} onClick={onToggleStaf}>
          Staf
        </button>
      </div>

      <span className="wb-sep" />

      {/* Versie-badge + naam */}
      <span className="wb-versie">
        {versieNaam ?? werkindelingNaam}
        <span className="v-badge">v{versieNummer}</span>
      </span>
      <span style={{ flex: 1 }} />

      {/* Stats */}
      <div className="wb-stats">
        <span>
          <span className="val">{statsIngedeeld}</span> / {statsTotaal} ingedeeld
        </span>
        <span>
          <span className="val">{statsTeams}</span> teams
        </span>
      </div>

      <span className="wb-sep" />

      {/* Rechts: Teams + Versies */}
      <div className="wb-toggles-rechts">
        <button className={cx("wb-toggle", teamsOpen && "active")} onClick={onToggleTeams}>
          Teams
        </button>
        <button className={cx("wb-toggle", versiesOpen && "active")} onClick={onToggleVersies}>
          Versies
        </button>
      </div>
    </div>
  );
}
