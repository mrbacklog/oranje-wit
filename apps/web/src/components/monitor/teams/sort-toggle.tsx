"use client";

import { useRouter } from "next/navigation";

type SortMode = "categorie" | "volgorde";

type Props = {
  seizoen: string;
  sort: SortMode;
};

const OPTIES: { value: SortMode; label: string; title: string }[] = [
  { value: "categorie", label: "A / B", title: "Groepeer op A- en B-categorie" },
  {
    value: "volgorde",
    label: "1 · 2 · 3",
    title: "Groepeer op teamvolgorde (senioren, U-teams, jeugd)",
  },
];

export function SortToggle({ seizoen, sort }: Props) {
  const router = useRouter();

  const navigate = (value: SortMode) => {
    const params = new URLSearchParams({ seizoen });
    if (value !== "categorie") params.set("sort", value);
    router.push(`/monitor/teams?${params}`);
  };

  return (
    <div className="border-border-default flex items-center gap-1 rounded-lg border p-0.5">
      {OPTIES.map((optie) => (
        <button
          key={optie.value}
          title={optie.title}
          onClick={() => navigate(optie.value)}
          className={[
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
            sort === optie.value
              ? "bg-surface-raised text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          ].join(" ")}
        >
          {optie.label}
        </button>
      ))}
    </div>
  );
}
