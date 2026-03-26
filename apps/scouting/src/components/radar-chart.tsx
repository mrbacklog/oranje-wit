"use client";

/**
 * SVG radar chart met 6 assen voor spelerskaart-statistieken.
 * Gebruikt in de SpelersKaart achterkant en spelerprofiel.
 */

interface RadarChartProps {
  /** 6 scores (0-99), volgorde: SCH, AAN, PAS, VER, FYS, MEN */
  scores: number[];
  /** 6 labels, zelfde volgorde als scores */
  labels?: string[];
  /** Fill-kleur van het polygon */
  kleur?: string;
  /** Optioneel: tweede set scores voor vergelijking (stippellijn) */
  vergelijkScores?: number[];
  /** Kleur voor vergelijk-overlay */
  vergelijkKleur?: string;
  /** SVG grootte in pixels */
  size?: number;
  /** Of labels getoond worden */
  toonLabels?: boolean;
}

const DEFAULT_LABELS = ["SCH", "AAN", "PAS", "VER", "FYS", "MEN"];

export function RadarChart({
  scores,
  labels = DEFAULT_LABELS,
  kleur = "rgba(255, 107, 0, 0.7)",
  vergelijkScores,
  vergelijkKleur = "rgba(255, 255, 255, 0.4)",
  size = 140,
  toonLabels = true,
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;
  const labelOffset = size * 0.08;
  const aantalAssen = 6;
  const hoekStap = (2 * Math.PI) / aantalAssen;
  // Start bovenaan (-90 graden)
  const startHoek = -Math.PI / 2;

  function punt(hoekIndex: number, waarde: number): [number, number] {
    const hoek = startHoek + hoekIndex * hoekStap;
    const r = (waarde / 99) * maxRadius;
    return [cx + r * Math.cos(hoek), cy + r * Math.sin(hoek)];
  }

  function polygonPunten(waarden: number[]): string {
    return waarden.map((w, i) => punt(i, w).join(",")).join(" ");
  }

  // Grid ringen op 25%, 50%, 75%, 100%
  const gridNiveaus = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Radar chart met spelersstatistieken"
    >
      {/* Grid ringen */}
      {gridNiveaus.map((niveau) => (
        <polygon
          key={niveau}
          points={Array.from({ length: aantalAssen })
            .map((_, i) => {
              const hoek = startHoek + i * hoekStap;
              const r = niveau * maxRadius;
              return `${cx + r * Math.cos(hoek)},${cy + r * Math.sin(hoek)}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={0.5}
        />
      ))}

      {/* As-lijnen */}
      {Array.from({ length: aantalAssen }).map((_, i) => {
        const hoek = startHoek + i * hoekStap;
        const x2 = cx + maxRadius * Math.cos(hoek);
        const y2 = cy + maxRadius * Math.sin(hoek);
        return (
          <line
            key={`as-${i}`}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Vergelijk-overlay (stippellijn) */}
      {vergelijkScores && vergelijkScores.length === aantalAssen && (
        <polygon
          points={polygonPunten(vergelijkScores)}
          fill={vergelijkKleur.replace(/[\d.]+\)$/, "0.1)")}
          stroke={vergelijkKleur}
          strokeWidth={1}
          strokeDasharray="3 2"
        />
      )}

      {/* Hoofdpolygon */}
      <polygon
        points={polygonPunten(scores)}
        fill={kleur.replace(/[\d.]+\)$/, "0.25)")}
        stroke={kleur}
        strokeWidth={1.5}
      />

      {/* Datapunten */}
      {scores.map((score, i) => {
        const [x, y] = punt(i, score);
        return <circle key={`punt-${i}`} cx={x} cy={y} r={2} fill={kleur} />;
      })}

      {/* Labels */}
      {toonLabels &&
        labels.map((label, i) => {
          const hoek = startHoek + i * hoekStap;
          const lx = cx + (maxRadius + labelOffset) * Math.cos(hoek);
          const ly = cy + (maxRadius + labelOffset) * Math.sin(hoek);
          // Tekstanker gebaseerd op positie
          let textAnchor: "start" | "middle" | "end" = "middle";
          if (Math.cos(hoek) > 0.3) textAnchor = "start";
          else if (Math.cos(hoek) < -0.3) textAnchor = "end";

          return (
            <text
              key={`label-${i}`}
              x={lx}
              y={ly}
              textAnchor={textAnchor}
              dominantBaseline="central"
              fill="rgba(255, 255, 255, 0.6)"
              fontSize={8}
              fontWeight={600}
            >
              {label}
            </text>
          );
        })}
    </svg>
  );
}
