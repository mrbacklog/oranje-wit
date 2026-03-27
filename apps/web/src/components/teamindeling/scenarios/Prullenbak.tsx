"use client";

import { useState, useTransition } from "react";
import {
  herstelScenario,
  definitiefVerwijderScenario,
} from "@/app/(teamindeling)/teamindeling/scenarios/actions";

interface VerwijderdScenario {
  id: string;
  naam: string;
  status: string;
  verwijderdOp: Date | string;
  versies: { _count: { teams: number } }[];
}

interface PrullenbakProps {
  scenarios: VerwijderdScenario[];
}

export default function Prullenbak({ scenarios }: PrullenbakProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [bevestigId, setBevestigId] = useState<string | null>(null);

  if (scenarios.length === 0) return null;

  function handleHerstel(id: string) {
    startTransition(async () => {
      await herstelScenario(id);
    });
  }

  function handleDefinitief(id: string) {
    if (bevestigId !== id) {
      setBevestigId(id);
      return;
    }
    startTransition(async () => {
      await definitiefVerwijderScenario(id);
      setBevestigId(null);
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-500 hover:text-gray-700"
      >
        <span>
          Prullenbak ({scenarios.length} scenario{scenarios.length !== 1 ? "'s" : ""})
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-2 border-t border-gray-200 px-4 py-3">
          {scenarios.map((s) => {
            const aantalTeams = s.versies[0]?._count?.teams ?? 0;
            const verwijderdDatum = new Date(s.verwijderdOp).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md bg-white px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium text-gray-700">{s.naam}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {aantalTeams} teams &middot; verwijderd {verwijderdDatum}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleHerstel(s.id)}
                    disabled={isPending}
                    className="rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200 disabled:opacity-50"
                  >
                    Herstel
                  </button>
                  {bevestigId === s.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600">Zeker?</span>
                      <button
                        onClick={() => handleDefinitief(s.id)}
                        disabled={isPending}
                        className="rounded bg-red-500 px-1.5 py-0.5 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => setBevestigId(null)}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                      >
                        Nee
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDefinitief(s.id)}
                      disabled={isPending}
                      className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
                    >
                      Definitief verwijderen
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-gray-400">
            Verwijderde scenario&apos;s worden na 30 dagen automatisch opgeschoond.
          </p>
        </div>
      )}
    </div>
  );
}
