"use client";

import { useRouter } from "next/navigation";

type Props = {
  seizoen: string;
  seizoenen: string[];
};

export function SeizoenSelect({ seizoen, seizoenen }: Props) {
  const router = useRouter();

  function handleChange(value: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("seizoen", value);
    router.push(url.pathname + url.search);
  }

  return (
    <select
      value={seizoen}
      onChange={(e) => handleChange(e.target.value)}
      className="hover:text-ow-oranje text-text-secondary cursor-pointer border-none bg-transparent text-sm focus:outline-none"
    >
      {seizoenen.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
