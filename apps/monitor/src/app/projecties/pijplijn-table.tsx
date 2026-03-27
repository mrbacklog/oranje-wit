import Link from "next/link";

type PijplijnRow = {
  leeftijd: number;
  huidig_m: number;
  huidig_v: number;
  benodigd_m: number;
  benodigd_v: number;
  vulgraad_m: number;
  vulgraad_v: number;
  gap_m: number;
  gap_v: number;
  band: string;
};

export function PijplijnTable({
  perLeeftijd,
  startJaar,
  verwachteInstroom,
}: {
  perLeeftijd: PijplijnRow[];
  startJaar: number;
  verwachteInstroom: Record<number, number>;
}) {
  const stipKleur = (v: number) =>
    v >= 90 ? "text-signal-groen" : v >= 70 ? "text-signal-geel" : "text-signal-rood";

  return (
    <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
      <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
        Pijplijn per leeftijd
      </h3>
      <p className="text-text-muted mb-4 text-xs">
        Streef 12♂ + 13♀ per geboortejaar — groei-factoren op basis van laatste 5 seizoenen
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-sunken text-left">
              <th className="px-3 py-2 font-semibold">Leeftijd</th>
              <th className="px-3 py-2 font-semibold">Geb.jaar</th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--color-info-500)" }}>♂</span> huidig
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--color-info-500)" }}>♂</span> nodig
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--knkv-rood-400)" }}>♀</span> huidig
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--knkv-rood-400)" }}>♀</span> nodig
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--color-info-500)" }}>♂</span> %
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--knkv-rood-400)" }}>♀</span> %
              </th>
            </tr>
          </thead>
          <tbody>
            {perLeeftijd.map((row) => {
              const extra = verwachteInstroom[row.leeftijd] || 0;
              return (
                <tr key={row.leeftijd} className="border-border-light border-t">
                  <td className="px-3 py-2">{row.leeftijd}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/samenstelling/${startJaar - row.leeftijd}`}
                      className="text-ow-oranje hover:underline"
                    >
                      {startJaar - row.leeftijd}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.huidig_m}
                    {extra > 0 && <span className="text-text-muted ml-1 text-xs">(+{extra})</span>}
                    {row.gap_m < 0 && !extra && (
                      <span className="text-signal-rood ml-1 text-xs">({row.gap_m})</span>
                    )}
                  </td>
                  <td className="text-text-muted px-3 py-2 text-right">{row.benodigd_m}</td>
                  <td className="px-3 py-2 text-right">
                    {row.huidig_v}
                    {row.gap_v < 0 && !extra && (
                      <span className="text-signal-rood ml-1 text-xs">({row.gap_v})</span>
                    )}
                  </td>
                  <td className="text-text-muted px-3 py-2 text-right">{row.benodigd_v}</td>
                  <td className="px-3 py-2 text-right text-sm">
                    <span className={stipKleur(row.vulgraad_m)}>●</span>{" "}
                    <span className="font-semibold">{row.vulgraad_m}%</span>
                  </td>
                  <td className="px-3 py-2 text-right text-sm">
                    <span className={stipKleur(row.vulgraad_v)}>●</span>{" "}
                    <span className="font-semibold">{row.vulgraad_v}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
