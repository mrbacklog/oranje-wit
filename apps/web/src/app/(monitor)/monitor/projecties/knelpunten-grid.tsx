import { type Knelpunt, knelpuntKleuren } from "@/lib/monitor/utils/pijplijn";

export function KnelpuntenGrid({ knelpunten }: { knelpunten: Knelpunt[] }) {
  return (
    <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
      <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
        Waar investeren?
      </h3>
      <p className="text-text-muted mb-4 text-xs">
        Top knelpunten en kansen, gesorteerd op impact. Factor = historisch behoud, benchmark =
        jeugdmodel.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {knelpunten.map((kp) => (
          <div key={kp.titel} className={`rounded-lg p-4 ${knelpuntKleuren[kp.kleur]}`}>
            <div className="flex items-baseline justify-between">
              <h4 className="text-text-primary text-sm font-semibold">{kp.titel}</h4>
              <span className="text-text-muted text-xs">
                {kp.factor} (benchmark {kp.benchmark})
              </span>
            </div>
            <p className="text-text-secondary mt-1 text-xs">{kp.beschrijving}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
