"use client";

import { useState, useTransition } from "react";
import { markeerDefinitief } from "@/app/scenarios/actions";

interface MaakDefinitiefKnopProps {
  scenarioId: string;
}

export default function MaakDefinitiefKnop({
  scenarioId,
}: MaakDefinitiefKnopProps) {
  const [bevestig, setBevestig] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!bevestig) {
      setBevestig(true);
      return;
    }

    startTransition(() => {
      markeerDefinitief(scenarioId);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {bevestig && (
        <button
          onClick={() => setBevestig(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
          disabled={isPending}
        >
          Annuleer
        </button>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
          bevestig
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
        } disabled:opacity-50`}
      >
        {isPending ? (
          "Bezig..."
        ) : bevestig ? (
          "Bevestig definitief"
        ) : (
          <>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Maak definitief
          </>
        )}
      </button>
    </div>
  );
}
