"use client";

import Link from "next/link";
import type { TeamSpeler, TeamSpelerTelling } from "@/lib/monitor/queries/teams";
import type { StafLid } from "@/lib/monitor/queries/staf";
import { formatNaam } from "@/lib/monitor/utils/format";
import { STAF_ROL_VOLGORDE } from "./teams-types";

// ---------------------------------------------------------------------------
// SpelerRij
// ---------------------------------------------------------------------------

function SpelerRij({ speler, qs }: { speler: TeamSpeler; qs: string }) {
  const naam = formatNaam(speler);
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <Link
        href={`/spelers/${speler.relCode}${qs}`}
        className="hover:text-ow-oranje text-text-primary"
      >
        {naam}
      </Link>
      <span className="text-text-muted text-xs">{speler.geboortejaar || "-"}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TeamTab (Spelers & Staf)
// ---------------------------------------------------------------------------

export function TeamTab({
  spelers,
  telling,
  staf,
  qs,
}: {
  spelers?: TeamSpeler[];
  telling?: TeamSpelerTelling;
  staf?: StafLid[];
  qs: string;
}) {
  const dames = spelers?.filter((s) => s.geslacht === "V") || [];
  const heren = spelers?.filter((s) => s.geslacht === "M") || [];

  const gesorteerdeStaf = staf
    ? [...staf].sort((a, b) => {
        const va = STAF_ROL_VOLGORDE[a.rol] ?? 99;
        const vb = STAF_ROL_VOLGORDE[b.rol] ?? 99;
        return va - vb || a.naam.localeCompare(b.naam, "nl");
      })
    : [];

  return (
    <div className="space-y-6">
      {telling && (
        <p className="text-text-secondary text-sm">
          {telling.totaal} spelers (
          <span className="text-blue-500">
            {"\u2642"} {telling.heren}
          </span>
          {" / "}
          <span className="text-pink-500">
            {"\u2640"} {telling.dames}
          </span>
          )
        </p>
      )}

      {!spelers || spelers.length === 0 ? (
        <p className="text-text-muted text-sm">Geen spelers gevonden voor dit team.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-pink-400 uppercase">
              {"\u2640"} Dames ({dames.length})
            </h4>
            <div className="space-y-0.5">
              {dames.map((s) => (
                <SpelerRij key={s.relCode} speler={s} qs={qs} />
              ))}
              {dames.length === 0 && <p className="text-text-muted text-xs">-</p>}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-blue-400 uppercase">
              {"\u2642"} Heren ({heren.length})
            </h4>
            <div className="space-y-0.5">
              {heren.map((s) => (
                <SpelerRij key={s.relCode} speler={s} qs={qs} />
              ))}
              {heren.length === 0 && <p className="text-text-muted text-xs">-</p>}
            </div>
          </div>
        </div>
      )}

      <div className="border-border-default border-t pt-4">
        <h4 className="text-text-muted mb-2 text-xs font-semibold tracking-wide uppercase">Staf</h4>
        {gesorteerdeStaf.length > 0 ? (
          <div className="space-y-1">
            {gesorteerdeStaf.map((s) => (
              <div key={s.stafCode} className="flex items-center justify-between text-sm">
                <span className="text-text-primary">{s.naam}</span>
                <span className="text-text-muted">{s.rol}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">Geen staf toegewezen.</p>
        )}
      </div>
    </div>
  );
}
