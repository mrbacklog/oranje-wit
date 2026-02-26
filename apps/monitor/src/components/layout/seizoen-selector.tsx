"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SEIZOENEN = [
  "2025-2026", "2024-2025", "2023-2024", "2022-2023", "2021-2022",
  "2020-2021", "2019-2020", "2018-2019", "2017-2018", "2016-2017",
];

export function SeizoenSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const huidig = params.get("seizoen") || SEIZOENEN[0];

  return (
    <select
      value={huidig}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set("seizoen", e.target.value);
        router.push(url.pathname + url.search);
      }}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
    >
      {SEIZOENEN.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
