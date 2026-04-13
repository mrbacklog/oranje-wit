// apps/web/src/components/ti-studio/werkbord/TeamDrawer.tsx
"use client";
import { useState, useTransition } from "react";
import "./tokens.css";
import type {
  WerkbordTeam,
  WerkbordValidatieItem,
  TeamConfigUpdate,
  TeamHoofdCategorie,
  TeamLeeftijdsCat,
  TeamSeniorenCategorie,
  KnkvCategorie,
  ValidatieUpdate,
} from "./types";
import {
  updateTeamConfig,
  koppelSelectie,
  ontkoppelSelectie,
  updateSelectieNaam,
  verwijderTeam,
  hernoemTeam,
} from "@/app/(protected)/indeling/team-config-actions";

interface TeamDrawerProps {
  open: boolean;
  geselecteerdTeamId: string | null;
  teams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  versieId: string;
  onClose: () => void;
  onTeamSelect: (teamId: string | null) => void;
  onNieuwTeam: () => void;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
  onValidatieUpdated: (update: ValidatieUpdate) => void;
  onTeamVerwijderd: (teamId: string) => void;
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (selectieGroepId: string) => void;
  onSelectieNaamUpdated: (selectieGroepId: string, naam: string) => void;
  onToggleBundeling: (selectieGroepId: string, gebundeld: boolean) => void | Promise<void>;
}

const VAL_KLEUR: Record<string, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  err: "var(--err)",
};

const ICOON = { ok: "✓", warn: "⚠", err: "✕" };

function VenusIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--pink)"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="8" r="6" />
      <line x1="12" y1="14" x2="12" y2="22" />
      <line x1="9" y1="19" x2="15" y2="19" />
    </svg>
  );
}

function MarsIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--blue)"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="10" cy="14" r="6" />
      <line x1="21" y1="3" x2="15" y2="9" />
      <polyline points="16 3 21 3 21 8" />
    </svg>
  );
}

// ─── Groepeer teams voor de drawer-lijst ─────────────────────────────────────

type TeamGroep =
  | { type: "los"; team: WerkbordTeam }
  | { type: "selectie"; teams: WerkbordTeam[]; selectieGroepId: string; gebundeld: boolean };

function groepeerTeams(teams: WerkbordTeam[]): TeamGroep[] {
  const groepen: TeamGroep[] = [];
  const gezien = new Set<string>();

  for (const team of teams) {
    if (gezien.has(team.id)) continue;
    if (!team.selectieGroepId) {
      groepen.push({ type: "los", team });
    } else {
      const partners = teams.filter((t) => t.selectieGroepId === team.selectieGroepId);
      partners.forEach((t) => gezien.add(t.id));
      groepen.push({
        type: "selectie",
        teams: partners,
        selectieGroepId: team.selectieGroepId,
        gebundeld: partners.some((t) => t.gebundeld),
      });
    }
    gezien.add(team.id);
  }
  return groepen;
}

// ─── Gecombineerde selectie: blauwe border-frame met 2 teamrijen ─────────────

