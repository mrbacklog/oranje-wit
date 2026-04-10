// apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
"use client";
import { useState } from "react";
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
// Elke kolom is 160px breed. Aantal kolommen bepaalt kaartbreedte:
//   viertal  → 1 kolom  → 160px  (dames + heren gestapeld)
//   achtal   → 2 kolommen → 320px (dames | heren naast elkaar)
//   selectie → 4 kolommen → 640px (dam1 | her1 | dam2 | her2)
// Dropzone: altijd 8 × SPELER_RIJ_HOOGTE (= 320px) per kolom.

export const KOLOM_BREEDTE = 160;

const KAART_BREEDTE: Record<KaartFormaat, number> = {
  viertal: KOLOM_BREEDTE * 1, // 160
  achtal: KOLOM_BREEDTE * 2, // 320
  selectie: KOLOM_BREEDTE * 4, // 640
};

const HEADER_HOOGTE = 34;
const FOOTER_HOOGTE = 26;
const MIN_DROPZONE = 8 * SPELER_RIJ_HOOGTE; // 320px — 8 spelers × 40px

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
  onToggleBundeling?: (selectieGroepId: string, gebundeld: boolean) => void;
  onTitelKlik?: (teamId: string) => void;
}

export function TeamKaart({
  team,
  zoomLevel,
  showScores,
  onOpenTeamDrawer,
  onDropSpeler,
  onHeaderMouseDown,
  onSpelerClick,
  partnerTeam,
  onDropSpelerOpSelectie,
  onToggleBundeling,
  onTitelKlik,
}: TeamKaartProps) {
  const breedte = KAART_BREEDTE[team.formaat];
  const isSelectie = team.formaat === "selectie" && !!partnerTeam;
  const selectieLabel = isSelectie
    ? team.selectieNaam || `${team.naam} ↔ ${partnerTeam!.naam}`
    : team.naam;

  const [dropOverGeslacht, setDropOverGeslacht] = useState<"V" | "M" | null>(null);

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
    if (data.vanTeamId === team.id) return;
    onDropSpeler(data.speler, data.vanTeamId, data.speler.geslacht);
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
        border: "1px solid var(--border-0)",
        borderRadius: "var(--card-radius)",
        boxShadow: "var(--sh-card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "default",
        animation: "fadeUp 250ms ease both",
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
          gap: 6,
          padding: "0 8px 0 14px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
          cursor: "grab",
        }}
      >
        <div
          onClick={() => onTitelKlik?.(team.id)}
          style={{
            fontSize: 13,
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
        <div style={{ display: "flex", gap: 3 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 5px",
              borderRadius: 4,
              background: "rgba(236,72,153,.12)",
              color: "var(--pink)",
            }}
          >
            ♀ {team.dames.length}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 5px",
              borderRadius: 4,
              background: "rgba(96,165,250,.12)",
              color: "var(--blue)",
            }}
          >
            ♂ {team.heren.length}
          </span>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenTeamDrawer(team.id);
          }}
          title="Team details"
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            flexShrink: 0,
            background: VAL_KLEUR[team.validatieStatus],
            boxShadow: `0 0 4px 1px ${VAL_KLEUR[team.validatieStatus]}50`,
            cursor: "pointer",
          }}
        />
        {isSelectie && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBundeling?.(team.selectieGroepId!, !team.gebundeld);
            }}
            title={team.gebundeld ? "Ontbundelen" : "Bundelen"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: team.gebundeld ? "var(--accent)" : "var(--text-3)",
              padding: "2px 4px",
            }}
          >
            {team.gebundeld ? "♀♂" : "⊞"}
          </button>
        )}
      </div>

      {/* ── DROPZONE ───────────────────────────────────────────────────── */}
      {isSelectie && team.gebundeld ? (
        <SelectieBundelDropzone
          team={team}
          partnerTeam={partnerTeam!}
          zoomLevel={zoomLevel}
          onSpelerClick={onSpelerClick}
          onDropSpelerOpSelectie={onDropSpelerOpSelectie}
        />
      ) : team.formaat === "viertal" ? (
        <ViertalDropzone
          team={team}
          zoomLevel={zoomLevel}
          dropOverGeslacht={dropOverGeslacht}
          onDragOver={handleDragOver}
          onDragLeave={() => setDropOverGeslacht(null)}
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
          gap: 6,
          padding: "0 8px 0 14px",
          borderTop: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        {showScores && team.ussScore !== null && (
          <div style={{ fontSize: 10, color: "var(--text-3)" }}>
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
              gap: 3,
              fontSize: 10,
              color: "var(--warn)",
              background: "rgba(234,179,8,.08)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            ⚠ {team.validatieCount}
          </div>
        )}
        <div style={{ flex: 1 }} />
        {team.gemiddeldeLeeftijd !== null && (
          <div style={{ fontSize: 10, color: "var(--text-3)" }}>
            Gem.{" "}
            <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
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
      `}</style>
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
      <div style={{ minHeight: MIN_DROPZONE, display: "flex", flexDirection: "column" }}>
        {spelers.map((sp) => (
          <TeamKaartSpelerRij
            key={sp.id}
            spelerInTeam={sp}
            teamId={teamId}
            selectieGroepId={selectieGroepId}
            zoomLevel={zoomLevel}
            onSpelerClick={onSpelerClick}
          />
        ))}
      </div>
    </div>
  );
}

// ── Viertal dropzone: 1 kolom, dames + heren gestapeld ─────────────────────

function ViertalDropzone({
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
    <div style={{ display: "flex", flexDirection: "column" }}>
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
        borderRight={false}
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

// ── Selectie gebundeld: 4 kolommen (dam1 | her1 | dam2 | her2) ─────────────

function SelectieBundelDropzone({
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

  const cols = [
    {
      id: "dam1",
      label: `♀ ${team.naam}`,
      kleur: "V" as const,
      spelers: team.selectieDames,
      teamId: team.id,
    },
    {
      id: "her1",
      label: `♂ ${team.naam}`,
      kleur: "M" as const,
      spelers: team.selectieHeren,
      teamId: team.id,
    },
    {
      id: "dam2",
      label: `♀ ${partnerTeam.naam}`,
      kleur: "V" as const,
      spelers: partnerTeam.selectieDames,
      teamId: partnerTeam.id,
    },
    {
      id: "her2",
      label: `♂ ${partnerTeam.naam}`,
      kleur: "M" as const,
      spelers: partnerTeam.selectieHeren,
      teamId: partnerTeam.id,
    },
  ];

  return (
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
  );
}
