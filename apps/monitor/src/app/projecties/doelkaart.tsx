type Categorie = {
  readonly label: string;
  readonly leeftijden: string;
  readonly m: number;
  readonly v: number;
  readonly totaal: number;
};

export function Doelkaart({
  categorieen,
  doel,
}: {
  categorieen: readonly Categorie[];
  doel: number;
}) {
  const vulgraadPct = (totaal: number) => (doel > 0 ? Math.round((totaal / doel) * 100) : 0);

  return (
    <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold tracking-wide text-gray-700 uppercase">
        Stip op de horizon
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        Met 50 spelers per selectiecategorie in een evenwichtige verhouding jongens en meiden
        verzekeren we ons van selectieteams op hoofdklasseniveau.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {categorieen.map((cat) => {
          const pct = vulgraadPct(cat.totaal);
          return (
            <div key={cat.label} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  {cat.label} <span className="font-normal text-gray-400">({cat.leeftijden})</span>
                </span>
                <span className="text-sm font-semibold">{pct}%</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {cat.totaal}/{doel}
                </span>
                <span className="text-gray-300">|</span>
                <span>
                  {cat.m}
                  <span className="text-blue-500">♂</span> {cat.v}
                  <span className="text-pink-500">♀</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
