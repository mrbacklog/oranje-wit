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
  SENIOREN: "var(--cat-senior)",
  rood: "var(--cat-rood)",
  ROOD: "var(--cat-rood)",
  oranje: "var(--cat-oranje)",
  ORANJE: "var(--cat-oranje)",
  geel: "var(--cat-geel)",
  GEEL: "var(--cat-geel)",
  groen: "var(--cat-groen)",
  GROEN: "var(--cat-groen)",
  blauw: "var(--cat-blauw)",
  BLAUW: "var(--cat-blauw)",
  paars: "var(--cat-paars)",
  PAARS: "var(--cat-paars)",
};

// OWTeamType → categorie-CSS-klasse (voor kleurband)
const OW_TYPE_CAT_CLASS: Record<string, string> = {
  JEUGD: "cat-blauw",
  SELECTIE: "cat-oranje",
  SENIOREN: "cat-senior",
  OVERIG: "cat-senior",
};

const VAL_KLEUREN: Record<string, string> = {
  OK: "var(--val-ok)",
  WAARSCHUWING: "var(--val-warn)",
  FOUT: "var(--val-err)",
  ONBEKEND: "var(--border-default)",
};

function catKleur(team: TeamKaartData): string {
  if (team.kleur) return CAT_KLEUREN[team.kleur.toUpperCase()] ?? "var(--cat-senior)";
  return CAT_KLEUREN[team.categorie?.toUpperCase()] ?? "var(--cat-senior)";
}

// Bepaal CSS-klasse voor kleurband obv OWTeamType of categorie
function catClass(team: TeamKaartData): string {
  // Probeer eerst via kleur-token
  const kleurUpper = team.kleur?.toUpperCase();
  if (kleurUpper) {
    const map: Record<string, string> = {
      PAARS: "cat-paars",
      BLAUW: "cat-blauw",
      GROEN: "cat-groen",
      GEEL: "cat-geel",
      ORANJE: "cat-oranje",
      ROOD: "cat-rood",
      SENIOR: "cat-senior",
      SENIOREN: "cat-senior",
    };
    if (map[kleurUpper]) return map[kleurUpper];
  }
  // Valt terug op categorie of teamType
  const cat = team.categorie?.toUpperCase();
  if (cat === "SENIOREN") return "cat-senior";
  if (cat === "A_CATEGORIE") return "cat-rood";
  if (cat === "B_CATEGORIE") return "cat-blauw";
  // OWTeamType als fallback
  const owType = (team as TeamKaartData & { owTeamType?: string }).owTeamType?.toUpperCase();
  if (owType && OW_TYPE_CAT_CLASS[owType]) return OW_TYPE_CAT_CLASS[owType];
  return "cat-senior";
}

// Leeftijdgradient — retourneert CSS var-referentie
function leeftijdGradient(leeftijd: number): string {
  const jaar = Math.max(4, Math.min(19, Math.floor(leeftijd)));
  return `var(--leeftijd-${jaar})`;
}

// Compact naam-formaat: "Roepnaam [tvs-afk.] A." (spec §3.1)
function compactNaam(speler: TeamKaartSpeler): string {
  const initiaal = speler.achternaam ? speler.achternaam[0].toUpperCase() + "." : "";
  if (speler.tussenvoegsel) {
    // Afkort tussenvoegsel: eerste woord, max 3 chars + "."
    const tvsDelen = speler.tussenvoegsel.split(" ");
    const tvsAfk = tvsDelen[0].substring(0, 3);
    return `${speler.roepnaam} ${tvsAfk} ${initiaal}`;
  }
  return `${speler.roepnaam} ${initiaal}`;
}

function statusKlasseChip(status: string): string {
  switch (status) {
    case "NIEUW":
      return "st-nieuw";
    case "TWIJFELT":
      return "st-twijfelt";
    case "STOPT":
      return "st-stopt";
    case "AR":
    case "ALGEMEEN_RESERVE":
      return "st-ar";
    default:
      return "";
  }
}

