/** Hexagonale ranking badge — toont speler.rating als 3-cijfer getal */

interface RankingBadgeProps {
  rating: number | null;
  size?: "compact" | "detail";
}

const HEXAGON_CLIP = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

export default function RankingBadge({ rating, size = "compact" }: RankingBadgeProps) {
  if (rating == null) return null;

  if (size === "detail") {
    return (
      <span
        className="relative inline-flex items-center justify-center"
        title={`Rating: ${rating}`}
      >
        {/* Oranje border-laag */}
        <span
          className="absolute inset-0"
          style={{ clipPath: HEXAGON_CLIP, backgroundColor: "#f97316" }}
        />
        {/* Witte vulling */}
        <span
          className="relative inline-flex h-8 w-8 items-center justify-center"
          style={{ clipPath: HEXAGON_CLIP, backgroundColor: "#ffffff", margin: "1.5px" }}
        >
          <span className="text-xs font-bold text-gray-700 tabular-nums">{rating}</span>
        </span>
      </span>
    );
  }

  // Compact: voor in spelersrij
  return (
    <span className="relative inline-flex items-center justify-center" title={`Rating: ${rating}`}>
      <span
        className="absolute inset-0"
        style={{ clipPath: HEXAGON_CLIP, backgroundColor: "#f97316" }}
      />
      <span
        className="relative inline-flex h-4 w-4 items-center justify-center"
        style={{ clipPath: HEXAGON_CLIP, backgroundColor: "#ffffff", margin: "1px" }}
      >
        <span className="text-[6px] leading-none font-bold text-gray-700 tabular-nums">
          {rating}
        </span>
      </span>
    </span>
  );
}
