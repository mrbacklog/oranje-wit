// apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import "./tokens.css";
import { TeamKaartSpelerRij, SPELER_RIJ_HOOGTE } from "./TeamKaartSpelerRij";
import { toonRol } from "@/components/staf/staf-koppel-types";
import { updateStafSortOrderInTeam } from "@/app/(protected)/personen/staf-actions";
import type {
  WerkbordTeam,
  WerkbordSpeler,
  WerkbordSpelerInTeam,
  WerkbordStafInTeam,
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

// Bouw de header-subtitle op basis van teamconfiguratie
function bouwSubtitel(team: WerkbordTeam): string {
  const kleurLabel = team.kleur !== "senior" ? team.kleur.toUpperCase() : null;
  if (team.teamCategorie === "SENIOREN") {
    return "SENIOREN · 19+";
  }
  if (team.teamCategorie === "A_CATEGORIE") {
    const niveau = team.niveau ?? afkortLeeftijdUitNaam(team.naam);
    if (kleurLabel && niveau) return `${kleurLabel} · ${niveau}`;
    if (niveau) return niveau;
    if (kleurLabel) return kleurLabel;
    return "A-CATEGORIE";
  }
  // B_CATEGORIE — jeugd (GEEL/BLAUW/GROEN)
  const leeftijd = afkortLeeftijdUitNaam(team.naam);
  if (kleurLabel && leeftijd) return `${kleurLabel} · ${leeftijd}`;
  if (kleurLabel) return kleurLabel;
  return "JEUGD";
}

/** Haal leeftijdsklasse-afkorting uit teamnaam: "OW C1-U17-1" → "U17" */
function afkortLeeftijdUitNaam(naam: string): string | null {
  const m = naam.match(/\b(U\d{2})\b/i);
  if (m) return m[1].toUpperCase();
  // Getal 8-9, 10-12 enz. als leeftijdsindicator in naam
  const bereik = naam.match(/\b(\d{1,2}[-–]\d{1,2})\b/);
  if (bereik) return bereik[1];
  return null;
}

interface TeamKaartProps {
  team: WerkbordTeam;
  zoomLevel: ZoomLevel;
  showScores: boolean;
  isDragging?: boolean;
  openMemoCount?: number;
  jNummer?: string | null;
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
  onDropSpelerOpTeamDirect?: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    naarTeamId: string,
    geslacht: "V" | "M"
  ) => void;
  onTitelKlik?: (teamId: string) => void;
  onStafClick?: (stafId: string) => void;
}

