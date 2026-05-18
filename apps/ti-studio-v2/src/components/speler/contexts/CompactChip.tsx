"use client";

import type { SpelerStatus, WerkitemStatus } from "@oranje-wit/database";
import { MemoCorner } from "../primitives/MemoCorner";
import { formatSpelerNaam } from "@/lib/format/speler";
import { useWerkbordDraggable, type DragBron } from "@/app/(app)/(studio)/indeling/_components/hooks/useWerkbordDraggable";

// ── Leeftijdscategorie → CSS-var ─────────────────────────────────────────────

type LeeftijdCategorie =
  | "kangoeroe"
  | "blauw"
  | "groen"
  | "geel"
  | "oranje"
  | "rood"
  | "senior";

function catKleurVar(categorie: LeeftijdCategorie): string {
  switch (categorie) {
    case "kangoeroe":
      return "var(--cat-kangoeroe)";
    case "blauw":
      return "var(--cat-blauw)";
    case "groen":
      return "var(--cat-groen)";
    case "geel":
      return "var(--cat-geel)";
    case "oranje":
      return "var(--cat-oranje)";
    case "rood":
      return "var(--cat-rood)";
    case "senior":
      return "var(--cat-senior)";
  }
}

// ── Status-helpers ───────────────────────────────────────────────────────────

function statusKleur(status: SpelerStatus | string): string {
  switch (status) {
    case "NIEUW_POTENTIEEL":
    case "NIEUW_DEFINITIEF":
      return "var(--status-nieuw-outline)";
    case "TWIJFELT":
    case "GEBLESSEERD":
      return "var(--status-twijfelt-outline)";
    case "GAAT_STOPPEN":
    case "GESTOPT":
    case "RECREANT":
    case "NIET_SPELEND":
      return "var(--status-stopt-outline)";
    case "ALGEMEEN_RESERVE":
      return "var(--status-ar-outline)";
    default:
      return "var(--status-beschikbaar-outline)";
  }
}

function statusKlasse(status: SpelerStatus | string): string {
  switch (status) {
    case "NIEUW_POTENTIEEL":
    case "NIEUW_DEFINITIEF":
      return "st-nieuw";
    case "TWIJFELT":
    case "GEBLESSEERD":
      return "st-twijfelt";
    case "GAAT_STOPPEN":
    case "GESTOPT":
    case "RECREANT":
    case "NIET_SPELEND":
      return "st-stopt";
    case "ALGEMEEN_RESERVE":
      return "st-ar";
    default:
      return "st-beschikbaar";
  }
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface CompactChipProps {
  speler: {
    relCode: string;
    roepnaam: string;
    tussenvoegsel?: string | null;
    achternaam: string;
    geslacht: "M" | "V";
    leeftijdscategorie: LeeftijdCategorie;
    status: SpelerStatus | string;
    isNieuw: boolean;
    memoStatus?: WerkitemStatus | null;
  };
  /** DragBron — standaard "spelerpool", team-context geeft `team-${teamId}` */
  dragBron?: DragBron;
  /** Als false: niet draggable (bijv. AR-spelers) */
  draggable?: boolean;
  onClick?: () => void;
  onMemoClick?: () => void;
}

// ── Nieuw-sparkle SVG ─────────────────────────────────────────────────────────

function NieuwSparkle() {
  return (
    <span
      className="mini-icon sparkle"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 12,
        height: 12,
        marginLeft: -1,
        flexShrink: 0,
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))",
      }}
      aria-hidden="true"
    >
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        style={{ display: "block" }}
      >
        <path d="M12 1l2 9 9 2-9 2-2 9-2-9-9-2 9-2z" fill="#ff6b00" />
      </svg>
    </span>
  );
}

// ── CompactChip ──────────────────────────────────────────────────────────────

export function CompactChip({
  speler,
  dragBron = "spelerpool",
  draggable: draggableProp = true,
  onClick,
  onMemoClick,
}: CompactChipProps) {
  const isAR = speler.status === "ALGEMEEN_RESERVE";
  const isStopt =
    speler.status === "GAAT_STOPPEN" ||
    speler.status === "GESTOPT" ||
    speler.status === "RECREANT" ||
    speler.status === "NIET_SPELEND";

  const effectiefDraggable = draggableProp && !isAR;

  const { ref: dragRef, isDragging } = useWerkbordDraggable({
    rel_code: speler.relCode,
    bron: dragBron,
    disabled: !effectiefDraggable,
  });

  const naam = formatSpelerNaam(speler, "compact") as string;
  const stKleur = statusKleur(speler.status);
  const stKlasse = statusKlasse(speler.status);
  const isVrouw = speler.geslacht === "V";
  const leeftijdKleur = catKleurVar(speler.leeftijdscategorie);
  const heeftMemo =
    speler.memoStatus &&
    speler.memoStatus !== "GEARCHIVEERD";

  return (
    <div
      ref={dragRef}
      className={`compact-chip${isVrouw ? " vrouw" : ""} ${stKlasse}`}
      data-testid={`speler-card-${speler.relCode}`}
      style={
        {
          "--status-color": stKleur,
          position: "relative",
          display: "inline-flex",
          alignItems: "stretch",
          height: 34,
          background: "transparent",
          border: `1.5px solid ${stKleur}`,
          borderRadius: 6,
          overflow: "visible",
          cursor: effectiefDraggable
            ? isDragging
              ? "grabbing"
              : "grab"
            : onClick
              ? "pointer"
              : "default",
          opacity: isDragging ? 0.4 : 1,
          flexShrink: 0,
        } as React.CSSProperties
      }
      onClick={onClick}
      title={naam}
    >
      {/* Memo-corner linksboven */}
      {heeftMemo && (
        <MemoCorner
          status={speler.memoStatus as WerkitemStatus}
          size="compact"
          onClick={onMemoClick ?? undefined}
        />
      )}

      {/* Inner: sexe-dot + (nieuw-sparkle) + naam */}
      <div
        className="inner"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "0 10px 0 6px",
        }}
      >
        {/* Sexe-vierkant 8×8 */}
        <span
          className="g-dot"
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: isVrouw ? "var(--sexe-v)" : "var(--sexe-h)",
            flexShrink: 0,
          }}
        />

        {/* Nieuw-lid sparkle — direct na sexe-dot */}
        {speler.isNieuw && <NieuwSparkle />}

        {/* Naam */}
        <span
          className="nm"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isAR ? "#a8a8ad" : "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: isStopt ? "line-through" : undefined,
            opacity: isStopt ? 0.7 : 1,
          }}
        >
          {naam}
        </span>
      </div>

      {/* Leeftijdsbar: 5px verticaal, rechts in chip */}
      <div
        className="leeft-bar"
        style={{
          width: 5,
          background: leeftijdKleur,
          flexShrink: 0,
          borderRadius: "0 4px 4px 0",
        }}
      />
    </div>
  );
}
