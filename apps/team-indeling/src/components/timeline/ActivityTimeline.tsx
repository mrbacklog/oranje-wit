"use client";

import { useState } from "react";
import type { ActiviteitMetRelaties } from "@/app/activiteiten/actions";
import { logger } from "@oranje-wit/types";

interface ActivityTimelineProps {
  activiteiten: ActiviteitMetRelaties[];
  onToggleActiepunt: (id: string) => void;
  onMaakActiepunt?: (inhoud: string) => void;
}

function formatDatum(datum: Date | string): string {
  return new Date(datum).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DotIcon({ type, afgerond }: { type: string; afgerond?: boolean }) {
  if (type === "ACTIEPUNT") {
    return (
      <div
        className={`absolute top-1.5 -left-[9px] h-4 w-4 rounded-full border-2 border-white ${
          afgerond ? "bg-green-500" : "bg-orange-500"
        }`}
      />
    );
  }
  if (type === "STATUS_WIJZIGING") {
    return (
      <div className="absolute top-1.5 -left-[9px] h-4 w-4 rounded-full border-2 border-white bg-blue-500" />
    );
  }
  // OPMERKING
  return (
    <div className="absolute top-1.5 -left-[9px] h-4 w-4 rounded-full border-2 border-white bg-gray-400" />
  );
}

function OpmerkingEntry({
  activiteit,
  onMaakActiepunt,
}: {
  activiteit: ActiviteitMetRelaties;
  onMaakActiepunt?: (inhoud: string) => void;
}) {
  return (
    <div className="relative pl-6">
      <DotIcon type="OPMERKING" />
      <div className="rounded-md bg-gray-50 px-3 py-2">
        <p className="text-sm text-gray-700">{activiteit.inhoud}</p>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
        <span>{formatDatum(activiteit.createdAt)}</span>
        {activiteit.auteur && <span className="text-gray-500">{activiteit.auteur.naam}</span>}
        {onMaakActiepunt && (
          <>
            <span>-</span>
            <button
              type="button"
              className="text-orange-500 hover:text-orange-700"
              onClick={() => onMaakActiepunt(activiteit.inhoud)}
            >
              Maak actiepunt
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ActiepuntEntry({
  activiteit,
  onToggle,
}: {
  activiteit: ActiviteitMetRelaties;
  onToggle: (id: string) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const afgerond = activiteit.actiepuntStatus === "AFGEROND";

  async function handleToggle() {
    setToggling(true);
    try {
      onToggle(activiteit.id);
    } catch (error) {
      logger.warn("Fout bij toggle actiepunt:", error);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="relative pl-6">
      <DotIcon type="ACTIEPUNT" afgerond={afgerond} />
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={afgerond}
          disabled={toggling}
          onChange={handleToggle}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
        />
        <div className="flex-1">
          <p className={`text-sm ${afgerond ? "text-gray-400 line-through" : "text-gray-700"}`}>
            {activiteit.inhoud}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span>{formatDatum(activiteit.createdAt)}</span>
            {activiteit.auteur && <span className="text-gray-500">{activiteit.auteur.naam}</span>}
            {activiteit.toegewezenAan && (
              <span className="badge-orange">{activiteit.toegewezenAan.naam}</span>
            )}
            {activiteit.deadline && (
              <span className="text-gray-500">Deadline: {formatDatum(activiteit.deadline)}</span>
            )}
            {activiteit.afgerondOp && (
              <span className="text-green-600">Afgerond: {formatDatum(activiteit.afgerondOp)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusWijzigingEntry({ activiteit }: { activiteit: ActiviteitMetRelaties }) {
  return (
    <div className="relative pl-6">
      <DotIcon type="STATUS_WIJZIGING" />
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
        <span className="text-sm text-gray-700">{activiteit.inhoud}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
        <span>{formatDatum(activiteit.createdAt)}</span>
        {activiteit.auteur && <span className="text-gray-500">{activiteit.auteur.naam}</span>}
      </div>
    </div>
  );
}

export default function ActivityTimeline({
  activiteiten,
  onToggleActiepunt,
  onMaakActiepunt,
}: ActivityTimelineProps) {
  if (activiteiten.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">Nog geen activiteiten.</p>;
  }

  return (
    <div className="relative border-l-2 border-gray-200">
      <div className="space-y-4 py-2">
        {activiteiten.map((activiteit) => {
          switch (activiteit.type) {
            case "OPMERKING":
              return (
                <OpmerkingEntry
                  key={activiteit.id}
                  activiteit={activiteit}
                  onMaakActiepunt={onMaakActiepunt}
                />
              );
            case "ACTIEPUNT":
              return (
                <ActiepuntEntry
                  key={activiteit.id}
                  activiteit={activiteit}
                  onToggle={onToggleActiepunt}
                />
              );
            case "STATUS_WIJZIGING":
              return <StatusWijzigingEntry key={activiteit.id} activiteit={activiteit} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
