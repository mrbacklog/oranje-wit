"use client";

import type { TeamKaartData, TeamKaartSpeler } from "./werkbord-types";
import { useWerkbordDropTarget } from "./hooks/useWerkbordDropTarget";
import { useWerkbordDraggable, type DragBron } from "./hooks/useWerkbordDraggable";
import type { WerkbordDragData } from "./hooks/useWerkbordDraggable";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const CAT_KLEUREN: Record<string, string> = {
  SENIOR: "var(--cat-senior)",
  rood: "var(--cat-rood)",
  oranje: "var(--cat-oranje)",
  geel: "var(--cat-geel)",
  groen: "var(--cat-groen)",
  blauw: "var(--cat-blauw)",
  paars: "var(--cat-paars)",
};

// Label voor categorie-driehoek subtitle
const CAT_LABELS: Record<string, string> = {
  SENIOR: "SENIOR",
  rood: "ROOD",
  oranje: "ORANJE",
  geel: "GEEL",
  groen: "GROEN",
  blauw: "BLAUW",
  paars: "PAARS",
};

const VAL_KLEUREN: Record<string, string> = {
  OK: "var(--val-ok)",
  WAARSCHUWING: "var(--val-warn)",
  FOUT: "var(--val-err)",
  ONBEKEND: "var(--border-default)",
};

function catKleur(team: TeamKaartData): string {
  if (team.kleur) return CAT_KLEUREN[team.kleur] ?? "var(--cat-senior)";
  return CAT_KLEUREN[team.categorie] ?? "var(--cat-senior)";
}

function leeftijdKleur(leeftijd: number): string {
  if (leeftijd <= 7) return "var(--cat-blauw)";
  if (leeftijd <= 9) return "var(--cat-groen)";
  if (leeftijd <= 12) return "var(--cat-geel)";
  if (leeftijd <= 15) return "var(--cat-oranje)";
  if (leeftijd <= 18) return "var(--cat-rood)";
  return "var(--cat-senior)";
}

function statusKleur(status: string): string {
  switch (status) {
    case "NIEUW":
      return "rgba(255,255,255,.85)";
    case "TWIJFELT":
      return "rgba(253,186,116,.8)";
    case "STOPT":
      return "rgba(220,38,38,.75)";
    case "AR":
    case "ALGEMEEN_RESERVE":
      return "rgba(148,163,184,.55)";
    default:
      return "rgba(255,255,255,.7)";
  }
}

function avatarInitialen(roepnaam: string, achternaam: string): string {
  const r = roepnaam.trim()[0]?.toUpperCase() ?? "";
  const a = achternaam.trim()[0]?.toUpperCase() ?? "";
  return r + a;
}

// ── isAchttal — viertal = ≤6 per geslacht, achttal = meer ───────────────────
function isAchttal(team: TeamKaartData): boolean {
  if (team.teamType) {
    const t = team.teamType.toUpperCase();
    if (t === "ACHTTAL" || t === "8TAL") return true;
    if (t === "VIERTAL" || t === "4TAL") return false;
  }
  return team.spelersDames.length + team.spelersHeren.length > 8;
}

// ── CompactChip ──────────────────────────────────────────────────────────────

interface CompactChipProps {
  speler: TeamKaartSpeler;
  teamId: string;
  onClick: (spelerId: string) => void;
  onDrop: (data: WerkbordDragData) => void;
}

