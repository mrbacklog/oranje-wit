"use client";

import { formatKorfbalLeeftijd } from "@oranje-wit/types";
import type { TeamKaartData, TeamKaartSpeler, SelectieGroepMeta } from "./werkbord-types";
import { useWerkbordDropTarget } from "./hooks/useWerkbordDropTarget";
import { useWerkbordDraggable, type DragBron } from "./hooks/useWerkbordDraggable";
import type { WerkbordDragData } from "./hooks/useWerkbordDraggable";
import { RijkeRij } from "@/components/speler/contexts/RijkeRij";
import { CompactChip } from "@/components/speler/contexts/CompactChip";
import { leeftijdscategorie } from "@/lib/format/speler";
import type { SpelerStatus, WerkitemStatus } from "@oranje-wit/database";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface SelectieKaartProps {
  groep: SelectieGroepMeta;
  teams: TeamKaartData[];
  zoom: "compact" | "detail";
  peildatum: Date;
  onHeaderClick: (groepId: string) => void;
  onTeamHeaderClick: (teamId: string) => void;
  onSpelerClick: (spelerId: string) => void;
  onStafClick: (stafId: string) => void;
  onDropSpeler?: (data: WerkbordDragData, naarTeamId: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Kleur-variant-klasse obv selectiegroep-naam */
function selectieKlasse(naam: string | null): string {
  const n = naam?.toUpperCase() ?? "";
  if (n.includes("U15") || n.includes("U13")) return "sel-oranje";
  if (n.includes("U17")) return "sel-oranje-rood";
  if (n.includes("U19") || n.includes("U18")) return "sel-rood";
  return "sel-zilver";
}

// ── CompactChipWrapper ───────────────────────────────────────────────────────

interface CompactChipWrapperProps {
  speler: TeamKaartSpeler;
  teamId: string;
  onClick: (spelerId: string) => void;
  onDrop: (data: WerkbordDragData) => void;
}

function CompactChipWrapper({ speler, teamId, onClick, onDrop }: CompactChipWrapperProps) {
  const bron: DragBron = `team-${teamId}`;
  const { ref: dropRef, isOver } = useWerkbordDropTarget({ doelBron: bron, onDrop });

  const jaren = Math.floor(speler.korfbalLeeftijd);
  const categorie = leeftijdscategorie(jaren);

  return (
    <div
      ref={dropRef}
      data-testid={`speler-card-${speler.spelerId}-team-${teamId}`}
      style={{
        outline: isOver ? "1px solid var(--val-ok)" : "none",
        outlineOffset: 1,
        borderRadius: 6,
      }}
    >
      <CompactChip
        speler={{
          relCode: speler.spelerId,
          roepnaam: speler.roepnaam,
          tussenvoegsel: speler.tussenvoegsel,
          achternaam: speler.achternaam,
          geslacht: speler.geslacht,
          leeftijdscategorie: categorie,
          status: speler.status as SpelerStatus,
          isNieuw: speler.isNieuw,
          memoStatus: (speler.memoStatus as WerkitemStatus | null | undefined) ?? null,
        }}
        dragBron={bron}
        draggable={speler.status !== "ALGEMEEN_RESERVE"}
        onClick={() => onClick(speler.spelerId)}
      />
    </div>
  );
}

// ── DetailRij ────────────────────────────────────────────────────────────────

interface DetailRijProps {
  speler: TeamKaartSpeler;
  teamId: string;
  teamNaam: string;
  onClick: (spelerId: string) => void;
  onDrop: (data: WerkbordDragData) => void;
}

function DetailRij({ speler, teamId, teamNaam, onClick, onDrop }: DetailRijProps) {
  const bron: DragBron = `team-${teamId}`;
  const { ref: dragRef, isDragging } = useWerkbordDraggable({ rel_code: speler.spelerId, bron });
  const { ref: dropRef, isOver } = useWerkbordDropTarget({ doelBron: bron, onDrop });

  const isAR = speler.status === "ALGEMEEN_RESERVE";

  const combinedRef = (el: HTMLDivElement | null) => {
    (dragRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (dropRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return (
    <div
      ref={combinedRef}
      data-testid={`speler-card-${speler.spelerId}-team-${teamId}`}
      style={{
        cursor: isDragging ? "grabbing" : isAR ? "pointer" : "grab",
        opacity: isDragging ? 0.4 : 1,
        outline: isOver ? "1px solid var(--val-ok)" : "none",
        outlineOffset: 1,
        borderRadius: 6,
      }}
      title={`${speler.roepnaam} ${speler.achternaam} (${formatKorfbalLeeftijd(speler.korfbalLeeftijd)} jr)`}
    >
      <RijkeRij
        speler={{
          relCode: speler.spelerId,
          roepnaam: speler.roepnaam,
          tussenvoegsel: speler.tussenvoegsel,
          achternaam: speler.achternaam,
          geslacht: speler.geslacht,
          leeftijd: speler.korfbalLeeftijd,
          status: speler.status as SpelerStatus,
          isNieuw: speler.isNieuw,
          hasFoto: speler.hasFoto,
          memoStatus: (speler.memoStatus as WerkitemStatus | null | undefined) ?? null,
          huidigTeam: null,
          indelingTeam: teamNaam,
        }}
        variant="team-kaart"
        draggable={!isAR}
        onClick={() => onClick(speler.spelerId)}
      />
    </div>
  );
}

// ── SpelerKolom — één kolom per geslacht per team (of gebundeld) ─────────────

interface SpelerKolomProps {
  spelers: TeamKaartSpeler[];
  geslacht: "V" | "M";
  teamId: string;
  teamNaam: string;
  kolomLabel?: string; // optioneel: kolom-header label boven de teller
  zoom: "compact" | "detail";
  isLaatste: boolean;
  onClick: (spelerId: string) => void;
  onDrop: (data: WerkbordDragData) => void;
}

function SpelerKolom({
  spelers,
  geslacht,
  teamId,
  teamNaam,
  kolomLabel,
  zoom,
  isLaatste,
  onClick,
  onDrop,
}: SpelerKolomProps) {
  const isVrouw = geslacht === "V";

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
      {/* Optionele team-header (niet-gebundeld, detail-mode) */}
      {kolomLabel && (
        <div
          className={cx("tk-col-header", isVrouw ? "v" : "h")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 6px 6px",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            fontWeight: 700,
            borderBottom: "1px solid var(--border-light)",
            marginBottom: 4,
          }}
        >
          <span>{kolomLabel}</span>
          <span
            style={{
              color: "var(--text-secondary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {spelers.length}
          </span>
        </div>
      )}

      {/* Sexe-teller */}
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
        <span className="st-val">{spelers.length}</span>
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
            <CompactChipWrapper
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
              teamNaam={teamNaam}
              onClick={onClick}
              onDrop={onDrop}
            />
          )
        )}
      </div>
    </div>
  );
}

// ── SelectieKaartHeader ──────────────────────────────────────────────────────

interface SelectieKaartHeaderProps {
  groep: SelectieGroepMeta;
  teams: TeamKaartData[];
  onClick: () => void;
}

function SelectieKaartHeader({ groep, teams, onClick }: SelectieKaartHeaderProps) {
  const teamnamen = teams.map((t) => t.alias ?? t.naam);
  const separator = groep.gebundeld ? " & " : " + ";
  const teamnamenStr = teamnamen.join(separator);

  return (
    <div
      className="sk-header"
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
      <div
        className="sk-naam-wrap"
        style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
      >
        <span
          className="sk-naam"
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
          {groep.naam ?? "Selectie"}
          {teamnamenStr && (
            <span
              style={{
                color: "var(--text-tertiary)",
                fontWeight: 600,
                marginLeft: 6,
              }}
            >
              · {teamnamenStr}
            </span>
          )}
        </span>
        <span
          className="sk-naam-sub"
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginTop: 2,
          }}
        >
          {groep.gebundeld ? "Gebundelde selectie" : "Selectie"}
        </span>
      </div>

      {/* SEL-badge rechtsboven */}
      <span
        className="sel-badge"
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          background: "var(--selectie-badge-bg)",
          color: "var(--selectie-badge-text)",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        {groep.gebundeld ? "Gebundeld" : "Selectie"}
      </span>
    </div>
  );
}

