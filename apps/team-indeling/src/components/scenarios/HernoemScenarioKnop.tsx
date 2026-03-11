"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { updateScenarioNaam } from "@/app/scenarios/actions";

interface HernoemScenarioKnopProps {
  scenarioId: string;
  huidigNaam: string;
}

export default function HernoemScenarioKnop({ scenarioId, huidigNaam }: HernoemScenarioKnopProps) {
  const [bewerkModus, setBewerkModus] = useState(false);
  const [naam, setNaam] = useState(huidigNaam);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bewerkModus) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [bewerkModus]);

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setNaam(huidigNaam);
    setBewerkModus(true);
  }

  function handleAnnuleer(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBewerkModus(false);
  }

  function handleOpslaan(e: React.MouseEvent | React.FormEvent) {
    e.preventDefault();
    if ("stopPropagation" in e) (e as React.MouseEvent).stopPropagation();
    const trimmed = naam.trim();
    if (!trimmed || trimmed === huidigNaam) {
      setBewerkModus(false);
      return;
    }
    startTransition(async () => {
      await updateScenarioNaam(scenarioId, trimmed);
      setBewerkModus(false);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.key === "Enter") handleOpslaan(e as unknown as React.FormEvent);
    if (e.key === "Escape") setBewerkModus(false);
  }

  if (bewerkModus) {
    return (
      <div
        className="flex items-center gap-1.5"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <input
          ref={inputRef}
          value={naam}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNaam(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className="rounded border border-orange-300 px-1.5 py-0.5 text-sm font-semibold text-gray-900 focus:ring-1 focus:ring-orange-400 focus:outline-none disabled:opacity-50"
          style={{ minWidth: "12rem" }}
        />
        <button
          onClick={handleOpslaan}
          disabled={isPending}
          className="rounded bg-orange-500 px-1.5 py-0.5 text-xs text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {isPending ? "..." : "Opslaan"}
        </button>
        <button
          onClick={handleAnnuleer}
          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
        >
          Annuleer
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpen}
      title="Naam wijzigen"
      className="p-1 text-gray-300 transition-colors hover:text-orange-500"
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
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}
