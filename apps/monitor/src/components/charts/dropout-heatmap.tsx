interface DropoutData {
  leeftijd: number;
  seizoenen: Record<string, { uitstroom_pct: number }>;
}

interface DropoutHeatmapProps {
  data: DropoutData[];
  seizoenen: string[];
}

function dropoutColor(pct: number): string {
  if (pct === 0) return "#ffffff";
  // Wit (0%) → donkerrood (hoge uitstroom)
  const intensity = Math.min(pct / 50, 1); // 50% = maximaal rood
  const r = 255;
  const g = Math.round(255 - intensity * 200);
  const b = Math.round(255 - intensity * 200);
  return `rgb(${r}, ${g}, ${b})`;
}

export function DropoutHeatmap({ data, seizoenen }: DropoutHeatmapProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left font-semibold">
              Leeftijd
            </th>
            {seizoenen.map((sz) => (
              <th key={sz} className="px-2 py-1 text-center font-semibold whitespace-nowrap">
                {sz.slice(2, 4)}/{sz.slice(7, 9)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.leeftijd}>
              <td className="sticky left-0 z-10 bg-white px-2 py-1 font-medium">{row.leeftijd}</td>
              {seizoenen.map((sz) => {
                const val = row.seizoenen[sz]?.uitstroom_pct ?? 0;
                return (
                  <td
                    key={sz}
                    className="px-2 py-1 text-center"
                    style={{
                      backgroundColor: dropoutColor(val),
                      color: val > 30 ? "#fff" : "#333",
                    }}
                  >
                    {val > 0 ? `${val.toFixed(0)}%` : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
