import { BENCHMARK_M, BENCHMARK_V } from "@/lib/monitor/utils/pijplijn";

export function DoorstroomTable() {
  return (
    <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
      <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
        Doorstroomkans naar U17
      </h3>
      <p className="text-text-muted mb-4 text-xs">
        Kans dat een individuele speler die instroomt bij deze leeftijd uiteindelijk U17 (leeftijd
        15) bereikt, op basis van retentiefactoren uit het jeugdmodel.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-sunken text-left">
              <th className="px-3 py-2 font-semibold">Instap-leeftijd</th>
              <th className="px-3 py-2 font-semibold">Band</th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--color-info-500)" }}>♂</span> kans
              </th>
              <th className="px-3 py-2 text-right font-semibold">
                <span style={{ color: "var(--knkv-rood-400)" }}>♀</span> kans
              </th>
              <th className="px-3 py-2 font-semibold">Interpretatie</th>
            </tr>
          </thead>
          <tbody>
            {[6, 7, 8, 9, 10, 11, 12].map((startLeeftijd) => {
              let kansM = 1;
              let kansV = 1;
              for (let l = startLeeftijd + 1; l <= 15; l++) {
                kansM *= BENCHMARK_M[l] ?? 0.9;
                kansV *= BENCHMARK_V[l] ?? 0.9;
              }
              const pctM = Math.round(kansM * 1000) / 10;
              const pctV = Math.round(kansV * 1000) / 10;
              const band = startLeeftijd <= 7 ? "Blauw" : startLeeftijd <= 9 ? "Groen" : "Geel";
              const gemKans = (pctM + pctV) / 2;
              return (
                <tr key={startLeeftijd} className="border-border-light border-t">
                  <td className="px-3 py-2 font-medium">{startLeeftijd} jaar</td>
                  <td className="px-3 py-2">{band}</td>
                  <td className="px-3 py-2 text-right">{pctM}%</td>
                  <td className="px-3 py-2 text-right">{pctV}%</td>
                  <td className="text-text-muted px-3 py-2 text-xs">
                    {gemKans >= 60
                      ? "Hoge doorstroom — efficiënte instroom"
                      : gemKans >= 40
                        ? `1 op ${Math.round(100 / gemKans)} haalt U17`
                        : `Slechts 1 op ${Math.round(100 / gemKans)} haalt U17`}
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
