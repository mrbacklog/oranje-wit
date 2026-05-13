"use client";

import type { TeamKaartData, SelectieGroepMeta } from "./werkbord-types";
import { WbTeamRij } from "./WbTeamRij";

interface TeamsDrawerProps {
  teams: TeamKaartData[];
  selectieGroepen: SelectieGroepMeta[];
  statsIngedeeld: number;
  statsTotaal: number;
  open: boolean;
  onTeamClick: (teamId: string) => void;
}

export function TeamsDrawer({
  teams,
  selectieGroepen,
  statsIngedeeld,
  statsTotaal,
  open,
  onTeamClick,
}: TeamsDrawerProps) {
  // Groepeer teams per selectieGroep
  const groepTeamIds = new Set(selectieGroepen.flatMap((sg) => sg.teamIds));
  const losseTeams = teams.filter((t) => !groepTeamIds.has(t.id));

  return (
    <div
      className={`wb-drawer rechts${open ? "open" : ""}`}
      style={{ "--drawer-width": "280px" } as React.CSSProperties}
    >
      <div className="wb-drawer-header">
        <span className="wb-drawer-title">
          Teams <span className="count">{teams.length}</span>
        </span>
      </div>

      <div className="wb-drawer-list ow-scroll" style={{ padding: "6px 8px" }}>
        {/* Selectie-groepen */}
        {selectieGroepen.map((sg) => {
          const sgTeams = teams.filter((t) => sg.teamIds.includes(t.id));
          return (
            <div key={sg.id} className={`td-selectie${sg.gebundeld ? "gebundeld" : ""}`}>
              {/* Groep-header */}
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  left: 10,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: sg.gebundeld ? "#60a5fa" : "var(--text-tertiary)",
                  background: "var(--surface-page)",
                  padding: "0 4px",
                }}
              >
                {sg.naam ?? "Selectie"}{" "}
                {sg.gebundeld && (
                  <span
                    style={{
                      fontSize: 8,
                      padding: "1px 4px",
                      borderRadius: 3,
                      background: "rgba(59,130,246,.12)",
                      border: "1px solid rgba(59,130,246,.3)",
                      color: "#60a5fa",
                    }}
                  >
                    gebundeld
                  </span>
                )}
              </div>
              {sgTeams.map((team) => (
                <WbTeamRij key={team.id} team={team} onClick={() => onTeamClick(team.id)} />
              ))}
            </div>
          );
        })}

        {/* Losse teams */}
        {losseTeams.map((team) => (
          <WbTeamRij key={team.id} team={team} onClick={() => onTeamClick(team.id)} />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border-light)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          color: "var(--text-tertiary)",
          flexShrink: 0,
        }}
      >
        <span>
          Ingedeeld{" "}
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{statsIngedeeld}</span>/
          {statsTotaal}
        </span>
      </div>
    </div>
  );
}
