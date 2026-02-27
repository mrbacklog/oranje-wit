"use client";

import type { LedenStatistieken } from "@/app/blauwdruk/actions";

const KLEUR_ACCENT: Record<string, string> = {
  BLAUW: "bg-blue-500",
  GROEN: "bg-green-500",
  GEEL: "bg-yellow-500",
  ORANJE: "bg-orange-500",
  ROOD: "bg-red-500",
};

interface CategorieOverzichtProps {
  statistieken: LedenStatistieken;
}

export default function CategorieOverzicht({
  statistieken,
}: CategorieOverzichtProps) {
  const { perCategorie, senioren, retentie } = statistieken;

  return (
    <div className="space-y-4">
      {/* Categorie-kaarten grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {perCategorie.map((cat) => (
          <div key={cat.kleur} className="card overflow-hidden">
            <div className={`h-1.5 ${KLEUR_ACCENT[cat.kleur] ?? "bg-gray-500"}`} />
            <div className="card-body">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{cat.label}</h3>
                <span className="text-lg font-bold text-gray-700">
                  {cat.totaal}
                </span>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="badge-green">{cat.beschikbaar} beschikbaar</span>
                {cat.twijfelt > 0 && (
                  <span className="badge-orange">{cat.twijfelt} twijfelt</span>
                )}
                {cat.gaatStoppen > 0 && (
                  <span className="badge-red">{cat.gaatStoppen} stopt</span>
                )}
                {cat.nieuw > 0 && (
                  <span className="badge-blue">{cat.nieuw} nieuw</span>
                )}
              </div>

              {/* Gender + teams */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {cat.mannen}\u2642 {cat.vrouwen}\u2640
                </span>
                <span>
                  {cat.minTeams === cat.maxTeams
                    ? `${cat.minTeams} team${cat.minTeams !== 1 ? "s" : ""}`
                    : `${cat.minTeams}\u2013${cat.maxTeams} teams`}{" "}
                  mogelijk
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Senioren kaart */}
        <div className="card overflow-hidden">
          <div className="h-1.5 bg-gray-500" />
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Senioren</h3>
              <span className="text-lg font-bold text-gray-700">
                {senioren.totaal}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="badge-green">
                {senioren.beschikbaar} beschikbaar
              </span>
              {senioren.twijfelt > 0 && (
                <span className="badge-orange">{senioren.twijfelt} twijfelt</span>
              )}
              {senioren.gaatStoppen > 0 && (
                <span className="badge-red">{senioren.gaatStoppen} stopt</span>
              )}
              {senioren.nieuw > 0 && (
                <span className="badge-blue">{senioren.nieuw} nieuw</span>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {senioren.mannen}\u2642 {senioren.vrouwen}\u2640
            </div>
          </div>
        </div>
      </div>

      {/* Retentie samenvatting */}
      <div className="card">
        <div className="card-body">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Retentierisico overzicht
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="badge-red">{retentie.hoog} hoog risico</span>
            <span className="badge-orange">
              {retentie.gemiddeld} gemiddeld
            </span>
            <span className="badge-green">{retentie.laag} laag</span>
            {retentie.onbekend > 0 && (
              <span className="badge-gray">{retentie.onbekend} onbekend</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
