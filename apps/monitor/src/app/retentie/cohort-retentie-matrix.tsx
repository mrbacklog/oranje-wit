interface CohortRetentieRij {
  instroomSeizoen: string;
  cohortGrootte: number;
  retentie: { jarenNaInstroom: number; actief: number; percentage: number }[];
}

interface CohortRetentieMatrixProps {
  data: CohortRetentieRij[];
  maxJaren?: number;
}

function retentieColor(pct: number): string {
  if (pct >= 75) {
    // Groen: hoe hoger hoe donkerder
    const intensity = Math.min((pct - 75) / 25, 1);
    const r = Math.round(220 - intensity * 100);
    const g = Math.round(255 - intensity * 30);
    const b = Math.round(220 - intensity * 100);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (pct >= 50) {
    // Geel/oranje
    const intensity = (75 - pct) / 25;
    const r = Math.round(255);
    const g = Math.round(240 - intensity * 50);
    const b = Math.round(200 - intensity * 120);
    return `rgb(${r}, ${g}, ${b})`;
  }
  // Rood: hoe lager hoe donkerder
  const intensity = Math.min((50 - pct) / 50, 1);
  const r = 255;
  const g = Math.round(200 - intensity * 150);
  const b = Math.round(200 - intensity * 150);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatSeizoen(seizoen: string): string {
  // "2024-2025" → "24/25"
  const parts = seizoen.split("-");
  if (parts.length === 2) {
    return `${parts[0].slice(2)}/${parts[1].slice(2)}`;
  }
  return seizoen;
}

export function CohortRetentieMatrix({ data, maxJaren = 8 }: CohortRetentieMatrixProps) {
  const jaren = Array.from({ length: maxJaren }, (_, i) => i + 1);

  // Meest recent bovenaan
  const sorted = [...data].sort((a, b) => b.instroomSeizoen.localeCompare(a.instroomSeizoen));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left font-semibold">
              Instroom
            </th>
            <th className="px-2 py-1 text-center font-semibold">Grootte</th>
            {jaren.map((j) => (
              <th key={j} className="px-2 py-1 text-center font-semibold whitespace-nowrap">
                Jaar {j}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((rij) => {
            const retentieMap = new Map(rij.retentie.map((r) => [r.jarenNaInstroom, r]));
            return (
              <tr key={rij.instroomSeizoen}>
                <td className="sticky left-0 z-10 bg-white px-2 py-1 font-medium">
                  {formatSeizoen(rij.instroomSeizoen)}
                </td>
                <td className="px-2 py-1 text-center font-medium">{rij.cohortGrootte}</td>
                {jaren.map((j) => {
                  const cel = retentieMap.get(j);
                  if (!cel) {
                    return (
                      <td key={j} className="px-2 py-1 text-center text-gray-300">
                        —
                      </td>
                    );
                  }
                  const pct = cel.percentage;
                  return (
                    <td
                      key={j}
                      className="px-2 py-1 text-center"
                      style={{
                        backgroundColor: retentieColor(pct),
                        color: pct < 30 ? "#fff" : "#333",
                      }}
                      title={`${cel.actief} van ${rij.cohortGrootte} (${pct.toFixed(0)}%)`}
                    >
                      {pct.toFixed(0)}%
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