function SelectieGroepBlok({
  groep,
  geselecteerdTeamId,
  showScores,
  onTeamSelect,
}: {
  groep: Extract<TeamGroep, { type: "selectie" }>;
  geselecteerdTeamId: string | null;
  showScores: boolean;
  onTeamSelect: (teamId: string) => void;
}) {
  const [teamA, teamB] = groep.teams;
  const totalDames = teamA?.selectieDames.length ?? 0;
  const totalHeren = teamA?.selectieHeren.length ?? 0;
  const selectieNaam = teamA?.selectieNaam ?? groep.teams.map((t) => t.naam).join(" ↔ ");

  const statusPrio = (s: "ok" | "warn" | "err") => (s === "err" ? 2 : s === "warn" ? 1 : 0);
  const comboStatus = groep.teams.reduce<"ok" | "warn" | "err">(
    (acc, t) => (statusPrio(t.validatieStatus) > statusPrio(acc) ? t.validatieStatus : acc),
    "ok"
  );
  const dotKleur =
    comboStatus === "err" ? "var(--err)" : comboStatus === "warn" ? "var(--warn)" : "var(--ok)";

  function TeamRij({ team }: { team: WerkbordTeam }) {
    const geselecteerd = team.id === geselecteerdTeamId;
    const teamDotKleur =
      team.validatieStatus === "err"
        ? "var(--err)"
        : team.validatieStatus === "warn"
          ? "var(--warn)"
          : "var(--ok)";

    return (
      <div
        onClick={() => onTeamSelect(team.id)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          cursor: "pointer",
          transition: "background 120ms",
          position: "relative",
          background: geselecteerd ? "rgba(255,107,0,.05)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!geselecteerd)
            (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.03)";
        }}
        onMouseLeave={(e) => {
          if (!geselecteerd) (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      >
        {geselecteerd && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: "var(--accent)",
              borderRadius: "0 2px 2px 0",
            }}
          />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{team.naam}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {showScores && team.ussScore !== null && (
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>
              USS{" "}
              <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                {team.ussScore.toFixed(2)}
              </span>
            </span>
          )}
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: teamDotKleur,
              boxShadow: `0 0 4px 1px ${teamDotKleur}40`,
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: "4px 8px 8px" }}>
      <div
        style={{
          border: "1px solid rgba(59,130,246,.40)",
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(59,130,246,.04)",
        }}
      >
        {/* Selectie-header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "7px 10px 6px",
            background: "rgba(59,130,246,.08)",
            borderBottom: "1px solid rgba(59,130,246,.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: ".5px",
                textTransform: "uppercase" as const,
                color: "rgba(59,130,246,1)",
                background: "rgba(59,130,246,.12)",
                border: "1px solid rgba(59,130,246,.35)",
                borderRadius: 4,
                padding: "2px 5px",
              }}
            >
              GECOMB
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(59,130,246,.9)" }}>
              {selectieNaam}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <VenusIcon size={11} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--pink)" }}>
                {totalDames}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MarsIcon size={11} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>
                {totalHeren}
              </span>
            </div>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: dotKleur,
                boxShadow: `0 0 4px 1px ${dotKleur}40`,
                flexShrink: 0,
              }}
            />
          </div>
        </div>

        {/* Team A */}
        {teamA && <TeamRij team={teamA} />}

        {/* Connector */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px", gap: 6 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(59,130,246,.30)" }} />
          <span style={{ fontSize: 10, color: "rgba(59,130,246,.7)", fontWeight: 700 }}>+</span>
          <div style={{ flex: 1, height: 1, background: "rgba(59,130,246,.30)" }} />
        </div>

        {/* Team B */}
        {teamB && <TeamRij team={teamB} />}
      </div>
    </div>
  );
}

// ─── Niet-gecombineerde selectie: subtiele koppeling, eigen aantallen ─────────

