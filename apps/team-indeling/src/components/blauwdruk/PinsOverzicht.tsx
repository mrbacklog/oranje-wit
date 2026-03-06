"use client";

import type { PinMetNamen } from "@/app/blauwdruk/actions";

const TYPE_LABELS: Record<string, { label: string; kleur: string }> = {
  SPELER_STATUS: { label: "Status", kleur: "bg-blue-100 text-blue-700" },
  SPELER_POSITIE: { label: "Positie", kleur: "bg-purple-100 text-purple-700" },
  STAF_POSITIE: { label: "Staf", kleur: "bg-amber-100 text-amber-700" },
};

function naam(pin: PinMetNamen): string {
  if (pin.speler) {
    return `${pin.speler.roepnaam} ${pin.speler.achternaam}`;
  }
  if (pin.staf) {
    return pin.staf.naam;
  }
  return "—";
}

function waarde(pin: PinMetNamen): string {
  const w = pin.waarde as Record<string, unknown> | null;
  if (!w) return "—";
  return Object.entries(w)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}

interface PinsOverzichtProps {
  pins: PinMetNamen[];
}

export default function PinsOverzicht({ pins }: PinsOverzichtProps) {
  if (pins.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
        Nog geen pins. Pins worden aangemaakt vanuit de spelerskaarten in de scenario-editor.
      </div>
    );
  }

  const groepen: Record<string, PinMetNamen[]> = {
    SPELER_STATUS: [],
    SPELER_POSITIE: [],
    STAF_POSITIE: [],
  };
  for (const pin of pins) {
    if (groepen[pin.type]) groepen[pin.type].push(pin);
  }

  return (
    <div className="space-y-6">
      {Object.entries(groepen).map(([type, lijst]) => {
        if (lijst.length === 0) return null;
        const cfg = TYPE_LABELS[type] ?? { label: type, kleur: "bg-gray-100 text-gray-600" };
        return (
          <div key={type}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.kleur}`}>
                {cfg.label}
              </span>
              <span className="text-gray-400">({lijst.length})</span>
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Naam</th>
                    <th className="px-4 py-2 text-left font-medium">Waarde</th>
                    <th className="px-4 py-2 text-left font-medium">Notitie</th>
                    <th className="px-4 py-2 text-left font-medium">Gepind door</th>
                    <th className="px-4 py-2 text-left font-medium">Datum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lijst.map((pin) => (
                    <tr key={pin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{naam(pin)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{waarde(pin)}</td>
                      <td className="px-4 py-2.5 text-gray-500">{pin.notitie ?? "—"}</td>
                      <td className="px-4 py-2.5 text-gray-500">{pin.gepindDoor?.naam ?? "—"}</td>
                      <td className="px-4 py-2.5 text-gray-400">
                        {new Date(pin.gepindOp).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
