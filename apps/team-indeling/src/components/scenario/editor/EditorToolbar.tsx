"use client";

import Link from "next/link";
import type { ScenarioData } from "../types";
import MaakDefinitiefKnop from "../MaakDefinitiefKnop";

interface EditorToolbarProps {
  scenario: ScenarioData;
  zichtbaar: number;
  totaal: number;
}

export default function EditorToolbar({ scenario, zichtbaar, totaal }: EditorToolbarProps) {
  return (
    <div className="relative flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Links: sluiten + scenario info */}
      <div className="flex items-center gap-3">
        <Link
          href={`/scenarios/${scenario.id}`}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Terug naar overzicht"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Link>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">{scenario.naam}</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              scenario.status === "DEFINITIEF"
                ? "bg-green-100 text-green-700"
                : scenario.status === "GEARCHIVEERD"
                  ? "bg-gray-100 text-gray-500"
                  : "bg-orange-100 text-orange-700"
            }`}
          >
            {scenario.status === "DEFINITIEF"
              ? "Definitief"
              : scenario.status === "GEARCHIVEERD"
                ? "Gearchiveerd"
                : "Actief"}
          </span>
        </div>
      </div>

      {/* Midden: teller */}
      <span className="absolute left-1/2 -translate-x-1/2 text-sm text-gray-500">
        {zichtbaar} van {totaal} teams zichtbaar
      </span>

      {/* Rechts: definitief */}
      <div className="flex items-center gap-2">
        {scenario.status !== "DEFINITIEF" && scenario.status !== "GEARCHIVEERD" && (
          <MaakDefinitiefKnop scenarioId={scenario.id} />
        )}
      </div>
    </div>
  );
}
