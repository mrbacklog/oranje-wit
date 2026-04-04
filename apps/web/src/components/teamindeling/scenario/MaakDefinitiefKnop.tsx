"use client";

import { useState, useTransition } from "react";
import { hernoem } from "@/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions";

// Tijdelijke stub voor markeerDefinitief — wordt in Task 4 vervangen door werkindeling-status actie
async function markeerDefinitief(werkindelingId: string) {
  // Placeholder: in Task 4 implementeren als werkindeling status → DEFINITIEF
  void werkindelingId;
}

interface MaakDefinitiefKnopProps {
  werkindelingId: string;
}

export default function MaakDefinitiefKnop({ werkindelingId }: MaakDefinitiefKnopProps) {
  const [bevestig, setBevestig] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!bevestig) {
      setBevestig(true);
      return;
    }

    startTransition(() => {
      markeerDefinitief(werkindelingId);
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
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          bevestig
            ? "bg-green-600 text-white hover:bg-green-700"
            : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
        } disabled:opacity-50`}
      >
        {isPending ? (
          "Bezig..."
        ) : bevestig ? (
          "Bevestig definitief"
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
