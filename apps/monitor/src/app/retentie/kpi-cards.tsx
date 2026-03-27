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
  const kleur = isNul ? "text-text-muted" : isPositief ? "text-signal-groen" : "text-signal-rood";
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
        <div key={item.label} className="bg-surface-card rounded-xl p-4 shadow-sm">
          <p className="text-text-muted text-xs font-medium tracking-wide uppercase">
            {item.label}
          </p>
          <p className="text-text-primary mt-1 text-2xl font-bold">{item.waarde}</p>
          {item.detail && <p className="text-text-muted mt-0.5 text-xs">{item.detail}</p>}
          {item.trend !== undefined && (
            <TrendIndicator trend={item.trend} label={item.trendLabel} />
          )}
        </div>
      ))}
    </div>
  );
}