// ── SelectieKaartFooter ──────────────────────────────────────────────────────

interface SelectieKaartFooterProps {
  teams: TeamKaartData[];
  onStafClick: (stafId: string) => void;
}

function SelectieKaartFooter({ teams, onStafClick }: SelectieKaartFooterProps) {
  // Gecombineerde staf-lijst, deduplicate op stafId
  const stafMap = new Map<string, { stafId: string; naam: string }>();
  for (const team of teams) {
    for (const s of team.staf) {
      if (!stafMap.has(s.stafId)) {
        stafMap.set(s.stafId, { stafId: s.stafId, naam: s.naam });
      }
    }
  }
  const staf = [...stafMap.values()];

  if (staf.length === 0) return null;

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
      {staf.slice(0, 6).map((s) => (
        <button
          key={s.stafId}
          onClick={(e) => {
            e.stopPropagation();
            onStafClick(s.stafId);
          }}
          className="staf-compact"
          title={s.naam}
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
            <span className="nm">{s.naam.split(" ").slice(0, 2).join(" ")}</span>
          </div>
        </button>
      ))}
      {staf.length > 6 && (
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>+{staf.length - 6}</span>
      )}
    </div>
  );
}

// ── SelectieKaart ────────────────────────────────────────────────────────────

export function SelectieKaart({
  groep,
  teams,
  zoom,
  onHeaderClick,
  onTeamHeaderClick,
  onSpelerClick,
  onStafClick,
  onDropSpeler,
}: SelectieKaartProps) {
  // Drop-target op de volledige kaart; primary team = eerste team in groep
  const primaireTeamId = teams[0]?.id ?? "";
  const doelBron: DragBron = `team-${primaireTeamId}`;
  const { ref: dropRef, isOver } = useWerkbordDropTarget({
    doelBron,
    onDrop: (data) => onDropSpeler?.(data, primaireTeamId),
  });

  const klasse = selectieKlasse(groep.naam);

  function handleDropOpKolom(data: WerkbordDragData, teamId: string) {
    onDropSpeler?.(data, teamId);
  }

  // ── Niet-gebundeld: 4 kolommen T1-♀ | T1-♂ | T2-♀ | T2-♂ ──────────────
  function renderNietGebundeldBody() {
    const kolommen: React.ReactNode[] = [];
    const totaal = teams.length * 2; // 2 kolommen per team
    let kolomIndex = 0;

    for (const team of teams) {
      const teamNaam = team.alias ?? team.naam;

      kolommen.push(
        <SpelerKolom
          key={`${team.id}-v`}
          spelers={team.spelersDames}
          geslacht="V"
          teamId={team.id}
          teamNaam={teamNaam}
          kolomLabel={zoom === "detail" ? `${teamNaam} ♀` : undefined}
          zoom={zoom}
          isLaatste={kolomIndex === totaal - 1}
          onClick={onSpelerClick}
          onDrop={(data) => handleDropOpKolom(data, team.id)}
        />
      );
      kolomIndex++;

      kolommen.push(
        <SpelerKolom
          key={`${team.id}-m`}
          spelers={team.spelersHeren}
          geslacht="M"
          teamId={team.id}
          teamNaam={teamNaam}
          kolomLabel={zoom === "detail" ? `${teamNaam} ♂` : undefined}
          zoom={zoom}
          isLaatste={kolomIndex === totaal - 1}
          onClick={onSpelerClick}
          onDrop={(data) => handleDropOpKolom(data, team.id)}
        />
      );
      kolomIndex++;
    }

    return kolommen;
  }

  // ── Gebundeld: 4 kolommen ♀ | ♀ | ♂ | ♂ ─────────────────────────────────
  // Spelers in gebundelde selectie zijn nog niet aan een team toegewezen —
  // toon ze daarom verdeeld over 2 dame-kolommen + 2 heer-kolommen (zelfde
  // totale breedte als ongebundeld). Geen team-scheiding zichtbaar.
  // Backward-compat: fallback naar team-spelers als groep.gedeeldeDames/Heren leeg.
  function renderGebundeldBody() {
    const alleDames =
      groep.gedeeldeDames.length > 0 ? groep.gedeeldeDames : teams.flatMap((t) => t.spelersDames);
    const alleHeren =
      groep.gedeeldeHeren.length > 0 ? groep.gedeeldeHeren : teams.flatMap((t) => t.spelersHeren);

    const damesHelft = Math.ceil(alleDames.length / 2);
    const damesK1 = alleDames.slice(0, damesHelft);
    const damesK2 = alleDames.slice(damesHelft);
    const herenHelft = Math.ceil(alleHeren.length / 2);
    const herenK1 = alleHeren.slice(0, herenHelft);
    const herenK2 = alleHeren.slice(herenHelft);

    const bundelLabel = teams.map((t) => t.alias ?? t.naam).join(" & ");

    return (
      <>
        <SpelerKolom
          spelers={damesK1}
          geslacht="V"
          teamId={primaireTeamId}
          teamNaam={bundelLabel}
          zoom={zoom}
          isLaatste={false}
          onClick={onSpelerClick}
          onDrop={(data) => handleDropOpKolom(data, primaireTeamId)}
        />
        <SpelerKolom
          spelers={damesK2}
          geslacht="V"
          teamId={primaireTeamId}
          teamNaam={bundelLabel}
          zoom={zoom}
          isLaatste={false}
          onClick={onSpelerClick}
          onDrop={(data) => handleDropOpKolom(data, primaireTeamId)}
        />
        <SpelerKolom
          spelers={herenK1}
          geslacht="M"
          teamId={primaireTeamId}
          teamNaam={bundelLabel}
          zoom={zoom}
          isLaatste={false}
          onClick={onSpelerClick}
          onDrop={(data) => handleDropOpKolom(data, primaireTeamId)}
        />
        <SpelerKolom
          spelers={herenK2}
          geslacht="M"
          teamId={primaireTeamId}
          teamNaam={bundelLabel}
          zoom={zoom}
          isLaatste={true}
          onClick={onSpelerClick}
          onDrop={(data) => handleDropOpKolom(data, primaireTeamId)}
        />
      </>
    );
  }

  return (
    <div className="kaart-wrap">
      <div
        ref={dropRef}
        className={cx("selectie-kaart", klasse, groep.gebundeld && "gebundeld")}
        data-testid={`selectie-kaart-${groep.id}`}
        style={{
          display: "flex",
          flexDirection: "column",
          background: "var(--surface-card)",
          border: isOver ? "1.5px solid var(--val-ok)" : "1.5px solid var(--selectie-border)",
          borderRadius: "var(--team-card-radius)",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          boxShadow: isOver ? "0 0 0 2px var(--val-ok)" : "var(--selectie-frame-shadow)",
          width: Math.max(720, teams.length * 360),
        }}
      >
        {/* Gekleurde accent-band links */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "var(--team-band-width)",
            background: "var(--selectie-accent)",
            zIndex: 1,
          }}
        />

        {/* Header */}
        <SelectieKaartHeader groep={groep} teams={teams} onClick={() => onHeaderClick(groep.id)} />

        {/* Team-headers knoppen (niet-gebundeld): klikbaar per team */}
        {!groep.gebundeld && teams.length > 0 && (
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-light)",
              background: "rgba(255,255,255,.01)",
            }}
          >
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTeamHeaderClick(team.id);
                }}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "none",
                  borderRight: "1px solid var(--border-light)",
                  cursor: "pointer",
                  textAlign: "center",
                  fontFamily: "inherit",
                  letterSpacing: "0.04em",
                }}
                title={`Open ${team.alias ?? team.naam}`}
              >
                {team.alias ?? team.naam}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div
          className="sk-body"
          style={{
            flex: 1,
            display: "flex",
            gap: 1,
            background: "var(--border-light)",
            minHeight: 280,
            overflow: "hidden",
          }}
        >
          {groep.gebundeld ? renderGebundeldBody() : renderNietGebundeldBody()}
        </div>

        {/* Footer: gecombineerde staf */}
        <SelectieKaartFooter teams={teams} onStafClick={onStafClick} />
      </div>

      {/* Kaart-label */}
      <div className="kaart-wrap-label">{groep.naam ?? "Selectie"}</div>
    </div>
  );
}