function CompactChip({ speler, teamId, onClick, onDrop }: CompactChipProps) {
  const isVrouw = speler.geslacht === "V";
  const bron: DragBron = `team-${teamId}`;
  const { ref: dragRef, isDragging } = useWerkbordDraggable({ rel_code: speler.spelerId, bron });
  const { ref: dropRef, isOver } = useWerkbordDropTarget({ doelBron: bron, onDrop });

  const combinedRef = (el: HTMLDivElement | null) => {
    (dragRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (dropRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return (
    <div
      ref={combinedRef}
      className={cx("compact-chip", isVrouw && "vrouw", isOver && "drop-over")}
      data-testid={`speler-card-${speler.spelerId}-team-${teamId}`}
      style={
        {
          "--status-color": statusKleur(speler.status),
          cursor: isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.4 : 1,
          outline: isOver ? "1px solid var(--val-ok)" : "none",
          outlineOffset: 1,
        } as React.CSSProperties
      }
      onClick={() => onClick(speler.spelerId)}
      title={`${speler.roepnaam} ${speler.achternaam} (${speler.korfbalLeeftijd.toFixed(1)} jr)`}
    >
      <div className="inner">
        <span className="g-dot" />
        <span className="nm">{speler.roepnaam}</span>
      </div>
      <div className="leeft-bar" style={{ background: leeftijdKleur(speler.korfbalLeeftijd) }} />
    </div>
  );
}

// ── DetailRij — 52px rijke rij per speler in detail-modus ───────────────────

interface DetailRijProps {
  speler: TeamKaartSpeler;
  teamId: string;
  onClick: (spelerId: string) => void;
  onDrop: (data: WerkbordDragData) => void;
}

function DetailRij({ speler, teamId, onClick, onDrop }: DetailRijProps) {
  const isVrouw = speler.geslacht === "V";
  const bron: DragBron = `team-${teamId}`;
  const { ref: dragRef, isDragging } = useWerkbordDraggable({ rel_code: speler.spelerId, bron });
  const { ref: dropRef, isOver } = useWerkbordDropTarget({ doelBron: bron, onDrop });

  const combinedRef = (el: HTMLDivElement | null) => {
    (dragRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (dropRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return (
    <div
      ref={combinedRef}
      className={cx("tk-rijke-rij", isVrouw ? "vrouw" : "heer")}
      data-testid={`speler-card-${speler.spelerId}-team-${teamId}`}
      style={
        {
          "--status-color": statusKleur(speler.status),
          cursor: isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.4 : 1,
          outline: isOver ? "1px solid var(--val-ok)" : "none",
          outlineOffset: 1,
        } as React.CSSProperties
      }
      onClick={() => onClick(speler.spelerId)}
      title={`${speler.roepnaam} ${speler.achternaam} (${speler.korfbalLeeftijd.toFixed(1)} jr)`}
    >
      {/* Avatar — initialen only */}
      <div
        className="sq-av"
        style={{
          width: 40,
          height: "100%",
          borderRadius: "4px 0 0 4px",
          overflow: "hidden",
          flexShrink: 0,
          background: isVrouw ? "rgba(217,70,239,.12)" : "rgba(37,99,235,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          color: isVrouw ? "var(--sexe-v)" : "var(--sexe-h)",
          borderRight: `1.5px solid ${statusKleur(speler.status)}`,
        }}
      >
        {avatarInitialen(speler.roepnaam, speler.achternaam)}
      </div>

      {/* Naam + sub */}
      <div
        className="col"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minWidth: 0,
          padding: "0 4px",
        }}
      >
        <span className="nm">
          {speler.roepnaam} {speler.achternaam}
        </span>
        <div className="row2">
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: statusKleur(speler.status),
              flexShrink: 0,
              display: "inline-block",
            }}
          />
        </div>
      </div>

      {/* Leeftijdscel */}
      <div className="leeft-col" style={{ background: leeftijdKleur(speler.korfbalLeeftijd) }}>
        <span className="lb">{Math.floor(speler.korfbalLeeftijd)}</span>
        <span className="ld">jr</span>
      </div>
    </div>
  );
}

// ── TeamKaartHeader ──────────────────────────────────────────────────────────

interface TeamKaartHeaderProps {
  team: TeamKaartData;
  kleur: string;
  valKleur: string;
  totaal: number;
  onClick: () => void;
}

function TeamKaartHeader({ team, kleur, valKleur, totaal, onClick }: TeamKaartHeaderProps) {
  // Subtitle: "ROOD · U17" of "GROEN · 8–9"
  const catLabel =
    (team.kleur ? CAT_LABELS[team.kleur] : null) ??
    CAT_LABELS[team.categorie] ??
    team.categorie.toUpperCase();
  const klasseSuffix = team.teamType ?? null;
  const subtitle = klasseSuffix ? `${catLabel} · ${klasseSuffix}` : catLabel;

  return (
    <div
      className="tk-header"
      style={{
        minHeight: "var(--team-card-header-h)",
        display: "flex",
        alignItems: "center",
        padding: "10px 14px 10px 18px",
        borderBottom: "1px solid var(--border-light)",
        gap: 10,
        cursor: "pointer",
        flexShrink: 0,
        position: "relative",
        zIndex: 1,
      }}
      onClick={onClick}
    >
      {/* Naam + subtitle */}
      <div className="tk-naam-wrap" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span
          className="tk-naam"
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {team.alias ?? team.naam}
        </span>
        <span
          className="tk-naam-sub"
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginTop: 2,
          }}
        >
          {subtitle}
        </span>
      </div>

      {/* Memo-icoon */}
      {team.openMemoCount > 0 && (
        <span
          data-memo-indicator
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "var(--memo-open)",
          }}
          title={`${team.openMemoCount} open memo`}
        >
          ▲{team.openMemoCount}
        </span>
      )}

      {/* Categorie-driehoek rechtsboven */}
      <div
        className="val-hoek"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "var(--team-card-header-h)",
          height: "var(--team-card-header-h)",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 3,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: `0 var(--team-card-header-h) var(--team-card-header-h) 0`,
            borderColor: `transparent ${valKleur} transparent transparent`,
          }}
        />
      </div>

      {/* Speler-tellers (totaal) */}
      <div className="tk-header-right" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {totaal}
        </span>
      </div>
    </div>
  );
}

