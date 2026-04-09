"use client";

import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { TeamData, SpelerData, DetailLevel } from "./types";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/regels";
import { korfbalLeeftijd, sorteerSpelers } from "./types";
import {
  categorieRandKlassen,
  categorieAchtergrond,
  categorieHeaderBorder,
  categorieFooterBorder,
  validatieRingKlassen,
  teamKleurGradient,
} from "@/lib/teamindeling/teamKaartStijl";
import { getCardSize } from "./editor/cardSizes";
import { useZoomScale } from "./editor/ZoomScaleContext";
import TeamKaartHeader from "./TeamKaartHeader";
import TeamKaartBody from "./TeamKaartBody";
import TeamKaartFooter from "./TeamKaartFooter";

export interface TeamKaartProps {
  team: TeamData;
  validatie?: TeamValidatie;
  notitieCount?: number;
  detailLevel?: DetailLevel;
  pinnedSpelerIds?: Set<string>;
  showRanking?: boolean;
  jIndicatie?: string;
  teamSterkte?: number;
  onDelete?: (teamId: string) => void;
  onSpelerClick?: (speler: SpelerData) => void;
  onEditTeam?: (teamId: string) => void;
  onNotitiesClick?: (teamNaam: string) => void;
}

export default function TeamKaart({
  team,
  validatie,
  notitieCount,
  detailLevel,
  pinnedSpelerIds,
  showRanking,
  jIndicatie,
  teamSterkte,
  onDelete,
  onSpelerClick,
  onEditTeam,
  onNotitiesClick,
}: TeamKaartProps) {
  const dl = detailLevel ?? "detail";
  const [meldingenOpen, setMeldingenOpen] = useState(false);
  const [deleteBevestig, setDeleteBevestig] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const { setNodeRef, isOver } = useDroppable({
    id: `team-${team.id}`,
    data: { type: "team", teamId: team.id },
  });

  // Afgeleide stats
  const aantalSpelers = team.spelers.length;
  const aantalM = team.spelers.filter((ts) => ts.speler.geslacht === "M").length;
  const aantalV = team.spelers.filter((ts) => ts.speler.geslacht === "V").length;
  const gemLeeftijd =
    aantalSpelers > 0
      ? (
          team.spelers.reduce(
            (sum, ts) => sum + korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar),
            0
          ) / aantalSpelers
        ).toFixed(2)
      : "-";

  const gesorteerd = sorteerSpelers(team.spelers);
  const heren = gesorteerd.filter((ts) => ts.speler.geslacht === "M");
  const dames = gesorteerd.filter((ts) => ts.speler.geslacht === "V");

  // Stijlen
  const randKlassen = categorieRandKlassen(team.categorie, team.kleur);
  const achtergrond = categorieAchtergrond(team.categorie, team.kleur);
  const headerBorder = categorieHeaderBorder(team.categorie, team.kleur);
  const footerBorder = categorieFooterBorder(team.categorie, team.kleur);
  const ringKlassen = validatieRingKlassen(validatie?.status, isOver);

  const { w: cardWidth, h: cardHeight } = getCardSize(team.teamType ?? "ACHTAL", false);
  const isDouble = (team.teamType ?? "ACHTAL") !== "VIERTAL";

  const zoomScale = useZoomScale();
  const inverseScale = dl === "compact" && zoomScale < 0.64 ? 0.8 / Math.max(zoomScale, 0.4) : 1;

  const meldingen = validatie?.meldingen ?? [];

  return (
    <div
      ref={setNodeRef}
      data-team-id={team.id}
      style={{
        width: cardWidth,
        height: cardHeight,
        position: "relative",
        ...(isHovered && {
          borderColor: "rgba(255,107,0,0.3)",
          boxShadow: "0 0 0 1px rgba(255,107,0,0.08), 0 4px 16px rgba(0,0,0,0.3)",
        }),
      }}
      className={`flex flex-col rounded-xl transition-colors ${randKlassen} ${achtergrond} ${ringKlassen}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* KNKV kleurband */}
      <div
        style={{
          background: teamKleurGradient(team.kleur),
          width: "3px",
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          borderRadius: "8px 0 0 8px",
        }}
      />
      <div
        style={
          inverseScale > 1
            ? {
                transform: `scale(${inverseScale})`,
                transformOrigin: "top left",
                width: `${100 / inverseScale}%`,
                height: `${100 / inverseScale}%`,
              }
            : undefined
        }
        className="flex h-full flex-col"
      >
        <TeamKaartHeader
          team={team}
          detailLevel={dl}
          validatie={validatie}
          notitieCount={notitieCount}
          aantalV={aantalV}
          aantalM={aantalM}
          headerBorder={headerBorder}
          deleteBevestig={deleteBevestig}
          meldingenOpen={meldingenOpen}
          onDeleteBevestigChange={setDeleteBevestig}
          onMeldingenToggle={() => setMeldingenOpen((v) => !v)}
          onEditTeam={onEditTeam}
          onDelete={onDelete}
          onNotitiesClick={onNotitiesClick}
        />
        <TeamKaartBody
          teamId={team.id}
          detailLevel={dl}
          heren={heren}
          dames={dames}
          aantalV={aantalV}
          aantalM={aantalM}
          gemLeeftijd={gemLeeftijd}
          isDouble={isDouble}
          pinnedSpelerIds={pinnedSpelerIds}
          showRanking={showRanking}
          teamSterkte={teamSterkte}
          onSpelerClick={onSpelerClick}
        />
        {dl !== "compact" && (
          <TeamKaartFooter
            meldingen={meldingen}
            aantalSpelers={aantalSpelers}
            gemLeeftijd={gemLeeftijd}
            footerBorder={footerBorder}
            jIndicatie={jIndicatie}
            teamSterkte={teamSterkte}
          />
        )}
      </div>
    </div>
  );
}
