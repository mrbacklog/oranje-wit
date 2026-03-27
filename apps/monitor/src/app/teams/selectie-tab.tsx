"use client";

import Link from "next/link";
import type { TeamSpeler, TeamSpelerTelling } from "@/lib/queries/teams";
import type { StafLid } from "@/lib/queries/staf";
import { formatNaam } from "@/lib/utils/format";
import { STAF_ROL_VOLGORDE } from "./teams-types";

// ---------------------------------------------------------------------------
// SelectieTab (gecombineerde spelers van onderliggende teams)
// ---------------------------------------------------------------------------

export function SelectieTab({
  selectieGroep,
  spelersPerTeam,
  tellingPerTeam,
  stafPerTeam,
  teamNamen,
  qs,
}: {
  selectieGroep: { naam: string; teamCodes: string[] };
  spelersPerTeam: Record<string, TeamSpeler[]>;
  tellingPerTeam: Record<string, TeamSpelerTelling>;
  stafPerTeam: Record<string, StafLid[]>;
  teamNamen: Record<string, string>;
  qs: string;
}) {
  // Combineer spelers en tellingen van alle onderliggende teams
  const alleSpelers: (TeamSpeler & { teamLabel: string })[] = [];
  let totaalHeren = 0;
  let totaalDames = 0;

  for (const code of selectieGroep.teamCodes) {
    const label = teamNamen[code] || code;
    const spelers = spelersPerTeam[code] || [];
    const telling = tellingPerTeam[code];
    if (telling) {
      totaalHeren += telling.heren;
      totaalDames += telling.dames;
    }
    for (const s of spelers) {
      alleSpelers.push({ ...s, teamLabel: label });
    }
  }

  const dames = alleSpelers.filter((s) => s.geslacht === "V");
  const heren = alleSpelers.filter((s) => s.geslacht === "M");
  const totaal = totaalHeren + totaalDames;

  // Combineer staf
  const stafSet = new Map<string, StafLid>();
  for (const code of selectieGroep.teamCodes) {
    for (const s of stafPerTeam[code] || []) {
      stafSet.set(s.stafCode, s);
    }
  }
  const gesorteerdeStaf = [...stafSet.values()].sort((a, b) => {
    const va = STAF_ROL_VOLGORDE[a.rol] ?? 99;
    const vb = STAF_ROL_VOLGORDE[b.rol] ?? 99;
    return va - vb || a.naam.localeCompare(b.naam, "nl");
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          {totaal} spelers (
          <span className="text-blue-500">
            {"\u2642"} {totaalHeren}
          </span>
          {" / "}
          <span className="text-pink-500">
            {"\u2640"} {totaalDames}
          </span>
          ) in {selectieGroep.teamCodes.length} teams
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {selectieGroep.teamCodes.map((c) => teamNamen[c] || c).join(" + ")}
        </p>
      </div>

      {alleSpelers.length === 0 ? (
        <p className="text-sm text-gray-400">Geen spelers gevonden.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-pink-400 uppercase">
              {"\u2640"} Dames ({dames.length})
            </h4>
            <div className="space-y-0.5">
              {dames.map((s) => (
                <div key={s.relCode} className="flex items-center justify-between py-0.5 text-sm">
                  <Link
                    href={`/spelers/${s.relCode}${qs}`}
                    className="hover:text-ow-oranje text-gray-900"
                  >
                    {formatNaam(s)}
                  </Link>
                  <span className="text-[11px] text-gray-400">{s.teamLabel}</span>
                </div>
              ))}
              {dames.length === 0 && <p className="text-xs text-gray-400">-</p>}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-blue-400 uppercase">
              {"\u2642"} Heren ({heren.length})
            </h4>
            <div className="space-y-0.5">
              {heren.map((s) => (
                <div key={s.relCode} className="flex items-center justify-between py-0.5 text-sm">
                  <Link
                    href={`/spelers/${s.relCode}${qs}`}
                    className="hover:text-ow-oranje text-gray-900"
                  >
                    {formatNaam(s)}
                  </Link>
                  <span className="text-[11px] text-gray-400">{s.teamLabel}</span>
                </div>
              ))}
              {heren.length === 0 && <p className="text-xs text-gray-400">-</p>}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">Staf</h4>
        {gesorteerdeStaf.length > 0 ? (
          <div className="space-y-1">
            {gesorteerdeStaf.map((s) => (
              <div key={s.stafCode} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{s.naam}</span>
                <span className="text-gray-400">{s.rol}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Geen staf toegewezen.</p>
        )}
      </div>
    </div>
  );
}