// ── TeamKaartFooter ──────────────────────────────────────────────────────────

interface TeamKaartFooterProps {
  team: TeamKaartData;
  onStafClick: (stafId: string) => void;
}

function TeamKaartFooter({ team, onStafClick }: TeamKaartFooterProps) {
  return (
    <div
      className="tk-staf-footer"
      style={{
        minHeight: "var(--team-card-footer-h)",
        borderTop: "1px solid var(--border-light)",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 5,
        padding: "8px 14px 8px 18px",
        flexShrink: 0,
        overflow: "hidden",
        background: "rgba(255,255,255,.015)",
      }}
    >
      {team.staf.slice(0, 4).map((stafLid) => (
        <button
          key={stafLid.stafId}
          onClick={(e) => {
            e.stopPropagation();
            onStafClick(stafLid.stafId);
          }}
          className="staf-compact"
          title={stafLid.naam}
          style={{ cursor: "pointer", fontFamily: "inherit", background: "transparent" }}
        >
          <div className="inner">
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--staf-accent)",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span className="nm">{stafLid.naam.split(" ").slice(0, 2).join(" ")}</span>
          </div>
        </button>
      ))}
      {team.staf.length > 4 && (
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>+{team.staf.length - 4}</span>
      )}
    </div>
  );
}

// ── TeamKaartSpelerKolom ─────────────────────────────────────────────────────

interface SpelerKolomProps {
  spelers: TeamKaartSpeler[];
  geslacht: "V" | "M";
  teamId: string;
  zoom: "compact" | "detail";
  isLaatste: boolean;
  onClick: (spelerId: string) => void;
  onDrop: (data: WerkbordDragData) => void;
}

