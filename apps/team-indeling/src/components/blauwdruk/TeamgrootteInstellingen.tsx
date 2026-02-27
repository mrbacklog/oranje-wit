"use client";

import { useState, useCallback } from "react";
import { updateTeamgrootte } from "@/app/blauwdruk/actions";
import {
  DEFAULT_TEAMGROOTTE,
  type TeamgrootteTargets,
  type TeamgrootteBereik,
} from "@/app/blauwdruk/teamgrootte";

interface TeamgrootteInstellingenProps {
  blauwdrukId: string;
  initieel: TeamgrootteTargets;
}

interface RijConfig {
  key: keyof TeamgrootteTargets;
  label: string;
  toelichting: string;
}

const RIJEN: RijConfig[] = [
  {
    key: "viertal",
    label: "4-tal selectie",
    toelichting: "Blauw + Groen",
  },
  {
    key: "breedteAchttal",
    label: "B-cat 8-tal selectie",
    toelichting: "Geel, Oranje, Rood",
  },
  {
    key: "aCatTeam",
    label: "A-cat team",
    toelichting: "U15 / U17 / U19 per team",
  },
  {
    key: "selectie",
    label: "A-cat selectie",
    toelichting: "2 teams samen (10M + 10V)",
  },
  {
    key: "seniorenSelectie",
    label: "Senioren selectie",
    toelichting: "Sen 1-4 selectie",
  },
];

export default function TeamgrootteInstellingen({
  blauwdrukId,
  initieel,
}: TeamgrootteInstellingenProps) {
  const [targets, setTargets] = useState<TeamgrootteTargets>(initieel);
  const [opslaan, setOpslaan] = useState(false);

  const slaOp = useCallback(
    async (nieuw: TeamgrootteTargets) => {
      setOpslaan(true);
      try {
        await updateTeamgrootte(blauwdrukId, nieuw);
      } finally {
        setOpslaan(false);
      }
    },
    [blauwdrukId]
  );

  const updateWaarde = useCallback(
    (key: keyof TeamgrootteTargets, veld: keyof TeamgrootteBereik, waarde: number) => {
      setTargets((prev) => {
        const nieuw = {
          ...prev,
          [key]: { ...prev[key], [veld]: waarde },
        };
        // slaOp buiten de updater aanroepen om setState-during-render te voorkomen
        queueMicrotask(() => slaOp(nieuw));
        return nieuw;
      });
    },
    [slaOp]
  );

  const resetNaarDefault = useCallback(async () => {
    setTargets(DEFAULT_TEAMGROOTTE);
    await slaOp(DEFAULT_TEAMGROOTTE);
  }, [slaOp]);

  return (
    <div className="card">
      <div className="card-body p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left font-medium text-gray-500 px-4 py-3 w-[200px]">
                Teamtype
              </th>
              <th className="text-center font-medium text-gray-500 px-3 py-3 w-[100px]">
                Min
              </th>
              <th className="text-center font-medium text-orange-600 px-3 py-3 w-[100px]">
                Ideaal
              </th>
              <th className="text-center font-medium text-gray-500 px-3 py-3 w-[100px]">
                Max
              </th>
            </tr>
          </thead>
          <tbody>
            {RIJEN.map((rij) => (
              <tr key={rij.key} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-700">{rij.label}</div>
                  <div className="text-xs text-gray-400">{rij.toelichting}</div>
                </td>
                <td className="px-3 py-2">
                  <NumberInput
                    waarde={targets[rij.key].min}
                    onChange={(v) => updateWaarde(rij.key, "min", v)}
                  />
                </td>
                <td className="px-3 py-2">
                  <NumberInput
                    waarde={targets[rij.key].ideaal}
                    onChange={(v) => updateWaarde(rij.key, "ideaal", v)}
                    accent
                  />
                </td>
                <td className="px-3 py-2">
                  <NumberInput
                    waarde={targets[rij.key].max}
                    onChange={(v) => updateWaarde(rij.key, "max", v)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-footer flex items-center justify-between">
        <button
          onClick={resetNaarDefault}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Reset naar standaard
        </button>
        {opslaan && (
          <span className="text-xs text-gray-400">Opslaan...</span>
        )}
      </div>
    </div>
  );
}

// --- Number input ---

function NumberInput({
  waarde,
  onChange,
  accent,
}: {
  waarde: number;
  onChange: (v: number) => void;
  accent?: boolean;
}) {
  return (
    <input
      type="number"
      value={waarde}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v) && v >= 0 && v <= 50) onChange(v);
      }}
      className={`w-full text-center border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 ${
        accent
          ? "border-orange-300 bg-orange-50 font-semibold text-orange-700"
          : "border-gray-200 bg-white text-gray-700"
      }`}
      min={0}
      max={50}
    />
  );
}
