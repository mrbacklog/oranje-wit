"use client";

interface NotitieBadgeProps {
  count: number;
  heeftBlockers?: boolean;
}

export default function NotitieBadge({ count, heeftBlockers }: NotitieBadgeProps) {
  if (count === 0) return null;

  const kleur = heeftBlockers ? "bg-red-500" : "bg-orange-500";

  return (
    <span
      className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full ${kleur} px-1 text-[10px] font-bold text-white`}
    >
      {count}
    </span>
  );
}
