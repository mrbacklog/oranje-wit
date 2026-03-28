"use client";

import type { CategorieStats } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import type {
  CategorieDefinitie,
  CategorieSettings,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/categorie-kaders";

// ============================================================
// Kleur-mapping voor top-bar
// ============================================================

const KLEUR_ACCENT: Record<string, string> = {
  SENIOREN_A: "bg-gray-600",
  SENIOREN_B: "bg-gray-400",
  U19: "bg-gray-500",
  U17: "bg-gray-400",
  U15: "bg-gray-300",
  ROOD: "bg-red-500",
  ORANJE: "bg-orange-500",
  GEEL: "bg-yellow-500",
  GROEN: "bg-green-500",
  BLAUW: "bg-blue-500",
  KANGOEROES: "bg-purple-400",
};

const A_CATEGORIE_SLEUTELS = new Set(["U15", "U17", "U19"]);

// ============================================================
// CategorieKaart
// ============================================================

interface CategorieKaartProps {
  definitie: CategorieDefinitie;
  stats: CategorieStats | null;
  settings: CategorieSettings;
  onOpenSettings: () => void;
}

export function CategorieKaart({
  definitie,
  stats,
  settings,
  onOpenSettings,
}: CategorieKaartProps) {
  const maxSpelers = Math.ceil(
    settings.optimaalSpelers * (1 + settings.maxAfwijkingPercentage / 100)
  );

  return (
    <div
      className={`card overflow-hidden ${A_CATEGORIE_SLEUTELS.has(definitie.sleutel) ? "border-2 border-dashed border-orange-400" : ""}`}
    >
      {/* Gekleurde top-bar */}
      <div className={`h-1.5 ${KLEUR_ACCENT[definitie.sleutel] ?? "bg-gray-500"}`} />
      <div className="card-body space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">{definitie.label}</h3>
            <p className="text-xs text-gray-500">
              {definitie.leeftijdRange} · {definitie.spelvorm}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats && <span className="text-lg font-bold text-gray-700">{stats.totaal}</span>}
            <button
              onClick={onOpenSettings}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Instellingen"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Leden-blok */}
        {stats && (
          <div className="flex flex-wrap gap-1.5">
            <span className="badge-green">{stats.beschikbaar} beschikbaar</span>
            {stats.twijfelt > 0 && <span className="badge-orange">{stats.twijfelt} twijfelt</span>}
            {stats.gaatStoppen > 0 && <span className="badge-red">{stats.gaatStoppen} stopt</span>}
            {stats.nieuwPotentieel > 0 && (
              <span className="badge-blue">{stats.nieuwPotentieel} potentieel</span>
            )}
            {stats.nieuwDefinitief > 0 && (
              <span className="badge-blue">{stats.nieuwDefinitief} definitief</span>
            )}
          </div>
        )}

        {/* Gender + teams */}
        {stats && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {stats.mannen}♂ {stats.vrouwen}♀
            </span>
            {stats.minTeams > 0 && (
              <span>
                {stats.minTeams === stats.maxTeams
                  ? `${stats.minTeams} team${stats.minTeams !== 1 ? "s" : ""}`
                  : `${stats.minTeams}–${stats.maxTeams} teams`}{" "}
                mogelijk
              </span>
            )}
          </div>
        )}

        {/* Key-stats als chips */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {(settings.minSpelers > 0 || settings.optimaalSpelers > 0) && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              {settings.minSpelers}–{maxSpelers} spelers
            </span>
          )}
          {settings.gemiddeldeLeeftijdKernMin != null &&
            settings.gemiddeldeLeeftijdKernMax != null && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-blue-700">
                kern {settings.gemiddeldeLeeftijdKernMin}–{settings.gemiddeldeLeeftijdKernMax}
              </span>
            )}
          {settings.gemiddeldeLeeftijdOverlapMin != null &&
            settings.gemiddeldeLeeftijdOverlapMax != null &&
            (settings.gemiddeldeLeeftijdOverlapMin !== settings.gemiddeldeLeeftijdKernMin ||
              settings.gemiddeldeLeeftijdOverlapMax !== settings.gemiddeldeLeeftijdKernMax) && (
              <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-500">
                overlap {settings.gemiddeldeLeeftijdOverlapMin}–
                {settings.gemiddeldeLeeftijdOverlapMax}
              </span>
            )}
          {settings.scorePromotieGrens != null && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              promotie &gt;{settings.scorePromotieGrens}
            </span>
          )}
          {settings.bandbreedteLeeftijd != null && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              max {settings.bandbreedteLeeftijd} jr spreiding
            </span>
          )}
          {settings.maxLeeftijd != null && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              max {settings.maxLeeftijd} jr
            </span>
          )}
          {settings.prioriteiten.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-orange-700">
              {settings.prioriteiten.join(" · ")}
            </span>
          )}
        </div>

        {/* Spelvorm footer (niet voor Kangoeroes) */}
        {definitie.type !== "kangoeroes" && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-gray-100 pt-2 text-xs text-gray-400">
            <span>Paal {settings.korfhoogte}m</span>
            <span>Bal {settings.balMaat}</span>
            <span>
              Wissels {settings.wisselsAantal == null ? "onbeperkt" : settings.wisselsAantal}
            </span>
            {settings.vakwisselType !== "nvt" && (
              <span>
                Vakwissel {settings.vakwisselType === "doelpunten" ? "na 2 goals" : "op tijd"}
              </span>
            )}
            <span>{settings.speeltijdMinuten > 0 ? `2×${settings.speeltijdMinuten}m` : "–"}</span>
          </div>
        )}
        {definitie.type === "kangoeroes" && (
          <div className="border-t border-gray-100 pt-2 text-xs text-gray-400 italic">
            Geen competitie — spelenderwijs kennismaken
          </div>
        )}
      </div>
    </div>
  );
}
