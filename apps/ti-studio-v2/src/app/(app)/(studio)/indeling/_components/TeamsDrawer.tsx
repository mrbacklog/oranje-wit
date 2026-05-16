"use client";

import type { TeamKaartData, SelectieGroepMeta } from "./werkbord-types";
import { WbTeamRij } from "./WbTeamRij";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

// OWTeamType → groeplabel + kleur-klasse
type GroepNaam = "SELECTIE" | "JEUGD" | "SENIOREN" | "OVERIG";

function bepaalGroep(team: TeamKaartData): GroepNaam {
  const owType = (team as TeamKaartData & { owTeamType?: string }).owTeamType?.toUpperCase();
  if (owType === "SELECTIE") return "SELECTIE";
  if (owType === "JEUGD") return "JEUGD";
  if (owType === "SENIOREN") return "SENIOREN";
  const cat = team.categorie?.toUpperCase();
  if (cat === "A_CATEGORIE") return "SELECTIE";
  if (cat === "B_CATEGORIE") return "JEUGD";
  if (cat === "SENIOREN") return "SENIOREN";
  return "OVERIG";
}

const GROEP_CSS: Record<GroepNaam, string> = {
  SELECTIE: "cat-rood",
  JEUGD: "cat-blauw",
  SENIOREN: "cat-senior",
  OVERIG: "cat-senior",
};

const GROEP_LABEL: Record<GroepNaam, string> = {
  SELECTIE: "Selectie",
  JEUGD: "Jeugd",
  SENIOREN: "Senioren",
  OVERIG: "Overig",
};

const GROEP_VOLGORDE: GroepNaam[] = ["SELECTIE", "JEUGD", "SENIOREN", "OVERIG"];

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
  const groepTeamIds = new Set(selectieGroepen.flatMap((sg) => sg.teamIds));

  // Bouw een map: teamId → selectieGroep
  const teamIdNaarGroep = new Map<string, SelectieGroepMeta>();
  selectieGroepen.forEach((sg) => sg.teamIds.forEach((id) => teamIdNaarGroep.set(id, sg)));

  // Groepeer teams per categorie
  const teamPerGroep = new Map<GroepNaam, TeamKaartData[]>();
  GROEP_VOLGORDE.forEach((g) => teamPerGroep.set(g, []));
  teams.forEach((t) => {
    const g = bepaalGroep(t);
    teamPerGroep.get(g)!.push(t);
  });

  // Stats
  const totaleDames = teams.reduce((s, t) => s + t.spelersDames.length, 0);
  const totaleHeren = teams.reduce((s, t) => s + t.spelersHeren.length, 0);

  return (
    <div
      className={cx("wb-drawer", "rechts", open && "open")}
      style={{ "--drawer-width": "280px" } as React.CSSProperties}
    >
      {/* Header */}
      <div className="wb-drawer-header">
        <span className="wb-drawer-title">
          Teams <span className="count">{teams.length}</span>
        </span>
      </div>

      {/* Lijst met categorie-groepen */}
      <div className="wb-drawer-list ow-scroll" style={{ padding: "4px 8px 12px" }}>
        {GROEP_VOLGORDE.map((groepNaam) => {
          const groepTeams = teamPerGroep.get(groepNaam) ?? [];
          if (groepTeams.length === 0) return null;

          // Splits in selectie-blokken en losse teams
          const verwerktTeamIds = new Set<string>();
          const elementen: React.ReactNode[] = [];

          // Voeg selectie-blokken toe (teams die in een groep zitten)
          const gerendeerdGroepen = new Set<string>();
          groepTeams.forEach((team) => {
            if (!groepTeamIds.has(team.id)) return;
            const sg = teamIdNaarGroep.get(team.id);
            if (!sg || gerendeerdGroepen.has(sg.id)) return;
            gerendeerdGroepen.add(sg.id);

            const sgTeams = teams.filter((t) => sg.teamIds.includes(t.id));
            const sgDames = sgTeams.reduce((s, t) => s + t.spelersDames.length, 0);
            const sgHeren = sgTeams.reduce((s, t) => s + t.spelersHeren.length, 0);

            elementen.push(
              <div
                key={sg.id}
                className={cx("td-selectie", sg.gebundeld && "gebundeld")}
              >
                {/* Selectienaam */}
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 10,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: sg.gebundeld ? "#60a5fa" : "var(--selectie-accent, #94a3b8)",
                  }}
                >
                  {sg.naam ?? "Selectie"}
                </div>

                {/* ♀/♂ totalen header */}
                <div
                  style={{
                    position: "absolute",
                    top: 5,
                    right: sg.gebundeld ? 50 : 10,
                    display: "flex",
                    gap: 6,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: "rgba(236,72,153,.7)" }}>♀ {sgDames}</span>
                  <span style={{ color: "rgba(96,165,250,.7)" }}>♂ {sgHeren}</span>
                </div>

                {/* Gebundeld-badge */}
                {sg.gebundeld && (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 6,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: "rgba(59,130,246,.12)",
                      border: "1px solid rgba(59,130,246,.3)",
                      color: "#60a5fa",
                      fontSize: 8,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    gebundeld
                  </div>
                )}

                {sgTeams.map((t) => {
                  verwerktTeamIds.add(t.id);
                  return (
                    <WbTeamRij key={t.id} team={t} onClick={() => onTeamClick(t.id)} />
                  );
                })}
              </div>
            );
            sg.teamIds.forEach((id) => verwerktTeamIds.add(id));
          });

          // Losse teams (niet in selectie-blok)
          groepTeams
            .filter((t) => !verwerktTeamIds.has(t.id))
            .forEach((team) => {
              elementen.push(
                <WbTeamRij key={team.id} team={team} onClick={() => onTeamClick(team.id)} />
              );
            });

          return (
            <div key={groepNaam}>
              {/* Categorie-header */}
              <div className={cx("td-group", GROEP_CSS[groepNaam])}>
                {GROEP_LABEL[groepNaam]}
              </div>
              {elementen}
            </div>
          );
        })}
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
        <span style={{ flex: 1 }}>
          Ingedeeld{" "}
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{statsIngedeeld}</span>/
          {statsTotaal}
        </span>
        <span style={{ color: "var(--sexe-v)", fontWeight: 700 }}>♀ {totaleDames}</span>
        <span style={{ color: "var(--sexe-h)", fontWeight: 700 }}>♂ {totaleHeren}</span>
      </div>
    </div>
  );
}
