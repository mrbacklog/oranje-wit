interface KpiCard {
  label: string;
  waarde: string;
  detail?: string;
  trend?: number;
  trendLabel?: string;
}

interface KpiCardsProps {
  items: KpiCard[];
}

function TrendIndicator({ trend, label }: { trend: number; label?: string }) {
  const isPositief = trend > 0;
  const isNul = trend === 0;
  const kleur = isNul ? "text-gray-400" : isPositief ? "text-green-600" : "text-red-600";
  const pijl = isNul ? "→" : isPositief ? "▲" : "▼";
  const tekst = label ?? `${isPositief ? "+" : ""}${trend} vs vorig`;

  return (
    <p className={`mt-1 text-xs font-medium ${kleur}`}>
      {pijl} {tekst}
    </p>
  );
}

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{item.waarde}</p>
          {item.detail && <p className="mt-0.5 text-xs text-gray-400">{item.detail}</p>}
          {item.trend !== undefined && (
            <TrendIndicator trend={item.trend} label={item.trendLabel} />
          )}
        </div>
      ))}
    </div>
  );
}