export function TeamKaart({
  team,
  zoomLevel,
  showScores,
  isDragging,
  openMemoCount = 0,
  jNummer,
  onOpenTeamDrawer,
  onDropSpeler,
  onHeaderMouseDown,
  onSpelerClick,
  partnerTeam,
  onDropSpelerOpSelectie,
  onDropSpelerOpTeamDirect,
  onTitelKlik,
  onStafClick,
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
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Categorie-driehoek rechtsboven — 56×56px, kleur uit team.kleur */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenTeamDrawer(team.id);
          }}
          title="Team details"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "0 56px 56px 0",
            borderColor: `transparent ${KNKV_KLEUR[team.kleur] ?? "var(--cat-senior)"} transparent transparent`,
            cursor: "pointer",
            zIndex: 3,
            pointerEvents: "auto",
          }}
        />

        {/* Naam + subtitle */}
        <div
          onClick={() => onTitelKlik?.(team.id)}
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            cursor: onTitelKlik ? "pointer" : "inherit",
          }}
        >
          <div
            style={{
              fontSize: zoomLevel === "compact" ? 22 : 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectieLabel}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 2,
              minWidth: 0,
            }}
          >
            {jNummer && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".05em",
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: "rgba(255,107,0,.15)",
                  color: "var(--accent)",
                  border: "1px solid rgba(255,107,0,.3)",
                  flexShrink: 0,
                  lineHeight: "14px",
                }}
                title={`J-nummer op basis van gemiddelde teamleeftijd: ${jNummer}`}
              >
                {jNummer}
              </span>
            )}
            {zoomLevel !== "compact" && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {bouwSubtitel(team)}
              </div>
            )}
          </div>
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
      </div>

      {/* ── DROPZONE ───────────────────────────────────────────────────── */}
      {isSelectieGebundeld ? (
        // Gebundeld: 2 dame-kolommen | 2 heren-kolommen — altijd 720px breed
        <SelectieBundelDropzone
          team={team}
          partnerTeam={partnerTeam}
          zoomLevel={zoomLevel}
          showScores={showScores}
          onSpelerClick={onSpelerClick}
          onDropSpelerOpSelectie={onDropSpelerOpSelectie}
        />
      ) : isSelectie && partnerTeam ? (
        // Ongebundeld: dam1 | her1 | dam2 | her2 (per team) — drops gaan naar specifiek team
        <SelectieGeheelDropzone
          team={team}
          partnerTeam={partnerTeam}
          zoomLevel={zoomLevel}
          showScores={showScores}
          onSpelerClick={onSpelerClick}
          onDropSpelerOpTeam={onDropSpelerOpTeamDirect}
        />
      ) : team.formaat === "viertal" ? (
        <ViertalDropzone
          team={team}
          zoomLevel={zoomLevel}
          showScores={showScores}
          onDrop={handleDrop}
          onSpelerClick={onSpelerClick}
        />
      ) : (
        <AchtalDropzone
          team={team}
          zoomLevel={zoomLevel}
          showScores={showScores}
          dropOverGeslacht={dropOverGeslacht}
          onDragOver={handleDragOver}
          onDragLeave={() => setDropOverGeslacht(null)}
          onDrop={handleDrop}
          onSpelerClick={onSpelerClick}
        />
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
        {/* Staf-icoon — altijd zichtbaar, vóór de warnings, op alle zooms */}
        <StafFooterIcoon
          staf={partnerTeam ? dedupeStaf([...team.staf, ...partnerTeam.staf]) : team.staf}
          teamId={team.id}
          onStafClick={onStafClick}
        />
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
        <div style={{ flex: 1, minWidth: 0 }} />
        {team.gemiddeldeLeeftijd !== null && (
          <div style={{ fontSize: zoomLevel === "compact" ? 26 : 13, color: "var(--text-3)" }}>
            {zoomLevel !== "compact" && "Gem. "}
            <span style={{ color: "var(--text-2)", fontWeight: 700 }}>
              {team.gemiddeldeLeeftijd.toFixed(2)}j
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

// ── Staf-icoon in de footer ─────────────────────────────────────────────────
// Trainer-icoon (zelfde als de staf-drawer toggle): grijs als er niemand
// gekoppeld is, groen + teller zodra er staf is. Hover toont de stafleden in
// een zwevend paneeltje (portal → blijft buiten de card-overflow en in beeld).

function dedupeStaf(staf: WerkbordStafInTeam[]): WerkbordStafInTeam[] {
  const gezien = new Set<string>();
  return staf.filter((s) => {
    if (gezien.has(s.stafId)) return false;
    gezien.add(s.stafId);
    return true;
  });
}

function TrainerIcoon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="9" r="3" />
      <path d="M7.5 6.5h9" />
      <path d="M9.5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" />
    </svg>
  );
}

function StafFooterIcoon({
  staf: initStaf,
  teamId,
  onStafClick,
}: {
  staf: WerkbordStafInTeam[];
  teamId: string;
  onStafClick?: (stafId: string) => void;
}) {
  const [staf, setStaf] = useState(initStaf);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const ankerRef = useRef<HTMLDivElement>(null);
  const paneelRef = useRef<HTMLDivElement>(null);
  const sluitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heeftStaf = staf.length > 0;
  const kanSorteren = staf.length > 1;

  const PANEEL_BREEDTE = kanSorteren ? 260 : 220;

  function berekenPos() {
    if (!ankerRef.current) return null;
    const r = ankerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const hoogte = 46 + staf.length * 32;
    let left = r.left + r.width / 2 - PANEEL_BREEDTE / 2;
    left = Math.max(8, Math.min(left, vw - PANEEL_BREEDTE - 8));
    let top = r.top - hoogte - 8;
    if (top < 8) top = Math.min(r.bottom + 8, vh - hoogte - 8);
    return { left, top };
  }

  function open() {
    if (sluitTimer.current) {
      clearTimeout(sluitTimer.current);
      sluitTimer.current = null;
    }
    if (!heeftStaf) return;
    setPos(berekenPos());
  }

  function planSluiten() {
    sluitTimer.current = setTimeout(() => setPos(null), 150);
  }

  function handleVolgorde(s: WerkbordStafInTeam, richting: "omhoog" | "omlaag") {
    const idx = staf.findIndex((x) => x.id === s.id);
    if (idx < 0) return;
    const swapIdx = richting === "omhoog" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= staf.length) return;
    // Wijs altijd expliciete unieke orders toe op basis van huidige positie,
    // zodat we niet afhankelijk zijn van de stored sortOrder-waarden.
    const genormaliseerd = staf.map((x, i) => ({ ...x, sortOrder: i }));
    const item = genormaliseerd[idx];
    const swap = genormaliseerd[swapIdx];
    const bijgewerkt = genormaliseerd
      .map((x) => {
        if (x.id === item.id) return { ...x, sortOrder: swapIdx };
        if (x.id === swap.id) return { ...x, sortOrder: idx };
        return x;
      })
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.naam.localeCompare(b.naam, "nl");
      });
    setStaf(bijgewerkt);
    startTransition(async () => {
      await Promise.all([
        updateStafSortOrderInTeam(item.stafId, teamId, swapIdx),
        updateStafSortOrderInTeam(swap.stafId, teamId, idx),
      ]);
    });
  }

  return (
    <>
      <div
        ref={ankerRef}
        onMouseEnter={open}
        onMouseLeave={planSluiten}
        title={
          heeftStaf
            ? `${staf.length} staflid${staf.length !== 1 ? "en" : ""}`
            : "Geen staf gekoppeld"
        }
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 26,
          borderRadius: 7,
          flexShrink: 0,
          cursor: heeftStaf ? "pointer" : "default",
          border: heeftStaf ? "1px solid rgba(34,197,94,.35)" : "1px solid var(--border-0)",
          background: heeftStaf ? "rgba(34,197,94,.10)" : "var(--bg-2)",
          color: heeftStaf ? "var(--ok)" : "var(--text-3)",
          opacity: heeftStaf ? 1 : 0.55,
          transition: "background 140ms ease, color 140ms ease, border-color 140ms ease",
        }}
      >
        <TrainerIcoon size={15} />
        {heeftStaf && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 9,
              background: "var(--ok)",
              color: "#06140a",
              fontSize: 10,
              fontWeight: 800,
              lineHeight: "16px",
              textAlign: "center",
              border: "2px solid var(--bg-1)",
            }}
          >
            {staf.length}
          </span>
        )}
      </div>

      {pos &&
        heeftStaf &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={paneelRef}
            onMouseEnter={() => {
              if (sluitTimer.current) {
                clearTimeout(sluitTimer.current);
                sluitTimer.current = null;
              }
            }}
            onMouseLeave={planSluiten}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              width: PANEEL_BREEDTE,
              zIndex: 9999,
              background: "linear-gradient(160deg,#1a1a1e,#0c0c0f 60%)",
              border: "1px solid var(--border-1)",
              borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,.6)",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-3)",
                marginBottom: 8,
              }}
            >
              Staf · {staf.length}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {staf.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 0",
                    borderTop: i > 0 ? "1px solid var(--border-0)" : "none",
                  }}
                >
                  {kanSorteren && (
                    <div
                      style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVolgorde(s, "omhoog");
                        }}
                        disabled={isPending || i === 0}
                        style={{
                          width: 14,
                          height: 12,
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          cursor: i === 0 ? "default" : "pointer",
                          color: i === 0 ? "var(--text-3)" : "rgba(251,146,60,.8)",
                          fontSize: 8,
                          lineHeight: 1,
                          opacity: i === 0 ? 0.2 : 1,
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVolgorde(s, "omlaag");
                        }}
                        disabled={isPending || i === staf.length - 1}
                        style={{
                          width: 14,
                          height: 12,
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          cursor: i === staf.length - 1 ? "default" : "pointer",
                          color: i === staf.length - 1 ? "var(--text-3)" : "rgba(251,146,60,.8)",
                          fontSize: 8,
                          lineHeight: 1,
                          opacity: i === staf.length - 1 ? 0.2 : 1,
                        }}
                      >
                        ▼
                      </button>
                    </div>
                  )}
                  <span style={{ color: "var(--text-3)", display: "inline-flex", flexShrink: 0 }}>
                    <TrainerIcoon size={13} />
                  </span>
                  <span
                    onClick={onStafClick ? () => onStafClick(s.stafId) : undefined}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-1)",
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      cursor: onStafClick ? "pointer" : "default",
                    }}
                  >
                    {s.naam}
                  </span>
                  {toonRol(s) && (
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--text-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        flexShrink: 0,
                      }}
                    >
                      {toonRol(s)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ── Selectie als geheel: 4 kolommen (dam1 | dam2 | her1 | her2) ───────────
// Spelers zijn nog niet per team ingedeeld — kolommen gegroepeerd op geslacht.

function SelectieGeheelDropzone({
  team,
  partnerTeam,
  zoomLevel,
  showScores,
  onSpelerClick,
  onDropSpelerOpTeam,
}: {
  team: WerkbordTeam;
  partnerTeam: WerkbordTeam;
  zoomLevel: ZoomLevel;
  showScores?: boolean;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
  onDropSpelerOpTeam?: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    naarTeamId: string,
    geslacht: "V" | "M"
  ) => void;
}) {
  const [dropOver, setDropOver] = useState<string | null>(null);

  function makeHandlers(col: string, geslacht: "V" | "M", naarTeamId: string) {
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
          const effectiefVanTeamId = data.vanTeamId;
          if (effectiefVanTeamId === naarTeamId) return;
          onDropSpelerOpTeam?.(data.speler, effectiefVanTeamId, naarTeamId, geslacht);
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
          const h = makeHandlers(col.id, col.kleur, col.teamId);
          return (
            <DropzoneKolom
              key={col.id}
              label={col.label}
              kleur={col.kleur}
              spelers={col.spelers}
              teamId={col.teamId}
              selectieGroepId={team.selectieGroepId}
              zoomLevel={zoomLevel}
              showScores={showScores}
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
  showScores?: boolean;
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
  showScores = false,
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

      {/* Teller: prominent geslacht-icoon + aantal */}
      {isCompact && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 0 6px",
            gap: 2,
            borderBottom: "1px solid rgba(255,255,255,.06)",
            flexShrink: 0,
          }}
        >
          {kleur === "V" ? (
            <svg
              width={26}
              height={26}
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(236,72,153,.8)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="8" r="6" />
              <line x1="12" y1="14" x2="12" y2="22" />
              <line x1="9" y1="19" x2="15" y2="19" />
            </svg>
          ) : (
            <svg
              width={26}
              height={26}
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(96,165,250,.8)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="10" cy="14" r="6" />
              <line x1="21" y1="3" x2="15" y2="9" />
              <polyline points="16 3 21 3 21 8" />
            </svg>
          )}
          <span
            style={{
              fontSize: 40,
              fontWeight: 900,
              lineHeight: 1,
              color: kleur === "V" ? "rgba(236,72,153,.75)" : "rgba(96,165,250,.75)",
            }}
          >
            {spelers.length}
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
            showScores={showScores}
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
  showScores,
  onDrop,
  onSpelerClick,
}: {
  team: WerkbordTeam;
  zoomLevel: ZoomLevel;
  showScores?: boolean;
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: "8px 0 6px",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(236,72,153,.8)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="8" r="6" />
              <line x1="12" y1="14" x2="12" y2="22" />
              <line x1="9" y1="19" x2="15" y2="19" />
            </svg>
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                lineHeight: 1,
                color: "rgba(236,72,153,.75)",
              }}
            >
              {team.dames.length}
            </span>
          </div>
          <div style={{ width: 1, height: 48, background: "rgba(255,255,255,.08)" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(96,165,250,.8)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="10" cy="14" r="6" />
              <line x1="21" y1="3" x2="15" y2="9" />
              <polyline points="16 3 21 3 21 8" />
            </svg>
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                lineHeight: 1,
                color: "rgba(96,165,250,.75)",
              }}
            >
              {team.heren.length}
            </span>
          </div>
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
            showScores={showScores}
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
  showScores,
  dropOverGeslacht,
  onDragOver,
  onDragLeave,
  onDrop,
  onSpelerClick,
}: {
  team: WerkbordTeam;
  zoomLevel: ZoomLevel;
  showScores?: boolean;
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
        showScores={showScores}
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
        showScores={showScores}
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
  showScores,
  onSpelerClick,
  onDropSpelerOpSelectie,
}: {
  team: WerkbordTeam;
  partnerTeam?: WerkbordTeam | null;
  zoomLevel: ZoomLevel;
  showScores?: boolean;
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
              showScores={showScores}
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
              showScores={showScores}
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
