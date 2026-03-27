"use client";

/**
 * Achterkant van de SpelersKaart.
 *
 * Toont radar chart, bio-sectie, laatste rapporten en trend-indicator.
 * De gradient is een donkere variant van de voorkant.
 */

import { RadarChart } from "./radar-chart";

export interface AchterkantData {
  bio: {
    positie?: string;
    korfbalLeeftijd?: number;
    spelerstype?: string;
  };
  rapporten: Array<{
    score: number;
    datum: string;
    scout?: string;
  }>;
  trend?: number;
  radarScores?: number[];
}

interface KaartAchterkantProps {
  roepnaam: string;
  achternaam: string;
  data: AchterkantData;
  leeftijd: number;
  /** Gradient CSS voor achtergrond (donkere variant) */
  gradientStyle: string;
  /** Border-kleur van tier */
  tierBorderColor: string;
  /** Grootte voor radar chart */
  radarSize?: number;
}

/** Donkere gradient-kleuren per leeftijd */
const DARK_GRADIENTS: Record<number, string> = {
  5: "linear-gradient(135deg, #581C87, #3730A3)",
  6: "linear-gradient(135deg, #1E40AF, #1E3A8A)",
  7: "linear-gradient(135deg, #1E40AF, #166534)",
  8: "linear-gradient(135deg, #166534, #14532D)",
  9: "linear-gradient(135deg, #166534, #3F6212)",
  10: "linear-gradient(135deg, #713F12, #3F6212)",
  11: "linear-gradient(135deg, #713F12, #854D0E)",
  12: "linear-gradient(135deg, #713F12, #7C2D12)",
  13: "linear-gradient(135deg, #7C2D12, #713F12)",
  14: "linear-gradient(135deg, #7C2D12, #9A3412)",
  15: "linear-gradient(135deg, #7C2D12, #7F1D1D)",
  16: "linear-gradient(135deg, #7F1D1D, #7C2D12)",
  17: "linear-gradient(135deg, #7F1D1D, #991B1B)",
  18: "linear-gradient(135deg, #450A0A, #3B0000)",
};

export function getDarkGradient(leeftijd: number): string {
  const clamped = Math.max(5, Math.min(18, leeftijd));
  return DARK_GRADIENTS[clamped] ?? DARK_GRADIENTS[14];
}

function TrendIndicator({ trend }: { trend: number }) {
  if (trend > 0) {
    return (
      <span className="flex items-center gap-1 font-extrabold text-green-400">
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
          <path d="M6 2L10 7H2L6 2Z" />
        </svg>
        +{trend}
      </span>
    );
  }
  if (trend < 0) {
    return (
      <span className="flex items-center gap-1 font-extrabold text-red-400">
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
          <path d="M6 10L2 5H10L6 10Z" />
        </svg>
        {trend}
      </span>
    );
  }
  return <span className="flex items-center gap-1 font-extrabold text-white/50">&#8212; 0</span>;
}

export function KaartAchterkant({
  roepnaam,
  achternaam,
  data,
  leeftijd,
  gradientStyle,
  tierBorderColor,
  radarSize = 120,
}: KaartAchterkantProps) {
  const laatsteRapporten = data.rapporten.slice(0, 3);
  const radarScores = data.radarScores ?? [0, 0, 0, 0, 0, 0];

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl"
      style={{
        border: `2px solid ${tierBorderColor}`,
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      }}
    >
      {/* Achtergrond gradient (donker) */}
      <div className="absolute inset-0 opacity-95" style={{ background: gradientStyle }} />

      {/* Noise overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div className="relative z-[2] flex h-full flex-col overflow-hidden p-3">
        {/* Header */}
        <div className="mb-2 border-b border-white/15 pb-2 text-center">
          <div className="text-[8px] font-bold tracking-[2px] text-white/50 uppercase">
            c.k.v. Oranje Wit
          </div>
          <div className="mt-0.5 text-sm font-extrabold tracking-wide text-white uppercase">
            {roepnaam} {achternaam}
          </div>
        </div>

        {/* Radar chart */}
        <div className="my-1 flex shrink-0 justify-center">
          <RadarChart scores={radarScores} size={radarSize} toonLabels />
        </div>

        {/* Bio sectie */}
        <div className="border-t border-b border-white/10 py-1.5">
          {data.bio.positie && <BioRij label="Positie" waarde={data.bio.positie} />}
          {data.bio.korfbalLeeftijd != null && (
            <BioRij label="KL" waarde={`${data.bio.korfbalLeeftijd} jaar`} />
          )}
          {data.bio.spelerstype && <BioRij label="Type" waarde={data.bio.spelerstype} />}
          {!data.bio.positie && !data.bio.spelerstype && (
            <BioRij label="Leeftijd" waarde={`${leeftijd} jaar`} />
          )}
        </div>

        {/* Rapporten */}
        {laatsteRapporten.length > 0 && (
          <div className="mt-1.5 min-h-0 flex-1">
            <div className="mb-1 text-[8px] font-bold tracking-[1px] text-white/40 uppercase">
              Laatste rapporten
            </div>
            {laatsteRapporten.map((rapport, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 border-b border-white/5 py-1 text-[11px]"
              >
                <span className="min-w-[24px] font-extrabold text-white">{rapport.score}</span>
                <span className="flex-1 truncate text-[10px] text-white/50">
                  {rapport.scout ?? formatDatum(rapport.datum)}
                </span>
                <div className="bg-surface-card/10 h-[3px] w-10 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, rapport.score)}%`,
                      background: scoreKleur(rapport.score),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trend footer */}
        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-1.5 text-[10px]">
          <div className="text-white/40">Trend</div>
          <TrendIndicator trend={data.trend ?? 0} />
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute right-2 bottom-1 z-[5] text-[6px] font-semibold text-white/10 uppercase">
        OW Scout
      </div>
    </div>
  );
}

function BioRij({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-[11px]">
      <span className="font-semibold text-white/50">{label}</span>
      <span className="font-bold text-white">{waarde}</span>
    </div>
  );
}

function scoreKleur(score: number): string {
  if (score >= 80) return "#4ADE80";
  if (score >= 60) return "#FACC15";
  if (score >= 40) return "#FB923C";
  return "#F87171";
}

function formatDatum(datum: string): string {
  try {
    return new Date(datum).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return datum;
  }
}
