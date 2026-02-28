import type { SpelerStatus } from "@oranje-wit/database";

const STATUS_CONFIG: Record<
  SpelerStatus,
  { kleur: string; label: string }
> = {
  BESCHIKBAAR: { kleur: "bg-green-500", label: "Beschikbaar" },
  TWIJFELT: { kleur: "bg-orange-500", label: "Twijfelt" },
  GAAT_STOPPEN: { kleur: "bg-red-500", label: "Gaat stoppen" },
  NIEUW_POTENTIEEL: { kleur: "bg-blue-400", label: "Nieuw (pot.)" },
  NIEUW_DEFINITIEF: { kleur: "bg-blue-600", label: "Nieuw (def.)" },
};

interface SpelerStatusBadgeProps {
  status: SpelerStatus;
}

export default function SpelerStatusBadge({ status }: SpelerStatusBadgeProps) {
  const { kleur, label } = STATUS_CONFIG[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
      <span className={`inline-block w-2 h-2 rounded-full ${kleur}`} />
      {label}
    </span>
  );
}
