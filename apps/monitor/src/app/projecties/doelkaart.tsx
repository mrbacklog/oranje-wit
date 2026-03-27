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
    <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
      <h3 className="text-text-secondary text-sm font-semibold tracking-wide uppercase">
        Stip op de horizon
      </h3>
      <p className="text-text-secondary mt-2 text-sm">
        Met 50 spelers per selectiecategorie in een evenwichtige verhouding jongens en meiden
        verzekeren we ons van selectieteams op hoofdklasseniveau.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {categorieen.map((cat) => {
          const pct = vulgraadPct(cat.totaal);
          return (
            <div key={cat.label} className="border-border-light rounded-lg border p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-text-primary text-sm font-semibold">
                  {cat.label}{" "}
                  <span className="text-text-muted font-normal">({cat.leeftijden})</span>
                </span>
                <span className="text-sm font-semibold">{pct}%</span>
              </div>
              <div className="text-text-muted mt-1.5 flex items-center gap-2 text-xs">
                <span>
                  {cat.totaal}/{doel}
                </span>
                <span className="text-border-default">|</span>
                <span>
                  {cat.m}
                  <span style={{ color: "var(--color-info-500)" }}>♂</span> {cat.v}
                  <span style={{ color: "var(--knkv-rood-400)" }}>♀</span>
                </span>
              </div>
              <div className="bg-surface-sunken mt-1.5 h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 90 ? "bg-signal-groen" : pct >= 70 ? "bg-signal-geel" : "bg-signal-rood"
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
