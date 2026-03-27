// Benchmarks uit jeugdmodel.yaml — statisch, wijzigt zelden
export const BENCHMARK_M: Record<number, number> = {
  6: 0.75,
  7: 0.78,
  8: 0.95,
  9: 0.93,
  10: 0.97,
  11: 0.92,
  12: 0.92,
  13: 0.94,
  14: 0.97,
  15: 0.9,
  16: 0.89,
  17: 0.79,
};

export const BENCHMARK_V: Record<number, number> = {
  6: 0.87,
  7: 0.88,
  8: 0.96,
  9: 0.94,
  10: 0.91,
  11: 0.92,
  12: 0.9,
  13: 0.94,
  14: 0.93,
  15: 0.93,
  16: 0.85,
  17: 0.85,
};

export function signaalKleur(pct: number): string {
  if (pct >= 90) return "bg-signal-groen/10 text-signal-groen";
  if (pct >= 70) return "bg-signal-geel/10 text-signal-geel";
  return "bg-signal-rood/10 text-signal-rood";
}

export const knelpuntKleuren: Record<string, string> = {
  rood: "border-l-4 border-signal-rood bg-signal-rood/10",
  geel: "border-l-4 border-signal-geel bg-signal-geel/10",
  groen: "border-l-4 border-signal-groen bg-signal-groen/10",
};

export type Knelpunt = {
  titel: string;
  beschrijving: string;
  factor: string;
  benchmark: string;
  kleur: "rood" | "geel" | "groen";
  impact: number;
};

export function berekenKnelpunten(factoren: {
  M: Record<number, number>;
  V: Record<number, number>;
}): Knelpunt[] {
  const items: Knelpunt[] = [];

  for (let leeftijd = 7; leeftijd <= 17; leeftijd++) {
    for (const geslacht of ["M", "V"] as const) {
      const factor = factoren[geslacht][leeftijd];
      const benchmark = geslacht === "M" ? BENCHMARK_M[leeftijd] : BENCHMARK_V[leeftijd];
      if (factor === undefined) continue;

      const label = geslacht === "M" ? "jongens" : "meisjes";
      const bandNaam =
        leeftijd <= 7
          ? "Blauw"
          : leeftijd <= 9
            ? "Groen"
            : leeftijd <= 12
              ? "Geel"
              : leeftijd <= 15
                ? "Oranje"
                : "Rood";
      const verliesPct = Math.round((1 - Math.min(factor, 1.0)) * 100);
      const benchmarkPct = benchmark ? Math.round((1 - benchmark) * 100) : null;

      let beschrijving: string;
      let kleur: "rood" | "geel" | "groen";

      if (factor >= 1.05) {
        beschrijving = `Netto instroom: cohort groeit met ${Math.round((factor - 1) * 100)}%. Dit is de motor van de pijplijn.`;
        kleur = "groen";
      } else if (benchmark && factor < benchmark - 0.03) {
        beschrijving = `${verliesPct}% verlies — slechter dan benchmark (${benchmarkPct}%). Actie nodig.`;
        kleur = "rood";
      } else if (factor < 0.88) {
        beschrijving = `${verliesPct}% verlies per jaar. ${leeftijd >= 16 ? "Senior cliff: binding en doorstroompad cruciaal." : leeftijd <= 7 ? "Instap-uitval: focus op onboarding en plezier." : "Transitieleeftijd: extra aandacht nodig."}`;
        kleur = "geel";
      } else {
        beschrijving = `${verliesPct}% verlies — stabiel${benchmark ? `, rond benchmark (${benchmarkPct}%)` : ""}.`;
        kleur = "groen";
      }

      const impact = Math.max(0, (1 - Math.min(factor, 1.0)) * 100);

      items.push({
        titel: `${bandNaam} ${label} (${leeftijd} jr)`,
        beschrijving,
        factor:
          factor >= 1.0 ? `+${Math.round((factor - 1) * 100)}%` : `${Math.round(factor * 100)}%`,
        benchmark: benchmark ? `${Math.round(benchmark * 100)}%` : "-",
        kleur,
        impact,
      });
    }
  }

  const kleurVolgorde = { rood: 0, geel: 1, groen: 2 };
  items.sort((a, b) => kleurVolgorde[a.kleur] - kleurVolgorde[b.kleur] || b.impact - a.impact);

  return items.slice(0, 4);
}
