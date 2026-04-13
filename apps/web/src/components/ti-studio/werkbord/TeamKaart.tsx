// apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import "./tokens.css";
import { TeamKaartSpelerRij, SPELER_RIJ_HOOGTE } from "./TeamKaartSpelerRij";
import type {
  WerkbordTeam,
  WerkbordSpeler,
  WerkbordSpelerInTeam,
  KaartFormaat,
  ZoomLevel,
} from "./types";

// ── Kaartverhoudingen ───────────────────────────────────────────────────────
// Elke kolom is 180px breed. Aantal kolommen bepaalt kaartbreedte:
//   viertal  → 1 kolom  → 180px  (dames + heren gestapeld)
//   achtal   → 2 kolommen → 360px (dames | heren naast elkaar)
//   selectie → 4 kolommen → 720px (dam1 | her1 | dam2 | her2)
// Dropzone: altijd 8 × SPELER_RIJ_HOOGTE (= 320px) per kolom.

export const KOLOM_BREEDTE = 180;

const KAART_BREEDTE: Record<KaartFormaat, number> = {
  viertal: KOLOM_BREEDTE * 1, // 180
  achtal: KOLOM_BREEDTE * 2, // 360
  selectie: KOLOM_BREEDTE * 4, // 720
};

const HEADER_HOOGTE = 85; // was 34 — 2,5× vergroot voor meer ruimte
const FOOTER_HOOGTE = 65; // was 26 — 2,5× vergroot voor meer ruimte
const MIN_DROPZONE = 8 * SPELER_RIJ_HOOGTE; // 320px — 8 spelers × 40px
const MIN_DROPZONE_VIERTAL = 3 * SPELER_RIJ_HOOGTE; // 120px — viertal max 2 per sectie

const KNKV_KLEUR: Record<string, string> = {
  blauw: "var(--cat-blauw)",
  groen: "var(--cat-groen)",
  geel: "var(--cat-geel)",
  oranje: "var(--cat-oranje)",
  rood: "var(--cat-rood)",
  senior: "var(--cat-senior)",
};

const VAL_KLEUR: Record<string, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  err: "var(--err)",
};

interface TeamKaartProps {
  team: WerkbordTeam;
  zoomLevel: ZoomLevel;
  showScores: boolean;
  isDragging?: boolean;
  openMemoCount?: number;
  onOpenTeamDrawer: (teamId: string) => void;
  onDropSpeler: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    naarGeslacht: "V" | "M"
  ) => void;
  onHeaderMouseDown: (e: React.MouseEvent, teamId: string) => void;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
  partnerTeam?: WerkbordTeam | null;
  onDropSpelerOpSelectie?: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    vanSelectieGroepId: string | null,
    geslacht: "V" | "M"
  ) => void;
  onTitelKlik?: (teamId: string) => void;
}

