"use client";

import { useRef, useEffect } from "react";
import type { ValidatieMelding, MeldingErnst } from "@/lib/validatie/regels";

const ERNST_CONFIG: Record<
  MeldingErnst,
  { icon: string; kleur: string; label: string }
> = {
  kritiek: { icon: "\u2715", kleur: "text-red-600 bg-red-50", label: "Kritiek" },
  aandacht: { icon: "\u26A0", kleur: "text-orange-600 bg-orange-50", label: "Aandacht" },
  info: { icon: "\u2139", kleur: "text-blue-600 bg-blue-50", label: "Info" },
};

const ERNST_VOLGORDE: MeldingErnst[] = ["kritiek", "aandacht", "info"];

interface ValidatieMeldingenProps {
  meldingen: ValidatieMelding[];
  onClose: () => void;
}

export default function ValidatieMeldingen({
  meldingen,
  onClose,
}: ValidatieMeldingenProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Sluit bij klik buiten de popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const gesorteerd = [...meldingen].sort(
    (a, b) => ERNST_VOLGORDE.indexOf(a.ernst) - ERNST_VOLGORDE.indexOf(b.ernst)
  );

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">
          Validatie ({meldingen.length} melding{meldingen.length !== 1 ? "en" : ""})
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm leading-none"
        >
          &times;
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {gesorteerd.length === 0 ? (
          <p className="px-3 py-3 text-xs text-gray-400 text-center">
            Geen meldingen
          </p>
        ) : (
          gesorteerd.map((m, i) => {
            const config = ERNST_CONFIG[m.ernst];
            return (
              <div
                key={`${m.regel}-${i}`}
                className="px-3 py-2 border-b border-gray-50 last:border-b-0 flex items-start gap-2"
              >
                <span
                  className={`text-[10px] w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${config.kleur}`}
                >
                  {config.icon}
                </span>
                <span className="text-xs text-gray-700 leading-snug">
                  {m.bericht}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
