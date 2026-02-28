"use client";

import { useState, useTransition } from "react";
import { deleteScenario } from "@/app/scenarios/actions";

interface VerwijderScenarioKnopProps {
  scenarioId: string;
  scenarioNaam: string;
}

export default function VerwijderScenarioKnop({
  scenarioId,
  scenarioNaam,
}: VerwijderScenarioKnopProps) {
  const [bevestig, setBevestig] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!bevestig) {
      setBevestig(true);
      return;
    }

    startTransition(async () => {
      await deleteScenario(scenarioId);
    });
  }

  function handleAnnuleer(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBevestig(false);
  }

  if (bevestig) {
    return (
      <div
        className="flex items-center gap-1.5"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <span className="text-xs text-red-600">Verwijderen?</span>
        <button
          onClick={handleClick}
          disabled={isPending}
          className="rounded bg-red-500 px-1.5 py-0.5 text-xs text-white hover:bg-red-600 disabled:opacity-50"
        >
          {isPending ? "..." : "Ja"}
        </button>
        <button
          onClick={handleAnnuleer}
          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
        >
          Nee
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={`Verwijder "${scenarioNaam}"`}
      className="p-1 text-gray-300 transition-colors hover:text-red-500"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg>
    </button>
  );
}
