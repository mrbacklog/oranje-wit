"use client";

const BANDS = [
  {
    code: "blauw",
    label: "Blauw",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
    active: "bg-blue-500 text-white",
  },
  {
    code: "groen",
    label: "Groen",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    active: "bg-green-500 text-white",
  },
  {
    code: "geel",
    label: "Geel",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    active: "bg-yellow-500 text-white",
  },
  {
    code: "oranje",
    label: "Oranje",
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
    active: "bg-orange-500 text-white",
  },
  {
    code: "rood",
    label: "Rood",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    active: "bg-red-500 text-white",
  },
] as const;

interface BandTabsProps {
  activeBand: string;
  onSelect: (band: string) => void;
  counts?: Record<string, number>;
}

export function BandTabs({ activeBand, onSelect, counts }: BandTabsProps) {
  return (
    <div className="flex gap-2">
      {BANDS.map((band) => {
        const isActive = activeBand === band.code;
        return (
          <button
            key={band.code}
            onClick={() => onSelect(band.code)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive ? band.active : `${band.bg} ${band.text} hover:opacity-80`
            }`}
          >
            {band.label}
            {counts?.[band.code] !== undefined && (
              <span className={`ml-1.5 ${isActive ? "opacity-80" : "opacity-60"}`}>
                ({counts[band.code]})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { BANDS };
