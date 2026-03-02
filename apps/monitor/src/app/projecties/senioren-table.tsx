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
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
        Senioren-instroom — Projectie vanuit U19
      </h3>
      <p className="mb-4 text-xs text-gray-500">
        Verwacht aantal spelers dat per seizoen de seniorenleeftijd bereikt
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2 font-semibold">Seizoen</th>
              <th className="px-3 py-2 font-semibold">Geboortejaren</th>
              <th className="px-3 py-2 text-right font-semibold">
                <span className="text-blue-500">♂</span>
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                <span className="text-pink-500">♀</span>
              </th>
              <th className="px-3 py-2 text-right font-semibold">Totaal</th>
            </tr>
          </thead>
          <tbody>
            {senioren.map((row) => (
              <tr key={row.seizoen} className="border-t border-gray-100">
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
