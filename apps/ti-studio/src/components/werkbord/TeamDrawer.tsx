"use client";
import { useState, useRef, useTransition } from "react";
import "./tokens.css";
import { KLEUR_BAND, KLEUR_HERO_GRADIENT } from "./team-gradients";
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
  updateTeamVolgorde,
} from "@/app/(protected)/indeling/team-config-actions";
import { maakTeamAan } from "@/app/(protected)/indeling/werkindeling-actions";

interface TeamDrawerProps {
  open: boolean;
  geselecteerdTeamId: string | null;
  teams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  versieId: string;
  onClose: () => void;
  onTeamSelect: (teamId: string | null) => void;
  onNieuwTeam: (team: Pick<WerkbordTeam, "id" | "naam" | "categorie" | "volgorde">) => void;
  onConfigUpdated: (teamId: string, update: Partial<WerkbordTeam>) => void;
  onValidatieUpdated: (update: ValidatieUpdate) => void;
  onTeamVerwijderd: (teamId: string) => void;
  onSelectieGekoppeld: (teamId: string, selectieGroepId: string) => void;
  onSelectieOntkoppeld: (selectieGroepId: string) => void;
  onSelectieNaamUpdated: (selectieGroepId: string, naam: string) => void;
  onToggleBundeling: (selectieGroepId: string, gebundeld: boolean) => void | Promise<void>;
  onTeamsHerordend: (updates: { id: string; volgorde: number }[]) => void;
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
        gebundeld: partners.every((t) => t.gebundeld),
      });
    }
    gezien.add(team.id);
  }
  return groepen;
}

// ─── Gedeelde stijl voor selectie-blok frame ─────────────────────────────────

const SEL_FRAME_STYLE: React.CSSProperties = {
  border: "1px solid rgba(59,130,246,.35)",
  borderRadius: 11,
  overflow: "hidden",
  background: "rgba(59,130,246,.03)",
};

const SEL_HEADER_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 10px 7px",
  background: "rgba(59,130,246,.07)",
  borderBottom: "1px solid rgba(59,130,246,.25)",
};

// ─── Confirm-dialog voor bundelen/ontbundelen ────────────────────────────────

