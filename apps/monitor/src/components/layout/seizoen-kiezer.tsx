"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SEIZOENEN } from "@/lib/utils/seizoen";

export function SeizoenKiezer() {
  const router = useRouter();
  const params = useSearchParams();
  const huidig = params.get("seizoen") || SEIZOENEN[0];

  return (
    <select
      aria-label="Seizoen"
      value={huidig}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set("seizoen", e.target.value);
        router.push(url.pathname + url.search);
      }}
      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
    >
      {SEIZOENEN.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
