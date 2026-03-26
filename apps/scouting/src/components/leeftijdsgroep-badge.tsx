/**
 * Leeftijdsgroep badge met KNKV kleur-gradienten
 * Toont de kleurnaam als pill met de juiste gradient uit design tokens
 */

type KnkvKleur = "paars" | "blauw" | "groen" | "geel" | "oranje" | "rood" | "senior";
type BadgeSize = "sm" | "md";

interface LeeftijdsgroepBadgeProps {
  kleur: KnkvKleur | string;
  leeftijd?: number;
  size?: BadgeSize;
}

const KLEUR_CONFIG: Record<string, { label: string; gradient: string; textClass: string }> = {
  paars: {
    label: "Paars",
    gradient: "linear-gradient(135deg, var(--knkv-paars-500), var(--knkv-paars-300))",
    textClass: "text-white",
  },
  blauw: {
    label: "Blauw",
    gradient: "linear-gradient(135deg, var(--knkv-blauw-500), var(--knkv-blauw-300))",
    textClass: "text-white",
  },
  groen: {
    label: "Groen",
    gradient: "linear-gradient(135deg, var(--knkv-groen-500), var(--knkv-groen-300))",
    textClass: "text-white",
  },
  geel: {
    label: "Geel",
    gradient: "linear-gradient(135deg, var(--knkv-geel-500), var(--knkv-geel-300))",
    textClass: "text-yellow-900",
  },
  oranje: {
    label: "Oranje",
    gradient: "linear-gradient(135deg, var(--knkv-oranje-500), var(--knkv-oranje-300))",
    textClass: "text-white",
  },
  rood: {
    label: "Rood",
    gradient: "linear-gradient(135deg, var(--knkv-rood-500), var(--knkv-rood-300))",
    textClass: "text-white",
  },
  senior: {
    label: "Senior",
    gradient: "linear-gradient(135deg, var(--ow-zwart-600), var(--ow-zwart-400))",
    textClass: "text-white",
  },
};

export function LeeftijdsgroepBadge({ kleur, leeftijd, size = "sm" }: LeeftijdsgroepBadgeProps) {
  const config = KLEUR_CONFIG[kleur] ?? KLEUR_CONFIG.senior;

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[10px] leading-4" : "px-3 py-1 text-xs leading-5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${config.textClass} ${sizeClasses}`}
      style={{ background: config.gradient }}
    >
      {config.label}
      {leeftijd !== undefined && <span className="opacity-80">({leeftijd})</span>}
    </span>
  );
}
