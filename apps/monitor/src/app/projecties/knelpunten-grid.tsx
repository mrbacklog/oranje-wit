import { type Knelpunt, knelpuntKleuren } from "@/lib/utils/pijplijn";

export function KnelpuntenGrid({ knelpunten }: { knelpunten: Knelpunt[] }) {
  return (
    <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
        Waar investeren?
      </h3>
      <p className="mb-4 text-xs text-gray-500">
        Top knelpunten en kansen, gesorteerd op impact. Factor = historisch behoud, benchmark =
        jeugdmodel.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {knelpunten.map((kp) => (
          <div key={kp.titel} className={`rounded-lg p-4 ${knelpuntKleuren[kp.kleur]}`}>
            <div className="flex items-baseline justify-between">
              <h4 className="text-sm font-semibold text-gray-900">{kp.titel}</h4>
              <span className="text-xs text-gray-500">
                {kp.factor} (benchmark {kp.benchmark})
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-700">{kp.beschrijving}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