function BundelingBevestigingDialog({
  state,
  onBevestig,
  onAnnuleer,
}: {
  state: { nieuwGebundeld: boolean; spelers: number; staf: number; doelNaam: string };
  onBevestig: () => void;
  onAnnuleer: () => void;
}) {
  const titel = state.nieuwGebundeld
    ? "Teams combineren tot selectiepool"
    : "Selectiepool ontbinden";
  const uitleg = state.nieuwGebundeld
    ? `Alle spelers en staf van de teams worden verplaatst naar een gecombineerde spelerspool. Je kunt ze daarna niet meer aan een individueel team koppelen — alleen aan de selectie.`
    : `Alle spelers en staf uit de gecombineerde pool worden teruggeplaatst op team ${state.doelNaam}. Je kunt ze daarna weer verdelen over de losse teams.`;
  const totaalItems: string[] = [];
  if (state.spelers > 0)
    totaalItems.push(`${state.spelers} speler${state.spelers === 1 ? "" : "s"}`);
  if (state.staf > 0) totaalItems.push(`${state.staf} staflid${state.staf === 1 ? "" : "eden"}`);
  const totaalTekst = totaalItems.length > 0 ? totaalItems.join(" + ") : "Niks";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(2px)",
      }}
      onClick={onAnnuleer}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border-0)",
          borderRadius: 12,
          maxWidth: 380,
          width: "90%",
          padding: 18,
          boxShadow: "0 20px 48px rgba(0,0,0,.4)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-1)",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: state.nieuwGebundeld ? "var(--accent-dim)" : "rgba(249,115,22,.15)",
              color: state.nieuwGebundeld ? "var(--accent)" : "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {state.nieuwGebundeld ? "⇌" : "↺"}
          </span>
          {titel}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 12 }}>
          {uitleg}
        </div>
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border-0)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".5px",
              color: "var(--text-3)",
              marginBottom: 3,
            }}
          >
            Wordt verplaatst
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{totaalTekst}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
            → {state.doelNaam}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onAnnuleer}
            style={{
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid var(--border-0)",
              background: "var(--bg-2)",
              color: "var(--text-2)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Annuleren
          </button>
          <button
            onClick={onBevestig}
            style={{
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {state.nieuwGebundeld ? "Combineren" : "Ontbinden"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelBadge() {
  return (
    <span
      style={{
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: ".4px",
        textTransform: "uppercase" as const,
        color: "rgba(59,130,246,1)",
        background: "rgba(59,130,246,.12)",
        border: "1px solid rgba(59,130,246,.30)",
        borderRadius: 4,
        padding: "1px 5px",
        flexShrink: 0,
      }}
    >
      Sel
    </span>
  );
}

// ─── Gedeelde teamrij binnen een selectie-blok ───────────────────────────────

function SelectieTeamRij({
  team,
  geselecteerdTeamId,
  rechts,
  onTeamSelect,
}: {
  team: WerkbordTeam;
  geselecteerdTeamId: string | null;
  rechts: React.ReactNode;
  onTeamSelect: (teamId: string) => void;
}) {
  const geselecteerd = team.id === geselecteerdTeamId;
  const dotKleur =
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
            background: "var(--oranje)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{team.naam}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {rechts}
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
  );
}

// ─── Gecombineerde selectie (gebundeld = true) ───────────────────────────────
// Header: selectienaam + 1 dame-count + 1 heer-count (gezamenlijke pool)
// Per team: alleen naam — geen per-team gender-split (alles is gecombineerd)

function SelectieGroepBlok({
  groep,
  geselecteerdTeamId,
  onTeamSelect,
}: {
  groep: Extract<TeamGroep, { type: "selectie" }>;
  geselecteerdTeamId: string | null;
  onTeamSelect: (teamId: string) => void;
}) {
  const primary = groep.teams[0];
  const totalDames = primary?.selectieDames.length ?? 0;
  const totalHeren = primary?.selectieHeren.length ?? 0;
  const selectieNaam = primary?.selectieNaam ?? groep.teams.map((t) => t.naam).join(" ↔ ");

  return (
    <div style={{ margin: "3px 8px 8px" }}>
      <div style={SEL_FRAME_STYLE}>
        <div style={SEL_HEADER_STYLE}>
          <SelBadge />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-1)",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectieNaam}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: "var(--pink)", opacity: 0.6 }}>♀</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--pink)" }}>
              {totalDames}
            </span>
            <span style={{ fontSize: 10, color: "var(--blue)", opacity: 0.6, marginLeft: 2 }}>
              ♂
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--blue)" }}>
              {totalHeren}
            </span>
          </div>
        </div>

        {groep.teams.map((team, i) => (
          <div key={team.id} style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,.05)" } : {}}>
            <SelectieTeamRij
              team={team}
              geselecteerdTeamId={geselecteerdTeamId}
              rechts={null}
              onTeamSelect={onTeamSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Niet-gecombineerde selectie (gebundeld = false) ─────────────────────────
// Header: selectienaam + opgetelde ♀/♂ totalen
// Per team: naam + eigen ♀N/♂N telling

function SelectieGroepOngebundeld({
  groep,
  geselecteerdTeamId,
  onTeamSelect,
}: {
  groep: Extract<TeamGroep, { type: "selectie" }>;
  geselecteerdTeamId: string | null;
  onTeamSelect: (teamId: string) => void;
}) {
  const selectieNaam = groep.teams[0]?.selectieNaam ?? groep.teams.map((t) => t.naam).join(" ↔ ");
  const totalDames = groep.teams.reduce((s, t) => s + t.dames.length, 0);
  const totalHeren = groep.teams.reduce((s, t) => s + t.heren.length, 0);

  return (
    <div style={{ margin: "3px 8px 8px" }}>
      <div style={SEL_FRAME_STYLE}>
        <div style={SEL_HEADER_STYLE}>
          <SelBadge />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-1)",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectieNaam}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: "var(--pink)", opacity: 0.6 }}>♀</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--pink)" }}>
              {totalDames}
            </span>
            <span style={{ fontSize: 10, color: "var(--blue)", opacity: 0.6, marginLeft: 2 }}>
              ♂
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--blue)" }}>
              {totalHeren}
            </span>
          </div>
        </div>

        {groep.teams.map((team, i) => (
          <div key={team.id} style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,.05)" } : {}}>
            <SelectieTeamRij
              team={team}
              geselecteerdTeamId={geselecteerdTeamId}
              rechts={
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--pink)" }}>
                    ♀{team.dames.length}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>/</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>
                    ♂{team.heren.length}
                  </span>
                </div>
              }
              onTeamSelect={onTeamSelect}
            />
          </div>
        ))}
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
  const [bundelingBevestiging, setBundelingBevestiging] = useState<null | {
    nieuwGebundeld: boolean;
    spelers: number;
    staf: number;
    doelNaam: string;
  }>(null);

  const beschikbaar = alleTeams.filter((t) => t.id !== team.id && !t.selectieGroepId);
  const gekoppeldAan = alleTeams.find(
    (t) => t.selectieGroepId === team.selectieGroepId && t.id !== team.id
  );
  const teamsInSelectie = team.selectieGroepId
    ? alleTeams
        .filter((t) => t.selectieGroepId === team.selectieGroepId)
        .sort((a, b) => a.volgorde - b.volgorde)
    : [];

  const naamPlaceholder = gekoppeldAan ? `${team.naam} ↔ ${gekoppeldAan.naam}` : "Selectienaam…";

  function vraagBundelingBevestiging(nieuwGebundeld: boolean) {
    if (!team.selectieGroepId || teamsInSelectie.length === 0) return;
    if (nieuwGebundeld) {
      // Bundelen — tel spelers + staf van álle teams in de selectie
      const spelerIds = new Set<string>();
      const stafIds = new Set<string>();
      for (const t of teamsInSelectie) {
        t.dames.forEach((s) => spelerIds.add(s.spelerId));
        t.heren.forEach((s) => spelerIds.add(s.spelerId));
        t.staf.forEach((s) => stafIds.add(s.stafId));
      }
      setBundelingBevestiging({
        nieuwGebundeld: true,
        spelers: spelerIds.size,
        staf: stafIds.size,
        doelNaam: teamsInSelectie.map((t) => t.naam).join(" + "),
      });
    } else {
      // Ontbundelen — tel selectieDames/selectieHeren/selectieStaf op primary team
      const primary = teamsInSelectie[0];
      const spelerIds = new Set<string>();
      primary.selectieDames.forEach((s) => spelerIds.add(s.spelerId));
      primary.selectieHeren.forEach((s) => spelerIds.add(s.spelerId));
      const stafIds = new Set<string>();
      // Staf wordt bij gebundelde selecties ook op primary geplaatst via server
      primary.staf.forEach((s) => stafIds.add(s.stafId));
      setBundelingBevestiging({
        nieuwGebundeld: false,
        spelers: spelerIds.size,
        staf: stafIds.size,
        doelNaam: primary.naam,
      });
    }
  }

  function bevestigBundeling() {
    if (!bundelingBevestiging || !team.selectieGroepId) return;
    const nieuwGebundeld = bundelingBevestiging.nieuwGebundeld;
    setBundelingBevestiging(null);
    startTransition(async () => {
      await onToggleBundeling(team.selectieGroepId!, nieuwGebundeld);
    });
  }

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
              onClick={() => vraagBundelingBevestiging(!team.gebundeld)}
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
          {bundelingBevestiging && (
            <BundelingBevestigingDialog
              state={bundelingBevestiging}
              onBevestig={bevestigBundeling}
              onAnnuleer={() => setBundelingBevestiging(null)}
            />
          )}

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

function TeamDetailHero({ team }: { team: WerkbordTeam }) {
  const bandKleur = KLEUR_BAND[team.kleur] ?? KLEUR_BAND.senior;
  const heroGradient = KLEUR_HERO_GRADIENT[team.kleur] ?? KLEUR_HERO_GRADIENT.senior;

  const valDotKleur = VAL_KLEUR[team.validatieStatus];

  // Subtitel: formaat · niveau · kleur
  const formaatLabel =
    team.formaat === "viertal" ? "4-tal" : team.formaat === "achtal" ? "8-tal" : "selectie";
  const niveauLabel = team.niveau ?? null;
  const kleurLabel = team.kleur !== "senior" ? team.kleur : null;
  const subtitelParts = [formaatLabel, niveauLabel, kleurLabel].filter(Boolean);

  return (
    <div
      style={{
        position: "relative",
        padding: "18px 22px 16px 28px",
        borderBottom: "1px solid var(--border-0)",
        background: heroGradient,
        flexShrink: 0,
      }}
    >
      {/* 5px kleurband links */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: bandKleur,
          borderRadius: "0 0 0 0",
        }}
      />

      {/* Teamnaam */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "var(--text-1)",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {team.naam}
      </div>

      {/* Subtitel */}
      {subtitelParts.length > 0 && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          {subtitelParts.join(" · ")}
        </div>
      )}

      {/* Meta-rij: ♀ dames, ♂ heren, memo-vlag, validatie-dot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <VenusIcon size={12} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--pink)" }}>
            {team.dames.length}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <MarsIcon size={12} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--blue)" }}>
            {team.heren.length}
          </span>
        </span>

        <span style={{ flex: 1 }} />

        {team.openMemoCount > 0 && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "var(--warn)",
              fontWeight: 700,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 3h10l4 4v14H5z" />
              <path d="M15 3v4h4" />
              <path d="M8 12h8M8 15h8M8 18h5" />
            </svg>
            ▲ {team.openMemoCount}
          </span>
        )}

        {/* Validatie-dot */}
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: valDotKleur,
            boxShadow: `0 0 5px 1px ${valDotKleur}60`,
            flexShrink: 0,
          }}
          title={`Validatie: ${team.validatieStatus}`}
        />
      </div>
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
      <TeamDetailHero team={team} />
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
  onNieuwTeam,
  onConfigUpdated,
  onValidatieUpdated,
  onTeamVerwijderd,
  onSelectieGekoppeld,
  onSelectieOntkoppeld,
  onSelectieNaamUpdated,
  onToggleBundeling,
  onTeamsHerordend,
}: TeamDrawerProps) {
  const geselecteerdTeam = teams.find((t) => t.id === geselecteerdTeamId) ?? null;
  const gesorteerdeTeams = [...teams].sort((a, b) => a.volgorde - b.volgorde);

  const [nieuwFormOpen, setNieuwFormOpen] = useState(false);
  const [nieuwNaam, setNieuwNaam] = useState("");
  const [nieuwCategorie, setNieuwCategorie] = useState("SENIOREN");
  const [nieuwTeamFout, setNieuwTeamFout] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ─── Drag-and-drop volgorde ──────────────────────────────────
  const dragGroepIndexRef = useRef<number | null>(null);
  const [dropGroepIndex, setDropGroepIndex] = useState<number | null>(null);

  function handleDragStart(index: number) {
    dragGroepIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDropGroepIndex(index);
  }

  function handleDragEnd() {
    const vanIndex = dragGroepIndexRef.current;
    const naarIndex = dropGroepIndex;

    dragGroepIndexRef.current = null;
    setDropGroepIndex(null);

    if (vanIndex === null || naarIndex === null || vanIndex === naarIndex) return;

    const groepen = groepeerTeams(gesorteerdeTeams);
    const nieuw = [...groepen];
    const [verplaatst] = nieuw.splice(vanIndex, 1);
    nieuw.splice(naarIndex, 0, verplaatst);

    // Nieuwe volgorde: groepIndex * 10 (ruimte laten voor later)
    const updates: { id: string; volgorde: number }[] = [];
    nieuw.forEach((groep, gi) => {
      const teamsInGroep = groep.type === "los" ? [groep.team] : groep.teams;
      teamsInGroep.forEach((team, ti) => {
        updates.push({ id: team.id, volgorde: gi * 10 + ti });
      });
    });

    onTeamsHerordend(updates);
    void updateTeamVolgorde(updates);
  }

  function handleNieuwTeamSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nieuwNaam.trim()) return;
    setNieuwTeamFout(null);
    startTransition(async () => {
      const result = await maakTeamAan(versieId, nieuwNaam, nieuwCategorie);
      if (result.ok) {
        onNieuwTeam(result.data);
        setNieuwNaam("");
        setNieuwCategorie("SENIOREN");
        setNieuwFormOpen(false);
      } else {
        setNieuwTeamFout(result.error ?? "Onbekende fout");
      }
    });
  }

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
              borderBottom: nieuwFormOpen ? "none" : "1px solid var(--border-0)",
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
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setNieuwFormOpen((v) => !v)}
                title="Team toevoegen"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: nieuwFormOpen ? "var(--accent)" : "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: nieuwFormOpen ? "#fff" : "var(--text-3)",
                  fontSize: 16,
                }}
              >
                +
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

          {/* Inline formulier: nieuw team */}
          {nieuwFormOpen && (
            <form
              onSubmit={handleNieuwTeamSubmit}
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid var(--border-0)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "var(--bg-0)",
                flexShrink: 0,
              }}
            >
              <input
                autoFocus
                placeholder="Teamnaam"
                value={nieuwNaam}
                onChange={(e) => setNieuwNaam(e.target.value)}
                disabled={isPending}
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border-1)",
                  borderRadius: 6,
                  color: "var(--text-1)",
                  fontSize: 12,
                  padding: "6px 8px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <select
                value={nieuwCategorie}
                onChange={(e) => setNieuwCategorie(e.target.value)}
                disabled={isPending}
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border-1)",
                  borderRadius: 6,
                  color: "var(--text-1)",
                  fontSize: 12,
                  padding: "6px 8px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="SENIOREN">Senioren</option>
                <option value="A_CATEGORIE">A-categorie</option>
                <option value="B_CATEGORIE">B-categorie</option>
              </select>
              {nieuwTeamFout && (
                <span style={{ color: "var(--error, #f87171)", fontSize: 11 }}>
                  {nieuwTeamFout}
                </span>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="submit"
                  disabled={isPending || !nieuwNaam.trim()}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    borderRadius: 6,
                    background: isPending || !nieuwNaam.trim() ? "var(--bg-2)" : "var(--accent)",
                    color: isPending || !nieuwNaam.trim() ? "var(--text-3)" : "#fff",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isPending || !nieuwNaam.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {isPending ? "Aanmaken…" : "Aanmaken"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNieuwFormOpen(false);
                    setNieuwNaam("");
                    setNieuwTeamFout(null);
                  }}
                  disabled={isPending}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: "var(--bg-2)",
                    color: "var(--text-3)",
                    border: "1px solid var(--border-1)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Annuleer
                </button>
              </div>
            </form>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
            {groepeerTeams(gesorteerdeTeams).map((groep, index) => {
              const key = groep.type === "los" ? groep.team.id : groep.selectieGroepId;
              const isDragTarget = dropGroepIndex === index;
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    outline: isDragTarget ? "2px solid rgba(255,107,0,.5)" : "none",
                    outlineOffset: -2,
                    borderRadius: groep.type === "selectie" ? 11 : 0,
                    opacity: dragGroepIndexRef.current === index ? 0.4 : 1,
                    transition: "opacity 120ms, outline 80ms",
                    cursor: "grab",
                  }}
                >
                  {groep.type === "los" ? (
                    <PlatteTeamKaart
                      team={groep.team}
                      geselecteerd={groep.team.id === geselecteerdTeamId}
                      showScores={true}
                      onClick={() => onTeamSelect(groep.team.id)}
                    />
                  ) : groep.gebundeld ? (
                    <SelectieGroepBlok
                      groep={groep}
                      geselecteerdTeamId={geselecteerdTeamId}
                      onTeamSelect={onTeamSelect}
                    />
                  ) : (
                    <SelectieGroepOngebundeld
                      groep={groep}
                      geselecteerdTeamId={geselecteerdTeamId}
                      onTeamSelect={onTeamSelect}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
}
