const KLEUR_MAP: Record<string, string> = {
  blauw: "var(--knkv-blauw-500)",
  groen: "var(--knkv-groen-500)",
  geel: "var(--knkv-geel-500)",
  oranje: "var(--knkv-oranje-500)",
  rood: "var(--knkv-rood-500)",
};

const SIZE_MAP = {
  sm: { container: "h-8 w-8", text: "text-xs" },
  md: { container: "h-10 w-10", text: "text-sm" },
  lg: { container: "h-14 w-14", text: "text-lg" },
} as const;

interface SpelerAvatarProps {
  naam: string;
  achternaam: string;
  kleur?: string;
  fotoUrl?: string;
  size?: "sm" | "md" | "lg";
}

export function SpelerAvatar({ naam, achternaam, kleur, fotoUrl, size = "md" }: SpelerAvatarProps) {
  const { container, text } = SIZE_MAP[size];
  const bgColor = kleur ? (KLEUR_MAP[kleur] ?? "var(--ow-zwart-500)") : "var(--ow-zwart-500)";
  const initialen = `${naam[0] ?? ""}${achternaam[0] ?? ""}`.toUpperCase();

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={`${naam} ${achternaam}`}
        className={`${container} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${container} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      style={{ backgroundColor: bgColor }}
    >
      <span className={text}>{initialen}</span>
    </div>
  );
}
