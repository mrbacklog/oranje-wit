import Link from "next/link";

type SeniorenRow = {
  seizoen: string;
  geboortejaar1: number;
  geboortejaar2: number;
  projM: number;
  projV: number;
  totaal: number;
};

export function SeniorenTable({ senioren }: { senioren: SeniorenRow[] }) {
  return (
    <div className="bg-surface-card rounded-xl p-6 shadow-sm">
      <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
        Senioren-instroom — Projectie vanuit U19
      </h3>
      <p className="text-text-muted mb-4 text-xs">
        Verwacht aantal spelers dat per seizoen de seniorenleeftijd bereikt
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-sunken text-left">
              <th className="px-3 py-2 font-semibold">Seizoen</th>
              <th className="px-3 py-2 font-semibold">Geboortejaren</th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--color-info-500)" }}>♂</span>
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--knkv-rood-400)" }}>♀</span>
              </th>
              <th className="px-3 py-2 text-right font-semibold">Totaal</th>
            </tr>
          </thead>
          <tbody>
            {senioren.map((row) => (
              <tr key={row.seizoen} className="border-border-light border-t">
                <td className="px-3 py-2 font-medium">{row.seizoen}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/samenstelling/${row.geboortejaar2}`}
                    className="text-ow-oranje hover:underline"
                  >
                    {row.geboortejaar2}
                  </Link>
                  {" + "}
                  <Link
                    href={`/samenstelling/${row.geboortejaar1}`}
                    className="text-ow-oranje hover:underline"
                  >
                    {row.geboortejaar1}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right">{row.projM}</td>
                <td className="px-3 py-2 text-right">{row.projV}</td>
                <td className="px-3 py-2 text-right font-semibold">{row.totaal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
