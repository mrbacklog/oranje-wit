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
  KnkvCategorie,
} from "./types";
import {
  updateTeamConfig,
  koppelSelectie,
  ontkoppelSelectie,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions";

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
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (selectieGroepId: string) => void;
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
            {team.selectieGroepId && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--accent)",
                  background: "var(--accent-dim)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  letterSpacing: ".3px",
                }}
              >
                SEL
              </span>
            )}
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
}: {
  team: WerkbordTeam;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
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
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>
          8-tal · KNKV Senioren regels
        </div>
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
          Geen kaderregels geconfigureerd
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
}: {
  team: WerkbordTeam;
  alleTeams: WerkbordTeam[];
  versieId: string;
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (selectieGroepId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [gekozenTeamId, setGekozenTeamId] = useState("");

  const beschikbaar = alleTeams.filter((t) => t.id !== team.id && !t.selectieGroepId);
  const gekoppeldAan = alleTeams.find(
    (t) => t.selectieGroepId === team.selectieGroepId && t.id !== team.id
  );

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
        <div>
          <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 8 }}>
            Gekoppeld aan: <strong>{gekoppeldAan?.naam ?? "—"}</strong>
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
  onConfigUpdated,
  onSelectieGekoppeld,
  onSelectieOntkoppeld,
}: {
  team: WerkbordTeam;
  alleTeams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  versieId: string;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (selectieGroepId: string) => void;
}) {
  const teamValidatie = validatie.filter((v) => v.teamId === team.id);

  return (
    <div
      style={{
        width: "var(--val-w)",
        background: "var(--bg-2)",
        borderLeft: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <div
        style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-0)", flexShrink: 0 }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", marginBottom: 2 }}>
          {team.naam}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: ".5px",
          }}
        >
          Inrichting · Validatie
        </div>
      </div>
      <ConfiguratieForm team={team} onConfigUpdated={onConfigUpdated} />
      <ValidatieLijst items={teamValidatie} />
      <SelectieKoppeling
        team={team}
        alleTeams={alleTeams}
        versieId={versieId}
        onSelectieGekoppeld={onSelectieGekoppeld}
        onSelectieOntkoppeld={onSelectieOntkoppeld}
      />
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
  onNieuwTeam,
  onConfigUpdated,
  onSelectieGekoppeld,
  onSelectieOntkoppeld,
}: TeamDrawerProps) {
  const geselecteerdTeam = teams.find((t) => t.id === geselecteerdTeamId) ?? null;
  const detailOpen = geselecteerdTeam !== null;
  const gesorteerdeTeams = [...teams].sort((a, b) => a.volgorde - b.volgorde);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: open ? (detailOpen ? "calc(var(--val-w) * 2)" : "var(--val-w)") : 0,
        transition: "width 200ms ease",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        flexShrink: 0,
        position: "relative",
        zIndex: 20,
      }}
    >
      <aside
        style={{
          width: "var(--val-w)",
          flexShrink: 0,
          background: "var(--bg-1)",
          borderLeft: "1px solid var(--border-0)",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={onNieuwTeam}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "var(--accent-dim)",
                border: "1px solid rgba(255,107,0,.25)",
                color: "var(--accent)",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 9px",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nieuw
            </button>
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
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {gesorteerdeTeams.map((team) => (
            <PlatteTeamKaart
              key={team.id}
              team={team}
              geselecteerd={team.id === geselecteerdTeamId}
              showScores={true}
              onClick={() => onTeamSelect(team.id === geselecteerdTeamId ? null : team.id)}
            />
          ))}
        </div>
      </aside>

      {detailOpen && geselecteerdTeam && (
        <TeamDetailPanel
          key={geselecteerdTeam.id}
          team={geselecteerdTeam}
          alleTeams={teams}
          validatie={validatie}
          versieId={versieId}
          onConfigUpdated={onConfigUpdated}
          onSelectieGekoppeld={onSelectieGekoppeld}
          onSelectieOntkoppeld={onSelectieOntkoppeld}
        />
      )}
    </div>
  );
}