function SpelerKolom({
  spelers,
  geslacht,
  teamId,
  zoom,
  isLaatste,
  onClick,
  onDrop,
}: SpelerKolomProps) {
  const isVrouw = geslacht === "V";
  const aantalLabel = spelers.length;

  return (
    <div
      className="tk-col"
      style={{
        flex: 1,
        borderRight: isLaatste ? "none" : "1px solid var(--border-light)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {/* Sexe-teller: groot icoon boven getal, driehoekje eronder */}
      <div className={cx("compact-sexe-teller", isVrouw ? "v" : "h")} style={{ flexShrink: 0 }}>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: isVrouw ? "rgba(217,70,239,.7)" : "rgba(37,99,235,.7)",
            lineHeight: 1,
          }}
        >
          {isVrouw ? "♀" : "♂"}
        </span>
        <span className="st-val">{aantalLabel}</span>
        <span
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,.3)",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ▾
        </span>
      </div>

      {/* Speler-lijst */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: zoom === "detail" ? 4 : 2,
          padding: zoom === "detail" ? "8px 8px" : "0 4px 6px",
        }}
        className="ow-scroll"
      >
        {spelers.map((s) =>
          zoom === "compact" ? (
            <CompactChip
              key={s.spelerId}
              speler={s}
              teamId={teamId}
              onClick={onClick}
              onDrop={onDrop}
            />
          ) : (
            <DetailRij
              key={s.spelerId}
              speler={s}
              teamId={teamId}
              onClick={onClick}
              onDrop={onDrop}
            />
          )
        )}
      </div>
    </div>
  );
}

// ── TeamKaart ────────────────────────────────────────────────────────────────

interface TeamKaartProps {
  team: TeamKaartData;
  zoom: "compact" | "detail";
  peildatum: Date;
  onHeaderClick: (teamId: string) => void;
  onSpelerClick: (spelerId: string) => void;
  onStafClick: (stafId: string) => void;
  onDropSpeler?: (data: WerkbordDragData, naarTeamId: string) => void;
}

export function TeamKaart({
  team,
  zoom,
  onHeaderClick,
  onSpelerClick,
  onStafClick,
  onDropSpeler,
}: TeamKaartProps) {
  const kleur = catKleur(team);
  const valKleur = VAL_KLEUREN[team.validatieStatus] ?? "var(--border-default)";
  const aantalDames = team.spelersDames.length;
  const aantalHeren = team.spelersHeren.length;
  const totaal = aantalDames + aantalHeren;
  const achttal = isAchttal(team);

  const doelBron: DragBron = `team-${team.id}`;
  const { ref: dropRef, isOver } = useWerkbordDropTarget({
    doelBron,
    onDrop: (data) => onDropSpeler?.(data, team.id),
  });

  function handleDropOpKolom(data: WerkbordDragData) {
    onDropSpeler?.(data, team.id);
  }

  return (
    <div
      ref={dropRef}
      className={cx("team-kaart", achttal ? "achttal" : "viertal")}
      data-team-id={team.id}
      data-testid={`team-kaart-${team.id}-huidig`}
      data-drop-testid={`drop-zone-team-${team.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-card)",
        borderRadius: "var(--team-card-radius)",
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
        height: "var(--card-height)",
        border: isOver ? "1px solid var(--val-ok)" : "1px solid var(--border-light)",
        boxShadow: isOver ? "0 0 0 2px var(--val-ok)" : "0 2px 12px rgba(0,0,0,.3)",
      }}
    >
      {/* Gekleurde linker-accent-band */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "var(--team-band-width)",
          background: kleur,
          borderRadius: "var(--team-card-radius) 0 0 var(--team-card-radius)",
          zIndex: 1,
        }}
      />

      {/* Header */}
      <TeamKaartHeader
        team={team}
        kleur={kleur}
        valKleur={valKleur}
        totaal={totaal}
        onClick={() => onHeaderClick(team.id)}
      />

      {/* Body */}
      <div className="tk-body" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Dames-kolom */}
        <SpelerKolom
          spelers={team.spelersDames}
          geslacht="V"
          teamId={team.id}
          zoom={zoom}
          isLaatste={false}
          onClick={onSpelerClick}
          onDrop={handleDropOpKolom}
        />

        {/* Heren-kolom */}
        <SpelerKolom
          spelers={team.spelersHeren}
          geslacht="M"
          teamId={team.id}
          zoom={zoom}
          isLaatste={true}
          onClick={onSpelerClick}
          onDrop={handleDropOpKolom}
        />
      </div>

      {/* Footer: staf */}
      <TeamKaartFooter team={team} onStafClick={onStafClick} />
    </div>
  );
}
