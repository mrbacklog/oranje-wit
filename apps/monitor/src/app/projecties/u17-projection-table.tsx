import Link from "next/link";
import { signaalKleur } from "@/lib/utils/pijplijn";

type U17Row = {
  seizoen: string;
  geboortejaar1eJaars: number;
  geboortejaar2eJaars: number;
  totaalM: number;
  totaalV: number;
  totaal: number;
  teams: number;
  gapM: number;
  gapV: number;
};

export function U17ProjectionTable({ u17 }: { u17: U17Row[] }) {
  return (
    <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
        U17-projectie — 5 seizoenen vooruit
      </h3>
      <p className="mb-4 text-xs text-gray-500">
        Als we niets veranderen, waar staan we over 5 jaar? Gebaseerd op huidige cohorten x
        historische groei.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2 font-semibold">Seizoen</th>
              <th className="px-3 py-2 font-semibold">1e-jaars</th>
              <th className="px-3 py-2 font-semibold">2e-jaars</th>
              <th className="px-3 py-2 text-right font-semibold">
                <span className="text-blue-500">♂</span>
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                <span className="text-pink-500">♀</span>
              </th>
              <th className="px-3 py-2 text-right font-semibold">Totaal</th>
              <th className="px-3 py-2 text-right font-semibold">Teams</th>
              <th className="px-3 py-2 font-semibold">Gap</th>
            </tr>
          </thead>
          <tbody>
            {u17.map((row) => {
              const pct = Math.round((row.totaal / 50) * 100);
              return (
                <tr key={row.seizoen} className={`border-t border-gray-100 ${signaalKleur(pct)}`}>
                  <td className="px-3 py-2 font-medium">{row.seizoen}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/samenstelling/${row.geboortejaar1eJaars}`}
                      className="text-ow-oranje hover:underline"
                    >
                      gj {row.geboortejaar1eJaars}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/samenstelling/${row.geboortejaar2eJaars}`}
                      className="text-ow-oranje hover:underline"
                    >
                      gj {row.geboortejaar2eJaars}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.totaalM}
                    {row.gapM < 0 && (
                      <span className="ml-1 text-xs text-red-600">({row.gapM})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.totaalV}
                    {row.gapV < 0 && (
                      <span className="ml-1 text-xs text-red-600">({row.gapV})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{row.totaal}</td>
                  <td className="px-3 py-2 text-right font-semibold">{row.teams}</td>
                  <td className="px-3 py-2">
                    {row.totaal >= 50 ? (
                      <span className="text-xs font-medium text-green-700">Op koers</span>
                    ) : (
                      <span className="text-xs font-medium text-red-700">
                        {row.totaal - 50} spelers
                      </span>
                    )}
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
