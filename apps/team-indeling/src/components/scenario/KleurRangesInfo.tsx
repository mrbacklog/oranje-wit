"use client";

import { useState } from "react";
import { KLEUR_VOLGORDE, KLEUR_VEILIGE_RANGE } from "@/lib/validatie/regels";

const KLEUR_STIJL: Record<string, string> = {
  PAARS: "bg-purple-100 text-purple-700",
  BLAUW: "bg-blue-100 text-blue-700",
  GROEN: "bg-emerald-100 text-emerald-700",
  GEEL: "bg-yellow-100 text-yellow-700",
  ORANJE: "bg-orange-100 text-orange-700",
  ROOD: "bg-red-100 text-red-700",
};

const FORMAT: Record<string, string> = {
  PAARS: "4-tal",
  BLAUW: "4-tal",
  GROEN: "4-tal",
  GEEL: "8-tal",
  ORANJE: "8-tal",
  ROOD: "8-tal",
};

const MAX_SPREIDING: Record<string, number> = {
  PAARS: 2,
  BLAUW: 2,
  GROEN: 2,
  GEEL: 3,
  ORANJE: 3,
  ROOD: 3,
};

export default function KleurRangesInfo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 px-5 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-gray-700"
      >
        <span className="text-xs text-gray-400">{open ? "▾" : "▸"}</span>
        Kleurranges B-categorie
      </button>

      {open && (
        <div className="mt-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-1.5 font-medium">Kleur</th>
                <th className="pb-1.5 font-medium">Format</th>
                <th className="pb-1.5 font-medium">Veilige range</th>
                <th className="pb-1.5 font-medium">Max spreiding</th>
              </tr>
            </thead>
            <tbody>
              {KLEUR_VOLGORDE.map((kleur) => {
                const range = KLEUR_VEILIGE_RANGE[kleur];
                return (
                  <tr key={kleur} className="border-b border-gray-50">
                    <td className="py-1.5">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${KLEUR_STIJL[kleur]}`}
                      >
                        {kleur.charAt(0) + kleur.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="py-1.5 text-gray-600">{FORMAT[kleur]}</td>
                    <td className="py-1.5 text-gray-600">
                      {range.min} – {range.max} jr
                    </td>
                    <td className="py-1.5 text-gray-600">{MAX_SPREIDING[kleur]} jr</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2.5 text-[10px] leading-relaxed text-gray-400">
            Bron: KNKV conceptindelingen 2025-2026 (p5–p95 landelijk).
            <br />
            Teams buiten de range lopen risico op herindeling naar een andere kleur.
          </p>
        </div>
      )}
    </div>
  );
}
