"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const BASE = "/monitor/signalering";

const CHIPS: {
  id: "alles" | "werving" | "retentie" | "pijplijn";
  label: string;
  href: string;
}[] = [
  { id: "alles", label: "Alles", href: BASE },
  { id: "werving", label: "Werving", href: `${BASE}?filter=werving` },
  { id: "retentie", label: "Retentie", href: `${BASE}?filter=retentie` },
  { id: "pijplijn", label: "Pijplijn", href: `${BASE}?filter=pijplijn` },
];

const chipBase =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all cursor-pointer";

export function SignaleringFilter() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("filter")?.toLowerCase();
  const active: "alles" | "werving" | "retentie" | "pijplijn" =
    raw === "werving" || raw === "retentie" || raw === "pijplijn" ? raw : "alles";

  return (
    <div role="group" aria-label="Filter op thema" className="mb-6 flex flex-wrap gap-2">
      {CHIPS.map((chip) => {
        const isActive = chip.id === active;
        return (
          <Link
            key={chip.id}
            href={chip.href}
            scroll={false}
            prefetch
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? `${chipBase} bg-ow-oranje text-white`
                : `${chipBase} bg-surface-card border-border-default text-text-primary hover:border-ow-oranje hover:text-ow-oranje border`
            }
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}