function SoloSelectieRij({
  team,
  gekoppeldAan,
  geselecteerd,
  showScores,
  onClick,
}: {
  team: WerkbordTeam;
  gekoppeldAan: WerkbordTeam | undefined;
  geselecteerd: boolean;
  showScores: boolean;
  onClick: () => void;
}) {
  const selectieNaam =
    team.selectieNaam ?? (gekoppeldAan ? `${team.naam} + ${gekoppeldAan.naam}` : team.naam);
  const dotKleur =
    team.validatieStatus === "err"
      ? "var(--err)"
      : team.validatieStatus === "warn"
        ? "var(--warn)"
        : "var(--ok)";

  return (
    <div style={{ position: "relative", margin: "4px 8px 6px" }}>
      {/* Paarse rail links */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: "rgba(129,140,248,.60)",
          borderRadius: 2,
        }}
      />
      {/* Selectie-label */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px 3px 10px" }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: ".5px",
            textTransform: "uppercase" as const,
            color: "#818cf8",
            background: "rgba(129,140,248,.10)",
            border: "1px solid rgba(129,140,248,.25)",
            borderRadius: 4,
            padding: "1px 5px",
          }}
        >
          SELECTIE
        </span>
        <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-3)" }}>
          {selectieNaam}
        </span>
      </div>
      {/* Teamrij */}
      <div
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: geselecteerd ? "8px 10px 8px 9px" : "8px 10px",
          cursor: "pointer",
          borderRadius: 10,
          borderLeft: geselecteerd ? "3px solid var(--accent)" : "1px solid rgba(255,255,255,.10)",
          borderTop: "1px solid rgba(255,255,255,.10)",
          borderRight: "1px solid rgba(255,255,255,.10)",
          borderBottom: "1px solid rgba(255,255,255,.10)",
          background: geselecteerd ? "rgba(255,107,0,.05)" : "rgba(26,26,46,1)",
          transition: "background 120ms, border-color 120ms",
        }}
        onMouseEnter={(e) => {
          if (!geselecteerd) {
            (e.currentTarget as HTMLDivElement).style.background = "rgba(34,34,58,1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!geselecteerd) {
            (e.currentTarget as HTMLDivElement).style.background = "rgba(26,26,46,1)";
          }
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{team.naam}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <VenusIcon size={11} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--pink)" }}>
              {team.dames.length}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MarsIcon size={11} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>
              {team.heren.length}
            </span>
          </div>
          {showScores && team.ussScore !== null && (
            <>
              <div style={{ width: 1, height: 12, background: "var(--border-0)" }} />
              <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                USS{" "}
                <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                  {team.ussScore.toFixed(2)}
                </span>
              </span>
            </>
          )}
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: dotKleur,
              boxShadow: `0 0 4px 1px ${dotKleur}40`,
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PlatteTeamKaart({
  team,
  geselecteerd,
  showScores,
  onClick,
}: {
  team: WerkbordTeam;
  geselecteerd: boolean;
  showScores: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        borderLeft: `3px solid ${geselecteerd ? "var(--accent)" : "transparent"}`,
        background: geselecteerd ? "rgba(255,107,0,.06)" : "transparent",
        borderBottom: "1px solid var(--border-0)",
        cursor: "pointer",
        transition: "background 120ms",
      }}
    >
      <div style={{ padding: "8px 12px 8px 10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              {team.naam}
            </span>
          </div>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: VAL_KLEUR[team.validatieStatus],
              boxShadow: `0 0 4px 1px ${VAL_KLEUR[team.validatieStatus]}40`,
              flexShrink: 0,
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <VenusIcon size={11} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--pink)" }}>
              {team.dames.length}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MarsIcon size={11} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>
              {team.heren.length}
            </span>
          </div>
          <div style={{ width: 1, height: 12, background: "var(--border-0)" }} />
          {showScores && team.ussScore !== null && (
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>
              USS{" "}
              <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                {team.ussScore.toFixed(2)}
              </span>
            </span>
          )}
          {team.gemiddeldeLeeftijd !== null && (
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>
              Gem.{" "}
              <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                {team.gemiddeldeLeeftijd.toFixed(1)}j
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfiguratieForm({
  team,
  onConfigUpdated,
  onValidatieUpdated,
}: {
  team: WerkbordTeam;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
  onValidatieUpdated: (update: ValidatieUpdate) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<TeamConfigUpdate>({
    hoofdCategorie: team.teamCategorie,
    kleur: team.kleur === "senior" ? null : team.kleur,
    niveau: team.niveau,
    teamType: team.formaat === "viertal" ? "viertal" : team.formaat === "achtal" ? "achtal" : null,
  });

  function sla(update: Partial<TeamConfigUpdate>) {
    const nieuw = { ...config, ...update };
    setConfig(nieuw);
    startTransition(async () => {
      const result = await updateTeamConfig(team.id, nieuw);
      if (result.ok) {
        let nieuwFormaat: "viertal" | "achtal" | "selectie" = "achtal";
        if (team.selectieGroepId) {
          nieuwFormaat = "selectie";
        } else if (nieuw.hoofdCategorie === "B_CATEGORIE") {
          if (nieuw.kleur === "blauw" || nieuw.kleur === "groen") nieuwFormaat = "viertal";
          else if (nieuw.kleur === "geel" && nieuw.teamType === "viertal") nieuwFormaat = "viertal";
          else nieuwFormaat = "achtal";
        }
        onConfigUpdated(team.id, {
          teamCategorie: nieuw.hoofdCategorie,
          niveau: nieuw.niveau,
          formaat: nieuwFormaat,
          kleur: nieuw.kleur ?? team.kleur,
        });
        if (result.data.validatieUpdate) {
          onValidatieUpdated(result.data.validatieUpdate);
        }
      }
    });
  }

  const isSenioren = config.hoofdCategorie === "SENIOREN";
  const isJeugdA = config.hoofdCategorie === "A_CATEGORIE";
  const isJeugdB = config.hoofdCategorie === "B_CATEGORIE";
  const isGeel = config.kleur === "geel";

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 6,
    border: `1px solid ${active ? "var(--accent)" : "var(--border-0)"}`,
    background: active ? "var(--accent-dim)" : "var(--bg-2)",
    color: active ? "var(--accent)" : "var(--text-2)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 80ms",
    opacity: isPending ? 0.6 : 1,
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".4px",
    color: "var(--text-3)",
    marginBottom: 6,
    display: "block",
  };

  const rijStyle: React.CSSProperties = {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    marginBottom: 12,
  };

  return (
    <div style={{ padding: "10px 14px" }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".5px",
          color: "var(--text-3)",
          marginBottom: 10,
        }}
      >
        Inrichting
      </div>

      <span style={labelStyle}>Categorie</span>
      <div style={rijStyle}>
        {(["SENIOREN", "A_CATEGORIE", "B_CATEGORIE"] as TeamHoofdCategorie[]).map((cat) => (
          <button
            key={cat}
            style={btnStyle(config.hoofdCategorie === cat)}
            onClick={() => sla({ hoofdCategorie: cat, kleur: null, niveau: null, teamType: null })}
          >
            {cat === "SENIOREN" ? "Senioren" : cat === "A_CATEGORIE" ? "Jeugd A" : "Jeugd B"}
          </button>
        ))}
      </div>

      {isSenioren && (
        <>
          <span style={labelStyle}>Competitie-categorie</span>
          <div style={rijStyle}>
            {(["A", "B"] as TeamSeniorenCategorie[]).map((cat) => (
              <button
                key={cat}
                style={btnStyle(config.niveau === cat)}
                onClick={() => sla({ niveau: cat })}
              >
                {cat === "A" ? "Categorie A" : "Categorie B"}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>
            8-tal ·{" "}
            {config.niveau === "A"
              ? "Topsport / Wedstrijdsport"
              : config.niveau === "B"
                ? "Korfbalplezier / Recreant"
                : "Kies categorie voor kadervereisten"}
          </div>
        </>
      )}

      {isJeugdA && (
        <>
          <span style={labelStyle}>Leeftijdscategorie</span>
          <div style={rijStyle}>
            {(["U15", "U17", "U19"] as TeamLeeftijdsCat[]).map((niv) => (
              <button
                key={niv}
                style={btnStyle(config.niveau === niv)}
                onClick={() => sla({ niveau: niv })}
              >
                {niv}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>8-tal</div>
        </>
      )}

      {isJeugdB && (
        <>
          <span style={labelStyle}>Kleur</span>
          <div style={rijStyle}>
            {(["geel", "oranje", "rood", "blauw", "groen"] as KnkvCategorie[]).map((k) => (
              <button
                key={k}
                style={btnStyle(config.kleur === k)}
                onClick={() =>
                  sla({
                    kleur: k,
                    teamType: k === "blauw" || k === "groen" ? "viertal" : config.teamType,
                  })
                }
              >
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>

          {isGeel && (
            <>
              <span style={labelStyle}>Formaat</span>
              <div style={rijStyle}>
                <button
                  style={btnStyle(config.teamType === "achtal")}
                  onClick={() => sla({ teamType: "achtal" })}
                >
                  8-tal
                </button>
                <button
                  style={btnStyle(config.teamType === "viertal")}
                  onClick={() => sla({ teamType: "viertal" })}
                >
                  4-tal
                </button>
              </div>
            </>
          )}

          {(config.kleur === "blauw" || config.kleur === "groen") && (
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>
              4-tal (vast)
            </div>
          )}
          {(config.kleur === "oranje" || config.kleur === "rood") && (
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>
              8-tal (vast)
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ValidatieLijst({ items }: { items: WerkbordValidatieItem[] }) {
  const VAL_BG: Record<string, string> = {
    ok: "rgba(34,197,94,.06)",
    warn: "rgba(234,179,8,.06)",
    err: "rgba(239,68,68,.06)",
  };
  const VAL_BORDER: Record<string, string> = {
    ok: "rgba(34,197,94,.1)",
    warn: "rgba(234,179,8,.1)",
    err: "rgba(239,68,68,.1)",
  };

  return (
    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-0)" }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".5px",
          color: "var(--text-3)",
          marginBottom: 8,
        }}
      >
        Validatie
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>
          Alles voldoet aan de kaders
        </div>
      ) : (
        items.map((item) => (
          <div
            key={`${item.teamId}-${item.regel}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "7px 9px",
              borderRadius: 7,
              marginBottom: 4,
              background: VAL_BG[item.type],
              border: `1px solid ${VAL_BORDER[item.type]}`,
            }}
          >
            <span
              style={{ fontSize: 13, color: VAL_KLEUR[item.type], flexShrink: 0, marginTop: 1 }}
            >
              {ICOON[item.type]}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                {item.regel}
                {item.laag && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--text-3)",
                      opacity: 0.8,
                    }}
                  >
                    [{item.laag}]
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.4 }}>
                {item.beschrijving}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SelectieKoppeling({
  team,
  alleTeams,
  versieId,
  onSelectieGekoppeld,
  onSelectieOntkoppeld,
  onSelectieNaamUpdated,
  onToggleBundeling,
}: {
  team: WerkbordTeam;
  alleTeams: WerkbordTeam[];
  versieId: string;
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (selectieGroepId: string) => void;
  onSelectieNaamUpdated: (selectieGroepId: string, naam: string) => void;
  onToggleBundeling: (selectieGroepId: string, gebundeld: boolean) => void | Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [gekozenTeamId, setGekozenTeamId] = useState("");
  const [naamInput, setNaamInput] = useState(team.selectieNaam ?? "");

  const beschikbaar = alleTeams.filter((t) => t.id !== team.id && !t.selectieGroepId);
  const gekoppeldAan = alleTeams.find(
    (t) => t.selectieGroepId === team.selectieGroepId && t.id !== team.id
  );

  const naamPlaceholder = gekoppeldAan ? `${team.naam} ↔ ${gekoppeldAan.naam}` : "Selectienaam…";

  function koppel() {
    if (!gekozenTeamId) return;
    startTransition(async () => {
      const result = await koppelSelectie(versieId, team.id, gekozenTeamId);
      if (result.ok) {
        onSelectieGekoppeld(team.id, result.data.groepId);
        onSelectieGekoppeld(gekozenTeamId, result.data.groepId);
        setGekozenTeamId("");
      }
    });
  }

  function ontkoppel() {
    if (!team.selectieGroepId) return;
    const groepId = team.selectieGroepId;
    startTransition(async () => {
      const result = await ontkoppelSelectie(groepId);
      if (result.ok) {
        onSelectieOntkoppeld(groepId);
        setNaamInput("");
      }
    });
  }

  function slaSelectieNaamOp() {
    if (!team.selectieGroepId) return;
    const groepId = team.selectieGroepId;
    startTransition(async () => {
      const result = await updateSelectieNaam(groepId, naamInput);
      if (result.ok) {
        onSelectieNaamUpdated(groepId, naamInput.trim());
      }
    });
  }

  return (
    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-0)" }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".5px",
          color: "var(--text-3)",
          marginBottom: 8,
        }}
      >
        Selectie-koppeling
      </div>
      {team.selectieGroepId ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text-2)" }}>
            Gekoppeld aan: <strong>{gekoppeldAan?.naam ?? "—"}</strong>
          </div>
          {/* Selectienaam */}
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".4px",
                color: "var(--text-3)",
                marginBottom: 4,
              }}
            >
              Selectienaam
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="text"
                value={naamInput}
                onChange={(e) => setNaamInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") slaSelectieNaamOp();
                }}
                placeholder={naamPlaceholder}
                style={{
                  flex: 1,
                  padding: "5px 8px",
                  fontSize: 11,
                  borderRadius: 6,
                  border: "1px solid var(--border-0)",
                  background: "var(--bg-2)",
                  color: "var(--text-1)",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                onClick={slaSelectieNaamOp}
                disabled={isPending}
                style={{
                  padding: "5px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "1px solid var(--accent)",
                  background: "var(--accent-dim)",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  opacity: isPending ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                OK
              </button>
            </div>
            {!naamInput && (
              <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>
                Leeg = {naamPlaceholder}
              </div>
            )}
          </div>
          {/* Bundeling toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
              padding: "8px 0",
              borderTop: "1px solid var(--border-0)",
            }}
          >
            <div>
              <div
                style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}
              >
                Gecombineerde spelerspool
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.4 }}>
                Dames en heren van beide teams samen op één kaart, verdeeld per geslacht.
              </div>
            </div>
            <button
              onClick={() => onToggleBundeling(team.selectieGroepId!, !team.gebundeld)}
              disabled={isPending}
              title={team.gebundeld ? "Ontbundelen" : "Bundelen"}
              style={{
                flexShrink: 0,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 6,
                border: `1px solid ${team.gebundeld ? "var(--accent)" : "var(--border-0)"}`,
                background: team.gebundeld ? "var(--accent-dim)" : "var(--bg-2)",
                color: team.gebundeld ? "var(--accent)" : "var(--text-2)",
                cursor: "pointer",
                fontFamily: "inherit",
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {team.gebundeld ? "Aan" : "Uit"}
            </button>
          </div>

          <button
            onClick={ontkoppel}
            disabled={isPending}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid var(--border-0)",
              background: "var(--bg-2)",
              color: "var(--err)",
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: isPending ? 0.6 : 1,
              alignSelf: "flex-start",
            }}
          >
            Koppeling verwijderen
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            value={gekozenTeamId}
            onChange={(e) => setGekozenTeamId(e.target.value)}
            style={{
              flex: 1,
              padding: "5px 8px",
              fontSize: 11,
              borderRadius: 6,
              border: "1px solid var(--border-0)",
              background: "var(--bg-2)",
              color: "var(--text-1)",
              fontFamily: "inherit",
            }}
          >
            <option value="">Kies team…</option>
            {beschikbaar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.naam}
              </option>
            ))}
          </select>
          <button
            onClick={koppel}
            disabled={!gekozenTeamId || isPending}
            style={{
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid var(--accent)",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              cursor: gekozenTeamId ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              opacity: !gekozenTeamId || isPending ? 0.5 : 1,
            }}
          >
            Koppel
          </button>
        </div>
      )}
    </div>
  );
}

function TeamDetailPanel({
  team,
  alleTeams,
  validatie,
  versieId,
  onTerug,
  onConfigUpdated,
  onValidatieUpdated,
  onTeamVerwijderd,
  onSelectieGekoppeld,
  onSelectieOntkoppeld,
  onSelectieNaamUpdated,
  onToggleBundeling,
}: {
  team: WerkbordTeam;
  alleTeams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  versieId: string;
  onTerug: () => void;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
  onValidatieUpdated: (update: ValidatieUpdate) => void;
  onTeamVerwijderd: (teamId: string) => void;
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (selectieGroepId: string) => void;
  onSelectieNaamUpdated: (selectieGroepId: string, naam: string) => void;
  onToggleBundeling: (selectieGroepId: string, gebundeld: boolean) => void | Promise<void>;
}) {
  const [verwijderBezig, setVerwijderBezig] = useState(false);
  const [verwijderConfirm, setVerwijderConfirm] = useState(false);
  const [naamEdit, setNaamEdit] = useState(false);
  const [naamInput, setNaamInput] = useState(team.naam);
  const [naamBezig, setNaamBezig] = useState(false);
  const teamValidatie = validatie.filter((v) => v.teamId === team.id);

  async function slaTeamNaamOp() {
    const schoon = naamInput.trim();
    if (!schoon || schoon === team.naam) {
      setNaamInput(team.naam);
      setNaamEdit(false);
      return;
    }
    setNaamBezig(true);
    const result = await hernoemTeam(team.id, schoon);
    setNaamBezig(false);
    if (result.ok) {
      onConfigUpdated(team.id, { naam: schoon });
      setNaamEdit(false);
    } else {
      setNaamInput(team.naam);
      setNaamEdit(false);
    }
  }

  async function handleVerwijder() {
    setVerwijderBezig(true);
    const result = await verwijderTeam(team.id);
    setVerwijderBezig(false);
    if (result.ok) {
      onTeamVerwijderd(team.id);
      onTerug();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto" }}>
      {/* Header met terugknop */}
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 12px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onTerug}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            color: "var(--text-3)",
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: 5,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Teams
        </button>

        {naamEdit ? (
          <input
            autoFocus
            value={naamInput}
            onChange={(e) => setNaamInput(e.target.value)}
            onBlur={slaTeamNaamOp}
            onKeyDown={(e) => {
              if (e.key === "Enter") slaTeamNaamOp();
              if (e.key === "Escape") {
                setNaamInput(team.naam);
                setNaamEdit(false);
              }
            }}
            disabled={naamBezig}
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-1)",
              background: "var(--bg-2)",
              border: "1px solid var(--accent)",
              borderRadius: 5,
              padding: "2px 6px",
              fontFamily: "inherit",
              outline: "none",
              opacity: naamBezig ? 0.6 : 1,
            }}
          />
        ) : (
          <button
            onClick={() => {
              setNaamInput(team.naam);
              setNaamEdit(true);
            }}
            title="Naam wijzigen"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: "none",
              padding: "2px 4px",
              borderRadius: 5,
              cursor: "text",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              {team.naam}
            </span>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-3)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, opacity: 0.5 }}
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>
      <ConfiguratieForm
        team={team}
        onConfigUpdated={onConfigUpdated}
        onValidatieUpdated={onValidatieUpdated}
      />
      <ValidatieLijst items={teamValidatie} />
      <SelectieKoppeling
        team={team}
        alleTeams={alleTeams}
        versieId={versieId}
        onSelectieGekoppeld={onSelectieGekoppeld}
        onSelectieOntkoppeld={onSelectieOntkoppeld}
        onSelectieNaamUpdated={onSelectieNaamUpdated}
        onToggleBundeling={onToggleBundeling}
      />

      {/* Danger zone */}
      <div
        style={{
          margin: "12px 14px 16px",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid rgba(239,68,68,.18)",
          background: "rgba(239,68,68,.04)",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".5px",
            color: "var(--err)",
            marginBottom: 8,
            opacity: 0.7,
          }}
        >
          Danger zone
        </div>
        {verwijderConfirm ? (
          <div>
            <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 8, lineHeight: 1.4 }}>
              Team verwijderen? Spelers gaan terug naar de pool.
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleVerwijder}
                disabled={verwijderBezig}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  borderRadius: 6,
                  background: "var(--err)",
                  border: "none",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: verwijderBezig ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: verwijderBezig ? 0.6 : 1,
                }}
              >
                {verwijderBezig ? "Bezig…" : "Ja, verwijder"}
              </button>
              <button
                onClick={() => setVerwijderConfirm(false)}
                disabled={verwijderBezig}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  background: "var(--bg-2)",
                  border: "1px solid var(--border-1)",
                  color: "var(--text-2)",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setVerwijderConfirm(true)}
            style={{
              width: "100%",
              padding: "6px 0",
              borderRadius: 6,
              background: "none",
              border: "1px solid rgba(239,68,68,.3)",
              color: "var(--err)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Team verwijderen
          </button>
        )}
      </div>
    </div>
  );
}

export function TeamDrawer({
  open,
  geselecteerdTeamId,
  teams,
  validatie,
  versieId,
  onClose,
  onTeamSelect,
  onNieuwTeam: _onNieuwTeam,
  onConfigUpdated,
  onValidatieUpdated,
  onTeamVerwijderd,
  onSelectieGekoppeld,
  onSelectieOntkoppeld,
  onSelectieNaamUpdated,
  onToggleBundeling,
}: TeamDrawerProps) {
  const geselecteerdTeam = teams.find((t) => t.id === geselecteerdTeamId) ?? null;
  const gesorteerdeTeams = [...teams].sort((a, b) => a.volgorde - b.volgorde);

  return (
    <aside
      style={{
        width: open ? "var(--val-w)" : 0,
        transition: "width 200ms ease, opacity 200ms ease",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        flexShrink: 0,
        background: "var(--bg-1)",
        borderLeft: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 20,
      }}
    >
      {geselecteerdTeam ? (
        <TeamDetailPanel
          key={geselecteerdTeam.id}
          team={geselecteerdTeam}
          alleTeams={teams}
          validatie={validatie}
          versieId={versieId}
          onTerug={() => onTeamSelect(null)}
          onConfigUpdated={onConfigUpdated}
          onValidatieUpdated={onValidatieUpdated}
          onTeamVerwijderd={onTeamVerwijderd}
          onSelectieGekoppeld={onSelectieGekoppeld}
          onSelectieOntkoppeld={onSelectieOntkoppeld}
          onSelectieNaamUpdated={onSelectieNaamUpdated}
          onToggleBundeling={onToggleBundeling}
        />
      ) : (
        <>
          {/* Header: lijst */}
          <div
            style={{
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              borderBottom: "1px solid var(--border-0)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: ".5px",
              }}
            >
              Teams
            </span>
            <button
              onClick={onClose}
              title="Sluiten"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-3)",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {groepeerTeams(gesorteerdeTeams).map((groep) => {
              if (groep.type === "los") {
                return (
                  <PlatteTeamKaart
                    key={groep.team.id}
                    team={groep.team}
                    geselecteerd={groep.team.id === geselecteerdTeamId}
                    showScores={true}
                    onClick={() => onTeamSelect(groep.team.id)}
                  />
                );
              }
              if (groep.gebundeld) {
                return (
                  <SelectieGroepBlok
                    key={groep.selectieGroepId}
                    groep={groep}
                    geselecteerdTeamId={geselecteerdTeamId}
                    showScores={true}
                    onTeamSelect={onTeamSelect}
                  />
                );
              }
              return groep.teams.map((team) => (
                <SoloSelectieRij
                  key={team.id}
                  team={team}
                  gekoppeldAan={groep.teams.find((t) => t.id !== team.id)}
                  geselecteerd={team.id === geselecteerdTeamId}
                  showScores={true}
                  onClick={() => onTeamSelect(team.id)}
                />
              ));
            })}
          </div>
        </>
      )}
    </aside>
  );
}
