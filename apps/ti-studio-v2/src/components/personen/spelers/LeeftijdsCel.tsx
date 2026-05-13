"use client";

import type { LeeftijdCategorie } from "@/components/personen/types";

const CAT_KLEUREN: Record<LeeftijdCategorie, string> = {
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};

interface LeeftijdsCelProps {
  leeftijdscategorie: LeeftijdCategorie;
  korfbalLeeftijd: string;
}

export function LeeftijdsCel({ leeftijdscategorie, korfbalLeeftijd }: LeeftijdsCelProps) {
  const kleur = CAT_KLEUREN[leeftijdscategorie];
  // korfbalLeeftijd formaat: "14.8" of "14"
  const parts = korfbalLeeftijd.split(".");
  const geheel = parts[0] ?? "?";
  const decimaal = parts[1] ? `.${parts[1]}` : "";

  return (
    <div
      style={{
        height: 44,
        width: 54,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 3,
        lineHeight: 1,
        background: kleur,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: "#fff",
          fontSize: 16,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {geheel}
      </span>
      {decimaal && (
        <span
          style={{
            color: "rgba(255,255,255,.7)",
            fontSize: 9,
            fontWeight: 700,
            marginTop: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {decimaal} jr
        </span>
      )}
    </div>
  );
}
