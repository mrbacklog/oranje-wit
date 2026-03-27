"use client";

import { useEffect, useRef, useState } from "react";

interface OpmerkingPopoverProps {
  spelerOpmerkingen?: string;
  trainerOpmerking?: string | null;
}

export default function OpmerkingPopover({
  spelerOpmerkingen,
  trainerOpmerking,
}: OpmerkingPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const heeftInhoud =
    (spelerOpmerkingen && spelerOpmerkingen.trim().length > 0) ||
    (trainerOpmerking && trainerOpmerking.trim().length > 0);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!heeftInhoud) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title="Opmerkingen bekijken"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full z-50 mb-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          {/* Pijltje naar beneden */}
          <div className="absolute right-2 -bottom-1.5 h-3 w-3 rotate-45 border-r border-b border-gray-200 bg-white" />

          <div className="space-y-2">
            {spelerOpmerkingen && spelerOpmerkingen.trim().length > 0 && (
              <div>
                <span className="block text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                  Speler
                </span>
                <p className="text-xs leading-relaxed text-gray-700">{spelerOpmerkingen}</p>
              </div>
            )}
            {trainerOpmerking && trainerOpmerking.trim().length > 0 && (
              <div>
                <span className="block text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                  Trainer
                </span>
                <p className="text-xs leading-relaxed text-gray-700">{trainerOpmerking}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
