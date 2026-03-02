interface KpiCard {
  label: string;
  waarde: string;
  detail?: string;
}

interface KpiCardsProps {
  items: KpiCard[];
}

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{item.waarde}</p>
          {item.detail && <p className="mt-0.5 text-xs text-gray-400">{item.detail}</p>}
        </div>
      ))}
    </div>
  );
}
