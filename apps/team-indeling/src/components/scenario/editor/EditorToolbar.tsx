"use client";

import Link from "next/link";
import type { ScenarioData } from "../types";
import MaakDefinitiefKnop from "../MaakDefinitiefKnop";

interface EditorToolbarProps {
  scenario: ScenarioData;
  navOpen: boolean;
  poolOpen: boolean;
  onToggleNav: () => void;
  onTogglePool: () => void;
}

export default function EditorToolbar({
  scenario,
  navOpen,
  poolOpen,
  onToggleNav,
  onTogglePool,
}: EditorToolbarProps) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
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

      {/* Rechts: toggles + definitief */}
      <div className="flex items-center gap-2">
        {/* Navigator toggle */}
        <button
          onClick={onToggleNav}
          className={`rounded-lg p-2 transition-colors ${
            navOpen
              ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }`}
          title={navOpen ? "Verberg teamlijst" : "Toon teamlijst"}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* SpelersPool toggle */}
        <button
          onClick={onTogglePool}
          className={`rounded-lg p-2 transition-colors ${
            poolOpen
              ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }`}
          title={poolOpen ? "Verberg spelerspool" : "Toon spelerspool"}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {scenario.status !== "DEFINITIEF" && scenario.status !== "GEARCHIVEERD" && (
          <MaakDefinitiefKnop scenarioId={scenario.id} />
        )}
      </div>
    </div>
  );
}
