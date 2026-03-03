interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  detail?: { instroom: number; uitstroom: number };
  signal?: "groen" | "geel" | "rood";
}

export function KpiCard({ label, value, subtitle, trend, detail, signal }: KpiCardProps) {
  const signalColor =
    signal === "rood"
      ? "text-signal-rood"
      : signal === "geel"
        ? "text-signal-geel"
        : signal === "groen"
          ? "text-signal-groen"
          : "text-ow-oranje";

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${signalColor}`}>{value}</p>
      {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      {detail && (
        <div className="mt-1 flex gap-3 text-sm">
          <span className="text-signal-groen inline-flex items-center gap-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M7 2.5v9M7 2.5L3.5 6M7 2.5l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {detail.instroom} in
          </span>
          <span className="text-signal-rood inline-flex items-center gap-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M7 11.5v-9M7 11.5L3.5 8M7 11.5 10.5 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {detail.uitstroom} uit
          </span>
        </div>
      )}
      {trend && (
        <p
          className={`mt-1 text-sm ${trend.value >= 0 ? "text-signal-groen" : "text-signal-rood"}`}
        >
          {trend.value >= 0 ? "+" : ""}
          {trend.value} {trend.label}
        </p>
      )}
    </div>
  );
}
