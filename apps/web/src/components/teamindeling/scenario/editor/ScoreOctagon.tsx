"use client";

interface ScoreOctagonProps {
  rating: number | null | undefined;
  size?: number;
}

function ratingKleur(rating: number): { bg: string; color: string } {
  if (rating >= 8) return { bg: "rgba(34,197,94,0.15)", color: "#22C55E" };
  if (rating >= 6) return { bg: "rgba(96,165,250,0.15)", color: "#60A5FA" };
  if (rating >= 4) return { bg: "rgba(234,179,8,0.12)", color: "#EAB308" };
  return { bg: "rgba(239,68,68,0.12)", color: "#EF4444" };
}

// Clip-path octagon (8-hoek)
const OCTAGON_CLIP =
  "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)";

export default function ScoreOctagon({ rating, size = 20 }: ScoreOctagonProps) {
  if (rating == null) return null;

  const { bg, color } = ratingKleur(rating);
  const fontSize = Math.max(7, Math.round(size * 0.4));

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        clipPath: OCTAGON_CLIP,
        background: bg,
        color,
        fontSize,
        fontWeight: 700,
        flexShrink: 0,
        lineHeight: 1,
      }}
      title={`USS rating: ${rating}`}
    >
      {rating % 1 === 0 ? rating : rating.toFixed(1)}
    </span>
  );
}