export function TeamKaart({
  team,
  zoomLevel,
  showScores,
  isDragging,
  openMemoCount = 0,
  onOpenTeamDrawer,
  onDropSpeler,
  onHeaderMouseDown,
  onSpelerClick,
  partnerTeam,
  onDropSpelerOpSelectie,
  onTitelKlik,
}: TeamKaartProps) {
  const breedte = KAART_BREEDTE[team.formaat];
  const isSelectieGebundeld = team.formaat === "selectie" && team.gebundeld;
  const isSelectie = team.formaat === "selectie" && !!partnerTeam;
  const selectieLabel =
    isSelectieGebundeld || isSelectie
      ? team.selectieNaam || (partnerTeam ? `${team.naam} ↔ ${partnerTeam.naam}` : team.naam)
      : team.naam;

  const [dropOverGeslacht, setDropOverGeslacht] = useState<"V" | "M" | null>(null);
  const [isLanding, setIsLanding] = useState(false);
  const wasLiftedRef = useRef(false);

  useEffect(() => {
    if (!isDragging && wasLiftedRef.current) {
      setIsLanding(true);
      const t = setTimeout(() => setIsLanding(false), 650);
      return () => clearTimeout(t);
    }
    wasLiftedRef.current = isDragging ?? false;
  }, [isDragging]);

  function handleDragOver(e: React.DragEvent, geslacht: "V" | "M") {
    if (!e.dataTransfer.types.includes("speler")) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropOverGeslacht(geslacht);
  }

  function handleDrop(e: React.DragEvent, _zoneGeslacht: "V" | "M") {
    e.preventDefault();
    e.stopPropagation();
    setDropOverGeslacht(null);
    const raw = e.dataTransfer.getData("speler");
    if (!raw) return;
    const data = JSON.parse(raw) as { speler: WerkbordSpeler; vanTeamId: string | null };
    // Als de speler al in een team zit (vanuit pool gedropt), gebruik teamId als effectieve bron
    const effectiefVanTeamId = data.vanTeamId ?? data.speler.teamId;
    if (effectiefVanTeamId === team.id) return;
    onDropSpeler(data.speler, effectiefVanTeamId, data.speler.geslacht);
  }

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        left: team.canvasX,
        top: team.canvasY,
        pointerEvents: "auto",
        width: breedte,
        height: "auto",
        background: "var(--bg-1)",
        border: `1px solid ${isDragging ? "rgba(255,107,0,.3)" : "var(--border-0)"}`,
        borderRadius: "var(--card-radius)",
        boxShadow: isDragging ? "var(--sh-lifted)" : "var(--sh-card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "default",
        transform: isDragging ? "scale(1.04) translateY(-10px)" : "none",
        transition: isDragging
          ? "transform 280ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 280ms ease, border-color 200ms ease"
          : undefined,
        animation: isLanding
          ? "dropLand 650ms cubic-bezier(0.16,1,0.3,1) both"
          : "fadeUp 250ms ease both",
        zIndex: isDragging ? 100 : undefined,
      }}
    >
      {/* Kleurband links — 4px */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: KNKV_KLEUR[team.kleur] ?? "var(--cat-senior)",
        }}
      />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          onHeaderMouseDown(e, team.id);
        }}
        style={{
          height: HEADER_HOOGTE,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px 0 18px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
          cursor: "grab",
        }}
      >
        <div
          onClick={() => onTitelKlik?.(team.id)}
          style={{
            fontSize: zoomLevel === "compact" ? 22 : 13,
            fontWeight: 700,
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            cursor: onTitelKlik ? "pointer" : "inherit",
          }}
        >
          {selectieLabel}
        </div>
        {openMemoCount > 0 && (
          <span
            style={{
              fontSize: 10,
              color: "var(--accent)",
              fontWeight: 700,
              lineHeight: 1,
              flexShrink: 0,
            }}
            title={`${openMemoCount} open memo${openMemoCount !== 1 ? "'s" : ""}`}
          >
            ▲
          </span>
        )}
        {zoomLevel !== "compact" && (
          <div style={{ display: "flex", gap: 3 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 13,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(236,72,153,.12)",
                color: "var(--pink)",
              }}
            >
              ♀{" "}
              {isSelectieGebundeld
                ? team.selectieDames.length
                : isSelectie && partnerTeam
                  ? team.dames.length + partnerTeam.dames.length
                  : team.dames.length}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 13,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(96,165,250,.12)",
                color: "var(--blue)",
              }}
            >
              ♂{" "}
              {isSelectieGebundeld
                ? team.selectieHeren.length
                : isSelectie && partnerTeam
                  ? team.heren.length + partnerTeam.heren.length
                  : team.heren.length}
            </span>
          </div>
        )}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenTeamDrawer(team.id);
          }}
          title="Team details"
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            flexShrink: 0,
            background: VAL_KLEUR[team.validatieStatus],
            boxShadow: `0 0 6px 1px ${VAL_KLEUR[team.validatieStatus]}50`,
            cursor: "pointer",
          }}
        />
      </div>

      {/* ── DROPZONE ───────────────────────────────────────────────────── */}
      {isSelectieGebundeld ? (
        // Gebundeld: 2 dame-kolommen | 2 heren-kolommen — altijd 720px breed
        <SelectieBundelDropzone
          team={team}
          partnerTeam={partnerTeam}
          zoomLevel={zoomLevel}
          onSpelerClick={onSpelerClick}
          onDropSpelerOpSelectie={onDropSpelerOpSelectie}
        />
      ) : isSelectie && partnerTeam ? (
        // Ongebundeld: dam1 | dam2 | her1 | her2 (per team)
        <SelectieGeheelDropzone
          team={team}
          partnerTeam={partnerTeam}
          zoomLevel={zoomLevel}
          onSpelerClick={onSpelerClick}
          onDropSpelerOpSelectie={onDropSpelerOpSelectie}
        />
      ) : team.formaat === "viertal" ? (
        <ViertalDropzone
          team={team}
          zoomLevel={zoomLevel}
          onDrop={handleDrop}
          onSpelerClick={onSpelerClick}
        />
      ) : (
        <AchtalDropzone
          team={team}
          zoomLevel={zoomLevel}
          dropOverGeslacht={dropOverGeslacht}
          onDragOver={handleDragOver}
          onDragLeave={() => setDropOverGeslacht(null)}
          onDrop={handleDrop}
          onSpelerClick={onSpelerClick}
        />
      )}

      {/* ── STAF ───────────────────────────────────────────────────────── */}
      {team.staf.length > 0 && (
        <div
          style={{ borderTop: "1px solid var(--border-0)", background: "rgba(255,255,255,.015)" }}
        >
          {team.staf.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 8px 0 14px",
                height: 20,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2,
                  background: "var(--purple)",
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 9.5,
                  color: "rgba(168,85,247,.85)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                }}
              >
                {s.naam} — {s.rol}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <div
        style={{
          height: FOOTER_HOOGTE,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px 0 18px",
          borderTop: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        {showScores && team.ussScore !== null && (
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>
            USS{" "}
            <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
              {team.ussScore.toFixed(2)}
            </span>
          </div>
        )}
        {team.validatieCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              color: "var(--warn)",
              background: "rgba(234,179,8,.08)",
              padding: "4px 8px",
              borderRadius: 6,
            }}
          >
            ⚠ {team.validatieCount}
          </div>
        )}
        {(team.werkitems?.some((w) => w.status === "OPEN" || w.status === "IN_BESPREKING") ??
          false) && (
          <div
            style={{
              fontSize: 13,
              color: "var(--accent)",
              lineHeight: 1,
            }}
            title="Open werkitems"
          >
            ▲
          </div>
        )}
        <div style={{ flex: 1 }} />
        {team.gemiddeldeLeeftijd !== null && (
          <div style={{ fontSize: zoomLevel === "compact" ? 26 : 13, color: "var(--text-3)" }}>
            {zoomLevel !== "compact" && "Gem. "}
            <span style={{ color: "var(--text-2)", fontWeight: 700 }}>
              {team.gemiddeldeLeeftijd.toFixed(1)}j
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropLand {
          from {
            transform: scale(1.04) translateY(-10px);
            box-shadow: 0 10px 28px rgba(0,0,0,.65), 0 32px 72px rgba(0,0,0,.5), 0 0 0 1px rgba(255,107,0,.2);
          }
          to {
            transform: scale(1) translateY(0);
            box-shadow: 0 2px 4px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.35);
          }
        }
      `}</style>
    </div>
  );
}

// ── Selectie als geheel: 4 kolommen (dam1 | dam2 | her1 | her2) ───────────
// Spelers zijn nog niet per team ingedeeld — kolommen gegroepeerd op geslacht.

function SelectieGeheelDropzone({
  team,
  partnerTeam,
  zoomLevel,
  onSpelerClick,
  onDropSpelerOpSelectie,
}: {
  team: WerkbordTeam;
  partnerTeam: WerkbordTeam;
  zoomLevel: ZoomLevel;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
  onDropSpelerOpSelectie?: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    vanSelectieGroepId: string | null,
    geslacht: "V" | "M"
  ) => void;
}) {
  const [dropOver, setDropOver] = useState<string | null>(null);

  function makeHandlers(col: string, geslacht: "V" | "M") {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setDropOver(col);
      },
      onDragLeave: () => setDropOver(null),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDropOver(null);
        try {
          const data = JSON.parse(e.dataTransfer.getData("speler")) as {
            speler: WerkbordSpeler;
            vanTeamId: string | null;
            vanSelectieGroepId: string | null;
          };
          onDropSpelerOpSelectie?.(data.speler, data.vanTeamId, data.vanSelectieGroepId, geslacht);
        } catch {
          /* ignore */
        }
      },
    };
  }

  // Volgorde: dam1 | her1 | dam2 | her2 — team eerst, geslacht daarna
  const cols = [
    {
      id: "dam1",
      label: `♀ ${team.naam}`,
      kleur: "V" as const,
      spelers: team.dames,
      teamId: team.id,
    },
    {
      id: "her1",
      label: `♂ ${team.naam}`,
      kleur: "M" as const,
      spelers: team.heren,
      teamId: team.id,
    },
    {
      id: "dam2",
      label: `♀ ${partnerTeam.naam}`,
      kleur: "V" as const,
      spelers: partnerTeam.dames,
      teamId: partnerTeam.id,
    },
    {
      id: "her2",
      label: `♂ ${partnerTeam.naam}`,
      kleur: "M" as const,
      spelers: partnerTeam.heren,
      teamId: partnerTeam.id,
    },
  ];

  const teamLabelStijl: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    color: "var(--text-3)",
    padding: "3px 8px",
    borderBottom: "1px solid var(--border-0)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Teamnamen boven de kolommen: team links | partnerTeam rechts */}
      {zoomLevel !== "compact" && (
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-0)" }}>
          <div
            style={{
              ...teamLabelStijl,
              borderBottom: "none",
              borderRight: "1px solid var(--border-0)",
            }}
          >
            {team.naam}
          </div>
          <div style={{ ...teamLabelStijl, borderBottom: "none", textAlign: "right" }}>
            {partnerTeam.naam}
          </div>
        </div>
      )}
      <div style={{ display: "flex" }}>
        {cols.map((col, i) => {
          const h = makeHandlers(col.id, col.kleur);
          return (
            <DropzoneKolom
              key={col.id}
              label={col.label}
              kleur={col.kleur}
              spelers={col.spelers}
              teamId={col.teamId}
              selectieGroepId={team.selectieGroepId}
              zoomLevel={zoomLevel}
              dropActief={dropOver === col.id}
              onDragOver={h.onDragOver}
              onDragLeave={h.onDragLeave}
              onDrop={h.onDrop}
              onSpelerClick={onSpelerClick}
              borderRight={i < cols.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Dropzone-kolom component ────────────────────────────────────────────────

interface KolomProps {
  label: string;
  kleur: "V" | "M";
  spelers: WerkbordSpelerInTeam[];
  teamId: string;
  selectieGroepId?: string | null;
  zoomLevel: ZoomLevel;
  dropActief: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
  borderRight?: boolean;
}

function DropzoneKolom({
  label,
  kleur,
  spelers,
  teamId,
  selectieGroepId,
  zoomLevel,
  dropActief,
  onDragOver,
  onDragLeave,
  onDrop,
  onSpelerClick,
  borderRight = false,
}: KolomProps) {
  const labelKleur = kleur === "V" ? "rgba(236,72,153,.65)" : "rgba(96,165,250,.65)";
  const dropBg = kleur === "V" ? "rgba(236,72,153,.07)" : "rgba(96,165,250,.07)";
  const isCompact = zoomLevel === "compact";

  // Altijd gesorteerd op voornaam
  const gesorteerd = [...spelers].sort((a, b) =>
    a.speler.roepnaam.localeCompare(b.speler.roepnaam, "nl")
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        borderRight: borderRight ? "1px solid var(--border-0)" : "none",
        background: dropActief ? dropBg : "transparent",
        transition: "background 120ms ease",
      }}
    >
      {/* Label: verborgen in compact of als label leeg is */}
      {!isCompact && label && (
        <div
          style={{
            fontSize: 8,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".6px",
            color: labelKleur,
            padding: "3px 8px 2px",
            borderBottom: "1px solid rgba(255,255,255,.04)",
            flexShrink: 0,
          }}
        >
          {label}
        </div>
      )}

      {/* Body: compacte chips of spelersrijen */}
      {isCompact && (
        <div
          style={{
            height: 20,
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            gap: 6,
            background: "rgba(255,255,255,.03)",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".3px",
              color: kleur === "V" ? "rgba(236,72,153,.75)" : "rgba(96,165,250,.75)",
            }}
          >
            {kleur === "V" ? "♀" : "♂"} {spelers.length}
          </span>
        </div>
      )}
      <div
        style={
          isCompact
            ? {
                minHeight: MIN_DROPZONE,
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                padding: "6px 6px",
                alignContent: "flex-start",
              }
            : { minHeight: MIN_DROPZONE, display: "flex", flexDirection: "column" }
        }
      >
        {gesorteerd.map((sp) => (
          <TeamKaartSpelerRij
            key={sp.id}
            spelerInTeam={sp}
            teamId={teamId}
            selectieGroepId={selectieGroepId}
            zoomLevel={zoomLevel}
            openMemoCount={sp.speler.openMemoCount}
            onSpelerClick={onSpelerClick}
          />
        ))}
      </div>
    </div>
  );
}

// ── Viertal dropzone: 1 gecombineerde zone, dames (V) eerst dan heren (M) ────
// Dynamische hoogte — geen vaste minHeight per sectie.

function ViertalDropzone({
  team,
  zoomLevel,
  onDrop,
  onSpelerClick,
}: {
  team: WerkbordTeam;
  zoomLevel: ZoomLevel;
  onDrop: (e: React.DragEvent, g: "V" | "M") => void;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
}) {
  const [dropOver, setDropOver] = useState(false);

  // Dames (V) eerst, alfabetisch; daarna heren (M), alfabetisch
  const allSpelers = [
    ...[...team.dames].sort((a, b) => a.speler.roepnaam.localeCompare(b.speler.roepnaam, "nl")),
    ...[...team.heren].sort((a, b) => a.speler.roepnaam.localeCompare(b.speler.roepnaam, "nl")),
  ];

  return (
    <div
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("speler")) return;
        e.preventDefault();
        setDropOver(true);
      }}
      onDragLeave={() => setDropOver(false)}
      onDrop={(e) => {
        setDropOver(false);
        onDrop(e, "V"); // geslacht wordt bepaald uit spelerdata in handleDrop
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: MIN_DROPZONE_VIERTAL * 2,
        background: dropOver ? "rgba(255,107,0,.06)" : "transparent",
        transition: "background 120ms ease",
      }}
    >
      {zoomLevel === "compact" && (
        <div
          style={{
            height: 20,
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            gap: 8,
            background: "rgba(255,255,255,.03)",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".3px",
              color: "rgba(236,72,153,.75)",
            }}
          >
            ♀ {team.dames.length}
          </span>
          <span
            style={{
              width: 1,
              height: 10,
              background: "rgba(255,255,255,.12)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".3px",
              color: "rgba(96,165,250,.75)",
            }}
          >
            ♂ {team.heren.length}
          </span>
        </div>
      )}
      <div
        style={
          zoomLevel === "compact"
            ? {
                minHeight: MIN_DROPZONE_VIERTAL * 2,
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                padding: "6px 6px",
                alignContent: "flex-start",
              }
            : { display: "flex", flexDirection: "column" }
        }
      >
        {allSpelers.map((sp) => (
          <TeamKaartSpelerRij
            key={sp.id}
            spelerInTeam={sp}
            teamId={team.id}
            zoomLevel={zoomLevel}
            openMemoCount={sp.speler.openMemoCount}
            onSpelerClick={onSpelerClick}
          />
        ))}
      </div>
    </div>
  );
}

// ── Achtal dropzone: 2 kolommen (dames | heren) ────────────────────────────

function AchtalDropzone({
  team,
  zoomLevel,
  dropOverGeslacht,
  onDragOver,
  onDragLeave,
  onDrop,
  onSpelerClick,
}: {
  team: WerkbordTeam;
  zoomLevel: ZoomLevel;
  dropOverGeslacht: "V" | "M" | null;
  onDragOver: (e: React.DragEvent, g: "V" | "M") => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, g: "V" | "M") => void;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
}) {
  return (
    <div style={{ display: "flex" }}>
      <DropzoneKolom
        label="Dames"
        kleur="V"
        spelers={team.dames}
        teamId={team.id}
        zoomLevel={zoomLevel}
        dropActief={dropOverGeslacht === "V"}
        onDragOver={(e) => onDragOver(e, "V")}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, "V")}
        onSpelerClick={onSpelerClick}
        borderRight={true}
      />
      <DropzoneKolom
        label="Heren"
        kleur="M"
        spelers={team.heren}
        teamId={team.id}
        zoomLevel={zoomLevel}
        dropActief={dropOverGeslacht === "M"}
        onDragOver={(e) => onDragOver(e, "M")}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, "M")}
        onSpelerClick={onSpelerClick}
        borderRight={false}
      />
    </div>
  );
}

// ── Selectie gebundeld: 2 kolommen compact, 4 kolommen normaal/detail ────────
// Normaal/detail: dames over 2 kolommen, heren over 2 kolommen (elk 180px).
// Compact: 2 kolommen met totaaltellers (♀ N | ♂ N).

function SelectieBundelDropzone({
  team,
  partnerTeam,
  zoomLevel,
  onSpelerClick,
  onDropSpelerOpSelectie,
}: {
  team: WerkbordTeam;
  partnerTeam?: WerkbordTeam | null;
  zoomLevel: ZoomLevel;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
  onDropSpelerOpSelectie?: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    vanSelectieGroepId: string | null,
    geslacht: "V" | "M"
  ) => void;
}) {
  const [dropOver, setDropOver] = useState<"V" | "M" | null>(null);

  function makeHandlers(geslacht: "V" | "M") {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setDropOver(geslacht);
      },
      onDragLeave: () => setDropOver(null),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDropOver(null);
        try {
          const data = JSON.parse(e.dataTransfer.getData("speler")) as {
            speler: WerkbordSpeler;
            vanTeamId: string | null;
            vanSelectieGroepId: string | null;
          };
          onDropSpelerOpSelectie?.(data.speler, data.vanTeamId, data.vanSelectieGroepId, geslacht);
        } catch {
          /* ignore */
        }
      },
    };
  }

  if (zoomLevel === "compact") {
    // Compact: 2 brede kolommen met totaaltellers
    const cols = [
      { id: "dames", label: "♀ Dames", kleur: "V" as const, spelers: team.selectieDames },
      { id: "heren", label: "♂ Heren", kleur: "M" as const, spelers: team.selectieHeren },
    ];
    return (
      <div style={{ display: "flex" }}>
        {cols.map((col, i) => {
          const h = makeHandlers(col.kleur);
          return (
            <DropzoneKolom
              key={col.id}
              label={col.label}
              kleur={col.kleur}
              spelers={col.spelers}
              teamId={team.id}
              selectieGroepId={team.selectieGroepId}
              zoomLevel={zoomLevel}
              dropActief={dropOver === col.kleur}
              onDragOver={h.onDragOver}
              onDragLeave={h.onDragLeave}
              onDrop={h.onDrop}
              onSpelerClick={onSpelerClick}
              borderRight={i === 0}
            />
          );
        })}
      </div>
    );
  }

  // Normaal/detail: 4 kolommen — dames gesplitst over 2, heren over 2
  const damesSorted = [...team.selectieDames].sort((a, b) =>
    a.speler.roepnaam.localeCompare(b.speler.roepnaam, "nl")
  );
  const herenSorted = [...team.selectieHeren].sort((a, b) =>
    a.speler.roepnaam.localeCompare(b.speler.roepnaam, "nl")
  );

  const cols4 = [
    {
      id: "dam-a",
      kleur: "V" as const,
      spelers: damesSorted.filter((_, i) => i % 2 === 0),
    },
    {
      id: "dam-b",
      kleur: "V" as const,
      spelers: damesSorted.filter((_, i) => i % 2 === 1),
    },
    {
      id: "her-a",
      kleur: "M" as const,
      spelers: herenSorted.filter((_, i) => i % 2 === 0),
    },
    {
      id: "her-b",
      kleur: "M" as const,
      spelers: herenSorted.filter((_, i) => i % 2 === 1),
    },
  ];

  const centerLabel = partnerTeam
    ? `${team.selectieNaam ?? team.naam} ↔ ${partnerTeam.naam}`
    : (team.selectieNaam ?? team.naam);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Beide teamnamen gecentreerd in het midden */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".5px",
          color: "var(--text-3)",
          padding: "3px 8px",
          borderBottom: "1px solid var(--border-0)",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {centerLabel}
      </div>
      {/* Geslachtsheader: ♀ over kolom 1+2, ♂ over kolom 3+4 */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-0)" }}>
        <div
          style={{
            flex: 2,
            fontSize: 8,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".6px",
            color: "rgba(236,72,153,.65)",
            padding: "3px 8px 2px",
            borderRight: "1px solid var(--border-0)",
          }}
        >
          ♀ Dames
        </div>
        <div
          style={{
            flex: 2,
            fontSize: 8,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".6px",
            color: "rgba(96,165,250,.65)",
            padding: "3px 8px 2px",
          }}
        >
          ♂ Heren
        </div>
      </div>
      <div style={{ display: "flex" }}>
        {cols4.map((col, i) => {
          const h = makeHandlers(col.kleur);
          return (
            <DropzoneKolom
              key={col.id}
              label=""
              kleur={col.kleur}
              spelers={col.spelers}
              teamId={team.id}
              selectieGroepId={team.selectieGroepId}
              zoomLevel={zoomLevel}
              dropActief={dropOver === col.kleur}
              onDragOver={h.onDragOver}
              onDragLeave={h.onDragLeave}
              onDrop={h.onDrop}
              onSpelerClick={onSpelerClick}
              borderRight={i < cols4.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
}