function statusKleur(status: string): string {
  switch (status) {
    case "NIEUW":
      return "var(--status-nieuw-outline)";
    case "TWIJFELT":
      return "var(--status-twijfelt-outline)";
    case "STOPT":
      return "var(--status-stopt-outline)";
    case "AR":
    case "ALGEMEEN_RESERVE":
      return "var(--status-ar-outline)";
    default:
      return "var(--status-beschikbaar-outline)";
  }
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
      className={cx(
        "compact-chip",
        isVrouw && "vrouw",
        isOver && "drop-over",
        statusKlasseChip(speler.status)
      )}
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
      title={`${speler.roepnaam} ${speler.tussenvoegsel ? speler.tussenvoegsel + " " : ""}${speler.achternaam} (${speler.korfbalLeeftijd.toFixed(1)} jr)`}
    >
      <div className="inner">
        <span className="g-dot" />
        <span className="nm">{compactNaam(speler)}</span>
      </div>
      <div className="leeft-bar" style={{ background: leeftijdGradient(speler.korfbalLeeftijd) }} />
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
      {/* Smal verticaal geslachtsblokje — 8px breed, full-height */}
      <div
        style={{
          width: 8,
          alignSelf: "stretch",
          flexShrink: 0,
          background: isVrouw ? "#ec4899" : "#3b82f6",
          borderRadius: "4px 0 0 4px",
        }}
      />

      {/* Naam + status-dot */}
      <div
        className="col"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minWidth: 0,
          padding: "0 6px",
        }}
      >
        <span
          className="nm"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {speler.roepnaam} {speler.tussenvoegsel ? `${speler.tussenvoegsel} ` : ""}
          {speler.achternaam}
        </span>
        <div className="row2">
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: statusKleur(speler.status),
              flexShrink: 0,
              display: "inline-block",
            }}
          />
        </div>
      </div>

      {/* Leeftijdscel — groot getal + decimaal */}
      <div className="leeft-col" style={{ background: leeftijdGradient(speler.korfbalLeeftijd) }}>
        <span className="lb">{Math.floor(speler.korfbalLeeftijd)}</span>
        <span className="ld">.{String(Math.round((speler.korfbalLeeftijd % 1) * 10))}</span>
      </div>
    </div>
  );
}

// ── TeamKaartHeader ──────────────────────────────────────────────────────────

interface TeamKaartHeaderProps {
  team: TeamKaartData;
  kleur: string;
  valKleur: string;
  aantalDames: number;
  aantalHeren: number;
  onClick: () => void;
}

// Mapping B-categorie kleur → KNKV leeftijdsbereik
const B_KLEUR_KLASSE: Record<string, string> = {
  ROOD: "13–19",
  ORANJE: "11–14",
  GEEL: "8–12",
  GROEN: "6–9",
  BLAUW: "5–7",
  PAARS: "5–7",
};

function bouwSubtitel(team: TeamKaartData): string {
  const cat = team.categorie;

  if (cat === "SENIOREN") return "SENIOR · 19+";

  const kleurLabel = team.kleur ? team.kleur.toUpperCase() : null;

  if (cat === "A_CATEGORIE") {
    const klasse = team.niveau ?? null;
    if (kleurLabel && klasse) return `${kleurLabel} · ${klasse}`;
    if (kleurLabel) return kleurLabel;
    // Leid klasse af uit teamnaam als kleur ontbreekt (bv. "OW U17 Meisjes" → "U17")
    const naamMatch = team.naam.match(/\b(U\d{1,2})\b/i);
    if (naamMatch) return `A · ${naamMatch[1].toUpperCase()}`;
    if (klasse) return `A · ${klasse}`;
    return "A-CATEGORIE";
  }

  if (cat === "B_CATEGORIE") {
    if (!kleurLabel) return "B-CATEGORIE";
    const klasse = B_KLEUR_KLASSE[kleurLabel] ?? null;
    return klasse ? `${kleurLabel} · ${klasse}` : kleurLabel;
  }

  return cat;
}

function TeamKaartHeader({
  team,
  kleur,
  valKleur,
  aantalDames,
  aantalHeren,
  onClick,
}: TeamKaartHeaderProps) {
  const subtitle = bouwSubtitel(team);

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
      <div
        className="tk-naam-wrap"
        style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
      >
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

      {/* Geslacht-tellers ♀/♂ apart */}
      <div
        className="tk-header-right"
        style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
      >
        <span
          className="tk-gender-count vrouw"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "2px 6px",
            borderRadius: 5,
            background: "rgba(255,255,255,.04)",
            fontSize: 11,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: "var(--sexe-v)",
          }}
        >
          ♀{aantalDames}
        </span>
        <span
          className="tk-gender-count heer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "2px 6px",
            borderRadius: 5,
            background: "rgba(255,255,255,.04)",
            fontSize: 11,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: "var(--sexe-h)",
          }}
        >
          ♂{aantalHeren}
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
  const kleurKlasse = catClass(team);
  const valKleur = VAL_KLEUREN[team.validatieStatus] ?? "var(--border-default)";
  const aantalDames = team.spelersDames.length;
  const aantalHeren = team.spelersHeren.length;
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
    <div className="kaart-wrap">
      {/* Team-kaart */}
      <div
        ref={dropRef}
        className={cx("team-kaart", achttal ? "achttal" : "viertal", kleurKlasse)}
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
          aantalDames={aantalDames}
          aantalHeren={aantalHeren}
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

      {/* Kaart-label onder de kaart */}
      <div className="kaart-wrap-label">{team.alias ?? team.naam}</div>
    </div>
  );
}
