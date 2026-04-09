"use client";

import { useRef } from "react";
import type { TeamData, DetailLevel } from "./types";
import { KLEUR_BADGE_KLEUREN, CATEGORIE_BADGE, CATEGORIE_BADGE_LABEL } from "./types";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/regels";
import ValidatieBadge from "./ValidatieBadge";
import ValidatieMeldingen from "./ValidatieMeldingen";

interface TeamKaartHeaderProps {
  team: TeamData;
  detailLevel: DetailLevel;
  validatie?: TeamValidatie;
  notitieCount?: number;
  aantalV: number;
  aantalM: number;
  headerBorder: string;
  deleteBevestig: boolean;
  meldingenOpen: boolean;
  onDeleteBevestigChange: (v: boolean) => void;
  onMeldingenToggle: () => void;
  onEditTeam?: (teamId: string) => void;
  onDelete?: (teamId: string) => void;
  onNotitiesClick?: (teamNaam: string) => void;
}

export default function TeamKaartHeader({
  team,
  detailLevel: dl,
  validatie,
  notitieCount,
  aantalV,
  aantalM,
  headerBorder,
  deleteBevestig,
  meldingenOpen,
  onDeleteBevestigChange,
  onMeldingenToggle,
  onEditTeam,
  onDelete,
  onNotitiesClick,
}: TeamKaartHeaderProps) {
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weergaveNaam = team.alias ?? team.naam;

  const handleDeleteClick = () => {
    onDeleteBevestigChange(true);
    deleteTimerRef.current = setTimeout(() => onDeleteBevestigChange(false), 3000);
  };

  const handleDeleteBevestig = () => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    onDeleteBevestigChange(false);
    onDelete!(team.id);
  };

  return (
    <div
      style={{ height: 36 }}
      className={`flex items-center justify-between px-1.5 py-1 ${headerBorder}`}
    >
      <div className="relative flex min-w-0 items-center gap-1">
        {dl === "detail" && (
          <span className="shrink-0 text-[var(--text-tertiary)]">
            <svg className="h-2.5 w-2.5" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="3" cy="2" r="1.2" />
              <circle cx="7" cy="2" r="1.2" />
              <circle cx="3" cy="8" r="1.2" />
              <circle cx="7" cy="8" r="1.2" />
              <circle cx="3" cy="14" r="1.2" />
              <circle cx="7" cy="14" r="1.2" />
            </svg>
          </span>
        )}
        {dl === "detail" && validatie && (
          <ValidatieBadge status={validatie.status} onClick={onMeldingenToggle} />
        )}
        {dl !== "compact" && validatie && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{
              background:
                validatie.status === "ROOD"
                  ? "#ef4444"
                  : validatie.status === "ORANJE"
                    ? "#f97316"
                    : "#22c55e",
            }}
          />
        )}
        <h4
          onClick={() => onEditTeam?.(team.id)}
          className={`text-text-primary hover:text-ow-oranje cursor-pointer truncate font-extrabold transition-colors ${
            dl === "compact" ? "text-xs" : "text-[11px]"
          }`}
          style={{ letterSpacing: "-0.2px" }}
        >
          {weergaveNaam}
        </h4>
        {dl !== "compact" && team.kleur && (
          <span
            className={`shrink-0 rounded-full px-1 py-px text-[7px] ${
              KLEUR_BADGE_KLEUREN[team.kleur] ?? "bg-surface-raised text-text-secondary"
            }`}
          >
            {team.kleur}
          </span>
        )}
        {dl !== "compact" && CATEGORIE_BADGE[team.categorie] && (
          <span
            className={`shrink-0 rounded-full px-1 py-px text-[7px] font-medium ${CATEGORIE_BADGE[team.categorie]}`}
          >
            {CATEGORIE_BADGE_LABEL[team.categorie]}
          </span>
        )}
        {meldingenOpen && validatie && (
          <ValidatieMeldingen meldingen={validatie.meldingen} onClose={onMeldingenToggle} />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <span
          className="rounded px-1 py-px text-[9px] font-semibold"
          style={{ background: "rgba(236,72,153,0.12)", color: "#EC4899" }}
        >
          ♀{aantalV}
        </span>
        <span
          className="rounded px-1 py-px text-[9px] font-semibold"
          style={{ background: "rgba(96,165,250,0.12)", color: "#60A5FA" }}
        >
          ♂{aantalM}
        </span>
        {dl === "detail" && notitieCount != null && notitieCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotitiesClick?.(team.alias ?? team.naam);
            }}
            className="inline-flex h-3 min-w-3 items-center justify-center rounded-full bg-orange-500 px-0.5 text-[7px] font-bold text-white hover:bg-orange-600"
            title={`${notitieCount} notitie(s)`}
          >
            {notitieCount}
          </button>
        )}
        {dl === "detail" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditTeam?.(team.id);
            }}
            className="text-text-muted hover:text-text-primary transition-colors"
            title="Bewerk team"
          >
            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        )}
        {dl === "detail" &&
          onDelete &&
          (deleteBevestig ? (
            <button
              onClick={handleDeleteBevestig}
              onBlur={() => {
                if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
                onDeleteBevestigChange(false);
              }}
              className="animate-pulse text-[8px] font-medium text-red-600 hover:text-red-700"
            >
              Bevestig?
            </button>
          ) : (
            <button
              onClick={handleDeleteClick}
              className="text-text-muted text-[10px] hover:text-red-500"
              title="Verwijder team"
            >
              &times;
            </button>
          ))}
      </div>
    </div>
  );
}
