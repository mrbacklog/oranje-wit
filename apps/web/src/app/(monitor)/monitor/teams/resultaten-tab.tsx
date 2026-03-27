"use client";

import type { TeamUitslagen } from "@/lib/monitor/queries/uitslagen";
import { PERIODE_LABELS, PERIODE_VOLGORDE } from "./teams-types";

// ---------------------------------------------------------------------------
// ResultatenTab
// ---------------------------------------------------------------------------

export function ResultatenTab({ uitslagen }: { uitslagen?: TeamUitslagen }) {
  const perPeriode = new Map<string, NonNullable<typeof uitslagen>["poules"]>();
  if (uitslagen) {
    for (const poule of uitslagen.poules) {
      if (!perPeriode.has(poule.periode)) perPeriode.set(poule.periode, []);
      perPeriode.get(poule.periode)!.push(poule);
    }
  }

  if (!uitslagen || uitslagen.poules.length === 0) {
    return <p className="text-text-muted text-sm">Geen competitieresultaten beschikbaar.</p>;
  }

  return (
    <div className="space-y-4">
      {PERIODE_VOLGORDE.filter((p) => perPeriode.has(p)).map((periode) => (
        <div key={periode}>
          <h5 className="text-text-muted mb-2 text-xs font-medium tracking-wide uppercase">
            {PERIODE_LABELS[periode] || periode}
          </h5>
          {perPeriode.get(periode)!.map((poule) => (
            <div
              key={`${poule.pool}-${poule.niveau}`}
              className="border-border-default mb-3 overflow-hidden rounded-lg border"
            >
              <div className="border-border-default bg-surface-raised border-b px-4 py-2">
                <span className="text-text-primary text-sm font-medium">
                  {poule.niveau || poule.pool}
                </span>
                {poule.niveau && (
                  <span className="text-text-muted ml-2 text-xs">Poule {poule.pool}</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border-default text-text-secondary border-b text-xs">
                      <th className="w-8 px-2 py-1.5 text-center font-medium">#</th>
                      <th className="px-2 py-1.5 text-left font-medium">Team</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">GS</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">W</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">G</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">V</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">VR</th>
                      <th className="w-8 px-1.5 py-1.5 text-center font-medium">TG</th>
                      <th className="w-10 px-1.5 py-1.5 text-center font-semibold">Pt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poule.regels.map((r) => (
                      <tr
                        key={r.positie}
                        className={`border-border-default border-t ${
                          r.isOW
                            ? "bg-ow-oranje-bg text-ow-oranje font-semibold"
                            : "text-text-primary"
                        }`}
                      >
                        <td className="px-2 py-1.5 text-center">{r.positie}</td>
                        <td className="px-2 py-1.5">{r.teamNaam}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.gespeeld}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.gewonnen}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.gelijk}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.verloren}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.doelpuntenVoor}</td>
                        <td className="px-1.5 py-1.5 text-center">{r.doelpuntenTegen}</td>
                        <td className="px-1.5 py-1.5 text-center font-bold">{r.punten}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
